// Main Script (Loaded)
console.log("DEBUG: main.js v7.1.1 LOADED - Debug Enabled");
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
                    if (logoImg) logoImg.style.filter = 'none';
                } else {
                    // Opaque State
                    navbar.style.background = 'var(--nav-bg)';
                    navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                    navbar.style.color = settings.text_color;
                }
            };

            window.removeEventListener('scroll', window.headerScrollHandler); // Clean old
            window.headerScrollHandler = updateScroll; // Save ref
            window.addEventListener('scroll', updateScroll);
            updateScroll(); // Run immediately
        };

        const applyFooterStyles = () => {
            const savedFooter = localStorage.getItem('site_footer');
            console.log("DEBUG: applyFooterStyles running. Storage:", savedFooter);
            if (savedFooter) {
                const settings = JSON.parse(savedFooter);
                if (settings.bg_color) document.documentElement.style.setProperty('--color-footer-bg', settings.bg_color);
                if (settings.text_color) document.documentElement.style.setProperty('--color-footer-text', settings.text_color);

                // Live Text Update
                const footerTitle = document.getElementById('footer-title');
                const footerCopyright = document.getElementById('footer-copyright');
                const footerCredit = document.getElementById('footer-credit');

                console.log("DEBUG: Footer Elements:", { title: !!footerTitle, copyright: !!footerCopyright, credit: !!footerCredit });

                if (footerTitle && settings.title !== undefined) footerTitle.innerHTML = settings.title;
                if (footerCopyright && settings.copyright !== undefined) footerCopyright.innerHTML = settings.copyright;
                if (footerCredit && settings.dev_credit !== undefined) footerCredit.innerHTML = settings.dev_credit;
            } else {
                console.log("DEBUG: No site_footer in localStorage");
            }
        };

        // 1. Load from LocalStorage (Fast Preview)
        applyHeaderStyles();
        applyFooterStyles();

        // 2. Load from Firestore (Global Source of Truth)
        if (window.db) {
            window.db.collection('site_content').doc('main').onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    if (data.header) {
                        localStorage.setItem('site_header', JSON.stringify(data.header));
                        applyHeaderStyles();
                    }
                    if (data.footer) {
                        // Ensure we preserve existing title/copyright if not present in update? 
                        // No, data.footer is usually the whole object.
                        // Ideally we merge with existing local storage if we are doing partial updates, 
                        // but here we trust Firestore is the source of truth.
                        localStorage.setItem('site_footer', JSON.stringify(data.footer));
                        applyFooterStyles();
                    }
                }
            });
        }

        // Listen for live updates from CMS (same window)
        window.addEventListener('storage', (e) => {
            if (e.key === 'site_header') applyHeaderStyles();
            if (e.key === 'site_footer') applyFooterStyles();
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

        // 3. Admin UI Logic (Gerir Site Button)
        window.updateAdminUI = () => {
            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            console.log("Admin UI Update: Is Admin?", isAdmin); // Debug

            const navActions = document.querySelector('.nav-actions');
            if (!navActions) console.warn("Admin UI: .nav-actions container not found");

            const adminBtnId = 'admin-dashboard-btn';

            // Check if button already exists
            const existingBtn = document.getElementById(adminBtnId);

            if (isAdmin) {
                // Logic moved to dashboard.html center button
            } else {
                if (existingBtn) existingBtn.remove();
            }
        };
        // Run immediately
        window.updateAdminUI();

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
            if (e.key === 'isAdmin' || e.key === 'userEmail') {
                if (window.updateAdminUI) window.updateAdminUI();
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
        // Auto-fill for logged in users
        const savedName = localStorage.getItem('userName');
        const savedEmail = localStorage.getItem('userEmail');
        if (savedName && savedName !== 'Visitante') {
            const nameInput = document.getElementById('name');
            if (nameInput) nameInput.value = savedName;
        }
        if (savedEmail) {
            const emailInput = document.getElementById('email');
            if (emailInput) emailInput.value = savedEmail;
        }

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;

            btn.textContent = 'Enviando...';
            btn.disabled = true;

            // EmailJS Send
            // serviceID, templateID, formElement
            emailjs.sendForm('service_8726bv6', 'template_kb6e02m', contactForm)
                .then(() => {
                    alert('Obrigado! A sua mensagem foi enviada com sucesso.');
                    contactForm.reset();
                }, (err) => {
                    console.error('EmailJS Error:', err);
                    alert('Ocorreu um erro ao enviar a mensagem. Por favor, tente novamente ou contacte-nos pelo WhatsApp.');
                })
                .finally(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                });
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



    // --- Marketing Popup (Free Trial) - Persistent 30s Timer ---
    if (!localStorage.getItem('isMember') && !document.querySelector('.auth-page') && !localStorage.getItem('seenPopup')) {
        let firstVisit = localStorage.getItem('firstVisitTime');
        const now = Date.now();

        if (!firstVisit) {
            // User just arrived at the site
            firstVisit = now;
            localStorage.setItem('firstVisitTime', firstVisit);
        }

        const timePassed = now - parseInt(firstVisit);
        const popupDelay = 30000; // 30 seconds

        if (timePassed >= popupDelay) {
            // More than 30s have passed (perhaps they were on another page), show immediately
            showPopup();
        } else {
            // Less than 30s have passed, wait the remaining time
            const remainingTime = popupDelay - timePassed;
            setTimeout(showPopup, remainingTime);
        }
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

        // Load Background Image and Title for Section
        try {
            const doc = await window.db.collection('site_content').doc('main').get();
            if (doc.exists && doc.data().service_section) {
                const svcData = doc.data().service_section;
                const section = document.querySelector('.services-section');

                if (section && svcData.background_image) {
                    section.classList.add('has-bg');
                    section.style.backgroundImage = `url('${svcData.background_image}')`;
                    section.style.backgroundSize = 'cover';
                    section.style.backgroundPosition = 'center';
                }

                // Title & Highlight
                const titleEl = document.getElementById('services-title-display');
                if (titleEl) {
                    if (svcData.title) titleEl.textContent = svcData.title;

                    if (svcData.title_highlight_enabled) {
                        const color = svcData.title_highlight_color || '#f7f2e0';
                        const opacity = (svcData.title_highlight_opacity !== undefined) ? svcData.title_highlight_opacity : 1;

                        // Check if hexToRgba exists, otherwise fallback to hex
                        if (typeof hexToRgba === 'function') {
                            titleEl.style.backgroundColor = hexToRgba(color, opacity);
                        } else {
                            titleEl.style.backgroundColor = color;
                            titleEl.style.opacity = opacity; // Fallback (affects text too, so ideal is rgba)
                        }

                        titleEl.style.display = 'inline-block';
                        titleEl.style.padding = '5px 20px'; // Added visual padding
                        titleEl.style.borderRadius = '8px';
                    }
                }
            }
        } catch (e) {
            console.error("BG/Title Load Error", e);
        }

        try {
            const snapshot = await window.db.collection('services')
                // .orderBy('order', 'asc') 
                .get();

            if (snapshot.empty) {
                container.innerHTML = '<p style="text-align: center; width:100%; color: white;">Serviços indisponíveis de momento.</p>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();

                // Fallback Gradient if no image
                const defaultGradient = 'linear-gradient(135deg, #4F553D 0%, #30332E 100%)';
                // Dark Olive Gradient matching theme
                const bgImage = data.headerImage ? `url('${data.headerImage}')` : defaultGradient;

                // Strip HTML from description for card view
                let descText = data.description || 'Sem descrição.';
                // descText = descText.replace(/(<([^>]+)>)/gi, ""); // Remove tags - DISABLED BY REQUEST
                // if (descText.length > 120) descText = descText.substring(0, 117) + '...'; // Truncation might kill HTML tags, removing for now or needs smart truncation.
                // Given the 50/50 split and 5-6 lines requirement, let's remove truncation and let overflow:hidden handle it visually if needed, or rely on user to not overfill.
                // Or better, let's keep it robust but effectively rely on CSS.

                // benefits to Meta string or icons
                let metaHtml = '';
                if (data.benefits && Array.isArray(data.benefits)) {
                    // Take first 3 benefits as meta tags for line 1
                    metaHtml = data.benefits.slice(0, 3).map(b => `<span><i data-lucide="check" style="width:10px;"></i> ${b}</span>`).join('');
                }

                // --- Customization Logic v2 (Transparency Support) ---
                let topStyle = '';
                let bottomStyle = '';
                let btnStyle = 'border-color: #fff; color: #fff;'; // Default white

                // Defaults
                let topBg = '#000000';
                let topOp = 0.5;
                let botBg = '#4F553D';
                let botOp = 1;

                if (data.customColors) {
                    const cc = data.customColors;
                    topBg = cc.topBg || topBg;
                    topOp = (cc.topOpacity !== undefined) ? cc.topOpacity : (cc.headerOpacity !== undefined ? cc.headerOpacity : topOp);

                    botBg = cc.bottomBg || cc.bg || botBg;
                    botOp = (cc.bottomOpacity !== undefined) ? cc.bottomOpacity : (cc.bgOpacity !== undefined ? cc.bgOpacity : botOp);

                    const btnColor = cc.btnText || cc.text || '#ffffff';
                    btnStyle = `border-color: ${btnColor}; color: ${btnColor};`;
                }

                const topRgba = hexToRgba(topBg, topOp);
                const botRgba = hexToRgba(botBg, botOp);

                // Top Card Style Logic
                if (data.headerImage) {
                    // Have Image: Use Gradient Overlay + URL
                    const solidOverlay = `linear-gradient(${topRgba}, ${topRgba})`;
                    topStyle = `background-image: ${solidOverlay}, url('${data.headerImage}'); background-position: center;`;
                } else {
                    // No Image: Use SOLID COLOR (allows transparency to show page bg)
                    topStyle = `background-color: ${topRgba}; background-image: none;`;
                }
                // Common Top Styles
                topStyle += ` position: relative;`;

                // Bottom Card Style
                bottomStyle = `background-color: ${botRgba}; color: white;`;

                html += `
                <div class="premium-card">
                    <div class="premium-card-top" style="${topStyle}">
                        <!-- Overlay Div Removed: Handled by Multiple Backgrounds -->
                        
                        <div class="premium-card-content" style="position: relative; z-index: 2;">
                            <h3 class="premium-title">${data.title}</h3>
                            <p class="premium-subtitle">${data.subtitle || ''}</p> 
                            <div class="premium-meta">
                                ${metaHtml}
                            </div>
                        </div>
                    </div>
                    <div class="premium-card-bottom" style="${bottomStyle}">
                        <div class="premium-desc">${descText}</div>
                        <div class="premium-actions">
                            <a href="booking.html" class="btn-premium-outline" style="${btnStyle}">Agendar</a>
                            <a href="service-detail.html#${doc.id}" class="btn-premium-outline" style="${btnStyle}">Saber Mais</a>
                        </div>
                    </div>
                </div>
                `;
            });

            // INFITE LOOP: Duplicate content 3 times (Standard Buffer)
            container.innerHTML = html + html + html;

            if (window.lucide) lucide.createIcons();

            // Accurate setWidth calculation
            const singleSetCount = snapshot.size;
            const cards = container.querySelectorAll('.premium-card');
            const cardWidth = cards.length > 0 ? cards[0].offsetWidth : 350;
            const gap = 30;
            let setWidth = singleSetCount * (cardWidth + gap);
            if (cards.length >= (singleSetCount * 2)) {
                setWidth = cards[singleSetCount].offsetLeft - cards[0].offsetLeft;
            }

            // Start in the Middle Set (Set 2)
            if (container.scrollLeft === 0) {
                container.scrollLeft = setWidth;
            }

            // Toggle Snap Helper
            const toggleSnap = (enable) => {
                container.style.scrollSnapType = enable ? 'x mandatory' : 'none';
            };

            // Scroll Handler: Robust Infinite Scroll (Jump when reaching the end of the buffer)
            const handleInfiniteScroll = () => {
                const scrollLeft = container.scrollLeft;
                const tolerance = 50;

                // Thresholds:
                // Set 1: [0, setWidth]
                // Set 2: [setWidth, 2*setWidth] <--- Working Area
                // Set 3: [2*setWidth, 3*setWidth]

                // If we enter Set 3, jump back to Set 2
                if (scrollLeft >= (setWidth * 2) - tolerance) {
                    toggleSnap(false);
                    container.style.scrollBehavior = 'auto';
                    container.scrollLeft = scrollLeft - setWidth;
                    container.style.scrollBehavior = '';
                    // Force a tiny delay to let the jump settle before re-enabling snapping
                    setTimeout(() => toggleSnap(true), 50);
                }
                // If we enter Set 1 (moving backwards), jump to Set 2
                else if (scrollLeft <= tolerance) {
                    toggleSnap(false);
                    container.style.scrollBehavior = 'auto';
                    container.scrollLeft = scrollLeft + setWidth;
                    container.style.scrollBehavior = '';
                    setTimeout(() => toggleSnap(true), 50);
                }
            };
            container.addEventListener('scroll', handleInfiniteScroll);

            // Init Drag Scroll Logic
            initDragScroll(container);

            // AUTO ROTATION (7s)
            // Clear existing if any
            if (window.serviceAutoScroll) clearInterval(window.serviceAutoScroll);

            window.serviceAutoScroll = setInterval(() => {
                // Determine width of one item + gap
                const firstCard = container.querySelector('.premium-card');
                if (firstCard) {
                    const cardWidth = firstCard.offsetWidth;
                    const gap = 30; // Hardcoded fallback or measure
                    const stride = cardWidth + gap;

                    container.scrollBy({ left: stride, behavior: 'smooth' });
                }
            }, 7000);

            // Pause on Interaction
            const pause = () => clearInterval(window.serviceAutoScroll);
            const resume = () => {
                clearInterval(window.serviceAutoScroll);
                window.serviceAutoScroll = setInterval(() => {
                    const firstCard = container.querySelector('.premium-card');
                    if (firstCard) {
                        const stride = firstCard.offsetWidth + 30;
                        container.scrollBy({ left: stride, behavior: 'smooth' });
                    }
                }, 7000);
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
                .limit(100) // Fetch up to 100 (effectively all for now)
                .get();

            if (snapshot.empty) {
                container.innerHTML = '<p style="text-align: center; color: var(--color-text-light); width:100%;">Ainda sem testemunhos.</p>';
                return;
            }

            let cardsHtml = '';
            let count = 0;
            snapshot.forEach(doc => {
                const data = doc.data();

                // Filter out Service-Specific Testimonials
                if (data.type === 'service') return;

                // Manual Limit REMOVED to show all
                count++;

                cardsHtml += `
                <div class="review-card">
                    <p>"${data.text}"</p>
                    <span class="author">- ${data.name}${data.role ? `, <span style="font-size:0.9em; opacity:0.8">${data.role}</span>` : ''}</span>
                </div>
                `;
            });

            // Duplicate content 3 times (Standardize for infinite loop logic)
            // Left Buffer | Main Content | Right Buffer
            let finalHtml = cardsHtml + cardsHtml + cardsHtml;

            // If very few items, duplicate more to ensure scrollability
            if (snapshot.size < 3) {
                finalHtml = cardsHtml + cardsHtml + cardsHtml + cardsHtml + cardsHtml; // 5x
            }

            container.innerHTML = finalHtml;

            // Init Drag Scroll
            initDragScroll(container);

            // --- Infinite Scroll Logic (Teleportation) ---
            // Wait for render to calculate widths
            setTimeout(() => {
                const totalWidth = container.scrollWidth;
                const singleSetCount = snapshot.size;
                const cards = container.querySelectorAll('.review-card');
                if (cards.length === 0) return;

                // Calculate width of one single set of original cards
                // With new CSS, width is 100% of container, gap is 0.
                const cardWidth = container.offsetWidth; // Visible width
                const singleSetWidth = cardWidth * singleSetCount;

                // Start in the Middle (at start of Set 2)
                container.scrollLeft = singleSetWidth;

                const handleInfiniteScroll = () => {
                    const tolerance = 5; // Pixel tolerance
                    // Force disable smooth behavior for the jump
                    if (container.scrollLeft >= singleSetWidth * 2) {
                        // We reached end of Set 2, jump back to start of Set 2
                        container.style.scrollBehavior = 'auto'; // Disable smooth
                        container.scrollLeft = container.scrollLeft - singleSetWidth;
                        container.style.scrollBehavior = ''; // Restore
                    } else if (container.scrollLeft <= 0) {
                        // We reached start of Set 1 (shouldn't happen often if we started in middle), jump to end of Set 2?
                        // actually if < 0 (impossible) or near 0.
                        // Standard logic: if at start of buffer (0), jump to start of Set 2
                        container.style.scrollBehavior = 'auto';
                        container.scrollLeft = singleSetWidth;
                        container.style.scrollBehavior = '';
                    }
                };

                // Remove Old
                container.removeEventListener('scroll', window.testimonialsScrollHandler);
                window.testimonialsScrollHandler = handleInfiniteScroll;
                // Add New (Throttle?)
                container.addEventListener('scroll', handleInfiniteScroll);

                // --- Auto Scroll Logic (8s) ---
                if (window.testimonialsAutoScroll) clearInterval(window.testimonialsAutoScroll);

                const startAutoScroll = () => {
                    window.testimonialsAutoScroll = setInterval(() => {
                        // Scroll by ONE container width (NEXT CARD)
                        const stride = container.offsetWidth;
                        container.scrollBy({ left: stride, behavior: 'smooth' });
                    }, 8000); // 8 Seconds
                };

                startAutoScroll();

                // Re-check scroll position after testimonials expand layout
                checkAndScrollToHash();

                // Pause on Interaction
                const pauseTestinians = () => clearInterval(window.testimonialsAutoScroll);
                const resumeTestimonials = () => {
                    clearInterval(window.testimonialsAutoScroll);
                    startAutoScroll();
                };

                container.addEventListener('mouseenter', pauseTestinians);
                container.addEventListener('touchstart', pauseTestinians);
                container.addEventListener('mouseleave', resumeTestimonials);
                container.addEventListener('touchend', resumeTestimonials);

                // Add Manual Control Function
                window.moveTestimonials = (dir) => {
                    // Move by one full card width
                    const stride = container.offsetWidth;
                    container.scrollBy({ left: dir * stride, behavior: 'smooth' });

                    // Reset auto timer to avoid double jump
                    resumeTestimonials();
                }

            }, 500); // Delay for layout to settle

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

                // About Page Content (Full Page)
                if (data.about) {
                    const introText = document.getElementById('about-text-intro-display');
                    const introImgContainer = document.getElementById('author-img-display');
                    const artText = document.getElementById('about-text-art-display');
                    const artImgContainer = document.getElementById('about-img-art-display');

                    // Sections for Color
                    const introSection = document.getElementById('about-intro');
                    const artSection = document.getElementById('about-art');

                    // 1. Intro Section
                    if (introText) introText.innerHTML = data.about.text_intro || data.about.text || '<p>Sem descrição.</p>';
                    if (introImgContainer && data.about.image_url) {
                        introImgContainer.innerHTML = `<img src="${data.about.image_url}" class="about-split-img" alt="Sobre Mim">`;
                    }

                    // Intro Colors
                    // REMOVED: Legacy inline styles that conflicted with CSS variables

                    // 2. Art Section
                    if (artText) artText.innerHTML = data.about.text_art || '<p>Sem descrição.</p>';
                    if (artImgContainer && data.about.image_art_url) {
                        artImgContainer.innerHTML = `<img src="${data.about.image_art_url}" class="about-split-img" alt="A minha Arte">`;
                    }

                    // Art Colors
                    // REMOVED: Legacy inline styles that conflicted with CSS variables

                    // Update Page Title
                    const pageTitle = document.getElementById('about-title');
                    if (pageTitle && data.about.title) pageTitle.textContent = data.about.title;
                }

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

                // Re-check scroll position after site content layout changes
                checkAndScrollToHash();
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

    // --- About Page Logic ---
    function loadAboutPageContent() {
        if (!document.querySelector('.about-page-main') || !window.db) return;

        window.db.collection('site_content').doc('main').onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                const about = data.about || {}; // This might be a flat object or nested
                console.log("DEBUG: Loaded About Data:", about);

                // Helper to find value across possible keys
                const getVal = (...keys) => {
                    for (const k of keys) {
                        if (about[k] !== undefined && about[k] !== null) return about[k];
                        // Also check deep if k has dots? No, let's keep simple.
                        // Check if about.intro exists and has key
                        if (about.intro && about.intro[k]) return about.intro[k];
                        if (about.art && about.art[k]) return about.art[k];
                    }
                    return null;
                };

                // Text
                const titleEl = document.getElementById('about-title');
                if (titleEl) titleEl.innerText = about.title || about.page_title || about.intro?.title || 'Sobre Mim';

                const introTextEl = document.getElementById('about-text-intro-display');
                // Keys based on typical CMS patterns: text_intro, intro_text, or nested intro.text
                const introText = about.text_intro || about.intro_text || about.intro?.text;
                if (introTextEl) introTextEl.innerHTML = introText || '<p>Conteúdo não disponível.</p>';

                const artTextEl = document.getElementById('about-text-art-display');
                const artText = about.text_art || about.art_text || about.art?.text;
                if (artTextEl) artTextEl.innerHTML = artText || '<p>Conteúdo não disponível.</p>';

                // Images
                const imgIntro = document.getElementById('author-img-display');
                // ID in admin is 'about-image-url' -> likely 'image_url' or 'image'
                const introImgSrc = about.image_url || about.image || about.intro?.image;
                if (imgIntro && introImgSrc) {
                    imgIntro.innerHTML = `<img src="${introImgSrc}" alt="Intro" class="about-split-img">`;
                }

                const imgArt = document.getElementById('about-img-art-display');
                // ID in admin is 'about-image-art-url' -> likely 'image_art_url'
                const artImgSrc = about.image_art_url || about.art_image_url || about.art?.image;
                if (imgArt && artImgSrc) {
                    imgArt.innerHTML = `<img src="${artImgSrc}" alt="Art" class="about-split-img">`;
                }

                // Dynamic Colors
                const root = document.documentElement;
                console.log("DEBUG: Applying About Colors", about); // Debug Log

                // Intro Section
                const introBg = about.intro_bg || about.bg_intro || about.intro?.bgColor;
                const introTxt = about.intro_text_color || about.intro?.textColor;

                console.log("DEBUG: Intro Colors -> BG:", introBg, "TXT:", introTxt); // Debug Log

                if (introBg) root.style.setProperty('--about-intro-bg', introBg);
                if (introTxt) root.style.setProperty('--about-intro-text', introTxt);

                // Art Section
                const artBg = about.art_bg || about.bg_art || about.art?.bgColor;
                const artTxt = about.art_text_color || about.art?.textColor; // FIXED: Removed about.text_art
                if (artBg) root.style.setProperty('--about-art-bg', artBg);
                if (artTxt) root.style.setProperty('--about-art-text', artTxt);

                // Footer Colors (Specific for About Page if needed, but safer to load global)
                const savedFooter = localStorage.getItem('site_footer');
                if (savedFooter) {
                    try {
                        const f = JSON.parse(savedFooter);
                        if (f.text_color) root.style.setProperty('--color-footer-text', f.text_color);
                        if (f.bg_color) root.style.setProperty('--color-footer-bg', f.bg_color);
                    } catch (e) { console.error("Footer color parse error", e); }
                }
            }
        });
    }
    loadAboutPageContent();

});



// Global Testimonials Nav (Added)
window.moveTestimonials = (direction) => {
    const container = document.getElementById('dynamic-testimonials-container');
    if (container) {
        const scrollAmount = 350; // Card + gap
        container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
};

// Helper: Hex to RGBA (Robust)
function hexToRgba(hex, alpha) {
    if (!hex) return 'rgba(0,0,0,0)';
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
    }
    return hex; // Fallback
}
window.hexToRgba = hexToRgba;

// --- Fix for Anchor Scroll after Dynamic Content ---
function checkAndScrollToHash() {
    const hash = window.location.hash;
    if (hash) {
        // Debounce slightly to allow layout reflow
        setTimeout(() => {
            const target = document.querySelector(hash);
            if (target) {
                // Only scroll if we are not already near it (avoid jitter)
                const rect = target.getBoundingClientRect();
                // If element is not roughly near top or within view
                if (Math.abs(rect.top) > 100) {
                    // console.log("Fixing scroll to", hash);
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }, 100);
    }
}

// Call on load and after dynamic renders
// Call on load and after dynamic renders
window.addEventListener('load', () => setTimeout(checkAndScrollToHash, 500));

// Helper to convert Hex to RGBA (Moved to top for safety)


// GLOBAL HELPER (Moved outside to ensure availability)
window.hexToRgba = function (hex, alpha) {
    if (!hex) return 'rgba(0,0,0,0)';
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
    }
    return hex; // Fallback
};

// --- Service Detail Page Logic ---
// Note: This needs to be available globally too or attached to window
window.loadServiceDetail = async function () {
    // Only run on service-detail page
    if (!window.location.pathname.includes('service-detail')) return;

    const loadMsg = document.getElementById('loading-msg');
    if (loadMsg) loadMsg.innerText = "A iniciar carregamento..."; // Trace 1

    const hash = window.location.hash;
    if (!hash) {
        if (loadMsg) loadMsg.innerText = "Serviço não especificado (sem ID).";
        const titleEl = document.getElementById('svc-title');
        if (titleEl) titleEl.innerText = "Serviço não especificado.";
        return;
    }
    const serviceId = hash.substring(1);
    console.log("Loading Service Detail for ID:", serviceId);

    // WAIT FOR DB
    if (!window.db) {
        if (loadMsg) loadMsg.innerText = "A aguardar base de dados...";
        console.log("Waiting for DB...");
        setTimeout(window.loadServiceDetail, 500); // Retry global
        return;
    }

    try {
        if (loadMsg) loadMsg.innerText = "A ler dados do serviço..."; // Trace 2
        const doc = await window.db.collection('services').doc(serviceId).get();
        if (!doc.exists) {
            console.error("Service not found in DB");
            document.getElementById('svc-title').innerText = "Serviço não encontrado.";
            return;
        }
        const data = doc.data();
        console.log("Service Data Loaded:", data); // DEBUG

        // 1. Header (Hidden Title for SEO)
        document.getElementById('svc-title').innerText = data.title;
        document.title = `${data.title} | Floresce Terapias`;

        // --- SECTION 1 (Hero) ---
        const sec1 = document.getElementById('svc-section-1');
        const box1 = document.getElementById('svc-content-1-container'); // The overlay box
        const content1 = document.getElementById('svc-content-1');
        const cols = data.customColors || {};

        if (sec1) {
            // Background Image on Section
            if (data.section1_image) {
                sec1.style.backgroundImage = `url('${data.section1_image}')`;
                sec1.style.backgroundSize = 'cover';
                sec1.style.backgroundPosition = 'center';
            } else {
                sec1.style.backgroundImage = 'none';
                sec1.style.backgroundColor = '#f0f0f0'; // Default gray backing
            }
        }

        if (box1) {
            // BG Color + Opacity on the BOX
            // FIX: Match keys from cms-services.js (section1_card_bg, section1_card_opacity)
            const bgColor = cols.section1_card_bg || cols.section1_bg || '#ffffff';
            const opacity = cols.section1_card_opacity !== undefined ? cols.section1_card_opacity : (cols.section1_opacity !== undefined ? cols.section1_opacity : 0.9);

            const rgbaVal = hexToRgba(bgColor, opacity);

            // Use setProperty to enforce important
            box1.style.setProperty('background-color', rgbaVal, 'important');

            // Text Color
            if (cols.section1_text) {
                box1.style.color = cols.section1_text;
            }
        }

        // Content Injection (Title + Text)
        // Use New Title if available, fallback to main title
        const displayTitle = data.section1_title || data.title;
        let html1 = `<h1>${displayTitle}</h1>`;

        if (data.long_description) {
            html1 += `<div class="svc-text">${data.long_description}</div>`;
        }

        // Section 1 CTAs
        const showSched1 = cols.show_schedule_1 !== false;
        const showContact1 = cols.show_contact_1 !== false;

        if (showSched1 || showContact1) {
            html1 += `<div class="svc-btn-group" style="margin-top: 30px; display: flex; gap: 15px; flex-wrap: wrap;">`;
            if (showSched1) html1 += `<a href="index.html#contact" class="btn btn-primary">Marcar Sessão</a>`;
            if (showContact1) {
                // MATCH ABOUT PAGE STYLE: btn-primary, icon
                html1 += `<a href="https://wa.me/351913515406" target="_blank" class="btn btn-primary cta-whatsapp-btn">
                            <i data-lucide="message-circle" class="icon-sm"></i> Entra em contacto
                          </a>`;
            }
            html1 += `</div>`;
        }

        content1.innerHTML = html1;
        // lucide.createIcons() moved to bottom of try block

        // Remove loader
        if (loadMsg) loadMsg.remove();


        // --- SECTION 2 (Detail) ---
        const sec2 = document.getElementById('svc-section-2');
        const box2 = document.getElementById('svc-content-2-container');
        const content2 = document.getElementById('svc-content-2');

        // Check availability (either content or specific field)
        // AND check explicit visibility toggle (default true)
        const isSec2Visible = (cols.show_section_2 !== false);
        const hasSec2Content = data.long_description_2 || data.section2_image;

        if (hasSec2Content && isSec2Visible) {
            sec2.style.display = 'flex'; // Turn it on (flex for centering)
            sec2.classList.remove('hidden'); // Ensure hidden class is gone

            // Background Image on Section
            if (data.section2_image) {
                sec2.style.backgroundImage = `url('${data.section2_image}')`;
                sec2.style.backgroundSize = 'cover';
                sec2.style.backgroundPosition = 'center';
            } else {
                sec2.style.backgroundImage = 'none';
                sec2.style.backgroundColor = cols.section2_bg || '#f7f2e0'; // Use configured BG or default
            }

            // BG Color + Opacity on the BOX
            if (box2) {
                // FIX: Match keys from cms-services.js (section2_card_bg, section2_card_opacity)
                const bgColor2 = cols.section2_card_bg || cols.section2_bg || '#ffffff';
                const opacity2 = cols.section2_card_opacity !== undefined ? cols.section2_card_opacity : (cols.section2_opacity !== undefined ? cols.section2_opacity : 0.9);

                const rgbaVal2 = hexToRgba(bgColor2, opacity2);

                box2.style.setProperty('background-color', rgbaVal2, 'important');

                if (cols.section2_text) box2.style.color = cols.section2_text;
            }

            // Content
            let html2 = '';
            if (data.long_description_2) {
                html2 += `<div class="svc-text">${data.long_description_2}</div>`;
            }

            // Section 2 CTAs
            const showSched2 = cols.show_schedule_2 === true; // Default false
            const showContact2 = cols.show_contact_2 !== false; // Default true

            if (showSched2 || showContact2) {
                html2 += `<div class="svc-btn-group" style="margin-top: 30px; display: flex; gap: 15px; flex-wrap: wrap;">`;
                if (showSched2) html2 += `<a href="index.html#contact" class="btn btn-primary">Marcar Sessão</a>`;
                if (showContact2) {
                    // MATCH ABOUT PAGE STYLE: btn-primary, icon
                    html2 += `<a href="https://wa.me/351913515406" target="_blank" class="btn btn-primary cta-whatsapp-btn">
                                <i data-lucide="message-circle" class="icon-sm"></i> Entra em contacto
                              </a>`;
                }
                html2 += `</div>`;
            }

            content2.innerHTML = html2;
        } else {
            // Hide if absolutely no content
            sec2.style.display = 'none';
        }

        // 4. Testimonials (Filtered)
        const secTesti = document.getElementById('svc-testimonials-section');
        if (data.testimonial_ids && data.testimonial_ids.length > 0) {
            secTesti.style.display = 'block';
            secTesti.classList.remove('svc-testimonials-section-hidden'); // Force show CSS override

            if (cols.testimonials_bg) secTesti.style.backgroundColor = cols.testimonials_bg;
            if (cols.testimonials_text) {
                secTesti.style.color = cols.testimonials_text;
                const tTitle = document.getElementById('svc-testi-title');
                if (tTitle) tTitle.style.color = cols.testimonials_text;
            }

            loadServiceTestimonials(data.testimonial_ids);
        } else {
            secTesti.style.display = 'none';
        }

        if (window.lucide) window.lucide.createIcons();
    } catch (err) {
        console.error("Error loading service detail:", err);
    }
}

async function loadServiceTestimonials(ids) {
    const container = document.getElementById('svc-testimonials-carousel');
    if (!container) return;

    if (!ids || ids.length === 0) return;

    try {
        // Firestore 'in' query supports up to 10 items.
        // If more, we slice. Ideally fetch all and filter client side if list is small, or batch.
        const safeIds = ids.slice(0, 10);

        const querySnapshot = await window.db.collection('testimonials')
            .where(firebase.firestore.FieldPath.documentId(), 'in', safeIds)
            .get();

        if (querySnapshot.empty) {
            container.innerHTML = '<p class="text-center muted">Sem testemunhos disponíveis.</p>';
            return;
        }

        const items = [];
        querySnapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() });
        });

        // Use DashboardCarousel
        if (window.DashboardCarousel) {
            new window.DashboardCarousel({
                containerId: 'svc-testimonials-carousel', // ID of the container
                prevBtnId: 'svc-prev-btn',
                nextBtnId: 'svc-next-btn',
                enableLoop: true,
                autoScrollDelay: 7000,
                data: items, // Pass pre-loaded data
                renderCard: (t) => {
                    // Custom Render Function using 'review-card' style
                    // Add 'carousel-card' class for width calculation
                    return `
                        <div class="review-card carousel-card" style="min-width: 100%; width: 100%; flex: 0 0 100%; min-height: 250px; display: flex; flex-direction: column; justify-content: center; background: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 8px 20px rgba(0,0,0,0.05);">
                            <p style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 20px; color: #333; text-align: center;">"${t.text}"</p>
                            <div class="author" style="font-weight: 600; text-transform: uppercase; color: var(--color-primary); letter-spacing: 1px; text-align: center;">${t.name}</div>
                            ${t.role ? `<div class="role" style="font-size: 0.95rem; margin-top:5px; color: #666; font-weight: 500; text-align: center;">${t.role}</div>` : ''}
                        </div>
                    `;
                }
            });
        } else {
            // Fallback if class missing
            let html = '';
            items.forEach(t => {
                html += `
                <div class="testimonial-card">
                    <div class="testimonial-content">"${t.text}"</div>
                    <div class="testimonial-author">${t.name}</div>
                     ${t.role ? `<div class="testimonial-role">${t.role}</div>` : ''}
                </div>`;
            });
            container.innerHTML = html;
        }

    } catch (err) {
        console.error("Error loading service testimonials:", err);
    }
}

// Trigger load
function initServiceDetail() {
    if (window.location.pathname.includes('service-detail')) {
        loadServiceDetail();
    }
}
window.addEventListener('hashchange', initServiceDetail);
initServiceDetail();
// window.hexToRgba = hexToRgba; // Moved to top

// =============================================
// --- Time-on-Site Tracking (Page Visibility API) ---
// =============================================
(function initTimeTracking() {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail || userEmail === 'Visitante') return; // Only logged-in users

    let sessionStart = Date.now();
    let pendingSeconds = 0;
    let flushTimer = null;

    function accumulateTime() {
        const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
        sessionStart = Date.now();
        return elapsed;
    }

    async function flushToFirestore() {
        if (pendingSeconds < 1) return;
        if (!window.db) return;
        const toFlush = pendingSeconds;
        pendingSeconds = 0;
        try {
            const inc = window.firebase && window.firebase.firestore
                ? window.firebase.firestore.FieldValue.increment(toFlush)
                : toFlush; // fallback (not cumulative, but safe)
            await window.db.collection('users').doc(userEmail).update({
                totalTimeSeconds: inc
            });
        } catch (e) {
            console.warn('Time flush error:', e.message);
            pendingSeconds += toFlush; // restore on failure
        }
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            pendingSeconds += accumulateTime();
            flushToFirestore();
        } else {
            sessionStart = Date.now(); // resume
        }
    });

    // Periodic flush every 60s
    flushTimer = setInterval(async () => {
        if (!document.hidden) {
            pendingSeconds += accumulateTime();
        }
        await flushToFirestore();
    }, 60000);

    // Flush on page unload
    window.addEventListener('pagehide', () => {
        pendingSeconds += accumulateTime();
        flushToFirestore(); // best-effort
    });
    window.addEventListener('beforeunload', () => {
        pendingSeconds += accumulateTime();
        flushToFirestore();
    });
})();

