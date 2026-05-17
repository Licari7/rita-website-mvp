// Main Script (Loaded)
console.log("DEBUG: main.js v7.1.1 LOADED - Debug Enabled");
document.addEventListener('DOMContentLoaded', () => {

    async function hasPublicEventMemories() {
        if (!window.db) return false;
        try {
            const snapshot = await window.db.collection('event_memories').get();
            let hasContent = false;
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.show_on_archive !== false) hasContent = true;
            });
            return hasContent;
        } catch (err) {
            console.warn('Event memories nav check failed:', err);
            return false;
        }
    }

    async function updateEventMemoriesNavLinks(retryCount = 0) {
        if (!window.db) {
            if (retryCount < 10) setTimeout(() => updateEventMemoriesNavLinks(retryCount + 1), 500);
            return;
        }

        const shouldShow = await hasPublicEventMemories();
        document.body.classList.toggle('has-event-memories', shouldShow);
        document.querySelectorAll('.nav-links').forEach(list => {
            const existing = list.querySelector('[data-event-memories-link]');
            if (!shouldShow) {
                if (existing) existing.closest('li')?.remove();
                return;
            }
            if (existing) return;

            const li = document.createElement('li');
            li.innerHTML = '<a href="/encontros-realizados" data-event-memories-link>Eventos Realizados</a>';
            const bookingItem = Array.from(list.children).find(item => item.querySelector('a[href*="booking"]'));
            list.insertBefore(li, bookingItem || null);
        });
    }

    window.hasPublicEventMemories = hasPublicEventMemories;
    window.updateEventMemoriesNavLinks = updateEventMemoriesNavLinks;
    updateEventMemoriesNavLinks();

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
            if (window.updateMemberAvatarUI) window.updateMemberAvatarUI();
        };

        if (!window.updateMemberAvatarUI) {
            window.updateMemberAvatarUI = (override = {}) => {
                const navbarContent = document.querySelector('.navbar .container, .navbar-content, nav .container');
                if (!navbarContent) return;

                const userName = localStorage.getItem('userName');
                const userEmail = localStorage.getItem('userEmail');
                const photoUrl = override.photoUrl !== undefined ? override.photoUrl : localStorage.getItem('userPhotoUrl');
                const menuToggle = navbarContent.querySelector('.menu-toggle');
                let profileLink = document.getElementById('member-profile-header-link');
                let avatar = document.getElementById('member-profile-avatar-link');
                const welcomeMsg = navbarContent.querySelector('#header-welcome-msg') || document.getElementById('header-welcome-msg');

                if (!userEmail || !userName || userName === 'Visitante') {
                    if (avatar) avatar.remove();
                    if (welcomeMsg) {
                        welcomeMsg.classList.remove('member-profile-name-link');
                        welcomeMsg.removeAttribute('role');
                        welcomeMsg.removeAttribute('tabindex');
                        welcomeMsg.removeAttribute('title');
                        if (profileLink && menuToggle) navbarContent.insertBefore(welcomeMsg, menuToggle);
                    }
                    if (profileLink) profileLink.remove();
                    return;
                }

                if (!profileLink) {
                    profileLink = document.createElement('a');
                    profileLink.id = 'member-profile-header-link';
                    profileLink.className = 'member-profile-header-link';
                    profileLink.href = 'dashboard.html#member-profile-panel';
                    profileLink.title = 'O meu perfil';
                    profileLink.setAttribute('aria-label', 'O meu perfil');
                    if (menuToggle) navbarContent.insertBefore(profileLink, menuToggle);
                    else navbarContent.appendChild(profileLink);
                }

                if (!avatar) {
                    avatar = document.createElement('span');
                    avatar.id = 'member-profile-avatar-link';
                    avatar.className = 'member-profile-avatar-link';
                }
                if (avatar.parentElement !== profileLink) profileLink.appendChild(avatar);
                if (welcomeMsg && welcomeMsg.parentElement !== profileLink) profileLink.appendChild(welcomeMsg);

                avatar.innerHTML = photoUrl
                    ? `<img src="${photoUrl}" alt="O meu perfil" onload="window.applyMemberAvatarTransform && window.applyMemberAvatarTransform(this.parentElement);" onerror="this.parentElement.innerHTML='<i data-lucide=&quot;user&quot;></i>'; if (window.lucide) window.lucide.createIcons();">`
                    : '<i data-lucide="user"></i>';

                if (photoUrl && window.applyMemberAvatarTransform) window.applyMemberAvatarTransform(avatar);
                if (welcomeMsg) {
                    welcomeMsg.classList.add('member-profile-name-link');
                    welcomeMsg.setAttribute('title', 'O meu perfil');
                }
                if (window.lucide) window.lucide.createIcons();
            };
        }

        // Initial Call
        window.updateWelcomeUI();
        if (window.updateMemberAvatarUI) window.updateMemberAvatarUI();

        // 3. Admin UI Logic (Gerir Site Button)
        window.updateAdminUI = () => {
            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            console.log("Admin UI Update: Is Admin?", isAdmin); // Debug

            const navActions = document.querySelector('.nav-actions');

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
            if (e.key === 'userName' || e.key === 'isMember' || e.key === 'userPhotoUrl' || e.key === 'userPhotoPositionX' || e.key === 'userPhotoPositionY' || e.key === 'userPhotoZoom') {
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
                .get();

            if (snapshot.empty) {
                container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--color-text-light);">Não existem eventos agendados para breve.</p>';
                return;
            }

            let html = '';
            const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
            let count = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.active === false) return; // Skip hidden events
                if (count >= 4) return; // Max 4 events
                count++;
                
                const eventDate = new Date(data.date);
                const day = eventDate.getDate();
                const month = months[eventDate.getMonth()];

                let imageHtml = '';
                if (data.image_url) {
                    // Full image display: Auto height to show everything (no cropping)
                    imageHtml = `<img src="${data.image_url}" alt="${data.title}" style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 15px; display: block;">`;
                }

                let dateBadgeHtml = '';
                if (data.dateDisplay && data.dateDisplay.trim() !== '') {
                    dateBadgeHtml = `
                        <div class="event-date multi-date">
                            <span class="multi-text">${data.dateDisplay}</span>
                        </div>
                    `;
                } else {
                    dateBadgeHtml = `
                        <div class="event-date">
                            <span class="day">${day}</span>
                            <span class="month">${month}</span>
                        </div>
                    `;
                }

                html += `
                <article class="event-card">
                    ${imageHtml ? imageHtml : ''}
                    <div style="display: flex; gap: 15px;">
                        ${dateBadgeHtml}
                        <div class="event-details">
                            <h3>${data.title}</h3>
                            <p class="event-meta"><i data-lucide="map-pin" style="width:14px;"></i> ${data.location} &bull; ${data.time}</p>
                            <p>${data.description}</p>
                            <a href="${data.registration_link || 'booking.html'}" class="link-arrow">Inscrever <i data-lucide="arrow-right"></i></a>
                        </div>
                    </div>
                </article>
                `;
            });

            if (count === 0) {
                container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--color-text-light);">Não existem eventos agendados para breve.</p>';
            } else {
                container.innerHTML = html;
            }
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
                if (data.active === false) return;

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

                const serviceUrl = window.servicePageMap && window.servicePageMap[doc.id] ? window.servicePageMap[doc.id] : '';

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
                            ${serviceUrl ? `<a href="${serviceUrl}" class="btn-premium-outline" style="${btnStyle}">Saber Mais</a>` : ''}
                        </div>
                    </div>
                </div>
                `;
            });

            if (!html.trim()) {
                container.innerHTML = '<p style="text-align: center; width:100%; color: white;">Serviços indisponíveis de momento.</p>';
                return;
            }

            // Keep the viewport fixed and animate an inner track. This avoids scroll-snap
            // corrections when the number of visible cards matches the number of services.
            container.innerHTML = `<div class="services-carousel-track">${html}</div>`;
            const track = container.querySelector('.services-carousel-track');
            container.scrollLeft = 0;

            if (window.lucide) lucide.createIcons();

            const getServiceSlideStep = () => {
                const cards = Array.from(track.querySelectorAll('.premium-card'));
                if (cards.length < 2) return cards[0] ? cards[0].offsetWidth : 0;
                return cards[1].offsetLeft - cards[0].offsetLeft;
            };

            const rotateServices = (direction = 1) => {
                const cards = Array.from(track.querySelectorAll('.premium-card:not([data-carousel-clone="true"])'));
                if (cards.length <= 1 || container.dataset.sliding === 'true') return;

                const step = getServiceSlideStep();
                if (!step) return;

                container.dataset.sliding = 'true';
                container.classList.add('is-sliding');

                if (direction > 0) {
                    const clone = cards[0].cloneNode(true);
                    clone.dataset.carouselClone = 'true';
                    track.appendChild(clone);
                    track.style.transition = 'transform 560ms cubic-bezier(0.45, 0, 0.2, 1)';
                    track.style.transform = `translate3d(-${step}px, 0, 0)`;

                    window.setTimeout(() => {
                        track.style.transition = 'none';
                        track.appendChild(cards[0]);
                        clone.remove();
                        track.style.transform = 'translate3d(0, 0, 0)';
                        container.scrollLeft = 0;
                        track.offsetHeight;
                        track.style.transition = '';
                        container.classList.remove('is-sliding');
                        container.dataset.sliding = 'false';
                    }, 580);
                } else {
                    const clone = cards[cards.length - 1].cloneNode(true);
                    clone.dataset.carouselClone = 'true';
                    track.insertBefore(clone, cards[0]);
                    track.style.transition = 'none';
                    track.style.transform = `translate3d(-${step}px, 0, 0)`;
                    track.offsetHeight;
                    track.style.transition = 'transform 560ms cubic-bezier(0.45, 0, 0.2, 1)';
                    track.style.transform = 'translate3d(0, 0, 0)';

                    window.setTimeout(() => {
                        track.style.transition = 'none';
                        cards[cards.length - 1].remove();
                        clone.removeAttribute('data-carousel-clone');
                        track.style.transform = 'translate3d(0, 0, 0)';
                        container.scrollLeft = 0;
                        track.offsetHeight;
                        track.style.transition = '';
                        container.classList.remove('is-sliding');
                        container.dataset.sliding = 'false';
                    }, 580);
                }
            };

            // AUTO ROTATION (7s)
            if (window.serviceAutoScroll) clearInterval(window.serviceAutoScroll);

            const startServiceAutoScroll = () => {
                clearInterval(window.serviceAutoScroll);
                window.serviceAutoScroll = setInterval(() => rotateServices(1), 7000);
            };

            const pause = () => clearInterval(window.serviceAutoScroll);
            const resume = () => startServiceAutoScroll();
            let serviceTouchStartX = 0;
            let serviceTouchStartY = 0;
            let serviceTouchDeltaX = 0;
            let serviceTouchDeltaY = 0;
            let serviceTouchMoved = false;

            container.addEventListener('mousedown', pause);
            container.addEventListener('mouseup', resume);
            container.addEventListener('mouseleave', resume);
            container.addEventListener('touchstart', (event) => {
                const touch = event.touches && event.touches[0];
                if (!touch) return;
                pause();
                serviceTouchStartX = touch.clientX;
                serviceTouchStartY = touch.clientY;
                serviceTouchDeltaX = 0;
                serviceTouchDeltaY = 0;
                serviceTouchMoved = false;
            }, { passive: true });
            container.addEventListener('touchmove', (event) => {
                const touch = event.touches && event.touches[0];
                if (!touch) return;
                serviceTouchDeltaX = touch.clientX - serviceTouchStartX;
                serviceTouchDeltaY = touch.clientY - serviceTouchStartY;
                serviceTouchMoved = Math.abs(serviceTouchDeltaX) > 12;
                if (Math.abs(serviceTouchDeltaX) > Math.abs(serviceTouchDeltaY) * 1.2) {
                    event.preventDefault();
                }
            }, { passive: false });
            container.addEventListener('touchend', () => {
                const isHorizontalSwipe = serviceTouchMoved
                    && Math.abs(serviceTouchDeltaX) > 45
                    && Math.abs(serviceTouchDeltaX) > Math.abs(serviceTouchDeltaY) * 1.2;

                if (isHorizontalSwipe) {
                    rotateServices(serviceTouchDeltaX < 0 ? 1 : -1);
                }
                resume();
            });
            container.addEventListener('touchcancel', resume);

            window.moveCarousel = (direction) => {
                rotateServices(direction);
                startServiceAutoScroll();
            };

            startServiceAutoScroll();

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

    // Fallback before Firebase finishes replacing it with loop-aware navigation.
    window.moveCarousel = (direction) => {
        const container = document.getElementById('dynamic-services-container');
        if (container) container.scrollBy({ left: direction * 380, behavior: 'smooth' });
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
    function escapeAboutBookHtml(value = '') {
        return String(value || '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function decodeAboutBookHtml(value = '') {
        const textarea = document.createElement('textarea');
        let decoded = String(value || '');
        for (let i = 0; i < 3; i += 1) {
            textarea.innerHTML = decoded;
            const next = textarea.value;
            if (next === decoded) break;
            decoded = next;
        }
        return decoded;
    }

    function plainAboutBookText(value = '') {
        return decodeAboutBookHtml(value)
            .replace(/<\/p\s*>/gi, '\n\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\u00a0/g, ' ')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n[ \t]+/g, '\n')
            .replace(/[ \t]{2,}/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function renderAboutBookParagraphs(value = '') {
        const cleanText = plainAboutBookText(value);
        if (!cleanText) return '';
        return cleanText
            .split(/\n\s*\n/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph) => `<p>${escapeAboutBookHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
            .join('');
    }

    function renderAboutMusicSection(music = {}) {
        const section = document.querySelector('.about-music-card--art');
        if (!section) return;

        const defaults = {
            enabled: true,
            kicker: 'Música autoral',
            title: 'A voz como extensão do caminho criativo',
            text: 'Para além do trabalho terapêutico e artístico, Rita Barata explora também a música como espaço de expressão, presença e escuta interior. Como cantautora, a sua voz abre caminho a temas ligados à sensibilidade, à transformação e à intimidade com o mundo interno.',
            quote: 'Que a voz encontre casa no corpo, no silêncio e na expressão.',
            youtube_url: 'https://www.youtube.com/@_ritabarata/videos',
            spotify_url: 'https://open.spotify.com/artist/4PrCdnwvQQEn01MKOLuWwq'
        };
        const displayMusic = { ...defaults, ...(music || {}) };

        if (displayMusic.enabled === false) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');
        section.innerHTML = `
            ${displayMusic.kicker ? `<p class="svc-kicker">${escapeAboutBookHtml(displayMusic.kicker)}</p>` : ''}
            ${displayMusic.title ? `<h2 id="about-music-title">${escapeAboutBookHtml(displayMusic.title)}</h2>` : ''}
            ${renderAboutBookParagraphs(displayMusic.text)}
            ${displayMusic.quote ? `<blockquote>${escapeAboutBookHtml(displayMusic.quote)}</blockquote>` : ''}
            <div class="about-music-actions">
                ${displayMusic.youtube_url ? `
                    <a href="${escapeAboutBookHtml(displayMusic.youtube_url)}" target="_blank" rel="noopener noreferrer" class="about-music-link">
                        <i data-lucide="youtube"></i>
                        Ouvir no YouTube
                    </a>
                ` : ''}
                ${displayMusic.spotify_url ? `
                    <a href="${escapeAboutBookHtml(displayMusic.spotify_url)}" target="_blank" rel="noopener noreferrer" class="about-music-link">
                        <i data-lucide="music-2"></i>
                        Ouvir no Spotify
                    </a>
                ` : ''}
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
    }

    function getAboutBookEmbedUrl(url = '') {
        const rawUrl = String(url || '').trim();
        if (!rawUrl) return '';
        try {
            const parsed = new URL(rawUrl);
            const host = parsed.hostname.replace(/^www\./, '');
            if (host === 'youtu.be') {
                const id = parsed.pathname.split('/').filter(Boolean)[0];
                return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : rawUrl;
            }
            if (host.includes('youtube.com')) {
                const id = parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop();
                return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : rawUrl;
            }
            if (host.includes('vimeo.com')) {
                const id = parsed.pathname.split('/').filter(Boolean).pop();
                return id ? `https://player.vimeo.com/video/${encodeURIComponent(id)}` : rawUrl;
            }
        } catch (error) {
            return rawUrl;
        }
        return rawUrl;
    }

    function renderAboutBookTrailer(url = '') {
        const trailer = document.getElementById('about-book-trailer');
        if (!trailer) return;
        const rawUrl = String(url || '').trim();
        if (!rawUrl) {
            trailer.classList.add('hidden');
            trailer.innerHTML = '';
            return;
        }
        trailer.classList.remove('hidden');
        const embedUrl = getAboutBookEmbedUrl(rawUrl);
        const isDirectVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(rawUrl);
        trailer.innerHTML = `
            <div class="about-book-video-frame">
                ${isDirectVideo
                ? `<video src="${escapeAboutBookHtml(rawUrl)}" controls preload="metadata"></video>`
                : `<iframe src="${escapeAboutBookHtml(embedUrl)}" title="Book Trailer" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`}
            </div>
        `;
    }

    function setAboutBookTrailerVisible(show) {
        const trailer = document.getElementById('about-book-trailer');
        const button = document.querySelector('[data-about-book-trailer]');
        if (!trailer) return;

        trailer.classList.toggle('hidden', !show);
        if (button) {
            button.textContent = show ? 'Fechar Trailer' : 'Book Trailer';
            button.setAttribute('aria-expanded', String(show));
        }

        const iframe = trailer.querySelector('iframe[data-src]');
        if (iframe && show && !iframe.src) {
            iframe.src = iframe.dataset.src;
        }
        const video = trailer.querySelector('video');
        if (video && !show) {
            video.pause();
        }
    }

    function setupAboutBookOrderForm() {
        const form = document.getElementById('about-book-order-form');
        if (!form || form.dataset.bound) return;
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const name = document.getElementById('about-book-order-name')?.value.trim() || '';
            const address = document.getElementById('about-book-order-address')?.value.trim() || '';
            const contact = document.getElementById('about-book-order-contact')?.value.trim() || '';
            const payment = form.querySelector('input[name="about-book-payment"]:checked')?.value || '';
            const subject = 'Encomenda do livro Um dia acordei e não sabia quem era';
            const orderRows = [
                ['Nome', name],
                ['Morada de envio', address],
                ['Contacto', contact],
                ['Opção de pagamento', payment]
            ];
            const body = [
                'Olá,',
                '',
                'Gostaria de encomendar o livro "Um dia acordei e não sabia quem era".',
                '',
                ...orderRows.flatMap(([label, value]) => [`${label}:`, value, '']),
                '',
                'Obrigado/a.'
            ].join('\n');
            form.classList.add('hidden');
            window.location.href = `mailto:floresceterapias@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        });
        form.dataset.bound = 'true';
    }

    function renderAboutBookSection(book = {}) {
        const section = document.getElementById('about-book-section');
        if (!section) return;

        const defaults = {
            kicker: 'Livro publicado',
            title: 'Um dia acordei e não sabia quem era',
            subtitle: 'diário de bordo de uma viagem interna',
            publisher: 'Moonlight Edições',
            year: '2021',
            paper_price: '14 EUR'
        };
        const displayBook = { ...defaults, ...(book || {}) };
        const coverUrl = displayBook.cover_url || displayBook.cover || displayBook.image_url || displayBook.image || '';
        const trailerUrl = displayBook.trailer_url || displayBook.book_trailer_url || '';
        const isEnabled = book && book.enabled;
        section.classList.toggle('hidden', !isEnabled);
        if (!isEnabled) return;

        const cover = document.getElementById('about-book-cover');
        const kicker = document.getElementById('about-book-kicker');
        const title = document.getElementById('about-book-title');
        const meta = document.getElementById('about-book-meta');
        const synopsis = document.getElementById('about-book-synopsis');
        const price = document.getElementById('about-book-price');
        const actions = document.getElementById('about-book-actions');
        const container = section.querySelector('.about-book-container');

        if (container) container.classList.toggle('about-book-container--no-cover', !coverUrl);

        if (cover) {
            cover.classList.toggle('hidden', !coverUrl);
            cover.innerHTML = coverUrl
                ? `<img src="${escapeAboutBookHtml(coverUrl)}" alt="${escapeAboutBookHtml(displayBook.title || 'Livro de Rita Barata')}">`
                : '';
        }
        if (title) title.textContent = displayBook.subtitle ? `${displayBook.title} -` : displayBook.title;
        if (kicker) kicker.textContent = displayBook.kicker || '';

        if (meta) {
            const subtitleHtml = displayBook.subtitle
                ? `<span class="about-book-subtitle">${escapeAboutBookHtml(displayBook.subtitle)}</span>`
                : '';
            const publisherHtml = [displayBook.publisher, displayBook.year].filter(Boolean).join(', ');
            meta.innerHTML = [
                subtitleHtml,
                publisherHtml ? `<span class="about-book-publisher">${escapeAboutBookHtml(publisherHtml)}</span>` : ''
            ].filter(Boolean).join('');
        }

        if (synopsis) {
            synopsis.innerHTML = renderAboutBookParagraphs(displayBook.synopsis);
        }

        if (price) {
            const priceText = String(displayBook.paper_price || '').trim();
            price.classList.toggle('hidden', !priceText);
            price.textContent = priceText ? `Preço: ${priceText}` : '';
        }

        if (actions) {
            const buttons = [];
            buttons.push('<button type="button" class="about-book-button" data-about-book-order>Encomendar</button>');
            actions.innerHTML = buttons.join('');
            actions.querySelector('[data-about-book-order]')?.addEventListener('click', () => {
                const orderForm = document.getElementById('about-book-order-form');
                if (!orderForm) return;
                const willOpen = orderForm.classList.contains('hidden');
                orderForm.classList.toggle('hidden');
                if (willOpen) {
                    requestAnimationFrame(() => orderForm.scrollIntoView({ behavior: 'smooth', block: 'center' }));
                }
            });
        }

        renderAboutBookTrailer(trailerUrl);
        setupAboutBookOrderForm();

        if (window.lucide) window.lucide.createIcons();
    }

    function renderMembersShowcase(showcase = {}) {
        if (!document.querySelector('.members-showcase-page')) return;

        const defaults = {
            preview_visible: true,
            summary_visible: true,
            locker_visible: true,
            access_visible: true,
            cta_visible: true,
            hero_kicker: 'Área reservada',
            hero_title: 'Um espaço de continuidade para o teu caminho interior',
            hero_text: 'A Área de Membros reúne meditações guiadas, áudios, práticas e recursos de apoio para regressares ao corpo, à escuta e à tua presença, ao teu ritmo.',
            hero_primary: 'Pedir acesso',
            hero_secondary: 'Entrar',
            preview_kicker: 'O que encontras dentro',
            preview_title: 'Conteúdos para voltar a ti sem pressa',
            preview_text: 'A montra mostra apenas uma parte do que existe na área reservada. O acesso completo aos áudios, meditações e materiais acontece depois do registo e da aprovação pelo administrador.',
            summary_1_label: 'Meditações guiadas',
            summary_1_text: 'Escuta, presença e integração',
            summary_2_label: 'Áudios de acompanhamento',
            summary_2_text: 'Recursos para regressar ao centro',
            summary_3_label: 'Práticas e propostas',
            summary_3_text: 'Exercícios simples para o dia a dia',
            locker_kicker: 'Montra',
            locker_title: 'Alguns espaços que podes encontrar',
            card_1_type: 'Audio',
            card_1_title: 'Meditações guiadas',
            card_1_text: 'Viagens sonoras para apoiar momentos de pausa, clareza e reconexão interior.',
            card_2_type: 'Pratica',
            card_2_title: 'Exercícios de presença',
            card_2_text: 'Propostas simples para observar o corpo, a energia, a respiração e os movimentos internos.',
            card_3_type: 'Escrita',
            card_3_title: 'Guias de journaling',
            card_3_text: 'Perguntas e pequenos rituais de escrita para trazer mais verdade ao que estás a viver.',
            access_kicker: 'Como funciona',
            access_title: 'O acesso é cuidado, humano e aprovado pela equipa',
            step_0_text: 'Acesso gratuito, apenas requer registo.',
            step_1_text: 'Cria a tua conta com nome, email e password.',
            step_2_text: 'O pedido fica pendente até ser validado pelo administrador.',
            step_3_text: 'Depois da aprovação, entras na área completa e acedes aos recursos disponíveis.',
            cta_kicker: 'Quando fizer sentido',
            cta_title: 'Pede acesso e entra quando o teu processo pedir continuidade',
            cta_primary: 'Pedir acesso'
        };
        const hasSavedShowcase = Boolean(showcase && Object.keys(showcase).length);
        const data = hasSavedShowcase ? { ...(showcase || {}) } : { ...defaults };
        const textMap = {
            'members-hero-kicker': data.hero_kicker,
            'members-hero-title': data.hero_title,
            'members-hero-text': data.hero_text,
            'members-hero-primary': data.hero_primary,
            'members-hero-secondary': data.hero_secondary,
            'members-preview-kicker': data.preview_kicker,
            'members-preview-title': data.preview_title,
            'members-preview-text': data.preview_text,
            'members-summary-1-label': data.summary_1_label,
            'members-summary-1-text': data.summary_1_text,
            'members-summary-2-label': data.summary_2_label,
            'members-summary-2-text': data.summary_2_text,
            'members-summary-3-label': data.summary_3_label,
            'members-summary-3-text': data.summary_3_text,
            'members-locker-kicker': data.locker_kicker,
            'members-locker-title': data.locker_title,
            'members-card-1-type': data.card_1_type,
            'members-card-1-title': data.card_1_title,
            'members-card-1-text': data.card_1_text,
            'members-card-2-type': data.card_2_type,
            'members-card-2-title': data.card_2_title,
            'members-card-2-text': data.card_2_text,
            'members-card-3-type': data.card_3_type,
            'members-card-3-title': data.card_3_title,
            'members-card-3-text': data.card_3_text,
            'members-access-kicker': data.access_kicker,
            'members-access-title': data.access_title,
            'members-step-0-text': data.step_0_text,
            'members-step-1-text': data.step_1_text,
            'members-step-2-text': data.step_2_text,
            'members-step-3-text': data.step_3_text,
            'members-cta-kicker': data.cta_kicker,
            'members-cta-title': data.cta_title,
            'members-cta-primary': data.cta_primary
        };

        Object.entries(textMap).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (!el) return;
            const text = String(value || '').trim();
            el.textContent = text;
            el.classList.toggle('hidden', !text);
        });

        const toggleByContent = (selector, fields = []) => {
            const el = document.querySelector(selector);
            if (!el) return;
            const hasContent = fields.some((field) => String(data[field] || '').trim());
            el.classList.toggle('hidden', !hasContent);
        };

        const applyStep = (selector, field) => {
            const step = document.querySelector(selector);
            if (!step) return;
            const text = String(data[field] || '').trim();
            step.classList.toggle('hidden', !text);
            const number = step.querySelector('span');
            if (number) number.classList.toggle('hidden', !text);
        };

        const previewIntro = document.querySelector('.members-preview-intro');
        const hasPreviewContent = ['preview_kicker', 'preview_title', 'preview_text'].some((field) => String(data[field] || '').trim());
        if (previewIntro) previewIntro.classList.toggle('hidden', data.preview_visible === false || !hasPreviewContent);

        toggleByContent('.members-preview-list div:nth-child(1)', ['summary_1_label', 'summary_1_text']);
        toggleByContent('.members-preview-list div:nth-child(2)', ['summary_2_label', 'summary_2_text']);
        toggleByContent('.members-preview-list div:nth-child(3)', ['summary_3_label', 'summary_3_text']);
        const summaryList = document.querySelector('.members-preview-list');
        let hasSummaryContent = false;
        if (summaryList) {
            hasSummaryContent = ['summary_1_label', 'summary_1_text', 'summary_2_label', 'summary_2_text', 'summary_3_label', 'summary_3_text']
                .some((field) => String(data[field] || '').trim());
            summaryList.classList.toggle('hidden', data.summary_visible === false || !hasSummaryContent);
        }

        toggleByContent('.members-locker-card:nth-child(1)', ['card_1_type', 'card_1_title', 'card_1_text']);
        toggleByContent('.members-locker-card:nth-child(2)', ['card_2_type', 'card_2_title', 'card_2_text']);
        toggleByContent('.members-locker-card:nth-child(3)', ['card_3_type', 'card_3_title', 'card_3_text']);

        applyStep('.members-access-steps li:nth-child(1)', 'step_0_text');
        applyStep('.members-access-steps li:nth-child(2)', 'step_1_text');
        applyStep('.members-access-steps li:nth-child(3)', 'step_2_text');
        applyStep('.members-access-steps li:nth-child(4)', 'step_3_text');

        const previewBand = document.querySelector('.members-preview-band');
        if (previewBand) {
            const showPreview = data.preview_visible !== false && hasPreviewContent;
            const showSummary = data.summary_visible !== false && hasSummaryContent;
            previewBand.classList.toggle('hidden', !showPreview && !showSummary);
        }
        toggleByContent('.members-locker-section', [
            'locker_kicker', 'locker_title',
            'card_1_type', 'card_1_title', 'card_1_text',
            'card_2_type', 'card_2_title', 'card_2_text',
            'card_3_type', 'card_3_title', 'card_3_text'
        ]);
        if (data.locker_visible === false) {
            document.querySelector('.members-locker-section')?.classList.add('hidden');
        }
        toggleByContent('.members-access-section', ['access_kicker', 'access_title', 'step_0_text', 'step_1_text', 'step_2_text', 'step_3_text']);
        if (data.access_visible === false) {
            document.querySelector('.members-access-section')?.classList.add('hidden');
        }
        toggleByContent('.members-showcase-cta', ['cta_kicker', 'cta_title', 'cta_primary']);
        if (data.cta_visible === false) {
            document.querySelector('.members-showcase-cta')?.classList.add('hidden');
        }
    }

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

                    if (heroTitle && data.home.title) {
                        heroTitle.textContent = data.home.title;
                        heroTitle.classList.remove('cms-pending');
                    }
                    if (heroSubtitle && data.home.subtitle) {
                        heroSubtitle.textContent = data.home.subtitle;
                        heroSubtitle.classList.remove('cms-pending');
                    }
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

                    if (aboutTitle && data.home_about.title) {
                        aboutTitle.textContent = data.home_about.title;
                        aboutTitle.classList.remove('cms-pending');
                    }
                    if (aboutText && data.home_about.text) {
                        aboutText.innerHTML = data.home_about.text;
                        aboutText.classList.remove('cms-pending');
                    }

                    if (aboutImg && data.home_about.image_url) {
                        aboutImg.innerHTML = `<img src="${data.home_about.image_url}" alt="Sobre Mim - Resumo">`;
                        // Ensure generic styles don't conflict
                        aboutImg.style.backgroundImage = 'none';
                    }
                }

                renderMembersShowcase(data.members_showcase || {});

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
                    if (pageTitle && data.about.title) {
                        pageTitle.textContent = data.about.title;
                        pageTitle.classList.remove('cms-pending');
                    }
                    renderAboutBookSection(data.about.book || {});
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
                const aboutTitle = about.title || about.page_title || about.intro?.title || '';
                if (titleEl && aboutTitle) {
                    titleEl.innerText = aboutTitle;
                    titleEl.classList.remove('cms-pending');
                }

                const introTextEl = document.getElementById('about-text-intro-display');
                // Keys based on typical CMS patterns: text_intro, intro_text, or nested intro.text
                const introText = about.text_intro || about.intro_text || about.intro?.text;
                if (introTextEl && introText) {
                    introTextEl.innerHTML = introText;
                    introTextEl.classList.remove('cms-pending');
                }
                const setAboutSectionHeading = (prefix, kickerValue = '', titleValue = '') => {
                    const heading = document.getElementById(`about-${prefix}-heading`);
                    const kicker = document.getElementById(`about-${prefix}-kicker-display`);
                    const headingTitle = document.getElementById(`about-${prefix}-title-display`);
                    const hasContent = Boolean(kickerValue || titleValue);
                    if (heading) heading.classList.toggle('hidden', !hasContent);
                    if (kicker) {
                        kicker.textContent = kickerValue || '';
                        kicker.classList.toggle('hidden', !kickerValue);
                    }
                    if (headingTitle) {
                        headingTitle.textContent = titleValue || '';
                        headingTitle.classList.toggle('hidden', !titleValue);
                    }
                };
                setAboutSectionHeading('intro', about.intro_kicker || '', about.intro_title || '');

                const artTextEl = document.getElementById('about-text-art-display');
                const artText = about.text_art || about.art_text || about.art?.text;
                if (artTextEl && artText) {
                    artTextEl.innerHTML = artText;
                    artTextEl.classList.remove('cms-pending');
                }
                setAboutSectionHeading('art', about.art_kicker || '', about.art_title || '');

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

                renderAboutMusicSection(about.music || {});
                renderAboutBookSection(about.book || {});

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

// --- Individual Service Pages (static SEO pages + CMS/Firebase visuals) ---
window.servicePageMap = window.servicePageMap || {
    aura: 'leitura-aura.html',
    innerdance: 'innerdance.html',
    constelacoes: 'constelacoes.html'
};

window.loadIndividualServicePage = async function () {
    const serviceId = window.SERVICE_PAGE_ID;
    if (!serviceId) return;

    if (!window.db) {
        setTimeout(window.loadIndividualServicePage, 500);
        return;
    }

    try {
        const doc = await window.db.collection('services').doc(serviceId).get();
        if (!doc.exists) return;

        const data = doc.data();
        const cols = data.customColors || {};

        const hero = document.getElementById('svc-ind-hero');
        if (hero && data.headerImage) {
            hero.style.backgroundImage = `linear-gradient(135deg, rgba(255,255,255,0.78), rgba(255,255,255,0.62)), url('${data.headerImage}')`;
            hero.style.backgroundSize = 'cover';
            hero.style.backgroundPosition = 'center';
        }

        renderIndividualServiceSection({
            sectionId: 'svc-section-1',
            boxId: 'svc-content-1-container',
            contentId: 'svc-content-1',
            title: data.section1_title || data.title,
            headingTag: 'h1',
            html: data.long_description,
            image: data.section1_image,
            sectionBg: cols.section1_bg,
            cardBg: cols.section1_card_bg,
            cardOpacity: cols.section1_card_opacity,
            textColor: cols.section1_text,
            showSchedule: cols.show_schedule_1 !== false,
            showContact: cols.show_contact_1 !== false
        });

        renderIndividualServiceSection({
            sectionId: 'svc-section-2',
            boxId: 'svc-content-2-container',
            contentId: 'svc-content-2',
            headingTag: 'h2',
            html: data.long_description_2,
            image: data.section2_image,
            sectionBg: cols.section2_bg,
            cardBg: cols.section2_card_bg,
            cardOpacity: cols.section2_card_opacity,
            textColor: cols.section2_text,
            showSchedule: cols.show_schedule_2 === true,
            showContact: cols.show_contact_2 !== false,
            visible: cols.show_section_2 !== false
        });

        loadServiceEventMemories(serviceId);

        renderEditorialServiceSection(data.editorial_section);

        const secTesti = document.getElementById('svc-testimonials-section');
        if (secTesti) {
            if (data.testimonial_ids && data.testimonial_ids.length > 0) {
                secTesti.style.display = 'block';
                secTesti.classList.remove('svc-testimonials-section-hidden');

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
        }

        if (window.lucide) window.lucide.createIcons();
    } catch (err) {
        console.error("Error loading individual service page:", err);
    } finally {
        document.body.classList.remove('service-page-loading');
        document.body.classList.add('service-page-ready');
    }
};

function renderIndividualServiceSection(config) {
    const section = document.getElementById(config.sectionId);
    const box = document.getElementById(config.boxId);
    const content = document.getElementById(config.contentId);
    const hasContent = Boolean(config.html || config.image);

    if (!section || !content || !hasContent || config.visible === false) {
        if (section) section.style.display = 'none';
        return;
    }

    section.style.display = 'flex';
    section.classList.remove('hidden');

    if (config.image) {
        section.style.backgroundImage = `url('${config.image}')`;
        section.style.backgroundSize = 'cover';
        section.style.backgroundPosition = 'center';
    } else if (config.sectionBg) {
        section.style.backgroundImage = 'none';
        section.style.backgroundColor = config.sectionBg;
    }

    if (box) {
        const bgColor = config.cardBg || config.sectionBg || '#ffffff';
        const opacity = config.cardOpacity !== undefined ? config.cardOpacity : 0.9;
        box.style.setProperty('background-color', hexToRgba(bgColor, opacity), 'important');
        if (config.textColor) box.style.color = config.textColor;
    }

    let html = '';
    const headingTag = config.headingTag || 'h2';
    if (config.title) html += `<${headingTag}>${config.title}</${headingTag}>`;
    if (config.html) html += `<div class="svc-text">${config.html}</div>`;

    if (config.showSchedule || config.showContact) {
        html += '<div class="svc-btn-group">';
        if (config.showSchedule) html += '<a href="booking.html" class="btn btn-primary">Marcar Sessão</a>';
        if (config.showContact) {
            html += `<a href="https://wa.me/351913515406" target="_blank" rel="noopener noreferrer" class="btn btn-primary cta-whatsapp-btn">
                        <i data-lucide="message-circle" class="icon-sm"></i> Entra em contacto
                     </a>`;
        }
        html += '</div>';
    }

    content.innerHTML = html;
}

async function fetchEventMemories() {
    if (!window.db) return [];
    const snapshot = await window.db.collection('event_memories').get();
    const memories = [];
    snapshot.forEach(doc => memories.push({ id: doc.id, ...doc.data() }));
    return memories.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}

function escapeMemoryHtml(value = '') {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeMemoryAttr(value = '') {
    return escapeMemoryHtml(value).replace(/"/g, '&quot;');
}

function getMemoryServiceName(serviceId = '') {
    const labels = {
        innerdance: 'Innerdance',
        aura: 'Leitura de Aura',
        constelacoes: 'Constelações',
        geral: 'Floresce Terapias'
    };
    return labels[serviceId] || 'Floresce Terapias';
}

function getMemoryServiceUrl(serviceId = '') {
    const urls = {
        innerdance: '/innerdance',
        aura: '/leitura-aura',
        constelacoes: '/constelacoes'
    };
    return urls[serviceId] || '/';
}

function getVideoEmbedUrl(url = '') {
    const value = String(url || '').trim();
    if (!value) return '';
    const youtubeMatch = value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/i);
    if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    const vimeoMatch = value.match(/vimeo\.com\/(\d+)/i);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return value;
}

function normalizeMemoryList(memory, pluralField, singularField) {
    if (Array.isArray(memory[pluralField])) return memory[pluralField].filter(Boolean);
    return memory[singularField] ? [memory[singularField]] : [];
}

function ensureMemoryLightbox() {
    let lightbox = document.getElementById('memory-lightbox');
    if (lightbox) return lightbox;

    lightbox = document.createElement('div');
    lightbox.id = 'memory-lightbox';
    lightbox.className = 'memory-lightbox';
    lightbox.innerHTML = `
        <button type="button" class="memory-lightbox-close" aria-label="Fechar imagem ampliada">
            <i data-lucide="x"></i>
        </button>
        <img src="" alt="">
    `;
    document.body.appendChild(lightbox);

    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox || event.target.closest('.memory-lightbox-close')) {
            closeMemoryLightbox();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMemoryLightbox();
    });

    if (window.lucide) window.lucide.createIcons();
    return lightbox;
}

function openMemoryLightbox(src) {
    if (!src) return;
    const lightbox = ensureMemoryLightbox();
    const img = lightbox.querySelector('img');
    img.src = src;
    lightbox.classList.add('is-open');
    document.body.classList.add('memory-lightbox-open');
}

function closeMemoryLightbox() {
    const lightbox = document.getElementById('memory-lightbox');
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    document.body.classList.remove('memory-lightbox-open');
}

document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-memory-lightbox-src]');
    if (!trigger) return;
    event.preventDefault();
    openMemoryLightbox(trigger.dataset.memoryLightboxSrc);
});

function renderMemoryCard(memory, options = {}) {
    const gallery = Array.isArray(memory.gallery_urls) ? memory.gallery_urls.filter(Boolean) : [];
    const videos = normalizeMemoryList(memory, 'video_urls', 'video_url');
    const messages = normalizeMemoryList(memory, 'messages', 'message');
    const testimonials = normalizeMemoryList(memory, 'testimonials', 'testimonial');
    const testimonialAuthors = normalizeMemoryList(memory, 'testimonial_authors', 'testimonial_author');
    const image = memory.image_url || gallery[0] || '';
    const dateText = memory.dateDisplay || memory.date || '';
    const videoEmbed = getVideoEmbedUrl(videos[0]);
    const serviceName = getMemoryServiceName(memory.service_id);
    const serviceUrl = getMemoryServiceUrl(memory.service_id);
    const compact = options.compact !== false;

    let mediaHtml = '';
    if (image) {
        mediaHtml = `<button type="button" class="memory-lightbox-trigger" data-memory-lightbox-src="${escapeMemoryAttr(image)}" aria-label="Ampliar imagem">
            <img src="${escapeMemoryAttr(image)}" alt="${escapeMemoryAttr(memory.title || serviceName)}" loading="lazy">
        </button>`;
    } else if (videoEmbed) {
        mediaHtml = `<iframe src="${escapeMemoryAttr(videoEmbed)}" title="${escapeMemoryAttr(memory.title || 'Vídeo do encontro')}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    }

    const visibleGallery = gallery.filter(url => url !== image);
    const galleryHtml = visibleGallery.length
        ? `<div class="memory-gallery-block">
            <span class="memory-gallery-label">Galeria</span>
            <div class="memory-gallery-strip ${compact ? 'memory-gallery-strip-compact' : ''}">
                ${visibleGallery.slice(0, compact ? 8 : 12).map(url => `
                    <button type="button" class="memory-gallery-thumb memory-lightbox-trigger" data-memory-lightbox-src="${escapeMemoryAttr(url)}" aria-label="Ampliar fotografia da galeria">
                        <img src="${escapeMemoryAttr(url)}" alt="" loading="lazy">
                    </button>
                `).join('')}
            </div>
        </div>`
        : '';
    const videoPreviewCount = options.videoPreviewCount || (compact ? 2 : 3);
    const videoPreviewHtml = videos.length
        ? `<div class="memory-video-preview-grid">${videos.slice(0, videoPreviewCount).map((url, index) => {
            const embedUrl = getVideoEmbedUrl(url);
            return `<div class="memory-video-preview">
                <iframe src="${escapeMemoryAttr(embedUrl)}" title="${escapeMemoryAttr((memory.title || 'Vídeo do encontro') + ' ' + (index + 1))}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                <a class="memory-video-link" href="${escapeMemoryAttr(url)}" target="_blank" rel="noopener noreferrer">Abrir vídeo ${videos.length > 1 ? index + 1 : ''}</a>
            </div>`;
        }).join('')}</div>`
        : '';
    const messagesHtml = !compact && messages.length
        ? messages.map(message => `<p class="memory-message">${escapeMemoryHtml(message)}</p>`).join('')
        : '';
    const visibleTestimonials = compact ? testimonials.slice(0, 2) : testimonials;
    const testimonialsHtml = visibleTestimonials.length
        ? visibleTestimonials.map((text, index) => `<blockquote>${escapeMemoryHtml(text)}${testimonialAuthors[index] ? `<cite>${escapeMemoryHtml(testimonialAuthors[index])}</cite>` : ''}</blockquote>`).join('')
        : '';
    const extraVideoLinks = videos.length > videoPreviewCount
        ? videos.slice(videoPreviewCount).map((url, index) => `<a class="memory-video-link" href="${escapeMemoryAttr(url)}" target="_blank" rel="noopener noreferrer">Abrir vídeo ${videoPreviewCount + index + 1}</a>`).join('')
        : '';
    const videoLinksHtml = extraVideoLinks ? `<div class="memory-video-links">${extraVideoLinks}</div>` : '';

    return `
        <article class="memory-card">
            ${mediaHtml ? `<div class="memory-card-media">${mediaHtml}</div>` : ''}
            <div class="memory-card-body">
                <div class="memory-meta">
                    ${dateText ? `<span>${escapeMemoryHtml(dateText)}</span>` : ''}
                    ${memory.location ? `<span>${escapeMemoryHtml(memory.location)}</span>` : ''}
                    ${options.showService ? `<a href="${serviceUrl}">${serviceName}</a>` : ''}
                </div>
                <h3>${escapeMemoryHtml(memory.title || 'Encontro realizado')}</h3>
                ${memory.summary ? `<p>${escapeMemoryHtml(memory.summary)}</p>` : ''}
                ${messagesHtml}
                ${testimonialsHtml}
                ${videoPreviewHtml}
                ${videoLinksHtml}
                ${galleryHtml}
            </div>
        </article>
    `;
}

function getMemoryCounts(memory) {
    const gallery = Array.isArray(memory.gallery_urls) ? memory.gallery_urls.filter(Boolean) : [];
    const videos = normalizeMemoryList(memory, 'video_urls', 'video_url');
    const messages = normalizeMemoryList(memory, 'messages', 'message');
    const testimonials = normalizeMemoryList(memory, 'testimonials', 'testimonial');
    return {
        photos: gallery.length + (memory.image_url ? 1 : 0),
        videos: videos.length,
        messages: messages.length,
        testimonials: testimonials.length
    };
}

function truncateMemoryText(value = '', maxLength = 145) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

function renderMemoryIndicators(memory) {
    const counts = getMemoryCounts(memory);
    const items = [];
    if (counts.photos) items.push(`${counts.photos} foto${counts.photos === 1 ? '' : 's'}`);
    if (counts.videos) items.push(`${counts.videos} vídeo${counts.videos === 1 ? '' : 's'}`);
    if (counts.messages) items.push(`${counts.messages} partilha${counts.messages === 1 ? '' : 's'}`);
    if (counts.testimonials) items.push(`${counts.testimonials} testemunho${counts.testimonials === 1 ? '' : 's'}`);
    return items.length ? `<div class="memory-archive-indicators">${items.map(item => `<span>${item}</span>`).join('')}</div>` : '';
}

function renderArchiveCard(memory, featured = false) {
    const gallery = Array.isArray(memory.gallery_urls) ? memory.gallery_urls.filter(Boolean) : [];
    const image = memory.image_url || gallery[0] || '';
    const dateText = memory.dateDisplay || memory.date || '';
    const serviceName = getMemoryServiceName(memory.service_id);
    const summary = truncateMemoryText(memory.summary || normalizeMemoryList(memory, 'messages', 'message')[0] || '', featured ? 210 : 135);

    return `
        <article class="memory-archive-card ${featured ? 'is-featured' : ''}" data-memory-service="${escapeMemoryAttr(memory.service_id || 'geral')}">
            ${image ? `
                <button type="button" class="memory-archive-image memory-lightbox-trigger" data-memory-lightbox-src="${escapeMemoryAttr(image)}" aria-label="Ampliar imagem">
                    <img src="${escapeMemoryAttr(image)}" alt="${escapeMemoryAttr(memory.title || serviceName)}" loading="lazy">
                </button>
            ` : '<div class="memory-archive-image memory-archive-image-empty"></div>'}
            <div class="memory-archive-card-body">
                <div class="memory-meta">
                    ${dateText ? `<span>${escapeMemoryHtml(dateText)}</span>` : ''}
                    ${memory.location ? `<span>${escapeMemoryHtml(memory.location)}</span>` : ''}
                    <span>${serviceName}</span>
                </div>
                <h2>${escapeMemoryHtml(memory.title || 'Encontro realizado')}</h2>
                ${summary ? `<p>${escapeMemoryHtml(summary)}</p>` : ''}
                ${renderMemoryIndicators(memory)}
                <button type="button" class="memory-archive-toggle" data-memory-toggle="${escapeMemoryAttr(memory.id)}">Ver partilha</button>
            </div>
            <div class="memory-archive-details" id="memory-details-${escapeMemoryAttr(memory.id)}">
                ${renderMemoryCard(memory, { compact: false, showService: featured, videoPreviewCount: 3 })}
            </div>
        </article>
    `;
}

async function loadServiceEventMemories(serviceId) {
    const section = document.getElementById('svc-event-memories-section');
    const container = document.getElementById('svc-event-memories-grid');
    if (!section || !container || !serviceId) return;

    if (!window.db) {
        setTimeout(() => loadServiceEventMemories(serviceId), 500);
        return;
    }

    try {
        const memories = (await fetchEventMemories())
            .filter(item => item.show_on_service !== false)
            .filter(item => item.service_id === serviceId)
            .slice(0, 3);

        if (!memories.length) {
            section.style.display = 'none';
            return;
        }

        container.classList.toggle('memory-grid-count-1', memories.length === 1);
        container.innerHTML = memories.map(memory => renderMemoryCard(memory, { compact: true, videoPreviewCount: 2 })).join('');
        section.style.display = 'block';
        section.classList.remove('hidden');
    } catch (err) {
        console.error('Error loading service event memories:', err);
        section.style.display = 'none';
    }
}

window.loadEventMemoriesArchive = async function () {
    const container = document.getElementById('event-memories-archive-grid');
    const featuredContainer = document.getElementById('event-memories-featured');
    if (!container) return;

    if (!window.db) {
        setTimeout(window.loadEventMemoriesArchive, 500);
        return;
    }

    try {
        const memories = (await fetchEventMemories())
            .filter(item => item.show_on_archive !== false);

        if (!memories.length) {
            container.innerHTML = '<p class="memory-empty">Ainda não existem encontros realizados para mostrar.</p>';
            if (featuredContainer) featuredContainer.innerHTML = '';
            document.body.classList.add('memory-archive-empty');
            return;
        }

        document.body.classList.remove('memory-archive-empty');
        const [featured, ...rest] = memories;
        if (featuredContainer) featuredContainer.innerHTML = renderArchiveCard(featured, true);
        container.innerHTML = rest.length
            ? rest.map(memory => renderArchiveCard(memory, false)).join('')
            : '<p class="memory-empty">Sem mais encontros para mostrar.</p>';
        setupMemoryArchiveInteractions();
    } catch (err) {
        console.error('Error loading event memories archive:', err);
        container.innerHTML = '<p class="memory-empty">Erro ao carregar encontros realizados.</p>';
    }
};

function setupMemoryArchiveInteractions() {
    document.querySelectorAll('[data-memory-toggle]').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.memoryToggle;
            const card = button.closest('.memory-archive-card');
            document.querySelectorAll('.memory-archive-card.is-open').forEach(openCard => {
                if (openCard !== card) {
                    openCard.classList.remove('is-open');
                    const openButton = openCard.querySelector('[data-memory-toggle]');
                    if (openButton) openButton.textContent = 'Ver partilha';
                }
            });
            const isOpen = card.classList.toggle('is-open');
            button.textContent = isOpen ? 'Fechar partilha' : 'Ver partilha';
            const details = document.getElementById(`memory-details-${id}`);
            if (details && isOpen) details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    });

    document.querySelectorAll('[data-memory-filter]').forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.dataset.memoryFilter;
            document.querySelectorAll('[data-memory-filter]').forEach(item => item.classList.toggle('active', item === button));
            document.querySelectorAll('.memory-archive-card').forEach(card => {
                const service = card.dataset.memoryService || 'geral';
                card.classList.toggle('hidden', filter !== 'all' && service !== filter);
            });
        });
    });
}

function escapeServiceHtml(value = '') {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeServiceAttr(value = '') {
    return escapeServiceHtml(value).replace(/"/g, '&quot;');
}

function containsHtml(value = '') {
    return /<\/?[a-z][\s\S]*>/i.test(String(value));
}

function renderRichServiceText(value = '') {
    const text = String(value || '').trim();
    if (!text) return '';
    if (containsHtml(text)) return text;
    return text.split(/\n+/).map(item => item.trim()).filter(Boolean).map(item => `<p>${escapeServiceHtml(item)}</p>`).join('');
}

function renderInlineServiceText(value = '') {
    const text = String(value || '').trim();
    if (!text) return '';
    return containsHtml(text) ? text : escapeServiceHtml(text);
}

function serviceParagraphs(value) {
    if (Array.isArray(value)) return value;
    return String(value || '').split(/\n+/).map(item => item.trim()).filter(Boolean);
}

function renderEditorialServiceSection(editorial) {
    const section = document.querySelector('.svc-editorial-section');
    if (!section || !editorial) return;

    if (editorial.enabled === false) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    const style = editorial.style || {};
    const bgColor = style.bgColor || '#f7f2e0';
    const bgOpacity = style.bgOpacity !== undefined ? style.bgOpacity : 0.95;
    const titleColor = style.titleColor || '#80864f';
    const bodyColor = style.bodyColor || '#333333';
    const accentColor = style.accentColor || '#BF897F';

    if (style.bgImage) {
        section.style.backgroundImage = `linear-gradient(180deg, ${hexToRgba(bgColor, bgOpacity)}, ${hexToRgba(bgColor, bgOpacity)}), url('${style.bgImage}')`;
        section.style.backgroundSize = 'cover';
        section.style.backgroundPosition = 'center';
    } else {
        section.style.backgroundImage = 'none';
        section.style.backgroundColor = hexToRgba(bgColor, bgOpacity);
    }

    section.style.color = bodyColor;
    section.style.setProperty('--svc-editorial-title-color', titleColor);
    section.style.setProperty('--svc-editorial-body-color', bodyColor);
    section.style.setProperty('--svc-editorial-accent-color', accentColor);

    if (style.font === 'serif') {
        section.style.fontFamily = "var(--font-serif)";
    } else if (style.font === 'sans') {
        section.style.fontFamily = "var(--font-sans)";
    } else {
        section.style.fontFamily = '';
    }

    const intro = serviceParagraphs(editorial.intro);
    const howParagraphs = serviceParagraphs(editorial.how);
    const expectParagraphs = serviceParagraphs(editorial.expect);
    const aboutParagraphs = serviceParagraphs(editorial.about);
    const topics = Array.isArray(editorial.topics) ? editorial.topics.filter(Boolean) : [];
    const links = Array.isArray(editorial.links) ? editorial.links.filter(link => link && (link.url || link.label)) : [];
    const faqs = Array.isArray(editorial.faqs) ? editorial.faqs.filter(faq => faq && (faq.question || faq.answer)) : [];

    const paragraphHtml = (items) => items.map(text => renderRichServiceText(text)).join('');

    let html = `
        <div class="svc-container svc-editorial-container">
            <header class="svc-editorial-header">
                ${editorial.kicker ? `<p class="svc-kicker">${renderInlineServiceText(editorial.kicker)}</p>` : ''}
                ${editorial.title ? `<h2>${renderInlineServiceText(editorial.title)}</h2>` : ''}
                ${paragraphHtml(intro)}
            </header>
    `;

    if (topics.length) {
        html += `
            <h2>Para quem é indicado</h2>
            <ul class="svc-topic-grid">
                ${topics.map(text => `<li>${renderInlineServiceText(text)}</li>`).join('')}
            </ul>
        `;
    }

    if (howParagraphs.length) {
        html += `<h2>Como funciona uma sessão</h2>${paragraphHtml(howParagraphs)}`;
    }

    if (expectParagraphs.length) {
        html += `<h2>O que podes esperar</h2>${paragraphHtml(expectParagraphs)}`;
    }

    if (aboutParagraphs.length || links.length) {
        html += `<h2>Sobre Rita Barata</h2>${paragraphHtml(aboutParagraphs)}`;
    }

    if (links.length) {
        html += `
            <nav class="svc-related-links" aria-label="Conteúdos relacionados">
                ${links.map(link => `
                    <a href="${escapeServiceAttr(link.url || '#')}">
                        ${link.eyebrow ? `<span>${renderInlineServiceText(link.eyebrow)}</span>` : ''}
                        <strong>${renderInlineServiceText(link.label || link.url || 'Saber mais')}</strong>
                    </a>
                `).join('')}
            </nav>
        `;
    }

    if (faqs.length) {
        html += `
            <div class="svc-faq-list">
                <h2>Perguntas frequentes</h2>
                ${faqs.map(faq => `
                    <article>
                        ${faq.question ? `<h3>${renderInlineServiceText(faq.question)}</h3>` : ''}
                        ${faq.answer ? renderRichServiceText(faq.answer) : ''}
                    </article>
                `).join('')}
            </div>
        `;
    }

    html += `
            <div class="svc-btn-group">
                <a href="/booking" class="btn btn-primary">Agendar sessão</a>
                <a href="https://wa.me/351913515406" class="btn btn-primary cta-whatsapp-btn" target="_blank" rel="noopener noreferrer">
                    <i data-lucide="message-circle" class="icon-sm"></i> Falar por WhatsApp
                </a>
            </div>
        </div>
    `;

    section.innerHTML = html;
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

