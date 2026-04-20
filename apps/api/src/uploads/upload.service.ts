/**
 * RECOMMENDATION: File Upload System
 * BOL (Bill of Lading) and POD (Proof of Delivery) document management
 * Uses Supabase Storage or S3-compatible storage
 */
import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    );
  }

  // Upload BOL (Bill of Lading)
  async uploadBOL(
    file: Buffer,
    fileName: string,
    loadId: string,
    mimeType: string
  ) {
    const key = `loads/${loadId}/bols/${uuidv4()}-${fileName}`;
    
    const { data, error } = await this.supabase.storage
      .from('documents')
      .upload(key, file, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = await this.supabase.storage
      .from('documents')
      .createSignedUrl(key, 60 * 60 * 24 * 7); // 7 days

    return {
      id: data.path,
      url: urlData?.signedUrl,
      type: 'BOL',
      loadId,
      uploadedAt: new Date().toISOString(),
    };
  }

  // Upload POD (Proof of Delivery)
  async uploadPOD(
    file: Buffer,
    fileName: string,
    loadId: string,
    mimeType: string,
    metadata?: {
      driverId?: string;
      deliveryTime?: string;
      recipientName?: string;
      recipientSignature?: string;
      notes?: string;
    }
  ) {
    const key = `loads/${loadId}/pods/${uuidv4()}-${fileName}`;
    
    const { data, error } = await this.supabase.storage
      .from('documents')
      .upload(key, file, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = await this.supabase.storage
      .from('documents')
      .createSignedUrl(key, 60 * 60 * 24 * 7);

    return {
      id: data.path,
      url: urlData?.signedUrl,
      type: 'POD',
      loadId,
      metadata,
      uploadedAt: new Date().toISOString(),
    };
  }

  // Upload rate confirmation
  async uploadRateConfirmation(
    file: Buffer,
    fileName: string,
    loadId: string,
    mimeType: string
  ) {
    const key = `loads/${loadId}/rate-confirmations/${uuidv4()}-${fileName}`;
    
    const { data, error } = await this.supabase.storage
      .from('documents')
      .upload(key, file, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = await this.supabase.storage
      .from('documents')
      .createSignedUrl(key, 60 * 60 * 24 * 7);

    return {
      id: data.path,
      url: urlData?.signedUrl,
      type: 'RATE_CONFIRMATION',
      loadId,
      uploadedAt: new Date().toISOString(),
    };
  }

  // Get documents for a load
  async getLoadDocuments(loadId: string) {
    const { data, error } = await this.supabase.storage
      .from('documents')
      .list(`loads/${loadId}`);

    if (error) throw error;
    return data;
  }

  // Delete document
  async deleteDocument(path: string) {
    const { error } = await this.supabase.storage
      .from('documents')
      .remove([path]);

    if (error) throw error;
    return { success: true };
  }

  // Get signed URL for document
  async getSignedUrl(path: string, expiresIn: number = 3600) {
    const { data, error } = await this.supabase.storage
      .from('documents')
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data?.signedUrl;
  }
}
