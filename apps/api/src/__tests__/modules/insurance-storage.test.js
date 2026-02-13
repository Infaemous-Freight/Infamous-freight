/**
 * Insurance Storage Tests
 * Tests for insurance certificate storage operations
 */

jest.mock('../../db/prisma', () => ({
    prisma: {
        insuranceCertificate: {
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            findUnique: jest.fn(),
        },
    },
}));

const { listCertificates, createCertificate } = require('../../modules/insurance/storage');
const { prisma } = require('../../db/prisma');

describe('Insurance Storage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('List Certificates', () => {
        it('should list certificates for organization', async () => {
            prisma.insuranceCertificate.findMany.mockResolvedValue([
                { id: 'cert_1', orgId: 'org_123' },
                { id: 'cert_2', orgId: 'org_123' },
            ]);

            const result = await listCertificates({ orgId: 'org_123' });

            expect(result).toHaveLength(2);
            expect(prisma.insuranceCertificate.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ orgId: 'org_123' }),
                })
            );
        });

        it('should filter by carrier ID when provided', async () => {
            prisma.insuranceCertificate.findMany.mockResolvedValue([
                { id: 'cert_1', carrierId: 'carrier_123' },
            ]);

            await listCertificates({ orgId: 'org_123', carrierId: 'carrier_123' });

            expect(prisma.insuranceCertificate.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        orgId: 'org_123',
                        carrierId: 'carrier_123',
                    }),
                })
            );
        });

        it('should not filter by carrier when not provided', async () => {
            prisma.insuranceCertificate.findMany.mockResolvedValue([]);

            await listCertificates({ orgId: 'org_123' });

            const callArgs = prisma.insuranceCertificate.findMany.mock.calls[0][0];
            expect(callArgs.where.carrierId).toBeUndefined();
        });

        it('should order by creation date descending', async () => {
            prisma.insuranceCertificate.findMany.mockResolvedValue([]);

            await listCertificates({ orgId: 'org_123' });

            expect(prisma.insuranceCertificate.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { createdAt: 'desc' },
                })
            );
        });
    });

    describe('Create Certificate', () => {
        it('should create insurance certificate', async () => {
            prisma.insuranceCertificate.create.mockResolvedValue({
                id: 'cert_123',
                status: 'PENDING',
            });

            const certificateData = {
                orgId: 'org_123',
                carrierId: 'carrier_456',
                coverageType: 'LIABILITY',
                documentUrl: 'https://cdn.example.com/cert.pdf',
                providerName: 'Acme Insurance',
                policyNumber: 'POL-123456',
                effectiveDate: new Date('2024-01-01'),
                expirationDate: new Date('2024-12-31'),
                limitsJson: { liability: 1000000 },
                extractedJson: { extracted: true },
                actorUserId: 'user_789',
            };

            const result = await createCertificate(certificateData);

            expect(result).toBeDefined();
            expect(prisma.insuranceCertificate.create).toHaveBeenCalled();
        });

        it('should set status to PENDING', async () => {
            prisma.insuranceCertificate.create.mockResolvedValue({
                id: 'cert_123',
                status: 'PENDING',
            });

            await createCertificate({
                orgId: 'org_123',
                carrierId: 'carrier_456',
                coverageType: 'LIABILITY',
                documentUrl: 'https://cdn.example.com/cert.pdf',
                providerName: 'Acme Insurance',
                policyNumber: 'POL-123456',
                effectiveDate: new Date(),
                expirationDate: new Date(),
                limitsJson: {},
                extractedJson: {},
                actorUserId: 'user_789',
            });

            expect(prisma.insuranceCertificate.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ status: 'PENDING' }),
                })
            );
        });

        it('should include all certificate fields', async () => {
            prisma.insuranceCertificate.create.mockResolvedValue({
                id: 'cert_123',
            });

            await createCertificate({
                orgId: 'org_123',
                carrierId: 'carrier_456',
                coverageType: 'LIABILITY',
                documentUrl: 'https://cdn.example.com/cert.pdf',
                providerName: 'Acme Insurance',
                policyNumber: 'POL-123456',
                effectiveDate: new Date('2024-01-01'),
                expirationDate: new Date('2024-12-31'),
                limitsJson: { liability: 1000000 },
                extractedJson: { extracted: true },
                actorUserId: 'user_789',
            });

            const callArgs = prisma.insuranceCertificate.create.mock.calls[0][0];
            expect(callArgs.data.orgId).toBe('org_123');
            expect(callArgs.data.carrierId).toBe('carrier_456');
            expect(callArgs.data.coverageType).toBe('LIABILITY');
            expect(callArgs.data.providerName).toBe('Acme Insurance');
        });

        it('should store JSON fields', async () => {
            prisma.insuranceCertificate.create.mockResolvedValue({
                id: 'cert_123',
            });

            const limitsJson = { liability: 1000000, cargo: 500000 };
            const extractedJson = { fields: ['provider', 'policy'] };

            await createCertificate({
                orgId: 'org_123',
                carrierId: 'carrier_456',
                coverageType: 'LIABILITY',
                documentUrl: 'https://cdn.example.com/cert.pdf',
                providerName: 'Acme Insurance',
                policyNumber: 'POL-123456',
                effectiveDate: new Date(),
                expirationDate: new Date(),
                limitsJson,
                extractedJson,
                actorUserId: 'user_789',
            });

            const callArgs = prisma.insuranceCertificate.create.mock.calls[0][0];
            expect(callArgs.data.limitsJson).toEqual(limitsJson);
            expect(callArgs.data.extractedJson).toEqual(extractedJson);
        });
    });

    describe('Prisma Requirement', () => {
        it('should check Prisma availability', async () => {
            await listCertificates({ orgId: 'org_123' });

            expect(prisma).toBeDefined();
        });

        it('should use Prisma client', async () => {
            await createCertificate({
                orgId: 'org_123',
                carrierId: 'carrier_456',
                coverageType: 'LIABILITY',
                documentUrl: 'https://cdn.example.com/cert.pdf',
                providerName: 'Acme Insurance',
                policyNumber: 'POL-123456',
                effectiveDate: new Date(),
                expirationDate: new Date(),
                limitsJson: {},
                extractedJson: {},
                actorUserId: 'user_789',
            });

            expect(prisma.insuranceCertificate.create).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors on list', async () => {
            prisma.insuranceCertificate.findMany.mockRejectedValue(
                new Error('Database error')
            );

            await expect(
                listCertificates({ orgId: 'org_123' })
            ).rejects.toThrow('Database error');
        });

        it('should handle database errors on create', async () => {
            prisma.insuranceCertificate.create.mockRejectedValue(
                new Error('Database error')
            );

            await expect(
                createCertificate({
                    orgId: 'org_123',
                    carrierId: 'carrier_456',
                    coverageType: 'LIABILITY',
                    documentUrl: 'https://cdn.example.com/cert.pdf',
                    providerName: 'Acme Insurance',
                    policyNumber: 'POL-123456',
                    effectiveDate: new Date(),
                    expirationDate: new Date(),
                    limitsJson: {},
                    extractedJson: {},
                    actorUserId: 'user_789',
                })
            ).rejects.toThrow('Database error');
        });
    });

    describe('Coverage Types', () => {
        it('should support LIABILITY coverage', async () => {
            prisma.insuranceCertificate.create.mockResolvedValue({
                id: 'cert_123',
            });

            await createCertificate({
                orgId: 'org_123',
                carrierId: 'carrier_456',
                coverageType: 'LIABILITY',
                documentUrl: 'https://cdn.example.com/cert.pdf',
                providerName: 'Acme Insurance',
                policyNumber: 'POL-123456',
                effectiveDate: new Date(),
                expirationDate: new Date(),
                limitsJson: {},
                extractedJson: {},
                actorUserId: 'user_789',
            });

            const callArgs = prisma.insuranceCertificate.create.mock.calls[0][0];
            expect(callArgs.data.coverageType).toBe('LIABILITY');
        });

        it('should support other coverage types', async () => {
            prisma.insuranceCertificate.create.mockResolvedValue({
                id: 'cert_123',
            });

            await createCertificate({
                orgId: 'org_123',
                carrierId: 'carrier_456',
                coverageType: 'CARGO',
                documentUrl: 'https://cdn.example.com/cert.pdf',
                providerName: 'Acme Insurance',
                policyNumber: 'POL-123456',
                effectiveDate: new Date(),
                expirationDate: new Date(),
                limitsJson: {},
                extractedJson: {},
                actorUserId: 'user_789',
            });

            const callArgs = prisma.insuranceCertificate.create.mock.calls[0][0];
            expect(callArgs.data.coverageType).toBe('CARGO');
        });
    });
});
