const crypto = require("crypto");

function envNum(v, def) {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
}

function generateOtp() {
    const len = envNum(process.env.OTP_LENGTH, 6);
    const min = 10 ** (len - 1);
    const max = 10 ** len - 1;
    const n = crypto.randomInt(min, max + 1);
    return String(n);
}

function hashOtp(otp) {
    const salt = process.env.OTP_HASH_SALT || "change-me";
    return crypto.createHash("sha256").update(`${salt}:${otp}`).digest("hex");
}

module.exports = {
    generateOtp,
    hashOtp,
};
