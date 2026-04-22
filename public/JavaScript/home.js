// Countdown preventa
(function () {
    const target = new Date('2026-06-11T00:00:00');
    const pad = n => String(n).padStart(2, '0');
    function tick() {
        const diff = target - new Date();
        if (diff <= 0) {
            ['cd-dias','cd-hrs','cd-min','cd-seg'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = '00';
            });
            return;
        }
        const d = document.getElementById('cd-dias');
        const h = document.getElementById('cd-hrs');
        const m = document.getElementById('cd-min');
        const s = document.getElementById('cd-seg');
        if (d) d.textContent = pad(Math.floor(diff / 86400000));
        if (h) h.textContent = pad(Math.floor((diff % 86400000) / 3600000));
        if (m) m.textContent = pad(Math.floor((diff % 3600000) / 60000));
        if (s) s.textContent = pad(Math.floor((diff % 60000) / 1000));
    }
    tick();
    setInterval(tick, 1000);
})();

const scrollY = sessionStorage.getItem('cartScrollY');
if (scrollY !== null) {
    document.documentElement.style.scrollBehavior = 'auto';
    document.documentElement.style.visibility = 'hidden';
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('info')) {
        mostrarInfo(decodeURIComponent(params.get('info')));
        window.history.replaceState({}, '', '/cliente/home');
        
    }

document.querySelectorAll('form[action="/cart/items"]').forEach(form => {
        form.addEventListener('submit', () => {
            sessionStorage.setItem('cartScrollY', window.scrollY);
            const params = new URLSearchParams(window.location.search);
            sessionStorage.setItem('cartPage', params.get('page') || '1');
            sessionStorage.setItem('cartSearch', params.get('search') || ''); 
        });
    });
});

if (scrollY !== null) {
    window.addEventListener('load', () => {
        window.scrollTo({ top: parseInt(scrollY), behavior: 'instant' });
        sessionStorage.removeItem('cartScrollY');

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.documentElement.style.visibility = 'visible';
            });
        });
    });
}

function mostrarInfo(mensaje) {
    const contenedor = document.getElementById('success-container');
    contenedor.textContent = mensaje;
    contenedor.classList.remove('hidden');
    setTimeout(() => contenedor.classList.add('hidden'), 4000);
}
