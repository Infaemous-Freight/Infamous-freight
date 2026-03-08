import { prisma } from "../../lib/prisma.js";
import { broadcastTrackingEvent } from "../../lib/ws.js";
import { anomalyQueue } from "../../lib/queue.js";

export class TrackingService {
  async ingestGps(organizationId: string, data: {
    driverId: string;
    loadId?: string;
    lat: number;
    lng: number;
    speedMph?: number;
    heading?: number;
    recordedAt: string;
  }) {
    const ping = await prisma.gpsPing.create({
      data: {
        organizationId,
        driverId: data.driverId,
        loadId: data.loadId,
        lat: data.lat,
        lng: data.lng,
        speedMph: data.speedMph,
        heading: data.heading,
        recordedAt: new Date(data.recordedAt)
      }
    });

    await prisma.driver.update({
      where: { id: data.driverId },
      data: {
        currentLat: data.lat,
        currentLng: data.lng
      }
    });

    broadcastTrackingEvent({
      type: "gps.ping",
      organizationId,
      payload: ping
    });

    await anomalyQueue.add("driver-scan", {
      organizationId,
      driverId: data.driverId
    });

    return ping;
  }
}
