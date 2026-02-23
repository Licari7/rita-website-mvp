class DashboardCarousel {
    constructor(config) {
        this.containerId = config.containerId;
        this.prevBtnId = config.prevBtnId;
        this.nextBtnId = config.nextBtnId;
        this.collectionName = config.collectionName || 'meditations';
        this.autoScrollDelay = config.autoScrollDelay || 3000;

        // New: Loop Control (Default true for backward compatibility)
        this.enableLoop = (config.enableLoop !== undefined) ? config.enableLoop : true;

        // New: Allow custom renderer and pre-loaded data
        this.renderCard = config.renderCard || null;
        this.data = config.data || null;

        this.carousel = document.getElementById(this.containerId);
        this.prevBtn = document.getElementById(this.prevBtnId);
        this.nextBtn = document.getElementById(this.nextBtnId);

        // State
        this.autoScrollInterval = null;
        this.isDown = false;
        this.startX = 0;
        this.scrollLeftDrag = 0;
        this.isDragging = false;
        this.dataLoaded = false;
        this.clonesSetup = false;

        if (!this.carousel) {
            console.warn(`DashboardCarousel: Container #${this.containerId} not found.`);
            return;
        }

        this.init();
    }

    async init() {
        await this.loadData();
        if (this.dataLoaded) {
            this.setupNavigation();
            this.setupDrag();
            if (this.enableLoop) {
                this.setupClones();
                this.startAutoScroll();
                // Setup teleport scroll listener
                this.carousel.addEventListener('scroll', () => this.handleTeleport());
            } else {
                // If loop disabled, we might still want auto-scroll? 
                // Usually "pause" implies no auto-scroll either if it fits.
                // Let's assume enableLoop also controls auto-scroll for now, or check content width.
            }
        }
    }

    // --- 1. Data Loading ---
    async loadData() {
        // Mode A: Pre-loaded Data
        if (this.data && Array.isArray(this.data) && this.data.length > 0) {
            this.renderItems(this.data);
            return;
        }

        // Mode B: Fetch from DB (Legacy/Dashboard)
        // Wait for global DB access
        let retries = 0;
        while (!window.db && retries < 15) {
            await new Promise(r => setTimeout(r, 200));
            retries++;
        }
        if (!window.db) return;

        try {
            const snapshot = await window.db.collection(this.collectionName).orderBy('created_at', 'desc').get();
            if (snapshot.empty) {
                this.carousel.innerHTML = '<p class="text-center p-20 text-muted">Sem conteúdos disponíveis.</p>';
                return;
            }

            const items = [];
            snapshot.forEach(doc => {
                items.push({ id: doc.id, ...doc.data() });
            });

            this.renderItems(items);

        } catch (e) {
            console.error(`Error loading ${this.collectionName}:`, e);
            this.carousel.innerHTML = '<p class="text-center p-20 text-red">Erro ao carregar.</p>';
        }
    }

    renderItems(items) {
        let html = '';
        items.forEach(item => {
            if (this.renderCard) {
                html += this.renderCard(item);
            } else {
                html += this.createCardHTML(item.id, item);
            }
        });

        this.carousel.innerHTML = html;
        if (window.lucide) lucide.createIcons();

        // Prevent link clicks on drag
        this.carousel.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                if (this.isDragging) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, true);
        });

        this.dataLoaded = true;
    }

    createCardHTML(id, data) {
        const title = data.card_title || data.title;
        const text = data.card_text || (data.description ? data.description.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...' : '');

        // Style
        let bgStyle;
        if (data.card_bg_type === 'color') {
            bgStyle = `background-color: ${data.card_bg_color || '#80864f'};`;
        } else {
            const img = data.image_url || 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=400&q=80';
            bgStyle = `background-image: url('${img}'); background-size: cover; background-position: center;`;
        }

        let opVal = (data.card_opacity !== undefined && data.card_opacity !== null && data.card_opacity !== "") ? data.card_opacity : 0.3;
        if (typeof opVal === 'string') opVal = opVal.replace(',', '.');
        const overlayStyle = `background-color: rgba(0,0,0, ${opVal}); position: absolute; top:0; left:0; width:100%; height:100%; z-index:1; border-radius: 12px 12px 0 0;`;

        // Icon
        let iconName = 'headphones';
        if (data.type === 'video') iconName = 'video';
        if (data.theme === 'enraizamento') iconName = 'anchor';
        if (data.theme === 'limpeza') iconName = 'droplets';
        if (data.theme === 'protecao') iconName = 'shield';
        if (data.theme === 'intuicao') iconName = 'eye';
        if (data.theme === 'chakras') iconName = 'aperture';

        // We link to theme?id=... logic
        return `
    <a href="theme?id=${id}" class="carousel-card" draggable="false" style="text-decoration: none;">
        <div class="carousel-image relative" style="${bgStyle}">
            <div style="${overlayStyle}"></div>
            <i data-lucide="${iconName}" size="32" color="#ffffff" style="position:relative; z-index:2;"></i>
        </div>
        <div class="carousel-content">
            <h3>${title}</h3>
            <p>${text}</p>
        </div>
    </a>`;
    }

    // --- 2. Navigation ---
    getCardWidth() {
        const card = this.carousel.querySelector('.carousel-card');
        // Default to 330 if not found or not rendered (width 0)
        return (card && card.offsetWidth > 0) ? card.offsetWidth + 30 : 330;
    }

    moveNext() {
        this.carousel.scrollBy({ left: this.getCardWidth(), behavior: 'smooth' });
        this.resetAutoScroll();
    }

    movePrev() {
        this.carousel.scrollBy({ left: -this.getCardWidth(), behavior: 'smooth' });
        this.resetAutoScroll();
    }

    setupNavigation() {
        if (this.prevBtn) this.prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.movePrev();
        });
        if (this.nextBtn) this.nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.moveNext();
        });
    }

    // --- 3. Drag Logic ---
    setupDrag() {
        const start = (e) => {
            this.isDown = true;
            this.isDragging = false;
            this.carousel.classList.add('active');
            this.startX = (e.pageX || e.touches[0].pageX) - this.carousel.offsetLeft;
            this.scrollLeftDrag = this.carousel.scrollLeft;
            clearInterval(this.autoScrollInterval);
            this.carousel.style.cursor = 'grabbing';
            this.carousel.style.scrollSnapType = 'none';
        };

        const end = () => {
            if (!this.isDown) return;
            this.isDown = false;
            this.carousel.classList.remove('active');
            this.carousel.style.cursor = 'grab';
            this.carousel.style.scrollSnapType = 'x mandatory';
            // Delay reset dragging flag
            setTimeout(() => { this.isDragging = false; }, 50);
            if (this.enableLoop) this.startAutoScroll();
        };

        const move = (e) => {
            if (!this.isDown) return;
            const pageX = (e.pageX || e.touches[0].pageX);
            const x = pageX - this.carousel.offsetLeft;
            const walk = (x - this.startX) * 2; // Speed multiplier

            if (Math.abs(walk) > 5) this.isDragging = true;
            if (this.isDragging) e.preventDefault();

            this.carousel.scrollLeft = this.scrollLeftDrag - walk;
        };

        // Mouse
        this.carousel.addEventListener('mousedown', start);
        this.carousel.addEventListener('mouseleave', end);
        this.carousel.addEventListener('mouseup', end);
        this.carousel.addEventListener('mousemove', move);
        // Note: Touch events removed to allow native mobile scrolling (overflow-x: auto)
    }

    // --- 4. Auto Scroll ---
    startAutoScroll() {
        if (!this.enableLoop) return;
        clearInterval(this.autoScrollInterval);
        this.autoScrollInterval = setInterval(() => {
            if (this.isDown || document.hidden) return;
            const width = this.getCardWidth();
            if (width < 50) return;
            this.carousel.scrollBy({ left: width, behavior: 'smooth' });
        }, this.autoScrollDelay);
    }

    resetAutoScroll() {
        if (!this.enableLoop) return;
        clearInterval(this.autoScrollInterval);
        this.startAutoScroll();
    }

    // --- 5. Infinite Loop (Clones) ---
    setupClones() {
        if (!this.enableLoop) return;
        if (this.clonesSetup) return; // Prevent double setup
        // Only if we have multiple items
        if (this.carousel.querySelectorAll('.carousel-card:not(.clone)').length < 2) return;

        const originalCards = Array.from(this.carousel.querySelectorAll('.carousel-card:not(.clone)'));
        if (originalCards.length === 0) return;

        // Append Clones
        originalCards.forEach(card => {
            const clone = card.cloneNode(true);
            clone.classList.add('clone');
            clone.setAttribute('aria-hidden', 'true');
            this.carousel.appendChild(clone);
        });

        // Prepend Clones (Reversed)
        [...originalCards].reverse().forEach(card => {
            const clone = card.cloneNode(true);
            clone.classList.add('clone');
            clone.setAttribute('aria-hidden', 'true');
            this.carousel.insertBefore(clone, this.carousel.firstChild);
        });

        // Center Scroll
        requestAnimationFrame(() => {
            const cardWidth = this.getCardWidth();
            const startScroll = cardWidth * originalCards.length;
            this.carousel.scrollLeft = startScroll;
        });

        this.clonesSetup = true;
    }

    handleTeleport() {
        if (!this.enableLoop) return;
        if (this.isDown) return;
        const scrollLeft = this.carousel.scrollLeft;
        const scrollWidth = this.carousel.scrollWidth;
        const setWidth = scrollWidth / 3; // roughly one set

        // Thresholds
        if (scrollLeft <= 50) {
            this.carousel.style.scrollBehavior = 'auto';
            this.carousel.scrollLeft = setWidth + scrollLeft;
            requestAnimationFrame(() => this.carousel.style.scrollBehavior = '');
        } else if (scrollLeft >= (scrollWidth - this.carousel.clientWidth - 50)) {
            this.carousel.style.scrollBehavior = 'auto';
            this.carousel.scrollLeft = scrollLeft - setWidth;
            requestAnimationFrame(() => this.carousel.style.scrollBehavior = '');
        }
    }
}
window.DashboardCarousel = DashboardCarousel;
