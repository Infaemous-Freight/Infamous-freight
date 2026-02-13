/**
 * S3 Client Tests
 * Tests for AWS S3 client initialization and configuration
 */

jest.mock('@aws-sdk/client-s3');

const { s3Client, bucketName, publicUrlForKey } = require('../../storage/s3');
const { S3Client } = require('@aws-sdk/client-s3');

describe('S3 Client', () => {
    let originalEnv;

    beforeAll(() => {
        originalEnv = { ...process.env };
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        process.env.STORAGE_ACCESS_KEY_ID = 'test-access-key';
        process.env.STORAGE_SECRET_ACCESS_KEY = 'test-secret-key';
        process.env.STORAGE_BUCKET = 'test-bucket';
        process.env.STORAGE_PUBLIC_BASE_URL = 'https://cdn.example.com';
        process.env.STORAGE_REGION = 'us-west-2';
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    describe('Client Initialization', () => {
        it('should initialize S3 client', () => {
            const client = s3Client();
            
            expect(S3Client).toHaveBeenCalled();
            expect(client).toBeDefined();
        });

        it('should use configured region', () => {
            process.env.STORAGE_REGION = 'eu-central-1';
            
            s3Client();
            
            expect(S3Client).toHaveBeenCalledWith(
                expect.objectContaining({
                    region: 'eu-central-1',
                })
            );
        });

        it('should default region to auto', () => {
            delete process.env.STORAGE_REGION;
            
            s3Client();
            
            expect(S3Client).toHaveBeenCalledWith(
                expect.objectContaining({
                    region: 'auto',
                })
            );
        });

        it('should configure credentials', () => {
            s3Client();
            
            expect(S3Client).toHaveBeenCalledWith(
                expect.objectContaining({
                    credentials: {
                        accessKeyId: 'test-access-key',
                        secretAccessKey: 'test-secret-key',
                    },
                })
            );
        });
    });

    describe('Endpoint Configuration', () => {
        it('should use custom endpoint when provided', () => {
            process.env.STORAGE_ENDPOINT = 'https://r2.cloudflare.com';
            
            s3Client();
            
            expect(S3Client).toHaveBeenCalledWith(
                expect.objectContaining({
                    endpoint: 'https://r2.cloudflare.com',
                })
            );
        });

        it('should enable path style for custom endpoints', () => {
            process.env.STORAGE_ENDPOINT = 'https://minio.example.com';
            
            s3Client();
            
            expect(S3Client).toHaveBeenCalledWith(
                expect.objectContaining({
                    forcePathStyle: true,
                })
            );
        });

        it('should not use path style without endpoint', () => {
            delete process.env.STORAGE_ENDPOINT;
            
            s3Client();
            
            expect(S3Client).toHaveBeenCalledWith(
                expect.objectContaining({
                    forcePathStyle: false,
                })
            );
        });
    });

    describe('Required Environment Variables', () => {
        it('should throw on missing access key', () => {
            delete process.env.STORAGE_ACCESS_KEY_ID;
            
            expect(() => s3Client()).toThrow('Missing STORAGE_ACCESS_KEY_ID');
        });

        it('should throw on missing secret key', () => {
            delete process.env.STORAGE_SECRET_ACCESS_KEY;
            
            expect(() => s3Client()).toThrow('Missing STORAGE_SECRET_ACCESS_KEY');
        });

        it('should throw on missing bucket name', () => {
            delete process.env.STORAGE_BUCKET;
            
            expect(() => bucketName()).toThrow('Missing STORAGE_BUCKET');
        });

        it('should throw on missing public base URL', () => {
            delete process.env.STORAGE_PUBLIC_BASE_URL;
            
            expect(() => publicUrlForKey('test.jpg')).toThrow('Missing STORAGE_PUBLIC_BASE_URL');
        });
    });

    describe('Bucket Name', () => {
        it('should return configured bucket name', () => {
            const name = bucketName();
            
            expect(name).toBe('test-bucket');
        });

        it('should handle different bucket names', () => {
            process.env.STORAGE_BUCKET = 'production-assets';
            
            const name = bucketName();
            
            expect(name).toBe('production-assets');
        });
    });

    describe('Public URL Generation', () => {
        it('should generate public URL for key', () => {
            const url = publicUrlForKey('images/test.jpg');
            
            expect(url).toBe('https://cdn.example.com/images/test.jpg');
        });

        it('should strip trailing slashes from base URL', () => {
            process.env.STORAGE_PUBLIC_BASE_URL = 'https://cdn.example.com//';
            
            const url = publicUrlForKey('test.jpg');
            
            expect(url).toBe('https://cdn.example.com/test.jpg');
        });

        it('should handle keys with leading slashes', () => {
            const url = publicUrlForKey('/documents/file.pdf');
            
            expect(url).toBe('https://cdn.example.com//documents/file.pdf');
        });

        it('should handle nested paths', () => {
            const url = publicUrlForKey('pod/123/signature/abc.png');
            
            expect(url).toBe('https://cdn.example.com/pod/123/signature/abc.png');
        });
    });

    describe('Client Reusability', () => {
        it('should create client instances', () => {
            const client1 = s3Client();
            const client2 = s3Client();
            
            expect(S3Client).toHaveBeenCalledTimes(2);
        });

        it('should use consistent configuration', () => {
            s3Client();
            s3Client();
            
            const calls = S3Client.mock.calls;
            expect(calls[0][0].region).toBe(calls[1][0].region);
        });
    });

    describe('Error Handling', () => {
        it('should provide clear error messages', () => {
            delete process.env.STORAGE_ACCESS_KEY_ID;
            
            expect(() => s3Client()).toThrow(/Missing STORAGE_ACCESS_KEY_ID/);
        });

        it('should handle empty credentials', () => {
            process.env.STORAGE_ACCESS_KEY_ID = '';
            
            expect(() => s3Client()).toThrow();
        });

        it('should handle empty bucket name', () => {
            process.env.STORAGE_BUCKET = '';
            
            expect(() => bucketName()).toThrow();
        });
    });
});
