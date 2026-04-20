import { Injectable, Logger } from '@nestjs/common';

export type PayType = 'per_mile' | 'percentage' | 'flat' | 'hourly';

export interface DriverPayProfile {
  driverId: string;
  driverName: string;
  payType: PayType;
  payRate: number; // $/mile, % of revenue, $/load, or $/hour
  fuelAdvanceRate?: number; // $ per gallon advance
  tollDeduct: boolean;
  lumperDeduct: boolean;
  detentionSplit: number; // percentage driver keeps (0-100)
  escrowRate?: number; // percentage held back
  minimumPay?: number; // minimum per load or per week
}

export interface LoadSettlement {
  loadId: string;
  loadReference: string;
  route: string;
  distance: number;
  revenue: number;
  lineHaulPay: number;
  detentionPay: number;
  lumperDeduct: number;
  tollDeduct: number;
  fuelAdvanceDeduct: number;
  escrowDeduct: number;
  grossPay: number;
}

export interface WeeklySettlement {
  settlementId: string;
  driverId: string;
  driverName: string;
  weekStart: Date;
  weekEnd: Date;
  loads: LoadSettlement[];
  totalMiles: number;
  totalRevenue: number;
  totalLineHaul: number;
  totalDetention: number;
  totalDeductions: number;
  grossPay: number;
  escrowWithheld: number;
  netPay: number;
  status: 'draft' | 'approved' | 'paid';
  paidAt?: Date;
  paymentMethod?: 'ach' | 'paypal' | 'check';
  paymentReference?: string;
}

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);
  private payProfiles: Map<string, DriverPayProfile> = new Map();
  private settlements: Map<string, WeeklySettlement> = new Map();

  async setPayProfile(profile: DriverPayProfile): Promise<void> {
    this.payProfiles.set(profile.driverId, profile);
    this.logger.log(`Pay profile set for driver ${profile.driverName}: ${profile.payType} @ ${profile.payRate}`);
  }

  async getPayProfile(driverId: string): Promise<DriverPayProfile | null> {
    return this.payProfiles.get(driverId) || null;
  }

  async calculateLoadSettlement(driverId: string, loadData: {
    loadId: string;
    loadReference: string;
    route: string;
    distance: number;
    rate: number;
    detentionHours?: number;
    detentionRate?: number;
    lumperFee?: number;
    tolls?: number;
    fuelGallons?: number;
    fuelPrice?: number;
  }): Promise<LoadSettlement> {
    const profile = await this.getPayProfile(driverId);
    if (!profile) throw new Error(`No pay profile found for driver ${driverId}`);

    let lineHaulPay = 0;

    switch (profile.payType) {
      case 'per_mile':
        lineHaulPay = loadData.distance * profile.payRate;
        break;
      case 'percentage':
        lineHaulPay = loadData.rate * (profile.payRate / 100);
        break;
      case 'flat':
        lineHaulPay = profile.payRate;
        break;
      case 'hourly':
        const estimatedHours = (loadData.distance / 55) + 4; // drive + loading/unloading
        lineHaulPay = estimatedHours * profile.payRate;
        break;
    }

    // Minimum pay guarantee
    if (profile.minimumPay && lineHaulPay < profile.minimumPay) {
      lineHaulPay = profile.minimumPay;
    }

    // Detention pay (split between driver and carrier)
    const detentionTotal = (loadData.detentionHours || 0) * (loadData.detentionRate || 50);
    const detentionPay = detentionTotal * (profile.detentionSplit / 100);

    // Deductions
    const lumperDeduct = profile.lumperDeduct ? (loadData.lumperFee || 0) : 0;
    const tollDeduct = profile.tollDeduct ? (loadData.tolls || 0) : 0;
    const fuelAdvanceDeduct = (loadData.fuelGallons || 0) * (loadData.fuelPrice || 0);
    const escrowDeduct = lineHaulPay * ((profile.escrowRate || 0) / 100);

    const grossPay = lineHaulPay + detentionPay - lumperDeduct - tollDeduct - fuelAdvanceDeduct - escrowDeduct;

    return {
      loadId: loadData.loadId,
      loadReference: loadData.loadReference,
      route: loadData.route,
      distance: loadData.distance,
      revenue: loadData.rate,
      lineHaulPay: Math.round(lineHaulPay * 100) / 100,
      detentionPay: Math.round(detentionPay * 100) / 100,
      lumperDeduct: Math.round(lumperDeduct * 100) / 100,
      tollDeduct: Math.round(tollDeduct * 100) / 100,
      fuelAdvanceDeduct: Math.round(fuelAdvanceDeduct * 100) / 100,
      escrowDeduct: Math.round(escrowDeduct * 100) / 100,
      grossPay: Math.round(grossPay * 100) / 100,
    };
  }

  async generateWeeklySettlement(driverId: string, weekStart: Date, loadDataArray: Array<Parameters<typeof this.calculateLoadSettlement>[1]>): Promise<WeeklySettlement> {
    const profile = await this.getPayProfile(driverId);
    if (!profile) throw new Error(`No pay profile found for driver ${driverId}`);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const loads: LoadSettlement[] = [];
    for (const loadData of loadDataArray) {
      loads.push(await this.calculateLoadSettlement(driverId, loadData));
    }

    const totalMiles = loads.reduce((s, l) => s + l.distance, 0);
    const totalRevenue = loads.reduce((s, l) => s + l.revenue, 0);
    const totalLineHaul = loads.reduce((s, l) => s + l.lineHaulPay, 0);
    const totalDetention = loads.reduce((s, l) => s + l.detentionPay, 0);
    const totalDeductions = loads.reduce((s, l) => s + l.lumperDeduct + l.tollDeduct + l.fuelAdvanceDeduct, 0);
    const escrowWithheld = loads.reduce((s, l) => s + l.escrowDeduct, 0);
    const grossPay = totalLineHaul + totalDetention;
    const netPay = grossPay - totalDeductions - escrowWithheld;

    const settlement: WeeklySettlement = {
      settlementId: `settle_${driverId}_${weekStart.toISOString().slice(0, 10)}`,
      driverId,
      driverName: profile.driverName,
      weekStart,
      weekEnd,
      loads,
      totalMiles,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalLineHaul: Math.round(totalLineHaul * 100) / 100,
      totalDetention: Math.round(totalDetention * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      grossPay: Math.round(grossPay * 100) / 100,
      escrowWithheld: Math.round(escrowWithheld * 100) / 100,
      netPay: Math.round(netPay * 100) / 100,
      status: 'draft',
    };

    this.settlements.set(settlement.settlementId, settlement);
    this.logger.log(`Weekly settlement generated for ${profile.driverName}: $${settlement.netPay}`);

    return settlement;
  }

  async approveSettlement(settlementId: string): Promise<WeeklySettlement> {
    const settlement = this.settlements.get(settlementId);
    if (!settlement) throw new Error('Settlement not found');
    settlement.status = 'approved';
    return settlement;
  }

  async markAsPaid(settlementId: string, method: 'ach' | 'paypal' | 'check', reference: string): Promise<WeeklySettlement> {
    const settlement = this.settlements.get(settlementId);
    if (!settlement) throw new Error('Settlement not found');
    settlement.status = 'paid';
    settlement.paidAt = new Date();
    settlement.paymentMethod = method;
    settlement.paymentReference = reference;
    this.logger.log(`Settlement ${settlementId} marked as paid via ${method}`);
    return settlement;
  }

  async getDriverSettlements(driverId: string): Promise<WeeklySettlement[]> {
    return Array.from(this.settlements.values())
      .filter(s => s.driverId === driverId)
      .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
  }

  async getSettlement(settlementId: string): Promise<WeeklySettlement | null> {
    return this.settlements.get(settlementId) || null;
  }

  // Driver-facing: get earnings dashboard
  async getDriverEarnings(driverId: string): Promise<{
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    ytd: number;
    totalMiles: number;
    totalLoads: number;
    averagePayPerMile: number;
  }> {
    const settlements = await this.getDriverSettlements(driverId);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const thisWeek = settlements.filter(s => s.weekStart >= weekAgo).reduce((s, st) => s + st.netPay, 0);
    const lastWeek = settlements.filter(s => s.weekStart >= twoWeeksAgo && s.weekStart < weekAgo).reduce((s, st) => s + st.netPay, 0);
    const thisMonth = settlements.filter(s => s.weekStart >= monthAgo).reduce((s, st) => s + st.netPay, 0);
    const ytd = settlements.filter(s => s.weekStart >= yearStart).reduce((s, st) => s + st.netPay, 0);
    const totalMiles = settlements.reduce((s, st) => s + st.totalMiles, 0);
    const totalLoads = settlements.reduce((s, st) => s + st.loads.length, 0);

    return {
      thisWeek: Math.round(thisWeek * 100) / 100,
      lastWeek: Math.round(lastWeek * 100) / 100,
      thisMonth: Math.round(thisMonth * 100) / 100,
      ytd: Math.round(ytd * 100) / 100,
      totalMiles,
      totalLoads,
      averagePayPerMile: totalMiles > 0 ? Math.round((ytd / totalMiles) * 100) / 100 : 0,
    };
  }
}
