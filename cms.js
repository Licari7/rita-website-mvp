// No imports needed - using global window.db and window.auth from init-firebase.js (Compat SDK)

// Admin Emails
const ADMIN_EMAILS = [
    "floresceterapias@gmail.com",
    "barata.rita@outlook.com",
    "baratacarlos65@gmail.com",
    "carlos.barata@example.com"
];

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

window.initCMS = function () {
    console.log("Initializing CMS (Global Mode)...");

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
                        // loadServices(); // Moved on demand to fix TinyMCE hidden init
                        loadMeditations();
                        loadSiteContent(); // Load Home & About data
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

    const serviceForm = document.getElementById('service-form');
    if (serviceForm) {
        serviceForm.addEventListener('submit', handleServiceSubmit);
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

        let imageUrl = null;
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

        // Only update image if new one provided
        if (imageUrl) {
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
        const querySnapshot = await window.db.collection("testimonials").orderBy("created_at", "desc").get();

        if (querySnapshot.empty) {
            listContainer.innerHTML = '<p>Sem testemunhos.</p>';
            return;
        }

        let html = '<ul class="admin-event-list">';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            window.reviewsCache[doc.id] = data; // Cache for edit

            html += `
                <li class="admin-event-item">
                    <div class="event-info">
                        <strong>${data.name}</strong>: "${data.text.substring(0, 30)}..."
                    </div>
                    <div style="flex-shrink:0;">
                       <button class="btn-outline" style="padding:2px 6px; font-size:0.8rem; margin-right:5px;" onclick="window.editReview('${doc.id}')">Editar</button>
                       <button class="btn-delete" onclick="window.deleteReview('${doc.id}')">Apagar</button>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        listContainer.innerHTML = html;

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
        // window.tinymceInstanceInit = true; // This global flag is too broad now

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

        const serviceData = {
            title: title.replace(/<\/?(p|div|br|h[1-6])[^>]*>/gi, '').trim(),
            description,
            long_description: longDescription,

            benefits,
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

window.editService = async (id) => {
    try {
        const doc = await window.db.collection("services").doc(id).get();
        if (!doc.exists) {
            alert("Serviço não encontrado.");
            return;
        }
        const data = doc.data();

        // Populate Form
        console.log("Editing Service Data:", data);

        // Populate Form
        document.getElementById('svc-id').value = id; // FIX: Set hidden ID
        const titleInput = document.getElementById('svc-title');

        // Sanitize & Decode Title on Load
        let cleanTitle = data.title || '';
        cleanTitle = decodeHtmlEntities(cleanTitle);
        cleanTitle = cleanTitle.replace(/<\/?(p|div|br|h[1-6])[^>]*>/gi, '').trim(); // Strip blocks only
        if (titleInput) titleInput.value = cleanTitle;

        const imgInput = document.getElementById('svc-image');
        if (imgInput) imgInput.value = data.headerImage || '';

        // Decode Description as well if needed
        const descInput = document.getElementById('svc-desc');
        if (descInput) {
            let cleanDesc = data.description || '';
            cleanDesc = decodeHtmlEntities(cleanDesc);
            // Allow inline tags for description too
            cleanDesc = cleanDesc.replace(/<\/?(p|div|h[1-6])[^>]*>/gi, '').trim();
            descInput.value = cleanDesc;
        }

        // FIX: If TinyMCE somehow attached to Short Description, remove it!
        if (window.tinymce && tinymce.get('svc-desc')) {
            console.log("Removing unwanted TinyMCE from svc-desc");
            tinymce.get('svc-desc').remove();
        }

        // Re-set value after potential removal (redundant but safe)
        if (descInput) {
            let cleanDesc = data.description || ''; // Re-initialize cleanDesc
            cleanDesc = decodeHtmlEntities(cleanDesc);
            cleanDesc = cleanDesc.replace(/<\/?(p|div|h[1-6])[^>]*>/gi, '').trim();
            descInput.value = cleanDesc;
        }


        // Debug
        // alert("DEBUG DATA:\nID: " + id + "\nTitle: " + data.title + "\nDesc: " + data.description + "\nImg: " + data.headerImage);



        // Populate Full Description
        document.getElementById('svc-full-desc').value = data.long_description || '';

        // Sanitize Benefits on Load
        let cleanBenefits = [];
        if (data.benefits && Array.isArray(data.benefits)) {
            cleanBenefits = data.benefits.map(b => {
                let cb = decodeHtmlEntities(b); // Decode
                cb = cb.replace(/<\/?(p|div|br|h[1-6])[^>]*>/gi, '').trim(); // Strip blocks only
                return cb;
            });
        }
        document.getElementById('svc-benefits').value = cleanBenefits.join(', ');

        // Populate Colors
        if (data.customColors) {
            // New Scheme Mapping
            const cc = data.customColors;

            // Top Section
            if (document.getElementById('svc-top-bg-color')) {
                // Fallback to old 'headerOpacity' or default black if new field missing
                document.getElementById('svc-top-bg-color').value = cc.topBg || '#000000';
            }
            if (document.getElementById('svc-top-opacity')) {
                // Fallback to old 'headerOpacity'
                const val = (cc.topOpacity !== undefined) ? cc.topOpacity : (cc.headerOpacity !== undefined ? cc.headerOpacity : 0.5);
                document.getElementById('svc-top-opacity').value = val;
                document.getElementById('opacity-val-top').innerText = Math.round(val * 100) + '%';
            }

            // Bottom Section
            if (document.getElementById('svc-bottom-bg-color')) {
                // Fallback to old 'bg'
                document.getElementById('svc-bottom-bg-color').value = cc.bottomBg || cc.bg || '#4F553D';
            }
            if (document.getElementById('svc-bottom-opacity')) {
                // Fallback to old 'bgOpacity'
                const val = (cc.bottomOpacity !== undefined) ? cc.bottomOpacity : (cc.bgOpacity !== undefined ? cc.bgOpacity : 1);
                document.getElementById('svc-bottom-opacity').value = val;
                document.getElementById('opacity-val-bottom').innerText = Math.round(val * 100) + '%';
            }

            // Buttons
            if (document.getElementById('svc-btn-text-color')) {
                // Fallback to old 'text'
                document.getElementById('svc-btn-text-color').value = cc.btnText || cc.text || '#ffffff';
            }

        } else {
            // Defaults if no data
            resetColorInputs();
        }

        // document.getElementById('svc-theme').value = data.styleClass || '';
        if (imgInput) imgInput.value = data.headerImage || '';
        document.getElementById('svc-image-file').value = '';

        // UI Changes
        document.getElementById('svc-submit-btn').innerText = "Atualizar Serviço";
        document.getElementById('svc-cancel-btn').style.display = 'inline-block';
        document.getElementById('svc-cancel-btn').classList.remove('hidden');

        // Scroll
        document.getElementById('service-form').scrollIntoView({ behavior: 'smooth' });

        console.log("Edit Mode Enabled for: ", id);

    } catch (error) {
        console.error("Error getting service:", error);
    }
};

window.resetServiceForm = async () => {
    document.getElementById('service-form').reset();

    // Explicitly Clear Fields to be safe
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
    document.getElementById('svc-full-desc').value = '';
    /*
    try {
        const response = await fetch('service-template.html');
        if (response.ok) {
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const mainContent = doc.querySelector('.service-detail-content');

            if (mainContent) {
                document.getElementById('svc-full-desc').value = mainContent.innerHTML;
            }
        }
    } catch (e) {
        console.error("Could not load template:", e);
    }
    */

    // document.getElementById('svc-theme').value = '';
    document.getElementById('svc-image').value = '';
    document.getElementById('svc-image-file').value = '';
    document.getElementById('svc-submit-btn').innerText = "Publicar Serviço";
    document.getElementById('svc-cancel-btn').style.display = 'none';

    // Scroll
    document.getElementById('service-form').scrollIntoView({ behavior: 'smooth' });
};

window.deleteService = async (id) => {
    if (confirm("Apagar este serviço?")) {
        try {
            await window.db.collection("services").doc(id).delete();
            loadServices();
        } catch (error) {
            alert("Erro: " + error.message);
        }
    }
};

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

async function handleMeditationSubmit(e) {
    if (e) e.preventDefault();
    const btn = document.getElementById('med-submit-btn');
    const originalText = btn.innerText;
    btn.innerText = "A guardar...";
    btn.disabled = true;

    try {
        const id = document.getElementById('med-id').value;
        const title = document.getElementById('med-title').value;
        const theme = document.getElementById('med-theme').value;
        const type = document.getElementById('med-type').value;
        let url = document.getElementById('med-url').value;

        // Smart-Clean: If user stuck full iframe code, extract just the source URL
        // Improved Regex for src extraction
        if (url.includes('<iframe')) {
            const srcMatch = url.match(/src="([^"]+)"/);
            if (srcMatch && srcMatch[1]) {
                url = srcMatch[1];
            }
        }

        // Image Processing
        let imageUrl = document.getElementById('med-image-url').value;
        const imageFile = document.getElementById('med-image').files[0];
        if (imageFile) {
            btn.innerText = "A enviar imagem...";
            const path = `meditations/${Date.now()}_${imageFile.name}`;
            imageUrl = await uploadImageToStorage(imageFile, path);
        }

        const desc = (window.tinymce && tinymce.get('med-desc')) ? tinymce.get('med-desc').getContent() : document.getElementById('med-desc').value;

        const data = {
            title,
            theme, // enraizamento, limpeza, etc
            type, // audio, video
            url,
            description: desc,
            image_url: imageUrl,
            active: true,
            created_at: new Date().toISOString()
        };

        if (id) {
            await window.db.collection('meditations').doc(id).update(data);
            alert("Recurso atualizado com sucesso! 🎧");
        } else {
            await window.db.collection('meditations').add(data);
            alert("Recurso adicionado com sucesso! 🎧");
        }

        if (e) e.target.reset();
        window.resetMeditationForm(); // Reset UI state
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

        // Group by Theme
        const grouped = {};
        const themeNames = {
            'enraizamento': 'Enraizamento',
            'limpeza': 'Limpeza Energética',
            'protecao': 'Proteção',
            'intuicao': 'Intuição',
            'chakras': 'Chakras'
        };

        snapshot.forEach(doc => {
            const data = doc.data();
            window.meditationsCache[doc.id] = data; // Cache for edit

            const themeKey = data.theme || 'outros';
            if (!grouped[themeKey]) grouped[themeKey] = [];
            grouped[themeKey].push({ id: doc.id, ...data });
        });

        // Build HTML
        let html = '<div class="cms-list" style="max-height: 400px; overflow-y: auto; padding-right: 5px;">';

        Object.keys(grouped).forEach(themeKey => {
            const displayName = themeNames[themeKey] || themeKey.toUpperCase();

            html += `
            <div style="position: sticky; top: 0; background: white; padding: 8px 0; border-bottom: 2px solid var(--color-primary); margin-top: 10px; margin-bottom: 5px; z-index: 10; font-weight: bold; color: var(--color-primary);">
                ${displayName}
            </div>`;

            grouped[themeKey].forEach((item, index) => {
                const icon = item.type === 'video' ? 'video' : 'music';
                html += `
                <div class="cms-item compact" style="padding: 4px 0; border-bottom: 1px dotted #eee; display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem;">
                    <div style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis; display: flex; align-items: center; gap: 6px;">
                        <span style="color: #999; font-size: 0.8em; min-width: 20px;">#${index + 1}</span>
                        <i data-lucide="${icon}" style="width:14px; height:14px; color:#666;"></i>
                        <span title="${item.title}">${item.title}</span>
                    </div>
                    <div style="flex-shrink: 0; margin-left: 10px; display: flex; gap: 4px;">
                        <button class="btn-outline" style="padding: 2px 6px; font-size: 0.75rem; height: auto; min-height: 0;" onclick="editMeditation('${item.id}')">
                            <i data-lucide="edit-2" style="width:12px; height:12px;"></i>
                        </button>
                        <button class="btn-delete" style="padding: 2px 6px; font-size: 0.75rem; height: auto; min-height: 0;" onclick="deleteMeditation('${item.id}')">
                            <i data-lucide="trash" style="width:12px; height:12px;"></i>
                        </button>
                    </div>
                </div>`;
            });
        });

        html += '</div>';

        list.innerHTML = html;
        if (window.lucide) lucide.createIcons();

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
    document.getElementById('med-title').value = data.title;
    document.getElementById('med-theme').value = data.theme;
    document.getElementById('med-type').value = data.type;
    document.getElementById('med-type').value = data.type;
    document.getElementById('med-url').value = data.url;
    document.getElementById('med-desc').value = data.description || '';
    if (window.tinymce && tinymce.get('med-desc')) tinymce.get('med-desc').setContent(data.description || '');
    document.getElementById('med-image-url').value = data.image_url || '';
    document.getElementById('med-image').value = ''; // Reset file input

    document.getElementById('med-submit-btn').innerText = "Atualizar Recurso";
    document.getElementById('med-cancel-btn').style.display = "inline-block";

    // Scroll to form
    const form = document.getElementById('meditation-form');
    if (form) form.scrollIntoView({ behavior: 'smooth' });
};

window.resetMeditationForm = () => {
    const form = document.getElementById('meditation-form');
    if (form) form.reset();
    document.getElementById('med-id').value = "";
    document.getElementById('med-image-url').value = "";
    document.getElementById('med-submit-btn').innerText = "Publicar Recurso";
    document.getElementById('med-cancel-btn').style.display = "none";
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
                if (document.getElementById('service-bg-url')) document.getElementById('service-bg-url').value = data.service_section.background_image || '';
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
                if (document.getElementById('about-image-url')) document.getElementById('about-image-url').value = data.about.image_url || '';
                if (document.getElementById('about-image-art-url')) document.getElementById('about-image-art-url').value = data.about.image_art_url || '';
            }

            // Populate Home Summary Form
            if (data.home_about) {
                if (document.getElementById('home-about-title-input')) document.getElementById('home-about-title-input').value = data.home_about.title || '';
                if (document.getElementById('home-about-text-input')) document.getElementById('home-about-text-input').value = data.home_about.text || '';
                if (document.getElementById('home-about-image-url')) document.getElementById('home-about-image-url').value = data.home_about.image_url || '';
            }

            // Populate Footer Form
            if (data.footer) {
                if (document.getElementById('footer-title-input')) document.getElementById('footer-title-input').value = data.footer.title || '';
                if (document.getElementById('footer-copyright-input')) document.getElementById('footer-copyright-input').value = data.footer.copyright || '';
                if (document.getElementById('footer-dev-input')) document.getElementById('footer-dev-input').value = data.footer.dev_credit || '';

                // Footer Colors
                const fBg = data.footer.bg_color || '#80864f';
                const fText = data.footer.text_color || '#ffffff';

                if (document.getElementById('footer-bg-color')) {
                    document.getElementById('footer-bg-color').value = fBg;
                    document.getElementById('footer-bg-hex').value = fBg;
                }
                if (document.getElementById('footer-text-color')) {
                    document.getElementById('footer-text-color').value = fText;
                    document.getElementById('footer-text-hex').value = fText;
                }
            }

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
                const path = `home/${Date.now()}_${imageFile.name}`;
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



        await window.db.collection('site_content').doc('main').set(data, { merge: true });
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
        let imageUrl = document.getElementById('about-image-url').value;
        const imageFile = document.getElementById('about-image-file').files[0];

        if (imageFile) {
            btn.textContent = "A enviar imagem 1...";
            const path = `about/${Date.now()}_${imageFile.name}`;
            imageUrl = await uploadImageToStorage(imageFile, path);
        }

        // Image 2 (Art)
        let imageArtUrl = document.getElementById('about-image-art-url').value;
        const imageArtFile = document.getElementById('about-image-art-file').files[0];

        if (imageArtFile) {
            btn.textContent = "A enviar imagem 2...";
            const path = `about/art_${Date.now()}_${imageArtFile.name}`;
            imageArtUrl = await uploadImageToStorage(imageArtFile, path);
        }

        const data = {
            about: {
                title: document.getElementById('about-title').value,
                text_intro: (window.tinymce && tinymce.get('about-text-intro')) ? tinymce.get('about-text-intro').getContent() : document.getElementById('about-text-intro').value,
                text_art: (window.tinymce && tinymce.get('about-text-art')) ? tinymce.get('about-text-art').getContent() : document.getElementById('about-text-art').value,
                image_url: imageUrl,
                image_art_url: imageArtUrl
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

// New Handler for Home Summary
async function handleHomeAboutSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    const btn = document.getElementById('home-about-save-btn');
    if (!btn) return;
    const originalText = btn.textContent;
    btn.textContent = "A guardar...";
    btn.disabled = true;

    try {
        let imageUrl = document.getElementById('home-about-image-url').value;
        const imageFile = document.getElementById('home-about-image-file').files[0];

        // Upload Image
        if (imageFile) {
            btn.textContent = "A enviar imagem...";
            const path = `home_about/${Date.now()}_${imageFile.name}`;
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

        alert("Rodapé atualizado com sucesso!");
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
        if (doc.exists) {
            const data = doc.data().theme || {};

            // Set inputs to saved values or defaults
            if (document.getElementById('theme-bg')) document.getElementById('theme-bg').value = data.bg_color || DEFAULT_THEME.bg_color;
            if (document.getElementById('theme-text')) document.getElementById('theme-text').value = data.text_color || DEFAULT_THEME.text_color;
            if (document.getElementById('theme-primary')) document.getElementById('theme-primary').value = data.primary_color || DEFAULT_THEME.primary_color;
            if (document.getElementById('theme-header')) document.getElementById('theme-header').value = data.header_bg || DEFAULT_THEME.header_bg;
            if (document.getElementById('theme-secondary-1')) document.getElementById('theme-secondary-1').value = data.secondary_beige || DEFAULT_THEME.secondary_beige;
            if (document.getElementById('theme-secondary-2')) document.getElementById('theme-secondary-2').value = data.secondary_blue || DEFAULT_THEME.secondary_blue;
            if (document.getElementById('theme-footer')) document.getElementById('theme-footer').value = data.footer_bg || DEFAULT_THEME.footer_bg;

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
        { color: 'theme-footer', hex: 'theme-footer-hex' }
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
            if (document.getElementById('header-bg-color')) document.getElementById('header-bg-color').value = header.bg_color;
            if (document.getElementById('header-text-color')) document.getElementById('header-text-color').value = header.text_color;
            if (document.getElementById('header-font-size')) document.getElementById('header-font-size').value = header.font_size;
            if (document.getElementById('header-padding')) document.getElementById('header-padding').value = header.padding;

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
        const newTheme = {
            bg_color: document.getElementById('theme-bg').value,
            text_color: document.getElementById('theme-text').value,
            primary_color: document.getElementById('theme-primary').value,
            header_bg: document.getElementById('theme-header').value,
            secondary_beige: document.getElementById('theme-secondary-1').value,
            secondary_blue: document.getElementById('theme-secondary-2').value,
            footer_bg: document.getElementById('theme-footer').value
        };

        // 1. Save to Cloud
        await window.db.collection('site_content').doc('main').set({
            theme: newTheme
        }, { merge: true });

        // 2. Update Local Storage (Instant Load for next time)
        localStorage.setItem('site_theme', JSON.stringify(newTheme));

        // 3. Apply now
        applyTheme(newTheme);

        alert("Tema atualizado com sucesso!");

    } catch (error) {
        console.error("Error saving theme:", error);
        alert("Erro ao guardar tema.");
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
        if (document.getElementById('theme-bg')) document.getElementById('theme-bg').value = DEFAULT_THEME.bg_color;
        if (document.getElementById('theme-text')) document.getElementById('theme-text').value = DEFAULT_THEME.text_color;
        if (document.getElementById('theme-primary')) document.getElementById('theme-primary').value = DEFAULT_THEME.primary_color;
        if (document.getElementById('theme-header')) document.getElementById('theme-header').value = DEFAULT_THEME.header_bg;
        if (document.getElementById('theme-secondary-1')) document.getElementById('theme-secondary-1').value = DEFAULT_THEME.secondary_beige;
        if (document.getElementById('theme-secondary-2')) document.getElementById('theme-secondary-2').value = DEFAULT_THEME.secondary_blue;
        if (document.getElementById('theme-footer')) document.getElementById('theme-footer').value = DEFAULT_THEME.footer_bg;

        updateHexInputs(); // Update the text inputs too

        // Reset UI inputs (Header - if present on page)
        if (document.getElementById('header-transparent')) document.getElementById('header-transparent').checked = false;
        if (document.getElementById('header-bg-color')) document.getElementById('header-bg-color').value = DEFAULT_THEME.header_bg;
        if (document.getElementById('header-font-size')) document.getElementById('header-font-size').value = 16;
        if (document.getElementById('header-padding')) document.getElementById('header-padding').value = 20;

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
    const homeForm = document.getElementById('home-content-form');
    if (homeForm) homeForm.addEventListener('submit', handleHomeSubmit);

    const aboutForm = document.getElementById('about-content-form');
    if (aboutForm) aboutForm.addEventListener('submit', handleAboutSubmit);

    const homeAboutForm = document.getElementById('home-about-form');
    if (homeAboutForm) homeAboutForm.addEventListener('submit', handleHomeAboutSubmit);

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
    setupHexListeners();

    // Init Admin Panels
    if (window.loadServices) window.loadServices();
    if (window.loadMembers) window.loadMembers();
});
// --- Member Management Logic ---

window.membersCache = {};

window.loadMembers = async function () {
    // Wait for DB to initialize
    if (!window.db) {
        setTimeout(window.loadMembers, 500);
        return;
    }
    const listContainer = document.getElementById('admin-members-list');
    if (!listContainer) return;
    listContainer.innerHTML = '<p>A carregar membros...</p>';

    try {
        const querySnapshot = await window.db.collection("users").orderBy("createdAt", "desc").get();

        if (querySnapshot.empty) {
            listContainer.innerHTML = '<p>Sem membros registados.</p>';
            return;
        }

        // Table Header
        let html = `
        <table style="width:100%; border-collapse: collapse; font-size:12px;">
            <thead>
                <tr style="text-align:left; border-bottom:2px solid #eee;">
                    <th style="padding:8px;">Membro</th>
                    <th style="padding:8px;">Status</th>
                    <th style="padding:8px;">Último Login</th>
                    <th style="padding:8px; text-align:right;">Ações</th>
                </tr>
            </thead>
            <tbody>
        `;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            window.membersCache[doc.id] = data;

            let statusColor = '#666';
            if (data.status === 'active') statusColor = 'green';
            if (data.status === 'pending') statusColor = 'orange';
            if (data.status === 'blocked') statusColor = 'red';

            const statusLabel = {
                'active': 'Ativo',
                'pending': 'Pendente',
                'blocked': 'Bloqueado'
            }[data.status] || data.status;

            const lastLoginDate = data.lastLogin && data.lastLogin.toDate ? new Date(data.lastLogin.toDate()).toLocaleDateString() : 'N/A';
            const lastPaymentDate = data.lastPaymentDate && data.lastPaymentDate.toDate ? new Date(data.lastPaymentDate.toDate()).toLocaleDateString() : null;

            html += `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:8px;">
                        <strong>${data.name || 'Sem nome'}</strong><br>
                        <span style="color:#888;">${data.email}</span>
                        ${lastPaymentDate ? `<div style="font-size:10px; color:green;">Pagou: ${lastPaymentDate}</div>` : ''}
                    </td>
                    <td style="padding:8px;">
                        <span style="color:${statusColor}; font-weight:600;">● ${statusLabel}</span>
                    </td>
                    <td style="padding:8px; color:#666;">
                        ${lastLoginDate}
                    </td>
                    <td style="padding:8px; text-align:right;">
                         <div style="display:flex; gap:5px; justify-content:flex-end;">
                            ${data.status !== 'active' ? `<button class="btn-outline" style="color:green; border-color:#d4edda; background:#f0fff4; padding:2px 6px; font-size:11px;" onclick="window.approveMember('${doc.id}')">Aprovar</button>` : ''}
                            ${data.status !== 'blocked' ? `<button class="btn-outline" style="color:red; border-color:#f8d7da; background:#fff5f5; padding:2px 6px; font-size:11px;" onclick="window.blockMember('${doc.id}')">Bloquear</button>` : ''}
                            <button class="btn-delete" style="padding:2px 6px; font-size:11px; margin-left:5px;" onclick="window.deleteMember('${doc.id}')"><i data-lucide="trash-2" style="width:12px; height:12px; vertical-align:middle;"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        listContainer.innerHTML = html;

    } catch (error) {
        console.error("Error loading members:", error);
        listContainer.innerHTML = '<p style="color:red">Erro ao carregar membros.</p>';
    }
};

window.approveMember = async function (email) {
    if (!confirm(`Tem a certeza que quer APROVAR ${email} manualmente? (Isto dá acesso sem pagamento)`)) return;

    try {
        await window.db.collection("users").doc(email).update({
            status: 'active',
            manualApproval: true,
            updatedAt: new Date()
        });
        alert("Membro aprovado com sucesso! ✅");
        window.loadMembers();
    } catch (error) {
        alert("Erro: " + error.message);
    }
};

window.blockMember = async function (email) {
    if (!confirm(`Tem a certeza que quer BLOQUEAR o acesso de ${email}?`)) return;

    try {
        await window.db.collection("users").doc(email).update({
            status: 'blocked',
            updatedAt: new Date()
        });
        alert("Membro bloqueado. ⛔");
        window.loadMembers();
    } catch (error) {
        alert("Erro: " + error.message);
    }
};

window.deleteMember = async function (email) {
    // Safety Check: Prevent deleting Admins
    if (ADMIN_EMAILS.some(admin => admin.toLowerCase() === email.toLowerCase())) {
        alert("⚠️ AÇÃO BLOQUEADA: Não é possível apagar contas de Administrador.");
        return;
    }

    if (!confirm(`Tem a certeza que quer APAGAR DEFINITIVAMENTE o registo de ${email} da Base de Dados?\n\nIsto remove os dados do cliente, mas não apaga a conta de Login (Google/Email). Para proteção total, o utilizador perde o acesso imediato.`)) return;

    try {
        await window.db.collection("users").doc(email).delete();
        alert("Registo apagado da Base de Dados com sucesso. 🗑️");
        window.loadMembers();
    } catch (error) {
        alert("Erro ao apagar: " + error.message);
    }
};

// Helper to decode HTML entities (e.g. &atilde; -> ã)
function decodeHtmlEntities(str) {
    if (!str) return '';
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
}
