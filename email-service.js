// EmailJS Integration
// Documentation: https://www.emailjs.com/docs/tutorial/browser-only/

// CONFIGURATION - REPLACE WITH REAL KEYS
const EMAILJS_CONFIG = {
    PUBLIC_KEY: "YOUR_PUBLIC_KEY_HERE",    // Get from EmailJS Account > Account > General
    SERVICE_ID: "YOUR_SERVICE_ID_HERE",    // Get from Email Services tab
    TEMPLATE_WELCOME: "YOUR_TEMPLATE_ID",  // Template for New User (Welcome)
    TEMPLATE_ADMIN: "YOUR_TEMPLATE_ID",    // Template for Admin (New Member Alert)
    TEMPLATE_APPROVED: "YOUR_TEMPLATE_ID"  // Template for User (Account Approved)
};

(function () {
    // Inject EmailJS Script if not present
    if (!window.emailjs) {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
        script.onload = () => {
            console.log("EmailJS Loaded");
            emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
        };
        document.head.appendChild(script);
    } else {
        emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    }
})();

/**
 * Send Email Helper
 * @param {string} templateId - The template ID to use
 * @param {object} params - The parameters to replace in the template (e.g., { name: 'Rita', email: '...' })
 */
async function sendEmail(templateId, params) {
    if (!window.emailjs) {
        console.error("EmailJS not loaded yet.");
        return;
    }

    try {
        const response = await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, templateId, params);
        console.log("Email Sent Successfully!", response.status, response.text);
        return true;
    } catch (error) {
        console.error("Failed to send email:", error);
        alert("Erro ao enviar email de notificação. (" + error.text + ")");
        return false;
    }
}

// Global Export
window.sendEmail = sendEmail;
window.EMAILJS_CONFIG = EMAILJS_CONFIG;
