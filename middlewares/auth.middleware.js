const { verifyToken } = require('../utils/jwt');

module.exports = (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.redirect('/login');
        }

        const decoded = verifyToken(token);
        req.user = decoded;

        next();
    } catch (err) {
        return res.redirect('/login');
    }
};