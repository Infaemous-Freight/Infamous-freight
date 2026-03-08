declare namespace Express {
  export interface Request {
    auth?: {
      sub: string;
      email: string;
      organizationId: string;
      role: string;
      scopes: string[];
    };
    requestId?: string;
  }
}
