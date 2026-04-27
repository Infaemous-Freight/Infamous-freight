export type QuoteLike = {
  status?: unknown;
  [key: string]: unknown;
};

export class FreightWorkflowRuleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function assertQuoteCanConvertToLoad(quoteRequest: QuoteLike): void {
  if (quoteRequest.status !== 'approved') {
    throw new FreightWorkflowRuleError(
      'quote_request_not_approved',
      'Quote request must be approved before it can be converted into a load.',
    );
  }
}
