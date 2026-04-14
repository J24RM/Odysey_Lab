const requireRole = (rol) => {
    return (req, res, next) => {
        if (req.user.rol !== rol) {
            return res.status(403).send('No autorizado');
        }
        next();
    };
};

module.exports = { requireRole };