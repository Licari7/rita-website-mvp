document.addEventListener('DOMContentLoaded', () => {
    // 1. Unified Sidebar HTML Structure
    const sidebarHTML = `
        <button class="close-menu" aria-label="Fechar Menu">
            <i data-lucide="x"></i>
        </button>
        <!-- Logo Text Removed as requested -->
        <span class="mobile-logo" style="visibility: hidden;">Floresce</span> 

        <ul class="mobile-links-list">
            <li><a href="index.html">Início</a></li>
            <li><a href="index.html#about">Sobre</a></li>
            <li><a href="index.html#services">Serviços</a></li>
            <li><a href="index.html#events">Eventos</a></li>
            <li><a href="booking.html">Agendar</a></li>
            <li><a href="dashboard.html" class="mobile-member-link">Área de Membros</a></li>
        </ul>

        <div class="mobile-socials">
            <a href="https://instagram.com/floresceterapias" target="_blank" rel="noopener noreferrer"
                aria-label="Instagram"><i data-lucide="instagram"></i></a>
            <a href="https://chat.whatsapp.com/BpCgpanA5Wx1VEGrmo4Wwt" target="_blank" rel="noopener noreferrer"
                aria-label="WhatsApp"><i data-lucide="message-circle"></i></a>
        </div>
    `;

    // 2. Inject or Populate Sidebar
    let mobileMenu = document.querySelector('.mobile-menu');
    if (!mobileMenu) {
        mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        document.body.appendChild(mobileMenu);
    }
    mobileMenu.innerHTML = sidebarHTML;

    // 3. Re-initialize Icons (important for injected HTML)
    if (window.lucide) window.lucide.createIcons();

    // 4. Toggle Logic
    const menuToggle = document.querySelector('.menu-toggle');
    const closeMenu = mobileMenu.querySelector('.close-menu');

    if (menuToggle) {
        // Remove old listeners to be safe (cloning trick)
        const newToggle = menuToggle.cloneNode(true);
        menuToggle.parentNode.replaceChild(newToggle, menuToggle);

        newToggle.addEventListener('click', () => {
            mobileMenu.classList.add('active');
        });
    }

    if (closeMenu) {
        closeMenu.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    }

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    });

    // Close upon mouse leave (Requested by User)
    // Close upon mouse leave (Requested by User)
    mobileMenu.addEventListener('mouseleave', () => {
        mobileMenu.classList.remove('active');
    });

    // Close when clicking outside (Mobile/Touch Support)
    document.addEventListener('click', (e) => {
        const isClickInsideMenu = mobileMenu.contains(e.target);
        const isClickOnToggle = e.target.closest('.menu-toggle'); // handle icon clicks

        if (mobileMenu.classList.contains('active') && !isClickInsideMenu && !isClickOnToggle) {
            mobileMenu.classList.remove('active');
        }
    });

    // 5. Active Link Highlighting
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const mobileLinks = mobileMenu.querySelectorAll('.mobile-links-list a');

    mobileLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Simple check: exact match or hash match if on same page
        if (href === currentPage || (currentPage === 'index.html' && href.startsWith('index.html'))) {
            // Optional: add active class if you have styling for it
            // link.style.color = 'var(--color-primary)';
        }
    });

    // 6. Logout Button & Admin Link Logic
    const updateAuthVisibility = () => {
        const userName = localStorage.getItem('userName');
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        const socials = mobileMenu.querySelector('.mobile-socials');
        const list = mobileMenu.querySelector('.mobile-links-list');

        // Manage Admin Link - Removed specific sidebar link in favor of Dashboard center button
        let adminLink = document.getElementById('mobile-admin-link');
        if (adminLink) adminLink.parentElement.remove();

        const existingBtn = document.getElementById('mobile-logout-btn');
        const existingDivider = document.getElementById('mobile-logout-divider');

        if (userName && userName !== 'Visitante') {
            if (!existingBtn && socials) {
                // ... (Existing logout creation logic) ...
                // Divider
                const divider = document.createElement('div');
                divider.id = 'mobile-logout-divider';
                divider.style.cssText = 'height: 1px; background: #eee; margin: 15px;';

                // Logout Button
                const btn = document.createElement('a');
                btn.href = '#';
                btn.id = 'mobile-logout-btn';
                btn.style.cssText = 'color: #e57373 !important; display: flex !important; align-items: center; gap: 8px; font-weight: 500; padding: 10px 0; margin-top: 10px; cursor: pointer;';
                btn.innerHTML = '<i data-lucide="log-out" style="width: 18px;"></i> Sair da Conta';

                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('Tem a certeza que deseja sair?')) {
                        localStorage.clear();
                        if (window.auth) window.auth.signOut();
                        window.location.href = 'index.html';
                    }
                });

                // Insert BEFORE socials
                socials.parentNode.insertBefore(divider, socials);
                socials.parentNode.insertBefore(btn, socials);

                if (window.lucide) window.lucide.createIcons();
            }
        } else {
            if (existingBtn) existingBtn.remove();
            if (existingDivider) existingDivider.remove();
        }
    };

    // Expose for external updates (e.g. from init-firebase.js)
    window.updateSidebarAuth = updateAuthVisibility;

    // Run immediately and listen for changes
    updateAuthVisibility();
    window.addEventListener('storage', (e) => {
        if (e.key === 'userName' || e.key === 'isMember' || e.key === 'isAdmin') updateAuthVisibility();
    });
});
