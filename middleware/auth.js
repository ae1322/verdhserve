const jwt = require('jsonwebtoken');
const SECRET = 'verdaserve_secret_key_2024';

function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: 'No token provided' });
    const token = header.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = { authMiddleware, SECRET };
