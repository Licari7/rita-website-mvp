document.addEventListener('DOMContentLoaded', () => {

    // Header Scroll Effect
    // Header Scroll Effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        const updateNavbar = () => {
            if (window.scrollY > 50) {
                navbar.style.background = '#e1d7ce'; // Beige Solid
                navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            } else {
                navbar.style.background = '#e1d7ce'; // Beige Solid (Always Beige to support Green Text)
                navbar.style.boxShadow = 'none';
            }
        };

        window.addEventListener('scroll', updateNavbar);
        updateNavbar(); // Run on load
    }

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const closeMenu = document.querySelector('.close-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-menu a');

    if (menuToggle && closeMenu && mobileMenu) {
        function toggleMenu() {
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        }

        menuToggle.addEventListener('click', toggleMenu);
        closeMenu.addEventListener('click', toggleMenu);

        // Close menu when clicking a link
        mobileLinks.forEach(link => {
            link.addEventListener('click', toggleMenu);
        });
    }

    // Contact Form Handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // In a real scenario, this would send data to a backend
            const formData = new FormData(contactForm);
            const name = formData.get('name');
            const type = formData.get('type');

            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;

            btn.textContent = 'Enviando...';
            btn.disabled = true;

            // Simulate API call
            setTimeout(() => {
                alert(`Obrigado, ${name}! Recebemos a sua mensagem sobre "${type}". Entraremos em contacto brevemente.`);
                contactForm.reset();
                btn.textContent = originalText;
                btn.disabled = false;
            }, 1000);
        });
    }

    // Smooth Scrolling for Anchor Links (if native smooth scroll isn't enough/supported properly)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });



    // --- Marketing Popup (Free Trial) ---
    if (!localStorage.getItem('isMember') && !document.querySelector('.auth-page') && !localStorage.getItem('seenPopup')) {
        setTimeout(showPopup, 3000);
    }

    function showPopup() {
        const popupHTML = `
            <div class="popup-overlay fade-in">
                <div class="popup-card">
                    <button class="close-popup">&times;</button>
                    <div class="popup-visual">
                        <div class="aura-circle popup-aura"></div>
                    </div>
                    <div class="popup-content text-center">
                        <h2>Oferta Especial ✨</h2>
                        <p>Experimenta a nossa <strong>Área de Membros</strong> gratuitamente durante 7 dias.</p>
                        <p class="popup-tiny">Acesso ilimitado a todas as meditações.</p>
                        <a href="login.html?trial=true" class="btn btn-primary full-width">Começar Gratuito</a>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', popupHTML);

        const closeBtn = document.querySelector('.close-popup');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const overlay = document.querySelector('.popup-overlay');
                if (overlay) overlay.remove();
                localStorage.setItem('seenPopup', 'true');
            });
        }
    }


    // --- Logout Logic ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Clear Local Session
            localStorage.removeItem('isMember');
            localStorage.removeItem('userEmail');

            // Firebase Logout (if active)
            if (window.auth && typeof window.auth.signOut === 'function') {
                window.auth.signOut().then(() => {
                    console.log("Firebase Signed Out");
                    window.location.href = 'index.html';
                }).catch((error) => {
                    console.error("Sign Out Error", error);
                    window.location.href = 'index.html'; // Redirect anyway
                });
            } else {
                // Offline/Mock Logout
                console.log("Local/Mock Signed Out");
                window.location.href = 'index.html';
            }
        });
    }


    // --- Dynamic Events Loader ---
    async function loadPublicEvents() {
        const container = document.getElementById('dynamic-events-container');
        if (!container) return; // Not on homepage

        // Wait for Firebase
        if (!window.db) {
            setTimeout(loadPublicEvents, 500);
            return;
        }

        try {
            const now = new Date().toISOString().split('T')[0]; // Simple YYYY-MM-DD for comparison
            // Use window.db (Compat)
            const snapshot = await window.db.collection('events')
                .where('date', '>=', now) // Only future events
                .orderBy('date', 'asc')
                .limit(4) // Show max 4 next events
                .get();

            if (snapshot.empty) {
                container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--color-text-light);">Não existem eventos agendados para breve.</p>';
                return;
            }

            let html = '';
            const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

            snapshot.forEach(doc => {
                const data = doc.data();
                const eventDate = new Date(data.date);
                const day = eventDate.getDate();
                const month = months[eventDate.getMonth()];

                let imageHtml = '';
                if (data.image_url) {
                    // Full image display: Auto height to show everything (no cropping)
                    imageHtml = `<img src="${data.image_url}" alt="${data.title}" style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 15px; display: block;">`;
                }

                html += `
                <article class="event-card">
                    ${imageHtml ? imageHtml : ''}
                    <div style="display: flex; gap: 15px;">
                        <div class="event-date">
                            <span class="day">${day}</span>
                            <span class="month">${month}</span>
                        </div>
                        <div class="event-details">
                            <h3>${data.title}</h3>
                            <p class="event-meta"><i data-lucide="map-pin" style="width:14px;"></i> ${data.location} &bull; ${data.time}</p>
                            <p>${data.description}</p>
                            <a href="${data.registration_link || '#contact'}" class="link-arrow">Inscrever <i data-lucide="arrow-right"></i></a>
                        </div>
                    </div>
                </article>
                `;
            });

            container.innerHTML = html;
            if (window.lucide) lucide.createIcons();

        } catch (error) {
            console.error("Error loading public events:", error);
            container.innerHTML = '<p>Erro ao carregar eventos.</p>';
        }
    }

    loadPublicEvents();

    // --- Dynamic Services Loader ---
    async function loadPublicServices() {
        const container = document.getElementById('dynamic-services-container');
        if (!container) return;

        if (!window.db) {
            setTimeout(loadPublicServices, 500);
            return;
        }

        try {
            const snapshot = await window.db.collection('services')
                .orderBy('order', 'asc')
                .get();

            if (snapshot.empty) {
                container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Serviços indisponíveis de momento.</p>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();

                // Style Logic
                let visualStyle = '';
                let auraHtml = '<div class="aura-circle"></div>'; // Default

                if (data.headerImage) {
                    // Custom Image (URL or Base64) -> Override background
                    // using 'top center' to prevent cropping the head/top of the image
                    visualStyle = `background-image: url('${data.headerImage}'); background-size: cover; background-position: top center;`;
                    auraHtml = ''; // No aura circle if image is active
                }

                // Benefits List
                let benefitsHtml = '';
                if (data.benefits && Array.isArray(data.benefits) && data.benefits.length > 0) {
                    benefitsHtml = '<ul>';
                    benefitsHtml += data.benefits.map(b => {
                        let iconName = 'check';
                        const lower = b.toLowerCase();
                        if (lower.includes('presencial')) iconName = 'map-pin';
                        else if (lower.includes('online')) iconName = 'video';
                        else if (lower.includes('distância')) iconName = 'wifi';
                        else if (lower.includes('apoio')) iconName = 'users';
                        else if (lower.includes('recursos')) iconName = 'book-open';
                        else if (lower.includes('mentoria')) iconName = 'infinity';
                        else if (lower.includes('desbloqueio')) iconName = 'waves';
                        else if (lower.includes('activação') || lower.includes('ativação')) iconName = 'sparkles';
                        else if (lower.includes('estado alterado')) iconName = 'moon';
                        return `<li><i data-lucide="${iconName}"></i> ${b}</li>`;
                    }).join('');
                    benefitsHtml += '</ul>';
                }

                html += `
                <div class="services-card">
                    <div class="service-visual ${data.styleClass || ''}" style="${visualStyle}">
                        ${auraHtml}
                    </div>
                    <div class="service-content">
                        <h3>${data.title}</h3>
                        <p>${data.description}</p>
                        <div class="service-benefits">
                            ${data.benefits && data.benefits.length > 0 ? '<h4>Benefícios/Modalidades</h4>' : ''}
                            ${benefitsHtml}
                        </div>
                        <a href="${(data.link && data.link.startsWith('http')) ? data.link : `service.html?id=${doc.id}`}" class="btn btn-primary full-width text-center" ${(data.link && data.link.startsWith('http')) ? 'target="_blank"' : ''}>SABER MAIS</a>
                    </div>
                </div>
                `;
            });

            container.innerHTML = html;
            if (window.lucide) lucide.createIcons();

        } catch (error) {
            console.error("Error loading services:", error);
            container.innerHTML = '<p>Erro ao carregar serviços.</p>';
        }
    }

    loadPublicServices();

    // --- Dynamic Testimonials Loader ---
    async function loadPublicTestimonials() {
        const container = document.getElementById('dynamic-testimonials-container');
        if (!container) return;

        // Wait for Firebase
        if (!window.db) {
            setTimeout(loadPublicTestimonials, 500);
            return;
        }

        try {
            const snapshot = await window.db.collection('testimonials')
                .orderBy('created_at', 'desc')
                .limit(3)
                .get();

            if (snapshot.empty) {
                container.innerHTML = '<p style="text-align: center; color: var(--color-text-light);">Ainda sem testemunhos.</p>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                html += `
                <div class="review-card">
                    <p>"${data.text}"</p>
                    <span class="author">- ${data.name}${data.role ? `, <span style="font-size:0.9em; opacity:0.8">${data.role}</span>` : ''}</span>
                </div>
                `;
            });

            container.innerHTML = html;

        } catch (error) {
            console.error("Error loading testimonials:", error);
            container.innerHTML = '<p>Erro ao carregar testemunhos.</p>';
        }
    }

    loadPublicTestimonials();

    // --- Dynamic Site Content Loader (Home/About) ---
    async function loadSiteContent() {
        if (!window.db) {
            setTimeout(loadSiteContent, 500);
            return;
        }

        try {
            const doc = await window.db.collection('site_content').doc('main').get();
            if (doc.exists) {
                const data = doc.data();

                // Home
                if (data.home) {
                    if (data.home.title) document.getElementById('hero-title-display').textContent = data.home.title;
                    if (data.home.subtitle) document.getElementById('hero-subtitle-display').textContent = data.home.subtitle;
                    if (data.home.cta_text) document.getElementById('hero-cta-display').textContent = data.home.cta_text;
                }

                // About
                if (data.about) {
                    if (data.about.title) document.getElementById('about-title-display').textContent = data.about.title;

                    if (data.about.text) {
                        // Allow basic HTML
                        document.getElementById('about-text-display').innerHTML = data.about.text.replace(/\n/g, '<br>');
                    }

                    if (data.about.image_url) {
                        const imgContainer = document.getElementById('about-image-display');
                        // Override placeholder styles
                        imgContainer.innerHTML = `<img src="${data.about.image_url}" alt="Sobre Mim" style="width:100%; height:auto; border-radius:8px; box-shadow: var(--shadow-md);">`;
                        imgContainer.style.background = 'transparent';
                        imgContainer.style.border = 'none';
                        imgContainer.style.display = 'block';
                        imgContainer.style.width = '100%';
                        imgContainer.style.height = 'auto';
                    }
                }
            }
        } catch (error) {
            console.error("Error loading site content:", error);
        }
    }

    loadSiteContent();

});
