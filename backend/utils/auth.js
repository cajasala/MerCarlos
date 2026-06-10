const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.JWT_SECRET || 'fallback-secret';

const generateToken = (user) => {
    const payload = { id: user.id, role: user.role };
    if (user.negocioId !== undefined && user.negocioId !== null) {
        payload.negocioId = user.negocioId;
    }
    return jwt.sign(payload, secret, { expiresIn: '7d' });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, secret);
    } catch (err) {
        return null;
    }
};

// authenticate(req) → { id, role } | null
// Extrae y valida el JWT del header Authorization: Bearer <token>
const authenticate = (request) => {
    const authHeader = request.headers?.get('authorization');
    if (!authHeader) {
        const isDev = process.env.NODE_ENV === 'development' || process.env.AZURE_FUNCTIONS_ENVIRONMENT === 'Development';
        if (isDev) {
            return { id: 1, role: 'user' };
        }
        return null;
    }

    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

    const payload = verifyToken(token);
    if (!payload) return null;

    return { id: payload.id, role: payload.role };
};


module.exports = {
    generateToken,
    verifyToken,
    authenticate
};
