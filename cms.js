// No imports needed - using global window.db and window.auth from init-firebase.js (Compat SDK)

// Admin Emails
// Admin Emails
if (typeof ADMIN_EMAILS === 'undefined') {
    var ADMIN_EMAILS = [
        "floresceterapias@gmail.com",
        "barata.rita@outlook.com",
        "baratacarlos65@gmail.com",
        "carlos.barata@example.com"
    ];
}



// Helper: Verify Status (Global for Dashboard.html)
window.verifyUserStatus = async (email) => {
    if (!email) return false;
    const lowerEmail = email.toLowerCase();
    const isAdmin = ADMIN_EMAILS.some(e => e && e.toLowerCase() === lowerEmail);
    console.log("verifyUserStatus check:", email, "Is Admin?", isAdmin);

    if (isAdmin) {
        const toggleBtn = document.getElementById('admin-toggle-btn');
        if (toggleBtn) {
            toggleBtn.style.display = 'inline-flex';
            toggleBtn.classList.remove('hidden');
        }
    }
    return isAdmin;
};

// Helper: Convert File to Base64 (No Compression)

// Helper: Upload File to Firebase Storage
// Helper: Upload File to Firebase Storage (Generic)
// Helper: Upload File to Firebase Storage (Generic)
// Helper: Upload File to Firebase Storage (Generic)
const uploadImageToStorage = async (file, path) => {
    if (!file) return null;
    try {
        const storageRef = window.storage.ref();
        const fileRef = storageRef.child(path);
        const snapshot = await fileRef.put(file);
        return await fileRef.getDownloadURL();
    } catch (error) {
        console.error("Storage Upload Error:", error);
        throw error;
    }
};
window.uploadImageToStorage = uploadImageToStorage;

window.deleteFileFromStorage = async (url) => {
    if (!url || !url.startsWith('http')) return false;
    try {
        const ref = window.storage.refFromURL(url);
        await ref.delete();
        console.log('File deleted from storage:', url);
        return true;
    } catch (e) {
        console.error('Error deleting file:', e);
        return false;
    }
};

window.extractFilenameFromUrl = function (url) {
    if (!url) return '';
    try {
        if (url.includes('firebasestorage')) {
            // Extract after last slash and before ?
            let path = decodeURIComponent(url.split('?')[0]);
            let readableName = path.substring(path.lastIndexOf('/') + 1);
            // Remove timestamp prefix if present (123456789_)
            if (readableName.match(/^\d+_/)) {
                readableName = readableName.replace(/^\d+_/, '');
            }
            return readableName;
        } else if (url.includes('drive.google')) {
            return "Google Drive Link";
        } else if (url.includes('youtu')) {
            return "Vídeo YouTube";
        }
        return url.substring(0, 30) + "...";
    } catch (e) {
        return "Link ativo";
    }
};

/**
 * Renders a file preview card inside a container element.
 * Shows a thumbnail (images) or an icon (audio). Provides Keep/Remove buttons.
 * Deletion is DEFERRED — only happens on save via getExistingFileDecision.
 *
 * @param {string} containerId  - ID of the <div> to render into
 * @param {string} url          - The existing file URL (Firebase Storage)
 * @param {Object} [opts]       - { urlInputId, fileInputId } for clearing fields on remove
 */
window.renderFilePreview = function (containerId, url, opts = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!url) {
        container.innerHTML = '';
        container.dataset.existingUrl = '';
        container.dataset.pendingDelete = 'false';
        return;
    }

    const filename = window.extractFilenameFromUrl(url);
    const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)
        || url.includes('firebasestorage') && !url.match(/\.(mp3|wav|ogg|m4a)(\?|$)/i);
    const isAudio = url.match(/\.(mp3|wav|ogg|m4a)(\?|$)/i)
        || (url.includes('firebasestorage') && url.includes('audio'));

    container.dataset.existingUrl = url;
    container.dataset.pendingDelete = 'false';

    const mediaHtml = isImage
        ? `<img src="${url}" alt="${filename}" class="file-preview-thumb" onerror="this.style.display='none'">`
        : `<div class="file-preview-icon"><i data-lucide="music" class="icon-24"></i><span class="font-xs text-muted mt-5">${filename}</span></div>`;

    container.innerHTML = `
        <div class="file-preview-box" id="${containerId}-box">
            <div class="file-preview-media">${mediaHtml}</div>
            <div class="file-preview-info">
                <span class="font-xs text-muted text-truncate" title="${filename}">${filename}</span>
                <div class="file-preview-actions">
                    <button type="button"
                        class="file-preview-btn keep active"
                        id="${containerId}-keep-btn"
                        onclick="window._previewKeep('${containerId}')">
                        <i data-lucide="check" class="icon-12"></i> Manter
                    </button>
                    <button type="button"
                        class="file-preview-btn remove"
                        id="${containerId}-remove-btn"
                        onclick="window._previewRemove('${containerId}', '${opts.urlInputId || ''}', '${opts.fileInputId || ''}')">
                        <i data-lucide="trash-2" class="icon-12"></i> Remover
                    </button>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
};

window._previewKeep = function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.dataset.pendingDelete = 'false';
    const keepBtn = document.getElementById(containerId + '-keep-btn');
    const remBtn = document.getElementById(containerId + '-remove-btn');
    const box = document.getElementById(containerId + '-box');
    if (keepBtn) keepBtn.classList.add('active');
    if (remBtn) remBtn.classList.remove('active');
    if (box) box.classList.remove('pending-delete');
};

window._previewRemove = function (containerId, urlInputId, fileInputId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.dataset.pendingDelete = 'true';
    const keepBtn = document.getElementById(containerId + '-keep-btn');
    const remBtn = document.getElementById(containerId + '-remove-btn');
    const box = document.getElementById(containerId + '-box');
    if (keepBtn) keepBtn.classList.remove('active');
    if (remBtn) remBtn.classList.add('active');
    if (box) box.classList.add('pending-delete');
    // Clear the URL input so the save logic treats it as empty
    if (urlInputId) {
        const urlInput = document.getElementById(urlInputId);
        if (urlInput) { urlInput.value = ''; urlInput.dataset.originalUrl = ''; }
    }
};

/**
 * Returns the save-time decision for an existing file.
 * Call before every upload block in a submit handler.
 *
 * Returns:
 *   { action: 'keep' | 'remove' | 'replace', existingUrl: string }
 *
 *   keep    → reuse existingUrl, skip upload, skip delete
 *   remove  → delete existingUrl from Firebase, save null
 *   replace → delete existingUrl from Firebase (_before_ uploading new), upload new
 *
 * @param {string} containerId  - preview container ID
 * @param {boolean} hasNewFile  - true if the user selected a new file in input
 */
window.getExistingFileDecision = function (containerId, hasNewFile) {
    const container = document.getElementById(containerId);
    const existingUrl = container ? (container.dataset.existingUrl || '') : '';
    const pendingDelete = container ? (container.dataset.pendingDelete === 'true') : false;

    if (!existingUrl) {
        // Nothing existed before → just upload if there's a new file
        return { action: hasNewFile ? 'replace' : 'none', existingUrl: '' };
    }
    if (pendingDelete || hasNewFile) {
        return { action: pendingDelete && !hasNewFile ? 'remove' : 'replace', existingUrl };
    }
    return { action: 'keep', existingUrl };
};

window.setFileUrlInput = function (inputId, url) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.dataset.originalUrl = url || '';
    if (url && url.includes('firebasestorage')) {
        el.value = window.extractFilenameFromUrl(url);
    } else {
        el.value = url || '';
    }
};

window.getFileUrlInput = function (inputId) {
    const el = document.getElementById(inputId);
    if (!el) return '';
    if (el.dataset.originalUrl && el.value === window.extractFilenameFromUrl(el.dataset.originalUrl)) {
        return el.dataset.originalUrl;
    }
    return el.value;
};

window.removeFileWithUrl = async function (urlInputId, fileInputId) {
    const urlInput = document.getElementById(urlInputId);
    const fileInput = document.getElementById(fileInputId);
    if (!urlInput) return;

    if (urlInput.dataset.originalUrl || urlInput.value) {
        const realUrl = urlInput.dataset.originalUrl || urlInput.value;
        if (confirm('Tem a certeza que quer remover este ficheiro permanentemente?')) {
            const btn = window.event ? window.event.currentTarget : null;
            let originalHtml = '';
            if (btn) {
                originalHtml = btn.innerHTML;
                btn.innerHTML = '...';
                btn.disabled = true;
            }

            if (realUrl.includes('firebasestorage')) {
                await window.deleteFileFromStorage(realUrl);
            }
            urlInput.value = '';
            urlInput.dataset.originalUrl = '';
            if (fileInput) fileInput.value = '';

            if (btn) {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            }
        }
    } else {
        if (fileInput) fileInput.value = '';
    }
};

// Helper: Upload with Progress
const uploadFileWithProgress = (file, path, onProgress) => {
    return new Promise((resolve, reject) => {
        const storageRef = window.storage.ref();
        const fileRef = storageRef.child(path);
        const uploadTask = fileRef.put(file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress(progress);
            },
            (error) => {
                console.error("Upload error:", error);
                reject(error);
            },
            async () => {
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                resolve(downloadURL);
            }
        );
    });
};

// Clear Resource Logic
window.clearMeditationResource = async function () {
    const urlInput = document.getElementById('med-url');
    if (urlInput && urlInput.value && urlInput.value.includes('firebasestorage')) {
        if (!confirm("Tem a certeza que deseja remover este ficheiro DEFINITIVAMENTE?\n\nAção irreversível e será apagado do armazenamento.")) return;

        await window.deleteFileFromStorage(urlInput.value);
    } else {
        if (!confirm("Tem a certeza que deseja remover este link?")) return;
    }

    if (urlInput) urlInput.value = "";
    document.getElementById('med-audio-file').value = "";
    document.getElementById('current-resource-display').classList.add('hidden');

    // Hide dropdown/progress UI
    const pContainer = document.getElementById('audio-upload-progress');
    if (pContainer) pContainer.classList.add('hidden');
};

window.initCMS = function () {
    console.log("Initializing CMS (Global Mode)...");

    // FAST PATH: Apply Footer Styles from LocalStorage immediately
    try {
        const savedFooter = localStorage.getItem('site_footer');
        if (savedFooter) {
            const settings = JSON.parse(savedFooter);
            if (settings.bg_color) document.documentElement.style.setProperty('--color-footer-bg', settings.bg_color);
            if (settings.text_color) document.documentElement.style.setProperty('--color-footer-text', settings.text_color);

            // Apply text if elements exist (Dashboard footer)
            const footerTitle = document.getElementById('footer-title');
            const footerCopyright = document.getElementById('footer-copyright');
            const footerCredit = document.getElementById('footer-credit');

            if (footerTitle && settings.title !== undefined) footerTitle.innerHTML = settings.title;
            if (footerCopyright && settings.copyright !== undefined) footerCopyright.innerHTML = settings.copyright;
            if (footerCredit && settings.dev_credit !== undefined) footerCredit.innerHTML = settings.dev_credit;
        }
    } catch (e) {
        console.error("Error applying fast-path footer styles:", e);
    }

    // Wait for auth to be ready if it's not immediately available
    const checkAuth = () => {
        if (!window.auth) {
            setTimeout(checkAuth, 500);
            return;
        }

        window.auth.onAuthStateChanged((user) => {
            console.log("CMS Auth State:", user ? user.email : "No User");

            if (user) {
                const lowerEmail = user.email.toLowerCase();
                // Strict Admin Check: Only allow emails in the ADMIN_EMAILS list
                const isAdmin = ADMIN_EMAILS.some(e => e && e.toLowerCase() === lowerEmail);

                console.log("Is Admin?", isAdmin);

                if (isAdmin) {
                    const toggleBtn = document.getElementById('admin-toggle-btn');
                    const panel = document.getElementById('admin-panel');

                    if (panel && toggleBtn) {
                        console.log("Admin Panel and Toggle Button found. Revealing button.");
                        // Reveal toggle button
                        toggleBtn.style.display = 'inline-block';
                        toggleBtn.style.visibility = 'visible'; // Force visibility check

                        // Setup Toggle Logic
                        toggleBtn.onclick = () => {
                            if (panel.style.display === 'none' || panel.style.display === '') {
                                panel.style.display = 'block';
                                toggleBtn.innerHTML = '<i data-lucide="x"></i> Fechar Painel de Gestão';

                                // Load Services (and init TinyMCE) only when visible
                                loadServices();
                                // Also trigger resize to be safe
                                window.dispatchEvent(new Event('resize'));
                            } else {
                                panel.style.display = 'none';
                                toggleBtn.innerHTML = '<i data-lucide="settings"></i> Gerir Site';
                            }
                            lucide.createIcons();
                        };

                        // Pre-load other data
                        loadEvents();
                        loadReviews();
                        loadServices(); // Services restored
                        loadMeditations();
                        loadSiteContent(); // Load Home & About data
                    }
                } else {
                    // --- Non-admin member: verify status in Firestore ---
                    // This catches users with existing sessions who bypass the login page
                    if (window.db) {
                        window.db.collection('users').doc(user.email).get().then(docSnap => {
                            if (docSnap.exists) {
                                const status = docSnap.data().status;
                                if (status === 'pending') {
                                    alert('⏳ O teu acesso ainda está pendente de aprovação pelo administrador.\n\nReceberás confirmação assim que for ativado.');
                                    window.auth.signOut().then(() => {
                                        window.location.href = 'login.html';
                                    });
                                } else if (status === 'blocked') {
                                    alert('Esta conta foi suspensa. Contacta a administração.');
                                    window.auth.signOut().then(() => {
                                        window.location.href = 'login.html';
                                    });
                                }
                            }
                        }).catch(err => {
                            console.warn('Status check failed (non-blocking):', err);
                        });
                    }
                }
            } else {
                const panel = document.getElementById('admin-panel');
                if (panel) panel.style.display = 'none';
            }
        });
    };


    checkAuth();

    const eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.addEventListener('submit', handleEventSubmit);
    }

    // Listener for Testimonials
    if (document.getElementById('review-form')) {
        document.getElementById('review-form').addEventListener('submit', handleReviewSubmit);
    }

    // Listener for Meditations
    if (document.getElementById('meditation-form')) {
        document.getElementById('meditation-form').addEventListener('submit', handleMeditationSubmit);
    }

    // Listeners for Site Content (Home & About)
    if (document.getElementById('home-content-form')) {
        document.getElementById('home-content-form').addEventListener('submit', handleHomeSubmit);
    }
    if (document.getElementById('about-content-form')) {
        document.getElementById('about-content-form').addEventListener('submit', handleAboutSubmit);
    }
    if (document.getElementById('home-about-form')) {
        document.getElementById('home-about-form').addEventListener('submit', handleHomeAboutSubmit);
    }

    const serviceForm = document.getElementById('service-form');
    if (serviceForm) {
        // Use window.handleServiceSubmit from cms-services.js
        if (typeof window.handleServiceSubmit === 'function') {
            serviceForm.addEventListener('submit', window.handleServiceSubmit);
        } else {
            console.warn("handleServiceSubmit not found - check loading order.");
            // Fallback: try to find it on window after a short delay? 
            // Better to rely on dashboard.html calling initCMS() AFTER scripts load.
        }
    }

    const seedBtn = document.getElementById('seed-services-btn');
    if (seedBtn) {
        seedBtn.addEventListener('click', window.seedDefaultServices);
    }

    // Auto-Init TinyMCE on Accordion Open - DISABLED for Plain HTML mode
    /*
    const details = document.querySelectorAll('details.admin-card');
    details.forEach(detail => {
        detail.addEventListener('toggle', (e) => {
            if (detail.open) {
                const textareas = detail.querySelectorAll('textarea');
                textareas.forEach(ta => {
                    // ID white-list to avoid unwanted inits
                    if (['evt-desc', 'home-about-text-input', 'med-desc', 'rev-text', 'svc-desc', 'about-text'].includes(ta.id)) {
                        initTinyMCE(ta.value, ta.id);
                    }
                });
            }
        });
    });
    */

    // Specific Init for HTML Generator
    const htmlGenCard = document.getElementById('card-html-generator');
    if (htmlGenCard) {
        htmlGenCard.addEventListener('toggle', (e) => {
            if (htmlGenCard.open) {
                // Initialize if not already done
                if (window.tinymce && !tinymce.get('html-generator-editor')) {
                    initTinyMCE('', 'html-generator-editor');
                }
            }
        });
    }

    // Initialize Testimonials Selector
    if (typeof window.loadTestimonialsSelector === 'function') {
        window.loadTestimonialsSelector(new Set());
    }

    // Initialize Legal Content Editor (TinyMCE) & Form
    const legalCard = document.getElementById('card-legal');
    if (legalCard) {
        legalCard.addEventListener('toggle', (e) => {
            if (legalCard.open) {
                // Load Content First
                loadLegalContent().then(() => {
                    // Initialize TinyMCE if not already done
                    if (window.tinymce && !tinymce.get('legal-editor')) {
                        initTinyMCE(document.getElementById('legal-editor').value, 'legal-editor');
                    }
                });
            }
        });
    }

    const legalForm = document.getElementById('legal-form');
    if (legalForm) {
        legalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLegalSubmit();
        });
    }

    // Initialize Theme Form
    const themeForm = document.getElementById('theme-form');
    if (themeForm) {
        themeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleThemeSubmit(e);
        });
    }

    // NEW: Header Form Listener (Restored)
    const headerForm = document.getElementById('header-form');
    if (headerForm) {
        headerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleHeaderSubmit(e);
        });
    }

    // NEW: Footer Form Listener (Restored)
    const footerForm = document.getElementById('footer-form');
    if (footerForm) {
        footerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleFooterSubmit();
        });
    }

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleContactSubmit();
        });
    }

    const themeResetBtn = document.getElementById('theme-reset-btn');
    if (themeResetBtn) {
        themeResetBtn.addEventListener('click', resetThemeSettings);
    }

    // Initialize Dashboard Ordering (SortableJS)
    if (typeof window.loadDashboardOrder === 'function') {
        window.loadDashboardOrder();
    }
};

// --- SortableJS Dashboard Logic ---
window.loadDashboardOrder = async function () {
    const container = document.getElementById('dashboard-cards-container');
    if (!container || typeof Sortable === 'undefined') return;

    try {
        // 1. Try to load from Firebase first
        const docSnap = await window.db.collection('config').doc('cms_layout').get();
        if (docSnap.exists && docSnap.data().order) {
            const order = docSnap.data().order;
            // Append cards in the saved order
            order.forEach(id => {
                const card = document.getElementById(id);
                if (card) {
                    container.appendChild(card);
                }
            });
        }
    } catch (error) {
        console.error("Erro ao carregar ordem do Firebase:", error);
    }

    // 2. Initialize SortableJS
    Sortable.create(container, {
        animation: 150,
        handle: '.drag-handle', // Movel only by the grip icon
        ghostClass: 'dragging',
        onEnd: function (evt) {
            // Triggered when dragging stops
            window.saveDashboardOrder();
        }
    });
};

window.saveDashboardOrder = async function () {
    const container = document.getElementById('dashboard-cards-container');
    if (!container) return;

    const currentOrder = Array.from(container.children)
        .filter(el => el.classList.contains('admin-card'))
        .map(el => el.id);

    try {
        await window.db.collection('config').doc('cms_layout').set({
            order: currentOrder
        }, { merge: true });
        console.log("Dashboard order saved to Firebase!");
    } catch (error) {
        console.error("Erro ao guardar ordem no Firebase:", error);
    }
};

// --- HTML Generator Helpers ---
window.copyGeneratedHTML = () => {
    let content = '';
    if (window.tinymce && tinymce.get('html-generator-editor')) {
        content = tinymce.get('html-generator-editor').getContent();
    } else {
        content = document.getElementById('html-generator-editor').value;
    }

    // Robust Copy Method (Fallback to execCommand)
    if (!content) {
        alert("O editor está vazio. Escreva algo primeiro.");
        return;
    }

    try {
        // Try Clipboard API first
        navigator.clipboard.writeText(content).then(() => {
            alert("✅ Código HTML copiado! (" + content.length + " caracteres)\n\nAgora cole na caixa de texto do serviço ou biografia.");
        }).catch(err => {
            throw err; // Fallback
        });
    } catch (e) {
        // Fallback: Create temporary textarea
        const textArea = document.createElement("textarea");
        textArea.value = content;

        // Ensure it's not visible but part of DOM
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                alert("✅ Código HTML copiado! (Modo de Compatibilidade)");
            } else {
                prompt("Não foi possível copiar automaticamente. Por favor copie este código:", content);
            }
        } catch (err) {
            prompt("Não foi possível copiar. Por favor copie este codigo:", content);
        }

        document.body.removeChild(textArea);
    }
};

window.clearHtmlGenerator = () => {
    if (window.tinymce && tinymce.get('html-generator-editor')) {
        tinymce.get('html-generator-editor').setContent('');
    }
    document.getElementById('html-generator-editor').value = '';
};

// Global Tab Switching Logic to Fix TinyMCE hidden init issues
window.openSection = function (sectionId) {
    // Hide all panels
    const panels = document.querySelectorAll('.admin-panel-content');
    panels.forEach(p => p.style.display = 'none');

    // Show target
    const target = document.getElementById(sectionId);
    if (target) {
        target.style.display = 'block';

        // If opening Services, refresh TinyMCE
        if (sectionId === 'panel-services') {
            // Force re-init if needed
            if (window.tinymce && !window.tinymceInstanceInit) {
                initTinyMCE('', 'my-tinymce-editor');
            } else if (window.tinymce && tinymce.get('my-tinymce-editor')) {
                // If already init but was hidden, sometimes it needs a refresh or resize
                // tinymce.get('my-tinymce-editor').show(); // Not a standard API but sometimes needed
            }
        }
        // If opening About, Refresh TinyMCE
        if (sectionId === 'panel-about') {
            if (window.tinymce && tinymce.get('about-text')) {
                // Check if it needs refresh
            } else {
                // Init if missing (and we have data presumably, or empty)
                // We might need to fetch current content from the textarea if it was populated via value
                const currentVal = document.getElementById('about-text').value;
                initTinyMCE(currentVal, 'about-text');
            }
        }
    }

    // Update Sidebar Active State
    // Note: This relies on the sidebar links having an onclick that passes 'this' or we find by href
    // For now we assume the sidebar handles its own class toggling or we add it later if needed.
    // Given the previous code didn't have robust class toggling, we leave it simple.
};


// --- Events Logic ---
window.eventsCache = {};

async function handleEventSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = "A guardar...";
    btn.disabled = true;

    try {
        const id = document.getElementById('evt-id').value; // Check hidden ID
        const title = document.getElementById('evt-title').value;
        const date = document.getElementById('evt-date').value;
        const time = document.getElementById('evt-time').value;
        const location = document.getElementById('evt-location').value;
        // Get Content from TinyMCE if active
        const description = (window.tinymce && tinymce.get('evt-desc')) ? tinymce.get('evt-desc').getContent() : document.getElementById('evt-desc').value;
        const link = document.getElementById('evt-link').value;
        const fileInput = document.getElementById('evt-image');

        let imageUrl = document.getElementById('evt-image-url') ? document.getElementById('evt-image-url').value : null;
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const path = `events/${Date.now()}_${file.name}`;
            btn.innerText = "A enviar imagem...";
            imageUrl = await uploadImageToStorage(file, path);
        }

        const eventData = {
            title,
            date,
            time,
            location,
            description,
            registration_link: link,
            active: true,
            updated_at: new Date()
        };

        // Ensure empty fields or removed URLs are maintained
        if (imageUrl !== null) {
            eventData.image_url = imageUrl;
        }

        if (id) {
            // UPDATE
            await window.db.collection("events").doc(id).update(eventData);
            alert("Evento atualizado com sucesso!");
        } else {
            // CREATE
            eventData.created_at = new Date();
            await window.db.collection("events").add(eventData);
            alert("Evento criado com sucesso! 🌿");
        }

        window.resetEventForm(); // Clear form
        loadEvents();

    } catch (error) {
        console.error("Error saving event:", error);
        alert("Erro ao guardar evento: " + error.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function loadEvents() {
    const listContainer = document.getElementById('admin-events-list');
    listContainer.innerHTML = '<p>A carregar eventos...</p>';
    window.eventsCache = {}; // Reset cache

    try {
        const querySnapshot = await window.db.collection("events").orderBy("date", "asc").get();

        if (querySnapshot.empty) {
            listContainer.innerHTML = '<p>Sem eventos agendados.</p>';
            return;
        }

        let html = '<ul class="admin-event-list">';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            window.eventsCache[doc.id] = data; // Cache for editing

            html += `
                <li class="admin-event-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:10px; border-bottom:1px solid #eee;">
                    <div class="event-info">
                        <strong>${data.date}</strong> - ${data.title}
                    </div>
                    <div>
                        <button class="btn btn-outline btn-sm" onclick="window.editEvent('${doc.id}')" style="margin-right:5px;">Editar</button>
                        <button class="btn-delete" onclick="window.deleteEvent('${doc.id}')" style="color:red; background:none; border:none; cursor:pointer;">Apagar</button>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        listContainer.innerHTML = html;

    } catch (error) {
        console.error("Error loading events:", error);
        listContainer.innerHTML = '<p style="color:red">Erro ao carregar eventos.</p>';
    }
}

window.editEvent = function (id) {
    const data = window.eventsCache[id];
    if (!data) return;

    // Populate Form
    document.getElementById('evt-id').value = id;
    document.getElementById('evt-title').value = data.title || '';
    document.getElementById('evt-date').value = data.date || '';
    document.getElementById('evt-time').value = data.time || '';
    document.getElementById('evt-location').value = data.location || '';
    document.getElementById('evt-desc').value = data.description || '';
    if (window.tinymce && tinymce.get('evt-desc')) tinymce.get('evt-desc').setContent(data.description || '');
    document.getElementById('evt-link').value = data.registration_link || '';
    if (document.getElementById('evt-image-url')) {
        const imageUrl = data.image_url || '';
        document.getElementById('evt-image-url').value = imageUrl;
        window.renderFilePreview('evt-image-preview', imageUrl, { urlInputId: 'evt-image-url', fileInputId: 'evt-image' });

        // Visual enhancement: Change the URL placeholder to show the filename if it's a firebase url
        if (imageUrl && imageUrl.includes('firebasestorage')) {
            document.getElementById('evt-image-url').placeholder = window.extractFilenameFromUrl(imageUrl);
        } else {
            document.getElementById('evt-image-url').placeholder = "URL da imagem (auto)";
        }
    }

    // Update Button Text
    const btn = document.querySelector('#event-form button[type="submit"]');
    if (btn) btn.innerText = "Guardar Alterações";

    // Scroll to top of form
    document.getElementById('event-form').scrollIntoView({ behavior: 'smooth' });
};

window.resetEventForm = function () {
    const form = document.getElementById('event-form');
    if (form) form.reset();
    document.getElementById('evt-id').value = ""; // Clear ID
    const btn = document.querySelector('#event-form button[type="submit"]');
    if (btn) btn.innerText = "Publicar Evento";
};
window.deleteEvent = async (id) => {
    if (confirm("Tens a certeza que queres apagar este evento?")) {
        try {
            await window.db.collection("events").doc(id).delete();
            loadEvents();
        } catch (error) {
            alert("Erro ao apagar: " + error.message);
        }
    }
};

// Color Sync Helper
function setupColorSync(pickerId, textId) {
    const picker = document.getElementById(pickerId);
    const text = document.getElementById(textId);
    if (picker && text) {
        picker.addEventListener('input', (e) => text.value = e.target.value);
        text.addEventListener('input', (e) => picker.value = e.target.value);
    }
}

// Setup Footer Color Sync
document.addEventListener('DOMContentLoaded', () => {
    setupColorSync('footer-bg-color', 'footer-bg-hex');
    setupColorSync('footer-text-color', 'footer-text-hex');
});


// --- Testimonials Logic ---

// Cache Review Data to allow editing
window.reviewsCache = {};

async function handleReviewSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = "A guardar...";
    btn.disabled = true;

    try {
        // Check for ID (Edit Mode)
        // Note: We need a hidden input for ID in the HTML if we want full Edit support.
        // I will assume we add <input type="hidden" id="rev-id"> to the form or create it dynamically.
        let idInput = document.getElementById('rev-id');
        if (!idInput) {
            // Create it on fly if missing to prevent crash
            idInput = document.createElement('input');
            idInput.type = 'hidden';
            idInput.id = 'rev-id';
            e.target.appendChild(idInput);
        }

        const id = idInput.value;
        const name = document.getElementById('rev-name').value;
        const role = document.getElementById('rev-role').value;
        const text = (window.tinymce && tinymce.get('rev-text')) ? tinymce.get('rev-text').getContent() : document.getElementById('rev-text').value;

        const reviewData = {
            name,
            role,
            text,
            type: 'general',
            active: true,
            created_at: new Date()
        };

        if (id) {
            await window.db.collection("testimonials").doc(id).update(reviewData);
            alert("Testemunho atualizado! 💬");
        } else {
            await window.db.collection("testimonials").add(reviewData);
            alert("Testemunho adicionado! 💬");
        }

        e.target.reset();
        window.resetReviewForm(); // Reset UI
        loadReviews();

    } catch (error) {
        console.error("Error saving review:", error);
        alert("Erro ao guardar: " + error.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function loadReviews() {
    const listContainer = document.getElementById('admin-reviews-list');
    if (!listContainer) return;
    listContainer.innerHTML = '<p>A carregar...</p>';

    try {
        // Fix: Fetch ALL (remove orderBy to avoid missing index or filtering out docs without created_at)
        const querySnapshot = await window.db.collection("testimonials").get();

        if (querySnapshot.empty) {
            listContainer.innerHTML = '<p>Sem testemunhos.</p>';
            return;
        }

        // Convert to Array and Sort manually (Newest First)
        // Handle cases where created_at might be missing
        const reviews = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            reviews.push({ id: doc.id, ...data });
            window.reviewsCache[doc.id] = data; // Cache
        });

        // Sort: Role (A-Z) -> Date (Newest First)
        reviews.sort((a, b) => {
            const roleA = (a.role || "").toLowerCase();
            const roleB = (b.role || "").toLowerCase();

            // 1. Priority to items WITH role
            if (roleA && !roleB) return -1;
            if (!roleA && roleB) return 1;

            // 2. Alphabetical Sort by Role
            if (roleA !== roleB) {
                return roleA.localeCompare(roleB);
            }

            // 3. Fallback: Date (Newest First)
            const dateA = a.created_at ? (a.created_at.seconds || 0) : 0;
            const dateB = b.created_at ? (b.created_at.seconds || 0) : 0;
            return dateB - dateA;
        });

        // Update Header Count
        const header = listContainer.parentElement.querySelector('h3');
        if (header) {
            header.innerText = `Testemunhos Ativos (${reviews.length})`;
        }

        let html = '<div class="admin-reviews-grid">';
        reviews.forEach((data) => {
            html += `
                <div class="admin-review-card">
                    <div class="admin-review-header">
                        <div class="admin-review-title-group">
                            <span class="admin-review-name">${data.name}</span>
                            ${data.role ? `<span class="admin-review-role-separator">-</span><span class="admin-review-role">${data.role}</span>` : ''}
                        </div>
                        <div class="admin-review-actions">
                             <button class="btn-icon-sm" onclick="window.editReview('${data.id}')" title="Editar">
                                <i data-lucide="pen"></i>
                             </button>
                             <button class="btn-icon-sm delete" onclick="window.deleteReview('${data.id}')" title="Apagar">
                                <i data-lucide="trash"></i>
                             </button>
                        </div>
                    </div>
                    <p class="admin-review-text">${data.text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').replace(/^["'\s]+|["'\s]+$/g, '').trim()}</p>
                </div>
            `;
        });
        html += '</div>';
        listContainer.innerHTML = html;

        // Re-init Icons
        if (window.lucide) {
            lucide.createIcons();
        }

    } catch (error) {
        console.error("Error loading reviews:", error);
        listContainer.innerHTML = '<p style="color:red">Erro.</p>';
    }
}

window.deleteReview = async (id) => {
    if (confirm("Apagar este testemunho?")) {
        try {
            await window.db.collection("testimonials").doc(id).delete();
            loadReviews(); // Reload list
        } catch (error) {
            alert("Erro ao apagar: " + error.message);
        }
    }
}

window.editReview = (id) => {
    const data = window.reviewsCache[id];
    if (!data) return;

    // Inject hidden ID field if not exists
    let idInput = document.getElementById('rev-id');
    if (!idInput) {
        const form = document.getElementById('review-form');
        idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.id = 'rev-id';
        form.prepend(idInput);
    }

    idInput.value = id;
    document.getElementById('rev-name').value = data.name;
    document.getElementById('rev-role').value = data.role || "";
    document.getElementById('rev-text').value = data.text;
    if (window.tinymce && tinymce.get('rev-text')) tinymce.get('rev-text').setContent(data.text || '');

    // UI Feedback
    const btn = document.querySelector('#review-form button[type="submit"]');
    if (btn) btn.innerText = "Atualizar Testemunho";
}

window.resetReviewForm = () => {
    const form = document.getElementById('review-form');
    if (form) form.reset();

    const idInput = document.getElementById('rev-id');
    if (idInput) idInput.value = "";

    const btn = document.querySelector('#review-form button[type="submit"]');
    if (btn) btn.innerText = "Publicar Testemunho";
}



// --- Services Logic ---

// TinyMCE Init with content option
// TinyMCE Init with content option
function initTinyMCE(initialContent = '', targetId = 'my-tinymce-editor', force = false) {
    console.log(`InitTinyMCE called for #${targetId}. Content len:`, initialContent.length, "Force:", force);

    // If active and NOT forced, just set content
    if (!force && window.tinymce && tinymce.get(targetId)) {
        console.log("Editor exists, setting content...");
        tinymce.get(targetId).setContent(initialContent);
        return;
    }

    // Force remove if exists (Nuclear)
    if (window.tinymce && tinymce.get(targetId)) {
        console.log("Removing existing editor...");
        tinymce.get(targetId).remove();
    }

    if (window.tinymce) {
        console.log("Initializing new editor...");
        tinymce.init({
            selector: '#' + targetId,
            height: 500,
            menubar: true, // Enable menu for debug/usability
            plugins: 'link lists image code',
            toolbar: 'undo redo | blocks | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | link image',
            content_style: 'body { font-family:Montserrat,Helvetica,Arial,sans-serif; font-size:14px }',
            readonly: false,
            setup: function (editor) {
                editor.on('init', function () {
                    console.log("Editor initialized.");
                    if (initialContent) {
                        editor.setContent(initialContent);
                    }
                    console.log("Editor setup complete.");
                });
                editor.on('change', function () {
                    editor.save();
                });
            }
        });
    }
}

// Helper: Upload Image (Missing Function Fix)



window.handleServiceSubmit = async function (e) {
    e.preventDefault();
    const btn = document.getElementById('svc-submit-btn');
    btn.innerText = "A guardar...";
    btn.disabled = true;

    try {
        const id = document.getElementById('svc-id').value; // Check for ID

        const title = document.getElementById('svc-title').value;

        if (!title.trim()) {
            alert("Por favor, insira um Nome do Serviço.");
            btn.innerText = "Publicar Serviço";
            btn.disabled = false;
            return;
        }
        const description = (window.tinymce && tinymce.get('svc-desc')) ? tinymce.get('svc-desc').getContent() : document.getElementById('svc-desc').value;


        // Get content from Textarea
        const longDescription = document.getElementById('svc-full-desc').value;

        const benefitsRaw = document.getElementById('svc-benefits').value;
        // const styleClass = document.getElementById('svc-theme').value; // Removed

        // Image Handling (URL or File)
        let headerImage = document.getElementById('svc-image').value;
        const imageFile = document.getElementById('svc-image-file').files[0];

        if (imageFile) {
            console.log("Processing image...", imageFile.name);
            try {
                // Upload to Storage
                btn.innerText = "A enviar imagem...";
                const path = `services/${Date.now()}_${imageFile.name}`;
                headerImage = await uploadImageToStorage(imageFile, path);
            } catch (err) {
                console.error("Image Processing Error:", err);
                alert("Erro ao processar imagem: " + err.message);
                throw err;
            }
        }

        // Parse benefits (Allow Inline HTML, strip Blocks like P/DIV)
        const cleanBenefitsRaw = benefitsRaw.replace(/<\/?(p|div|br|h[1-6])[^>]*>/gi, ''); // Strip blocks
        const benefits = cleanBenefitsRaw.split(',').map(b => b.trim()).filter(b => b.length > 0);

        // Collect Testimonials
        const testimonialIds = [];
        document.querySelectorAll('#svc-testimonials-selector input[type="checkbox"]:checked').forEach(cb => {
            testimonialIds.push(cb.value);
        });

        const serviceData = {
            title: title.replace(/<\/?(p|div|br|h[1-6])[^>]*>/gi, '').trim(),
            description,
            long_description: longDescription,

            benefits,
            testimonial_ids: testimonialIds, // New Field
            customColors: {
                // New Structure (Ensuring Numbers)
                topBg: document.getElementById('svc-top-bg-color').value,
                // Ensure float and default if NaN
                topOpacity: parseFloat(document.getElementById('svc-top-opacity').value) || 0.5,
                bottomBg: document.getElementById('svc-bottom-bg-color').value,
                bottomOpacity: parseFloat(document.getElementById('svc-bottom-opacity').value) || 1,
                btnText: document.getElementById('svc-btn-text-color').value
            },
            // styleClass,
            headerImage,
            active: true
        };

        if (!id) {
            serviceData.created_at = new Date();
            serviceData.order = 99; // Default for new



            // We need the ID for the doc. Let's add it with a specific ID if we can, or just let auto-id happen.
            // If we want ?id=slug to work with "service.html", that page queries by DOC ID.
            // so we should probably try to use the slug as the doc ID.

            const slug = serviceData.title.toLowerCase().replace(/[^a-z0-9]/g, '-');

            // Check if exists? Firestore set with merge:false fails if exists? No, it overwrites.
            // Let's use set() to force the slug as ID, so service.html?id=slug works!
            await window.db.collection("services").doc(slug).set(serviceData);

            alert(`Serviço adicionado! Link gerado: service-detail.html?id=${slug}`);
        } else {
            // Update existing
            await window.db.collection("services").doc(id).update(serviceData);
            alert("Serviço atualizado! ✨");
        }

        window.resetServiceForm();
        loadServices();

    } catch (error) {
        console.error("Error saving service:", error);
        alert("Erro ao guardar: " + error.message);
    } finally {
        btn.innerText = "Publicar Serviço"; // Restore text
        btn.disabled = false;
    }
}

// Make available globally for debugging or inline calls
window.handleServiceSubmit = handleServiceSubmit;

// New Config Handler
window.handleServiceConfigSubmit = async () => {
    const btn = document.getElementById('service-config-btn');
    const originalText = btn.textContent;
    btn.textContent = "A guardar...";
    btn.disabled = true;

    try {
        let imageUrl = document.getElementById('service-bg-url').value;
        const imageFile = document.getElementById('service-bg-file').files[0];

        // New Fields
        const title = document.getElementById('service-section-title').value;
        const highlightEnabled = document.getElementById('service-title-highlight-enabled') ? document.getElementById('service-title-highlight-enabled').checked : false;
        const highlightColor = document.getElementById('service-title-highlight-color') ? document.getElementById('service-title-highlight-color').value : '#f7f2e0';
        const highlightOpacity = document.getElementById('service-title-highlight-opacity') ? parseFloat(document.getElementById('service-title-highlight-opacity').value) : 1;

        if (imageFile) {
            btn.textContent = "A enviar imagem...";
            const path = `site_content/services_bg_${Date.now()}`;
            imageUrl = await uploadImageToStorage(imageFile, path);
        }

        // Save to site_content/main -> service_section
        await window.db.collection('site_content').doc('main').set({
            service_section: {
                background_image: imageUrl,
                title: title,
                title_highlight_enabled: highlightEnabled,
                title_highlight_color: highlightColor,
                title_highlight_opacity: highlightOpacity
            }
        }, { merge: true });

        alert("Configuração de Serviços atualizada!");

    } catch (error) {
        console.error("Error saving service config:", error);
        alert("Erro: " + error.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
};

async function loadServices(retryCount = 0) {
    const listContainer = document.getElementById('admin-services-list');
    if (!listContainer) return;

    // Retry Logic (Max 10 attempts = 5 seconds)
    if (!window.db) {
        if (retryCount < 10) {
            console.warn(`CMS: Waiting for DB... (${retryCount + 1}/10)`);
            setTimeout(() => loadServices(retryCount + 1), 500);
            return;
        } else {
            listContainer.innerHTML = '<p style="color:red; font-weight:bold;">Erro Crítico: Base de Dados não detetada após 5 segundos.</p>';
            alert("Erro: A ligação à Base de Dados falhou. Verifique a consola.");
            return;
        }
    }

    listContainer.innerHTML = '<p style="color:#666;">A carregar serviços...</p>';

    try {
        console.log("CMS: Fetching services...");
        const querySnapshot = await window.db.collection("services").orderBy("order", "asc").get();

        if (querySnapshot.empty) {
            listContainer.innerHTML = '<p class="text-muted">A coleção "services" está vazia na Base de Dados.</p>';
            return;
        }

        console.log(`CMS: Found ${querySnapshot.size} services.`);

        // Generate items directly (no UL wrapper) for better flex control
        let html = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Note: passing data attributes or fetching again in edit
            html += `
                <div class="admin-event-item">
                    <div class="event-info">
                        <span class="font-sm"><strong>${data.title || 'Sem Título'}</strong></span>
                    </div>
                    <div class="flex-center gap-5 mt-5">
                        <button class="btn-outline font-xs" style="padding: 2px 8px;" onclick="window.editService('${doc.id}')">Editar</button>
                        <button class="btn-delete font-xs" style="padding: 2px 8px;" onclick="window.deleteService('${doc.id}')">Apagar</button>
                    </div>
                </div>
            `;
        });
        listContainer.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();

    } catch (error) {
        console.error("Error loading services:", error);
        listContainer.innerHTML = `<div style="color:red; background:#fff2f2; padding:10px; border-radius:5px;">
            <strong>Erro ao carregar dados:</strong><br>${error.message}<br>
            <small>Código: ${error.code || 'N/A'}</small>
        </div>`;
    }
}

// --- Services Logic Moved to cms-services.js ---
// loadServices and editService removed from here to avoid conflicts.
// Please refer to cms-services.js for the active implementation.

window.resetServiceForm = async () => {
    document.getElementById('service-form').reset();

    // Explicitly Clear Fields to be safe
    document.getElementById('svc-id').value = '';
    // Load Testimonials for selection
    loadTestimonialsSelector(new Set()); // Load unchecked by default

    // Clear Form
    document.getElementById('svc-id').value = '';
    document.getElementById('svc-title').value = '';
    document.getElementById('svc-benefits').value = '';
    document.getElementById('svc-desc').value = '';
    document.getElementById('svc-image').value = '';
    document.getElementById('svc-image-file').value = '';
    document.getElementById('svc-full-desc').value = '';

    document.getElementById('svc-colors-config').classList.add('hidden'); // Hide color config
    // Reset colors to default
    resetColorInputs();

    // Helper
    function resetColorInputs() {
        if (document.getElementById('svc-top-bg-color')) document.getElementById('svc-top-bg-color').value = '#000000';
        if (document.getElementById('svc-top-opacity')) {
            document.getElementById('svc-top-opacity').value = 0.5;
            document.getElementById('opacity-val-top').innerText = '50%';
        }

        if (document.getElementById('svc-bottom-bg-color')) document.getElementById('svc-bottom-bg-color').value = '#4F553D';
        if (document.getElementById('svc-bottom-opacity')) {
            document.getElementById('svc-bottom-opacity').value = 1;
            document.getElementById('opacity-val-bottom').innerText = '100%';
        }

        if (document.getElementById('svc-btn-text-color')) document.getElementById('svc-btn-text-color').value = '#ffffff';
    }

    // Load Template Content - DISABLED as per user request to keep fields empty

    document.getElementById('svc-submit-btn').innerText = "Publicar Serviço";
    document.getElementById('svc-cancel-btn').classList.add('hidden');
};

// Duplicate editService removed.


// Helper: Load Testimonials Checkboxes
window.loadTestimonialsSelector = async (selectedSet = new Set()) => {
    const list = document.getElementById('svc-testimonials-selector');
    const loading = document.getElementById('loading-testimonials-selector');
    if (!list) return;

    // Check if already loaded to avoid re-fetching? 
    // Maybe force fresh load to ensure we have latest reviews.

    try {
        const snapshot = await window.db.collection('testimonials').orderBy('created_at', 'desc').get();
        loading.style.display = 'none';

        if (snapshot.empty) {
            list.innerHTML = '<span class="text-xs">Não existem testemunhos.</span>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const isChecked = selectedSet.has(doc.id) ? 'checked' : '';
            const isSelectedClass = selectedSet.has(doc.id) ? 'selected' : '';
            const text = data.text ? data.text.replace(/<[^>]*>?/gm, '') : 'Sem texto';
            const roleHtml = data.role ? `<span class="text-muted font-xs ml-10" style="font-weight:400">(${data.role})</span>` : '';

            // Escape single quotes for onclick
            const safeData = JSON.stringify({ id: doc.id, ...data }).replace(/'/g, "&apos;");

            html += `
                <div class="testimonial-selector-card compact ${isSelectedClass}" onclick="if(!event.target.closest('.btn-icon-only') && !event.target.closest('.checkbox-wrapper')) this.querySelector('input[type=checkbox]').click()">
                    
                    <div class="testimonial-card-header flex-between-center">
                        <div style="display: flex; align-items: center; gap: 10px; overflow: hidden; flex-grow: 1; margin-right: 10px;">
                            <!-- Selection Checkbox -->
                            <div class="checkbox-wrapper" title="Selecionar" onclick="event.stopPropagation()">
                                <input type="checkbox" value="${doc.id}" ${isChecked} onchange="this.closest('.testimonial-selector-card').classList.toggle('selected', this.checked)">
                            </div>
                            
                            <!-- Name & Role -->
                            <div style="min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                <span class="font-weight-600">${data.name}</span>
                                ${roleHtml}
                            </div>
                        </div>
                        
                        <div class="testimonial-card-actions">
                             <!-- Edit Button -->
                             <button type="button" class="btn-icon-only" title="Editar" onclick='event.stopPropagation(); window.openQuickTestimonialModal(${safeData})'>
                                <i data-lucide="pencil" class="icon-14"></i>
                             </button>
                             
                             <!-- Delete Button -->
                             <button type="button" class="btn-icon-only text-danger" title="Apagar" onclick="event.stopPropagation(); window.deleteServiceTestimonial('${doc.id}')">
                                <i data-lucide="trash" class="icon-14"></i>
                             </button>
                        </div>
                    </div>

                    <div class="testimonial-card-text small mt-5">"${text}"</div>
                </div>
            `;
        });
        list.innerHTML = html;
        lucide.createIcons(); // specific for new icons

    } catch (e) {
        console.error("Error loading testimonials for selector", e);
        loading.innerText = "Erro ao carregar.";
    }
};

// --- Quick Testimonial Modal Logic ---
window.openQuickTestimonialModal = (data = null) => {
    const modal = document.getElementById('quick-testimonial-modal');
    if (modal) {
        modal.classList.add('active'); // Use active class for animation
        const form = document.getElementById('quick-testimonial-form');
        form.reset();

        if (data) {
            document.querySelector('.modal-title').innerText = "Editar Testemunho";
            document.getElementById('quick-rev-id').value = data.id;
            document.getElementById('quick-rev-name').value = data.name || '';
            document.getElementById('quick-rev-role').value = data.role || '';
            document.getElementById('quick-rev-text').value = data.text || '';
            form.querySelector('button[type="submit"]').innerText = "Atualizar";
        } else {
            document.querySelector('.modal-title').innerText = "Novo Testemunho Rápido";
            document.getElementById('quick-rev-id').value = "";
            form.querySelector('button[type="submit"]').innerText = "Guardar & Associar";
        }
        lucide.createIcons();
    }
};

window.closeQuickTestimonialModal = () => {
    const modal = document.getElementById('quick-testimonial-modal');
    if (modal) modal.classList.remove('active');
};

window.handleQuickTestimonialSubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = "A guardar...";
    btn.disabled = true;

    try {
        const id = document.getElementById('quick-rev-id').value;
        const name = document.getElementById('quick-rev-name').value;
        const role = document.getElementById('quick-rev-role').value;
        const text = document.getElementById('quick-rev-text').value;

        const reviewData = {
            name,
            role,
            text,
            type: 'service',
            active: true,
            updated_at: new Date()
        };

        if (!id) {
            reviewData.created_at = new Date();
        }

        let docId = id;

        // 1. Add/Update to Firestore
        if (id) {
            await window.db.collection("testimonials").doc(id).update(reviewData);
            alert("Testemunho atualizado! 💾");
        } else {
            const docRef = await window.db.collection("testimonials").add(reviewData);
            docId = docRef.id;
            alert("Testemunho criado e associado! 🔗");
        }

        // 2. Refresh Selector
        window.closeQuickTestimonialModal();

        // 3. Get currently selected IDs to preserve them
        const currentSelected = new Set();
        document.querySelectorAll('.testimonial-selector-card.selected input[type="checkbox"]').forEach(cb => {
            // We need to re-select based on the checkboxes hidden inside
            // Since I changed HTML structure, let's look for valid inputs
            currentSelected.add(cb.value);
        });

        // If it was a checkbox checked, `querySelectorAll` finds it.
        // Wait, I changed structure to `input` inside `label`.
        // Let's ensure we grab values correctly.

        document.querySelectorAll('#svc-testimonials-selector input[type="checkbox"]:checked').forEach(cb => {
            currentSelected.add(cb.value);
        });

        // 4. Add the new/updated ID to selection if it wasn't there (auto-associate on create)
        if (!id) {
            currentSelected.add(docId);
        }

        // 5. Reload List with new selection
        await window.loadTestimonialsSelector(currentSelected);

        // 6. Refresh Main Testimonials List if function exists
        if (typeof window.loadReviews === 'function') {
            window.loadReviews();
        }

    } catch (error) {
        console.error("Error creating/updating quick testimonial:", error);
        alert("Erro: " + error.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

window.deleteServiceTestimonial = async (id) => {
    if (confirm("Apagar este testemunho permanentemente?")) {
        try {
            await window.db.collection("testimonials").doc(id).delete();

            // Refresh Selector
            const currentSelected = new Set();
            document.querySelectorAll('#svc-testimonials-selector input[type="checkbox"]:checked').forEach(cb => {
                if (cb.value !== id) currentSelected.add(cb.value);
            });
            await window.loadTestimonialsSelector(currentSelected);

            if (typeof window.loadReviews === 'function') {
                window.loadReviews();
            }

        } catch (error) {
            alert("Erro ao apagar: " + error.message);
        }
    }
};

// deleteService removed. See cms-services.js

// Seeding Function (Updated with Static Links)
window.seedDefaultServices = async () => {
    if (!confirm("Isto vai REINICIAR os serviços para os originais (usando IDs fixos). Continuar?")) return;

    // Content extracted from static files (consolidated into dynamic system)
    const defaults = [
        {
            id: "aura",
            title: "Leitura de Aura",
            description: "Acede à tua energia, liberta bloqueios e ganha clareza sobre o teu caminho espiritual.",
            long_description: `<p>A Leitura de Aura é uma ferramenta poderosa de autoconhecimento. Ao aceder ao teu campo energético, é possível identificar padrões, bloqueios e potenciais que estão presentes na tua vida neste momento.</p>
            <p><strong>Como funciona?</strong><br>A sessão começa com uma meditação de enraizamento. De seguida, é feita a leitura das cores e imagens da tua aura (campo energético), passando pelos 7 chakras principais.</p>
            <p>Esta terapia permite trazer ao consciente o que está no inconsciente, promovendo a cura e o equilíbrio.</p>`,
            link: "service-detail.html?id=aura",
            benefits: ["Presenciais", "Online (Zoom)", "À Distância"],
            styleClass: "",
            order: 1
        },
        {
            id: "innerdance",
            title: "Innerdance",
            description: "Uma jornada sonora vibracional que ativa o teu processo de autocura e expansão da consciência.",
            long_description: `<p>Innerdance não é uma dança física, mas sim uma dança da consciência. Através de ondas cerebrais e sons binaurais, és levado a um estado de transe consciente (semelhante ao sonho lúcido).</p>
            <p><strong>Benefícios:</strong><br>
            - Libertação de traumas emocionais.<br>
            - Ativação da energia Kundalini.<br>
            - Visões e insights profundos.</p>
            <p>É uma experiência visceral onde o corpo pode mover-se espontaneamente para libertar energia estagnada.</p>`,
            link: "service-detail.html?id=innerdance",
            benefits: ["Desbloqueio Emocional", "Activação Energética", "Estado Alterado de Consciência"],
            styleClass: "innerdance",
            order: 2
        },
        {
            id: "constelacoes",
            title: "Constelações Familiares e Sistêmicas",
            description: "Harmoniza o teu sistema familiar e liberta padrões herdados para viveres com mais leveza.",
            long_description: `<p>As Constelações Familiares olham para o indivíduo como parte de um sistema maior (a família). Muitas vezes, carregamos lealdades invisíveis, destinos ou traumas dos nossos antepassados.</p>
            <p>Nesta sessão, utilizamos bonecos ou marcadores (online ou presencial) para representar os membros da família e observar a dinâmica oculta.</p>
            <p>Ao reconhecer e honrar o que foi, podemos encontrar o nosso lugar de força e seguir em frente com amor.</p>`,
            link: "service-detail.html?id=constelacoes",
            benefits: ["Presenciais", "Online"],
            styleClass: "constellations",
            order: 3
        },
        {
            id: "expansao",
            title: "Ciclos de Expansão",
            description: "Programas de longa duração para quem procura um compromisso profundo com o seu crescimento.",
            long_description: `<p>Os Ciclos de Expansão são jornadas de acompanhamento contínuo. Ao contrário de uma sessão pontual, aqui mergulhamos fundo num tema durante várias semanas ou meses.</p>
            <p><strong>O que inclui?</strong><br>
            - Sessões regulares (grupo ou individual).<br>
            - Exercícios práticos entre sessões.<br>
            - Apoio via WhatsApp/Telegram.<br>
            - Acesso a uma comunidade de suporte.</p>
            <p>Ideal para quem está numa fase de transição de vida e precisa de suporte estruturado.</p>`,
            link: "service-detail.html?id=expansao",
            benefits: ["Mentoria Contínua", "Grupo de Apoio", "Acesso a Recursos"],
            styleClass: "expansion",
            order: 4
        }
    ];

    try {
        // 1. Delete ALL existing services to prevent duplicates
        const snapshot = await window.db.collection("services").get();
        const deletePromises = [];
        snapshot.forEach(doc => {
            deletePromises.push(window.db.collection("services").doc(doc.id).delete());
        });
        await Promise.all(deletePromises);

        // 2. Add Defaults
        for (const svc of defaults) {
            const data = { ...svc, active: true, created_at: new Date() };
            if (svc.id) {
                const docId = svc.id;
                delete data.id;
                await window.db.collection("services").doc(docId).set(data);
            } else {
                await window.db.collection("services").add(data);
            }
        }

        alert("Serviços reiniciados com sucesso! Duplicados removidos.");
        loadServices();
    } catch (e) {
        console.error(e);
        alert("Erro na importação: " + e.message);
    }
};

// --- Meditation Management ---

// Helper: Toggle Background Type Inputs
window.toggleMedBgType = () => {
    const type = document.getElementById('med-card-bg-type').value;
    const imgGroup = document.getElementById('med-bg-image-group');
    const colorGroup = document.getElementById('med-bg-color-group');

    if (type === 'image') {
        imgGroup.style.display = 'block';
        colorGroup.style.display = 'none';
    } else {
        imgGroup.style.display = 'none';
        colorGroup.style.display = 'block';
    }
};

async function handleMeditationSubmit(e) {
    if (e) e.preventDefault();
    const btn = document.getElementById('med-submit-btn');
    const originalText = btn.innerText;
    btn.innerText = "A guardar...";
    btn.disabled = true;

    try {
        const id = document.getElementById('med-id').value;

        // Data Extraction - PRESENTATION
        let cardTitle = document.getElementById('med-card-title').value;
        const cardText = document.getElementById('med-card-text').value;
        const cardBgType = document.getElementById('med-card-bg-type').value;
        const cardBgColor = document.getElementById('med-card-bg-color').value;
        let cardOpacity = document.getElementById('med-card-opacity').value;
        if (cardOpacity) cardOpacity = cardOpacity.replace(',', '.');

        // Data Extraction - DETAIL
        let pageTitle = document.getElementById('med-page-title').value;
        let pageSubtitle = document.getElementById('med-page-subtitle').value;
        const title = document.getElementById('med-title').value;
        const theme = document.getElementById('med-theme').value;
        const type = document.getElementById('med-type').value;
        let url = document.getElementById('med-url').value;
        let audioUrlHidden = document.getElementById('med-audio-url-hidden') ? document.getElementById('med-audio-url-hidden').value : '';
        if (audioUrlHidden && !url) url = audioUrlHidden;

        // Fallback: If page title empty, use internal title
        if (!pageTitle) pageTitle = title;
        if (!pageSubtitle) pageSubtitle = "";

        // Fallback: If card title empty, use main title (moved logic down or keep it)
        if (!cardTitle) cardTitle = title;


        // Smart-Clean URL
        if (url.includes('<iframe')) {
            const srcMatch = url.match(/src="([^"]+)"/);
            if (srcMatch && srcMatch[1]) url = srcMatch[1];
        }

        // Image Processing (Card Background)
        let imageUrl = window.getFileUrlInput('med-image-url');
        const imageFile = document.getElementById('med-image').files[0];

        if (imageFile) {
            btn.innerText = "A enviar imagem...";
            if (imageUrl && imageUrl.includes('firebasestorage')) {
                await window.deleteFileFromStorage(imageUrl);
            }
            const path = `meditations/${Date.now()}_${imageFile.name}`;
            imageUrl = await uploadImageToStorage(imageFile, path);
        }

        // Audio File Processing (New Feature with Progress)
        const audioFile = document.getElementById('med-audio-file').files[0];
        if (audioFile) {
            btn.innerText = "A enviar áudio...";

            if (url && url.includes('firebasestorage')) {
                await window.deleteFileFromStorage(url);
            }

            // Show Progress UI
            const progressContainer = document.getElementById('audio-upload-progress');
            const progressBar = document.getElementById('audio-progress-bar');
            const progressText = document.getElementById('audio-progress-text');

            if (progressContainer) progressContainer.classList.remove('hidden');

            const path = `meditations_audio/${Date.now()}_${audioFile.name}`;

            try {
                const audioUrl = await uploadFileWithProgress(audioFile, path, (percent) => {
                    const p = Math.round(percent);
                    if (progressBar) progressBar.style.width = p + '%';
                    if (progressText) progressText.innerText = `A carregar... ${p}%`;
                });

                if (audioUrl) {
                    url = audioUrl;
                    if (progressText) progressText.innerText = "Upload concluído! ✅";
                    setTimeout(() => {
                        if (progressContainer) progressContainer.classList.add('hidden');
                    }, 2000);
                }
            } catch (err) {
                if (progressText) progressText.innerText = "Erro no upload ❌";
                alert("Erro no upload do áudio: " + err.message);
                // Don't throw, let it continue saving regular data if user wants? 
                // But probably should stop.
                throw err;
            }
        }

        const desc = (window.tinymce && tinymce.get('med-desc')) ? tinymce.get('med-desc').getContent() : document.getElementById('med-desc').value;

        const data = {
            // Presentation
            card_title: cardTitle,
            card_text: cardText,
            card_bg_type: cardBgType,
            card_bg_color: cardBgColor,
            card_opacity: cardOpacity,
            image_url: imageUrl, // Shared as card bg image and detail cover if needed

            // Detail
            page_title: pageTitle,
            page_subtitle: pageSubtitle,
            title,
            theme,
            type,
            url,
            description: desc,
            active: true,
            created_at: new Date().toISOString()
        };

        if (id) {
            // Update
            // Don't overwrite created_at on edit unless needed, but let's keep it simple. 
            // Better: delete data.created_at if id exists to preserve original date? 
            // Or just update 'updated_at'. Firestore doesn't care.
            await window.db.collection('meditations').doc(id).set(data, { merge: true });
            alert("Recurso atualizado com sucesso! 🎧");
        } else {
            await window.db.collection('meditations').add(data);
            alert("Recurso adicionado com sucesso! 🎧");
        }

        if (e) e.target.reset();
        window.resetMeditationForm();
        loadMeditations();

    } catch (error) {
        console.error("Error saving meditation:", error);
        alert("Erro ao guardar: " + error.message);
    } finally {
        if (btn) {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
}

// Global cache to store meditations content
window.meditationsCache = {};

async function loadMeditations() {
    const list = document.getElementById('admin-meditations-list');
    if (!list) return;

    list.innerHTML = '<p>A carregar...</p>';

    try {
        const snapshot = await window.db.collection('meditations').orderBy('created_at', 'desc').get();

        if (snapshot.empty) {
            list.innerHTML = '<p>Nenhum recurso encontrado.</p>';
            return;
        }

        // Group by Card Title (Theme)
        const groups = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            window.meditationsCache[doc.id] = data; // Cache for edit

            // Use card_title as the grouping key (Theme Name)
            // Fallback to title if card_title is missing
            const themeKey = data.card_title || data.title || 'Sem Título';

            if (!groups[themeKey]) {
                groups[themeKey] = [];
            }
            groups[themeKey].push({ id: doc.id, ...data });
        });

        let html = '';

        // Sort themes alphabetically or by some logic? keeping insertion order (grouped) for now or Object.keys
        const sortedKeys = Object.keys(groups).sort();

        for (const theme of sortedKeys) {
            const items = groups[theme];

            // Theme Header
            html += `
                <div class="admin-group mb-20">
                    <h3 style="font-family: 'Cormorant Garamond', serif; color: var(--color-primary); border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px;">
                        ${theme}
                    </h3>
                    <div class="group-items">
            `;

            // Items
            items.forEach(item => {
                const displayTitle = item.page_title || item.title || 'Sem Título';
                const displaySub = item.card_title || item.title;

                html += `
                <div class="cms-item compact" style="padding: 10px; border-bottom: 1px solid #eee; background: white; margin-bottom: 5px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h4 style="margin:0; color: #5a4b41; font-family: 'Montserrat', sans-serif; font-size: 0.85rem; font-weight: 600;">${displayTitle}</h4>
                            <p style="margin:2px 0 0; font-size: 0.8rem; color: #888;">
                                ${displaySub}
                            </p>
                        </div>
                        <div style="display:flex; gap: 10px;">
                            <button onclick="editMeditation('${item.id}')" class="btn-icon" title="Editar" style="background:none; border:none; cursor:pointer;"><i data-lucide="edit-2"></i></button>
                            <button onclick="deleteMeditation('${item.id}')" class="btn-icon delete" title="Apagar" style="background:none; border:none; cursor:pointer; color:#d32f2f;"><i data-lucide="trash-2"></i></button>
                        </div>
                    </div>
                </div>`;
            });

            html += `
                    </div>
                </div>
            `;
        }

        list.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();

    } catch (error) {
        console.error(error);
        list.innerHTML = '<p style="color:red">Erro ao carregar lista.</p>';
    }
}

window.deleteMeditation = async (id) => {
    if (confirm("Tem a certeza que quer apagar este recurso?")) {
        try {
            await window.db.collection('meditations').doc(id).delete();
            loadMeditations();
        } catch (e) {
            alert("Erro ao apagar: " + e.message);
        }
    }
};

window.editMeditation = (id) => {
    const data = window.meditationsCache[id];
    if (!data) {
        console.error("Meditation not found in cache:", id);
        alert("Erro: Dados não encontrados.");
        return;
    }

    document.getElementById('med-id').value = id;

    // DETAIL
    document.getElementById('med-page-title').value = data.page_title || data.title || '';
    document.getElementById('med-page-subtitle').value = data.page_subtitle || '';
    document.getElementById('med-title').value = data.title;
    document.getElementById('med-theme').value = data.theme;
    document.getElementById('med-type').value = data.type;
    document.getElementById('med-url').value = data.url;
    document.getElementById('med-desc').value = data.description || '';
    if (window.tinymce && tinymce.get('med-desc')) tinymce.get('med-desc').setContent(data.description || '');

    // PRESENTATION
    document.getElementById('med-card-title').value = data.card_title || data.title; // Fallback
    document.getElementById('med-card-text').value = data.card_text || '';
    document.getElementById('med-card-bg-type').value = data.card_bg_type || 'image';
    document.getElementById('med-card-bg-color').value = data.card_bg_color || '#80864f';
    document.getElementById('med-card-bg-color-hex').value = data.card_bg_color || '#80864f';
    document.getElementById('med-card-opacity').value = data.card_opacity || '0.6';

    window.setFileUrlInput('med-image-url', data.image_url || '');
    document.getElementById('med-image').value = '';
    window.renderFilePreview('med-image-preview', data.image_url || '', { urlInputId: 'med-image-url', fileInputId: 'med-image' });

    const medAudioInput = document.getElementById('med-audio-url-hidden');
    const audioUrl = data.url && data.url.includes('firebasestorage') ? data.url : '';
    if (medAudioInput) window.setFileUrlInput('med-audio-url-hidden', audioUrl);
    window.renderFilePreview('med-audio-preview', audioUrl, { urlInputId: 'med-audio-url-hidden', fileInputId: 'med-audio-file' });

    // Trigger toggle to show correct BG input
    window.toggleMedBgType();

    document.getElementById('med-submit-btn').innerText = "Atualizar Recurso";
    document.getElementById('med-cancel-btn').classList.remove('hidden');

    // Resource Filename Display Logic
    const resDisplay = document.getElementById('current-resource-display');
    const resFilename = document.getElementById('current-filename');
    const currentUrl = data.url || "";

    if (resDisplay && resFilename && currentUrl && currentUrl.length > 5) {
        resDisplay.classList.remove('hidden');

        // Try to extract readable name
        let readableName = "Link Externo";
        try {
            if (currentUrl.includes('firebasestorage')) {
                // Extract after last slash and before ?
                let path = decodeURIComponent(currentUrl.split('?')[0]);
                readableName = path.substring(path.lastIndexOf('/') + 1);
                // Remove timestamp prefix if present (123456789_)
                if (readableName.match(/^\d+_/)) {
                    readableName = readableName.replace(/^\d+_/, '');
                }
            } else if (currentUrl.includes('drive.google')) {
                readableName = "Google Drive Link";
            } else if (currentUrl.includes('youtu')) {
                readableName = "Vídeo YouTube";
            } else {
                readableName = currentUrl.substring(0, 30) + "...";
            }
        } catch (e) { readableName = "Link ativo"; }

        resFilename.innerText = readableName;
    } else if (resDisplay) {
        resDisplay.classList.add('hidden');
    }

    // Scroll to form
    const form = document.getElementById('meditation-form');
    if (form) form.scrollIntoView({ behavior: 'smooth' });
};

window.resetMeditationForm = () => {
    const form = document.getElementById('meditation-form');
    if (form) form.reset();
    window.setFileUrlInput('med-image-url', '');
    document.getElementById('med-image').value = ''; // Clear image input
    window.renderFilePreview('med-image-preview', '', { urlInputId: 'med-image-url', fileInputId: 'med-image' });

    document.getElementById('med-audio-file').value = ''; // Clear audio input
    const medAudioInput = document.getElementById('med-audio-url-hidden');
    if (medAudioInput) window.setFileUrlInput('med-audio-url-hidden', '');
    window.renderFilePreview('med-audio-preview', '', { urlInputId: 'med-audio-url-hidden', fileInputId: 'med-audio-file' });


    // clear tinymce
    if (window.tinymce && tinymce.get('med-desc')) tinymce.get('med-desc').setContent('');

    // Reset BG Toggle
    document.getElementById('med-card-bg-type').value = 'image';
    window.toggleMedBgType();

    document.getElementById('med-submit-btn').innerText = "Publicar Recurso";
    document.getElementById('med-cancel-btn').classList.add('hidden');
};

// --- Site Content (Home & About) ---

async function loadSiteContent() {
    // Wait for DB to initialize (Localhost race condition fix)
    if (!window.db) {
        setTimeout(loadSiteContent, 500);
        return;
    }

    try {
        const doc = await window.db.collection('site_content').doc('main').get();
        if (doc.exists) {
            const data = doc.data();

            // Populate Service Config Form
            if (data.service_section) {
                const svcBgUrl = data.service_section.background_image || '';
                if (document.getElementById('service-bg-url')) window.setFileUrlInput('service-bg-url', svcBgUrl);
                window.renderFilePreview('service-bg-preview', svcBgUrl, { urlInputId: 'service-bg-url', fileInputId: 'service-bg-file' });
                if (document.getElementById('service-section-title')) document.getElementById('service-section-title').value = data.service_section.title || '';
                if (document.getElementById('service-title-highlight-enabled')) document.getElementById('service-title-highlight-enabled').checked = data.service_section.title_highlight_enabled || false;
                if (document.getElementById('service-title-highlight-color')) document.getElementById('service-title-highlight-color').value = data.service_section.title_highlight_color || '#f7f2e0';

                if (document.getElementById('service-title-highlight-opacity')) {
                    const op = (data.service_section.title_highlight_opacity !== undefined) ? data.service_section.title_highlight_opacity : 1;
                    document.getElementById('service-title-highlight-opacity').value = op;
                    if (document.getElementById('service-title-opacity-val')) document.getElementById('service-title-opacity-val').innerText = Math.round(op * 100) + '%';
                }
            }

            // Populate Home Form
            if (data.home) {
                if (document.getElementById('home-title')) document.getElementById('home-title').value = data.home.title || '';
                if (document.getElementById('home-subtitle')) document.getElementById('home-subtitle').value = data.home.subtitle || '';
                if (document.getElementById('home-cta')) document.getElementById('home-cta').value = data.home.cta_text || '';
                if (document.getElementById('home-text-color')) document.getElementById('home-text-color').value = data.home.text_color || '#f7f2e0';
                if (document.getElementById('home-text-highlight')) document.getElementById('home-text-highlight').checked = data.home.text_highlight || false;
                // Hero background image preview
                const homeImgUrl = data.home.hero_image || '';
                if (document.getElementById('home-image-url')) window.setFileUrlInput('home-image-url', homeImgUrl);
                window.renderFilePreview('home-image-preview', homeImgUrl, { urlInputId: 'home-image-url', fileInputId: 'home-image-file' });
            }

            // Populate About Form
            if (data.about) {
                if (document.getElementById('about-title')) document.getElementById('about-title').value = data.about.title || '';

                // Text Intro (Fallback to old 'text' if 'text_intro' missing)
                if (document.getElementById('about-text-intro')) {
                    document.getElementById('about-text-intro').value = data.about.text_intro || data.about.text || '';
                }

                // Text Art
                if (document.getElementById('about-text-art')) {
                    document.getElementById('about-text-art').value = data.about.text_art || '';
                }

                // Images
                const aboutImgUrl = data.about.image_url || '';
                const aboutImgArtUrl = data.about.image_art_url || '';
                if (document.getElementById('about-image-url')) window.setFileUrlInput('about-image-url', aboutImgUrl);
                window.renderFilePreview('about-image-preview', aboutImgUrl, { urlInputId: 'about-image-url', fileInputId: 'about-image-file' });
                if (document.getElementById('about-image-art-url')) window.setFileUrlInput('about-image-art-url', aboutImgArtUrl);
                window.renderFilePreview('about-image-art-preview', aboutImgArtUrl, { urlInputId: 'about-image-art-url', fileInputId: 'about-image-art-file' });

                // Colors
                if (document.getElementById('about-intro-bg')) document.getElementById('about-intro-bg').value = data.about.intro_bg || '#ffffff';
                if (document.getElementById('about-art-bg')) document.getElementById('about-art-bg').value = data.about.art_bg || '#f7f2e0';

                // Update hex inputs for visual feedback
                if (document.getElementById('about-intro-bg-hex')) document.getElementById('about-intro-bg-hex').value = document.getElementById('about-intro-bg').value;
                if (document.getElementById('about-art-bg-hex')) document.getElementById('about-art-bg-hex').value = document.getElementById('about-art-bg').value;

            }

            // Populate Home Summary Form
            if (data.home_about) {
                if (document.getElementById('home-about-title-input')) document.getElementById('home-about-title-input').value = data.home_about.title || '';
                if (document.getElementById('home-about-text-input')) document.getElementById('home-about-text-input').value = data.home_about.text || '';
                const homeAboutImgUrl = data.home_about.image_url || '';
                if (document.getElementById('home-about-image-url')) window.setFileUrlInput('home-about-image-url', homeAboutImgUrl);
                window.renderFilePreview('home-about-image-preview', homeAboutImgUrl, { urlInputId: 'home-about-image-url', fileInputId: 'home-about-image-file' });
            }

            const footerTitle = document.getElementById('footer-title');
            const footerCopyright = document.getElementById('footer-copyright');
            const footerCredit = document.getElementById('footer-credit');

            if (footerTitle && data.footer.title !== undefined) footerTitle.innerHTML = data.footer.title;
            if (footerCopyright && data.footer.copyright !== undefined) footerCopyright.innerHTML = data.footer.copyright;
            if (footerCredit && data.footer.dev_credit !== undefined) footerCredit.innerHTML = data.footer.dev_credit;

            // Update Footer Styles dynamically
            // Update Footer Styles dynamically
            if (data.footer.bg_color) document.documentElement.style.setProperty('--color-footer-bg', data.footer.bg_color);
            if (data.footer.text_color) document.documentElement.style.setProperty('--color-footer-text', data.footer.text_color);

            // FIX: Sync to LocalStorage so main.js has fresh data immediately
            localStorage.setItem('site_footer', JSON.stringify(data.footer));

            // Populate Contact Form
            if (data.contact) {
                if (document.getElementById('contact-title-input')) document.getElementById('contact-title-input').value = data.contact.title || '';
                if (document.getElementById('contact-subtitle-input')) document.getElementById('contact-subtitle-input').value = data.contact.subtitle || '';
                if (document.getElementById('contact-email-input')) document.getElementById('contact-email-input').value = data.contact.email || '';
                if (document.getElementById('contact-phone-input')) document.getElementById('contact-phone-input').value = data.contact.phone || '';
                if (document.getElementById('contact-instagram-input')) document.getElementById('contact-instagram-input').value = data.contact.instagram || '';
            }

        }
    } catch (error) {
        console.error("Error loading site content:", error);
    }
}

async function handleHomeSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    // Explicitly grab the button to provide feedback
    const btn = document.getElementById('home-save-btn');
    if (!btn) return;
    const originalText = btn.textContent;
    btn.textContent = "A guardar...";
    btn.disabled = true;

    try {
        let imageUrl = document.getElementById('home-image-url').value;
        const imageFile = document.getElementById('home-image-file').files[0];

        // Upload Image if selected
        if (imageFile) {
            btn.textContent = "A enviar imagem...";
            try {
                // Upload to Storage
                const path = `home / ${Date.now()}_${imageFile.name} `;
                imageUrl = await uploadImageToStorage(imageFile, path);
            } catch (err) {
                console.error("Image Processing Error:", err);
                alert("Erro ao processar imagem: " + err.message);
                throw err;
            }
        }



        const data = {
            home: {
                title: document.getElementById('home-title').value,
                subtitle: document.getElementById('home-subtitle').value,
                cta_text: document.getElementById('home-cta').value,
                text_color: document.getElementById('home-text-color').value,
                text_highlight: document.getElementById('home-text-highlight').checked,
                hero_image: imageUrl
            }
        };



        // Explicitly check value
        const isHighlight = document.getElementById('home-text-highlight').checked;

        await window.db.collection('site_content').doc('main').set(data, { merge: true });

        // --- SYNC: Auto-Enable Header Transparency if Highlight is ON ---
        if (isHighlight === true) {
            try {
                // FORCE UPDATE regardless of current state to ensure consistency
                const doc = await window.db.collection('site_content').doc('main').get();
                let currentHeader = doc.exists ? (doc.data().header || {}) : {};

                // Ensure defaults
                const defaults = {
                    bg_color: '#80864f',
                    text_color: '#f7f2e0',
                    font_size: 16,
                    padding: 20
                };
                const newHeader = { ...defaults, ...currentHeader, transparent: true };

                // 1. Save to DB
                await window.db.collection('site_content').doc('main').set({
                    header: newHeader
                }, { merge: true });

                // 2. Update Local & UI
                localStorage.setItem('site_header', JSON.stringify(newHeader));
                if (typeof applyHeaderSettings === 'function') applyHeaderSettings(newHeader);

                // 3. Update Checkbox if visible
                const hCheck = document.getElementById('header-transparent');
                if (hCheck) hCheck.checked = true;

            } catch (err) {
                console.warn("Auto-header-sync failed:", err);
            }
        }

        alert("Conteúdo da Página Inicial atualizado!");

    } catch (error) {
        console.error("Error saving home content:", error);
        alert("Erro ao guardar: " + error.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function handleAboutSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    const btn = document.getElementById('about-save-btn');
    if (!btn) return;
    const originalText = btn.textContent;
    btn.textContent = "A guardar...";
    btn.disabled = true;

    try {
        // Image 1 (Intro)
        let imageUrl = window.getFileUrlInput('about-image-url');
        const imageFile = document.getElementById('about-image-file').files[0];

        if (imageFile) {
            btn.textContent = "A enviar imagem 1...";
            if (imageUrl && imageUrl.includes('firebasestorage')) {
                await window.deleteFileFromStorage(imageUrl);
            }
            const path = `about / ${Date.now()}_${imageFile.name} `;
            imageUrl = await uploadImageToStorage(imageFile, path);
        }

        // Image 2 (Art)
        let imageArtUrl = window.getFileUrlInput('about-image-art-url');
        const imageArtFile = document.getElementById('about-image-art-file').files[0];

        if (imageArtFile) {
            btn.textContent = "A enviar imagem 2...";
            if (imageArtUrl && imageArtUrl.includes('firebasestorage')) {
                await window.deleteFileFromStorage(imageArtUrl);
            }
            const path = `about / art_${Date.now()}_${imageArtFile.name} `;
            imageArtUrl = await uploadImageToStorage(imageArtFile, path);
        }

        const data = {
            about: {
                title: document.getElementById('about-title').value,
                text_intro: (window.tinymce && tinymce.get('about-text-intro')) ? tinymce.get('about-text-intro').getContent() : document.getElementById('about-text-intro').value,
                text_art: (window.tinymce && tinymce.get('about-text-art')) ? tinymce.get('about-text-art').getContent() : document.getElementById('about-text-art').value,
                image_url: imageUrl,
                image_art_url: imageArtUrl,
                // Colors
                intro_bg: document.getElementById('about-intro-bg').value,
                art_bg: document.getElementById('about-art-bg').value
            }
        };

        await window.db.collection('site_content').doc('main').set(data, { merge: true });
        alert("Página 'Sobre Mim' atualizada e salva!");

    } catch (error) {
        console.error("Error saving about content:", error);
        alert("Erro ao guardar: " + error.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// Image Removal for Home About (Legacy support, now uses removeFileWithUrl in HTML)
window.removeHomeAboutImage = async function () {
    const urlInput = document.getElementById('home-about-image-url');
    if (urlInput && urlInput.value) {
        await window.removeFileWithUrl('home-about-image-url', 'home-about-image-file');
    } else {
        const fileInput = document.getElementById('home-about-image-file');
        if (urlInput) urlInput.value = '';
        if (fileInput) fileInput.value = '';
        alert("Imagem removida do formulário.");
    }
};

// New Handler for Home Summary
async function handleHomeAboutSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    const btn = document.getElementById('home-about-save-btn');
    if (!btn) return;
    const originalText = btn.textContent;
    btn.textContent = "A guardar...";
    btn.disabled = true;

    try {
        let imageUrl = window.getFileUrlInput('home-about-image-url');
        const imageFile = document.getElementById('home-about-image-file').files[0];

        // Upload Image
        if (imageFile) {
            btn.textContent = "A enviar imagem...";
            if (imageUrl && imageUrl.includes('firebasestorage')) {
                await window.deleteFileFromStorage(imageUrl);
            }
            const path = `home_about / ${Date.now()}_${imageFile.name} `;
            imageUrl = await uploadImageToStorage(imageFile, path);
        }

        const data = {
            home_about: {
                title: document.getElementById('home-about-title-input').value,
                text: (window.tinymce && tinymce.get('home-about-text-input')) ? tinymce.get('home-about-text-input').getContent() : document.getElementById('home-about-text-input').value,
                image_url: imageUrl
            }
        };

        await window.db.collection('site_content').doc('main').set(data, { merge: true });
        alert("Resumo 'Sobre' da Página Inicial atualizado!");

    } catch (error) {
        console.error("Error saving home summary:", error);
        alert("Erro ao guardar: " + error.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

window.handleFooterSubmit = async () => {
    const btn = document.querySelector('#footer-form button');
    const originalText = btn ? btn.textContent : 'Guardar';
    if (btn) btn.textContent = "A guardar...";

    const title = document.getElementById('footer-title-input').value;
    const copyright = document.getElementById('footer-copyright-input').value;
    const devCredit = document.getElementById('footer-dev-input').value;
    const bgColor = document.getElementById('footer-bg-hex').value;
    const textColor = document.getElementById('footer-text-hex').value;

    try {
        await window.db.collection('site_content').doc('main').set({
            footer: {
                title: title,
                copyright: copyright,
                dev_credit: devCredit,
                bg_color: bgColor,
                text_color: textColor
            }
        }, { merge: true });

        // Update Local Storage Immediately for Live Preview
        const newFooter = {
            title: title,
            copyright: copyright,
            dev_credit: devCredit,
            bg_color: bgColor,
            text_color: textColor
        };
        localStorage.setItem('site_footer', JSON.stringify(newFooter));

        // Trigger event for main.js to pick up
        window.dispatchEvent(new Event('storage'));

        // FIX: Manually update Dashboard DOM elements for immediate feedback
        const fTitle = document.getElementById('footer-title');
        const fCopyright = document.getElementById('footer-copyright');
        const fCredit = document.getElementById('footer-credit');

        if (fTitle) fTitle.innerHTML = title;
        if (fCopyright) fCopyright.innerHTML = copyright;
        if (fCredit) fCredit.innerHTML = devCredit;

        // Update CSS Vars
        document.documentElement.style.setProperty('--color-footer-bg', bgColor);
        document.documentElement.style.setProperty('--color-footer-text', textColor);

        alert("Rodapé atualizado com sucesso!");

        // SYNC WITH THEME (Bidirectional)
        try {
            // Update Firestore SAFE WAY (Dot Notation)
            const updatePayload = {};
            updatePayload['theme.footer_bg'] = bgColor;
            await window.db.collection('site_content').doc('main').update(updatePayload);

            // Local Storage Sync (Preserve existing)
            let currentTheme = JSON.parse(localStorage.getItem('site_theme'));
            if (currentTheme) {
                currentTheme.footer_bg = bgColor;
                localStorage.setItem('site_theme', JSON.stringify(currentTheme));
            }

            // Update Input if visible
            if (document.getElementById('theme-footer')) document.getElementById('theme-footer').value = bgColor;
            if (document.getElementById('theme-footer-hex')) document.getElementById('theme-footer-hex').value = bgColor;

        } catch (err) {
            console.warn("Could not sync footer to theme:", err);
        }
    } catch (error) {
        console.error("Error saving Footer content:", error);
        alert("Erro ao guardar rodapé.");
    } finally {
        if (btn) btn.textContent = originalText;
    }
};

window.handleContactSubmit = async () => {
    const btn = document.querySelector('#contact-form button');
    const originalText = btn ? btn.textContent : 'Guardar';
    if (btn) btn.textContent = "A guardar...";

    const title = document.getElementById('contact-title-input').value;
    const subtitle = document.getElementById('contact-subtitle-input').value;
    const email = document.getElementById('contact-email-input').value;
    const phone = document.getElementById('contact-phone-input').value;
    const instagram = document.getElementById('contact-instagram-input').value;

    try {
        await window.db.collection('site_content').doc('main').set({
            contact: {
                title: title,
                subtitle: subtitle,
                email: email,
                phone: phone,
                instagram: instagram
            }
        }, { merge: true });

        alert("Contactos atualizados com sucesso!");
    } catch (error) {
        console.error("Error saving Contact content:", error);
        alert("Erro ao guardar contactos.");
    } finally {
        if (btn) btn.textContent = originalText;
    }
};

// --- Theme Management ---
// Default Values (Must match style.css :root)
const DEFAULT_THEME = {
    bg_color: '#80864f',
    text_color: '#f7f2e0',
    primary_color: '#BF897F',
    header_bg: '#80864f', // Default Green
    secondary_beige: '#f7f2e0',
    secondary_blue: '#dac2b2',
    footer_bg: '#F7F2E0'
};

async function loadThemeSettings() {
    try {
        const doc = await window.db.collection('site_content').doc('main').get();
        let data = {}; // Default empty
        if (doc.exists) {
            data = doc.data().theme || {};

            // Set inputs to saved values or defaults
            // Legacy/Global fallback (kept for safety or migration)
            if (document.getElementById('theme-card-text')) document.getElementById('theme-card-text').value = data.card_text || '';

            if (document.getElementById('theme-bg')) document.getElementById('theme-bg').value = data.bg_color || DEFAULT_THEME.bg_color;
            if (document.getElementById('theme-text')) document.getElementById('theme-text').value = data.text_color || DEFAULT_THEME.text_color;
            if (document.getElementById('theme-primary')) document.getElementById('theme-primary').value = data.primary_color || DEFAULT_THEME.primary_color;
            if (document.getElementById('theme-header')) document.getElementById('theme-header').value = data.header_bg || DEFAULT_THEME.header_bg;
            if (document.getElementById('theme-secondary-1')) document.getElementById('theme-secondary-1').value = data.secondary_beige || DEFAULT_THEME.secondary_beige;
            if (document.getElementById('theme-secondary-2')) document.getElementById('theme-secondary-2').value = data.secondary_blue || DEFAULT_THEME.secondary_blue;
            if (document.getElementById('theme-footer')) document.getElementById('theme-footer').value = data.footer_bg || DEFAULT_THEME.footer_bg;

            // NEW: Dynamic Theme Texts
            const container = document.getElementById('theme-card-texts-container');
            if (container) {
                container.innerHTML = '<p class="font-xs text-muted">A carregar temas...</p>';

                // We need to know specific themes to generate inputs.
                // Using meditations collection to find all unique themes.
                const medSnapshot = await window.db.collection('meditations').get();
                const themes = new Set();
                medSnapshot.forEach(doc => {
                    const m = doc.data();
                    const t = m.card_title || m.title || 'Sem Título'; // Grouping key matches loadMeditations
                    themes.add(t);
                });

                const savedTexts = data.card_texts || {};
                let html = '';

                if (themes.size === 0) {
                    html = '<p class="font-xs text-muted">Nenhum tema encontrado (adicione meditações primeiro).</p>';
                } else {
                    const sortedThemes = Array.from(themes).sort();
                    sortedThemes.forEach(themeName => {
                        // Safe ID for attributes
                        const safeKey = themeName; // We use the name as key in the map
                        const val = savedTexts[safeKey] || ''; // Saved value or empty

                        html += `
                            <div class="cms-item compact" style="padding: 10px; border: 1px solid #eee; border-radius: 4px;">
                                <label class="block-mb-5 font-xs font-weight-600" style="color: var(--color-primary)">${themeName}</label>
                                <input type="text" 
                                    class="form-input font-xs" 
                                    placeholder="Ex: Explorar..." 
                                    value="${val}" 
                                    data-theme-key="${safeKey}">
                            </div>
                        `;
                    });
                }
                container.innerHTML = html;
            }

            // Update HEX inputs
            updateHexInputs();

            // Update Local Storage immediately for consistency
            if (doc.data().theme) {
                localStorage.setItem('site_theme', JSON.stringify(data));
                applyTheme(data);
            }
        }
    } catch (error) {
        console.error("Error loading theme:", error);
    }
}

function updateHexInputs() {
    if (document.getElementById('theme-bg')) document.getElementById('theme-bg-hex').value = document.getElementById('theme-bg').value;
    if (document.getElementById('theme-text')) document.getElementById('theme-text-hex').value = document.getElementById('theme-text').value;
    if (document.getElementById('theme-primary')) document.getElementById('theme-primary-hex').value = document.getElementById('theme-primary').value;
    if (document.getElementById('theme-header')) document.getElementById('theme-header-hex').value = document.getElementById('theme-header').value;
    if (document.getElementById('theme-secondary-1')) document.getElementById('theme-secondary-1-hex').value = document.getElementById('theme-secondary-1').value;
    if (document.getElementById('theme-secondary-2')) document.getElementById('theme-secondary-2-hex').value = document.getElementById('theme-secondary-2').value;
    if (document.getElementById('theme-footer')) document.getElementById('theme-footer-hex').value = document.getElementById('theme-footer').value;
}

function setupHexListeners() {
    const pairs = [
        { color: 'theme-bg', hex: 'theme-bg-hex' },
        { color: 'theme-text', hex: 'theme-text-hex' },
        { color: 'theme-primary', hex: 'theme-primary-hex' },
        { color: 'theme-header', hex: 'theme-header-hex' },
        { color: 'theme-secondary-1', hex: 'theme-secondary-1-hex' },
        { color: 'theme-secondary-2', hex: 'theme-secondary-2-hex' },
        { color: 'theme-footer', hex: 'theme-footer-hex' },
        // About Page Colors
        { color: 'about-intro-bg', hex: 'about-intro-bg-hex' },
        // Text Color Removed
        { color: 'about-art-bg', hex: 'about-art-bg-hex' },
        // Text Color Removed
        // Service Colors
        { color: 'svc-sec2-bg', hex: 'svc-sec2-bg-hex' },
        { color: 'svc-sec2-text', hex: 'svc-sec2-text-hex' },
        { color: 'svc-testi-bg', hex: 'svc-testi-bg-hex' },
        { color: 'svc-testi-text', hex: 'svc-testi-text-hex' },
        { color: 'svc-top-bg-color', hex: 'svc-top-bg-hex' },
        { color: 'svc-bottom-bg-color', hex: 'svc-bottom-bg-hex' },
        { color: 'svc-btn-text-color', hex: 'svc-btn-text-hex' }
    ];

    pairs.forEach(pair => {
        const colorInput = document.getElementById(pair.color);
        const hexInput = document.getElementById(pair.hex);

        if (colorInput && hexInput) {
            // Color picker changes -> Update Hex
            colorInput.addEventListener('input', (e) => {
                hexInput.value = e.target.value.toUpperCase();
            });

            // Hex input changes -> Update Color picker (if valid)
            hexInput.addEventListener('input', (e) => {
                let val = e.target.value;
                if (!val.startsWith('#')) {
                    val = '#' + val;
                }
                // Validate Hex
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                    colorInput.value = val;
                }
            });

            // On blur, format nicely
            hexInput.addEventListener('blur', (e) => {
                let val = e.target.value;
                if (!val.startsWith('#')) val = '#' + val;
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                    e.target.value = val.toUpperCase();
                    colorInput.value = val;
                } else {
                    // Revert to picker value if invalid
                    e.target.value = colorInput.value.toUpperCase();
                }
            });
        }
    });
}

// --- Header Management ---

// --- Header Management ---

async function loadHeaderSettings() {
    try {
        const doc = await window.db.collection('site_content').doc('main').get();
        if (doc.exists) {
            const data = doc.data().header || {};
            const defaults = {
                transparent: false,
                bg_color: '#80864f', // Default Green
                text_color: '#f7f2e0', // Default Beige
                font_size: 16,
                padding: 20
            };

            const header = { ...defaults, ...data };

            if (document.getElementById('header-transparent')) document.getElementById('header-transparent').checked = header.transparent;
            if (document.getElementById('header-bg-color')) {
                document.getElementById('header-bg-color').value = header.bg_color;
                if (document.getElementById('header-bg-color-hex')) document.getElementById('header-bg-color-hex').value = header.bg_color;
            }
            if (document.getElementById('header-text-color')) {
                document.getElementById('header-text-color').value = header.text_color;
                if (document.getElementById('header-text-color-hex')) document.getElementById('header-text-color-hex').value = header.text_color;
            }
            if (document.getElementById('header-font-size')) document.getElementById('header-font-size').value = header.font_size;
            if (document.getElementById('header-padding')) document.getElementById('header-padding').value = header.padding;

            if (document.getElementById('med-card-bg-type')) document.getElementById('med-card-bg-type').value = data.card_bg_type || 'color';
            if (document.getElementById('med-card-bg-color')) document.getElementById('med-card-bg-color').value = data.card_bg_color || '#80864f';
            if (document.getElementById('med-card-opacity')) {
                // Fix: Ensure 0 is treated as a value, not false
                const op = (data.card_opacity !== undefined && data.card_opacity !== null) ? data.card_opacity : 0.3;
                document.getElementById('med-card-opacity').value = op;
            }

            // Page Details
            if (document.getElementById('med-page-title')) document.getElementById('med-page-title').value = data.page_title || '';
            if (document.getElementById('med-page-subtitle')) document.getElementById('med-page-subtitle').value = data.page_subtitle || '';

            // Trigger visual updates
            window.toggleMedBgType();
            // Hex Sync
            if (document.getElementById('header-bg-color-hex')) document.getElementById('header-bg-color-hex').value = header.bg_color;
            if (document.getElementById('header-text-color-hex')) document.getElementById('header-text-color-hex').value = header.text_color;

            // Apply immediately (Preview)
            applyHeaderSettings(header);

            // Show current logo status if exists?
            // Could add a preview img later or just let the site preview show it.
        }
    } catch (e) {
        console.error("Error loading header settings:", e);
    }
}

async function handleHeaderSubmit(e) {
    if (e) e.preventDefault();
    const btn = document.getElementById('header-save-btn');
    if (!btn) return;

    const originalText = "Guardar"; // Force reset text
    btn.textContent = "A guardar...";
    btn.disabled = true;

    try {
        let logoUrl = null;
        const logoInput = document.getElementById('header-logo-upload');

        // 1. Handle Logo Upload
        if (logoInput.files && logoInput.files[0]) {
            btn.textContent = "A enviar logo..."; // Update status
            const logoFile = logoInput.files[0];
            const path = `header_logo/${Date.now()}_${logoFile.name}`;

            try {
                logoUrl = await uploadImageToStorage(logoFile, path);
                console.log("Logo uploaded:", logoUrl);
            } catch (uploadError) {
                console.error("Logo upload failed:", uploadError);
                alert("Aviso: Falha ao enviar o logótipo. O resto das definições será guardado.");
            }
        }

        // 2. Get Current Data (to preserve existing logo if no new one)
        const currentDoc = await window.db.collection('site_content').doc('main').get();
        const currentData = currentDoc.exists ? (currentDoc.data().header || {}) : {};

        // Use new URL, OR existing URL, OR null
        const finalLogoUrl = logoUrl || currentData.logo_url || null;

        const headerSettings = {
            logo_url: finalLogoUrl,
            transparent: document.getElementById('header-transparent').checked,
            bg_color: document.getElementById('header-bg-color').value,
            text_color: document.getElementById('header-text-color').value,
            font_size: document.getElementById('header-font-size').value,
            padding: document.getElementById('header-padding').value
        };

        // 3. Save to Firestore
        await window.db.collection('site_content').doc('main').set({
            header: headerSettings
        }, { merge: true });

        // 4. Update Local Storage & Apply (Immediate Feedback)
        localStorage.setItem('site_header', JSON.stringify(headerSettings));
        applyHeaderSettings(headerSettings);

        // 5. Success
        alert("Cabeçalho atualizado com sucesso!");

        // 6. SYNC WITH THEME (Bidirectional)
        try {
            // Update Firestore SAFE WAY (Dot Notation)
            const updatePayload = {};
            updatePayload['theme.header_bg'] = headerSettings.bg_color;
            await window.db.collection('site_content').doc('main').update(updatePayload);

            // Local Storage Sync
            let currentTheme = JSON.parse(localStorage.getItem('site_theme'));
            if (currentTheme) {
                currentTheme.header_bg = headerSettings.bg_color;
                localStorage.setItem('site_theme', JSON.stringify(currentTheme));
            }

            // Update Input if visible
            if (document.getElementById('theme-header')) {
                document.getElementById('theme-header').value = headerSettings.bg_color;
            }
            if (document.getElementById('theme-header-hex')) {
                document.getElementById('theme-header-hex').value = headerSettings.bg_color;
            }

        } catch (err) {
            console.warn("Could not sync theme settings:", err);
        }

    } catch (error) {
        console.error("Error saving header:", error);
        alert("Erro ao guardar cabeçalho: " + error.message);
    } finally {
        // 6. Reset Button State ALWAYS
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function applyHeaderSettings(settings) {
    const root = document.documentElement;
    root.style.setProperty('--header-transparent', settings.transparent ? '1' : '0');
    root.style.setProperty('--nav-bg', settings.bg_color); // Sync with theme var
    root.style.setProperty('--nav-text', settings.text_color); // New var? Or reuse

    // Update Preview in Admin
    const preview = document.getElementById('admin-logo-preview');
    if (preview) {
        if (settings.logo_url) {
            preview.src = settings.logo_url;
            preview.classList.remove('hidden');
            preview.style.display = '';
        } else {
            preview.classList.add('hidden');
        }
    }

    // Update Dashboard Logo (Directly)
    const dashboardLogo = document.getElementById('header-logo-display');
    if (dashboardLogo) {
        if (settings.logo_url) {
            dashboardLogo.src = settings.logo_url;
            dashboardLogo.classList.remove('hidden');
            dashboardLogo.style.display = '';
        } else {
            dashboardLogo.classList.add('hidden');
        }
    }

    // We update global vars, but script.js handles the scroll logic
    // Let's store in localStorage for script.js to read on init
    localStorage.setItem('site_header', JSON.stringify(settings));
}

function applyTheme(colors) {
    const root = document.documentElement;
    if (colors.bg_color) root.style.setProperty('--color-bg', colors.bg_color);
    if (colors.text_color) root.style.setProperty('--color-text-main', colors.text_color);
    if (colors.primary_color) root.style.setProperty('--color-primary', colors.primary_color);
    if (colors.header_bg) root.style.setProperty('--nav-bg', colors.header_bg);
    if (colors.secondary_beige) root.style.setProperty('--color-secondary-beige', colors.secondary_beige);
    if (colors.secondary_blue) root.style.setProperty('--color-secondary-blue', colors.secondary_blue);
    if (colors.footer_bg) root.style.setProperty('--color-footer-bg', colors.footer_bg);
}

async function handleThemeSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const btn = document.getElementById('theme-save-btn');
    if (!btn) return;
    const originalText = btn.textContent;
    btn.textContent = "A guardar...";

    try {
        // 1. Get Existing Theme (to preserve Header/Footer BGs which are now managed separately)
        const existingTheme = JSON.parse(localStorage.getItem('site_theme')) || {};

        // 2. Build New Theme (Merging Generic Colors)
        const newTheme = {
            ...existingTheme, // Keep existing props (like header_bg, footer_bg)
            bg_color: document.getElementById('theme-bg').value,
            text_color: document.getElementById('theme-text').value,
            primary_color: document.getElementById('theme-primary').value,
            secondary_beige: document.getElementById('theme-secondary-1').value,
            secondary_blue: document.getElementById('theme-secondary-2').value
            // header_bg and footer_bg are NOT updated here anymore
        };

        // 3. Save to Firestore
        await window.db.collection('site_content').doc('main').set({
            theme: newTheme
        }, { merge: true });

        // 4. Update Local Storage
        localStorage.setItem('site_theme', JSON.stringify(newTheme));

        // 5. Apply
        applyTheme(newTheme);

        alert("Cores Gerais atualizadas com sucesso!");

    } catch (error) {
        console.error("Error saving theme:", error);
        alert("Erro ao guardar tema: " + error.message);
    } finally {
        btn.textContent = originalText;
    }
}

async function resetThemeSettings() {
    if (!confirm("Tem a certeza? Isto irá restaurar as cores originais do site.")) return;

    try {
        // 1. Save Defaults to Cloud
        await window.db.collection('site_content').doc('main').set({
            theme: DEFAULT_THEME,
            header: { // Also reset header to avoid overrides
                transparent: false,
                bg_color: DEFAULT_THEME.header_bg,
                text_color: '#ffffff', // White by default
                font_size: 16,
                padding: 20
            }
        }, { merge: true });

        // 2. Clear Local Storage
        localStorage.removeItem('site_theme');
        localStorage.removeItem('site_header');

        // 3. Reset UI inputs (Theme)
        if (document.getElementById('theme-bg')) {
            document.getElementById('theme-bg').value = DEFAULT_THEME.bg_color;
            if (document.getElementById('theme-bg-hex')) document.getElementById('theme-bg-hex').value = DEFAULT_THEME.bg_color;
        }
        if (document.getElementById('theme-text')) {
            document.getElementById('theme-text').value = DEFAULT_THEME.text_color;
            if (document.getElementById('theme-text-hex')) document.getElementById('theme-text-hex').value = DEFAULT_THEME.text_color;
        }
        if (document.getElementById('theme-primary')) {
            document.getElementById('theme-primary').value = DEFAULT_THEME.primary_color;
            if (document.getElementById('theme-primary-hex')) document.getElementById('theme-primary-hex').value = DEFAULT_THEME.primary_color;
        }
        if (document.getElementById('theme-secondary-1')) {
            document.getElementById('theme-secondary-1').value = DEFAULT_THEME.secondary_beige;
            if (document.getElementById('theme-secondary-1-hex')) document.getElementById('theme-secondary-1-hex').value = DEFAULT_THEME.secondary_beige;
        }
        if (document.getElementById('theme-secondary-2')) {
            document.getElementById('theme-secondary-2').value = DEFAULT_THEME.secondary_blue;
            if (document.getElementById('theme-secondary-2-hex')) document.getElementById('theme-secondary-2-hex').value = DEFAULT_THEME.secondary_blue;
        }

        // Header Inputs
        if (document.getElementById('header-transparent')) document.getElementById('header-transparent').checked = false;
        if (document.getElementById('header-bg-color')) {
            document.getElementById('header-bg-color').value = DEFAULT_THEME.header_bg;
            if (document.getElementById('header-bg-color-hex')) document.getElementById('header-bg-color-hex').value = DEFAULT_THEME.header_bg;
        }
        if (document.getElementById('header-text-color')) {
            document.getElementById('header-text-color').value = '#ffffff';
            if (document.getElementById('header-text-color-hex')) document.getElementById('header-text-color-hex').value = '#ffffff';
        }
        if (document.getElementById('header-font-size')) document.getElementById('header-font-size').value = 16;
        if (document.getElementById('header-padding')) document.getElementById('header-padding').value = 20;

        // Footer Inputs
        if (document.getElementById('footer-bg-color')) {
            document.getElementById('footer-bg-color').value = DEFAULT_THEME.footer_bg;
            if (document.getElementById('footer-bg-hex')) document.getElementById('footer-bg-hex').value = DEFAULT_THEME.footer_bg;
        }
        if (document.getElementById('footer-text-color')) {
            document.getElementById('footer-text-color').value = DEFAULT_THEME.text_color; // Assuming text default
            if (document.getElementById('footer-text-hex')) document.getElementById('footer-text-hex').value = DEFAULT_THEME.text_color;
        }


        // 4. Apply Defaults
        applyTheme(DEFAULT_THEME);

        alert("Cores originais restauradas!");

    } catch (error) {
        console.error("Error resetting theme:", error);
        alert("Erro ao restaurar.");
    }
}

// Attach listeners
document.addEventListener('DOMContentLoaded', () => {
    // ... existing existing listeners logic if any ...

    // NEW: Save Theme Specific Card Texts (from Meditations Panel)
    window.saveThemeCardTexts = async () => {
        const btn = document.getElementById('save-card-texts-btn');
        if (!btn) return;
        const originalText = btn.textContent;
        btn.textContent = "A guardar...";
        btn.disabled = true;

        try {
            // 1. Gather all inputs
            const container = document.getElementById('theme-card-texts-container');
            const inputs = container.querySelectorAll('input[data-theme-key]');
            const cardTexts = {};

            inputs.forEach(input => {
                const key = input.getAttribute('data-theme-key');
                const val = input.value.trim();
                if (key) {
                    cardTexts[key] = val;
                }
            });

            // 2. Get current theme to merge
            let currentTheme = {};
            try {
                const doc = await window.db.collection('site_content').doc('main').get();
                if (doc.exists && doc.data().theme) {
                    currentTheme = doc.data().theme;
                }
            } catch (e) {
                console.log("Error reading current theme for update", e);
            }

            // 3. Update the map (card_texts)
            // We replace the whole map or merge? Let's replace the map with current state of inputs.
            currentTheme.card_texts = cardTexts;

            // 4. Save
            await window.db.collection('site_content').doc('main').set({
                theme: currentTheme
            }, { merge: true });

            // 5. Update LocalStorage
            localStorage.setItem('site_theme', JSON.stringify(currentTheme));

            alert("Textos dos cartões atualizados!");

        } catch (error) {
            console.error("Error saving card texts:", error);
            alert("Erro ao guardar textos.");
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    };


    // Load Data
    loadSiteContent(); // Covers Home, About, Footer, Contact
    loadHeaderSettings();
    loadThemeSettings(); // Load Theme Settings on Init
    loadLegalContent();   // Load Legal
    setupHexListeners(); // Initialize Color Sync
});

// --- Legal Content Management ---

async function loadLegalContent() {
    try {
        const doc = await window.db.collection('site_content').doc('legal').get();
        let content = "";

        if (doc.exists && doc.data().html_content) {
            content = doc.data().html_content;
        } else {
            // Seed with default content if empty
            content = `
                <h2>Cláusula de Aceitação e Consentimento</h2>
                <p>Ao utilizar este website, o utilizador declara que leu, compreendeu e aceitou os presentes Termos de Uso, a Política de Privacidade, a Política de Proteção de Dados e a Política de Cookies.</p>
                <p>Ao disponibilizar os seus dados pessoais através deste site, o utilizador <strong>autoriza expressamente a sua recolha, tratamento, utilização e armazenamento</strong>, nos termos definidos nos documentos acima referidos.</p>
                <p>A Floresce Terapias reserva-se o direito de <strong>alterar, atualizar ou modificar</strong> estes documentos a qualquer momento, sem necessidade de aviso prévio, sendo da responsabilidade do utilizador a sua consulta regular para se manter informado.</p>
                <p>As presentes políticas aplicam-se a <strong>todos os dados pessoais recolhidos através deste website</strong>, bem como aos dados recolhidos no âmbito das atividades, sessões, eventos e serviços promovidos pela FT.</p>

                <h2>Identificação do Titular</h2>
                <p>O domínio do presente website é propriedade de Rita Barata, titular do 256142483, com domicílio fiscal em Lisboa, Portugal.</p>
                <p>Para efeitos legais, todas as referências a “Floresce Terapias” ou “FT” dizem respeito à entidade acima identificada.</p>

                <h2>1. Âmbito</h2>
                <p>Este website tem como finalidade disponibilizar informação sobre serviços, práticas, atividades e eventos promovidos pela FT, bem como permitir o contacto e a marcação de sessões.</p>
                <p>Ao aceder e utilizar este website, o utilizador concorda com os presentes Termos de Uso.</p>

                <h2>2. Condições de Utilização</h2>
                <p>Ao utilizar este site, o utilizador compromete-se a:</p>
                <ul>
                    <li>Utilizar a plataforma apenas para fins legais e legítimos;</li>
                    <li>Não praticar qualquer ação que comprometa a segurança, integridade ou funcionamento do site;</li>
                    <li>Não tentar aceder a áreas restritas, sistemas, dados ou informações que não lhe estejam destinados;</li>
                    <li>Não modificar, copiar, interferir, danificar ou utilizar indevidamente os conteúdos da plataforma;</li>
                    <li>Não utilizar o site de forma que viole direitos de terceiros ou a legislação em vigor.</li>
                </ul>

                <h2>3. Registo e Acesso (quando aplicável)</h2>
                <p>Caso existam áreas de acesso restrito, o utilizador compromete-se a fornecer informações verdadeiras, atuais e completas.</p>
                <p>O utilizador é responsável pela confidencialidade dos seus dados de acesso (email, palavra-passe ou outros meios de autenticação), bem como por toda a atividade realizada com as suas credenciais.</p>
                <p>A FT reserva-se o direito de suspender ou encerrar o acesso à plataforma sempre que exista uso indevido, violação destes termos ou utilização abusiva do site.</p>

                <h2>4. Serviços</h2>
                <p>Os serviços disponibilizados pela FT incluem práticas holísticas e criativas, terapias e atividades de desenvolvimento pessoal, em contexto individual ou de grupo, presencialmente ou online.</p>
                <p>Estes serviços <strong>não substituem acompanhamento médico, psicológico ou psiquiátrico</strong>, nem diagnósticos clínicos. As decisões relacionadas com saúde devem ser sempre tomadas com profissionais de saúde qualificados.</p>

                <h2>5. Responsabilidade</h2>
                <p>A FT compromete-se a exercer as suas práticas com ética, respeito, confidencialidade e cuidado.</p>
                <p>O utilizador reconhece que os processos terapêuticos são individuais e subjetivos, não sendo possível garantir resultados específicos.</p>
                <p>A FT não se responsabiliza por decisões pessoais, profissionais, médicas, financeiras ou legais tomadas com base nas sessões, práticas ou conteúdos do site.</p>

                <h2>6. Propriedade Intelectual</h2>
                <p>Todo o conteúdo deste site (textos, imagens, identidade visual, logótipos, conteúdos escritos e multimédia) é propriedade da FT, salvo indicação em contrário.</p>
                <p>É proibida a reprodução, cópia, distribuição ou utilização sem autorização prévia.</p>

                <hr style="margin: 40px 0; border: 0; border-top: 1px solid #ccc;">

                <h2>1. Recolha de Dados</h2>
                <p>A FT recolhe apenas os dados pessoais estritamente necessários para:</p>
                <ul>
                    <li>Contacto com o utilizador;</li>
                    <li>Marcação de sessões;</li>
                    <li>Resposta a pedidos de informação;</li>
                    <li>Gestão de inscrições em eventos ou atividades;</li>
                    <li>Gestão de serviços;</li>
                    <li>Organização de sessões e eventos;</li>
                    <li>Acompanhamento administrativo das atividades.</li>
                </ul>
                <p>Os dados podem incluir nome, email, contacto telefónico e outras informações fornecidas voluntariamente.</p>
                <p>Os dados <strong>não são vendidos, cedidos ou partilhados com terceiros</strong>, exceto quando legalmente obrigatório.</p>

                <h2>2. Finalidade dos Dados</h2>
                <p>Os dados recolhidos são utilizados exclusivamente para:</p>
                <ul>
                    <li>Comunicação com o utilizador;</li>
                </ul>

                <h2>3. Confidencialidade</h2>
                <p>Toda a informação partilhada no contexto das sessões é tratada com confidencialidade, ética e respeito pela privacidade do utilizador, dentro dos limites legais aplicáveis.</p>

                <h2>Proteção de Dados</h2>
                <p>A FT compromete-se a adotar medidas técnicas e organizativas adequadas para garantir a segurança, proteção e integridade dos dados pessoais dos utilizadores.</p>
                <p>Os dados são armazenados apenas pelo tempo necessário às finalidades para as quais foram recolhidos.</p>

                <h2>Direitos do Utilizador</h2>
                <p>O utilizador tem o direito de:</p>
                <ul>
                    <li>Aceder aos seus dados pessoais;</li>
                    <li>Solicitar a retificação ou atualização;</li>
                    <li>Solicitar a eliminação dos dados;</li>
                    <li>Limitar ou opor-se ao tratamento;</li>
                    <li>Retirar o consentimento a qualquer momento.</li>
                </ul>
                <p>Os pedidos devem ser feitos através dos contactos disponíveis no website.</p>

                <h1>Política de Cookies</h1>
                <p>Este site pode utilizar cookies essenciais para o seu funcionamento e para melhorar a experiência do utilizador.</p>
                <p>Os cookies permitem:</p>
                <ul>
                    <li>Garantir funcionalidades básicas do site;</li>
                    <li>Melhorar desempenho e navegação;</li>
                    <li>Compreender padrões de utilização da plataforma.</li>
                </ul>
                <p>O utilizador pode configurar o seu navegador para recusar cookies ou alertar para a sua utilização, podendo isso afetar o correto funcionamento do site.</p>

                <h1>Contactos</h1>
                <p>Para qualquer questão relacionada com:</p>
                <ul>
                    <li>Termos de Uso</li>
                    <li>Política de Privacidade</li>
                    <li>Proteção de Dados</li>
                    <li>Cookies</li>
                </ul>
                <p>O utilizador pode contactar a FT através do e-mail <a href="mailto:floresceterapias@gmail.com">floresceterapias@gmail.com</a> ou <a href="mailto:barata.rita@outlook.com">barata.rita@outlook.com</a>.</p>
                <p><em>Esta política de privacidade foi atualizada a 13 de fevereiro de 2026.</em></p>
            `;
        }

        if (window.tinymce && tinymce.get('legal-editor')) {
            tinymce.get('legal-editor').setContent(content);
        } else {
            document.getElementById('legal-editor').value = content;
        }

    } catch (e) {
        console.error("Error loading legal content:", e);
    }
}

async function handleLegalSubmit() {
    const btn = document.querySelector('#legal-form button');
    const originalText = btn ? btn.textContent : 'Guardar';
    if (btn) btn.textContent = "A guardar...";

    let content = "";
    if (window.tinymce && tinymce.get('legal-editor')) {
        content = tinymce.get('legal-editor').getContent();
    } else {
        content = document.getElementById('legal-editor').value;
    }

    try {
        await window.db.collection('site_content').doc('legal').set({
            html_content: content,
            updated_at: new Date().toISOString()
        }, { merge: true });

        alert("Termos e Privacidade atualizados com sucesso!");
    } catch (error) {
        console.error("Error saving Legal content:", error);
        alert("Erro ao guardar conteúdo legal.");
    } finally {
        if (btn) btn.textContent = originalText;
    }
}

async function loadFooterContent() {
    try {
        const doc = await window.db.collection('site_content').doc('main').get();
        let data = {};

        if (doc.exists && doc.data().footer) {
            data = doc.data().footer;
        } else {
            // Fallback to LocalStorage
            const local = localStorage.getItem('site_footer');
            if (local) {
                console.log("CMS: Loading footer from LocalStorage fallback.");
                data = JSON.parse(local);
            }
        }

        // Defaults if still empty
        if (!data.title) data.title = "Floresce Terapias";
        if (!data.copyright) data.copyright = "© " + new Date().getFullYear() + " Floresce Terapias. Todos os direitos reservados.";
        if (data.dev_credit === undefined) data.dev_credit = "Developed by Antigravity"; // Use undefined check so empty string is valid

        // Populate Inputs
        if (document.getElementById('footer-title-input')) document.getElementById('footer-title-input').value = data.title || '';
        if (document.getElementById('footer-copyright-input')) document.getElementById('footer-copyright-input').value = data.copyright || '';
        if (document.getElementById('footer-dev-input')) document.getElementById('footer-dev-input').value = data.dev_credit || '';

        if (data.bg_color) document.getElementById('footer-bg-hex').value = data.bg_color;
        if (data.text_color) document.getElementById('footer-text-hex').value = data.text_color;

        // Also update color pickers
        if (data.bg_color && document.getElementById('footer-bg-color')) document.getElementById('footer-bg-color').value = data.bg_color;
        if (data.text_color && document.getElementById('footer-text-color')) document.getElementById('footer-text-color').value = data.text_color;

        // Update Preview Elements
        if (document.getElementById('footer-title')) document.getElementById('footer-title').innerHTML = data.title;
        if (document.getElementById('footer-copyright')) document.getElementById('footer-copyright').innerHTML = data.copyright;
        if (document.getElementById('footer-credit')) document.getElementById('footer-credit').innerHTML = data.dev_credit;

    } catch (e) {
        console.error("Error loading footer content:", e);
    }
}

async function loadContactContent() {
    try {
        const doc = await window.db.collection('site_content').doc('main').get();
        if (doc.exists) {
            const data = doc.data().contact || {};
            if (document.getElementById('contact-title-input')) document.getElementById('contact-title-input').value = data.title || '';
            if (document.getElementById('contact-subtitle-input')) document.getElementById('contact-subtitle-input').value = data.subtitle || '';
            if (document.getElementById('contact-email-input')) document.getElementById('contact-email-input').value = data.email || '';
            if (document.getElementById('contact-phone-input')) document.getElementById('contact-phone-input').value = data.phone || '';
            if (document.getElementById('contact-instagram-input')) document.getElementById('contact-instagram-input').value = data.instagram || '';
        }
    } catch (e) {
        console.error("Error loading contact content:", e);
    }
}

const homeAboutForm = document.getElementById('home-about-form');
if (homeAboutForm) homeAboutForm.addEventListener('submit', handleHomeAboutSubmit);

// --- MISSING LISTENERS ADDED ---
const homeContentForm = document.getElementById('home-content-form');
if (homeContentForm) homeContentForm.addEventListener('submit', handleHomeSubmit);

const aboutContentForm = document.getElementById('about-content-form');
if (aboutContentForm) aboutContentForm.addEventListener('submit', handleAboutSubmit);
// -------------------------------

// Footer Listener
const footerForm = document.getElementById('footer-form');
if (footerForm) {
    footerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleFooterSubmit();
    });
}

// Contact Listener
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleContactSubmit();
    });
}

// Header Listeners
const headerForm = document.getElementById('header-form');
if (headerForm) headerForm.addEventListener('submit', handleHeaderSubmit);

// Theme Listeners
const themeForm = document.getElementById('theme-form');
if (themeForm) themeForm.addEventListener('submit', handleThemeSubmit);

const themeResetBtn = document.getElementById('theme-reset-btn');
if (themeResetBtn) themeResetBtn.addEventListener('click', resetThemeSettings);

loadSiteContent();
loadThemeSettings();
loadHeaderSettings();
loadFooterContent();
setupHexListeners();

// Init Admin Panels
if (window.loadServices) window.loadServices();
if (window.loadMembers) window.loadMembers();
// =============================================
// --- Member Management Logic (v2) ---
// =============================================

window.membersCache = {};

// --- Helpers ---
function fmtDate(ts) {
    if (!ts) return 'N/A';
    try {
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('pt-PT');
    } catch { return 'N/A'; }
}

function fmtSeconds(sec) {
    if (!sec || sec < 1) return '0m';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

// --- Access Mode Toggle ---
window.loadAccessMode = async function () {
    try {
        const doc = await window.db.collection('config').doc('settings').get();
        const freeAccess = doc.exists ? (doc.data().freeAccess !== false) : true; // default: free
        const btn = document.getElementById('access-mode-toggle-btn');
        if (btn) {
            btn.textContent = freeAccess ? '🟢 Acesso Livre Ativo' : '🔴 Acesso Restrito Ativo';
            btn.dataset.mode = freeAccess ? 'free' : 'restricted';
            btn.style.background = freeAccess ? '#e8f5e9' : '#fff5f5';
            btn.style.borderColor = freeAccess ? '#4caf50' : '#f44336';
            btn.style.color = freeAccess ? '#2e7d32' : '#c62828';
        }
    } catch (e) {
        console.error('loadAccessMode error:', e);
    }
};

window.toggleAccessMode = async function () {
    const btn = document.getElementById('access-mode-toggle-btn');
    if (!btn) return;
    const currentlyFree = btn.dataset.mode === 'free';
    const newFree = !currentlyFree;
    const modeLabel = newFree ? 'ACESSO LIVRE (qualquer registo acede imediatamente)' : 'ACESSO RESTRITO (novos registos ficam pendentes)';
    if (!confirm(`Mudar para: ${modeLabel}?`)) return;

    try {
        await window.db.collection('config').doc('settings').set({ freeAccess: newFree }, { merge: true });
        await window.loadAccessMode();
    } catch (e) {
        alert('Erro ao mudar modo: ' + e.message);
    }
};

// --- Load Members (Full Table) ---
window.loadMembers = async function () {
    if (!window.db) { setTimeout(window.loadMembers, 500); return; }
    const listContainer = document.getElementById('admin-members-list');
    if (!listContainer) return;
    listContainer.innerHTML = '<p style="color:#888;padding:10px;">A carregar membros...</p>';

    // Also refresh access mode toggle
    await window.loadAccessMode();

    try {
        const querySnapshot = await window.db.collection('users').get();

        if (querySnapshot.empty) {
            listContainer.innerHTML = '<p style="padding:10px;">Sem membros registados.</p>';
            return;
        }

        // --- Sort: Pendente → Ativo → Bloqueado, then by createdAt desc ---
        const statusOrder = { pending: 0, active: 1, blocked: 2 };
        const members = [];
        querySnapshot.forEach(doc => {
            members.push({ id: doc.id, ...doc.data() });
            window.membersCache[doc.id] = doc.data();
        });
        members.sort((a, b) => {
            const so = (statusOrder[a.status] ?? 1) - (statusOrder[b.status] ?? 1);
            if (so !== 0) return so;
            const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return tb - ta;
        });

        // --- Row colors ---
        const rowBg = { pending: '#fff8e8', active: '#f0fff4', blocked: '#fff5f5' };
        const statusColor = { pending: '#e65100', active: '#2e7d32', blocked: '#c62828' };
        const statusLabel = { pending: '⏳ Pendente', active: '✅ Ativo', blocked: '⛔ Bloqueado' };

        let rows = '';
        members.forEach(data => {
            const isAdmin = ADMIN_EMAILS.some(a => a.toLowerCase() === (data.email || '').toLowerCase());
            const bg = isAdmin ? '#f0f4ff' : (rowBg[data.status] || '#fff');
            const sc = isAdmin ? '#3949ab' : (statusColor[data.status] || '#555');
            const sl = isAdmin ? '👑 Administrador' : (statusLabel[data.status] || data.status);
            const incidents = (data.incidents || []).join(' | ') || '—';

            const actionButtons = isAdmin
                ? `<span style="font-size:10px; color:#9e9e9e; font-style:italic;">Protegido</span>`
                : `<div style="display:flex; gap:4px; flex-wrap:wrap;">
                    ${data.status !== 'active'
                    ? `<button onclick="window.activateMember('${data.email}')"
                            style="background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;border-radius:4px;padding:2px 7px;font-size:10px;cursor:pointer;">Ativar</button>`
                    : ''}
                    ${data.status !== 'blocked'
                    ? `<button onclick="window.blockMember('${data.email}')"
                            style="background:#fff5f5;color:#c62828;border:1px solid #ef9a9a;border-radius:4px;padding:2px 7px;font-size:10px;cursor:pointer;">Bloquear</button>`
                    : ''}
                    <button onclick="window.deleteMember('${data.email}')"
                        style="background:#f5f5f5;color:#555;border:1px solid #ddd;border-radius:4px;padding:2px 7px;font-size:10px;cursor:pointer;">🗑</button>
                </div>`;

            rows += `
            <tr style="background:${bg}; border-bottom:1px solid #eee; vertical-align:top;">
                <td style="padding:7px 6px; min-width:100px; font-weight:600; font-size:12px;">${data.name || '<em style="color:#aaa">Sem nome</em>'}</td>
                <td style="padding:7px 6px; font-size:11px; color:#555; max-width:140px; word-break:break-all;">${data.email || '—'}</td>
                <td style="padding:7px 6px; font-size:11px; white-space:nowrap;">${fmtDate(data.createdAt)}</td>
                <td style="padding:7px 6px; font-size:11px; text-align:center;">${data.loginCount || 0}</td>
                <td style="padding:7px 6px; font-size:11px; text-align:center;">${fmtSeconds(data.totalTimeSeconds)}</td>
                <td style="padding:7px 4px; font-size:11px;">
                    <input type="date" id="pay-date-${data.email?.replace(/[@.]/g, '_')}"
                        value="${data.datePayment || ''}"
                        style="font-size:10px; border:1px solid #ddd; border-radius:4px; padding:2px 4px; width:110px;"
                        onchange="window.saveMemberPayment('${data.email}')">
                </td>
                <td style="padding:7px 4px; font-size:11px;">
                    <input type="number" id="pay-val-${data.email?.replace(/[@.]/g, '_')}"
                        value="${data.paymentValue || ''}"
                        placeholder="€"
                        style="font-size:10px; border:1px solid #ddd; border-radius:4px; padding:2px 4px; width:60px;"
                        onchange="window.saveMemberPayment('${data.email}')">
                </td>
                <td style="padding:7px 6px; font-size:11px; white-space:nowrap; font-weight:600; color:${sc};">${sl}</td>
                <td style="padding:7px 6px; font-size:10px; color:#777; max-width:120px; word-break:break-word;">${incidents}</td>
                <td style="padding:7px 6px; white-space:nowrap;">
                    ${actionButtons}
                </td>
            </tr>`;
        });

        listContainer.innerHTML = `
        <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:12px; min-width:900px;">
            <thead>
                <tr style="background:#f5f5f5; text-align:left; border-bottom:2px solid #ddd; font-size:11px; color:#555;">
                    <th style="padding:7px 6px;">User</th>
                    <th style="padding:7px 6px;">Email</th>
                    <th style="padding:7px 6px; white-space:nowrap;">Data Conta</th>
                    <th style="padding:7px 6px; text-align:center;">Logins</th>
                    <th style="padding:7px 6px; text-align:center; white-space:nowrap;">Tempo Site</th>
                    <th style="padding:7px 6px; white-space:nowrap;">Data Pagamento</th>
                    <th style="padding:7px 6px;">Valor €</th>
                    <th style="padding:7px 6px;">Status</th>
                    <th style="padding:7px 6px;">Incidentes</th>
                    <th style="padding:7px 6px;">Ações</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        </div>
        <p style="font-size:10px; color:#aaa; text-align:right; margin-top:6px;">
            Total: ${members.length} membros
            — 🟠 Pendentes: ${members.filter(m => m.status === 'pending').length}
            &nbsp;🟢 Ativos: ${members.filter(m => m.status === 'active').length}
            &nbsp;🔴 Bloqueados: ${members.filter(m => m.status === 'blocked').length}
        </p>`;

    } catch (error) {
        console.error('Error loading members:', error);
        listContainer.innerHTML = `<p style="color:red;padding:10px;">Erro ao carregar membros: ${error.message}</p>`;
    }
};

// --- Save Payment (manual fields) ---
window.saveMemberPayment = async function (email) {
    if (!email) return;
    const key = email.replace(/[@.]/g, '_');
    const dateInput = document.getElementById(`pay-date-${key}`);
    const valInput = document.getElementById(`pay-val-${key}`);
    try {
        await window.db.collection('users').doc(email).update({
            datePayment: dateInput ? dateInput.value : '',
            paymentValue: valInput ? parseFloat(valInput.value) || 0 : 0,
            updatedAt: new Date()
        });
    } catch (e) {
        console.error('saveMemberPayment error:', e);
    }
};

// --- Activate ---
window.activateMember = async function (email) {
    if (!confirm(`Ativar acesso de ${email}?`)) return;
    try {
        const today = new Date().toLocaleDateString('pt-PT');
        const ref = window.db.collection('users').doc(email);
        const doc = await ref.get();
        const incidents = doc.exists ? (doc.data().incidents || []) : [];
        incidents.push(`Ativado ${today}`);
        await ref.update({ status: 'active', incidents, updatedAt: new Date() });
        alert('Membro ativado! ✅');
        window.loadMembers();
    } catch (e) { alert('Erro: ' + e.message); }
};

// --- Block ---
window.blockMember = async function (email) {
    // Hard stop for admin accounts
    if (ADMIN_EMAILS.some(a => a.toLowerCase() === email.toLowerCase())) {
        alert('⚠️ Não é possível bloquear contas de Administrador.');
        return;
    }
    try {
        const ref = window.db.collection('users').doc(email);
        const doc = await ref.get();
        const userData = doc.exists ? doc.data() : {};

        // Extra warning for 'membro' role
        if (userData.role === 'membro') {
            if (!confirm(`⚠️ ATENÇÃO: ${email} tem o papel de "Membro". Tem a certeza que quer bloquear este utilizador?`)) return;
        } else {
            if (!confirm(`Bloquear acesso de ${email}?`)) return;
        }

        const today = new Date().toLocaleDateString('pt-PT');
        const incidents = userData.incidents || [];
        incidents.push(`Bloqueado ${today}`);
        await ref.update({ status: 'blocked', incidents, updatedAt: new Date() });
        alert('Membro bloqueado. ⛔');
        window.loadMembers();
    } catch (e) { alert('Erro: ' + e.message); }
};

// --- Delete ---
window.deleteMember = async function (email) {
    // Hard stop for admin accounts
    if (ADMIN_EMAILS.some(a => a.toLowerCase() === email.toLowerCase())) {
        alert('⚠️ Não é possível apagar contas de Administrador.');
        return;
    }
    try {
        const ref = window.db.collection('users').doc(email);
        const doc = await ref.get();
        const userData = doc.exists ? doc.data() : {};

        // Extra warning for 'membro' role
        if (userData.role === 'membro') {
            if (!confirm(`⚠️ ATENÇÃO: ${email} tem o papel de "Membro". Tem a certeza que quer apagar este utilizador? Esta ação é irreversível.`)) return;
        } else {
            if (!confirm(`Apagar DEFINITIVAMENTE o registo de ${email}? Esta ação é irreversível.`)) return;
        }

        await ref.delete();
        alert('Registo apagado. 🗑️');
        window.loadMembers();
    } catch (e) { alert('Erro: ' + e.message); }
};

// Keep legacy alias for backwards compatibility
window.approveMember = window.activateMember;

// (Incident cleanup ran once and is now complete)



// Helper to decode HTML entities (e.g. &atilde; -> ã)
function decodeHtmlEntities(str) {
    if (!str) return '';
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
}

// --- Maintenance Mode Logic ---
async function loadMaintenanceConfig() {
    try {
        const docSnap = await window.db.collection('config').doc('maintenance').get();
        const toggle = document.getElementById('maintenance-toggle');
        const passInput = document.getElementById('maintenance-password');

        if (!toggle) return; // Prevent errors on other pages

        if (docSnap.exists) {
            const data = docSnap.data();
            toggle.checked = data.isActive || false;
            if (passInput) passInput.value = data.password || '';
        } else {
            toggle.checked = false;
        }

        // Init visuals
        window.updateMaintenanceVisuals();
    } catch (error) {
        console.error("Erro ao carregar configurações de manutenção:", error);
    }
}

function updateMaintenanceVisuals() {
    const toggle = document.getElementById('maintenance-toggle');
    const label = document.getElementById('maintenance-status-label');
    const headerBadge = document.getElementById('maintenance-header-badge');
    const card = document.getElementById('card-maintenance');
    const passGroup = document.getElementById('maintenance-password-group');

    if (!toggle || !label || !card) return;

    if (toggle.checked) {
        label.innerText = 'OFFLINE';
        label.className = 'maintenance-badge offline';
        if (headerBadge) {
            headerBadge.innerText = 'OFFLINE';
            headerBadge.className = 'maintenance-badge offline maintenance-header-pos';
        }
        card.classList.add('offline');
        if (passGroup) passGroup.classList.remove('d-none');
    } else {
        label.innerText = 'ONLINE';
        label.className = 'maintenance-badge online';
        if (headerBadge) {
            headerBadge.innerText = 'ONLINE';
            headerBadge.className = 'maintenance-badge online maintenance-header-pos';
        }
        card.classList.remove('offline');
        if (passGroup) passGroup.classList.add('d-none');
    }
}

async function saveMaintenanceConfig() {
    const toggle = document.getElementById('maintenance-toggle');
    const passInput = document.getElementById('maintenance-password');
    const btn = document.getElementById('maintenance-save-btn');
    if (!toggle || !btn) return;

    const originalText = btn.innerText;

    if (toggle.checked && passInput && passInput.value.trim().length < 4) {
        alert("A password de acesso deve ter pelo menos 4 caracteres.");
        return;
    }

    try {
        btn.innerText = 'A Guardar...';
        btn.disabled = true;

        await window.db.collection('config').doc('maintenance').set({
            isActive: toggle.checked,
            password: passInput ? passInput.value.trim() : '',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        btn.innerText = 'Guardado!';
        setTimeout(() => {
            btn.innerText = originalText;
            btn.disabled = false;
        }, 2000);

    } catch (error) {
        console.error("Erro ao guardar definições de manutenção:", error);
        alert("Erro ao guardar as definições. Verifica a consola.");
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// Attach to window
window.loadMaintenanceConfig = loadMaintenanceConfig;
window.saveMaintenanceConfig = saveMaintenanceConfig;
window.updateMaintenanceVisuals = updateMaintenanceVisuals;

// Add to init routine if on dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('card-maintenance')) {
        setTimeout(window.loadMaintenanceConfig, 1000); // Slight delay to ensure firebase is ready
    }
});

// --- Services Logic Moved to cms-services.js ---

