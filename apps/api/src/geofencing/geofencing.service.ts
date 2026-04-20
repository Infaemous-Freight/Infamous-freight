import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface Geofence {
  id: string;
  loadId: string;
  type: 'pickup' | 'delivery';
  lat: number;
  lng: number;
  radiusMeters: number;
  address: string;
  triggered: boolean;
  triggeredAt?: Date;
  scheduledTime: Date;
  customerName: string;
}

export interface ETACheck {
  driverId: string;
  driverName: string;
  loadId: string;
  destination: { lat: number; lng: number; address: string };
  currentLocation: { lat: number; lng: number };
  estimatedArrival: Date;
  scheduledArrival: Date;
  minutesBehind: number;
  alertLevel: 'on-time' | 'warning' | 'critical';
  suggestedAction: string;
}

@Injectable()
export class GeofencingService {
  private readonly logger = new Logger(GeofencingService.name);
  private geofences: Map<string, Geofence> = new Map();

  constructor(private readonly redis: RedisService) {}

  async createGeofence(
    loadId: string,
    type: 'pickup' | 'delivery',
    lat: number,
    lng: number,
    address: string,
    scheduledTime: Date,
    customerName: string,
    radiusMeters: number = 500,
  ): Promise<Geofence> {
    const id = `geo_${loadId}_${type}`;
    const geofence: Geofence = {
      id,
      loadId,
      type,
      lat,
      lng,
      radiusMeters,
      address,
      triggered: false,
      scheduledTime,
      customerName,
    };

    this.geofences.set(id, geofence);
    this.logger.log(`Geofence created for load ${loadId} ${type}: ${address}`);
    return geofence;
  }

  async checkDriverLocation(driverId: string, lat: number, lng: number): Promise<Array<{
    event: 'entered' | 'exited' | 'approaching';
    geofence: Geofence;
    distanceMeters: number;
  }>> {
    const events: Array<{ event: 'entered' | 'exited' | 'approaching'; geofence: Geofence; distanceMeters: number }> = [];

    for (const geofence of this.geofences.values()) {
      if (geofence.triggered) continue;

      const distance = this.haversine(lat, lng, geofence.lat, geofence.lng);

      if (distance <= geofence.radiusMeters) {
        // Driver entered geofence
        geofence.triggered = true;
        geofence.triggeredAt = new Date();
        events.push({ event: 'entered', geofence, distanceMeters: distance });
        this.logger.log(`Driver ${driverId} entered ${geofence.type} geofence for load ${geofence.loadId}`);
      } else if (distance <= geofence.radiusMeters * 5) {
        // Approaching (within 5x radius)
        events.push({ event: 'approaching', geofence, distanceMeters: distance });
      }
    }

    return events;
  }

  async calculateETA(
    driverId: string,
    currentLat: number,
    currentLng: number,
    destLat: number,
    destLng: number,
    averageSpeedMph: number = 55,
  ): Promise<{ eta: Date; distanceMiles: number; durationMinutes: number }> {
    const distanceMiles = this.haversine(currentLat, currentLng, destLat, destLng) / 1609.34;
    const durationMinutes = (distanceMiles / averageSpeedMph) * 60;
    const eta = new Date(Date.now() + durationMinutes * 60000);

    // Cache ETA for 2 minutes
    await this.redis.set(`eta:${driverId}`, { eta, distanceMiles, durationMinutes }, 120);

    return { eta, distanceMiles, durationMinutes };
  }

  async checkScheduleAdherence(driverId: string, driverName: string, loadId: string): Promise<ETACheck | null> {
    const geo = this.geofences.get(`geo_${loadId}_delivery`);
    if (!geo) return null;

    const etaData = await this.redis.get<{ eta: Date; distanceMiles: number; durationMinutes: number }>(`eta:${driverId}`);
    if (!etaData) return null;

    const minutesBehind = Math.floor((new Date(etaData.eta).getTime() - geo.scheduledTime.getTime()) / 60000);

    let alertLevel: ETACheck['alertLevel'] = 'on-time';
    if (minutesBehind > 60) alertLevel = 'critical';
    else if (minutesBehind > 15) alertLevel = 'warning';

    let suggestedAction = 'On schedule';
    if (alertLevel === 'warning') suggestedAction = 'Contact shipper with updated ETA';
    if (alertLevel === 'critical') suggestedAction = 'Notify shipper immediately + reschedule if needed';

    return {
      driverId,
      driverName,
      loadId,
      destination: { lat: geo.lat, lng: geo.lng, address: geo.address },
      currentLocation: { lat: 0, lng: 0 }, // Populated from ELD
      estimatedArrival: new Date(etaData.eta),
      scheduledArrival: geo.scheduledTime,
      minutesBehind,
      alertLevel,
      suggestedAction,
    };
  }

  // Generate customer-facing tracking link
  async generateTrackingLink(loadId: string): Promise<string> {
    const token = Buffer.from(`${loadId}_${Date.now()}`).toString('base64');
    await this.redis.set(`track:${token}`, { loadId, createdAt: Date.now() }, 86400 * 7); // 7 days
    return `https://infamousfreight.com/track?t=${token}`;
  }

  async getTrackingInfo(token: string): Promise<any> {
    return this.redis.get(`track:${token}`);
  }

  async getGeofencesForLoad(loadId: string): Promise<Geofence[]> {
    return Array.from(this.geofences.values()).filter(g => g.loadId === loadId);
  }

  // Haversine distance in meters
  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
