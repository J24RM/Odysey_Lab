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

// Búsqueda en tiempo real
(function () {
    const searchInput = document.getElementById('clienteSearchInput');
    const productGrid = document.querySelector('.product-grid');
    if (!searchInput || !productGrid) return;

    let debounceTimer;
    let originalHTML = null;

    function buildCard(p, idx) {
        const src = p.url_imagen ? `/uploads/${p.url_imagen}` : '/img/botePintura.png';
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            const op = i <= Math.round(p.promedio || 0) ? '1' : '0.2';
            stars += `<img src="/img/estrellita.png" alt="estrella" style="width:18px;height:18px;display:inline-block;opacity:${op}"/>`;
        }
        return `
        <div class="product-card">
            <a href="/cliente/product/${p.id_producto}" class="product-link">
                <div class="product-img-wrap">
                    <img src="${src}" alt="${p.nombre}" onerror="this.src='/img/botePintura.png'">
                </div>
                <div class="product-name">${p.nombre}</div>
                <div class="product-rating">${stars}</div>
                <div class="product-price">$ ${p.precio_unitario}</div>
            </a>
            <hr class="border-gray-300 mb-0"/>
            <div class="flex items-center justify-start gap-2 mt-4">
                <label class="text-xs font-semibold text-gray-700">Cantidad:</label>
                <div class="flex items-center border border-gray-400 rounded bg-white overflow-hidden">
                    <button type="button" onclick="changeCantidad('s${idx}',-1)" class="px-2 py-1 text-gray-600 hover:bg-gray-100 text-sm leading-none select-none">&#8722;</button>
                    <input id="cantidad-visible-s${idx}" type="text" value="1" inputmode="numeric" pattern="[0-9]*" maxlength="3"
                        oninput="this.value=this.value.replace(/[^0-9]/g,'');document.getElementById('cantidad-input-s${idx}').value=this.value||1;"
                        onblur="if(!this.value||this.value<1){this.value=1;document.getElementById('cantidad-input-s${idx}').value=1;}else{document.getElementById('cantidad-input-s${idx}').value=this.value;}"
                        class="w-10 text-xs font-semibold text-gray-700 outline-none text-center border-x border-gray-400 py-1"/>
                    <button type="button" onclick="changeCantidad('s${idx}',1)" class="px-2 py-1 text-gray-600 hover:bg-gray-100 text-sm leading-none select-none">&#43;</button>
                </div>
            </div>
            <form action="/cart/items" method="POST" class="mt-4">
                <input type="hidden" name="_csrf" value="${window._csrfToken}">
                <input type="hidden" name="cantidad_ingresada" id="cantidad-input-s${idx}" value="1">
                <input type="hidden" name="page" value="1">
                <input type="hidden" name="search" value="">
                <input type="hidden" name="id_producto" value="${p.id_producto}">
                <button type="submit" class="btn-add-cart">Agregar al carrito</button>
            </form>
        </div>`;
    }

    searchInput.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        const query = searchInput.value.trim();

        if (!query) {
            if (originalHTML !== null) {
                productGrid.innerHTML = originalHTML;
                originalHTML = null;
            }
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const res = await fetch(`/cliente/api/productos?q=${encodeURIComponent(query)}`);
                const productos = await res.json();

                if (originalHTML === null) originalHTML = productGrid.innerHTML;

                if (productos.length === 0) {
                    productGrid.innerHTML = '<div class="col-span-full py-10 text-center text-gray-500">No se encontraron productos.</div>';
                    return;
                }
                productGrid.innerHTML = productos.map((p, i) => buildCard(p, i)).join('');
            } catch {
                productGrid.innerHTML = '<div class="col-span-full py-10 text-center text-red-500">Error al buscar productos.</div>';
            }
        }, 300);
    });
})();

function changeCantidad(index, delta) {
    const visible = document.getElementById('cantidad-visible-' + index);
    const hidden = document.getElementById('cantidad-input-' + index);
    let val = parseInt(visible.value) || 1;
    val = Math.max(1, val + delta);
    visible.value = val;
    hidden.value = val;
}

function mostrarInfo(mensaje) {
    const contenedor = document.getElementById('success-container');
    contenedor.textContent = mensaje;
    contenedor.classList.remove('hidden');
    setTimeout(() => contenedor.classList.add('hidden'), 4000);
}
