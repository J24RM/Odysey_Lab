let csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

function actualizarSubtotal() {
  const filas = document.getElementsByClassName('product-row');
  let subtotal = 0;
  let totalQty = 0;
  let totalPeso = 0;

  for (let i = 0; i < filas.length; i++) {
    const precio = parseFloat(filas[i].dataset.precio);
    const input = document.getElementById('qty-' + filas[i].dataset.id);
    const qty = parseInt(input.value) || 0;
    const peso = parseFloat(input.dataset.peso) || 0;

    subtotal += precio * qty;
    totalQty += qty;
    totalPeso += peso;
  }

  document.getElementById('subtotal-display').textContent =
    '$ ' + subtotal.toLocaleString('es-MX');

  let total = subtotal * 1.16;

  document.getElementById('total-display').textContent =
    '$ ' + total.toLocaleString('es-MX');

  document.getElementById('qty-display').textContent =
    'Cantidad de productos: ' + totalQty;

  document.getElementById('peso-display').textContent =
    'Peso Total: ' + totalPeso.toFixed(2) + " Kg";
}


const _actualizando = new Set();

// Botón
async function cambiarCantidad(idProducto, delta) {
    if (_actualizando.has(idProducto)) return;

    const input    = document.getElementById('qty-' + idProducto);
    const btnMenos = input.previousElementSibling;
    const btnMas   = input.nextElementSibling;

    let cantidadActual = parseInt(input.value) || 1;
    const nuevaCantidad = cantidadActual + delta;
    if (nuevaCantidad < 1) return;

    _actualizando.add(idProducto);
    btnMenos.disabled = btnMas.disabled = input.disabled = true;
    btnMenos.classList.add('opacity-30', 'cursor-not-allowed');
    btnMas.classList.add('opacity-30', 'cursor-not-allowed');

    try {
        await enviarCantidad(idProducto, nuevaCantidad);
    } finally {
        btnMenos.disabled = btnMas.disabled = input.disabled = false;
        btnMenos.classList.remove('opacity-30', 'cursor-not-allowed');
        btnMas.classList.remove('opacity-30', 'cursor-not-allowed');
        _actualizando.delete(idProducto);
    }
}

// Input texto
async function inputCantidad(idProducto) {
    if (_actualizando.has(idProducto)) return;

    const input = document.getElementById('qty-' + idProducto);
    let cantidad = parseInt(input.value);
    if (!cantidad || cantidad < 1) cantidad = 1;
    input.value = cantidad;

    _actualizando.add(idProducto);
    try {
        await enviarCantidad(idProducto, cantidad);
    } finally {
        _actualizando.delete(idProducto);
    }
}

async function enviarCantidad(idProducto, cantidad) {
  const input = document.getElementById('qty-' + idProducto);

  // Mostrar spinner y ocultar input
  input.classList.add('hidden');
  const spinner = document.createElement('div');
  spinner.id = 'spinner-' + idProducto;
  spinner.className = 'w-10 h-5 flex items-center justify-center';
  spinner.innerHTML = `
    <svg class="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
    </svg>`;
  input.insertAdjacentElement('afterend', spinner);

  const res = await fetch('/cart/items/' + idProducto, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'csrf-token': csrfToken
    },
    body: JSON.stringify({ cantidad_ingresada: cantidad }),
  });

  const data = await res.json();

  // Quitar spinner y mostrar input de nuevo
  const spinnerEl = document.getElementById('spinner-' + idProducto);
  if (spinnerEl) spinnerEl.remove();
  input.classList.remove('hidden');

  if (data.csrfToken) csrfToken = data.csrfToken;

  if (data.cartCount !== undefined) {
    actualizarCartBadge(data.cartCount);
  }

  if (!res.ok) {
    mostrarError('No se pudo actualizar el producto');
    return;
  }

  if (data.eliminado) {
    const nombre = document.getElementById('nombre-' + idProducto).textContent;
    mostrarEliminado(nombre, idProducto);
    document.getElementById('row-' + idProducto).remove();
  } else {
    const precio = parseFloat(document.getElementById('row-' + idProducto).dataset.precio);

    input.value = data.nuevaCantidad;

    document.getElementById('price-' + idProducto).textContent =
      '$ ' + (precio * data.nuevaCantidad).toLocaleString('es-MX');
  }

  actualizarSubtotal();
}

async function eliminarProducto(idProducto) {
  const res = await fetch('/cart/items/' + idProducto, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'csrf-token': csrfToken
      },
    body: JSON.stringify({ cantidad_ingresada: 0 }),
  });

  const data = await res.json();

  if (data.csrfToken) csrfToken = data.csrfToken;

  if (!res.ok) {
    mostrarError('No se pudo eliminar el producto');
    return;
  }

  if (data.eliminado) {
    const nombre = document.getElementById('nombre-' + idProducto).textContent;
    mostrarEliminado(nombre, idProducto);
    actualizarSubtotal();

    if (data.cartCount !== undefined) {
        actualizarCartBadge(data.cartCount);
    }
  }
}


function mostrarEliminado(nombre, idProducto) {
  const aviso = document.createElement('div');
  aviso.id = 'aviso-' + idProducto;
  aviso.className = 'text-sm text-gray-600 py-3 px-4 bg-white rounded-xl border border-gray-200 mb-2';
  aviso.innerHTML = `<a href='cliente/product/${idProducto}' class='text-blue-500 underline'> ${nombre}</a>  fue eliminado del carrito.`;

  document.getElementById('row-' + idProducto).replaceWith(aviso);
}

// Error
function mostrarError(mensaje) {
    const contenedor = document.getElementById('error-container');
    contenedor.textContent = mensaje;
    contenedor.classList.remove('hidden');
    setTimeout(() => contenedor.classList.add('hidden'), 4000);
}

document.addEventListener('DOMContentLoaded', () => {
    actualizarSubtotal();
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
        mostrarError(decodeURIComponent(params.get('error')));
        window.history.replaceState({}, '', '/cart');
    }
});

// ── Selección masiva ──────────────────────────────────────────

function actualizarBulkActions() {
  const checkboxes = document.querySelectorAll('.product-checkbox');
  const seleccionados = document.querySelectorAll('.product-checkbox:checked');
  const bulkActions = document.getElementById('bulk-actions');
  const selectedCount = document.getElementById('selected-count');

  if (seleccionados.length > 0) {
    bulkActions.classList.remove('hidden');
    bulkActions.classList.add('flex');
    selectedCount.textContent = seleccionados.length + ' seleccionado' + (seleccionados.length > 1 ? 's' : '');
  } else {
    bulkActions.classList.add('hidden');
    bulkActions.classList.remove('flex');
  }
}

async function eliminarSeleccionados() {
  const seleccionados = document.querySelectorAll('.product-checkbox:checked');
  if (seleccionados.length === 0) return;

  const ids = Array.from(seleccionados).map(cb => cb.dataset.id);

  // Deshabilitar botón mientras se procesa
  const btn = document.querySelector('#bulk-actions button');
  btn.disabled = true;
  btn.textContent = 'Eliminando...';

  // Eliminar en paralelo
  const promesas = ids.map(idProducto =>
    fetch('/cart/items/' + idProducto, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'csrf-token': csrfToken
      },
      body: JSON.stringify({ cantidad_ingresada: 0 }),
    }).then(res => res.json().then(data => ({ res, data, idProducto })))
  );

  const resultados = await Promise.all(promesas);

  resultados.forEach(({ res, data, idProducto }) => {
    if (data.csrfToken) csrfToken = data.csrfToken;

    if (!res.ok) {
      mostrarError('No se pudo eliminar el producto ' + idProducto);
      return;
    }

    if (data.eliminado) {
      const nombreEl = document.getElementById('nombre-' + idProducto);
      const nombre = nombreEl ? nombreEl.textContent : 'Producto';
      mostrarEliminado(nombre, idProducto);
    }
  });

  actualizarSubtotal();
  actualizarBulkActions();

  // Actualizar badge del carrito con el último valor recibido
  const ultimo = resultados[resultados.length - 1];
  if (ultimo?.data?.cartCount !== undefined) {
    actualizarCartBadge(ultimo.data.cartCount);
  }
}