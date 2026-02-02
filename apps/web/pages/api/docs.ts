import type { NextApiRequest, NextApiResponse } from "next";
import { withSecurity } from "../../lib/security";

interface APIDocsResponse {
  version: string;
  name: string;
  description: string;
  endpoints: Array<{
    path: string;
    method: string;
    description: string;
    authentication?: string;
    parameters?: Array<{
      name: string;
      type: string;
      required: boolean;
      description: string;
    }>;
    responses: Array<{
      status: number;
      description: string;
    }>;
  }>;
}

async function handler(_req: NextApiRequest, res: NextApiResponse<APIDocsResponse>) {
  const docs: APIDocsResponse = {
    version: "2.2.0",
    name: "Infamous Freight API",
    description:
      "Enterprise logistics and fleet management API with real-time tracking, AI-powered routing, and comprehensive analytics.",
    endpoints: [
      {
        path: "/api/health",
        method: "GET",
        description: "Get system health status and metrics",
        responses: [
          { status: 200, description: "System healthy" },
          { status: 503, description: "System degraded or unhealthy" },
        ],
      },
      {
        path: "/api/sitemap.xml",
        method: "GET",
        description: "Get XML sitemap for SEO",
        responses: [{ status: 200, description: "Sitemap generated successfully" }],
      },
      {
        path: "/api/docs",
        method: "GET",
        description: "Get API documentation (this endpoint)",
        responses: [{ status: 200, description: "Documentation retrieved successfully" }],
      },
    ],
  };

  res.status(200).json(docs);
}

export default withSecurity(handler);
