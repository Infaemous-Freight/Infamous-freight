import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';

type BaseRecord = {
  id: string;
  tenantId: string;
};

export type LoadRecord = BaseRecord & Record<string, unknown>;
export type DriverRecord = BaseRecord & Record<string, unknown>;
export type ShipmentRecord = BaseRecord & Record<string, unknown>;

type PrismaLoadRecord = {
  id: string;
  carrierId: string;
  driverId: string | null;
  brokerName: string;
  brokerMc: string | null;
  originCity: string;
  originState: string;
  originLat: number;
  originLng: number;
  destCity: string;
  destState: string;
  destLat: number;
  destLng: number;
  distance: number;
  rate: number;
  ratePerMile: number;
  equipmentType: string;
  weight: number;
  status: string;
  pickupDate: Date;
  deliveryDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaDriverRecord = {
  id: string;
  carrierId: string;
  name: string;
  phone: string | null;
  licenseNumber: string | null;
  licenseState: string | null;
  equipmentType: string | null;
  status: string;
  currentLat: number | null;
  currentLng: number | null;
  hosStatus: string;
  hoursRemaining: number;
  lastLocationAt: Date;
  createdAt: Date;
};

export interface DataStore {
  listLoads(tenantId: string): Promise<LoadRecord[]>;
  createLoad(tenantId: string, payload: Record<string, unknown>): Promise<LoadRecord>;
  listDrivers(tenantId: string): Promise<DriverRecord[]>;
  createDriver(tenantId: string, payload: Record<string, unknown>): Promise<DriverRecord>;
  listShipments(tenantId: string): Promise<ShipmentRecord[]>;
  createShipment(tenantId: string, payload: Record<string, unknown>): Promise<ShipmentRecord>;
  healthCheck(): Promise<'connected' | 'disconnected'>;
}

class MemoryDataStore implements DataStore {
  private loads: LoadRecord[] = [];
  private drivers: DriverRecord[] = [];
  private shipments: ShipmentRecord[] = [];

  async listLoads(tenantId: string): Promise<LoadRecord[]> {
    return this.loads.filter((item) => item.tenantId === tenantId);
  }

  async createLoad(tenantId: string, payload: Record<string, unknown>): Promise<LoadRecord> {
    const record = { id: randomUUID(), tenantId, ...payload };
    this.loads.push(record);
    return record;
  }

  async listDrivers(tenantId: string): Promise<DriverRecord[]> {
    return this.drivers.filter((item) => item.tenantId === tenantId);
  }

  async createDriver(tenantId: string, payload: Record<string, unknown>): Promise<DriverRecord> {
    const record = { id: randomUUID(), tenantId, ...payload };
    this.drivers.push(record);
    return record;
  }

  async listShipments(tenantId: string): Promise<ShipmentRecord[]> {
    return this.shipments.filter((item) => item.tenantId === tenantId);
  }

  async createShipment(tenantId: string, payload: Record<string, unknown>): Promise<ShipmentRecord> {
    const record = { id: randomUUID(), tenantId, ...payload };
    this.shipments.push(record);
    return record;
  }

  async healthCheck(): Promise<'connected' | 'disconnected'> {
    return 'connected';
  }
}

class PrismaDataStore implements DataStore {
  constructor(private readonly prisma: PrismaClient) {}

  async listLoads(tenantId: string): Promise<LoadRecord[]> {
    const loads = await this.prisma.load.findMany({
      where: { carrierId: tenantId },
      orderBy: { createdAt: 'desc' },
    }) as PrismaLoadRecord[];
    return loads.map((load: PrismaLoadRecord) => ({ ...load, tenantId: load.carrierId }));
  }

  async createLoad(tenantId: string, payload: Record<string, unknown>): Promise<LoadRecord> {
    const data = payload as {
      brokerName: string;
      originCity: string;
      originState: string;
      originLat: number;
      originLng: number;
      destCity: string;
      destState: string;
      destLat: number;
      destLng: number;
      distance: number;
      rate: number;
      ratePerMile: number;
      equipmentType: string;
      weight: number;
      pickupDate: string;
      status?: string;
      brokerMc?: string;
      notes?: string;
      deliveryDate?: string;
      driverId?: string;
    };

    const load = await this.prisma.load.create({
      data: {
        carrierId: tenantId,
        brokerName: data.brokerName,
        originCity: data.originCity,
        originState: data.originState,
        originLat: Number(data.originLat),
        originLng: Number(data.originLng),
        destCity: data.destCity,
        destState: data.destState,
        destLat: Number(data.destLat),
        destLng: Number(data.destLng),
        distance: Number(data.distance),
        rate: Number(data.rate),
        ratePerMile: Number(data.ratePerMile),
        equipmentType: data.equipmentType,
        weight: Number(data.weight),
        pickupDate: new Date(data.pickupDate),
        status: data.status,
        brokerMc: data.brokerMc,
        notes: data.notes,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
        driverId: data.driverId,
      },
    }) as PrismaLoadRecord;
    return { ...load, tenantId: load.carrierId };
  }

  async listDrivers(tenantId: string): Promise<DriverRecord[]> {
    const drivers = await this.prisma.driver.findMany({
      where: { carrierId: tenantId },
      orderBy: { createdAt: 'desc' },
    }) as PrismaDriverRecord[];
    return drivers.map((driver: PrismaDriverRecord) => ({
      ...driver,
      tenantId: driver.carrierId,
    }));
  }

  async createDriver(tenantId: string, payload: Record<string, unknown>): Promise<DriverRecord> {
    const data = payload as {
      name: string;
      phone?: string;
      licenseNumber?: string;
      licenseState?: string;
      equipmentType?: string;
      status?: string;
      currentLat?: number;
      currentLng?: number;
      hosStatus?: string;
      hoursRemaining?: number;
    };

    const driver = await this.prisma.driver.create({
      data: {
        carrierId: tenantId,
        name: data.name,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        licenseState: data.licenseState,
        equipmentType: data.equipmentType,
        status: data.status,
        currentLat: data.currentLat,
        currentLng: data.currentLng,
        hosStatus: data.hosStatus,
        hoursRemaining: data.hoursRemaining,
      },
    }) as PrismaDriverRecord;
    return { ...driver, tenantId: driver.carrierId };
  }

  async listShipments(tenantId: string): Promise<ShipmentRecord[]> {
    const loads: Array<{
      id: string;
      carrierId: string;
      brokerName: string;
      originCity: string;
      originState: string;
      destCity: string;
      destState: string;
      status: string;
      pickupDate: Date;
      deliveryDate: Date | null;
      rate: number;
    }> = await this.prisma.load.findMany({
      where: { carrierId: tenantId },
      select: {
        id: true,
        carrierId: true,
        brokerName: true,
        originCity: true,
        originState: true,
        destCity: true,
        destState: true,
        status: true,
        pickupDate: true,
        deliveryDate: true,
        rate: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return loads.map((load) => ({
      id: load.id,
      tenantId: load.carrierId,
      brokerName: load.brokerName,
      originCity: load.originCity,
      originState: load.originState,
      destCity: load.destCity,
      destState: load.destState,
      status: load.status,
      pickupDate: load.pickupDate,
      deliveryDate: load.deliveryDate,
      rate: load.rate,
    }));
  }

  async createShipment(tenantId: string, payload: Record<string, unknown>): Promise<ShipmentRecord> {
    const load = await this.createLoad(tenantId, payload);
    return {
      id: load.id,
      tenantId: load.tenantId,
      brokerName: load.brokerName,
      originCity: load.originCity,
      originState: load.originState,
      destCity: load.destCity,
      destState: load.destState,
      status: load.status,
      pickupDate: load.pickupDate,
      deliveryDate: load.deliveryDate ?? null,
      rate: load.rate,
    };
  }

  async healthCheck(): Promise<'connected' | 'disconnected'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }
}

let prismaClient: PrismaClient | null = null;

export function createDataStore(): DataStore {
  if (process.env.NODE_ENV === 'test') {
    return new MemoryDataStore();
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required outside of test mode.');
  }

  prismaClient ??= new PrismaClient();
  return new PrismaDataStore(prismaClient);
}
