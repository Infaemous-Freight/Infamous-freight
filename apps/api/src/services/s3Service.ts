/**
 * AWS S3 Document Storage Service
 * Handles file uploads, downloads, and signed URLs for secure document access
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import logger from "../utils/logger.js";

interface S3Config {
  region: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

interface UploadOptions {
  key: string;
  contentType?: string;
  metadata?: Record<string, string>;
  expirationDays?: number;
}

interface SignedUrlOptions {
  key: string;
  expirationSeconds?: number;
  operation?: "GET" | "PUT";
}

class S3Service {
  private client: S3Client | null = null;
  private bucket: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || "";
    this.initializeClient();
  }

  private initializeClient(): void {
    const region = process.env.AWS_REGION || "us-east-1";
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      logger.warn("AWS S3 credentials not configured - S3 service disabled");
      return;
    }

    try {
      this.client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      logger.info("AWS S3 client initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize S3 client", { error });
    }
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    fileBuffer: Buffer,
    options: UploadOptions,
  ): Promise<{ key: string; url: string; size: number }> {
    if (!this.client) {
      logger.warn("S3 not configured - upload skipped", { key: options.key });
      return { key: options.key, url: "", size: 0 };
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: options.key,
        Body: fileBuffer,
        ContentType: options.contentType || "application/octet-stream",
        Metadata: {
          ...options.metadata,
          "uploaded-at": new Date().toISOString(),
        },
      });

      await this.client.send(command);

      const fileUrl = `s3://${this.bucket}/${options.key}`;
      logger.info("File uploaded to S3", {
        key: options.key,
        size: fileBuffer.length,
        url: fileUrl,
      });

      return {
        key: options.key,
        url: fileUrl,
        size: fileBuffer.length,
      };
    } catch (error) {
      logger.error("Failed to upload file to S3", {
        error: error instanceof Error ? error.message : String(error),
        key: options.key,
      });
      throw error;
    }
  }

  /**
   * Generate signed URL for temporary access
   */
  async getSignedUrl(options: SignedUrlOptions): Promise<string> {
    if (!this.client) {
      logger.warn("S3 not configured - cannot generate signed URL", {
        key: options.key,
      });
      return "";
    }

    try {
      const operation = options.operation || "GET";
      const expirationSeconds = options.expirationSeconds || 3600; // 1 hour default

      const command =
        operation === "GET"
          ? new GetObjectCommand({
              Bucket: this.bucket,
              Key: options.key,
            })
          : new PutObjectCommand({
              Bucket: this.bucket,
              Key: options.key,
            });

      const signedUrl = await getSignedUrl(this.client, command as any, {
        expiresIn: expirationSeconds,
      });

      logger.info("Signed URL generated", {
        key: options.key,
        operation,
        expiresIn: expirationSeconds,
      });

      return signedUrl;
    } catch (error) {
      logger.error("Failed to generate signed URL", {
        error: error instanceof Error ? error.message : String(error),
        key: options.key,
      });
      throw error;
    }
  }

  /**
   * Check if object exists in S3
   */
  async objectExists(key: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      if ((error as any)?.name === "NotFound" || (error as any)?.Code === "NoSuchKey") {
        return false;
      }
      logger.error("Error checking object existence", {
        error: error instanceof Error ? error.message : String(error),
        key,
      });
      return false;
    }
  }

  /**
   * Get object metadata
   */
  async getObjectMetadata(key: string): Promise<Record<string, unknown> | null> {
    if (!this.client) {
      return null;
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);
      return {
        size: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        metadata: response.Metadata,
        etag: response.ETag,
      };
    } catch (error) {
      logger.error("Failed to get object metadata", {
        error: error instanceof Error ? error.message : String(error),
        key,
      });
      return null;
    }
  }
}

export const s3Service = new S3Service();
export default s3Service;
