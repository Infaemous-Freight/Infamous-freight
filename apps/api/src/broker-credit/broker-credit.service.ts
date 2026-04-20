import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface BrokerCreditProfile {
  brokerName: string;
  mcNumber: string;
  dotNumber?: string;
  creditScore: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F' | 'unrated';
  daysToPay: number;
  totalLoadsPosted: number;
  totalLoadsBooked: number;
  cancellationRate: number;
  disputedPayments: number;
  isDoubleBroker: boolean;
  redFlags: string[];
  safeToHaul: boolean;
  quickPayAvailable: boolean;
  quickPayFee?: number;
  factoringApproved: boolean;
  recommendedMaxExposure: number;
  lastUpdated: Date;
}

export interface BrokerRating {
  carrierId: string;
  brokerMc: string;
  rating: 1 | 2 | 3 | 4 | 5;
  wouldHaulAgain: boolean;
  paidOnTime: boolean;
  actualDaysToPay: number;
  comment?: string;
  createdAt: Date;
}

@Injectable()
export class BrokerCreditService {
  private readonly logger = new Logger(BrokerCreditService.name);
  private brokerDB: Map<string, BrokerCreditProfile> = new Map();
  private ratings: Map<string, BrokerRating[]> = new Map();

  constructor(private readonly http: HttpService) {
    this.seedSampleData();
  }

  async getBrokerCredit(mcNumber: string): Promise<BrokerCreditProfile> {
    // Check cache first
    const cached = this.brokerDB.get(mcNumber);
    if (cached && this.isFresh(cached.lastUpdated)) {
      return cached;
    }

    // Try DAT Credit API
    try {
      const datProfile = await this.fetchFromDAT(mcNumber);
      if (datProfile) {
        this.brokerDB.set(mcNumber, datProfile);
        return datProfile;
      }
    } catch (err) {
      this.logger.warn(`DAT Credit fetch failed for ${mcNumber}:`, err.message);
    }

    // Return cached or generate basic profile
    return cached || this.generateBasicProfile(mcNumber);
  }

  async rateBroker(rating: BrokerRating): Promise<void> {
    const key = rating.brokerMc;
    const existing = this.ratings.get(key) || [];
    existing.push(rating);
    this.ratings.set(key, existing);

    // Recalculate aggregate
    await this.recalculateBrokerScore(key);
  }

  async getBrokerRatings(mcNumber: string): Promise<BrokerRating[]> {
    return this.ratings.get(mcNumber) || [];
  }

  async checkLoadSafety(brokerMc: string, rate: number): Promise<{
    safe: boolean;
    credit: BrokerCreditProfile;
    warnings: string[];
  }> {
    const credit = await this.getBrokerCredit(brokerMc);
    const warnings: string[] = [];

    if (credit.daysToPay > 45) warnings.push(`Slow payer: ${credit.daysToPay} days average`);
    if (credit.isDoubleBroker) warnings.push('Double-broker risk detected');
    if (credit.disputedPayments > 2) warnings.push(`${credit.disputedPayments} disputed payments on record`);
    if (credit.cancellationRate > 10) warnings.push(`High cancellation rate: ${credit.cancellationRate}%`);
    if (credit.creditScore === 'D' || credit.creditScore === 'F') warnings.push('Poor credit rating');
    if (rate > credit.recommendedMaxExposure) warnings.push(`Rate exceeds recommended max exposure ($${credit.recommendedMaxExposure})`);

    const safe = credit.safeToHaul && warnings.length < 2 && !credit.isDoubleBroker;

    return { safe, credit, warnings };
  }

  // Get badge component props for UI
  getCreditBadge(creditScore: string): { color: string; bg: string; label: string } {
    switch (creditScore) {
      case 'A+': return { color: 'text-green-400', bg: 'bg-green-400/10', label: 'A+ Excellent' };
      case 'A': return { color: 'text-green-300', bg: 'bg-green-300/10', label: 'A Good' };
      case 'B+': return { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'B+ Above Average' };
      case 'B': return { color: 'text-blue-300', bg: 'bg-blue-300/10', label: 'B Average' };
      case 'C': return { color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'C Below Average' };
      case 'D': return { color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'D Poor' };
      case 'F': return { color: 'text-red-400', bg: 'bg-red-400/10', label: 'F Avoid' };
      default: return { color: 'text-gray-400', bg: 'bg-gray-400/10', label: 'Unrated' };
    }
  }

  private async fetchFromDAT(mcNumber: string): Promise<BrokerCreditProfile | null> {
    const apiKey = process.env.DAT_API_KEY;
    if (!apiKey) return null;

    try {
      const response = await firstValueFrom(
        this.http.get(`https://api.dat.com/credit/v1/brokers/${mcNumber}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
      );

      const data = response.data;
      return {
        brokerName: data.companyName,
        mcNumber,
        dotNumber: data.dotNumber,
        creditScore: this.mapDATScore(data.creditScore),
        daysToPay: data.averageDaysToPay,
        totalLoadsPosted: data.loadsPosted || 0,
        totalLoadsBooked: data.loadsBooked || 0,
        cancellationRate: data.cancellationRate || 0,
        disputedPayments: data.disputedPayments || 0,
        isDoubleBroker: data.doubleBrokerFlags > 0,
        redFlags: data.redFlags || [],
        safeToHaul: data.creditScore >= 60,
        quickPayAvailable: data.quickPayAvailable || false,
        quickPayFee: data.quickPayFee,
        factoringApproved: data.factoringApproved || false,
        recommendedMaxExposure: data.recommendedMaxExposure || 5000,
        lastUpdated: new Date(),
      };
    } catch {
      return null;
    }
  }

  private async recalculateBrokerScore(mcNumber: string): Promise<void> {
    const ratings = this.ratings.get(mcNumber) || [];
    if (ratings.length === 0) return;

    const avgDaysToPay = ratings.reduce((s, r) => s + r.actualDaysToPay, 0) / ratings.length;
    const wouldHaulAgain = ratings.filter(r => r.wouldHaulAgain).length / ratings.length;

    let creditScore: BrokerCreditProfile['creditScore'] = 'B';
    if (wouldHaulAgain > 0.9 && avgDaysToPay < 20) creditScore = 'A+';
    else if (wouldHaulAgain > 0.8 && avgDaysToPay < 30) creditScore = 'A';
    else if (wouldHaulAgain > 0.7 && avgDaysToPay < 35) creditScore = 'B+';
    else if (wouldHaulAgain > 0.5 && avgDaysToPay < 45) creditScore = 'B';
    else if (avgDaysToPay < 60) creditScore = 'C';
    else if (avgDaysToPay < 90) creditScore = 'D';
    else creditScore = 'F';

    const existing = this.brokerDB.get(mcNumber);
    if (existing) {
      existing.daysToPay = Math.round(avgDaysToPay);
      existing.creditScore = creditScore;
      existing.lastUpdated = new Date();
    }
  }

  private mapDATScore(score: number): BrokerCreditProfile['creditScore'] {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 45) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  }

  private isFresh(date: Date): boolean {
    return Date.now() - date.getTime() < 24 * 3600 * 1000; // 24 hours
  }

  private generateBasicProfile(mcNumber: string): BrokerCreditProfile {
    return {
      brokerName: 'Unknown Broker',
      mcNumber,
      creditScore: 'unrated',
      daysToPay: 30,
      totalLoadsPosted: 0,
      totalLoadsBooked: 0,
      cancellationRate: 0,
      disputedPayments: 0,
      isDoubleBroker: false,
      redFlags: [],
      safeToHaul: true,
      quickPayAvailable: false,
      factoringApproved: false,
      recommendedMaxExposure: 2500,
      lastUpdated: new Date(),
    };
  }

  private seedSampleData(): void {
    const sampleBrokers: BrokerCreditProfile[] = [
      {
        brokerName: 'RXO (formerly XPO)',
        mcNumber: 'MC-693616',
        creditScore: 'A+',
        daysToPay: 18,
        totalLoadsPosted: 45000,
        totalLoadsBooked: 42000,
        cancellationRate: 2.1,
        disputedPayments: 0,
        isDoubleBroker: false,
        redFlags: [],
        safeToHaul: true,
        quickPayAvailable: true,
        quickPayFee: 0.02,
        factoringApproved: true,
        recommendedMaxExposure: 50000,
        lastUpdated: new Date(),
      },
      {
        brokerName: 'Landstar',
        mcNumber: 'MC-120641',
        creditScore: 'A+',
        daysToPay: 14,
        totalLoadsPosted: 38000,
        totalLoadsBooked: 36000,
        cancellationRate: 1.8,
        disputedPayments: 0,
        isDoubleBroker: false,
        redFlags: [],
        safeToHaul: true,
        quickPayAvailable: true,
        quickPayFee: 0.015,
        factoringApproved: true,
        recommendedMaxExposure: 75000,
        lastUpdated: new Date(),
      },
      {
        brokerName: 'TQL',
        mcNumber: 'MC-472321',
        creditScore: 'A',
        daysToPay: 21,
        totalLoadsPosted: 52000,
        totalLoadsBooked: 49000,
        cancellationRate: 3.2,
        disputedPayments: 1,
        isDoubleBroker: false,
        redFlags: [],
        safeToHaul: true,
        quickPayAvailable: true,
        quickPayFee: 0.025,
        factoringApproved: true,
        recommendedMaxExposure: 40000,
        lastUpdated: new Date(),
      },
    ];

    for (const broker of sampleBrokers) {
      this.brokerDB.set(broker.mcNumber, broker);
    }
  }
}
