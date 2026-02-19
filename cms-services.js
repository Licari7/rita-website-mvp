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

    // Identify the button that was clicked
    let statusBtn = null;
    if (e && e.currentTarget && e.currentTarget.tagName === 'BUTTON') {
        statusBtn = e.currentTarget;
    } else {
        // Fallback: grab the last primary button found
        const submitBtns = document.querySelectorAll('#service-form button.cta-button.primary');
        if (submitBtns.length > 0) statusBtn = submitBtns[submitBtns.length - 1];
    }

    // Disable ALL Save buttons to prevent double-submit
    const allSubmitBtns = document.querySelectorAll('#service-form button.cta-button.primary');
    allSubmitBtns.forEach(btn => btn.disabled = true);

    let originalText = "Atualizar Serviço";
    if (statusBtn) {
        originalText = statusBtn.innerHTML;
        statusBtn.textContent = "A guardar...";
    }

    try {
        const idInput = document.getElementById('svc-id');
        const id = idInput ? idInput.value : '';


        const title = document.getElementById('svc-title').value;
        const benefitsStr = document.getElementById('svc-benefits').value;
        const benefits = benefitsStr ? benefitsStr.split(',').map(s => s.trim()).filter(s => s) : [];
        const desc = document.getElementById('svc-desc').value; // Short

        // Section 1 Data
        const section1Title = document.getElementById('svc-sec1-title').value;
        const fullDesc = document.getElementById('svc-full-desc').value;

        // Section 2 Data
        const fullDesc2 = document.getElementById('svc-full-desc-2').value;

        // Image Handling (Header)
        let imageUrl = document.getElementById('svc-image').value;
        const imageFile = document.getElementById('svc-image-file').files[0];

        // Image Handling (Section 1 - Intro)
        let image1Url = document.getElementById('svc-image-1').value;
        const image1File = document.getElementById('svc-image-1-file').files[0];

        // Image Handling (Section 2 - Bottom)
        let image2Url = document.getElementById('svc-image-2').value;
        const image2File = document.getElementById('svc-image-2-file').files[0];

        // Upload Header Image
        if (imageFile) {
            if (statusBtn) statusBtn.textContent = "A enviar imagem (Topo)...";
            try {
                const path = `services/${Date.now()}_header_${imageFile.name}`;
                imageUrl = await window.uploadImageToStorage(imageFile, path);
            } catch (err) {
                console.error("Image Upload Error", err);
                throw new Error("Falha no upload da imagem de cabeçalho: " + err.message);
            }
        }

        // Upload Section 1 Image
        if (image1File) {
            if (statusBtn) statusBtn.textContent = "A enviar imagem (Secção 1)...";
            try {
                const path = `services/${Date.now()}_sec1_${image1File.name}`;
                image1Url = await window.uploadImageToStorage(image1File, path);
            } catch (err) {
                console.error("Image Upload Error", err);
                throw new Error("Falha no upload da imagem da Secção 1: " + err.message);
            }
        }

        // Upload Section 2 Image
        if (image2File) {
            if (statusBtn) statusBtn.textContent = "A enviar imagem (Secção 2)...";
            try {
                const path = `services/${Date.now()}_sec2_${image2File.name}`;
                image2Url = await window.uploadImageToStorage(image2File, path);
            } catch (err) {
                console.error("Image Upload Error", err);
                throw new Error("Falha no upload da imagem da Secção 2: " + err.message);
            }
        }

        // Color & CTA Configs (New Structure)
        const customColors = {
            // Section 1
            section1_bg: document.getElementById('svc-sec1-bg-color').value,
            section1_card_bg: document.getElementById('svc-card1-bg-color').value,
            section1_card_opacity: parseFloat(document.getElementById('svc-card1-opacity').value),

            // Section 2
            section2_bg: document.getElementById('svc-sec2-bg-color').value,
            section2_card_bg: document.getElementById('svc-card2-bg-color').value,
            section2_card_opacity: parseFloat(document.getElementById('svc-card2-opacity').value),

            // CTAs
            show_schedule_1: document.getElementById('svc-sec1-cta-schedule').checked,
            show_contact_1: document.getElementById('svc-sec1-cta-contact').checked,
            show_schedule_2: document.getElementById('svc-sec2-cta-schedule').checked,
            show_contact_2: document.getElementById('svc-sec2-cta-contact').checked,

            // Visibility
            show_section_2: document.getElementById('svc-sec2-visible') ? document.getElementById('svc-sec2-visible').checked : true,

            // Testimonials
            testimonials_bg: document.getElementById('svc-testi-bg-color').value
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
            // Section 1
            section1_title: section1Title,
            long_description: fullDesc,
            section1_image: image1Url,
            // Section 2
            long_description_2: fullDesc2,
            section2_image: image2Url,

            headerImage: imageUrl,
            customColors,
            testimonial_ids: selectedTestimonials,
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
            // Create - Check for duplicates first
            const duplicateCheck = await window.db.collection("services").where("title", "==", title).get();
            if (!duplicateCheck.empty) {
                const confirmDup = confirm(`Já existe um serviço com o nome "${title}". Deseja criar um duplicado?\n\nCancelar = Não criar.\nOK = Criar mesmo assim.`);
                if (!confirmDup) {
                    // Re-enable buttons if user cancels creation
                    if (statusBtn) statusBtn.innerHTML = originalText;
                    allSubmitBtns.forEach(btn => btn.disabled = false);
                    throw new Error("Criação cancelada pelo utilizador (Serviço duplicado).");
                }
            }

            await window.db.collection("services").add(serviceData);
            alert("Serviço criado com sucesso! ✨");
        }

        window.resetServiceForm();
        loadServices();

    } catch (error) {
        console.error("Error saving service:", error);
        alert("Erro ao guardar serviço: " + error.message);
    } finally {
        // Ensure buttons are re-enabled and text restored in all cases (success or error)
        if (statusBtn) {
            statusBtn.innerHTML = originalText;
        }
        allSubmitBtns.forEach(btn => btn.disabled = false);
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
        console.error("[editService] CRITICAL: svc-id input not found!");
    }

    // Basic Info
    document.getElementById('svc-title').value = data.title || '';
    document.getElementById('svc-benefits').value = (data.benefits || []).join(', ');
    document.getElementById('svc-desc').value = data.description || '';
    document.getElementById('svc-image').value = data.headerImage || '';
    document.getElementById('svc-image-file').value = '';

    // Section 1
    document.getElementById('svc-sec1-title').value = data.section1_title || '';
    document.getElementById('svc-full-desc').value = data.long_description || '';
    document.getElementById('svc-image-1').value = data.section1_image || '';
    document.getElementById('svc-image-1-file').value = '';

    // Section 2
    document.getElementById('svc-full-desc-2').value = data.long_description_2 || '';
    document.getElementById('svc-image-2').value = data.section2_image || '';
    document.getElementById('svc-image-2-file').value = '';

    // Configs & Colors
    if (data.customColors) {
        // Section 1
        if (document.getElementById('svc-sec1-bg-color')) document.getElementById('svc-sec1-bg-color').value = data.customColors.section1_bg || '#ffffff';
        if (document.getElementById('svc-card1-bg-color')) document.getElementById('svc-card1-bg-color').value = data.customColors.section1_card_bg || '#ffffff';

        if (document.getElementById('svc-card1-opacity')) {
            const op1 = data.customColors.section1_card_opacity !== undefined ? data.customColors.section1_card_opacity : 0.9;
            document.getElementById('svc-card1-opacity').value = op1;
            if (document.getElementById('op-val-card1')) document.getElementById('op-val-card1').textContent = Math.round(op1 * 100) + '%';
        }

        // Section 2
        if (document.getElementById('svc-sec2-bg-color')) document.getElementById('svc-sec2-bg-color').value = data.customColors.section2_bg || '#f7f2e0';
        if (document.getElementById('svc-card2-bg-color')) document.getElementById('svc-card2-bg-color').value = data.customColors.section2_card_bg || '#ffffff';

        if (document.getElementById('svc-card2-opacity')) {
            const op2 = data.customColors.section2_card_opacity !== undefined ? data.customColors.section2_card_opacity : 0.9;
            document.getElementById('svc-card2-opacity').value = op2;
            if (document.getElementById('op-val-card2')) document.getElementById('op-val-card2').textContent = Math.round(op2 * 100) + '%';
        }

        // CTAs
        if (document.getElementById('svc-sec1-cta-schedule')) document.getElementById('svc-sec1-cta-schedule').checked = data.customColors.show_schedule_1 !== false; // Default true if undefined
        if (document.getElementById('svc-sec1-cta-contact')) document.getElementById('svc-sec1-cta-contact').checked = data.customColors.show_contact_1 !== false;

        if (document.getElementById('svc-sec2-cta-schedule')) document.getElementById('svc-sec2-cta-schedule').checked = data.customColors.show_schedule_2 === true; // Default false
        if (document.getElementById('svc-sec2-cta-contact')) document.getElementById('svc-sec2-cta-contact').checked = data.customColors.show_contact_2 !== false; // Default true

        // Visibility
        if (document.getElementById('svc-sec2-visible')) {
            document.getElementById('svc-sec2-visible').checked = data.customColors.show_section_2 !== false; // Default true (visible)
        }

        if (document.getElementById('svc-testi-bg-color')) {
            const tBg = data.customColors.testimonials_bg || '#ffffff';
            document.getElementById('svc-testi-bg-color').value = tBg;
        }

    } else {
        // Defaults if no customColors (Migration or New)
        // Set default values similar to "Reset"
        resetColorsToDefaults();
    }

    // Ensure Testimonials are Loaded with Selection
    const selectedSet = new Set(data.testimonial_ids || []);
    // Always reload to ensure fresh sort and selection state
    await loadTestimonialsSelector(selectedSet);

    // UI Updates - Standardize ALL Update buttons
    const allSubmitBtns = document.querySelectorAll('#service-form button.cta-button.primary');
    allSubmitBtns.forEach(btn => {
        btn.innerHTML = '<i data-lucide="save"></i> Atualizar Serviço';
        btn.title = "Atualiza todo o serviço (Cartão Principal, Detalhes e Testemunhos)";
    });

    // Hide the bottom "Publicar Serviço" button during edit (BY ID)
    const bottomBtn = document.getElementById('svc-submit-btn');
    if (bottomBtn) {
        bottomBtn.classList.add('hidden');
        bottomBtn.style.display = 'none'; // Force style in case class is overridden
    }

    // Scroll to form
    const formEl = document.getElementById('service-form');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (window.lucide) window.lucide.createIcons();
};

window.deleteService = async function (id) {
    if (confirm("Tem a certeza que deseja apagar este serviço?")) {
        try {
            await window.db.collection("services").doc(id).delete();
            loadServices();
        } catch (error) {
            console.error(error);
            alert("Erro ao apagar.");
        }
    }
};

window.resetServiceForm = function () {
    const form = document.getElementById('service-form');
    if (form) form.reset();

    document.getElementById('svc-id').value = "";

    // Reset file/image inputs explicitly
    ['svc-image', 'svc-image-file', 'svc-image-1', 'svc-image-1-file', 'svc-image-2', 'svc-image-2-file'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    // Reset All Buttons to "Create" state
    const allSubmitBtns = document.querySelectorAll('#service-form button.cta-button.primary');
    allSubmitBtns.forEach(btn => {
        btn.innerHTML = '<i data-lucide="plus-circle"></i> Criar Novo Serviço';
    });

    // Show the bottom button again (it was hidden in edit)
    const bottomBtn = document.getElementById('svc-submit-btn');
    if (bottomBtn) {
        bottomBtn.classList.remove('hidden');
        bottomBtn.style.display = 'block'; // Restore display
        bottomBtn.innerHTML = 'Publicar Serviço'; // Enhance text if needed or keep default
        bottomBtn.title = "Cria o novo serviço com todas as informações preenchidas (Cartão Principal, Detalhes e Testemunhos)";
    }

    resetColorsToDefaults();

    // Uncheck Testimonials
    document.querySelectorAll('input[name="svc-testimonial"]').forEach(cb => {
        cb.checked = false;
        const card = cb.closest('.testimonial-card-v4');
        if (card) card.classList.remove('selected');
    });
};

function resetColorsToDefaults() {
    if (document.getElementById('svc-sec1-bg-color')) document.getElementById('svc-sec1-bg-color').value = '#ffffff';
    if (document.getElementById('svc-card1-bg-color')) document.getElementById('svc-card1-bg-color').value = '#ffffff';
    if (document.getElementById('svc-card1-opacity')) {
        document.getElementById('svc-card1-opacity').value = 0.9;
        if (document.getElementById('op-val-card1')) document.getElementById('op-val-card1').textContent = '90%';
    }

    if (document.getElementById('svc-sec2-bg-color')) document.getElementById('svc-sec2-bg-color').value = '#f7f2e0';
    if (document.getElementById('svc-card2-bg-color')) document.getElementById('svc-card2-bg-color').value = '#ffffff';
    if (document.getElementById('svc-card2-opacity')) {
        document.getElementById('svc-card2-opacity').value = 0.9;
        if (document.getElementById('op-val-card2')) document.getElementById('op-val-card2').textContent = '90%';
    }

    // CTAs Defaults
    if (document.getElementById('svc-sec1-cta-schedule')) document.getElementById('svc-sec1-cta-schedule').checked = true;
    if (document.getElementById('svc-sec1-cta-contact')) document.getElementById('svc-sec1-cta-contact').checked = true;
    if (document.getElementById('svc-sec2-cta-schedule')) document.getElementById('svc-sec2-cta-schedule').checked = false;
    if (document.getElementById('svc-sec2-cta-schedule')) document.getElementById('svc-sec2-cta-schedule').checked = false;
    if (document.getElementById('svc-sec2-cta-contact')) document.getElementById('svc-sec2-cta-contact').checked = true;

    // Testimonials Defaults
    if (document.getElementById('svc-testi-bg-color')) document.getElementById('svc-testi-bg-color').value = '#ffffff';
}

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

        // Update Total Count
        if (document.getElementById('svc-testimonials-total')) {
            document.getElementById('svc-testimonials-total').innerText = testimonials.length;
        }

        let html = '<div class="testimonials-selector-grid-v4">';

        testimonials.forEach(data => {
            const rawText = data.text || "";
            const role = data.role ? data.role : "";

            // Check if selected (passed in set or check DOM if re-render?)
            // Usually we rely on the passed selectedSet for initial render.
            // If selectedSet is not null, use it.
            const isSelected = selectedSet && selectedSet.has(data.id);
            const checkedState = isSelected ? 'checked' : '';
            const selectedClass = isSelected ? 'selected' : '';

            html += `
            <label class="testimonial-card-v4 ${selectedClass}">
                <input type="checkbox" name="svc-testimonial" value="${data.id}" ${checkedState}>
                <div class="card-line-1 text-truncate">${data.name}</div>
                <div class="card-line-2">"${rawText}"</div>
                <div class="card-line-3 text-truncate">${role}</div>
            </label>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        // Add selection listener & Update Count
        const checkboxes = container.querySelectorAll('input[name="svc-testimonial"]');

        function updateSelectedCount() {
            const count = document.querySelectorAll('input[name="svc-testimonial"]:checked').length;
            if (document.getElementById('svc-testimonials-selected-count')) {
                document.getElementById('svc-testimonials-selected-count').innerText = count;
            }
        }

        checkboxes.forEach(cb => {
            cb.addEventListener('change', function () {
                const card = this.closest('.testimonial-card-v4');
                if (this.checked) card.classList.add('selected');
                else card.classList.remove('selected');
                updateSelectedCount();
            });
        });

        // Initial Count Update
        updateSelectedCount();

    } catch (e) {
        console.error("Error loading testimonials selector", e);
        if (loading) loading.textContent = "Erro ao carregar.";
    }
};
