type Environment = "development" | "test" | "production";

export interface ApiConfig {
  host: string;
  port: string;
  url: string;
  basePath: string;
  corsOrigins: string[];
  environment: Environment;
}

export interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  successUrl: string;
  cancelUrl: string;
  enabled: boolean;
}

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  returnUrl: string;
  cancelUrl: string;
  enabled: boolean;
}

export class Config {
  public readonly nodeEnv: Environment;
  public readonly isDevelopment: boolean;
  public readonly isProduction: boolean;

  constructor(private readonly env: NodeJS.ProcessEnv = process.env) {
    this.nodeEnv = this.detectEnvironment();
    this.isDevelopment = this.nodeEnv === "development";
    this.isProduction = this.nodeEnv === "production";
  }

  getApiConfig(): ApiConfig {
    const port = this.getEnv("PORT", this.getEnv("API_PORT", "4000"));
    const host = this.getEnv("API_HOST", "0.0.0.0");
    const basePath = this.getEnv("API_BASE_PATH", "/api");
    const url = this.getEnv("API_URL", `http://localhost:${port}`);

    return {
      host,
      port,
      url,
      basePath,
      corsOrigins: this.getCorsOrigins(),
      environment: this.nodeEnv,
    };
  }

  getDatabaseUrl(): string {
    return this.requireEnv("DATABASE_URL");
  }

  getCorsOrigins(): string[] {
    const raw = this.getEnv("CORS_ORIGINS", "http://localhost:3000");
    return raw
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  getApiKeys() {
    const paypalSecret = this.requireEnv("PAYPAL_SECRET");
    const keys = {
      openai: this.requireEnv("OPENAI_API_KEY"),
      anthropic: this.requireEnv("ANTHROPIC_API_KEY"),
      stripe: this.requireEnv(
        "STRIPE_SECRET_KEY",
        this.getEnv("STRIPE_API_KEY"),
      ),
      stripeWebhookSecret: this.requireEnv("STRIPE_WEBHOOK_SECRET"),
      paypalClientId: this.requireEnv("PAYPAL_CLIENT_ID"),
      paypalClientSecret: paypalSecret,
      paypalSecret: paypalSecret,
      aiSyntheticUrl: this.requireEnv("AI_SYNTHETIC_ENGINE_URL"),
      aiSyntheticKey: this.requireEnv("AI_SYNTHETIC_API_KEY"),
    };

    return keys;
  }

  getJwtSecret(): string {
    return this.requireEnv("JWT_SECRET");
  }

  getLogLevel(): string {
    const customLevel = this.getEnv("LOG_LEVEL", "");
    if (customLevel) return customLevel;

    return this.isProduction ? "error" : "debug";
  }

  getStripeConfig(): StripeConfig {
    const secretKey = this.getEnv(
      "STRIPE_SECRET_KEY",
      this.getEnv("STRIPE_API_KEY"),
    );
    const publishableKey = this.getEnv("STRIPE_PUBLISHABLE_KEY", "");
    const successUrl = this.getEnv("STRIPE_SUCCESS_URL", "");
    const cancelUrl = this.getEnv("STRIPE_CANCEL_URL", "");

    return {
      secretKey,
      publishableKey,
      successUrl,
      cancelUrl,
      enabled: Boolean(secretKey),
    };
  }

  getPayPalConfig(): PayPalConfig {
    const clientId = this.getEnv("PAYPAL_CLIENT_ID", "");
    const clientSecret = this.getEnv(
      "PAYPAL_CLIENT_SECRET",
      this.getEnv("PAYPAL_SECRET", ""),
    );
    const returnUrl = this.getEnv("PAYPAL_RETURN_URL", "");
    const cancelUrl = this.getEnv("PAYPAL_CANCEL_URL", "");

    return {
      clientId,
      clientSecret,
      returnUrl,
      cancelUrl,
      enabled: Boolean(clientId && clientSecret),
    };
  }

  requireEnv(key: string, defaultValue?: string): string {
    const value = this.env[key];
    if (value === undefined || value === null || value === "") {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Missing required environment variable: ${key}`);
    }

    return value;
  }

  getEnv(key: string, defaultValue = ""): string {
    const value = this.env[key];
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }

    return value;
  }

  getBoolean(key: string, defaultValue = false): boolean {
    const raw = this.env[key];
    if (raw === undefined || raw === null || raw === "") {
      return defaultValue;
    }

    const normalized = raw.toString().trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
    return defaultValue;
  }

  getNumber(key: string, defaultValue = 0): number {
    const raw = this.env[key];
    if (raw === undefined || raw === null || raw === "") {
      return defaultValue;
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }

  private detectEnvironment(): Environment {
    const value = this.env.NODE_ENV?.toLowerCase() as Environment | undefined;
    if (value === "production" || value === "test") {
      return value;
    }
    return "development";
  }
}

export const config = new Config();

export const nodeEnv = config.nodeEnv;
export const isDevelopment = config.isDevelopment;
export const isProduction = config.isProduction;

export default config;
