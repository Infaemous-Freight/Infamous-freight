import type { NextApiRequest, NextApiResponse } from "next";

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  node: string;
  checks: {
    supabase: boolean;
  };
  metrics: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse<HealthResponse>) {
  const startTime = Date.now();

  try {
    const supabaseUrlPresent = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const supabaseAnonPresent = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const supabaseHealthy = supabaseUrlPresent && supabaseAnonPresent;

    // Get memory metrics
    const memUsage = process.memoryUsage();
    const memTotal = memUsage.heapTotal;
    const memUsed = memUsage.heapUsed;
    const memPercentage = (memUsed / memTotal) * 100;

    const health: HealthResponse = {
      status: supabaseHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || "2.2.0",
      environment: process.env.NODE_ENV || "production",
      node: process.version,
      checks: {
        supabase: supabaseHealthy,
      },
      metrics: {
        memory: {
          used: Math.round(memUsed / 1024 / 1024), // MB
          total: Math.round(memTotal / 1024 / 1024), // MB
          percentage: Math.round(memPercentage),
        },
      },
    };

    // Set cache headers
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const responseTime = Date.now() - startTime;
    res.setHeader("X-Response-Time", `${responseTime}ms`);
    res.setHeader("X-Health-Status", health.status);

    const status = health.status === "healthy" ? 200 : 503;
    return res.status(status).json(health);
  } catch {
    // Health check failed - return unhealthy status
    const health: HealthResponse = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || "2.2.0",
      environment: process.env.NODE_ENV || "production",
      node: process.version,
      checks: {
        supabase: false,
      },
      metrics: {
        memory: {
          used: 0,
          total: 0,
          percentage: 0,
        },
      },
    };

    return res.status(503).json(health);
  }
}
