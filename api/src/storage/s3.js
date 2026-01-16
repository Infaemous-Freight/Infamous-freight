const { S3Client } = require("@aws-sdk/client-s3");

function required(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing ${name}`);
    return v;
}

function s3Client() {
    const region = process.env.STORAGE_REGION || "auto";
    const endpoint = process.env.STORAGE_ENDPOINT || undefined;

    return new S3Client({
        region,
        endpoint,
        credentials: {
            accessKeyId: required("STORAGE_ACCESS_KEY_ID"),
            secretAccessKey: required("STORAGE_SECRET_ACCESS_KEY"),
        },
        forcePathStyle: !!endpoint,
    });
}

function bucketName() {
    return required("STORAGE_BUCKET");
}

function publicUrlForKey(key) {
    const base = required("STORAGE_PUBLIC_BASE_URL").replace(/\/+$/, "");
    return `${base}/${key}`;
}

module.exports = {
    s3Client,
    bucketName,
    publicUrlForKey,
};
