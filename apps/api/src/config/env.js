const path = require("path");

const env = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || process.env.API_PORT || 4000),
    apiPort: Number(process.env.API_PORT || process.env.PORT || 4000),
    databaseUrl: process.env.DATABASE_URL || "",
    jwtSecret:
        process.env.JWT_SECRET || "dev_insecure_change_me_please_update",
    jwtExpiry: process.env.JWT_EXPIRY || "30d",
    avatarStorage: process.env.AVATAR_STORAGE || "local",
    avatarUploadDir:
        process.env.AVATAR_UPLOAD_DIR || path.join(process.cwd(), "apps/api/public/uploads"),
    avatarMaxFileSizeMB: parseInt(process.env.AVATAR_MAX_FILE_SIZE_MB || "5", 10),
    avatarAllowedTypes: (process.env.AVATAR_ALLOWED_TYPES || "image/jpeg,image/png,image/webp").split(","),
    avatarDataStore:
        process.env.AVATAR_DATA_STORE || path.join(process.cwd(), "apps/api/data/avatars.json"),
    s3Bucket: process.env.S3_BUCKET,
    s3Region: process.env.S3_REGION,
    s3Endpoint: process.env.S3_ENDPOINT,
    s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    s3PublicBaseUrl: process.env.S3_PUBLIC_BASE_URL,
    aiProvider: process.env.AI_PROVIDER || "stub",
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    anthropicModel: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
    corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001").split(","),
    logLevel: process.env.LOG_LEVEL || "info",
    outboundHttpAllowlist: (process.env.OUTBOUND_HTTP_ALLOWLIST || "api.open-meteo.com,open-meteo.com,hooks.slack.com")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    outboundHttpBlockPrivate: process.env.OUTBOUND_HTTP_BLOCK_PRIVATE !== "false",
    outboundHttpTimeoutMs: parseInt(process.env.OUTBOUND_HTTP_TIMEOUT_MS || "8000", 10),
};

module.exports = { env };
module.exports.default = env;
