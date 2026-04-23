import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { RedisService } from '../redis/redis.service';
import { firstValueFrom } from 'rxjs';
import { RateLimitService } from '../rate-limit/rate-limit.service';

export interface UnifiedLoad {
  id: string;
  source: 'dat' | 'truckstop' | '123loadboard' | 'manual';
  brokerName: string;
  brokerPhone?: string;
  brokerEmail?: string;
  brokerMC?: string;
  rate: number;
  ratePerMile: number;
  distance: number;
  equipmentType: string;
  weight: number;
  origin: {
    city: string;
    state: string;
    lat: number;
    lng: number;
    zip?: string;
  };
  destination: {
    city: string;
    state: string;
    lat: number;
    lng: number;
    zip?: string;
  };
  pickupDate: Date;
  deliveryDate: Date;
  pickupTimeWindow?: string;
  deliveryTimeWindow?: string;
  loadType: 'full' | 'partial' | 'ltl';
  hazmat: boolean;
  tarpRequired: boolean;
  teamRequired: boolean;
  comments?: string;
  commodity?: string;
  postedAt: Date;
  ageMinutes: number;
  isHighUrgency: boolean;
  credit?: string;
  daysToPay?: number;
}

export interface LoadSearchFilters {
  originStates?: string[];
  originCities?: string[];
  destStates?: string[];
  destCities?: string[];
  equipmentTypes?: string[];
  minRatePerMile?: number;
  maxWeight?: number;
  pickupDateFrom?: Date;
  pickupDateTo?: Date;
  excludeBrokers?: string[];
  hazmatOk?: boolean;
  maxDistance?: number;
  radiusMiles?: number;
  loadId?: string;
}

@Injectable()
export class LoadBoardAggregatorService {
  private readonly logger = new Logger(LoadBoardAggregatorService.name);
  private readonly DAT_API_BASE = 'https://api.dat.com';
  private readonly TRUCKSTOP_API_BASE = 'https://api.truckstop.com';
  private readonly LOADBOARD_API_BASE = 'https://api.123loadboard.com';

  constructor(
    private readonly http: HttpService,
    private readonly redis: RedisService,
    private readonly rateLimit: RateLimitService,
  ) {}

  async searchAllBoards(filters: LoadSearchFilters): Promise<UnifiedLoad[]> {
    const [datLoads, truckstopLoads, l123Loads] = await Promise.allSettled([
      this.searchDAT(filters),
      this.searchTruckstop(filters),
      this.search123Loadboard(filters),
    ]);

    const loads: UnifiedLoad[] = [];

    if (datLoads.status === 'fulfilled') loads.push(...datLoads.value);
    else this.logger.error('DAT search failed:', datLoads.reason);

    if (truckstopLoads.status === 'fulfilled') loads.push(...truckstopLoads.value);
    else this.logger.error('Truckstop search failed:', truckstopLoads.reason);

    if (l123Loads.status === 'fulfilled') loads.push(...l123Loads.value);
    else this.logger.error('123Loadboard search failed:', l123Loads.reason);

    const deduped = this.deduplicateLoads(loads);

    deduped.sort((a, b) => {
      if (Math.abs(a.ageMinutes - b.ageMinutes) < 5) {
        return b.ratePerMile - a.ratePerMile;
      }
      return a.ageMinutes - b.ageMinutes;
    });

    await this.redis.set(`loads:search:${JSON.stringify(filters)}`, deduped, 120);

    return deduped;
  }

  async subscribeToLaneAlerts(carrierId: string, lanes: { origin: string; destination: string }[]): Promise<void> {
    await this.redis.set(`alerts:lanes:${carrierId}`, lanes, 86400);
    this.logger.log(`Carrier ${carrierId} subscribed to ${lanes.length} lane alerts`);
  }

  async checkNewLoadsForAlerts(): Promise<Array<{ carrierId: string; loads: UnifiedLoad[] }>> {
    const keys = await this.redis.keys('alerts:lanes:*');
    const notifications: Array<{ carrierId: string; loads: UnifiedLoad[] }> = [];

    for (const key of keys) {
      const carrierId = key.replace('alerts:lanes:', '');
      const lanes = await this.redis.get<Array<{ origin: string; destination: string }>>(key);
      if (!lanes) continue;

      for (const lane of lanes) {
        const filters: LoadSearchFilters = {
          originCities: [lane.origin],
          destCities: [lane.destination],
        };

        const cached = await this.redis.get<UnifiedLoad[]>(`loads:search:${JSON.stringify(filters)}`);
        if (cached && cached.length > 0) {
          const newLoads = cached.filter((load) => load.ageMinutes <= 10);
          if (newLoads.length > 0) {
            notifications.push({ carrierId, loads: newLoads });
          }
        }
      }
    }

    return notifications;
  }

  private async searchDAT(filters: LoadSearchFilters): Promise<UnifiedLoad[]> {
    const apiKey = process.env.DAT_API_KEY;
    if (!apiKey) {
      this.logger.warn('DAT API key not configured');
      return [];
    }

    try {
      const response = await firstValueFrom(
        this.http.get(`${this.DAT_API_BASE}/loads/v1/search`, {
          headers: { Authorization: `Bearer ${apiKey}` },
          params: {
            ...(filters.originStates?.length && { originStates: filters.originStates.join(',') }),
            ...(filters.destStates?.length && { destStates: filters.destStates.join(',') }),
            ...(filters.equipmentTypes?.length && { equipment: filters.equipmentTypes.join(',') }),
            ...(filters.minRatePerMile && { minRate: filters.minRatePerMile }),
            ...(filters.maxWeight && { maxWeight: filters.maxWeight }),
            ...(filters.pickupDateFrom && { pickupFrom: filters.pickupDateFrom.toISOString() }),
            ...(filters.pickupDateTo && { pickupTo: filters.pickupDateTo.toISOString() }),
            limit: 50,
          },
        }),
      );

      return (response.data?.loads || []).map((l: any) => this.normalizeDATLoad(l));
    } catch (err: any) {
      this.logger.error('DAT API error:', err.message);
      return [];
    }
  }

  private normalizeDATLoad(load: any): UnifiedLoad {
    const distance = load.mileage || this.estimateDistance(load.originLat, load.originLng, load.destLat, load.destLng);
    return {
      id: `dat_${load.loadId}`,
      source: 'dat',
      brokerName: load.brokerName || 'DAT Broker',
      brokerMC: load.brokerMcNumber,
      rate: load.rate,
      ratePerMile: load.ratePerMile || (load.rate / distance),
      distance,
      equipmentType: load.equipmentType || 'Dry Van',
      weight: load.weight || 0,
      origin: { city: load.originCity, state: load.originState, lat: load.originLat, lng: load.originLng },
      destination: { city: load.destCity, state: load.destState, lat: load.destLat, lng: load.destLng },
      pickupDate: new Date(load.pickupDate),
      deliveryDate: new Date(load.deliveryDate),
      loadType: 'full',
      hazmat: load.hazmat || false,
      tarpRequired: load.tarpRequired || false,
      teamRequired: load.teamRequired || false,
      commodity: load.commodity,
      postedAt: new Date(load.postedDate),
      ageMinutes: Math.floor((Date.now() - new Date(load.postedDate).getTime()) / 60000),
      isHighUrgency: load.urgency === 'high' || load.ratePerMile > 3.5,
    };
  }

  private async searchTruckstop(filters: LoadSearchFilters): Promise<UnifiedLoad[]> {
    const apiKey = process.env.TRUCKSTOP_API_KEY;
    if (!apiKey) {
      this.logger.warn('Truckstop API key not configured');
      return [];
    }

    try {
      const response = await firstValueFrom(
        this.http.post(
          `${this.TRUCKSTOP_API_BASE}/api/v1/loads/search`,
          {
            criteria: {
              origin: filters.originStates?.[0],
              destination: filters.destStates?.[0],
              equipmentType: filters.equipmentTypes?.[0],
              pickupDate: filters.pickupDateFrom,
            },
          },
          { headers: { Authorization: `Token ${apiKey}` } },
        ),
      );

      return (response.data?.loads || []).map((l: any) => this.normalizeTruckstopLoad(l));
    } catch (err: any) {
      this.logger.error('Truckstop API error:', err.message);
      return [];
    }
  }

  private normalizeTruckstopLoad(load: any): UnifiedLoad {
    const distance = load.distance || this.estimateDistance(load.originLat, load.originLng, load.destLat, load.destLng);
    return {
      id: `ts_${load.id}`,
      source: 'truckstop',
      brokerName: load.companyName || 'Truckstop Broker',
      brokerPhone: load.contactPhone,
      brokerEmail: load.contactEmail,
      rate: load.offer,
      ratePerMile: load.ratePerMile || (load.offer / distance),
      distance,
      equipmentType: load.equipment || 'Dry Van',
      weight: load.weight || 0,
      origin: { city: load.originCity, state: load.originState, lat: load.originLat, lng: load.originLng },
      destination: { city: load.destCity, state: load.destState, lat: load.destLat, lng: load.destLng },
      pickupDate: new Date(load.pickupDate),
      deliveryDate: new Date(load.deliveryDate || load.dropDate),
      loadType: 'full',
      hazmat: load.isHazmat || false,
      tarpRequired: load.isTarp || false,
      teamRequired: load.isTeam || false,
      comments: load.comments,
      postedAt: new Date(load.dateAvailable),
      ageMinutes: Math.floor((Date.now() - new Date(load.dateAvailable).getTime()) / 60000),
      isHighUrgency: load.isUrgent || false,
    };
  }

  private async search123Loadboard(filters: LoadSearchFilters): Promise<UnifiedLoad[]> {
    const apiKey = process.env.LOADBOARD_API_KEY;
    if (!apiKey) {
      this.logger.warn('123Loadboard API key not configured');
      return [];
    }

    try {
      const response = await firstValueFrom(
        this.http.get(`${this.LOADBOARD_API_BASE}/loads/search`, {
          headers: { 'API-Key': apiKey },
          params: {
            origin: filters.originCities?.[0],
            destination: filters.destCities?.[0],
            equipment: filters.equipmentTypes?.[0],
          },
        }),
      );

      return (response.data?.data || []).map((l: any) => this.normalize123LoadboardLoad(l));
    } catch (err: any) {
      this.logger.error('123Loadboard API error:', err.message);
      return [];
    }
  }

  private normalize123LoadboardLoad(load: any): UnifiedLoad {
    const distance = load.miles || this.estimateDistance(load.originLat, load.originLng, load.destLat, load.destLng);
    return {
      id: `123_${load.loadID}`,
      source: '123loadboard',
      brokerName: load.company || '123Loadboard',
      brokerMC: load.brokerMcNumber,
      rate: load.rate,
      ratePerMile: distance > 0 ? load.rate / distance : 0,
      distance,
      equipmentType: load.equipment || 'Dry Van',
      weight: load.weight || 0,
      origin: { city: load.originCity, state: load.originState, lat: load.originLat, lng: load.originLng },
      destination: { city: load.destCity, state: load.destState, lat: load.destLat, lng: load.destLng },
      pickupDate: new Date(load.pickupDate),
      deliveryDate: new Date(load.deliveryDate),
      loadType: load.loadType === 'LTL' ? 'ltl' : 'full',
      hazmat: load.isHazmat || false,
      tarpRequired: false,
      teamRequired: false,
      commodity: load.commodity,
      postedAt: new Date(load.posted),
      ageMinutes: Math.floor((Date.now() - new Date(load.posted).getTime()) / 60000),
      isHighUrgency: false,
    };
  }

  private deduplicateLoads(loads: UnifiedLoad[]): UnifiedLoad[] {
    const seen = new Map<string, UnifiedLoad>();

    for (const load of loads) {
      const key = `${load.origin.city}|${load.destination.city}|${load.pickupDate.toDateString()}|${Math.round(load.rate / 100)}`;

      if (!seen.has(key)) {
        seen.set(key, load);
      } else {
        const existing = seen.get(key)!;
        if (load.ratePerMile > existing.ratePerMile) {
          seen.set(key, load);
        }
      }
    }

    return Array.from(seen.values());
  }

  private estimateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
