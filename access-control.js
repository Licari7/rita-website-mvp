// 1. Password Protection Logic (Integrated with Firebase)
(function () {
    const PROTECTION_KEY = 'site_unlocked';
    let CORRECT_PASS = 'floresce'; // Fallback password
    let isActive = false;

    function showOverlay() {
        // Create Overlay
        const overlay = document.createElement('div');
        overlay.id = 'access-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = '#fdfbf7'; // Match site theme
        overlay.style.zIndex = '99999';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.fontFamily = '"Montserrat", sans-serif';
        overlay.style.textAlign = 'center';

        // Content
        overlay.innerHTML = `
            <h2 style="font-family: 'Cormorant Garamond', serif; color: #5a4b41; margin-bottom: 2rem;">Site em Construção</h2>
            <p style="margin-bottom: 1rem; color: #8c7e72;">Esta página é privada. Introduza a senha para entrar.</p>
            <input type="password" id="access-pass" placeholder="Senha" style="padding: 10px; border: 1px solid #d6cbb8; border-radius: 4px; margin-bottom: 1rem;">
            <button id="access-btn" style="padding: 10px 20px; background-color: #a69076; color: white; border: none; border-radius: 4px; cursor: pointer;">Entrar</button>
            <p id="access-error" style="color: red; display: none; margin-top: 10px; font-size: 0.9rem;">Senha incorreta.</p>
        `;

        document.body.appendChild(overlay);

        // Logic
        const btn = overlay.querySelector('#access-btn');
        const input = overlay.querySelector('#access-pass');
        const errorMsg = overlay.querySelector('#access-error');

        function checkPass() {
            if (input.value.toLowerCase() === CORRECT_PASS.toLowerCase()) {
                // Use session storage so they don't get locked out immediately if they reload, 
                // but we also want it to persist nicely. Let's keep local storage for now but you 
                // might consider sessionStorage.
                sessionStorage.setItem(PROTECTION_KEY, 'true'); // Changed to session storage for better security during maintenance
                overlay.remove();
            } else {
                errorMsg.style.display = 'block';
                input.value = '';
            }
        }

        btn.addEventListener('click', checkPass);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkPass();
        });
    }

    async function checkMaintenanceMode() {
        // Wait until firebase is initialized and window.db is available
        if (typeof window.db === 'undefined') {
            setTimeout(checkMaintenanceMode, 100);
            return;
        }

        try {
            const docSnap = await window.db.collection('config').doc('maintenance').get();
            if (docSnap.exists) {
                const data = docSnap.data();
                isActive = data.isActive || false;
                if (data.password) {
                    CORRECT_PASS = data.password;
                }
            }
        } catch (error) {
            console.error("Error fetching maintenance config:", error);
            // Default to false if we can't fetch to avoid locking out accidentally on error
            isActive = false;
        }

        // If active and not unlocked in this session
        if (isActive && sessionStorage.getItem(PROTECTION_KEY) !== 'true') {
            if (document.body) {
                showOverlay();
            } else {
                window.addEventListener('DOMContentLoaded', showOverlay);
            }
        }
    }

    // Start checking when DOM is ready (to ensure firebase scripts start loading)
    window.addEventListener('DOMContentLoaded', checkMaintenanceMode);

})();
