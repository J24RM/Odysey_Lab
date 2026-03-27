function actualizarSubtotal() {
  const filas = document.getElementsByClassName('product-row');
  let subtotal = 0;
  let totalQty = 0;

  for (let i = 0; i < filas.length; i++) {
    const precio = parseFloat(filas[i].dataset.precio);
    const qty = parseInt(document.getElementById('qty-' + filas[i].dataset.id).textContent);
    subtotal += precio * qty;
    totalQty += qty;
  }

  document.getElementById('subtotal-display').textContent = '$ ' + subtotal.toLocaleString('es-MX');
  document.getElementById('qty-display').textContent = 'Cantidad de productos: ' + totalQty;
}

async function cambiarCantidad(idProducto, delta) {
  const qtySpan = document.getElementById('qty-' + idProducto);
  const nuevaCantidad = parseInt(qtySpan.textContent) + delta;

  const res = await fetch('/cart/items/' + idProducto, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cantidad_ingresada: nuevaCantidad })
  });

  const data = await res.json();

  if (!res.ok) {
        mostrarError('No se pudo actualizar el producto ');
        return;
    }

  if (data.eliminado) {
    const nombre = document.getElementById('nombre-' + idProducto).textContent;
    mostrarEliminado(nombre, idProducto);
    document.getElementById('row-' + idProducto).remove();
  } else {
    const precio = parseFloat(document.getElementById('row-' + idProducto).dataset.precio);
    qtySpan.textContent = data.nuevaCantidad;
    document.getElementById('price-' + idProducto).textContent = '$ ' + (precio * data.nuevaCantidad).toLocaleString('es-MX');
  }

  actualizarSubtotal();
}

async function eliminarProducto(idProducto) {
  const res = await fetch('/cart/items/' + idProducto, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cantidad_ingresada: 0 })
  });

  const data = await res.json();

  if (!res.ok) {
            mostrarError('No se pudo eliminar el producto');
            return;
  }

  if (data.eliminado) {
  const nombre = document.getElementById('nombre-' + idProducto).textContent;
  mostrarEliminado(nombre, idProducto);
  actualizarSubtotal();
}
}

function mostrarEliminado(nombre, idProducto) {
  const aviso = document.createElement('div');
  aviso.id = 'aviso-' + idProducto;
  aviso.className = 'text-sm text-gray-600 py-3 px-4 bg-white rounded-xl border border-gray-200 mb-2';
  aviso.innerHTML = `<a href='/producto/${idProducto}' class='text-blue-500 underline'> ${nombre}</a>  fue eliminado del carrito.`;

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
        mostrarError('No se pudo agregar el producto:');
        window.history.replaceState({}, '', '/cart');
    }
});

