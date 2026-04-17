const supabase = require('../utils/supabase');

module.exports = class Cuenta {

    static async obtenerCuentasPorUsuario(id_usuario) {
        const { data, error } = await supabase
            .from('usuario_cuenta')
            .select('cuenta(id_cuenta, nombre_dueno, rfc, region, direccion, telefono)')
            .eq('id_usuario', id_usuario);

        if (error) throw error;
        return data.map(row => row.cuenta);
    }

    static async obtenerSucursalesPorCuenta(id_cuenta) {
        const { data, error } = await supabase
            .from('sucursal_cuenta')
            .select('sucursal(id_sucursal, nombre_sucursal, edo, deleg_municipio, num_colonia)')
            .eq('id_cuenta', id_cuenta);

        if (error) throw error;
        return data.map(row => row.sucursal);
    }
};
