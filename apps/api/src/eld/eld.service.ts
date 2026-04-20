import { Injectable, Logger } from '@nestjs/common';
import { SamsaraService } from './samsara.service';
import { MotiveService } from './motive.service';
import { OmnitracsService } from './omnitracs.service';
import { GeotabService } from './geotab.service';
import { UnifiedHOSAdapter, UnifiedDriverHOS, ELDProvider } from './unified-hos.adapter';

export interface ELDConnection {
  carrierId: string;
  provider: ELDProvider;
  accessToken: string;
  refreshToken?: string;
  connectedAt: Date;
  lastSyncAt?: Date;
  isActive: boolean;
}

@Injectable()
export class ELDService {
  private readonly logger = new Logger(ELDService.name);
  private connections: Map<string, ELDConnection> = new Map();

  constructor(
    private readonly samsara: SamsaraService,
    private readonly motive: MotiveService,
    private readonly omnitracs: OmnitracsService,
    private readonly geotab: GeotabService,
    private readonly adapter: UnifiedHOSAdapter,
  ) {}

  async connectProvider(carrierId: string, provider: ELDProvider, accessToken: string): Promise<ELDConnection> {
    const connection: ELDConnection = {
      carrierId,
      provider,
      accessToken,
      connectedAt: new Date(),
      isActive: true,
    };

    this.connections.set(carrierId, connection);
    this.logger.log(`Carrier ${carrierId} connected ${provider} ELD`);

    // Initial sync
    await this.syncHOSData(carrierId);

    return connection;
  }

  async syncHOSData(carrierId: string): Promise<void> {
    const conn = this.connections.get(carrierId);
    if (!conn || !conn.isActive) {
      this.logger.warn(`No active ELD connection for carrier ${carrierId}`);
      return;
    }

    try {
      switch (conn.provider) {
        case 'samsara':
          await this.samsara.syncDrivers(conn.accessToken);
          break;
        case 'motive':
          await this.motive.syncDrivers(conn.accessToken);
          break;
        case 'omnitracs':
          await this.omnitracs.syncDrivers(conn.accessToken);
          break;
        case 'geotab':
          await this.geotab.syncDrivers(conn.accessToken);
          break;
      }

      conn.lastSyncAt = new Date();
      this.logger.log(`HOS synced for carrier ${carrierId} via ${conn.provider}`);
    } catch (err) {
      this.logger.error(`HOS sync failed for carrier ${carrierId}:`, err.message);
    }
  }

  async getDriverHOS(carrierId: string, driverId: string): Promise<UnifiedDriverHOS> {
    const conn = this.connections.get(carrierId);
    if (!conn) throw new Error('No ELD connection found');

    let rawHOS: any;

    switch (conn.provider) {
      case 'samsara':
        rawHOS = await this.samsara.getDriverHOS(conn.accessToken, driverId);
        break;
      case 'motive':
        rawHOS = await this.motive.getDriverHOS(conn.accessToken, driverId);
        break;
      case 'omnitracs':
        rawHOS = await this.omnitracs.getDriverHOS(conn.accessToken, driverId);
        break;
      case 'geotab':
        rawHOS = await this.geotab.getDriverHOS(conn.accessToken, driverId);
        break;
      default:
        throw new Error(`Unknown provider: ${conn.provider}`);
    }

    return this.adapter.normalize(rawHOS, conn.provider);
  }

  async getAllDriversHOS(carrierId: string): Promise<UnifiedDriverHOS[]> {
    const conn = this.connections.get(carrierId);
    if (!conn) return [];

    let driverIds: string[] = [];

    switch (conn.provider) {
      case 'samsara':
        driverIds = await this.samsara.getDriverIds(conn.accessToken);
        break;
      case 'motive':
        driverIds = await this.motive.getDriverIds(conn.accessToken);
        break;
      case 'omnitracs':
        driverIds = await this.omnitracs.getDriverIds(conn.accessToken);
        break;
      case 'geotab':
        driverIds = await this.geotab.getDriverIds(conn.accessToken);
        break;
    }

    return Promise.all(driverIds.map(id => this.getDriverHOS(carrierId, id)));
  }

  async getDriverLocation(carrierId: string, driverId: string): Promise<{ lat: number; lng: number; timestamp: Date } | null> {
    const conn = this.connections.get(carrierId);
    if (!conn) return null;

    switch (conn.provider) {
      case 'samsara':
        return this.samsara.getDriverLocation(conn.accessToken, driverId);
      case 'motive':
        return this.motive.getDriverLocation(conn.accessToken, driverId);
      case 'omnitracs':
        return this.omnitracs.getDriverLocation(conn.accessToken, driverId);
      case 'geotab':
        return this.geotab.getDriverLocation(conn.accessToken, driverId);
      default:
        return null;
    }
  }

  async disconnect(carrierId: string): Promise<void> {
    this.connections.delete(carrierId);
    this.logger.log(`ELD disconnected for carrier ${carrierId}`);
  }

  getConnectedProvider(carrierId: string): ELDProvider | null {
    return this.connections.get(carrierId)?.provider || null;
  }
}
