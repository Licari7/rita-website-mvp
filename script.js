document.addEventListener('DOMContentLoaded', () => {

    // Header Scroll Effect
    // Header Scroll Effect
    // Header Scroll & Style Effect (Dynamic)
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        const applyHeaderStyles = () => {
            const savedHeader = localStorage.getItem('site_header');
            const settings = savedHeader ? JSON.parse(savedHeader) : {
                transparent: false,
                bg_color: '#e1d7ce', // Default Beige
                text_color: '#6e664c', // Default Greenish
                font_size: 16,
                padding: 20
            };

            // Apply Static Props
            document.documentElement.style.setProperty('--nav-bg', settings.bg_color);
            document.documentElement.style.setProperty('--nav-text', settings.text_color);

            // Apply Font & Padding
            navbar.style.fontSize = settings.font_size + 'px';
            navbar.style.padding = settings.padding + 'px 0';

            // Scroll Logic
            const updateScroll = () => {
                if (settings.transparent && window.scrollY < 50) {
                    // Transparent State
                    navbar.style.background = 'transparent';
                    navbar.style.boxShadow = 'none';
                    navbar.style.color = settings.text_color; // Keep text color? Or white? User wanted control.
                } else {
                    // Opaque State
                    navbar.style.background = settings.bg_color;
                    navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                    navbar.style.color = settings.text_color;
                }
            };

            window.removeEventListener('scroll', window.headerScrollHandler); // Clean old
            window.headerScrollHandler = updateScroll; // Save ref
            window.addEventListener('scroll', updateScroll);
            updateScroll(); // Run immediately
        };

        applyHeaderStyles();

        // Listen for live updates from CMS (same window)
        window.addEventListener('storage', (e) => {
            if (e.key === 'site_header') applyHeaderStyles();
        });

        // Global Welcome Message (Added Logic)
        const welcomeMsg = document.getElementById('header-welcome-msg');
        if (welcomeMsg) {
            const userName = localStorage.getItem('userName');
            const isMember = localStorage.getItem('isMember'); // Optional check
            if (userName && userName !== 'Visitante') {
                welcomeMsg.textContent = `Olá, ${userName}`;
            } else {
                welcomeMsg.style.display = 'none'; // Hide if not logged in
            }
        }
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

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (mobileMenu.classList.contains('active') &&
                !mobileMenu.contains(e.target) &&
                !menuToggle.contains(e.target)) {
                toggleMenu();
            }
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

                console.log(`Rendering Service: ${data.title} (${doc.id})`);
                const serviceLink = (data.link && data.link.startsWith('http')) ? data.link : `service.html#${doc.id}`;
                console.log("Generated Link:", serviceLink);

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
                        <a href="${serviceLink}" class="btn btn-primary full-width text-center" ${serviceLink.startsWith('http') ? 'target="_blank"' : ''}>SABER MAIS</a>
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
    // --- Dynamic Testimonials Loader (Infinite Loop) ---
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
                .limit(10) // Show more for carousel
                .get();

            if (snapshot.empty) {
                container.innerHTML = '<p style="text-align: center; color: var(--color-text-light); width:100%;">Ainda sem testemunhos.</p>';
                return;
            }

            let cardsHtml = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                cardsHtml += `
                <div class="review-card">
                    <p>"${data.text}"</p>
                    <span class="author">- ${data.name}${data.role ? `, <span style="font-size:0.9em; opacity:0.8">${data.role}</span>` : ''}</span>
                </div>
                `;
            });

            // Duplicate content 2-3 times to ensure smooth loop
            // The CSS animation translates -50%, so we need at least 2 sets.
            // If few items, duplicate more.
            const duplicationFactor = snapshot.size < 5 ? 4 : 2;

            let finalHtml = '';
            for (let i = 0; i < duplicationFactor; i++) {
                finalHtml += cardsHtml;
            }

            container.innerHTML = finalHtml;
            // No Button Logic Needed (Pure CSS Animation)

        } catch (error) {
            console.error("Error loading testimonials:", error);
            container.innerHTML = '<p style="text-align:center; width:100%;">Erro ao carregar testemunhos.</p>';
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
                    const heroTitle = document.getElementById('hero-title-display');
                    const heroSubtitle = document.getElementById('hero-subtitle-display');
                    const heroCta = document.getElementById('hero-cta-display');

                    if (heroTitle && data.home.title) heroTitle.textContent = data.home.title;
                    if (heroSubtitle && data.home.subtitle) heroSubtitle.textContent = data.home.subtitle;
                    if (heroCta && data.home.cta_text) heroCta.textContent = data.home.cta_text;

                    // Text Color & Highlight
                    const applyStyle = (el, color, highlight) => {
                        if (!el) return;
                        if (color) el.style.color = color;

                        if (highlight) {
                            el.style.backgroundColor = 'rgba(0, 0, 0, 0.4)'; // Dark overlay
                            el.style.padding = '10px 20px';
                            el.style.borderRadius = '8px';
                            el.style.display = 'inline-block'; // Wrap text
                            el.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                            el.style.backdropFilter = 'blur(2px)';
                        } else {
                            // Reset if disabled
                            el.style.backgroundColor = '';
                            el.style.padding = '';
                            el.style.borderRadius = '';
                            el.style.display = '';
                            el.style.boxShadow = '';
                            el.style.backdropFilter = '';
                        }
                    };

                    applyStyle(heroTitle, data.home.text_color, data.home.text_highlight);
                    applyStyle(heroSubtitle, data.home.text_color, data.home.text_highlight);

                    // Hero Background Image
                    if (data.home.hero_image) {
                        const heroBg = document.querySelector('.hero-bg');
                        if (heroBg) {
                            heroBg.style.backgroundImage = `url('${data.home.hero_image}')`;
                            heroBg.style.backgroundSize = 'cover';
                            heroBg.style.backgroundPosition = 'center';
                        }
                    }
                }

                // Home Summary (About Teaser)
                if (data.home_about) {
                    const aboutTitle = document.getElementById('home-about-title-display');
                    const aboutText = document.getElementById('home-about-bio-display');
                    const aboutImg = document.getElementById('home-about-image-display');

                    if (aboutTitle && data.home_about.title) aboutTitle.textContent = data.home_about.title;
                    if (aboutText && data.home_about.text) aboutText.innerHTML = data.home_about.text;

                    if (aboutImg && data.home_about.image_url) {
                        aboutImg.innerHTML = `<img src="${data.home_about.image_url}" alt="Sobre Mim - Resumo">`;
                        // Ensure generic styles don't conflict
                        aboutImg.style.backgroundImage = 'none';
                    }
                }

                // Footer Content
                if (data.footer) {
                    const footerTitle = document.getElementById('footer-title');
                    const footerCopyright = document.getElementById('footer-copyright');
                    const footerCredit = document.getElementById('footer-credit');

                    if (footerTitle && data.footer.title) footerTitle.innerHTML = data.footer.title;
                    if (footerCopyright && data.footer.copyright) footerCopyright.innerHTML = data.footer.copyright;
                    if (footerCredit && data.footer.dev_credit) footerCredit.innerHTML = data.footer.dev_credit;
                }

                // Contact Content
                if (data.contact) {
                    const contactTitle = document.getElementById('contact-title');
                    const contactSubtitle = document.getElementById('contact-subtitle');
                    const contactEmail = document.getElementById('contact-email');
                    const contactPhone = document.getElementById('contact-phone');
                    const contactInstagram = document.getElementById('contact-instagram');

                    if (contactTitle && data.contact.title) contactTitle.innerHTML = data.contact.title;
                    if (contactSubtitle && data.contact.subtitle) contactSubtitle.innerHTML = data.contact.subtitle;
                    if (contactEmail && data.contact.email) contactEmail.innerHTML = data.contact.email;
                    if (contactPhone && data.contact.phone) contactPhone.innerHTML = data.contact.phone;
                    if (contactInstagram && data.contact.instagram) contactInstagram.innerHTML = data.contact.instagram;
                }
            }
        } catch (error) {
            console.error("Error loading site content:", error);
        }
    }

    loadSiteContent();

    // --- Dashboard Meditations Loop Fix ---
    function setupDashboardLoop() {
        // Only run on dashboard's "my meditations" carousel
        // Located in section.content-section > .carousel-wrapper > .carousel-container
        const container = document.querySelector('.content-section .carousel-container');
        if (!container) return;

        // Check availability
        const cards = container.querySelectorAll('.carousel-card');
        if (cards.length === 0) return;

        // Duplicate content 4 times to ensure no gaps during the 40s scroll (-50% transform)
        const originalHtml = container.innerHTML;
        container.innerHTML = originalHtml + originalHtml + originalHtml + originalHtml;
    }
    setupDashboardLoop();

    // --- GLOBAL: Subscription Logic ---
    window.startSubscription = async function (redirectUrl) {
        const btn = document.getElementById('subscribeBtn');
        const loading = document.getElementById('subLoading'); // Optional loader el

        if (btn) {
            btn.disabled = true;
            btn.style.opacity = "0.7";
            if (btn.textContent) {
                btn.setAttribute('data-original-text', btn.textContent);
                btn.textContent = "A iniciar Stripe...";
            }
        }
        if (loading) loading.style.display = 'block';

        try {
            if (!window.firebase) throw new Error("Firebase não inicializado.");

            // 1. Get Session ID from Cloud Function
            const createSession = window.firebase.functions().httpsCallable('createCheckoutSession');

            // Production Price ID (Replace if changed)
            const PRICE_ID = 'price_1SpXX63pFxyWJ0vQGfDPRFxi';

            // Ensure absolute URL for Stripe
            const finalSuccessUrl = new URL(redirectUrl || window.location.href, window.location.origin).href;
            const finalCancelUrl = window.location.href;

            const result = await createSession({
                priceId: PRICE_ID,
                successUrl: finalSuccessUrl,
                cancelUrl: finalCancelUrl
            });

            const sessionId = result.data.sessionId;

            // 2. Redirect to Stripe Checkout
            // Ensure Stripe.js is loaded in the page using this
            const stripeKey = 'pk_test_51SpXAa3pFxyWJ0vQ6JTPbY9GRIR9rpjylMe79XCUlDpfouFC2EZ22od62flAKRp4aAOzXaDzb3uwTIhibl02h1uC00pE9oRNJE';
            const stripe = Stripe(stripeKey);

            const { error } = await stripe.redirectToCheckout({ sessionId });

            if (error) {
                alert(error.message);
                if (btn) resetBtn(btn, loading);
            }

        } catch (error) {
            console.error("Checkout failed:", error);
            alert("Erro ao iniciar pagamento: " + error.message);
            if (btn) resetBtn(btn, loading);
        }
    };

    function resetBtn(btn, loading) {
        btn.disabled = false;
        btn.style.opacity = "1";
        const orig = btn.getAttribute('data-original-text');
        if (orig) btn.textContent = orig;
        if (loading) loading.style.display = 'none';
    }

    // --- GLOBAL: User Name Display ---
    // Runs on every page to update header if logged in
    const headerNameDisplay = document.getElementById('user-name-display');
    const mobileNameDisplay = document.getElementById('mobile-user-name');

    if (headerNameDisplay || mobileNameDisplay) {
        const savedName = localStorage.getItem('userName');
        if (savedName) {
            const greeting = `Olá, ${savedName.split(' ')[0]}`;
            if (headerNameDisplay) headerNameDisplay.textContent = greeting;
            if (mobileNameDisplay) mobileNameDisplay.textContent = greeting;
        }
    }

});
