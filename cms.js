// No imports needed - using global window.db and window.auth from init-firebase.js (Compat SDK)

// Admin Emails
const ADMIN_EMAILS = [
    "floresceterapias@gmail.com",
    "barata.rita@outlook.com",
    "carlos.barata@example.com"
];

// Helper: Convert File to Base64 (No Compression)
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
                            if (panel.style.display === 'none') {
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

    // Auto-Init TinyMCE on Accordion Open
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

async function handleServiceSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('svc-submit-btn');
    btn.innerText = "A guardar...";
    btn.disabled = true;

    try {
        const id = document.getElementById('svc-id').value; // Check for ID
        const title = document.getElementById('svc-title').value;
        const description = (window.tinymce && tinymce.get('svc-desc')) ? tinymce.get('svc-desc').getContent() : document.getElementById('svc-desc').value;
        const link = document.getElementById('svc-link').value;

        // Get content from TinyMCE
        let longDescription = '';
        if (window.tinymce && tinymce.get('my-tinymce-editor')) {
            longDescription = tinymce.get('my-tinymce-editor').getContent();
        }

        const benefitsRaw = document.getElementById('svc-benefits').value;
        const styleClass = document.getElementById('svc-theme').value;

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

        // Parse benefits
        const benefits = benefitsRaw.split(',').map(b => b.trim()).filter(b => b.length > 0);

        const serviceData = {
            title,
            description,
            long_description: longDescription,
            link,
            benefits,
            styleClass,
            headerImage,
            active: true
        };

        if (!id) {
            serviceData.created_at = new Date();
            serviceData.order = 99; // Default for new
            await window.db.collection("services").add(serviceData);
            alert("Serviço adicionado! ✨");
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

async function loadServices() {
    initTinyMCE(); // Ensure editor is ready

    const listContainer = document.getElementById('admin-services-list');
    if (!listContainer) return;
    listContainer.innerHTML = '<p>A carregar...</p>';

    try {
        const querySnapshot = await window.db.collection("services").orderBy("order", "asc").get();

        if (querySnapshot.empty) {
            listContainer.innerHTML = '<p>Sem serviços.</p>';
            return;
        }

        let html = '<ul class="admin-event-list">';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Note: passing data attributes or fetching again in edit
            html += `
                <li class="admin-event-item">
                    <div class="event-info">
                        <strong>${data.title}</strong>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn-outline" style="padding: 2px 8px; font-size: 0.8rem;" onclick="window.editService('${doc.id}')">Editar</button>
                        <button class="btn-delete" onclick="window.deleteService('${doc.id}')">Apagar</button>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        listContainer.innerHTML = html;

    } catch (error) {
        console.error("Error loading services:", error);
        listContainer.innerHTML = '<p style="color:red">Erro.</p>';
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
        document.getElementById('svc-id').value = id;
        document.getElementById('svc-title').value = data.title;
        document.getElementById('svc-title').value = data.title;
        document.getElementById('svc-desc').value = data.description;
        if (window.tinymce && tinymce.get('svc-desc')) tinymce.get('svc-desc').setContent(data.description || '');
        document.getElementById('svc-link').value = data.link;
        document.getElementById('svc-link').value = data.link;

        // Populate TinyMCE (Nuclear Re-init)
        // We pass the content directly to init to ensure it loads in the correct state
        // Populate TinyMCE (Nuclear Re-init)
        // We pass the content directly to init to ensure it loads in the correct state
        initTinyMCE(data.long_description || '', 'my-tinymce-editor');

        document.getElementById('svc-benefits').value = data.benefits ? data.benefits.join(', ') : '';
        document.getElementById('svc-theme').value = data.styleClass || '';
        document.getElementById('svc-image').value = data.headerImage || '';
        document.getElementById('svc-image-file').value = '';

        // UI Changes
        document.getElementById('svc-submit-btn').innerText = "Atualizar Serviço";
        document.getElementById('svc-cancel-btn').style.display = 'inline-block';

        // Scroll
        document.getElementById('service-form').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error("Error getting service:", error);
    }
};

window.resetServiceForm = () => {
    document.getElementById('service-form').reset();
    document.getElementById('svc-id').value = '';

    // Reset editor
    // Reset editor
    initTinyMCE('', 'my-tinymce-editor');

    document.getElementById('svc-theme').value = '';
    document.getElementById('svc-image').value = '';
    document.getElementById('svc-image-file').value = '';

    document.getElementById('svc-submit-btn').innerText = "Publicar Serviço";
    document.getElementById('svc-cancel-btn').style.display = 'none';
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

// Seeding Function (Updated with Stable IDs)
window.seedDefaultServices = async () => {
    if (!confirm("Isto vai REINICIAR os serviços para os originais (usando IDs fixos). Continuar?")) return;

    // Content extracted from static files (simplified for seed)
    const defaults = [
        {
            id: "aura", // Custom ID
            title: "Leitura de Aura",
            description: "Acede à tua energia, liberta bloqueios e ganha clareza sobre o teu caminho espiritual.",
            long_description: `<p>A Leitura de Aura é uma ferramenta poderosa de autoconhecimento. Ao aceder ao teu campo energético, é possível identificar padrões, bloqueios e potenciais que estão presentes na tua vida neste momento.</p>
            <p><strong>Como funciona?</strong><br>A sessão começa com uma meditação de enraizamento. De seguida, é feita a leitura das cores e imagens da tua aura (campo energético), passando pelos 7 chakras principais.</p>
            <p>Esta terapia permite trazer ao consciente o que está no inconsciente, promovendo a cura e o equilíbrio.</p>`,
            link: "service.html?id=aura", // Will be updated by dynamic logic later, but for now we just seed content
            benefits: ["Presenciais", "Online (Zoom)", "À Distância"],
            styleClass: "",
            order: 1
        },
        {
            id: "innerdance", // Custom ID
            title: "Innerdance",
            description: "Uma jornada sonora vibracional que ativa o teu processo de autocura e expansão da consciência.",
            long_description: `<p>Innerdance não é uma dança física, mas sim uma dança da consciência. Através de ondas cerebrais e sons binaurais, és levado a um estado de transe consciente (semelhante ao sonho lúcido).</p>
            <p><strong>Benefícios:</strong><br>
            - Libertação de traumas emocionais.<br>
            - Ativação da energia Kundalini.<br>
            - Visões e insights profundos.</p>
            <p>É uma experiência visceral onde o corpo pode mover-se espontaneamente para libertar energia estagnada.</p>`,
            link: "service.html?id=innerdance",
            benefits: ["Desbloqueio Emocional", "Activação Energética", "Estado Alterado de Consciência"],
            styleClass: "innerdance",
            order: 2
        },
        {
            id: "constelacoes", // Custom ID
            title: "Constelações Familiares e Sistêmicas",
            description: "Harmoniza o teu sistema familiar e liberta padrões herdados para viveres com mais leveza.",
            long_description: `<p>As Constelações Familiares olham para o indivíduo como parte de um sistema maior (a família). Muitas vezes, carregamos lealdades invisíveis, destinos ou traumas dos nossos antepassados.</p>
            <p>Nesta sessão, utilizamos bonecos ou marcadores (online ou presencial) para representar os membros da família e observar a dinâmica oculta.</p>
            <p>Ao reconhecer e honrar o que foi, podemos encontrar o nosso lugar de força e seguir em frente com amor.</p>`,
            link: "service.html?id=constelacoes",
            benefits: ["Presenciais", "Online"],
            styleClass: "constellations",
            order: 3
        },
        {
            title: "Ciclos de Expansão",
            description: "Programas de longa duração para quem procura um compromisso profundo com o seu crescimento.",
            long_description: `<p>Os Ciclos de Expansão são jornadas de acompanhamento contínuo. Ao contrário de uma sessão pontual, aqui mergulhamos fundo num tema durante várias semanas ou meses.</p>
            <p><strong>O que inclui?</strong><br>
            - Sessões regulares (grupo ou individual).<br>
            - Exercícios práticos entre sessões.<br>
            - Apoio via WhatsApp/Telegram.<br>
            - Acesso a uma comunidade de suporte.</p>
            <p>Ideal para quem está numa fase de transição de vida e precisa de suporte estruturado.</p>`,
            link: "service.html?id=expansao",
            benefits: ["Mentoria Contínua", "Grupo de Apoio", "Acesso a Recursos"],
            styleClass: "expansion",
            order: 4
        }
    ];

    try {
        for (const svc of defaults) {
            await window.db.collection("services").add({
                ...svc,
                active: true,
                created_at: new Date()
            });
        }

        alert("Serviços importados com sucesso! Podes agora editá-los.");
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
    try {
        const doc = await window.db.collection('site_content').doc('main').get();
        if (doc.exists) {
            const data = doc.data();

            // Populate Home Form
            if (data.home) {
                if (document.getElementById('home-title')) document.getElementById('home-title').value = data.home.title || '';
                if (document.getElementById('home-subtitle')) document.getElementById('home-subtitle').value = data.home.subtitle || '';
                if (document.getElementById('home-cta')) document.getElementById('home-cta').value = data.home.cta_text || '';
                if (document.getElementById('home-text-color')) document.getElementById('home-text-color').value = data.home.text_color || '#E1D7CE';
                if (document.getElementById('home-text-highlight')) document.getElementById('home-text-highlight').checked = data.home.text_highlight || false;
            }

            // Populate About Form
            if (data.about) {
                if (document.getElementById('about-title')) document.getElementById('about-title').value = data.about.title || '';
                if (document.getElementById('about-text')) {
                    document.getElementById('about-text').value = data.about.text || '';
                    // Init TinyMCE
                    initTinyMCE(data.about.text || '', 'about-text');
                }
                if (document.getElementById('about-image-url')) document.getElementById('about-image-url').value = data.about.image_url || '';
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
        alert("Erro ao guardar.");
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
        let imageUrl = document.getElementById('about-image-url').value;
        const imageFile = document.getElementById('about-image-file').files[0];

        // Upload Image
        if (imageFile) {
            btn.textContent = "A enviar imagem...";
            const path = `about/${Date.now()}_${imageFile.name}`;
            imageUrl = await uploadImageToStorage(imageFile, path);
        }

        const data = {
            about: {
                title: document.getElementById('about-title').value,
                text: (window.tinymce && tinymce.get('about-text')) ? tinymce.get('about-text').getContent() : document.getElementById('about-text').value,
                image_url: imageUrl
            }
        };

        await window.db.collection('site_content').doc('main').set(data, { merge: true });
        alert("Página 'Sobre Mim' atualizada!");

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

    try {
        await window.db.collection('site_content').doc('main').set({
            footer: {
                title: title,
                copyright: copyright,
                dev_credit: devCredit
            }
        }, { merge: true });

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
    bg_color: '#6e664c',
    text_color: '#e1d7ce',
    primary_color: '#b16a4c',
    header_bg: '#e1d7ce',
    secondary_beige: '#e1d7ce',
    secondary_blue: '#7b8b99',
    footer_bg: '#b16a4c'
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

async function loadHeaderSettings() {
    try {
        const doc = await window.db.collection('site_content').doc('main').get();
        if (doc.exists) {
            const data = doc.data().header || {};
            // Default Values matches CSS
            const defaults = {
                transparent: false,
                bg_color: '#e1d7ce',
                text_color: '#6e664c',
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
        }
    } catch (e) {
        console.error("Error loading header settings:", e);
    }
}

async function handleHeaderSubmit(e) {
    if (e) e.preventDefault();
    const btn = document.getElementById('header-save-btn');
    if (!btn) return;

    const originalText = btn.textContent;
    btn.textContent = "A guardar...";

    try {
        const headerSettings = {
            transparent: document.getElementById('header-transparent').checked,
            bg_color: document.getElementById('header-bg-color').value,
            text_color: document.getElementById('header-text-color').value,
            font_size: document.getElementById('header-font-size').value,
            padding: document.getElementById('header-padding').value
        };

        await window.db.collection('site_content').doc('main').set({
            header: headerSettings
        }, { merge: true });

        // Apply
        applyHeaderSettings(headerSettings);

        alert("Cabeçalho atualizado!");

    } catch (error) {
        console.error("Error saving header:", error);
        alert("Erro ao guardar cabeçalho.");
    } finally {
        btn.textContent = originalText;
    }
}

function applyHeaderSettings(settings) {
    const root = document.documentElement;
    root.style.setProperty('--header-transparent', settings.transparent ? '1' : '0');
    root.style.setProperty('--nav-bg', settings.bg_color); // Sync with theme var
    root.style.setProperty('--nav-text', settings.text_color); // New var? Or reuse
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
            theme: DEFAULT_THEME
        }, { merge: true });

        // 2. Clear Local Storage
        localStorage.removeItem('site_theme');
        // Or set to defaults: localStorage.setItem('site_theme', JSON.stringify(DEFAULT_THEME));

        // 3. Reset UI inputs
        document.getElementById('theme-bg').value = DEFAULT_THEME.bg_color;
        document.getElementById('theme-text').value = DEFAULT_THEME.text_color;
        document.getElementById('theme-primary').value = DEFAULT_THEME.primary_color;
        document.getElementById('theme-header').value = DEFAULT_THEME.header_bg;
        document.getElementById('theme-secondary-1').value = DEFAULT_THEME.secondary_beige;
        document.getElementById('theme-secondary-2').value = DEFAULT_THEME.secondary_blue;
        document.getElementById('theme-footer').value = DEFAULT_THEME.footer_bg;

        updateHexInputs(); // Update the text inputs too

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
    loadThemeSettings(); // Load Theme Settings
    loadHeaderSettings(); // Load Header Settings
    setupHexListeners(); // Initialize Hex Sync
});
// --- Member Management Logic ---

window.membersCache = {};

window.loadMembers = async function () {
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
