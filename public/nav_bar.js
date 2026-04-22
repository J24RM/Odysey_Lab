const title = document.getElementById("modalTitle");
const body  = document.getElementById("modalBody");
const loader = document.getElementById('page-loader');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}

async function postJson(url, data) {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'csrf-token': getCsrfToken()
        },
        body: JSON.stringify(data)
    });
    return res.json();
}

function actualizarNavbarSucursal(sucursal) {
    const display = document.getElementById('sucursal-display');
    if (!display) return;
    if (sucursal) {
        display.innerHTML = `<span class="font-semibold text-gray-800">${sucursal.nombre_sucursal}</span>`;
    } else {
        display.innerHTML = `<span class="text-gray-400 italic">Sin sucursal</span>`;
    }
}

// ─── Bloques de info ──────────────────────────────────────────────────────────

function renderCuentaInfo(cuenta) {
    if (!cuenta) {
        return `
        <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <span class="text-gray-400">RFC:</span>       <span class="text-gray-300 italic">—</span>
            <span class="text-gray-400">Región:</span>    <span class="text-gray-300 italic">—</span>
        </div>`;
    }
    return `
    <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <span class="text-gray-500 font-medium">RFC:</span>
        <span class="text-gray-800 font-semibold">${cuenta.rfc}</span>
        <span class="text-gray-500 font-medium">Región:</span>
        <span class="text-gray-800">${cuenta.region}</span>
    </div>`;
}

function renderSucursalInfo(sucursal) {
    if (!sucursal) {
        return `
        <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <span class="text-gray-400">Nombre:</span>      <span class="text-gray-300 italic">—</span>
            <span class="text-gray-400">Estado:</span>      <span class="text-gray-300 italic">—</span>
            <span class="text-gray-400">Delegación:</span>  <span class="text-gray-300 italic">—</span>
        </div>`;
    }
    return `
    <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <span class="text-gray-500 font-medium">Nombre:</span>
        <span class="text-gray-800 font-semibold">${sucursal.nombre_sucursal}</span>
        <span class="text-gray-500 font-medium">Estado:</span>
        <span class="text-gray-800">${sucursal.edo}</span>
        <span class="text-gray-500 font-medium">Delegación:</span>
        <span class="text-gray-800">${sucursal.deleg_municipio || '—'}</span>
    </div>`;
}

function renderSucursalSelector(cuenta_activa, sucursales, sucursal_activa) {
    if (!cuenta_activa) {
        return `
        <p class="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Primero selecciona una cuenta para ver las sucursales disponibles.
        </p>`;
    }
    if (!sucursales || sucursales.length === 0) return '';
    const opts = sucursales.map(s =>
        `<option value="${s.id_sucursal}" ${sucursal_activa && sucursal_activa.id_sucursal === s.id_sucursal ? 'selected' : ''}>${s.nombre_sucursal}</option>`
    ).join('');
    return `
    <div class="mt-4 mb-3">
        <label class="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Cambiar sucursal</label>
        <select id="selectSucursal" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0078A9] bg-white">
            <option value="">— Seleccionar sucursal —</option>
            ${opts}
        </select>
    </div>`;
}

// ─── Construcción del modal ───────────────────────────────────────────────────

function buildModalContent(data, opts = {}) {
    const { usuario, cuentas, cuenta_activa, sucursal_activa, sucursales, multiple_cuentas } = data;

    // Alerta si no hay sucursal activa (puede venir del carrito o por múltiples cuentas sin seleccionar)
    const alerta = (opts.forzado || (multiple_cuentas && !cuenta_activa)) ? `
    <div class="mb-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
        <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        Selecciona una cuenta y sucursal para poder realizar pedidos.
    </div>` : '';

    // Selector de cuenta (solo si hay más de una)
    let cuentaSelector = '';
    if (multiple_cuentas) {
        const cuentaOpts = cuentas.map(c =>
            `<option value="${c.id_cuenta}" ${cuenta_activa && cuenta_activa.id_cuenta === c.id_cuenta ? 'selected' : ''}>${c.nombre_dueno} — ${c.rfc}</option>`
        ).join('');
        cuentaSelector = `
        <div class="mt-4 mb-3">
            <label class="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Cambiar cuenta</label>
            <select id="selectCuenta" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0078A9] bg-white">
                <option value="">— Seleccionar cuenta —</option>
                ${cuentaOpts}
            </select>
        </div>`;
    }

    const nombreUsuario = usuario.Nombre_usuario || usuario.nombre_usuario || '—';

    const footer = opts.forzado
        ? `<div class="pt-4 flex justify-end">
               <button id="btnAceptarModal"
                       class="text-sm font-semibold text-white bg-[#0078A9] px-4 py-2 rounded-md hover:bg-[#005f87] transition-colors">
                   Aceptar
               </button>
           </div>`
        : `<div class="pt-4 flex justify-between items-center">
               <a href="/logout"
                  class="text-sm font-semibold text-red-500 border border-red-200 px-4 py-2 rounded-md hover:bg-red-50 transition-colors">
                   Cerrar sesión
               </a>
               <button id="btnAceptarModal"
                       class="text-sm font-semibold text-white bg-[#0078A9] px-4 py-2 rounded-md hover:bg-[#005f87] transition-colors">
                   Aceptar
               </button>
           </div>`;

    return `
    ${alerta}

    <!-- Datos del usuario -->
    <div class="flex items-center gap-4 pb-4 border-b border-gray-100">
        <img src="/img/iconoPerfil.png" alt="Perfil"
            class="w-14 h-14 rounded-full object-cover border-2 border-gray-200 flex-shrink-0">
        <div>
            <p class="font-bold text-base text-gray-800">${nombreUsuario}</p>
            <p class="text-sm text-gray-500">${usuario.email}</p>
        </div>
    </div>

    <!-- Cuenta -->
    <div class="py-4 border-b border-gray-100">
        <h3 class="text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-3">Cuenta</h3>
        <div id="cuentaInfo">${renderCuentaInfo(cuenta_activa)}</div>
        ${cuentaSelector}
    </div>

    <!-- Sucursal -->
    <div class="py-4 border-b border-gray-100">
        <h3 class="text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-3">Sucursal</h3>
        <div id="sucursalInfo">${renderSucursalInfo(sucursal_activa)}</div>
        <div id="sucursalSelectorContainer">${renderSucursalSelector(cuenta_activa, sucursales, sucursal_activa)}</div>
    </div>

    <!-- Footer -->
    ${footer}`;
}

// ─── Eventos del modal ────────────────────────────────────────────────────────

function attachModalEvents(opts = {}) {
    // Botón Aceptar (cierra el modal igual que la X)
    const btnAceptar = document.getElementById('btnAceptarModal');
    if (btnAceptar) {
        btnAceptar.addEventListener('click', () => {
            const modal = document.getElementById('modalSelector');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
    }

    // Cambio de cuenta
    const selectCuenta = document.getElementById('selectCuenta');
    if (selectCuenta) {
        selectCuenta.addEventListener('change', async (e) => {
            const id_cuenta = e.target.value;
            if (!id_cuenta) return;

            const result = await postJson('/cliente/profile/cuenta-activa', { id_cuenta });
            if (result.error) return;

            document.getElementById('cuentaInfo').innerHTML = renderCuentaInfo(result.cuenta_activa);

            // Actualizar selector y datos de sucursal
            document.getElementById('sucursalSelectorContainer').innerHTML =
                renderSucursalSelector(result.cuenta_activa, result.sucursales, result.sucursal_activa);
            document.getElementById('sucursalInfo').innerHTML =
                renderSucursalInfo(result.sucursal_activa);

            actualizarNavbarSucursal(result.sucursal_activa);

            // Actualizar la sucursal activa global (para validación del carrito)
            window._sucursalActivaId = result.sucursal_activa ? result.sucursal_activa.id_sucursal : null;

            attachSucursalEvent();
        });
    }

    attachSucursalEvent();
}

function attachSucursalEvent() {
    const selectSucursal = document.getElementById('selectSucursal');
    if (!selectSucursal) return;
    selectSucursal.addEventListener('change', async (e) => {
        const id_sucursal = e.target.value;
        if (!id_sucursal) return;

        const result = await postJson('/cliente/profile/sucursal-activa', { id_sucursal });
        if (result.error) return;

        document.getElementById('sucursalInfo').innerHTML =
            renderSucursalInfo(result.sucursal_activa);
        actualizarNavbarSucursal(result.sucursal_activa);

        // Actualizar la sucursal activa global (para validación del carrito)
        window._sucursalActivaId = result.sucursal_activa ? result.sucursal_activa.id_sucursal : null;
    });
}

// ─── Abrir modal de perfil ────────────────────────────────────────────────────

window.abrirModalPerfil = async function(opts = {}) {
    const modal = document.getElementById('modalSelector');
    title.textContent = opts.forzado ? "Selecciona tu sucursal" : "Mi Perfil";
    body.innerHTML = `
    <div class="flex justify-center items-center py-10">
        <div class="w-6 h-6 border-2 border-[#0078A9] border-t-transparent rounded-full animate-spin"></div>
    </div>`;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    try {
        const res = await fetch('/cliente/perfil-datos', {
            headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
        body.innerHTML = buildModalContent(data, opts);
        attachModalEvents(opts);
    } catch (err) {
        body.innerHTML = `<p class="text-red-500 text-sm text-center py-6">Error al cargar el perfil.</p>`;
    }
};

document.getElementById("btnPerfil").addEventListener("click", () => {
    window.abrirModalPerfil();
});

// ─── Lógica de apertura/cierre del modal ─────────────────────────────────────


document.addEventListener("DOMContentLoaded", () => {
    const modals = document.querySelectorAll('.tw-modal');

    document.querySelectorAll('[data-bs-toggle="modal"]').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSelector = trigger.getAttribute('data-bs-target');
            if (targetSelector) {
                const targetModal = document.querySelector(targetSelector);
                if (targetModal) {
                    targetModal.classList.remove('hidden');
                    targetModal.classList.add('flex');
                }
            }
        });
    });

    document.querySelectorAll('.btn-close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.tw-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
    });

    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
    });
});



// Actualiza el badge del carrito en la navbar
function actualizarCartBadge(count) {
    const carritoLink = document.querySelector('a[href="/cart"]');
    if (!carritoLink) return;

    let badge = carritoLink.querySelector('span');

    if (count <= 0) {
        if (badge) badge.remove();
        return;
    }

    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none';
        carritoLink.appendChild(badge);
    }

    badge.textContent = count > 99 ? '+99' : count;
}

function showLoader() {
    loader.style.opacity = '1';
    loader.style.pointerEvents = 'all';
  }

  function hideLoader() {
    loader.style.opacity = '0';
    loader.style.pointerEvents = 'none';
  }

  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (!link) return;
    if (
      link.target === '_blank' ||
      link.href.startsWith('javascript') ||
      link.href.includes('#') ||
      link.getAttribute('onclick')
    ) return;
    showLoader();
  });

  document.addEventListener('submit', function(e) {
    showLoader();
  });

  window.addEventListener('pageshow', hideLoader);
  window.addEventListener('load', hideLoader);
  