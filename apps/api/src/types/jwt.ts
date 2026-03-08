export type JwtClaims = {
  sub: string;
  email: string;
  organizationId: string;
  role: string;
  scopes: string[];
};
