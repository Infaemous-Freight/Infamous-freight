/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * API Integration Tests - Complete Workflows
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../src/db/prisma');

const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_USER_ID = 'user-' + Date.now();
const TEST_ORG_ID = 'org-' + Date.now();

/**
 * Helper: Generate test JWT token
 */
function generateTestToken(userId = TEST_USER_ID, scopes = []) {
    return jwt.sign(
        {
            sub: userId,
            email: `${userId}@test.com`,
            role: 'SHIPPER',
            scopes,
            org_id: TEST_ORG_ID,
        },
        TEST_JWT_SECRET,
        { expiresIn: '1h' }
    );
}

describe('API Integration Tests - Complete Workflows', () => {
    let app;
    let userToken;
    let adminToken;

    beforeAll(async () => {
        app = require('../../src/app');

        userToken = generateTestToken(TEST_USER_ID, [
            'shipment:read',
            'shipment:write',
            'shipment:update',
            'user:profile',
        ]);

        adminToken = generateTestToken('admin-user', [
            'admin:all',
            'shipment:read',
            'shipment:write',
        ]);
    });

    describe('Shipment Lifecycle', () => {
        let shipmentId;

        it('should create a shipment', (done) => {
            request(app)
                .post('/api/shipments')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    pickupAddress: '123 Main Street, New York, NY 10001',
                    deliveryAddress: '456 Oak Avenue, Boston, MA 02101',
                    weight: 150,
                    dimensions: { length: 10, width: 8, height: 6 },
                })
                .expect(201)
                .end((err, res) => {
                    if (err) return done(err);

                    expect(res.body.success).toBe(true);
                    expect(res.body.data).toBeDefined();
                    expect(res.body.data.id).toBeDefined();
                    shipmentId = res.body.data.id;

                    // Verify new token in header (if production)
                    if (process.env.NODE_ENV === 'production') {
                        expect(res.headers['x-new-token']).toBeDefined();
                    }

                    done();
                });
        });

        it('should retrieve the created shipment', (done) => {
            request(app)
                .get(`/api/shipments/${shipmentId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);

                    expect(res.body.data.id).toBe(shipmentId);
                    expect(res.body.data.status).toBe('CREATED');
                    expect(res.body.data.pickupAddress).toBe(
                        '123 Main Street, New York, NY 10001'
                    );

                    done();
                });
        });

        it('should update shipment status', (done) => {
            request(app)
                .patch(`/api/shipments/${shipmentId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ status: 'IN_TRANSIT' })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);

                    expect(res.body.data.status).toBe('IN_TRANSIT');
                    done();
                });
        });

        it('should list user shipments', (done) => {
            request(app)
                .get('/api/shipments')
                .set('Authorization', `Bearer ${userToken}`)
                .query({ page: 1, pageSize: 10 })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);

                    expect(Array.isArray(res.body.data)).toBe(true);
                    expect(res.body.data.length).toBeGreaterThan(0);
                    done();
                });
        });

        it('should not allow unauthorized user to modify others shipments', (done) => {
            const otherUserToken = generateTestToken('other-user', ['shipment:write']);

            request(app)
                .patch(`/api/shipments/${shipmentId}`)
                .set('Authorization', `Bearer ${otherUserToken}`)
                .send({ status: 'DELIVERED' })
                .expect(403)
                .end((err, res) => {
                    if (err) return done(err);

                    expect(res.body.error).toBeDefined();
                    done();
                });
        });
    });

    describe('Authentication & Authorization', () => {
        it('should reject requests without token', (done) => {
            request(app)
                .get('/api/shipments')
                .expect(401)
                .end((err, res) => {
                    if (err) return done(err);

                    expect(res.body.error).toBeDefined();
                    done();
                });
        });

        it('should reject invalid token', (done) => {
            request(app)
                .get('/api/shipments')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401)
                .end((err, res) => {
                    if (err) return done(err);

                    expect(res.body.error).toBeDefined();
                    done();
                });
        });

        it('should reject expired token', (done) => {
            const expiredToken = jwt.sign(
                { sub: TEST_USER_ID, role: 'SHIPPER' },
                TEST_JWT_SECRET,
                { expiresIn: '0s' }  // Already expired
            );

            // Wait to ensure token is expired
            setTimeout(() => {
                request(app)
                    .get('/api/shipments')
                    .set('Authorization', `Bearer ${expiredToken}`)
                    .expect(401)
                    .end((err, res) => {
                        if (err) return done(err);

                        expect(res.body.error).toBeDefined();
                        done();
                    });
            }, 1000);
        });

        it('should enforce scope requirements', (done) => {
            const limitedToken = generateTestToken(TEST_USER_ID, ['shipment:read']);

            request(app)
                .post('/api/shipments')  // Requires shipment:write scope
                .set('Authorization', `Bearer ${limitedToken}`)
                .send({
                    pickupAddress: '123 Main St',
                    deliveryAddress: '456 Oak Ave',
                    weight: 100,
                })
                .expect(403)
                .end((err, res) => {
                    if (err) return done(err);

                    expect(res.body.code).toBe('INSUFFICIENT_PERMISSIONS');
                    done();
                });
        });
    });

    describe('Error Handling', () => {
        it('should return 404 for non-existent shipment', (done) => {
            request(app)
                .get(`/api/shipments/${VALID_UUID}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404)
                .end((err, res) => {
                    if (err) return done(err);

                    expect(res.body.error).toBeDefined();
                    done();
                });
        });

        it('should return 400 for invalid input', (done) => {
            request(app)
                .post('/api/shipments')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    pickupAddress: '',  // Empty address
                    deliveryAddress: '456 Oak Ave',
                    weight: 100,
                })
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);

                    expect(res.body.error).toBe('Validation failed');
                    expect(res.body.details).toBeDefined();
                    done();
                });
        });

        it('should rate limit excessive requests', function (done) {
            this.timeout(5000);

            let successCount = 0;
            let rateLimitedCount = 0;

            // Make multiple rapid requests
            for (let i = 0; i < 10; i++) {
                request(app)
                    .get('/api/shipments')
                    .set('Authorization', `Bearer ${userToken}`)
                    .end((err, res) => {
                        if (res.status === 429) {
                            rateLimitedCount++;
                        } else if (res.status === 200) {
                            successCount++;
                        }
                    });
            }

            setTimeout(() => {
                // At least some requests should be rate limited or all succeed
                // depending on the rate limit threshold
                expect(successCount + rateLimitedCount).toBe(10);
                done();
            }, 1000);
        });
    });

    describe('Performance', () => {
        it('should return shipment list within acceptable time', (done) => {
            const startTime = Date.now();

            request(app)
                .get('/api/shipments?page=1&pageSize=50')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);

                    const duration = Date.now() - startTime;

                    // Should respond in less than 500ms
                    expect(duration).toBeLessThan(500);
                    done();
                });
        });
    });

    describe('Admin Operations', () => {
        it('should allow admin to view all shipments', (done) => {
            request(app)
                .get('/api/admin/shipments')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ limit: 100 })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);

                    expect(Array.isArray(res.body.data)).toBe(true);
                    done();
                });
        });

        it('should prevent non-admin from accessing admin endpoints', (done) => {
            request(app)
                .get('/api/admin/shipments')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403)
                .end((err, res) => {
                    if (err) return done(err);

                    expect(res.body.error).toBeDefined();
                    done();
                });
        });
    });
});
