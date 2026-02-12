/**
 * Tests for Winston Logger utility
 */

const logger = require('../logger');

describe('Winston Logger', () => {
    // Mock console to avoid test output noise
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Basic logging methods', () => {
        test('info() logs without throwing', () => {
            expect(() => logger.info('test message')).not.toThrow();
        });

        test('error() logs without throwing', () => {
            expect(() => logger.error('error message')).not.toThrow();
        });

        test('warn() logs without throwing', () => {
            expect(() => logger.warn('warning message')).not.toThrow();
        });

        test('debug() logs without throwing', () => {
            expect(() => logger.debug('debug message')).not.toThrow();
        });
    });

    describe('AI-specific logging methods', () => {
        test('aiDecision() logs structured decision data', () => {
            const decisionId = 'dec-123';
            const data = {
                role: 'dispatch-operator',
                action: 'assign-driver',
                confidence: 0.92
            };

            expect(() => logger.aiDecision(decisionId, data)).not.toThrow();
        });

        test('aiConfidence() logs confidence scores', () => {
            const decisionId = 'dec-456';
            const confidence = {
                value: 0.85,
                reasoning: 'High historical accuracy'
            };

            expect(() => logger.aiConfidence(decisionId, confidence)).not.toThrow();
        });

        test('aiOverride() logs human overrides', () => {
            const decisionId = 'dec-789';
            const override = {
                overrideBy: 'user-123',
                reason: 'Customer request'
            };

            expect(() => logger.aiOverride(decisionId, override)).not.toThrow();
        });

        test('aiGuardrail() logs guardrail violations', () => {
            const violation = {
                type: 'hours-of-service',
                severity: 'high',
                description: 'Driver exceeds max hours'
            };

            expect(() => logger.aiGuardrail(violation)).not.toThrow();
        });
    });

    describe('Security logging', () => {
        test('security() logs security events', () => {
            const event = {
                type: 'authentication-failure',
                userId: 'user-999',
                ipAddress: '192.168.1.100'
            };

            expect(() => logger.security(event)).not.toThrow();
        });
    });

    describe('Performance logging', () => {
        test('performance() logs performance metrics', () => {
            expect(() => logger.performance('api-response-time', 245)).not.toThrow();
        });
    });

    describe('Data formatting', () => {
        test('logs include metadata', () => {
            const data = {
                userId: 'user-123',
                requestId: 'req-456'
            };

            expect(() => logger.info('test', data)).not.toThrow();
        });

        test('handles error objects', () => {
            const error = new Error('Test error');
            error.stack = 'Stack trace here';

            expect(() => logger.error('Error occurred', { error })).not.toThrow();
        });
    });
});
