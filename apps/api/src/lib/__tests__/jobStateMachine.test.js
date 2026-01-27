/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Unit Tests for Job State Machine
 */

const jobStateMachine = require('../jobStateMachine');

describe('jobStateMachine', () => {
    describe('VALID_TRANSITIONS', () => {
        it('should define valid transitions for all statuses', () => {
            expect(jobStateMachine.VALID_TRANSITIONS).toBeDefined();
            expect(Object.keys(jobStateMachine.VALID_TRANSITIONS).length).toBeGreaterThan(0);
        });

        it('should have transitions for DRAFT status', () => {
            expect(jobStateMachine.VALID_TRANSITIONS.DRAFT).toBeDefined();
            expect(jobStateMachine.VALID_TRANSITIONS.DRAFT).toContain('REQUIRES_PAYMENT');
        });

        it('should have transitions for OPEN status', () => {
            expect(jobStateMachine.VALID_TRANSITIONS.OPEN).toBeDefined();
            expect(jobStateMachine.VALID_TRANSITIONS.OPEN).toContain('ACCEPTED');
        });

        it('should have transitions for ACCEPTED status', () => {
            expect(jobStateMachine.VALID_TRANSITIONS.ACCEPTED).toBeDefined();
            expect(jobStateMachine.VALID_TRANSITIONS.ACCEPTED).toContain('PICKED_UP');
        });

        it('should have transitions for PICKED_UP status', () => {
            expect(jobStateMachine.VALID_TRANSITIONS.PICKED_UP).toBeDefined();
            expect(jobStateMachine.VALID_TRANSITIONS.PICKED_UP).toContain('DELIVERED');
        });

        it('should have transitions for DELIVERED status', () => {
            expect(jobStateMachine.VALID_TRANSITIONS.DELIVERED).toBeDefined();
            expect(jobStateMachine.VALID_TRANSITIONS.DELIVERED).toContain('COMPLETED');
        });
    });

    describe('canTransition', () => {
        it('should return true for valid transition from DRAFT to REQUIRES_PAYMENT', () => {
            expect(jobStateMachine.canTransition('DRAFT', 'REQUIRES_PAYMENT')).toBe(true);
        });

        it('should return false for invalid transition from DRAFT to ACCEPTED', () => {
            expect(jobStateMachine.canTransition('DRAFT', 'ACCEPTED')).toBe(false);
        });

        it('should return false for transition from COMPLETED to any status', () => {
            expect(jobStateMachine.canTransition('COMPLETED', 'DRAFT')).toBe(false);
            expect(jobStateMachine.canTransition('COMPLETED', 'REQUIRES_PAYMENT')).toBe(false);
        });

        it('should return true for valid transition from OPEN to ACCEPTED', () => {
            expect(jobStateMachine.canTransition('OPEN', 'ACCEPTED')).toBe(true);
        });

        it('should return true for valid transition from ACCEPTED to PICKED_UP', () => {
            expect(jobStateMachine.canTransition('ACCEPTED', 'PICKED_UP')).toBe(true);
        });

        it('should return true for valid transition from DELIVERED to COMPLETED', () => {
            expect(jobStateMachine.canTransition('DELIVERED', 'COMPLETED')).toBe(true);
        });
    });

    describe('getAllowedTransitions', () => {
        it('should return allowed transitions for DRAFT', () => {
            const allowed = jobStateMachine.getAllowedTransitions('DRAFT');
            expect(allowed).toContain('REQUIRES_PAYMENT');
            expect(allowed.length).toBeGreaterThan(0);
        });

        it('should return allowed transitions for OPEN', () => {
            const allowed = jobStateMachine.getAllowedTransitions('OPEN');
            expect(allowed).toContain('ACCEPTED');
        });

        it('should return empty array for COMPLETED', () => {
            const allowed = jobStateMachine.getAllowedTransitions('COMPLETED');
            expect(Array.isArray(allowed)).toBe(true);
            expect(allowed.length).toBe(0);
        });

        it('should return allowed transitions for REQUIRES_PAYMENT', () => {
            const allowed = jobStateMachine.getAllowedTransitions('REQUIRES_PAYMENT');
            expect(allowed).toContain('OPEN');
        });
    });

    describe('validateTransition', () => {
        it('should not throw for valid transition from DRAFT to REQUIRES_PAYMENT', () => {
            expect(() => {
                jobStateMachine.validateTransition('DRAFT', 'REQUIRES_PAYMENT');
            }).not.toThrow();
        });

        it('should throw for invalid transition from DRAFT to ACCEPTED', () => {
            expect(() => {
                jobStateMachine.validateTransition('DRAFT', 'ACCEPTED');
            }).toThrow();
        });

        it('should throw with descriptive message', () => {
            expect(() => {
                jobStateMachine.validateTransition('DRAFT', 'COMPLETED');
            }).toThrow(/Invalid status transition: DRAFT -> COMPLETED/);
        });

        it('should throw for invalid from status', () => {
            expect(() => {
                jobStateMachine.validateTransition('INVALID', 'OPEN');
            }).toThrow();
        });

        it('should throw for invalid to status', () => {
            expect(() => {
                jobStateMachine.validateTransition('DRAFT', 'INVALID');
            }).toThrow();
        });

        it('should allow valid workflow: DRAFT → REQUIRES_PAYMENT → OPEN', () => {
            expect(() => {
                jobStateMachine.validateTransition('DRAFT', 'REQUIRES_PAYMENT');
                jobStateMachine.validateTransition('REQUIRES_PAYMENT', 'OPEN');
            }).not.toThrow();
        });

        it('should block invalid workflow: DRAFT → OPEN (skipping REQUIRES_PAYMENT)', () => {
            expect(() => {
                jobStateMachine.validateTransition('DRAFT', 'OPEN');
            }).toThrow();
        });
    });

    describe('Complete job workflow', () => {
        it('should validate complete workflow from creation to completion', () => {
            const workflow = [
                { from: 'DRAFT', to: 'REQUIRES_PAYMENT' },
                { from: 'REQUIRES_PAYMENT', to: 'OPEN' },
                { from: 'OPEN', to: 'ACCEPTED' },
                { from: 'ACCEPTED', to: 'PICKED_UP' },
                { from: 'PICKED_UP', to: 'DELIVERED' },
                { from: 'DELIVERED', to: 'COMPLETED' },
            ];

            workflow.forEach(({ from, to }) => {
                expect(() => {
                    jobStateMachine.validateTransition(from, to);
                }).not.toThrow();
            });
        });

        it('should reject invalid step in middle of workflow', () => {
            const validWorkflow = [
                { from: 'DRAFT', to: 'REQUIRES_PAYMENT' },
                { from: 'REQUIRES_PAYMENT', to: 'OPEN' },
            ];

            // Complete valid workflow
            validWorkflow.forEach(({ from, to }) => {
                expect(() => {
                    jobStateMachine.validateTransition(from, to);
                }).not.toThrow();
            });

            // Try invalid transition from OPEN
            expect(() => {
                jobStateMachine.validateTransition('OPEN', 'COMPLETED'); // Skip ACCEPTED, PICKED_UP, DELIVERED
            }).toThrow();
        });
    });

    describe('Edge cases', () => {
        it('should handle null values gracefully', () => {
            expect(() => {
                jobStateMachine.validateTransition(null, 'OPEN');
            }).toThrow();
        });

        it('should handle undefined values gracefully', () => {
            expect(() => {
                jobStateMachine.validateTransition(undefined, 'OPEN');
            }).toThrow();
        });

        it('should be case sensitive', () => {
            expect(() => {
                jobStateMachine.validateTransition('draft', 'REQUIRES_PAYMENT');
            }).toThrow();
        });

        it('should handle whitespace in status', () => {
            expect(() => {
                jobStateMachine.validateTransition(' DRAFT ', 'REQUIRES_PAYMENT');
            }).toThrow();
        });
    });
});
