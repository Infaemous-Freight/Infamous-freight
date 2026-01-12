export type UUID = string;

export interface HealthStatus {
  ok: boolean;
  service: string;
  ts: string;
}

export * from "./types";
export * from "./constants";
export * from "./utils";
export * from "./env";
