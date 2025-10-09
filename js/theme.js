(function () {
    const KEY = 'themeInverted';
    const saved = localStorage.getItem(KEY) === 'true';
    const html = document.documentElement;
    if (saved) html.classList.add('theme-inverted');

    const btn = document.getElementById('toggleThemeBtn');
    const updateLabel = () => {
        const inverted = html.classList.contains('theme-inverted');
        btn.textContent = inverted ? 'Dark Mode' : 'Light Mode';
        btn.setAttribute('aria-pressed', String(inverted));
    };

    if (btn) {
        updateLabel();
        btn.addEventListener('click', () => {
            html.classList.toggle('theme-inverted');
            localStorage.setItem(KEY, String(html.classList.contains('theme-inverted')));
            updateLabel();
        });
    }
})();