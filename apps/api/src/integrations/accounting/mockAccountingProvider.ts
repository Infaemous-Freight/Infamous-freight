import {
  EnvGatedAccountingProvider,
  type AccountingInvoiceRequest,
  type AccountingInvoiceResult,
} from './accountingProvider';

export class MockAccountingProvider extends EnvGatedAccountingProvider {
  providerName = 'mock-accounting' as const;

  constructor() {
    super([]);
  }

  override isConfigured(): boolean {
    return true;
  }

  async syncInvoice(request: AccountingInvoiceRequest): Promise<AccountingInvoiceResult> {
    return {
      provider: this.providerName,
      status: 'synced',
      externalInvoiceId: `mock-${request.invoiceId}`,
      message: 'Mock accounting provider synced the invoice for local and CI testing.',
    };
  }
}

export const mockAccountingProvider = new MockAccountingProvider();
