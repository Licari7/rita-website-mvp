(function () {
    try {
        const theme = localStorage.getItem('site_theme');
        if (theme) {
            const colors = JSON.parse(theme);
            const root = document.documentElement;
            if (colors.bg_color) root.style.setProperty('--color-bg', colors.bg_color);
            if (colors.text_color) root.style.setProperty('--color-text-main', colors.text_color);
            if (colors.primary_color) root.style.setProperty('--color-primary', colors.primary_color);
            if (colors.header_bg) root.style.setProperty('--nav-bg', colors.header_bg);
            if (colors.secondary_beige) root.style.setProperty('--color-secondary-beige', colors.secondary_beige);
            if (colors.secondary_blue) root.style.setProperty('--color-secondary-blue', colors.secondary_blue);
        }

        const header = localStorage.getItem('site_header');
        if (header) {
            const h = JSON.parse(header);
            const root = document.documentElement;
            if (h.bg_color) root.style.setProperty('--nav-bg', h.bg_color);
            if (h.text_color) root.style.setProperty('--nav-text', h.text_color);
            if (h.font_size) root.style.setProperty('--nav-font-size', h.font_size + 'px');
            if (h.padding) root.style.setProperty('--nav-padding', h.padding + 'px');
        }

        // Footer is handled by main.js
    } catch (e) {
        console.error("Error loading theme:", e);
    }
})();
