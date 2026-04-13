
const title = document.getElementById("modalTitle")
const body = document.getElementById("modalBody")

// Informacion de la Card de Sucursal
document.getElementById("btnSucursal").addEventListener("click", () => {

    title.textContent = "Seleccionar Sucursal"

    body.innerHTML = `
    <div class="bg-white border rounded shadow-sm p-3 mb-3 hover:bg-gray-50 cursor-pointer transition-colors text-gray-800">Sucursal Querétaro</div>
    <div class="bg-white border rounded shadow-sm p-3 mb-3 hover:bg-gray-50 cursor-pointer transition-colors text-gray-800">Sucursal Monterrey</div>
    <div class="bg-white border rounded shadow-sm p-3 mb-3 hover:bg-gray-50 cursor-pointer transition-colors text-gray-800">Sucursal Guadalajara</div>
    `
})


// Informacion del Perfil
document.getElementById("btnPerfil").addEventListener("click", () => {

    title.textContent = "PERFIL"

    const perfil = window.perfilUsuario || { nombre: 'Jose Nava', email: 'joseNava@gmail.com', telefono: '442 891 2133' };

    body.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 24px; padding: 8px 0;">
        <!-- Avatar y nombre -->
        <div style="display: flex; flex-direction: column; align-items: center; min-width: 100px;">
            <img src="/img/iconoPerfil.png" alt="Perfil"
                 style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #ddd; margin-bottom: 8px;">
            <span style="font-weight: 600; font-size: 14px; text-align: center;">${perfil.nombre}</span>
        </div>

        <!-- Info de contacto -->
        <div style="flex: 1;">
            <p style="font-weight: 600; margin-bottom: 10px; font-size: 15px;">Información de contacto:</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                    <td style="border: 1px solid #dee2e6; padding: 8px 12px; font-weight: 600;">Número telefónico:</td>
                    <td style="border: 1px solid #dee2e6; padding: 8px 12px; text-align: right;">${perfil.telefono}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #dee2e6; padding: 8px 12px; font-weight: 600;">Correo electrónico:</td>
                    <td style="border: 1px solid #dee2e6; padding: 8px 12px; text-align: right;">${perfil.email}</td>
                </tr>
            </table>

            <!-- Sucursal y Cerrar sesión -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 16px; gap: 12px;">
                <select style="padding: 8px 14px; border: 1px solid #dee2e6; border-radius: 6px; font-size: 14px; background: #fff; cursor: pointer;">
                    <option>Sucursal: Jurica</option>
                    <option>Sucursal: Centro</option>
                    <option>Sucursal: Norte</option>
                </select>

                <a href="/logout" class="border border-gray-800 text-gray-800 hover:bg-gray-100 transition-colors" style="font-weight: 600; padding: 8px 20px; border-radius: 6px; text-decoration: none;">
                    Cerrar sesión
                </a>
            </div>
        </div>
    </div>
    `
})

// Modal toggling logic for Tailwind CSS custom modals
document.addEventListener("DOMContentLoaded", () => {
    const modals = document.querySelectorAll('.tw-modal');

    // Open modals
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

    // Close modals
    document.querySelectorAll('.btn-close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.tw-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
    });

    // Close when clicking outside of modal content
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
    });
})

