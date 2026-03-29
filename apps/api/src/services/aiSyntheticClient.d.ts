export declare const aiSyntheticClient: {
  generateLead(params: Record<string, unknown>): Promise<unknown>;
  generateOutreach(params: Record<string, unknown>): Promise<unknown>;
  chat: {
    completions: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create(params: Record<string, unknown>): Promise<any>;
    };
  };
  [key: string]: unknown;
};
