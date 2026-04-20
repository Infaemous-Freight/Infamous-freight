import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Geotab ELD Integration
 * API Docs: https://geotab.github.io/sdk/software/api/reference/
 */
@Injectable()
export class GeotabService {
  private readonly logger = new Logger(GeotabService.name);

  constructor(private readonly http: HttpService) {}

  private getApiUrl(database: string): string {
    return `https://${database}.geotab.com/v1`;
  }

  async syncDrivers(accessToken: string): Promise<void> {
    try {
      const { credentials, database } = JSON.parse(accessToken); // Geotab uses session credentials
      const response = await firstValueFrom(
        this.http.post(this.getApiUrl(database), {
          method: 'Get',
          params: { typeName: 'Driver', resultsLimit: 1000 },
          credentials,
        }),
      );
      this.logger.log(`Synced ${response.data.result?.length || 0} Geotab drivers`);
    } catch (err) {
      this.logger.error('Geotab sync failed:', err.message);
    }
  }

  async getDriverIds(accessToken: string): Promise<string[]> {
    try {
      const { credentials, database } = JSON.parse(accessToken);
      const response = await firstValueFrom(
        this.http.post(this.getApiUrl(database), {
          method: 'Get',
          params: { typeName: 'Driver', resultsLimit: 1000 },
          credentials,
        }),
      );
      return (response.data.result || []).map((d: any) => d.id);
    } catch (err) {
      this.logger.error('Geotab getDriverIds failed:', err.message);
      return [];
    }
  }

  async getDriverHOS(accessToken: string, driverId: string): Promise<any> {
    try {
      const { credentials, database } = JSON.parse(accessToken);
      const response = await firstValueFrom(
        this.http.post(this.getApiUrl(database), {
          method: 'Get',
          params: {
            typeName: 'DutyStatusLog',
            search: { driver: { id: driverId } },
            resultsLimit: 100,
          },
          credentials,
        }),
      );
      return { driver: { id: driverId }, logs: response.data.result };
    } catch (err) {
      this.logger.error(`Geotab HOS failed for driver ${driverId}:`, err.message);
      return null;
    }
  }

  async getDriverLocation(accessToken: string, driverId: string): Promise<{ lat: number; lng: number; timestamp: Date } | null> {
    try {
      const { credentials, database } = JSON.parse(accessToken);
      // Get the driver's device, then device location
      const deviceResponse = await firstValueFrom(
        this.http.post(this.getApiUrl(database), {
          method: 'Get',
          params: {
            typeName: 'Device',
            search: { driver: { id: driverId } },
            resultsLimit: 1,
          },
          credentials,
        }),
      );

      const deviceId = deviceResponse.data.result?.[0]?.id;
      if (!deviceId) return null;

      const locResponse = await firstValueFrom(
        this.http.post(this.getApiUrl(database), {
          method: 'Get',
          params: {
            typeName: 'DeviceStatusInfo',
            search: { device: { id: deviceId } },
            resultsLimit: 1,
          },
          credentials,
        }),
      );

      const loc = locResponse.data.result?.[0];
      if (!loc) return null;

      return {
        lat: loc.latitude,
        lng: loc.longitude,
        timestamp: new Date(loc.dateTime),
      };
    } catch (err) {
      this.logger.error(`Geotab location failed for driver ${driverId}:`, err.message);
      return null;
    }
  }

  // Geotab uses authentication via my.geotab.com
  async authenticate(database: string, username: string, password: string): Promise<{ sessionId: string; database: string }> {
    const response = await firstValueFrom(
      this.http.post(this.getApiUrl(database), {
        method: 'Authenticate',
        params: { database, userName: username, password },
      }),
    );
    return {
      sessionId: response.data.result.credentials.sessionId,
      database: response.data.result.path,
    };
  }
}
