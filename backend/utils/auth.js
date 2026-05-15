const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.JWT_SECRET || 'fallback-secret';

const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            role: user.role, 
            negocioId: user.negocioId 
        }, 
        secret, 
        { expiresIn: '7d' }
    );
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, secret);
    } catch (err) {
        return null;
    }
};

module.exports = {
    generateToken,
    verifyToken
};
