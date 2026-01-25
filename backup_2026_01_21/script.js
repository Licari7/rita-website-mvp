document.addEventListener('DOMContentLoaded', () => {

    // Header Scroll & Style Effect (Dynamic)
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        const applyHeaderStyles = () => {
            const savedHeader = localStorage.getItem('site_header');
            const settings = savedHeader ? JSON.parse(savedHeader) : {
                transparent: true, // Default to Transparent for new visitors
                bg_color: '#80864f', // Default Green
                text_color: '#f7f2e0', // Default Beige
                font_size: 16,
                padding: 20
            };

            // Apply Static Props
            document.documentElement.style.setProperty('--nav-bg', settings.bg_color);
            document.documentElement.style.setProperty('--nav-text', settings.text_color);

            // Apply Font & Padding
            navbar.style.fontSize = settings.font_size + 'px';
            navbar.style.padding = settings.padding + 'px 0';

            // Logo Handling
            const logoImg = document.getElementById('header-logo-display');
            console.log("Logo Element Found:", !!logoImg);
            if (logoImg) {
                if (settings.logo_url) {
                    logoImg.src = settings.logo_url;
                    logoImg.classList.remove('hidden');
                    logoImg.style.display = '';
                } else {
                    logoImg.classList.add('hidden');
                }
            }

            // Scroll Logic
            const updateScroll = () => {
                // Cross-browser scroll detection
                const scrollPos = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

                if (settings.transparent && scrollPos < 50) {
                    // Transparent State
                    navbar.style.background = 'transparent';
                    navbar.style.boxShadow = 'none';
                    navbar.style.color = settings.text_color;
                    if (logoImg) logoImg.style.filter = 'none'; // Or brightness(0) invert(1) if needed for white logo
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

        // 1. Load from LocalStorage (Fast Preview)
        applyHeaderStyles();

        // 2. Load from Firestore (Global Source of Truth)
        if (window.db) {
            window.db.collection('site_content').doc('main').onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    if (data.header) {
                        localStorage.setItem('site_header', JSON.stringify(data.header));
                        applyHeaderStyles();
                    }
                }
            });
        }

        // Listen for live updates from CMS (same window)
        window.addEventListener('storage', (e) => {
            if (e.key === 'site_header') applyHeaderStyles();
        });

        // Global Welcome Message (Added Logic)
        // Global Welcome Message (Dynamic Update)
        window.updateWelcomeUI = () => {
            const welcomeMsg = document.getElementById('header-welcome-msg');
            if (welcomeMsg) {
                const userName = localStorage.getItem('userName');
                if (userName && userName !== 'Visitante') {
                    welcomeMsg.style.display = 'inline-block'; // Ensure visibility
                    welcomeMsg.textContent = `Olá, ${userName}`;
                } else {
                    welcomeMsg.style.display = 'none'; // Hide if not logged in
                }
            }
        };

        // Initial Call
        window.updateWelcomeUI();

        // Global Mobile Auth UI (Logout Button)
        // Handled by sidebar.js now
        window.updateMobileAuthUI = () => {
            // Deprecated in favor of sidebar.js
        };

        // Run on load and storage change
        // updateMobileAuthUI(); // Handled by sidebar.js
        window.addEventListener('storage', (e) => {
            if (e.key === 'userName' || e.key === 'isMember') {
                if (window.updateWelcomeUI) window.updateWelcomeUI();
            }
        });
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
                        <h2>Junta-te à Nossa Comunidade 🌿</h2>
                        <p>Junta-te à Comunidade do WhatsApp e fica a par de todas as novidades e eventos.</p>
                        <a href="https://chat.whatsapp.com/BpCgpanA5Wx1VEGrmo4Wwt" target="_blank" class="btn btn-primary full-width">Entrar na Comunidade</a>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', popupHTML);

        // Logic to close popup
        const closeLogic = () => {
            const overlay = document.querySelector('.popup-overlay');
            if (overlay) overlay.remove();
            // Cookie Management: Don't show again
            localStorage.setItem('seenPopup', 'true');
        };

        const closeBtn = document.querySelector('.close-popup');
        const ctaBtn = document.querySelector('.popup-content .btn-primary');

        if (closeBtn) closeBtn.addEventListener('click', closeLogic);
        if (ctaBtn) ctaBtn.addEventListener('click', closeLogic);
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
                // .where('date', '>=', now) // Removed to allow manual control
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

    // --- Dynamic Services Loader (Premium Carousel) ---
    async function loadPublicServices() {
        // Updated target ID from index.html change
        const container = document.getElementById('dynamic-services-container');
        if (!container) return;

        if (!window.db) {
            setTimeout(loadPublicServices, 500);
            return;
        }

        // Load Background Image for Section
        try {
            const doc = await window.db.collection('site_content').doc('main').get();
            if (doc.exists && doc.data().service_section && doc.data().service_section.background_image) {
                const section = document.querySelector('.services-section');
                if (section) {
                    section.classList.add('has-bg'); // Helper class if needed
                    section.style.backgroundImage = `url('${doc.data().service_section.background_image}')`;
                }
            }
        } catch (e) {
            console.error("BG Load Error", e);
        }

        try {
            const snapshot = await window.db.collection('services')
                // .orderBy('order', 'asc') // Commented out to debug 'empty' issue
                .get();

            if (snapshot.empty) {
                container.innerHTML = '<p style="text-align: center; width:100%; color: white;">Serviços indisponíveis de momento.</p>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();

                // Fallback Image
                const bgImage = data.headerImage ? `url('${data.headerImage}')` : 'none';

                // benefits to Meta string or icons
                let metaHtml = '';
                if (data.benefits && Array.isArray(data.benefits)) {
                    // Take first 3 benefits as meta tags for line 1
                    metaHtml = data.benefits.slice(0, 3).map(b => `<span><i data-lucide="check" style="width:10px;"></i> ${b}</span>`).join('');
                }

                html += `
                <div class="premium-card">
                    <div class="premium-card-top">
                        <div class="premium-card-overlay"></div>
                        <div class="premium-card-content">
                            <h3 class="premium-title">${data.title}</h3>
                            <p class="premium-subtitle">${data.subtitle || ''}</p> <!-- Subtitle field if exists, else empty -->
                            <div class="premium-meta">
                                ${metaHtml}
                            </div>
                        </div>
                    </div>
                    <div class="premium-card-bottom">
                        <p class="premium-desc">${data.description || 'Sem descrição.'}</p>
                        <div class="premium-actions">
                            <a href="#" class="btn-premium-outline">Agendar</a>
                            <a href="#" class="btn-premium-outline">Saber Mais</a>
                        </div>
                    </div>
                </div>
                `;
            });

            // INFITE LOOP: Duplicate content 3 times (Buffer Left, Main, Buffer Right)
            // This ensures we can scroll endlessly in both directions
            container.innerHTML = html + html + html;

            if (window.lucide) lucide.createIcons();

            // Setup Infinite Scroll Logic
            const totalWidth = container.scrollWidth;
            const setWidth = totalWidth / 3;

            // Start in the Middle Set
            container.scrollLeft = setWidth;

            // Scroll Handler for "Teleportation"
            // Using requestAnimationFrame to prevent scroll locking? No, simple logic first.
            const handleInfiniteScroll = () => {
                if (container.scrollLeft >= setWidth * 2) {
                    // Normalize: Prevent jumping too far back if user scrolled FAST
                    // New Pos = Current - SetWidth
                    container.scrollLeft -= setWidth;
                } else if (container.scrollLeft <= 0) {
                    // New Pos = Current + SetWidth
                    container.scrollLeft += setWidth;
                }
            };
            container.addEventListener('scroll', handleInfiniteScroll);

            // Init Drag Scroll Logic
            initDragScroll(container);

            // AUTO ROTATION (5s)
            // Clear existing if any
            if (window.serviceAutoScroll) clearInterval(window.serviceAutoScroll);

            window.serviceAutoScroll = setInterval(() => {
                // Determine width of one item + gap
                const firstCard = container.querySelector('.premium-card');
                if (firstCard) {
                    const style = window.getComputedStyle(firstCard);
                    const cardWidth = firstCard.offsetWidth;
                    // Assuming gap is 30px from CSS
                    const gap = 30; // Hardcoded fallback or measure
                    const stride = cardWidth + gap;

                    container.scrollBy({ left: stride, behavior: 'smooth' });
                }
            }, 5000);

            // Pause on Interaction
            const pause = () => clearInterval(window.serviceAutoScroll);
            const resume = () => {
                clearInterval(window.serviceAutoScroll);
                window.serviceAutoScroll = setInterval(() => {
                    // Re-declare logic to avoid closure stale issues
                    const firstCard = container.querySelector('.premium-card');
                    if (firstCard) {
                        const stride = firstCard.offsetWidth + 30;
                        container.scrollBy({ left: stride, behavior: 'smooth' });
                    }
                }, 5000);
            };

            container.addEventListener('mousedown', pause);
            container.addEventListener('touchstart', pause);
            container.addEventListener('mouseup', resume);
            container.addEventListener('touchend', resume);
            container.addEventListener('mouseleave', resume); // If mouse leaves, resume

        } catch (error) {
            console.error("Error loading services:", error);
            container.innerHTML = '<p style="color:white;">Erro ao carregar serviços.</p>';
        }
    }

    // Drag to Scroll Logic (Updated)
    function initDragScroll(slider) {
        let isDown = false;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });

        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.classList.remove('active');
        });

        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.classList.remove('active');
        });

        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2; // Scroll-fast factor
            slider.scrollLeft = scrollLeft - walk;
        });
    }

    // Arrow Navigation Global Function
    window.moveCarousel = (direction) => {
        const container = document.getElementById('dynamic-services-container');
        if (container) {
            const scrollAmount = 350 + 30; // Card width + gap
            container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
        }
    };

    loadPublicServices();

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
                // Footer Content
                if (data.footer) {
                    const footerTitle = document.getElementById('footer-title');
                    const footerCopyright = document.getElementById('footer-copyright');
                    const footerCredit = document.getElementById('footer-credit');

                    if (footerTitle && data.footer.title !== undefined) footerTitle.innerHTML = data.footer.title;
                    if (footerCopyright && data.footer.copyright !== undefined) footerCopyright.innerHTML = data.footer.copyright;
                    if (footerCredit && data.footer.dev_credit !== undefined) footerCredit.innerHTML = data.footer.dev_credit;
                }

                // Contact Content
                if (data.contact) {
                    const contactTitle = document.getElementById('contact-title');
                    const contactSubtitle = document.getElementById('contact-subtitle');
                    const contactEmail = document.getElementById('contact-email');
                    const contactPhone = document.getElementById('contact-phone');
                    const contactInstagram = document.getElementById('contact-instagram');

                    if (contactTitle && data.contact.title !== undefined) contactTitle.innerHTML = data.contact.title;
                    if (contactSubtitle && data.contact.subtitle !== undefined) contactSubtitle.innerHTML = data.contact.subtitle;
                    if (contactEmail && data.contact.email !== undefined) contactEmail.innerHTML = data.contact.email;
                    if (contactPhone && data.contact.phone !== undefined) contactPhone.innerHTML = data.contact.phone;
                    if (contactInstagram && data.contact.instagram !== undefined) contactInstagram.innerHTML = data.contact.instagram;
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

    // --- GLOBAL: Subscription Logic Removed (Free Access) ---
    // Previous subscription logic has been totally removed as per request.


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
