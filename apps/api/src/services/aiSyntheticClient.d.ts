export declare const aiSyntheticClient: {
  generateLead(params: Record<string, unknown>): Promise<unknown>;
  generateOutreach(params: Record<string, unknown>): Promise<unknown>;
  chat: {
    completions: {
      create(params: Record<string, unknown>): Promise<any>;
    };
  };
  [key: string]: unknown;
};
