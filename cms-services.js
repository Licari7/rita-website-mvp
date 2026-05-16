// --- Services Logic (Refactored to cms-services.js) ---


window.servicesCache = {};

const SERVICE_EDITORIAL_DEFAULTS = {
    aura: {
        kicker: 'Leitura de Aura em Portugal',
        title: 'Um encontro de clareza, escuta energética e reconexão interior',
        intro: [
            'A Leitura de Aura é um espaço de escuta profunda da energia presente, das camadas emocionais e dos movimentos internos que podem estar a pedir atenção. Mais do que procurar respostas fora, esta sessão convida a observar o que já vive em ti com mais presença, clareza e consciência.',
            'Ao olhar para o campo energético, a sessão pode ajudar a reconhecer padrões, bloqueios, potenciais e temas que estão ativos no momento atual. É uma ferramenta de autoconhecimento, alinhamento e reconexão com a própria essência.'
        ],
        topics: [
            'necessidade de clareza sobre um momento de vida ou decisão importante;',
            'sensação de bloqueio, peso energético ou desalinhamento interior;',
            'vontade de compreender padrões emocionais ou relacionais;',
            'procura de reconexão com a própria essência e voz interior;',
            'curiosidade sobre leitura energética, chakras ou campo áurico;',
            'fase de mudança, crescimento pessoal ou transição interior.'
        ],
        how: 'A sessão começa com uma breve conversa para acolher o momento presente e a intenção que trazes. A partir daí, a leitura desenvolve-se como uma escuta do campo energético, observando informações, sensações e mensagens que possam apoiar maior consciência sobre o tema ou fase atual.\n\nO processo é individual e pode ser adaptado ao formato disponível. No final, há espaço para integrar o que foi partilhado, colocar questões e regressar ao quotidiano com mais clareza e presença.',
        expect: 'A Leitura de Aura não é futurologia nem promete soluções imediatas. Pode apoiar um processo de clareza, autoconhecimento e alinhamento interior, ajudando a pessoa a reconhecer o que está presente e a relacionar-se com a sua própria energia de forma mais consciente.',
        about: 'As sessões são acompanhadas por Rita Barata, terapeuta holística e criadora da Floresce Terapias. O seu trabalho integra presença, escuta e ferramentas energéticas para apoiar processos de consciência, expansão e transformação interior.',
        links: [
            { eyebrow: 'Sobre Rita Barata', label: 'Conhecer percurso', url: '/about-new' },
            { eyebrow: 'Serviço complementar', label: 'Innerdance', url: '/innerdance' },
            { eyebrow: 'Serviço complementar', label: 'Constelações Familiares', url: '/constelacoes' }
        ],
        faqs: [
            { question: 'O que é uma Leitura de Aura?', answer: 'É uma sessão de escuta energética e intuitiva que procura trazer clareza sobre o momento presente, padrões internos, bloqueios e potenciais de desenvolvimento pessoal.' },
            { question: 'A Leitura de Aura prevê o futuro?', answer: 'Não. A Leitura de Aura não é futurologia. O foco está em observar o momento presente, apoiar clareza interior e favorecer um contacto mais consciente com a própria essência.' },
            { question: 'A sessão pode ser online?', answer: 'A Leitura de Aura pode ser realizada online, quando esse formato estiver disponível. Recomenda-se confirmar as condições antes de marcar.' },
            { question: 'Uma Leitura de Aura substitui acompanhamento psicológico ou médico?', answer: 'Não. A Leitura de Aura é uma ferramenta complementar de autoconhecimento e não substitui psicoterapia, acompanhamento psicológico ou acompanhamento médico.' }
        ]
    },
    innerdance: {
        kicker: 'Innerdance em Portugal',
        title: 'Uma viagem interior através da música, do corpo e da consciência',
        intro: [
            'Innerdance é uma experiência de autoconhecimento que convida o corpo a regressar à sua inteligência natural. Através da música, da presença e de um campo energético sustentado, a sessão cria espaço para estados ampliados de consciência, libertação interna e autorregulação.',
            'Mais do que uma prática de movimento, Innerdance é uma viagem interior. Cada pessoa vive o processo de forma única, permitindo que sensações, imagens, emoções ou movimentos espontâneos surjam ao ritmo do próprio corpo.'
        ],
        topics: [
            'necessidade de desacelerar e escutar o corpo com mais presença;',
            'procura de autorregulação, autocura e consciência corporal;',
            'vontade de explorar estados ampliados de consciência;',
            'sensação de bloqueio emocional, mental ou energético;',
            'fase de mudança, expansão pessoal ou reconexão interior;',
            'curiosidade por práticas terapêuticas com música e campo energético.'
        ],
        how: 'A sessão decorre num ambiente seguro e cuidado, com música e orientação energética. Normalmente, a pessoa permanece deitada ou em repouso, permitindo que o corpo responda naturalmente ao que está a acontecer. Não há passos a seguir nem uma forma certa de viver a experiência.\n\nPodem surgir sensações físicas, memórias, emoções, movimentos espontâneos, imagens internas ou momentos de silêncio profundo. No final, há espaço para integrar a experiência e regressar com calma ao quotidiano.',
        expect: 'Innerdance não promete resultados iguais para todas as pessoas. Pode apoiar processos de relaxamento, autorregulação, clareza, libertação emocional e reconexão com a inteligência do corpo. Cada sessão é vivida ao ritmo de quem participa.',
        about: 'As sessões são acompanhadas por Rita Barata, terapeuta holística e criadora da Floresce Terapias. O seu trabalho integra presença, escuta e ferramentas energéticas para apoiar processos de consciência, expansão e transformação interior.',
        links: [
            { eyebrow: 'Sobre Rita Barata', label: 'Conhecer percurso', url: '/about-new' },
            { eyebrow: 'Serviço complementar', label: 'Leitura de Aura', url: '/leitura-aura' },
            { eyebrow: 'Serviço complementar', label: 'Constelações Familiares', url: '/constelacoes' }
        ],
        faqs: [
            { question: 'O que é Innerdance?', answer: 'Innerdance é uma experiência de autoconhecimento que usa música, presença e campo energético para favorecer estados ampliados de consciência, autorregulação e reconexão com a inteligência do corpo.' },
            { question: 'Preciso de saber dançar para participar?', answer: 'Não. Apesar do nome, Innerdance não exige saber dançar nem seguir passos. O processo acontece de forma interna e cada pessoa vive a experiência ao seu próprio ritmo.' },
            { question: 'A sessão pode ser online?', answer: 'As sessões podem acontecer online ou presencialmente, conforme o formato disponível. Recomenda-se confirmar as condições antes de marcar.' },
            { question: 'Innerdance substitui acompanhamento psicológico ou médico?', answer: 'Não. Innerdance é uma ferramenta complementar de autoconhecimento e desenvolvimento pessoal, não substituindo psicoterapia, acompanhamento psicológico ou acompanhamento médico.' }
        ]
    },
    constelacoes: {
        kicker: 'Constelações Familiares em Portugal',
        title: 'Um olhar sistémico sobre padrões, vínculos e histórias familiares',
        intro: [
            'As Constelações Familiares e Sistémicas são uma abordagem de autoconhecimento que permite olhar para temas pessoais, familiares e relacionais a partir de uma perspetiva mais ampla. Numa sessão, o foco não está em encontrar culpados, mas em observar padrões, lealdades invisíveis e dinâmicas que podem estar a influenciar a vida presente.',
            'Este trabalho pode ser útil quando existe a sensação de repetir histórias, carregar emoções difíceis de explicar ou viver bloqueios que parecem não ter origem apenas na experiência individual. A sessão cria um espaço de presença, escuta e consciência para que o tema possa ser visto com mais clareza.'
        ],
        topics: [
            'padrões repetitivos nos relacionamentos, na família ou na vida profissional;',
            'conflitos familiares, afastamentos ou dificuldades de comunicação;',
            'bloqueios emocionais, sensação de peso ou dificuldade em avançar;',
            'temas ligados a pai, mãe, filhos, casal, separações ou perdas;',
            'decisões importantes que pedem mais clareza interior;',
            'sensação de carregar algo que parece vir de uma história familiar mais antiga.'
        ],
        how: 'A sessão começa com uma conversa inicial para clarificar o tema que queres trazer. A partir daí, o trabalho desenvolve-se de forma cuidada e respeitosa, observando as relações, movimentos internos e possíveis dinâmicas associadas ao tema escolhido.\n\nO processo é individual e orientado pela presença da facilitadora. Não é necessário levar familiares para a sessão. No final, há um momento de integração para acolher o que foi observado e regressar ao quotidiano com mais consciência.',
        expect: 'As Constelações Familiares não prometem soluções imediatas nem substituem acompanhamento clínico. Podem, no entanto, apoiar um processo de maior clareza, reconhecimento de padrões e reconexão com recursos internos. Cada pessoa vive a sessão de forma única, ao seu próprio ritmo.',
        about: 'As sessões são acompanhadas por Rita Barata, terapeuta holística e criadora da Floresce Terapias. O seu trabalho integra escuta, presença e ferramentas de desenvolvimento pessoal para apoiar processos de consciência, expansão e transformação interior.',
        links: [
            { eyebrow: 'Sobre Rita Barata', label: 'Conhecer percurso', url: '/about-new' },
            { eyebrow: 'Serviço complementar', label: 'Innerdance', url: '/innerdance' },
            { eyebrow: 'Serviço complementar', label: 'Leitura de Aura', url: '/leitura-aura' }
        ],
        faqs: [
            { question: 'O que são Constelações Familiares?', answer: 'São uma abordagem sistémica que ajuda a observar dinâmicas inconscientes, padrões repetitivos e bloqueios que podem estar ligados à história familiar ou relacional.' },
            { question: 'Preciso de levar familiares para a sessão?', answer: 'Não. A sessão pode ser individual e centrada no tema que queres observar, sem necessidade de presença de outros familiares.' },
            { question: 'As sessões podem ser online?', answer: 'O formato pode ser adaptado conforme a disponibilidade e o tipo de acompanhamento. Para confirmar se a sessão será online ou presencial, o ideal é entrar em contacto antes de marcar.' },
            { question: 'Uma sessão substitui psicoterapia ou acompanhamento médico?', answer: 'Não. As Constelações Familiares são uma ferramenta complementar de autoconhecimento e desenvolvimento pessoal, não substituindo psicoterapia, acompanhamento psicológico ou acompanhamento médico.' }
        ]
    }
};

function getServiceEditorialDefaults(serviceId = '') {
    const defaults = SERVICE_EDITORIAL_DEFAULTS[serviceId] || {};
    return {
        enabled: true,
        kicker: defaults.kicker || '',
        title: defaults.title || '',
        intro: defaults.intro || [],
        how: defaults.how || '',
        expect: defaults.expect || '',
        about: defaults.about || '',
        topics: defaults.topics || [],
        links: defaults.links || [],
        faqs: defaults.faqs || [],
        style: {
            bgColor: '#f7f2e0',
            bgImage: '',
            bgOpacity: 0.95,
            titleColor: '#80864f',
            bodyColor: '#333333',
            accentColor: '#BF897F',
            font: 'default'
        }
    };
}

function setValue(id, value = '') {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

function setChecked(id, checked) {
    const el = document.getElementById(id);
    if (el) el.checked = Boolean(checked);
}

function getChecked(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
}

function splitParagraphs(value) {
    return String(value || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
}

function escapeAttr(value = '') {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtml(value = '') {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

window.addServiceEditorialItem = function (type, data = {}) {
    const list = document.getElementById(`svc-editorial-${type}-list`);
    if (!list) return;

    const item = document.createElement('div');
    item.className = 'service-repeater-item';
    item.dataset.type = type;

    if (type === 'topics') {
        item.innerHTML = `
            <div class="service-repeater-item-header">
                <strong class="font-xs">Cartão</strong>
                <div class="service-repeater-actions">
                    <button type="button" class="btn-text-danger font-xs" onclick="this.closest('.service-repeater-item').remove()">Remover</button>
                </div>
            </div>
            <textarea class="admin-textarea input-sand full-width font-xs" data-field="text" placeholder="Texto do cartão...">${escapeHtml(data.text || data || '')}</textarea>
            <p class="field-help">Aceita texto simples ou HTML. Exemplo de link: &lt;a href="/booking"&gt;marcar&lt;/a&gt;.</p>
        `;
    } else if (type === 'links') {
        item.innerHTML = `
            <div class="service-repeater-item-header">
                <strong class="font-xs">Link</strong>
                <div class="service-repeater-actions">
                    <button type="button" class="btn-text-danger font-xs" onclick="this.closest('.service-repeater-item').remove()">Remover</button>
                </div>
            </div>
            <input type="text" class="admin-input full-width font-xs mb-5" data-field="eyebrow" placeholder="Etiqueta pequena" value="${escapeAttr(data.eyebrow || '')}">
            <input type="text" class="admin-input full-width font-xs mb-5" data-field="label" placeholder="Texto principal" value="${escapeAttr(data.label || '')}">
            <input type="text" class="admin-input full-width font-xs" data-field="url" placeholder="/url" value="${escapeAttr(data.url || '')}">
            <p class="field-help">Interno: /innerdance. Externo: https://exemplo.pt. Evitar deixar URL vazia.</p>
        `;
    } else if (type === 'faqs') {
        item.innerHTML = `
            <div class="service-repeater-item-header">
                <strong class="font-xs">FAQ</strong>
                <div class="service-repeater-actions">
                    <button type="button" class="btn-text-danger font-xs" onclick="this.closest('.service-repeater-item').remove()">Remover</button>
                </div>
            </div>
            <input type="text" class="admin-input full-width font-xs mb-5" data-field="question" placeholder="Pergunta" value="${escapeAttr(data.question || '')}">
            <textarea class="admin-textarea input-sand full-width font-xs" data-field="answer" placeholder="Resposta...">${escapeHtml(data.answer || '')}</textarea>
            <p class="field-help">Resposta com texto simples ou HTML. Manter clara e curta para leitura rápida.</p>
        `;
    }

    list.appendChild(item);
    if (window.lucide) window.lucide.createIcons();
};

function setServiceEditorialForm(editorial, serviceId = '') {
    const data = { ...getServiceEditorialDefaults(serviceId), ...(editorial || {}) };
    data.style = { ...getServiceEditorialDefaults(serviceId).style, ...(data.style || {}) };

    setChecked('svc-editorial-enabled', data.enabled !== false);
    setValue('svc-editorial-kicker', data.kicker || '');
    setValue('svc-editorial-title', data.title || '');
    setValue('svc-editorial-intro', Array.isArray(data.intro) ? data.intro.join('\n\n') : (data.intro || ''));
    setValue('svc-editorial-how', data.how || '');
    setValue('svc-editorial-expect', data.expect || '');
    setValue('svc-editorial-about', data.about || '');
    setValue('svc-editorial-bg-color', data.style.bgColor || '#f7f2e0');
    setValue('svc-editorial-bg-opacity', data.style.bgOpacity !== undefined ? data.style.bgOpacity : 0.95);
    setValue('svc-editorial-title-color', data.style.titleColor || '#80864f');
    setValue('svc-editorial-body-color', data.style.bodyColor || '#333333');
    setValue('svc-editorial-accent-color', data.style.accentColor || '#BF897F');
    setValue('svc-editorial-font', data.style.font || 'default');

    const opacityLabel = document.getElementById('svc-editorial-bg-opacity-val');
    if (opacityLabel) opacityLabel.innerText = Math.round((parseFloat(getValue('svc-editorial-bg-opacity')) || 0.95) * 100) + '%';

    const bgUrl = data.style.bgImage || '';
    const bgInput = document.getElementById('svc-editorial-bg-url');
    const bgFile = document.getElementById('svc-editorial-bg-file');
    if (bgFile) bgFile.value = '';
    if (bgInput) {
        bgInput.value = bgUrl;
        bgInput.dataset.originalUrl = bgUrl;
        bgInput.placeholder = bgUrl && bgUrl.includes('firebasestorage') ? window.extractFilenameFromUrl(bgUrl) : 'URL da imagem...';
    }
    if (window.renderFilePreview) {
        window.renderFilePreview('svc-editorial-bg-preview', bgUrl, { urlInputId: 'svc-editorial-bg-url', fileInputId: 'svc-editorial-bg-file' });
    }

    ['topics', 'links', 'faqs'].forEach(type => {
        const list = document.getElementById(`svc-editorial-${type}-list`);
        if (list) list.innerHTML = '';
    });

    (data.topics || []).forEach(text => window.addServiceEditorialItem('topics', { text }));
    (data.links || []).forEach(link => window.addServiceEditorialItem('links', link));
    (data.faqs || []).forEach(faq => window.addServiceEditorialItem('faqs', faq));
}

function collectServiceEditorialForm(bgImage = '') {
    const collectItems = (type) => {
        const list = document.getElementById(`svc-editorial-${type}-list`);
        if (!list) return [];
        return Array.from(list.querySelectorAll('.service-repeater-item')).map(item => {
            if (type === 'topics') {
                return item.querySelector('[data-field="text"]')?.value.trim();
            }
            if (type === 'links') {
                return {
                    eyebrow: item.querySelector('[data-field="eyebrow"]')?.value.trim() || '',
                    label: item.querySelector('[data-field="label"]')?.value.trim() || '',
                    url: item.querySelector('[data-field="url"]')?.value.trim() || ''
                };
            }
            return {
                question: item.querySelector('[data-field="question"]')?.value.trim() || '',
                answer: item.querySelector('[data-field="answer"]')?.value.trim() || ''
            };
        }).filter(item => {
            if (typeof item === 'string') return item.length > 0;
            if (type === 'links') return item.label || item.url || item.eyebrow;
            return item.question || item.answer;
        });
    };

    return {
        enabled: getChecked('svc-editorial-enabled'),
        kicker: getValue('svc-editorial-kicker').trim(),
        title: getValue('svc-editorial-title').trim(),
        intro: splitParagraphs(getValue('svc-editorial-intro')),
        how: getValue('svc-editorial-how').trim(),
        expect: getValue('svc-editorial-expect').trim(),
        about: getValue('svc-editorial-about').trim(),
        topics: collectItems('topics'),
        links: collectItems('links'),
        faqs: collectItems('faqs'),
        style: {
            bgColor: getValue('svc-editorial-bg-color') || '#f7f2e0',
            bgImage,
            bgOpacity: parseFloat(getValue('svc-editorial-bg-opacity')) || 0.95,
            titleColor: getValue('svc-editorial-title-color') || '#80864f',
            bodyColor: getValue('svc-editorial-body-color') || '#333333',
            accentColor: getValue('svc-editorial-accent-color') || '#BF897F',
            font: getValue('svc-editorial-font') || 'default'
        }
    };
}

async function resolveServiceFileField({ previewId, urlInputId, fileInputId, uploadPathPrefix, label, statusBtn }) {
    const fileInput = document.getElementById(fileInputId);
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;
    const decision = window.getExistingFileDecision
        ? window.getExistingFileDecision(previewId, Boolean(file))
        : { action: file ? 'replace' : 'keep', existingUrl: window.getFileUrlInput(urlInputId) };

    if (decision.action === 'keep') {
        return decision.existingUrl || window.getFileUrlInput(urlInputId);
    }

    if (decision.action === 'remove') {
        if (decision.existingUrl && decision.existingUrl.includes('firebasestorage')) {
            if (statusBtn) statusBtn.textContent = `A remover imagem (${label})...`;
            await window.deleteFileFromStorage(decision.existingUrl);
        }
        return '';
    }

    if (file) {
        if (decision.existingUrl && decision.existingUrl.includes('firebasestorage')) {
            if (statusBtn) statusBtn.textContent = `A substituir imagem (${label})...`;
            await window.deleteFileFromStorage(decision.existingUrl);
        }
        if (statusBtn) statusBtn.textContent = `A enviar imagem (${label})...`;
        const path = `services/${Date.now()}_${uploadPathPrefix}_${file.name}`;
        return await window.uploadImageToStorage(file, path);
    }

    return window.getFileUrlInput(urlInputId);
}

function updateServiceEditToolbar(mode = '') {
    const title = getValue('svc-title').trim();
    const id = getValue('svc-id').trim();
    const currentName = document.getElementById('svc-current-name');
    const editMode = document.getElementById('svc-edit-mode');
    if (currentName) currentName.textContent = title || 'Ainda sem nome';
    if (editMode) editMode.textContent = mode || (id ? 'A editar serviço' : 'Novo serviço');
}

function enhanceServiceEditorCards() {
    const cards = document.querySelectorAll('#service-form .admin-col-card');
    cards.forEach((card, index) => {
        if (card.dataset.collapsibleReady === 'true') return;
        const header = card.querySelector(':scope > .admin-col-header');
        if (!header) return;

        const body = document.createElement('div');
        body.className = 'admin-collapsible-body';
        let node = header.nextSibling;
        while (node) {
            const next = node.nextSibling;
            body.appendChild(node);
            node = next;
        }
        card.appendChild(body);

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'admin-col-toggle';
        toggle.textContent = index === 0 ? 'Ocultar' : 'Mostrar';
        toggle.title = 'Mostrar ou esconder esta área do formulário';
        toggle.addEventListener('click', () => {
            const collapsed = card.classList.toggle('is-collapsed');
            toggle.textContent = collapsed ? 'Mostrar' : 'Ocultar';
        });
        header.appendChild(toggle);

        if (index > 0) card.classList.add('is-collapsed');
        card.dataset.collapsibleReady = 'true';
    });

    const titleInput = document.getElementById('svc-title');
    if (titleInput && titleInput.dataset.toolbarListener !== 'true') {
        titleInput.addEventListener('input', () => updateServiceEditToolbar());
        titleInput.dataset.toolbarListener = 'true';
    }
    updateServiceEditToolbar();
}

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
            const isHidden = data.active === false;

            // Card Preview Logic - Image Fallback
            const imgUrl = data.headerImage || data.image || data.img;

            const imageHtml = imgUrl
                ? `<img src="${imgUrl}" alt="${data.title}" class="mini-card-img">`
                : `<div class="mini-card-img-placeholder"></div>`;

            html += `
            <div class="admin-service-card-mini ${isHidden ? 'is-hidden-service' : ''}" draggable="true" ondragstart="drag(event)" id="${doc.id}">
                ${imageHtml}
                <div class="service-visibility-badge">${isHidden ? 'Oculto' : 'Visível'}</div>
                <div class="mini-card-title">${data.title}</div>
                <div class="mini-card-actions">
                    <button class="btn-icon-action edit" onclick="window.editService('${doc.id}')" title="Editar">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="btn-icon-action visibility" onclick="window.toggleServiceVisibility('${doc.id}')" title="${isHidden ? 'Mostrar na página inicial' : 'Ocultar da página inicial'}">
                        <i data-lucide="${isHidden ? 'eye' : 'eye-off'}"></i>
                    </button>
                </div>
            </div>
            `;
        });

        listContainer.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();

        // Also load testimonials for the selector
        loadTestimonialsSelector();
        if (!document.getElementById('svc-id')?.value) {
            setServiceEditorialForm(null, '');
        }
        enhanceServiceEditorCards();

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
        const isActive = document.getElementById('svc-active-toggle') ? document.getElementById('svc-active-toggle').checked : true;
        const benefitsStr = document.getElementById('svc-benefits').value;
        const benefits = benefitsStr ? benefitsStr.split(',').map(s => s.trim()).filter(s => s) : [];
        const desc = document.getElementById('svc-desc').value; // Short

        // Section 1 Data
        const section1Title = document.getElementById('svc-sec1-title').value;
        const fullDesc = document.getElementById('svc-full-desc').value;

        // Section 2 Data
        const fullDesc2 = document.getElementById('svc-full-desc-2').value;

        const imageUrl = await resolveServiceFileField({
            previewId: 'svc-image-preview',
            urlInputId: 'svc-image',
            fileInputId: 'svc-image-file',
            uploadPathPrefix: 'header',
            label: 'Topo',
            statusBtn
        });

        const image1Url = await resolveServiceFileField({
            previewId: 'svc-image-1-preview',
            urlInputId: 'svc-image-1',
            fileInputId: 'svc-image-1-file',
            uploadPathPrefix: 'sec1',
            label: 'Secção 1',
            statusBtn
        });

        const image2Url = await resolveServiceFileField({
            previewId: 'svc-image-2-preview',
            urlInputId: 'svc-image-2',
            fileInputId: 'svc-image-2-file',
            uploadPathPrefix: 'sec2',
            label: 'Secção 2',
            statusBtn
        });

        const editorialBgUrl = await resolveServiceFileField({
            previewId: 'svc-editorial-bg-preview',
            urlInputId: 'svc-editorial-bg-url',
            fileInputId: 'svc-editorial-bg-file',
            uploadPathPrefix: 'editorial',
            label: 'Secção 3',
            statusBtn
        });

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
            editorial_section: collectServiceEditorialForm(editorialBgUrl),
            customColors,
            testimonial_ids: selectedTestimonials,
            active: isActive,
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
    updateServiceEditToolbar('A editar serviço');
    setChecked('svc-active-toggle', data.active !== false);
    document.getElementById('svc-benefits').value = (data.benefits || []).join(', ');
    document.getElementById('svc-desc').value = data.description || '';

    document.getElementById('svc-image-file').value = '';
    const svcImageUrl = data.headerImage || '';
    document.getElementById('svc-image').value = svcImageUrl;
    window.renderFilePreview('svc-image-preview', svcImageUrl, { urlInputId: 'svc-image', fileInputId: 'svc-image-file' });
    if (svcImageUrl && svcImageUrl.includes('firebasestorage')) {
        document.getElementById('svc-image').placeholder = window.extractFilenameFromUrl(svcImageUrl);
    } else {
        document.getElementById('svc-image').placeholder = "URL...";
    }

    // Section 1
    document.getElementById('svc-sec1-title').value = data.section1_title || '';
    document.getElementById('svc-full-desc').value = data.long_description || '';
    document.getElementById('svc-image-1-file').value = '';
    const svcImage1Url = data.section1_image || '';
    document.getElementById('svc-image-1').value = svcImage1Url;
    window.renderFilePreview('svc-image-1-preview', svcImage1Url, { urlInputId: 'svc-image-1', fileInputId: 'svc-image-1-file' });
    if (svcImage1Url && svcImage1Url.includes('firebasestorage')) {
        document.getElementById('svc-image-1').placeholder = window.extractFilenameFromUrl(svcImage1Url);
    } else {
        document.getElementById('svc-image-1').placeholder = "URL Imagem";
    }

    // Section 2
    document.getElementById('svc-full-desc-2').value = data.long_description_2 || '';
    document.getElementById('svc-image-2-file').value = '';
    const svcImage2Url = data.section2_image || '';
    document.getElementById('svc-image-2').value = svcImage2Url;
    window.renderFilePreview('svc-image-2-preview', svcImage2Url, { urlInputId: 'svc-image-2', fileInputId: 'svc-image-2-file' });
    if (svcImage2Url && svcImage2Url.includes('firebasestorage')) {
        document.getElementById('svc-image-2').placeholder = window.extractFilenameFromUrl(svcImage2Url);
    } else {
        document.getElementById('svc-image-2').placeholder = "URL Imagem";
    }

    setServiceEditorialForm(data.editorial_section, id);

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
        btn.innerHTML = btn.id === 'svc-toolbar-save-btn'
            ? '<i data-lucide="save"></i> Guardar serviço completo'
            : '<i data-lucide="save"></i> Atualizar Serviço';
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

window.toggleServiceVisibility = async function (id) {
    const data = window.servicesCache[id];
    if (!data) return;
    const nextActive = data.active === false;
    const action = nextActive ? 'mostrar' : 'ocultar';
    if (!confirm(`Pretende ${action} este serviço na página inicial?\n\nA página individual SEO não será apagada.`)) return;
    try {
        await window.db.collection("services").doc(id).set({
            active: nextActive,
            updated_at: new Date()
        }, { merge: true });
        loadServices();
    } catch (error) {
        console.error(error);
        alert("Erro ao alterar visibilidade.");
    }
};

window.resetServiceForm = function () {
    const form = document.getElementById('service-form');
    if (form) form.reset();

    document.getElementById('svc-id').value = "";
    updateServiceEditToolbar('Novo serviço');
    setChecked('svc-active-toggle', true);

    // Reset file/image inputs explicitly
    ['svc-image', 'svc-image-file', 'svc-image-1', 'svc-image-1-file', 'svc-image-2', 'svc-image-2-file', 'svc-editorial-bg-url', 'svc-editorial-bg-file'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    setServiceEditorialForm(null, '');

    // Reset All Buttons to "Create" state
    const allSubmitBtns = document.querySelectorAll('#service-form button.cta-button.primary');
    allSubmitBtns.forEach(btn => {
        btn.innerHTML = btn.id === 'svc-toolbar-save-btn'
            ? '<i data-lucide="save"></i> Guardar serviço completo'
            : '<i data-lucide="plus-circle"></i> Criar Novo Serviço';
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
