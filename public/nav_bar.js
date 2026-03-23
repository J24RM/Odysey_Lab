
const title = document.getElementById("modalTitle")
const body = document.getElementById("modalBody")

// Informacion de la Card de Sucursal
document.getElementById("btnSucursal").addEventListener("click", () => {

    title.textContent = "Seleccionar Sucursal"

    body.innerHTML = `
    <div class="card p-2 mb-2">Sucursal Querétaro</div>
    <div class="card p-2 mb-2">Sucursal Monterrey</div>
    <div class="card p-2 mb-2">Sucursal Guadalajara</div>
    `
})


// Informacion del Perfil
document.getElementById("btnPerfil").addEventListener("click", () => {

    title.textContent = "PERFIL"

    body.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 24px; padding: 8px 0;">
        <!-- Avatar y nombre -->
        <div style="display: flex; flex-direction: column; align-items: center; min-width: 100px;">
            <img src="/img/iconoPerfil.png" alt="Perfil"
                 style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #ddd; margin-bottom: 8px;">
            <span style="font-weight: 600; font-size: 14px; text-align: center;">Jose Nava</span>
        </div>

        <!-- Info de contacto -->
        <div style="flex: 1;">
            <p style="font-weight: 600; margin-bottom: 10px; font-size: 15px;">Información de contacto:</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                    <td style="border: 1px solid #dee2e6; padding: 8px 12px; font-weight: 600;">Número telefónico:</td>
                    <td style="border: 1px solid #dee2e6; padding: 8px 12px; text-align: right;">442 891 2133</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #dee2e6; padding: 8px 12px; font-weight: 600;">Correo electrónico:</td>
                    <td style="border: 1px solid #dee2e6; padding: 8px 12px; text-align: right;">joseNava@gmail.com</td>
                </tr>
            </table>

            <!-- Sucursal y Cerrar sesión -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 16px; gap: 12px;">
                <select style="padding: 8px 14px; border: 1px solid #dee2e6; border-radius: 6px; font-size: 14px; background: #fff; cursor: pointer;">
                    <option>Sucursal: Jurica</option>
                    <option>Sucursal: Centro</option>
                    <option>Sucursal: Norte</option>
                </select>

                <a href="/logout" class="btn btn-outline-dark" style="font-weight: 600; padding: 8px 20px; border-radius: 6px;">
                    Cerrar sesión
                </a>
            </div>
        </div>
    </div>
    `
})

