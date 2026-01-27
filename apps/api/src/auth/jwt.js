const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function signUserToken(userId) {
    const claims = { sub: userId, scopes: ["user:avatar"] };
    return jwt.sign(claims, env.jwtSecret, { expiresIn: env.jwtExpiry || "30d" });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, env.jwtSecret);
    } catch {
        return null;
    }
}

module.exports = {
    signUserToken,
    verifyToken,
};
