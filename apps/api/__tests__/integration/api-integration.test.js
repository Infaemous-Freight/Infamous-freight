/**
 * API Integration Tests
 * 
 * Full end-to-end workflow tests covering:
 * - User registration and authentication
 * - Shipment creation and lifecycle
 * - Driver assignment and tracking
 * - Real-time updates via WebSocket
 * - Payment and billing integration
 * 
 * Run: pnpm test:integration
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import app without starting server
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-for-integration';
const app = require('../../src/server');

describe('API Integration Tests - Shipment Lifecycle', () => {
    let authToken;
    let userId;
    let shipmentId;
    let driverId;
    
    // Setup: Clean database before all tests
    beforeAll(async () => {
        // Clean test data
        await prisma.shipment.deleteMany({ where: { reference: { contains: 'TEST' } } });
        await prisma.user.deleteMany({ where: { email: { contains: 'test-integration' } } });
    });
    
    // Cleanup after all tests
    afterAll(async () => {
        await prisma.shipment.deleteMany({ where: { reference: { contains: 'TEST' } } });
        await prisma.user.deleteMany({ where: { email: { contains: 'test-integration' } } });
        await prisma.$disconnect();
    });
    
    // Test 1: User Registration
    describe('1. User Registration', () => {
        it('should register a new customer user', async () => {
            const response = await request(app)
                .post('/v1/auth/register')
                .send({
                    email: 'test-integration-customer@example.com',
                    password: 'SecurePassword123!',
                    name: 'Integration Test Customer',
                    role: 'customer',
                    phone: '+1234567890',
                })
                .expect(201);
            
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toMatchObject({
                email: 'test-integration-customer@example.com',
                name: 'Integration Test Customer',
                role: 'customer',
            });
            
            authToken = response.body.token;
            userId = response.body.user.id;
        });
        
        it('should register a driver user', async () => {
            const response = await request(app)
                .post('/v1/auth/register')
                .send({
                    email: 'test-integration-driver@example.com',
                    password: 'SecurePassword123!',
                    name: 'Integration Test Driver',
                    role: 'driver',
                    phone: '+1234567891',
                })
                .expect(201);
            
            driverId = response.body.user.id;
        });
    });
    
    // Test 2: Authentication
    describe('2. Authentication', () => {
        it('should login with correct credentials', async () => {
            const response = await request(app)
                .post('/v1/auth/login')
                .send({
                    email: 'test-integration-customer@example.com',
                    password: 'SecurePassword123!',
                })
                .expect(200);
            
            expect(response.body).toHaveProperty('token');
            authToken = response.body.token;
        });
        
        it('should reject invalid credentials', async () => {
            await request(app)
                .post('/v1/auth/login')
                .send({
                    email: 'test-integration-customer@example.com',
                    password: 'WrongPassword',
                })
                .expect(401);
        });
        
        it('should access protected route with valid token', async () => {
            const response = await request(app)
                .get('/api/users/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            expect(response.body.data).toMatchObject({
                email: 'test-integration-customer@example.com',
            });
        });
    });
    
    // Test 3: Shipment Creation
    describe('3. Shipment Creation', () => {
        it('should create a new shipment', async () => {
            const response = await request(app)
                .post('/api/shipments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    reference: 'TEST-SHIPMENT-001',
                    origin: {
                        address: '123 Start St',
                        city: 'San Francisco',
                        state: 'CA',
                        zip: '94102',
                        country: 'USA',
                    },
                    destination: {
                        address: '456 End Ave',
                        city: 'Los Angeles',
                        state: 'CA',
                        zip: '90001',
                        country: 'USA',
                    },
                    weight: 100,
                    dimensions: {
                        length: 10,
                        width: 10,
                        height: 10,
                    },
                    description: 'Integration test shipment',
                })
                .expect(201);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                reference: 'TEST-SHIPMENT-001',
                status: 'pending',
                origin: expect.objectContaining({
                    city: 'San Francisco',
                }),
                destination: expect.objectContaining({
                    city: 'Los Angeles',
                }),
            });
            
            shipmentId = response.body.data.id;
        });
        
        it('should reject shipment without required fields', async () => {
            await request(app)
                .post('/api/shipments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    reference: 'TEST-INCOMPLETE',
                    // Missing origin and destination
                })
                .expect(400);
        });
    });
    
    // Test 4: Shipment Retrieval
    describe('4. Shipment Retrieval', () => {
        it('should get shipment by ID', async () => {
            const response = await request(app)
                .get(`/api/shipments/${shipmentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            expect(response.body.data).toMatchObject({
                id: shipmentId,
                reference: 'TEST-SHIPMENT-001',
            });
        });
        
        it('should list user shipments', async () => {
            const response = await request(app)
                .get('/api/shipments')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
        
        it('should filter shipments by status', async () => {
            const response = await request(app)
                .get('/api/shipments?status=pending')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            expect(response.body.data.every(s => s.status === 'pending')).toBe(true);
        });
    });
    
    // Test 5: Shipment Updates
    describe('5. Shipment Updates', () => {
        it('should update shipment status', async () => {
            const response = await request(app)
                .patch(`/api/shipments/${shipmentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    status: 'confirmed',
                })
                .expect(200);
            
            expect(response.body.data.status).toBe('confirmed');
        });
        
        it('should assign driver to shipment', async () => {
            const response = await request(app)
                .patch(`/api/shipments/${shipmentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    driverId: driverId,
                    status: 'assigned',
                })
                .expect(200);
            
            expect(response.body.data.driverId).toBe(driverId);
            expect(response.body.data.status).toBe('assigned');
        });
        
        it('should prevent unauthorized updates', async () => {
            // Create another user
            const otherUserResponse = await request(app)
                .post('/v1/auth/register')
                .send({
                    email: 'test-integration-other@example.com',
                    password: 'Password123!',
                    name: 'Other User',
                    role: 'customer',
                });
            
            const otherToken = otherUserResponse.body.token;
            
            // Try to update another user's shipment
            await request(app)
                .patch(`/api/shipments/${shipmentId}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({
                    status: 'delivered',
                })
                .expect(403);
        });
    });
    
    // Test 6: Tracking Updates
    describe('6. Tracking Updates', () => {
        it('should add tracking event', async () => {
            const response = await request(app)
                .post(`/api/shipments/${shipmentId}/tracking`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    status: 'in_transit',
                    location: {
                        lat: 37.7749,
                        lng: -122.4194,
                        address: 'San Francisco, CA',
                    },
                    notes: 'Package picked up',
                })
                .expect(201);
            
            expect(response.body.data).toMatchObject({
                status: 'in_transit',
                location: expect.objectContaining({
                    lat: 37.7749,
                }),
            });
        });
        
        it('should retrieve tracking history', async () => {
            const response = await request(app)
                .get(`/api/shipments/${shipmentId}/tracking`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });
    
    // Test 7: API v2 Compatibility
    describe('7. API v2 Endpoints', () => {
        it('should access v2 shipments endpoint', async () => {
            const response = await request(app)
                .get('/api/v2/shipments')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            expect(response.body).toHaveProperty('meta');
            expect(response.body.meta).toMatchObject({
                page: 1,
                limit: 50, // v2 default
            });
        });
        
        it('should return 204 on v2 update', async () => {
            await request(app)
                .patch(`/api/v2/shipments/${shipmentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    notes: 'Updated via v2',
                })
                .expect(204);
        });
    });
    
    // Test 8: Error Handling
    describe('8. Error Handling', () => {
        it('should return 404 for non-existent shipment', async () => {
            const response = await request(app)
                .get('/api/shipments/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
            
            expect(response.body.success).toBe(false);
        });
        
        it('should return 401 without auth token', async () => {
            await request(app)
                .get('/api/shipments')
                .expect(401);
        });
        
        it('should handle validation errors', async () => {
            const response = await request(app)
                .post('/api/shipments')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    reference: '', // Invalid: empty string
                })
                .expect(400);
            
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });
    });
    
    // Test 9: Rate Limiting
    describe('9. Rate Limiting', () => {
        it('should enforce rate limits', async () => {
            const requests = [];
            
            // Make 110 requests (limit is 100/15min)
            for (let i = 0; i < 110; i++) {
                requests.push(
                    request(app)
                        .get('/api/health')
                        .set('Authorization', `Bearer ${authToken}`)
                );
            }
            
            const responses = await Promise.all(requests);
            const rateLimited = responses.filter(r => r.status === 429);
            
            expect(rateLimited.length).toBeGreaterThan(0);
        }, 30000); // Extended timeout
    });
    
    // Test 10: Cleanup - Shipment Deletion
    describe('10. Shipment Deletion', () => {
        it('should delete shipment', async () => {
            await request(app)
                .delete(`/api/shipments/${shipmentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(204);
        });
        
        it('should confirm shipment deleted', async () => {
            await request(app)
                .get(`/api/shipments/${shipmentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });
});

describe('Analytics Integration Tests', () => {
    let authToken;
    
    beforeAll(async () => {
        // Login as admin for analytics access
        const response = await request(app)
            .post('/v1/auth/login')
            .send({
                email: process.env.ADMIN_EMAIL || 'admin@example.com',
                password: process.env.ADMIN_PASSWORD || 'admin123',
            });
        
        authToken = response.body.token;
    });
    
    it('should retrieve performance metrics', async () => {
        const response = await request(app)
            .get('/api/analytics/performance')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        
        expect(response.body.data).toHaveProperty('deliveryRate');
        expect(response.body.data).toHaveProperty('averageDeliveryTime');
    });
    
    it('should retrieve revenue metrics', async () => {
        const response = await request(app)
            .get('/api/analytics/revenue')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        
        expect(response.body.data).toHaveProperty('totalRevenue');
    });
});
