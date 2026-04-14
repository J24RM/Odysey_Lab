const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            rol: user.id_rol,
            cuenta: user.id_cuenta
        },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
    );
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
    generateToken,
    verifyToken
};