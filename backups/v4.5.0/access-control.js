(function () {
    // 1. Password Protection Logic
    const PROTECTION_KEY = 'site_unlocked';
    const CORRECT_PASS = 'floresce'; // Simple password

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
            if (input.value.toLowerCase() === CORRECT_PASS) {
                localStorage.setItem(PROTECTION_KEY, 'true');
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

    // Check if unlocked
    if (localStorage.getItem(PROTECTION_KEY) !== 'true') {
        // Run immediately if body exists, else wait for load
        if (document.body) {
            showOverlay();
        } else {
            window.addEventListener('DOMContentLoaded', showOverlay);
        }
    }
})();
