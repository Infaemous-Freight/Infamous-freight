import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Motive (formerly KeepTruckin) ELD Integration
 * API Docs: https://developer.gomotive.com/
 */
@Injectable()
export class MotiveService {
  private readonly logger = new Logger(MotiveService.name);
  private readonly API_BASE = 'https://api.gomotive.com';

  constructor(private readonly http: HttpService) {}

  async syncDrivers(accessToken: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.API_BASE}/v1/drivers`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      this.logger.log(`Synced ${response.data.drivers?.length || 0} Motive drivers`);
    } catch (err) {
      this.logger.error('Motive sync failed:', err.message);
    }
  }

  async getDriverIds(accessToken: string): Promise<string[]> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.API_BASE}/v1/drivers`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { per_page: 100 },
        }),
      );
      return (response.data.drivers || []).map((d: any) => d.id?.toString());
    } catch (err) {
      this.logger.error('Motive getDriverIds failed:', err.message);
      return [];
    }
  }

  async getDriverHOS(accessToken: string, driverId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.API_BASE}/v1/drivers/${driverId}/hos`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      return response.data;
    } catch (err) {
      this.logger.error(`Motive HOS fetch failed for driver ${driverId}:`, err.message);
      return null;
    }
  }

  async getDriverLocation(accessToken: string, driverId: string): Promise<{ lat: number; lng: number; timestamp: Date } | null> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.API_BASE}/v1/drivers/${driverId}/locations`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { limit: 1 },
        }),
      );
      const loc = response.data.locations?.[0];
      if (!loc) return null;
      return {
        lat: parseFloat(loc.latitude),
        lng: parseFloat(loc.longitude),
        timestamp: new Date(loc.recorded_at),
      };
    } catch (err) {
      this.logger.error(`Motive location failed for driver ${driverId}:`, err.message);
      return null;
    }
  }

  // Motive uses OAuth 2.0
  getOAuthUrl(clientId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'drivers:read hos:read locations:read',
      state,
    });
    return `${this.API_BASE}/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string, clientId: string, clientSecret: string, redirectUri: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await firstValueFrom(
      this.http.post(`${this.API_BASE}/oauth/token`, {
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    );
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
    };
  }
}
