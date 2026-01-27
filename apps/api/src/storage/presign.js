const crypto = require("crypto");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { bucketName, publicUrlForKey, s3Client } = require("./s3");

function envNum(v, def) {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
}

function mimeToExt(mime) {
    const m = (mime || "").toLowerCase();
    if (m.includes("jpeg")) return ".jpg";
    if (m.includes("png")) return ".png";
    if (m.includes("webp")) return ".webp";
    if (m.includes("svg")) return ".svg";
    if (m.includes("pdf")) return ".pdf";
    return "";
}

async function presignPodUpload(params) {
    const ttl = envNum(process.env.STORAGE_PRESIGN_TTL_SECONDS, 900);
    const ext = mimeToExt(params.mimeType);
    const rand = crypto.randomBytes(10).toString("hex");
    const key = `pod/${params.jobId}/${params.kind}/${rand}${ext}`;

    const cmd = new PutObjectCommand({
        Bucket: bucketName(),
        Key: key,
        ContentType: params.mimeType,
    });

    const uploadUrl = await getSignedUrl(s3Client(), cmd, { expiresIn: ttl });

    return {
        key,
        uploadUrl,
        publicUrl: publicUrlForKey(key),
        expiresInSeconds: ttl,
    };
}

module.exports = {
    presignPodUpload,
};
