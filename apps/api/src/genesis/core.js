const { listUserAvatars, getSelection } = require("../avatars/store");

const SYSTEM_AVATARS = [
    { id: "main-01", name: "Infinity Operator", imageUrl: "/avatars/main/main-01.png" },
    { id: "main-02", name: "Crimson Neural", imageUrl: "/avatars/main/main-02.png" },
    { id: "main-03", name: "Golden Sphinx Core", imageUrl: "/avatars/main/main-03.png" },
    { id: "main-04", name: "Pharaoh Circuit", imageUrl: "/avatars/main/main-04.png" },
];

function resolveSystemAvatar(id) {
    return SYSTEM_AVATARS.find((a) => a.id === id) || SYSTEM_AVATARS[0];
}

function resolveUserAvatar(userId, avatarId) {
    const avatars = listUserAvatars(userId) || [];
    const found = avatars.find((a) => a.id === avatarId);
    if (!found) return null;
    return {
        type: "user",
        id: found.id,
        imageUrl: found.imageUrl,
        label: found.name || "Personal Avatar",
    };
}

function resolveGenesisProfile(userId) {
    const selection = getSelection(userId) || { type: "system", id: "main-01" };

    const profile = {
        name: "Genesis",
        voice: "direct",
        tone: "red",
        capabilities: [
            "Avatar selection aware",
            "Freight ops assistant scaffold",
            "Deterministic safe-chat stub",
            "Upgrade path to OpenAI/Anthropic",
        ],
        avatar: null,
    };

    if (selection.type === "user") {
        const userAvatar = resolveUserAvatar(userId, selection.id);
        if (userAvatar) {
            profile.avatar = userAvatar;
        }
    }

    if (!profile.avatar) {
        const sys = resolveSystemAvatar(selection.id);
        profile.avatar = {
            type: "system",
            id: sys.id,
            imageUrl: sys.imageUrl,
            label: sys.name,
        };
    }

    return profile;
}

function safeGenesisReply(input) {
    const trimmed = (input || "").trim();
    const lower = trimmed.toLowerCase();

    if (!trimmed) return "Say something and I'll respond as Genesis.";

    if (lower.includes("deploy") || lower.includes("deployment")) {
        return [
            "Genesis: Deployment mode engaged.",
            "1) Confirm API /health is OK",
            "2) Confirm Web can call API (CORS_ORIGINS)",
            "3) Validate avatar upload flow (local vs s3)",
            "4) Check build logs for the first failing step and fix deterministically",
        ].join("\n");
    }

    if (lower.includes("avatar")) {
        return [
            "Genesis: Avatar system status:",
            "- Main Avatars: system defaults (Phase-1)",
            "- Personal Avatars: upload + select (Phase-2/3)",
            "- Persistent storage: presigned S3 (Phase-5)",
            "",
            "Tell me: do you want the avatar to be voice-enabled next?",
        ].join("\n");
    }

    if (lower.includes("dispatch") || lower.includes("load") || lower.includes("driver")) {
        return [
            "Genesis: Freight Ops Assist (stub).",
            "Give me:",
            "- Origin -> Destination",
            "- Pickup time window",
            "- Equipment type",
            "- Rate target",
            "and I'll produce a dispatch plan + checklist.",
        ].join("\n");
    }

    return `Genesis: I read you. Next best action: define the single objective for the next 30 minutes, then I’ll produce a step-by-step execution list.\n\nYou said: "${trimmed}"`;
}

module.exports = {
    resolveGenesisProfile,
    safeGenesisReply,
    SYSTEM_AVATARS,
};
