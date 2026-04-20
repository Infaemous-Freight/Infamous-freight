import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Samsara ELD Integration
 * API Docs: https://developers.samsara.com/
 */
@Injectable()
export class SamsaraService {
  private readonly logger = new Logger(SamsaraService.name);
  private readonly API_BASE = 'https://api.samsara.com';

  constructor(private readonly http: HttpService) {}

  async syncDrivers(accessToken: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.API_BASE}/fleet/v1/drivers`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      this.logger.log(`Synced ${response.data.drivers?.length || 0} Samsara drivers`);
    } catch (err) {
      this.logger.error('Samsara sync failed:', err.message);
    }
  }

  async getDriverIds(accessToken: string): Promise<string[]> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.API_BASE}/fleet/v1/drivers`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      return (response.data.data || []).map((d: any) => d.id);
    } catch (err) {
      this.logger.error('Samsara getDriverIds failed:', err.message);
      return [];
    }
  }

  async getDriverHOS(accessToken: string, driverId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.API_BASE}/fleet/v1/hos/clocks`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { driverId },
        }),
      );
      return response.data;
    } catch (err) {
      this.logger.error(`Samsara HOS failed for driver ${driverId}:`, err.message);
      return null;
    }
  }

  async getDriverLocation(accessToken: string, driverId: string): Promise<{ lat: number; lng: number; timestamp: Date } | null> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.API_BASE}/fleet/v1/drivers/locations`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { driverIds: driverId },
        }),
      );
      const loc = response.data.data?.[0];
      if (!loc) return null;
      return {
        lat: loc.latitude,
        lng: loc.longitude,
        timestamp: new Date(loc.time),
      };
    } catch (err) {
      this.logger.error(`Samsara location failed for driver ${driverId}:`, err.message);
      return null;
    }
  }
}
