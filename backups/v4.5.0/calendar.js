document.addEventListener('DOMContentLoaded', () => {
    console.log("CALENDAR SCRIPT STARTED");

    // Auto-fill for Members
    const localEmail = localStorage.getItem('userEmail');
    const localName = localStorage.getItem('userName');

    if (localEmail) {
        const nameInput = document.getElementById('bookingName');
        const emailInput = document.getElementById('bookingEmail');
        if (nameInput) nameInput.value = localName || '';
        if (emailInput) emailInput.value = localEmail || '';
    }

    const form = document.getElementById('whatsappBookingForm');
    if (form) {
        console.log("Form found, attaching listener");
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log("Form submitted");

            // Feedback UI
            const btn = form.querySelector('button[type="submit"]');
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<span style="display:flex; align-items:center; gap:8px;">A abrir WhatsApp... <div class="spinner" style="width:16px; height:16px; border:2px solid #5c5540; border-top-color:transparent; border-radius:50%; animation: spin 1s linear infinite;"></div></span>';
            btn.disabled = true;

            // Add spinner keyframes if not exists
            if (!document.getElementById('spinner-style')) {
                const style = document.createElement('style');
                style.id = 'spinner-style';
                style.innerHTML = '@keyframes spin { to { transform: rotate(360deg); } }';
                document.head.appendChild(style);
            }

            const name = document.getElementById('bookingName').value;
            const email = document.getElementById('bookingEmail').value;
            const subject = document.getElementById('bookingSubject').value;
            const type = document.getElementById('bookingType').value;

            // Constuct WhatsApp Message
            // Number: 913 515 406
            const phoneNumber = "351913515406";

            let msgLines = [
                "Olá Rita!",
                "",
                "Gostaria de fazer um agendamento/pedido:",
                "",
                `Nome - ${name}`,
                `Email - ${email}`,
                `Sessão - ${type}`
            ];

            if (subject && subject.trim() !== "") {
                msgLines.push(`Assunto - ${subject}`);
            }

            msgLines.push("");
            msgLines.push("Aguardo contacto. Obrigado/a!");

            const message = encodeURIComponent(msgLines.join("\n"));
            const url = `https://wa.me/${phoneNumber}?text=${message}`;
            console.log("Opening URL:", url);

            // Open WhatsApp with delay for UI update
            setTimeout(() => {
                window.open(url, '_blank');

                // Reset button
                setTimeout(() => {
                    btn.innerHTML = originalContent;
                    btn.disabled = false;
                    // Re-init icons for the button icon
                    if (window.lucide) lucide.createIcons();
                }, 2000);
            }, 1000);
        });

        // Auto-Grow Textarea
        const subjectInput = document.getElementById('bookingSubject');
        if (subjectInput) {
            subjectInput.style.overflow = 'hidden';
            subjectInput.addEventListener('input', function () {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        }
    } else {
        console.error("Form element 'whatsappBookingForm' not found!");
    }

    // Initialize Icons
    if (window.lucide) lucide.createIcons();
});
