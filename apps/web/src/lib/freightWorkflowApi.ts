import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

export type FreightOperationResource =
  | 'quoteRequests'
  | 'loadAssignments'
  | 'loadDispatches'
  | 'shipmentTracking'
  | 'deliveryConfirmations'
  | 'carrierPayments'
  | 'rateAgreements'
  | 'operationalMetrics'
  | 'loadBoardPosts';

export type LaunchValidationResult = {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  detail?: string;
};

type ApiEnvelope<T> = {
  data: T;
  count?: number;
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

export async function listFreightOperations<T>(
  resource: FreightOperationResource,
  context: RequestContext,
): Promise<T[]> {
  const response = await api.get<ApiEnvelope<T[]>>(`/api/freight-operations/${resource}`, {
    headers: getHeaders(context),
  });

  return response.data.data;
}

export async function createFreightOperation<T>(
  resource: FreightOperationResource,
  context: RequestContext,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await api.post<ApiEnvelope<T>>(`/api/freight-operations/${resource}`, payload, {
    headers: getHeaders(context),
  });

  return response.data.data;
}

export async function updateFreightOperation<T>(
  resource: FreightOperationResource,
  context: RequestContext,
  id: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await api.patch<ApiEnvelope<T>>(`/api/freight-operations/${resource}/${id}`, payload, {
    headers: getHeaders(context),
  });

  return response.data.data;
}

export async function convertQuoteToLoad<T>(
  context: RequestContext,
  quoteRequestId: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await api.post<ApiEnvelope<T>>(
    `/api/workflows/quotes/${quoteRequestId}/convert-to-load`,
    payload,
    { headers: getHeaders(context) },
  );

  return response.data.data;
}

export async function respondToLoadAssignment<T>(
  context: RequestContext,
  assignmentId: string,
  decision: 'accepted' | 'rejected',
  payload: Record<string, unknown> = {},
): Promise<T> {
  const response = await api.post<ApiEnvelope<T>>(
    `/api/workflows/load-assignments/${assignmentId}/${decision}`,
    payload,
    { headers: getHeaders(context) },
  );

  return response.data.data;
}

export async function confirmDispatch<T>(
  context: RequestContext,
  dispatchId: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const response = await api.post<ApiEnvelope<T>>(
    `/api/workflows/dispatches/${dispatchId}/confirm`,
    payload,
    { headers: getHeaders(context) },
  );

  return response.data.data;
}

export async function recordTrackingUpdate<T>(
  context: RequestContext,
  loadId: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await api.post<ApiEnvelope<T>>(
    `/api/workflows/loads/${loadId}/tracking-updates`,
    payload,
    { headers: getHeaders(context) },
  );

  return response.data.data;
}

export async function verifyDelivery<T>(
  context: RequestContext,
  loadId: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await api.post<ApiEnvelope<T>>(
    `/api/workflows/loads/${loadId}/verify-delivery`,
    payload,
    { headers: getHeaders(context) },
  );

  return response.data.data;
}

export async function updateCarrierPaymentStatus<T>(
  context: RequestContext,
  paymentId: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await api.post<ApiEnvelope<T>>(
    `/api/workflows/carrier-payments/${paymentId}/status`,
    payload,
    { headers: getHeaders(context) },
  );

  return response.data.data;
}

export async function rollupOperationalMetrics<T>(
  context: RequestContext,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await api.post<ApiEnvelope<T>>(
    '/api/workflows/operational-metrics/rollup',
    payload,
    { headers: getHeaders(context) },
  );

  return response.data.data;
}

export async function updateLoadBoardPostStatus<T>(
  context: RequestContext,
  postId: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await api.post<ApiEnvelope<T>>(
    `/api/workflows/load-board-posts/${postId}/status`,
    payload,
    { headers: getHeaders(context) },
  );

  return response.data.data;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') {
      return message;
    }

    if (error.message) {
      return error.message;
    }
  }

  return error instanceof Error ? error.message : 'Unexpected API error';
}
