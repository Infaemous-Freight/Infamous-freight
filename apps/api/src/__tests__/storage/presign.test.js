/**
 * Presigned URL Tests
 * Tests for S3 presigned URL generation for file uploads
 */

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('../../storage/s3');

const { presignPodUpload } = require('../../storage/presign');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, bucketName, publicUrlForKey } = require('../../storage/s3');

describe('Presigned URL Generation', () => {
    let originalEnv;

    beforeAll(() => {
        originalEnv = { ...process.env };
    });

    beforeEach(() => {
        jest.clearAllMocks();

        s3Client.mockReturnValue({ config: {} });
        bucketName.mockReturnValue('test-bucket');
        publicUrlForKey.mockImplementation((key) => `https://cdn.example.com/${key}`);
        getSignedUrl.mockResolvedValue('https://s3.aws.com/presigned-upload-url');

        process.env.STORAGE_PRESIGN_TTL_SECONDS = '900';
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    describe('POD Upload Presigning', () => {
        it('should generate presigned upload URL for POD', async () => {
            const result = await presignPodUpload({
                jobId: 'job_123',
                kind: 'signature',
                mimeType: 'image/jpeg',
            });

            expect(result).toHaveProperty('uploadUrl');
            expect(result).toHaveProperty('key');
            expect(result).toHaveProperty('publicUrl');
            expect(result).toHaveProperty('expiresInSeconds');
        });

        it('should include job ID in key', async () => {
            const result = await presignPodUpload({
                jobId: 'job_456',
                kind: 'signature',
                mimeType: 'image/png',
            });

            expect(result.key).toMatch(/pod\/job_456\//);
        });

        it('should include kind in key', async () => {
            const result = await presignPodUpload({
                jobId: 'job_123',
                kind: 'photo',
                mimeType: 'image/jpeg',
            });

            expect(result.key).toMatch(/\/photo\//);
        });

        it('should add random component to key', async () => {
            const result1 = await presignPodUpload({
                jobId: 'job_123',
                kind: 'signature',
                mimeType: 'image/jpeg',
            });

            const result2 = await presignPodUpload({
                jobId: 'job_123',
                kind: 'signature',
                mimeType: 'image/jpeg',
            });

            expect(result1.key).not.toBe(result2.key);
        });
    });

    describe('File Extension Mapping', () => {
        it('should use .jpg for JPEG images', async () => {
            const result = await presignPodUpload({
                jobId: 'job_123',
                kind: 'signature',
                mimeType: 'image/jpeg',
            });

            expect(result.key).toMatch(/\.jpg$/);
        });

        it('should use .png for PNG images', async () => {
            const result = await presignPodUpload({
                jobId: 'job_123',
                kind: 'signature',
                mimeType: 'image/png',
            });

            expect(result.key).toMatch(/\.png$/);
        });

        it('should use .webp for WebP images', async () => {
            const result = await presignPodUpload({
                jobId: 'job_123',
                kind: 'signature',
                mimeType: 'image/webp',
            });

            expect(result.key).toMatch(/\.webp$/);
        });

        it('should use .pdf for PDF documents', async () => {
            const result = await presignPodUpload({
                jobId: 'job_123',
                kind: 'document',
                mimeType: 'application/pdf',
            });

            expect(result.key).toMatch(/\.pdf$/);
        });

        it('should use .svg for SVG images', async () => {
            const result = await presignPodUpload({
                jobId: 'job_123',
                kind: 'logo',
                mimeType: 'image/svg+xml',
            });

            expect(result.key).toMatch(/\.svg$/);
        });

        it('should handle no extension for unknown MIME types', async () => {
            const result = await presignPodUpload({
                jobId: 'job_123',
                kind: 'file',
                mimeType: 'application/octet-stream',
            });

            expect(result.key).not.toMatch(/\.\w+$/);
        });
    });

    describe('TTL Configuration', () => {
        it('should use configured TTL', async () => {
            process.env.STORAGE_PRESIGN_TTL_SECONDS = '600';

            const result = await presignPodUpload({
                jobId: 'job_123',
                kind: 'signature',
                mimeType: 'image/jpeg',
            });

            expect(result.expiresInSeconds).toBe(600);
        });

        it('should default to 900 seconds', async () => {
            delete process.env.STORAGE_PRESIGN_TTL_SECONDS;

            const result = await presignPodUpload({
                jobId: 'job_123',
                kind: 'signature',
                mimeType: 'image/jpeg',
            });

            expect(result.expiresInSeconds).toBe(900);
        });

        it('should pass TTL to signed URL generator', async () => {
            process.env.STORAGE_PRESIGN_TTL_SECONDS = '1800';

            await presignPodUpload({
                jobId: 'job_123',
                kind: 'signature',
                mimeType: 'image/jpeg',
            });

            expect(getSignedUrl).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                expect.objectContaining({ expiresIn: 1800 })
            );
        });
    });

    describe('Public URL Generation', () => {
        it('should generate public URL from key', async () => {
            publicUrlForKey.mockReturnValue('https://cdn.example.com/pod/job_123/signature/abc.jpg');

            const result = await presignPodUpload({
                jobId: 'job_123',
                kind: 'signature',
                mimeType: 'image/jpeg',
            });

            expect(result.publicUrl).toMatch(/^https:\/\//);
        });

        it('should call publicUrlForKey with generated key', async () => {
            const result = await presignPodUpload({
                jobId: 'job_123',
                kind: 'signature',
                mimeType: 'image/jpeg',
            });

            expect(publicUrlForKey).toHaveBeenCalledWith(result.key);
        });
    });

    describe('S3 Command Configuration', () => {
        it('should set correct content type', async () => {
            await presignPodUpload({
                jobId: 'job_123',
                kind: 'signature',
                mimeType: 'image/png',
            });

            const { PutObjectCommand } = require('@aws-sdk/client-s3');
            expect(PutObjectCommand).toHaveBeenCalledWith(
                expect.objectContaining({
                    ContentType: 'image/png',
                })
            );
        });

        it('should use configured bucket', async () => {
            bucketName.mockReturnValue('production-bucket');

            await presignPodUpload({
                jobId: 'job_123',
                kind: 'signature',
                mimeType: 'image/jpeg',
            });

            const { PutObjectCommand } = require('@aws-sdk/client-s3');
            expect(PutObjectCommand).toHaveBeenCalledWith(
                expect.objectContaining({
                    Bucket: 'production-bucket',
                })
            );
        });
    });

    describe('Error Handling', () => {
        it('should handle S3 client errors', async () => {
            getSignedUrl.mockRejectedValue(new Error('S3 unavailable'));

            await expect(
                presignPodUpload({
                    jobId: 'job_123',
                    kind: 'signature',
                    mimeType: 'image/jpeg',
                })
            ).rejects.toThrow('S3 unavailable');
        });

        it('should handle missing parameters', async () => {
            await presignPodUpload({
                jobId: null,
                kind: 'signature',
                mimeType: 'image/jpeg',
            });

            expect(getSignedUrl).toHaveBeenCalled();
        });
    });

    describe('Key Format', () => {
        it('should follow pod/{jobId}/{kind}/{random}{ext} pattern', async () => {
            const result = await presignPodUpload({
                jobId: 'job_789',
                kind: 'delivery-photo',
                mimeType: 'image/jpeg',
            });

            expect(result.key).toMatch(/^pod\/job_789\/delivery-photo\/[a-f0-9]{20}\.jpg$/);
        });

        it('should generate unique keys', async () => {
            const keys = new Set();

            for (let i = 0; i < 10; i++) {
                const result = await presignPodUpload({
                    jobId: 'job_123',
                    kind: 'signature',
                    mimeType: 'image/jpeg',
                });
                keys.add(result.key);
            }

            expect(keys.size).toBe(10);
        });
    });
});
