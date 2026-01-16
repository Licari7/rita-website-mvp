const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { defineSecret } = require('firebase-functions/params');

admin.initializeApp();

// --- SECRETS CONFIGURATION ---
// These will be managed via Google Secret Manager
// Run: firebase functions:secrets:set STRIPE_SECRET
// Run: firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
// Run: firebase functions:secrets:set GMAIL_EMAIL
// Run: firebase functions:secrets:set GMAIL_PASSWORD

const stripeSecret = defineSecret('STRIPE_SECRET');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const gmailEmail = defineSecret('GMAIL_EMAIL');
const gmailPassword = defineSecret('GMAIL_PASSWORD');

const ADMIN_EMAIL = "floresceterapias@gmail.com"; // Admin notifications go here
const APP_NAME = 'Floresce Terapias';

async function sendEmail(to, subject, html) {
    // mailTransport needs to be created inside the function or within a runWith context
    // because it depends on secret values.
    const mailTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: gmailEmail.value(),
            pass: gmailPassword.value(),
        },
    });

    const mailOptions = {
        from: `${APP_NAME} <${gmailEmail.value()}>`,
        to: to,
        subject: subject,
        html: html
    };

    try {
        await mailTransport.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// --- TRIGGERS ---

// 1. New User Created -> Notify Admin
exports.onUserCreate = functions.runWith({ secrets: [gmailEmail, gmailPassword] })
    .firestore.document('users/{email}').onCreate(async (snap, context) => {
        const newUser = snap.data();
        const email = context.params.email;

        const subject = `Novo Membro Registado: ${newUser.name || email}`;
        const html = `
        <h2>Novo Registo Pendente</h2>
        <p><strong>Nome:</strong> ${newUser.name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Status:</strong> ${newUser.status}</p>
        <p>Aceda ao <a href="https://sechoverfloresce.pt/dashboard.html">Painel de Admin</a> para gerir.</p>
    `;

        // Send to Admin (Hotmail) using the Sender (Gmail)
        await sendEmail(ADMIN_EMAIL, subject, html);
    });

// 2. User Updated -> Check for Approval
exports.onUserUpdate = functions.runWith({ secrets: [gmailEmail, gmailPassword] })
    .firestore.document('users/{email}').onUpdate(async (change, context) => {
        const newData = change.after.data();
        const oldData = change.before.data();
        const email = context.params.email;

        // Check if status changed to 'active' manually or via payment
        if (oldData.status !== 'active' && newData.status === 'active') {
            const subject = `Bem-vindo(a) à Família Floresce! 🌸`;
            const html = `
            <h2>Olá ${newData.name},</h2>
            <p>A tua conta foi ativada com sucesso!</p>
            <p>Agora já podes aceder a todas as meditações e conteúdos exclusivos.</p>
            <p><a href="https://sechoverfloresce.pt/dashboard.html">Entrar na Área de Membros</a></p>
            <br>
            <p>Com amor,<br>Rita Barata</p>
        `;
            await sendEmail(email, subject, html);
        }
    });

// --- STRIPE LOGIC ---

// 3. Create Checkout Session
exports.createCheckoutSession = functions.runWith({ secrets: [stripeSecret] })
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
        }

        // Initialize Stripe inside the function to use the secret
        const stripe = require('stripe')(stripeSecret.value());

        const priceId = data.priceId;
        const successUrl = data.successUrl;
        const cancelUrl = data.cancelUrl;

        if (!priceId) {
            throw new functions.https.HttpsError('invalid-argument', 'Price ID is required.');
        }

        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'subscription',
                customer_email: context.auth.token.email,
                line_items: [{ price: priceId, quantity: 1 }],
                metadata: { firebaseAuthUid: context.auth.uid },
                success_url: successUrl,
                cancel_url: cancelUrl,
            });

            return { sessionId: session.id };
        } catch (error) {
            console.error("Stripe Error:", error);
            throw new functions.https.HttpsError('internal', error.message);
        }
    });

// 4. Stripe Webhook (Enhanced)
exports.stripeWebhook = functions.runWith({ secrets: [stripeSecret, stripeWebhookSecret] }) // Inject ALL needed secrets
    .https.onRequest(async (req, res) => {

        // Init Stripe inside
        const stripe = require('stripe')(stripeSecret.value());

        const signature = req.headers['stripe-signature'];
        const endpointSecret = stripeWebhookSecret.value(); // Use the secret value

        let event;

        try {
            if (endpointSecret) {
                event = stripe.webhooks.constructEvent(req.rawBody, signature, endpointSecret);
            } else {
                // Fallback for local testing without webhook secret
                event = req.body;
            }
        } catch (err) {
            console.error(`Webhook signature verification failed.`, err.message);
            return res.sendStatus(400);
        }

        try {
            if (event.type === 'checkout.session.completed') {
                const session = event.data.object;
                const email = session.customer_email;

                if (email) {
                    await admin.firestore().collection('users').doc(email).update({
                        status: 'active',
                        subscriptionId: session.subscription,
                        stripeCustomerId: session.customer,
                        lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: new Date()
                    });
                    console.log(`✅ Activated user: ${email}`);
                }
            }
            else if (event.type === 'invoice.payment_failed') {
                const session = event.data.object;
                const email = session.customer_email;

                if (email) {
                    await admin.firestore().collection('users').doc(email).update({
                        status: 'inactive', // Downgrade status
                        paymentError: 'Falha no pagamento',
                        updatedAt: new Date()
                    });
                    console.log(`❌ Payment failed for: ${email}`);

                    // Optional: Send email via sendEmail function
                    // If sendEmail is called here, gmailEmail and gmailPassword secrets must be included in runWith
                    // await sendEmail(email, "Falha no Pagamento - Floresce Terapias", "<p>O teu pagamento falhou. Por favor atualiza os teus dados para manter o acesso.</p>");
                }
            }
            else if (event.type === 'customer.subscription.deleted') {
                const session = event.data.object;
                // Note: subscription object might not have email directly, need to fetch customer or rely on finding user by stripeCustomerId if we saved it
                // Ideally we query by stripeCustomerId
                const customerId = session.customer;

                const snapshot = await admin.firestore().collection('users').where('stripeCustomerId', '==', customerId).get();
                if (!snapshot.empty) {
                    snapshot.forEach(async doc => {
                        await doc.ref.update({
                            status: 'inactive',
                            subscriptionStatus: 'cancelled',
                            updatedAt: new Date()
                        });
                        console.log(`🚫 Subscription cancelled for: ${doc.id}`);
                    });
                }
            }
        } catch (err) {
            console.error("Error processing webhook:", err);
        }

        res.send();
    });

