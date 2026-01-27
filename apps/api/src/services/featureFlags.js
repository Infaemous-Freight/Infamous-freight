/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Feature Flags Service
 */

class FeatureFlagsService {
    constructor() {
        this.flags = new Map();
        this.cache = new Map();
        this.bootstrapFromEnv();
    }

    bootstrapFromEnv() {
        const envBackedFlags = [
            'ENABLE_AI_COMMANDS',
            'ENABLE_VOICE_PROCESSING',
            'ENABLE_EXPERIMENTAL_UI',
        ];

        envBackedFlags.forEach((name) => {
            const envValue = process.env[name];
            if (envValue !== undefined && !this.flags.has(name)) {
                this.flags.set(name, {
                    id: `flag_${Date.now()}_${name}`,
                    name,
                    enabled: envValue !== 'false',
                    percentageRollout: 100,
                    targetUsers: [],
                    targetSegments: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    source: 'env',
                });
            }
        });
    }

    createFlag(name, config) {
        const flag = {
            id: `flag_${Date.now()}`,
            name,
            enabled: config.enabled || false,
            percentageRollout: config.percentageRollout || 0,
            targetUsers: config.targetUsers || [],
            targetSegments: config.targetSegments || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            source: config.source || 'manual',
        };
        this.flags.set(name, flag);
        return flag;
    }

    isEnabled(userId, flagName) {
        if (!this.flags.has(flagName)) {
            const envValue = process.env[flagName];
            return envValue ? envValue !== 'false' : false;
        }
        const flag = this.flags.get(flagName);

        if (!flag.enabled) return false;

        if (flag.targetUsers.includes(userId)) return true;

        // Hash-based percentage rollout
        const hash = this.hashUserId(userId, flagName);
        return hash < flag.percentageRollout;
    }

    hashUserId(userId, flagName) {
        const str = `${userId}:${flagName}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash % 100);
    }

    updateFlag(name, config) {
        if (!this.flags.has(name)) throw new Error(`Flag ${name} not found`);
        const flag = this.flags.get(name);
        const updated = { ...flag, ...config, updatedAt: new Date(), source: config.source || flag.source };
        this.flags.set(name, updated);
        this.cache.clear();
        return updated;
    }

    upsertFlag(name, config) {
        if (this.flags.has(name)) {
            return this.updateFlag(name, config);
        }
        return this.createFlag(name, config);
    }

    setEnabled(name, enabled) {
        return this.upsertFlag(name, {
            enabled,
            percentageRollout: enabled ? 100 : 0,
            source: 'manual',
        });
    }

    getFlag(name) {
        return this.flags.get(name);
    }

    listFlags() {
        return Array.from(this.flags.values());
    }

    deleteFlag(name) {
        this.flags.delete(name);
        this.cache.clear();
    }
}

module.exports = new FeatureFlagsService();
