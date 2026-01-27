/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * A/B Testing Service
 */

class ABTestingService {
    constructor() {
        this.tests = new Map();
        this.assignments = new Map();
    }

    createTest(name, config) {
        const test = {
            id: `test_${Date.now()}`,
            name,
            variants: config.variants || ['control', 'treatment'],
            allocation: config.allocation || { control: 50, treatment: 50 },
            targetUsers: config.targetUsers || [],
            targetSegments: config.targetSegments || [],
            hypothesis: config.hypothesis || '',
            metrics: config.metrics || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'running',
        };
        this.tests.set(name, test);
        return test;
    }

    assignVariant(userId, testName) {
        const key = `${userId}:${testName}`;
        if (this.assignments.has(key)) {
            return this.assignments.get(key);
        }

        const test = this.tests.get(testName);
        if (!test) return null;

        // Deterministic assignment using hash
        const hash = this.hashUserId(userId, testName);
        let allocated = 0;
        let variant = 'control';

        for (const [v, percentage] of Object.entries(test.allocation)) {
            allocated += percentage;
            if (hash < allocated) {
                variant = v;
                break;
            }
        }

        this.assignments.set(key, variant);
        return variant;
    }

    hashUserId(userId, testName) {
        const str = `${userId}:${testName}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash % 100);
    }

    recordMetric(userId, testName, metricName, value) {
        const key = `metric:${userId}:${testName}:${metricName}`;
        return {
            key,
            userId,
            testName,
            metricName,
            value,
            timestamp: new Date(),
        };
    }

    completeTest(testName, winner) {
        const test = this.tests.get(testName);
        if (!test) throw new Error(`Test ${testName} not found`);

        test.status = 'completed';
        test.winner = winner;
        test.completedAt = new Date();
        this.tests.set(testName, test);
        return test;
    }

    getTest(testName) {
        return this.tests.get(testName);
    }

    listTests() {
        return Array.from(this.tests.values());
    }

    deleteTest(testName) {
        this.tests.delete(testName);
        // Clean up assignments
        for (const key of this.assignments.keys()) {
            if (key.includes(testName)) {
                this.assignments.delete(key);
            }
        }
    }
}

module.exports = new ABTestingService();
