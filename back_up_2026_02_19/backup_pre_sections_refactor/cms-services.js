// --- Services Logic (Refactored to cms-services.js) ---

window.servicesCache = {};

window.loadServices = async function () {
    const listContainer = document.getElementById('admin-services-list');
    if (!listContainer) return;
    listContainer.innerHTML = '<p>A carregar serviços...</p>';

    try {
        // Use global window.db
        const querySnapshot = await window.db.collection("services").orderBy("order", "asc").get();

        if (querySnapshot.empty) {
            listContainer.innerHTML = '<p>Sem serviços ativos.</p>';
            return;
        }

        let html = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            window.servicesCache[doc.id] = data; // Cache for editing

            // Card Preview Logic - Image Fallback
            // Match public site default gradient
            const defaultGradient = 'linear-gradient(135deg, #4F553D 0%, #30332E 100%)';
            const imgUrl = data.headerImage || data.image || data.img;
            const bgImage = imgUrl ? `url('${imgUrl}')` : defaultGradient;

            html += `
            <div class="admin-service-card-mini" draggable="true" ondragstart="drag(event)" id="${doc.id}">
                <div class="mini-card-image" style="background-image: ${bgImage};">
                    <!-- Overlay removed/hidden by CSS, title moves below -->
                </div>
                <div class="mini-card-title">${data.title}</div>
                <div class="mini-card-actions">
                    <button class="btn-icon-action edit" onclick="window.editService('${doc.id}')" title="Editar">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="btn-icon-action delete" onclick="window.deleteService('${doc.id}')" title="Apagar">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
            `;
        });

        listContainer.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();

        // Also load testimonials for the selector
        loadTestimonialsSelector();

    } catch (error) {
        console.error("Error loading services:", error);
        listContainer.innerHTML = '<p style="color:red">Erro ao carregar serviços.</p>';
    }
};

window.handleServiceSubmit = async function (e) {
    if (e) e.preventDefault();
    const btn = document.getElementById('svc-submit-btn');
    const originalText = btn.textContent;
    btn.textContent = "A guardar...";
    btn.disabled = true;

    try {
        const idInput = document.getElementById('svc-id');
        const id = idInput ? idInput.value : '';

        const title = document.getElementById('svc-title').value;
        const benefitsStr = document.getElementById('svc-benefits').value;
        const benefits = benefitsStr ? benefitsStr.split(',').map(s => s.trim()).filter(s => s) : [];
        const desc = document.getElementById('svc-desc').value; // Short
        // Full description or use the newly added one
        const fullDesc = document.getElementById('svc-full-desc').value;

        // Image Handling
        let imageUrl = document.getElementById('svc-image').value;
        const imageFile = document.getElementById('svc-image-file').files[0];

        if (imageFile) {
            btn.textContent = "A enviar imagem...";
            try {
                const path = `services/${Date.now()}_${imageFile.name}`;
                // Use global upload helper
                imageUrl = await window.uploadImageToStorage(imageFile, path);
            } catch (err) {
                console.error("Image Upload Error", err);
                // Proceed without updating image if failed? No, alert user.
                throw new Error("Falha no upload da imagem: " + err.message);
            }
        }

        // Color Configs
        const customColors = {
            topBg: document.getElementById('svc-top-bg-color').value,
            topOpacity: document.getElementById('svc-top-opacity').value,
            bottomBg: document.getElementById('svc-bottom-bg-color').value,
            bottomOpacity: document.getElementById('svc-bottom-opacity').value,
            btnText: document.getElementById('svc-btn-text-color').value
        };

        // Get Testimonials Selection
        const selectedTestimonials = [];
        document.querySelectorAll('input[name="svc-testimonial"]:checked').forEach(cb => {
            selectedTestimonials.push(cb.value);
        });

        const serviceData = {
            title,
            benefits,
            description: desc,
            long_description: fullDesc,
            headerImage: imageUrl,
            customColors,
            testimonial_ids: selectedTestimonials, // Store array of IDs
            // order: Date.now(), // Only set on create? No, keep existing if update
            active: true,
            updated_at: new Date()
        };

        if (!id) {
            serviceData.order = Date.now();
            serviceData.created_at = new Date();
        }

        if (id) {
            // Update
            await window.db.collection("services").doc(id).set(serviceData, { merge: true });
            alert("Serviço atualizado com sucesso! ✨");
        } else {
            // Create
            await window.db.collection("services").add(serviceData);
            alert("Serviço criado com sucesso! ✨");
        }

        window.resetServiceForm();
        loadServices();

    } catch (error) {
        console.error("Error saving service:", error);
        alert("Erro ao guardar serviço: " + error.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
};

window.editService = async function (id) {
    const data = window.servicesCache[id];

    if (!data) {
        console.error("No data found for ID:", id);
        return;
    }

    const idInput = document.getElementById('svc-id');
    if (idInput) {
        idInput.value = id;
    } else {
        console.error("svc-id input not found!");
    }

    document.getElementById('svc-title').value = data.title || '';
    document.getElementById('svc-benefits').value = (data.benefits || []).join(', ');
    document.getElementById('svc-desc').value = data.description || '';
    document.getElementById('svc-full-desc').value = data.long_description || '';
    document.getElementById('svc-image').value = data.headerImage || '';
    document.getElementById('svc-image-file').value = ''; // Reset file input

    // Colors
    if (data.customColors) {
        if (document.getElementById('svc-top-bg-color')) document.getElementById('svc-top-bg-color').value = data.customColors.topBg || '#000000';
        if (document.getElementById('svc-top-opacity')) {
            const op = data.customColors.topOpacity !== undefined ? data.customColors.topOpacity : 0.5;
            document.getElementById('svc-top-opacity').value = op;
            if (document.getElementById('opacity-val-top')) document.getElementById('opacity-val-top').textContent = Math.round(op * 100) + '%';
        }
        if (document.getElementById('svc-bottom-bg-color')) document.getElementById('svc-bottom-bg-color').value = data.customColors.bottomBg || '#4F553D';
        if (document.getElementById('svc-bottom-opacity')) {
            const op = data.customColors.bottomOpacity !== undefined ? data.customColors.bottomOpacity : 1;
            document.getElementById('svc-bottom-opacity').value = op;
            if (document.getElementById('opacity-val-bottom')) document.getElementById('opacity-val-bottom').textContent = Math.round(op * 100) + '%';
        }
        if (document.getElementById('svc-btn-text-color')) document.getElementById('svc-btn-text-color').value = data.customColors.btnText || '#ffffff';
    } else {
        // Reset colors to defaults if no custom colors
        document.getElementById('svc-top-bg-color').value = '#000000';
        document.getElementById('svc-bottom-bg-color').value = '#4F553D';

        if (document.getElementById('svc-top-opacity')) {
            document.getElementById('svc-top-opacity').value = 0.5;
            if (document.getElementById('opacity-val-top')) document.getElementById('opacity-val-top').textContent = '50%';
        }
        if (document.getElementById('svc-bottom-opacity')) {
            document.getElementById('svc-bottom-opacity').value = 1;
            if (document.getElementById('opacity-val-bottom')) document.getElementById('opacity-val-bottom').textContent = '100%';
        }
    }

    // Ensure Testimonials are Loaded
    const container = document.getElementById('svc-testimonials-selector');
    if (container && (!container.children.length || container.children[0].tagName === 'P')) {
        await loadTestimonialsSelector();
    }

    // Select Testimonials
    document.querySelectorAll('input[name="svc-testimonial"]').forEach(cb => cb.checked = false);

    if (data.testimonial_ids && Array.isArray(data.testimonial_ids)) {
        document.querySelectorAll('input[name="svc-testimonial"]').forEach(cb => {
            if (data.testimonial_ids.includes(cb.value)) {
                cb.checked = true;
                // Add selected class to parent card if strictly needed, but CSS :checked selector is hard on parents without :has
                // My CSS doesn't use :has. I should add a JS listener or just loop.
                const card = cb.closest('.testimonial-selector-card');
                if (card) card.classList.add('selected');
            }
        });
    }

    // Add listener for selection change to toggle class
    document.querySelectorAll('input[name="svc-testimonial"]').forEach(cb => {
        cb.addEventListener('change', function () {
            const card = this.closest('.testimonial-selector-card');
            if (this.checked) card.classList.add('selected');
            else card.classList.remove('selected');
        });
    });

    // UI Updates
    document.getElementById('svc-submit-btn').textContent = "Atualizar Serviço";
    const cancelBtn = document.getElementById('svc-cancel-btn');
    if (cancelBtn) cancelBtn.classList.remove('hidden');

    // Scroll to form
    const formEl = document.getElementById('service-form'); // Logic assumes this ID or wrapper
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
    else {
        // Fallback
        const card = document.getElementById('card-services');
        if (card) {
            card.open = true;
            card.scrollIntoView({ behavior: 'smooth' });
        }
    }
};

window.deleteService = async function (id) {
    if (confirm("Tem a certeza que deseja apagar este serviço?")) {
        try {
            await window.db.collection("services").doc(id).delete();
            loadServices();
            // alert("Serviço apagado.");
        } catch (error) {
            console.error(error);
            alert("Erro ao apagar.");
        }
    }
};

window.resetServiceForm = function () {
    // Try to find the form. If 'service-form' ID exists on form tag
    const form = document.querySelector('#card-services form') || document.getElementById('service-form');
    if (form) form.reset();

    document.getElementById('svc-id').value = "";
    document.getElementById('svc-image-file').value = "";
    document.getElementById('svc-submit-btn').textContent = "Publicar Serviço";
    const cancelBtn = document.getElementById('svc-cancel-btn');
    if (cancelBtn) cancelBtn.classList.add('hidden');

    // Reset Color Defaults (Manual override as reset() might revert to value attribute)
    if (document.getElementById('svc-top-bg-color')) document.getElementById('svc-top-bg-color').value = '#000000';
    if (document.getElementById('svc-top-opacity')) document.getElementById('svc-top-opacity').value = 0.5;
    if (document.getElementById('svc-bottom-bg-color')) document.getElementById('svc-bottom-bg-color').value = '#4F553D';
    if (document.getElementById('svc-bottom-opacity')) document.getElementById('svc-bottom-opacity').value = 1;
    if (document.getElementById('svc-btn-text-color')) document.getElementById('svc-btn-text-color').value = '#ffffff';

    if (document.getElementById('opacity-val-top')) document.getElementById('opacity-val-top').textContent = '50%';
    if (document.getElementById('opacity-val-bottom')) document.getElementById('opacity-val-bottom').textContent = '100%';

    // Uncheck Testimonials
    document.querySelectorAll('input[name="svc-testimonial"]').forEach(cb => cb.checked = false);
};

// --- Testimonials Selector Logic (Round 4 - Sorted Cards) ---
window.loadTestimonialsSelector = async function (selectedSet) {
    const container = document.getElementById('svc-testimonials-selector');
    if (!container) return;

    const loading = document.getElementById('loading-testimonials-selector');
    if (loading) loading.style.display = 'block';

    try {
        const snapshot = await window.db.collection('testimonials').get();
        if (loading) loading.style.display = 'none';

        if (snapshot.empty) {
            container.innerHTML = '<p class="font-xs text-muted">Sem testemunhos disponíveis.</p>';
            return;
        }

        let testimonials = [];
        snapshot.forEach(doc => {
            testimonials.push({ id: doc.id, ...doc.data() });
        });

        // SORTING: Title/Role (Ascending)
        testimonials.sort((a, b) => {
            const roleA = (a.role || "").toLowerCase();
            const roleB = (b.role || "").toLowerCase();
            if (roleA < roleB) return -1;
            if (roleA > roleB) return 1;
            return a.name.localeCompare(b.name);
        });

        let html = '<div class="testimonials-selector-grid-v4">';

        testimonials.forEach(data => {
            const rawText = data.text || "";
            // Ensure we have enough text but not too much.
            // "Plain font" handled by CSS .card-line-2

            const role = data.role ? data.role : "";

            // Layout (Round 4): 
            // 1. Name (Bold) | Checkbox
            // 2. Text (Plain)
            // 3. Role (Bold)
            html += `
            <label class="testimonial-card-v4">
                <input type="checkbox" name="svc-testimonial" value="${data.id}">
                <div class="card-line-1">${data.name}</div>
                <div class="card-line-2">"${rawText}"</div>
                <div class="card-line-3">${role}</div>
            </label>
            `;
        });

        html += '</div>';

        container.innerHTML = html;

        // Add selection listener
        const checkboxes = container.querySelectorAll('input[name="svc-testimonial"]');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', function () {
                const card = this.closest('.testimonial-card-v4');
                if (this.checked) card.classList.add('selected');
                else card.classList.remove('selected');
            });
            // Initialize state if pre-selected (handled by parent logic usually, but here for fresh render)
            if (cb.checked) cb.closest('.testimonial-card-v4').classList.add('selected');
        });

    } catch (e) {
        console.error("Error loading testimonials selector", e);
        if (loading) loading.textContent = "Erro ao carregar.";
    }
};
