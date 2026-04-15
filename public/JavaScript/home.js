function mostrarInfo(mensaje) {
    const contenedor = document.getElementById('success-container');
    contenedor.textContent = mensaje;
    contenedor.classList.remove('hidden');
    setTimeout(() => contenedor.classList.add('hidden'), 4000);
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('info')) {
        mostrarInfo(decodeURIComponent(params.get('info')));
        window.history.replaceState({}, '', '/cliente/home');
    }
});