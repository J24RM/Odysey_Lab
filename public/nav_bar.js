
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

// Informacion de la Card de Cuenta
document.getElementById("btnCuenta").addEventListener("click", () => {

    title.textContent = "Seleccionar Cuenta"

    body.innerHTML = `
    <div class="card p-2 mb-2">Cuenta Empresarial</div>
    <div class="card p-2 mb-2">Cuenta Distribuidor</div>
    `
})

