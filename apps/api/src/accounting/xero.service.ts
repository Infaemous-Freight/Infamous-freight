import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface XeroConnection {
  carrierId: string;
  tenantId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tenantName: string;
}

@Injectable()
export class XeroService {
  private readonly logger = new Logger(XeroService.name);
  private connections: Map<string, XeroConnection> = new Map();
  private readonly API_BASE = 'https://api.xero.com/api.xro/2.0';

  constructor(private readonly http: HttpService) {}

  getOAuthUrl(clientId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'accounting.transactions openid profile email accounting.settings accounting.contacts offline_access',
      state,
    });
    return `https://login.xero.com/identity/connect/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string, clientId: string, clientSecret: string, redirectUri: string): Promise<{
    accessToken: string;
    refreshToken: string;
    tenantId: string;
  }> {
    const response = await firstValueFrom(
      this.http.post(
        'https://identity.xero.com/connect/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }).toString(),
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );

    // Get tenants
    const tenantResponse = await firstValueFrom(
      this.http.get('https://api.xero.com/connections', {
        headers: { Authorization: `Bearer ${response.data.access_token}` },
      }),
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      tenantId: tenantResponse.data[0]?.tenantId,
    };
  }

  async saveConnection(carrierId: string, connection: XeroConnection): Promise<void> {
    this.connections.set(carrierId, connection);
    this.logger.log(`Xero connected for carrier ${carrierId}: ${connection.tenantName}`);
  }

  async syncInvoice(carrierId: string, invoice: {
    contactName: string;
    lineItems: Array<{ description: string; quantity: number; unitAmount: number; accountCode: string }>;
    date: string;
    dueDate: string;
    reference?: string;
  }): Promise<{ xeroInvoiceId: string }> {
    const conn = this.connections.get(carrierId);
    if (!conn) throw new Error('Xero not connected');

    const response = await firstValueFrom(
      this.http.post(
        `${this.API_BASE}/Invoices`,
        {
          Invoices: [{
            Type: 'ACCREC',
            Contact: { Name: invoice.contactName },
            LineItems: invoice.lineItems,
            Date: invoice.date,
            DueDate: invoice.dueDate,
            Reference: invoice.reference,
            Status: 'AUTHORISED',
          }],
        },
        {
          headers: {
            Authorization: `Bearer ${conn.accessToken}`,
            'Xero-tenant-id': conn.tenantId,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return { xeroInvoiceId: response.data.Invoices?.[0]?.InvoiceID };
  }
}
