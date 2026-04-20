import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Omnitracs ELD Integration
 * API Docs: https://developer.omnitracs.com/
 */
@Injectable()
export class OmnitracsService {
  private readonly logger = new Logger(OmnitracsService.name);
  private readonly API_BASE = 'https://api.omnitracs.com';

  constructor(private readonly http: HttpService) {}

  async syncDrivers(accessToken: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.API_BASE}/qta/v1/drivers`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      this.logger.log(`Synced ${response.data.length || 0} Omnitracs drivers`);
    } catch (err) {
      this.logger.error('Omnitracs sync failed:', err.message);
    }
  }

  async getDriverIds(accessToken: string): Promise<string[]> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.API_BASE}/qta/v1/drivers`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      return (response.data || []).map((d: any) => d.personId);
    } catch (err) {
      this.logger.error('Omnitracs getDriverIds failed:', err.message);
      return [];
    }
  }

  async getDriverHOS(accessToken: string, driverId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.API_BASE}/qta/v1/drivers/${driverId}/hos`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      return response.data;
    } catch (err) {
      this.logger.error(`Omnitracs HOS failed for driver ${driverId}:`, err.message);
      return null;
    }
  }

  async getDriverLocation(accessToken: string, driverId: string): Promise<{ lat: number; lng: number; timestamp: Date } | null> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.API_BASE}/qta/v1/drivers/${driverId}/location`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      const loc = response.data;
      if (!loc?.latitude) return null;
      return {
        lat: parseFloat(loc.latitude),
        lng: parseFloat(loc.longitude),
        timestamp: new Date(loc.dateTime),
      };
    } catch (err) {
      this.logger.error(`Omnitracs location failed for driver ${driverId}:`, err.message);
      return null;
    }
  }
}
