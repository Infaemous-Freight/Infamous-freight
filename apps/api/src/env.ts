import dotenv from "dotenv";
dotenv.config();

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const ENV = {
  DATABASE_URL: req("DATABASE_URL"),
  JWT_SECRET: req("JWT_SECRET"),
  API_PORT: Number(process.env.API_PORT ?? 4000),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:3000"
};
