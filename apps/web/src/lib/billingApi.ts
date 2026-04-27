import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

export type BillingPlan = 'starter' | 'professional' | 'enterprise';
export type BillingInterval = 'month' | 'year';

export type BillingStatus = {
  stripeCustomerId: string | null;
  hasStripeCustomer: boolean;
};

export type AiUsageSummary = {
  carrierId: string;
  actionCount: number;
  documentScans: number;
  voiceMinutes: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
};

type ApiEnvelope<T> = {
  data: T;
};

type RequestContext = {
  tenantId: string;
  role: string;
};

function getHeaders(context: RequestContext) {
  return {
    'x-tenant-id': context.tenantId,
    'x-user-role': context.role || 'dispatcher',
  };
}

export async function getBillingStatus(context: RequestContext): Promise<BillingStatus> {
  const response = await api.get<ApiEnvelope<BillingStatus>>('/api/billing/status', {
    headers: getHeaders(context),
  });

  return response.data.data;
}

export async function createCheckoutSession(
  context: RequestContext,
  plan: BillingPlan,
  billingInterval: BillingInterval,
): Promise<string> {
  const response = await api.post<ApiEnvelope<{ url: string }>>(
    '/api/billing/checkout-session',
    { plan, billingInterval },
    { headers: getHeaders(context) },
  );

  return response.data.data.url;
}

export async function createCustomerPortalSession(context: RequestContext): Promise<string> {
  const response = await api.post<ApiEnvelope<{ url: string }>>(
    '/api/billing/customer-portal',
    {},
    { headers: getHeaders(context) },
  );

  return response.data.data.url;
}

export async function getAiUsageSummary(context: RequestContext): Promise<AiUsageSummary> {
  const response = await api.get<ApiEnvelope<AiUsageSummary>>('/api/ai-usage/summary', {
    headers: getHeaders(context),
  });

  return response.data.data;
}

export function getBillingErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') {
      return message;
    }

    if (error.message) {
      return error.message;
    }
  }

  return error instanceof Error ? error.message : 'Unexpected billing error';
}
