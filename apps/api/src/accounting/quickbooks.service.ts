import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface QBOConnection {
  carrierId: string;
  realmId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  companyName: string;
}

export interface QBOInvoice {
  customerName: string;
  customerId?: string;
  lineItems: Array<{
    description: string;
    amount: number;
    detailType: string;
  }>;
  memo?: string;
  docNumber?: string;
  dueDate?: string;
  totalAmount: number;
}

export interface ChartMapping {
  revenueAccount: string;
  fuelExpenseAccount: string;
  maintenanceExpenseAccount: string;
  insuranceExpenseAccount: string;
  tollExpenseAccount: string;
  lumperExpenseAccount: string;
  detentionIncomeAccount: string;
  accountsReceivable: string;
}

@Injectable()
export class QuickBooksService {
  private readonly logger = new Logger(QuickBooksService.name);
  private connections: Map<string, QBOConnection> = new Map();
  private readonly API_BASE = 'https://quickbooks.api.intuit.com';
  private readonly AUTH_BASE = 'https://oauth.platform.intuit.com';

  constructor(private readonly http: HttpService) {}

  getOAuthUrl(clientId: string, redirectUri: string, state: string): string {
    const scopes = [
      'com.intuit.quickbooks.accounting',
      'com.intuit.quickbooks.payment',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      state,
    });

    return `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
  }

  async exchangeCode(code: string, clientId: string, clientSecret: string, redirectUri: string): Promise<{
    accessToken: string;
    refreshToken: string;
    realmId: string;
    expiresIn: number;
  }> {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await firstValueFrom(
      this.http.post(
        `${this.AUTH_BASE}/oauth2/v1/tokens/bearer`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }).toString(),
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      realmId: response.data.realmId,
      expiresIn: response.data.expires_in,
    };
  }

  async saveConnection(carrierId: string, connection: QBOConnection): Promise<void> {
    this.connections.set(carrierId, connection);
    this.logger.log(`QuickBooks connected for carrier ${carrierId}: ${connection.companyName}`);
  }

  async getConnection(carrierId: string): Promise<QBOConnection | null> {
    return this.connections.get(carrierId) || null;
  }

  async syncInvoice(carrierId: string, invoice: QBOInvoice): Promise<{ qboInvoiceId: string; syncStatus: string }> {
    const conn = await this.getConnection(carrierId);
    if (!conn) throw new Error('QuickBooks not connected');

    const response = await firstValueFrom(
      this.http.post(
        `${this.API_BASE}/v3/company/${conn.realmId}/invoice`,
        {
          CustomerRef: { name: invoice.customerName },
          Line: invoice.lineItems.map(item => ({
            DetailType: 'SalesItemLineDetail',
            Amount: item.amount,
            SalesItemLineDetail: {
              ItemRef: { name: item.description },
            },
          })),
          DocNumber: invoice.docNumber,
          Memo: invoice.memo,
          DueDate: invoice.dueDate,
        },
        {
          headers: {
            Authorization: `Bearer ${conn.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    this.logger.log(`Invoice synced to QBO: ${response.data.Invoice?.Id}`);

    return {
      qboInvoiceId: response.data.Invoice?.Id,
      syncStatus: 'success',
    };
  }

  async getAccounts(carrierId: string): Promise<Array<{ id: string; name: string; type: string }>> {
    const conn = await this.getConnection(carrierId);
    if (!conn) return [];

    const response = await firstValueFrom(
      this.http.get(
        `${this.API_BASE}/v3/company/${conn.realmId}/query?query=select * from Account maxresults 1000`,
        {
          headers: { Authorization: `Bearer ${conn.accessToken}` },
        },
      ),
    );

    return (response.data.QueryResponse?.Account || []).map((a: any) => ({
      id: a.Id,
      name: a.Name,
      type: a.AccountType,
    }));
  }

  async getMonthlyPnl(carrierId: string, year: number, month: number): Promise<{
    revenue: number;
    expenses: number;
    netIncome: number;
    byCategory: Record<string, number>;
  }> {
    const conn = await this.getConnection(carrierId);
    if (!conn) return { revenue: 0, expenses: 0, netIncome: 0, byCategory: {} };

    // Query P&L report from QBO
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const response = await firstValueFrom(
      this.http.get(
        `${this.API_BASE}/v3/company/${conn.realmId}/reports/ProfitAndLoss`,
        {
          headers: { Authorization: `Bearer ${conn.accessToken}` },
          params: { start_date: startDate, end_date: endDate },
        },
      ),
    );

    const report = response.data;
    // Parse QBO P&L response structure
    return {
      revenue: report.Rows?.Row?.find((r: any) => r.group === 'Income')?.Summary?.ColData?.[1]?.value || 0,
      expenses: report.Rows?.Row?.find((r: any) => r.group === 'Expenses')?.Summary?.ColData?.[1]?.value || 0,
      netIncome: report.Rows?.Row?.find((r: any) => r.group === 'Net Income')?.Summary?.ColData?.[1]?.value || 0,
      byCategory: {},
    };
  }

  async saveChartMapping(carrierId: string, mapping: ChartMapping): Promise<void> {
    // In production: save to database
    this.logger.log(`Chart mapping saved for carrier ${carrierId}`);
  }
}
