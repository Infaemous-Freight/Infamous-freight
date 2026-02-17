/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Avatar AI Service
 * Purpose: AI-powered avatar personality, behavior learning, and Genesis AI integration
 */

const { getAISyntheticClient } = require("../services/aiSyntheticClient");

/**
 * Avatar personality profiles for Genesis AI
 */
const AVATAR_PERSONALITIES = {
    "main-01": {
        name: "Infinity Operator",
        personality: "Professional, efficient, data-driven. Focuses on optimization and precision.",
        traits: ["analytical", "systematic", "reliable"],
        voiceTone: "measured",
        expertise: ["logistics", "optimization", "analytics"],
    },
    "main-02": {
        name: "Crimson Neural",
        personality: "Bold, confident, innovative. Emphasizes cutting-edge solutions.",
        traits: ["innovative", "decisive", "bold"],
        voiceTone: "assertive",
        expertise: ["ai", "automation", "innovation"],
    },
    "main-03": {
        name: "Golden Sphinx Core",
        personality: "Wise, knowledgeable, strategic. Provides deep insights and guidance.",
        traits: ["wise", "strategic", "insightful"],
        voiceTone: "contemplative",
        expertise: ["strategy", "knowledge", "planning"],
    },
    "main-04": {
        name: "Pharaoh Circuit",
        personality: "Commanding, authoritative, results-oriented. Drives action and execution.",
        traits: ["commanding", "results-driven", "action-oriented"],
        voiceTone: "authoritative",
        expertise: ["execution", "leadership", "operations"],
    },
};

/**
 * Avatar interaction context for AI personalization
 * @typedef {Object} AvatarContext
 * @property {string} userId - User ID
 * @property {string} avatarId - Selected avatar ID
 * @property {string[]} recentInteractions - Recent user interactions
 * @property {Object} userPreferences - User preferences and settings
 */

/**
 * Generate personalized AI response based on avatar personality
 * @param {string} avatarId - Avatar ID (main-01, main-02, etc.)
 * @param {string} userMessage - User's message or command
 * @param {AvatarContext} context - Avatar interaction context
 * @returns {Promise<string>} - AI-generated response
 */
async function generateAvatarResponse(avatarId, userMessage, context = {}) {
    const personality = AVATAR_PERSONALITIES[avatarId] || AVATAR_PERSONALITIES["main-01"];

    const systemPrompt = `You are ${personality.name}, an AI logistics assistant with the following personality:
${personality.personality}

Traits: ${personality.traits.join(", ")}
Voice Tone: ${personality.voiceTone}
Expertise: ${personality.expertise.join(", ")}

Respond to the user's message in character, providing helpful logistics insights and assistance.
Keep responses concise, professional, and aligned with your personality traits.`;

    const aiClient = getAISyntheticClient();

    try {
        const response = await aiClient.generateText({
            prompt: userMessage,
            systemPrompt,
            maxTokens: 500,
            temperature: 0.7,
        });

        return response.text || response;
    } catch (error) {
        console.error("Avatar AI response generation failed:", error);
        return `I'm ${personality.name}, and I'm here to help with your logistics needs. How can I assist you today?`;
    }
}

/**
 * Learn from user interactions to improve avatar responses
 * @param {string} userId - User ID
 * @param {string} avatarId - Avatar ID
 * @param {Object} interaction - Interaction data
 * @returns {Promise<void>}
 */
async function learnFromInteraction(userId, avatarId, interaction) {
    // Store interaction patterns for future personalization
    // This can be expanded with embeddings and vector storage
    const interactionLog = {
        userId,
        avatarId,
        timestamp: new Date().toISOString(),
        ...interaction,
    };

    // Log to analytics (can be extended to database/memory store)
    console.log("Avatar interaction logged:", interactionLog);

    return interactionLog;
}

/**
 * Get avatar personality profile
 * @param {string} avatarId - Avatar ID
 * @returns {Object} - Personality profile
 */
function getAvatarPersonality(avatarId) {
    return AVATAR_PERSONALITIES[avatarId] || AVATAR_PERSONALITIES["main-01"];
}

/**
 * Get recommended avatar based on user preferences
 * @param {Object} userPreferences - User preferences
 * @returns {string} - Recommended avatar ID
 */
function recommendAvatar(userPreferences = {}) {
    const { workStyle = "balanced", priority = "efficiency" } = userPreferences;

    const recommendations = {
        analytical: "main-01", // Infinity Operator
        innovative: "main-02", // Crimson Neural
        strategic: "main-03", // Golden Sphinx Core
        action: "main-04", // Pharaoh Circuit
    };

    // Simple recommendation logic (can be enhanced with ML)
    if (workStyle === "analytical" || priority === "optimization") return "main-01";
    if (workStyle === "innovative" || priority === "innovation") return "main-02";
    if (workStyle === "strategic" || priority === "planning") return "main-03";
    if (workStyle === "action" || priority === "execution") return "main-04";

    return "main-01"; // Default
}

/**
 * Generate avatar insights based on user activity
 * @param {string} userId - User ID
 * @param {Object} activityData - User activity data
 * @returns {Promise<Object>} - Avatar insights
 */
async function generateAvatarInsights(userId, activityData = {}) {
    const {
        totalShipments = 0,
        onTimeDeliveries = 0,
        costSavings = 0,
        aiInteractions = 0,
    } = activityData;

    const insights = {
        performance: {
            score: totalShipments > 0 ? (onTimeDeliveries / totalShipments) * 100 : 0,
            trend: "stable",
        },
        suggestions: [],
        achievements: [],
    };

    // Generate contextual suggestions
    if (insights.performance.score < 80) {
        insights.suggestions.push(
            "Consider enabling auto-optimization for route planning to improve on-time delivery rates.",
        );
    }

    if (costSavings > 1000) {
        insights.achievements.push(`You've saved $${costSavings.toFixed(2)} this month!`);
    }

    if (aiInteractions > 50) {
        insights.achievements.push("Power user! You're leveraging AI features extensively.");
    }

    return insights;
}

module.exports = {
    generateAvatarResponse,
    learnFromInteraction,
    getAvatarPersonality,
    recommendAvatar,
    generateAvatarInsights,
    AVATAR_PERSONALITIES,
};
