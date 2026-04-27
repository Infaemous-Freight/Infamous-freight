import {
  FreightWorkflowRuleError,
  assertQuoteCanConvertToLoad,
} from '../src/freight-workflow-rules';

describe('freight workflow rules', () => {
  it('allows approved quotes to convert into loads', () => {
    expect(() => assertQuoteCanConvertToLoad({ status: 'approved' })).not.toThrow();
  });

  it.each(['pending', 'reviewing', 'quoted', 'rejected', 'converted', undefined])(
    'blocks %s quotes from converting into loads',
    (status) => {
      expect(() => assertQuoteCanConvertToLoad({ status })).toThrow(FreightWorkflowRuleError);

      try {
        assertQuoteCanConvertToLoad({ status });
      } catch (error) {
        expect(error).toBeInstanceOf(FreightWorkflowRuleError);
        expect((error as FreightWorkflowRuleError).code).toBe('quote_request_not_approved');
      }
    },
  );
});
