export interface ELDProvider {
  fetchDriverData(driverId: string): Promise<NormalizedTelemetryEvent[]>;
}

export type NormalizedTelemetryEvent = {
  driverId: string;
  latitude: number;
  longitude: number;
  speedMph: number;
  status: "DRIVING" | "ON_DUTY" | "OFF_DUTY" | "SLEEPER";
  recordedAt: string;
};
