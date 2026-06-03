import {
  EnvGatedAccountingProvider,
  type AccountingInvoiceRequest,
  type AccountingInvoiceResult,
} from './accountingProvider';

export class QuickBooksProvider extends EnvGatedAccountingProvider {
  providerName = 'quickbooks' as const;

  constructor() {
    super(['QBO_CLIENT_ID', 'QBO_CLIENT_SECRET']);
  }

  async syncInvoice(_request: AccountingInvoiceRequest): Promise<AccountingInvoiceResult> {
    if (!this.isConfigured()) {
      return {
        provider: this.providerName,
        status: 'skipped',
        message: 'QuickBooks invoice sync skipped because required configuration is missing.',
      };
    }

    throw new Error('QuickBooks invoice sync requires OAuth connection and approved endpoint mapping before live sync is enabled.');
  }
}

export const quickBooksProvider = new QuickBooksProvider();
