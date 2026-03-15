declare module "aws-sdk" {
  export class S3 {
    putObject(params: unknown): { promise(): Promise<unknown> };
  }

  const AWS: {
    S3: typeof S3;
  };

  export default AWS;
}

declare module "bullmq" {
  export class Worker {
    constructor(
      queueName: string,
      processor: (job: { data: { invoiceId: string } }) => Promise<void>,
      options?: unknown,
    );
  }
}

declare module "ioredis" {
  export default class IORedis {
    constructor(url?: string);
  }
}

declare module "pdfkit" {
  export default class PDFDocument {
    on(event: string, callback: (...args: any[]) => void): this;
    fontSize(size: number): this;
    text(content: string): this;
    moveDown(): this;
    end(): void;
  }
}

declare module "pg" {
  export class Pool {
    constructor(config?: unknown);
    query(queryText: string, values?: unknown[]): Promise<{ rows: Array<Record<string, unknown>> }>;
  }
}
