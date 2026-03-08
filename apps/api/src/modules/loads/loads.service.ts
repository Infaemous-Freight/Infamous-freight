import { prisma } from "../../lib/prisma.js";

export class LoadsService {
  async list(organizationId: string) {
    return prisma.load.findMany({
      where: { organizationId },
      include: { driver: true, carrier: true, routePlan: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async create(organizationId: string, data: any) {
    return prisma.load.create({
      data: {
        organizationId,
        referenceNumber: data.referenceNumber,
        originLat: data.originLat,
        originLng: data.originLng,
        destinationLat: data.destinationLat,
        destinationLng: data.destinationLng,
        pickupWindowStart: new Date(data.pickupWindowStart),
        pickupWindowEnd: new Date(data.pickupWindowEnd),
        deliveryDeadline: new Date(data.deliveryDeadline),
        weightLbs: data.weightLbs,
        hazmat: data.hazmat ?? false,
        trailerType: data.trailerType
      }
    });
  }
}
