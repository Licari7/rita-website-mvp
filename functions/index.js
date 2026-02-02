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
        // PERIGO: O envio automático foi desativado temporariamente para evitar bloqueio da conta Google.
        // await mailTransport.sendMail(mailOptions);
        console.log(`[DISABLED] Would send email to ${to} with subject: ${subject}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// --- TRIGGERS ---

// 1. New User Created -> Notify Admin & Welcome User
exports.onUserCreate = functions.runWith({ secrets: [gmailEmail, gmailPassword] })
    .firestore.document('users/{email}').onCreate(async (snap, context) => {
        const newUser = snap.data();
        const email = context.params.email;

        const subject = `Novo Membro na Comunidade: ${newUser.name || email}`;
        const html = `
        <h2>Novo Registo</h2>
        <p><strong>Nome:</strong> ${newUser.name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Status:</strong> ${newUser.status}</p>
        <p>Aceda ao <a href="https://sechoverfloresce.pt/dashboard.html">Painel de Admin</a> para gerir.</p>
    `;

        // Send to Admin
        await sendEmail(ADMIN_EMAIL, subject, html);

        // Send to User (Welcome)
        const userSubject = `Bem-vindo(a) à Família Floresce 🌿`;
        const userHtml = `
            <h2>Olá ${newUser.name},</h2>
            <p>A tua conta foi criada com sucesso!</p>
            <p>Agora tens acesso ilimitado a todas as meditações e conteúdos exclusivos na Área de Membros.</p>
            <p><a href="https://sechoverfloresce.pt/dashboard.html">Aceder à Área de Membros</a></p>
            <br>
            <p>Junta-te também à nossa <a href="https://chat.whatsapp.com/BpCgpanA5Wx1VEGrmo4Wwt">Comunidade no WhatsApp</a> para ficares a par de todas as novidades.</p>
            <br>
            <p>Com amor,<br>Rita Barata</p>
        `;
        await sendEmail(email, userSubject, userHtml);
    });

// 2. User Updated -> Notify User of Status Change (e.g. Block/Unblock)
exports.onUserUpdate = functions.runWith({ secrets: [gmailEmail, gmailPassword] })
    .firestore.document('users/{email}').onUpdate(async (change, context) => {
        const newData = change.after.data();
        const oldData = change.before.data();
        const email = context.params.email;

        // Notify if status changes to active (e.g. unblocked)
        if (oldData.status !== 'active' && newData.status === 'active') {
            const subject = `A tua conta foi ativada! 🌸`;
            const html = `
            <h2>Olá ${newData.name},</h2>
            <p>A tua conta Floresce Terapias está ativa novamente.</p>
            <p><a href="https://sechoverfloresce.pt/dashboard.html">Entrar na Área de Membros</a></p>
            <br>
            <p>Com amor,<br>Rita Barata</p>
        `;
            await sendEmail(email, subject, html);
        }
    });

