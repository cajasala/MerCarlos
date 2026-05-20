const jwt = require('jsonwebtoken');
const { sql, poolPromise } = require('./db');
require('dotenv').config();

const secret = process.env.JWT_SECRET;

/**
 * Middleware de autorización admin para Azure Functions.
 * Verifica el JWT y valida que el rol esté en la lista de roles permitidos.
 *
 * @param {Object} request - Azure Functions HttpRequest
 * @param {string[]} allowedRoles - Array de roles permitidos, ej ['ADM','PED']
 * @returns {Object} { authorized, status?, body?, adminId?, negocioId?, role? }
 */
async function requireAdmin(request, allowedRoles) {
    if (!allowedRoles || allowedRoles.length === 0) {
        return { authorized: true };
    }

    const rawAuth = request.headers?.get('authorization') || request.headers?.authorization;
    const token = rawAuth
        ? (typeof rawAuth === 'string' && rawAuth.startsWith('Bearer ')
            ? rawAuth.slice(7)
            : typeof rawAuth === 'string' ? rawAuth : null)
        : null;

    if (!token) {
        return { authorized: false, status: 401, body: 'Unauthorized' };
    }

    let decoded;
    try {
        decoded = jwt.verify(token, secret);
    } catch {
        return { authorized: false, status: 401, body: 'Invalid or expired token' };
    }

    // Legacy tokens carry numeric role; force re-login after migration
    if (typeof decoded.role === 'number') {
        return { authorized: false, status: 401, body: 'Session expired — please log in again' };
    }

    if (!allowedRoles.includes(decoded.role)) {
        return { authorized: false, status: 403, body: 'Forbidden — insufficient role' };
    }

    return { authorized: true, adminId: decoded.id, negocioId: decoded.negocioId, role: decoded.role };
}

/**
 * Verify token and return decoded payload (no role check).
 * Use for endpoints that only need to know the admin's identity.
 *
 * @param {Object} request  - Azure Functions HttpRequest
 * @returns {Object|null} - Decoded JWT payload or null
 */
async function verifyAdminToken(request) {
    const rawAuth = request.headers?.get('authorization') || request.headers?.authorization;
    const token = rawAuth
        ? (typeof rawAuth === 'string' && rawAuth.startsWith('Bearer ')
            ? rawAuth.slice(7)
            : typeof rawAuth === 'string' ? rawAuth : null)
        : null;

    if (!token) return null;

    try {
        return jwt.verify(token, secret);
    } catch {
        return null;
    }
}

module.exports = { requireAdmin, verifyAdminToken };
