import {
  configuredIntegration,
  disabledIntegration,
  type IntegrationHealthCheck,
  type IntegrationProvider,
} from '../types';

export type AccountingProviderName = 'quickbooks' | 'xero' | 'mock-accounting';

export interface AccountingCustomer {
  id?: string;
  name: string;
  email?: string;
}

export interface AccountingInvoiceLine {
  description: string;
  quantity: number;
  unitAmountCents: number;
}

export interface AccountingInvoiceRequest {
  invoiceId: string;
  customer: AccountingCustomer;
  currency: 'USD';
  lines: AccountingInvoiceLine[];
  dueDate?: string;
  memo?: string;
}

export interface AccountingInvoiceResult {
  provider: AccountingProviderName;
  status: 'skipped' | 'synced' | 'failed';
  externalInvoiceId?: string;
  message?: string;
}

export interface AccountingProvider extends IntegrationProvider {
  providerName: AccountingProviderName;
  syncInvoice(request: AccountingInvoiceRequest): Promise<AccountingInvoiceResult>;
}

export abstract class EnvGatedAccountingProvider implements AccountingProvider {
  abstract providerName: AccountingProviderName;
  readonly category = 'accounting' as const;

  protected constructor(private readonly requiredEnvKeys: string[]) {}

  isConfigured(): boolean {
    return this.requiredEnvKeys.every((key) => Boolean(process.env[key]?.trim()));
  }

  async healthCheck(): Promise<IntegrationHealthCheck> {
    if (!this.isConfigured()) {
      return disabledIntegration(
        this.providerName,
        this.category,
        `${this.providerName} accounting is disabled because one or more required environment variables are missing.`,
      );
    }

    return configuredIntegration(
      this.providerName,
      this.category,
      `${this.providerName} accounting configuration is present. Run a provider smoke test before enabling production sync.`,
    );
  }

  abstract syncInvoice(request: AccountingInvoiceRequest): Promise<AccountingInvoiceResult>;
}
