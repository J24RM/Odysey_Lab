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
