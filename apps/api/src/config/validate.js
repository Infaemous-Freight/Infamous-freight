const { env } = require("./env");

function ensure(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function validateRuntimeEnv() {
    // JWT must be non-default in production
    if (env.nodeEnv === "production") {
        ensure(
            env.jwtSecret && env.jwtSecret !== "dev_insecure_change_me_please_update",
            "JWT_SECRET must be set to a strong value in production",
        );
    }

    // S3 requirements when enabled
    if (env.avatarStorage === "s3") {
        const required = [
            [env.s3Bucket, "S3_BUCKET"],
            [env.s3Endpoint, "S3_ENDPOINT"],
            [env.s3AccessKeyId, "S3_ACCESS_KEY_ID"],
            [env.s3SecretAccessKey, "S3_SECRET_ACCESS_KEY"],
            [env.s3PublicBaseUrl, "S3_PUBLIC_BASE_URL"],
        ];
        required.forEach(([value, key]) =>
            ensure(Boolean(value), `Missing required env for s3 mode: ${key}`),
        );
    }

    // AI provider key checks
    if (env.aiProvider === "openai") {
        ensure(env.openaiApiKey, "OPENAI_API_KEY required when AI_PROVIDER=openai");
    }
    if (env.aiProvider === "anthropic") {
        ensure(env.anthropicApiKey, "ANTHROPIC_API_KEY required when AI_PROVIDER=anthropic");
    }
}

module.exports = { validateRuntimeEnv };
