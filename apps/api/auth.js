// apps/api/auth.js - JWT Authentication Module
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

function base64UrlEncode(str) {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function base64UrlDecode(str) {
    str += '='.repeat(4 - str.length % 4);
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
}

function sign(data, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    return base64UrlEncode(hmac.digest());
}

function generateToken(userId, email, role = 'user') {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        sub: userId,
        email,
        role,
        iat: now,
        exp: now + 86400 // 24 hours
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = sign(`${encodedHeader}.${encodedPayload}`, JWT_SECRET);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [encodedHeader, encodedPayload, signature] = parts;
        const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`, JWT_SECRET);

        if (signature !== expectedSignature) return null;

        const payload = JSON.parse(base64UrlDecode(encodedPayload));
        const now = Math.floor(Date.now() / 1000);

        if (payload.exp < now) return null; // Token expired

        return payload;
    } catch {
        return null;
    }
}

function authenticate(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing or invalid authorization header' }));
        return null;
    }

    const token = authHeader.slice(7);
    const user = verifyToken(token);

    if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid or expired token' }));
        return null;
    }

    return user;
}

module.exports = { generateToken, verifyToken, authenticate };
