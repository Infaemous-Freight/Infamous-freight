import { Injectable, Logger } from '@nestjs/common';

export interface RateDataPoint {
  date: Date;
  ratePerMile: number;
  distance: number;
  equipmentType: string;
  source: 'booked' | 'posted' | 'negotiated';
}

export interface LaneRateTrend {
  origin: string;
  originState: string;
  destination: string;
  destState: string;
  equipmentType: string;
  currentRate: number;
  weekAgoRate: number;
  monthAgoRate: number;
  yearAgoRate: number;
  weekChange: number;
  monthChange: number;
  high: number;
  low: number;
  avg: number;
  count: number;
  trend: 'up' | 'down' | 'stable';
  forecast: number[]; // next 7 days predicted
}

export interface RateComparison {
  brokerOffer: number;
  marketRate: number;
  suggestedCounter: number;
  potentialSavings: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string[];
}

@Injectable()
export class RateAnalyticsService {
  private readonly logger = new Logger(RateAnalyticsService.name);
  private rateHistory: RateDataPoint[] = [];

  constructor() {
    this.seedSampleData();
  }

  // Record a rate observation (every load booked feeds this)
  async recordRate(data: RateDataPoint): Promise<void> {
    this.rateHistory.push(data);
    this.logger.log(`Rate recorded: ${data.originState}→${data.destState} @ $${data.ratePerMile}/mi (${data.equipmentType})`);
  }

  // Get trend for a specific lane
  async getLaneTrend(
    originState: string,
    destState: string,
    equipmentType: string,
    days: number = 90,
  ): Promise<LaneRateTrend> {
    const cutoff = new Date(Date.now() - days * 86400000);
    const relevant = this.rateHistory.filter(
      r =>
        r.originState === originState &&
        r.destState === destState &&
        r.equipmentType === equipmentType &&
        r.date >= cutoff,
    );

    const sorted = relevant.sort((a, b) => a.date.getTime() - b.date.getTime());

    if (sorted.length === 0) {
      return this.emptyTrend(originState, destState, equipmentType);
    }

    const rates = sorted.map(r => r.ratePerMile);
    const current = rates[rates.length - 1];
    const weekAgo = this.getRateAtDaysAgo(sorted, 7) || current;
    const monthAgo = this.getRateAtDaysAgo(sorted, 30) || current;
    const yearAgo = this.getRateAtDaysAgo(sorted, 365) || current;

    const high = Math.max(...rates);
    const low = Math.min(...rates);
    const avg = rates.reduce((s, r) => s + r, 0) / rates.length;

    // Simple moving average forecast
    const last7 = rates.slice(-7);
    const ma7 = last7.reduce((s, r) => s + r, 0) / last7.length;
    const forecast = Array.from({ length: 7 }, (_, i) => Math.round((ma7 + (Math.random() - 0.5) * 0.1) * 100) / 100);

    let trend: LaneRateTrend['trend'] = 'stable';
    const weekChange = ((current - weekAgo) / weekAgo) * 100;
    if (weekChange > 5) trend = 'up';
    else if (weekChange < -5) trend = 'down';

    return {
      origin: originState,
      originState,
      destination: destState,
      destState,
      equipmentType,
      currentRate: Math.round(current * 100) / 100,
      weekAgoRate: Math.round(weekAgo * 100) / 100,
      monthAgoRate: Math.round(monthAgo * 100) / 100,
      yearAgoRate: Math.round(yearAgo * 100) / 100,
      weekChange: Math.round(weekChange * 10) / 10,
      monthChange: Math.round((((current - monthAgo) / monthAgo) * 100) * 10) / 10,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      avg: Math.round(avg * 100) / 100,
      count: sorted.length,
      trend,
      forecast,
    };
  }

  // Compare a broker offer to market rate
  async compareRate(
    originState: string,
    destState: string,
    equipmentType: string,
    brokerOffer: number,
  ): Promise<RateComparison> {
    const trend = await this.getLaneTrend(originState, destState, equipmentType, 30);
    const marketRate = trend.avg;

    const reasoning: string[] = [];
    let confidence: RateComparison['confidence'] = 'medium';

    if (brokerOffer < marketRate * 0.85) {
      reasoning.push(`Offer is ${Math.round((1 - brokerOffer / marketRate) * 100)}% below 30-day average`);
      confidence = 'high';
    } else if (brokerOffer < marketRate) {
      reasoning.push(`Offer is slightly below 30-day average of $${marketRate.toFixed(2)}`);
      confidence = 'high';
    } else {
      reasoning.push(`Offer is at or above market rate`);
    }

    if (trend.trend === 'up') {
      reasoning.push(`Rates trending up ${trend.weekChange}% this week`);
    } else if (trend.trend === 'down') {
      reasoning.push(`Rates trending down ${Math.abs(trend.weekChange)}% this week`);
    }

    // Suggested counter: market rate + 5-10% depending on trend
    const adjustment = trend.trend === 'up' ? 0.10 : trend.trend === 'down' ? 0.03 : 0.05;
    const suggestedCounter = Math.round((marketRate * (1 + adjustment)) * 100) / 100;

    return {
      brokerOffer: Math.round(brokerOffer * 100) / 100,
      marketRate: Math.round(marketRate * 100) / 100,
      suggestedCounter,
      potentialSavings: Math.round((suggestedCounter - brokerOffer) * 100) / 100,
      confidence,
      reasoning,
    };
  }

  // Get "Rate of the Day" — best paying loads on the platform
  async getRateOfTheDay(limit: number = 5): Promise<Array<{
    lane: string;
    ratePerMile: number;
    equipmentType: string;
    urgency: string;
  }>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLoads = this.rateHistory
      .filter(r => r.date >= today && r.source === 'posted')
      .sort((a, b) => b.ratePerMile - a.ratePerMile)
      .slice(0, limit);

    return todayLoads.map(r => ({
      lane: `${r.originState} → ${r.destState}`,
      ratePerMile: r.ratePerMile,
      equipmentType: r.equipmentType,
      urgency: r.ratePerMile > 3.5 ? 'Hot' : r.ratePerMile > 3.0 ? 'Good' : 'Average',
    }));
  }

  // Weekly rate report email content
  async generateWeeklyReport(carrierId: string): Promise<{
    subject: string;
    topLanes: LaneRateTrend[];
    marketSummary: string;
    recommendations: string[];
  }> {
    // In production: fetch carrier's actual lanes
    const topLanes = await Promise.all([
      this.getLaneTrend('IL', 'TX', 'Dry Van', 7),
      this.getLaneTrend('GA', 'NC', 'Dry Van', 7),
      this.getLaneTrend('TX', 'AZ', 'Flatbed', 7),
    ]);

    const avgChange = topLanes.reduce((s, l) => s + l.weekChange, 0) / topLanes.length;
    const marketSummary = avgChange > 0
      ? `Rates are up ${avgChange.toFixed(1)}% on your lanes this week.`
      : `Rates are down ${Math.abs(avgChange).toFixed(1)}% on your lanes this week.`;

    return {
      subject: `Weekly Rate Report: ${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(1)}% this week`,
      topLanes,
      marketSummary,
      recommendations: this.generateRecommendations(topLanes),
    };
  }

  private generateRecommendations(trends: LaneRateTrend[]): string[] {
    const recs: string[] = [];
    for (const t of trends) {
      if (t.trend === 'up' && t.weekChange > 10) {
        recs.push(`${t.originState}→${t.destState} ${t.equipmentType}: Rates spiking ${t.weekChange}%. Book now before they normalize.`);
      } else if (t.trend === 'down' && t.weekChange < -10) {
        recs.push(`${t.originState}→${t.destState} ${t.equipmentType}: Rates dropping. Consider negotiating harder or waiting.`);
      } else if (t.currentRate > t.avg * 1.15) {
        recs.push(`${t.originState}→${t.destState} ${t.equipmentType}: Current rate $${t.currentRate} is well above average ($${t.avg}). Good time to book.`);
      }
    }
    return recs.length > 0 ? recs : ['Markets are stable on your lanes this week.'];
  }

  private getRateAtDaysAgo(sorted: RateDataPoint[], days: number): number | null {
    const target = new Date(Date.now() - days * 86400000);
    // Find closest data point
    let closest: RateDataPoint | null = null;
    let closestDiff = Infinity;

    for (const r of sorted) {
      const diff = Math.abs(r.date.getTime() - target.getTime());
      if (diff < closestDiff) {
        closestDiff = diff;
        closest = r;
      }
    }

    return closest?.ratePerMile || null;
  }

  private emptyTrend(originState: string, destState: string, equipmentType: string): LaneRateTrend {
    return {
      origin: originState, originState, destination: destState, destState, equipmentType,
      currentRate: 0, weekAgoRate: 0, monthAgoRate: 0, yearAgoRate: 0,
      weekChange: 0, monthChange: 0, high: 0, low: 0, avg: 0, count: 0,
      trend: 'stable', forecast: [],
    };
  }

  private seedSampleData(): void {
    const states = [
      { o: 'IL', d: 'TX', base: 2.75 },
      { o: 'GA', d: 'NC', base: 2.60 },
      { o: 'TX', d: 'AZ', base: 2.90 },
      { o: 'CA', d: 'TX', base: 2.40 },
      { o: 'IL', d: 'GA', base: 2.55 },
    ];

    const equipment = ['Dry Van', 'Reefer', 'Flatbed'];
    const now = Date.now();

    for (const lane of states) {
      for (const eq of equipment) {
        for (let i = 90; i >= 0; i--) {
          const variance = (Math.random() - 0.5) * 0.6;
          const seasonal = Math.sin((i / 90) * Math.PI) * 0.2;
          this.rateHistory.push({
            date: new Date(now - i * 86400000),
            ratePerMile: Math.round((lane.base + variance + seasonal) * 100) / 100,
            distance: 800 + Math.random() * 400,
            equipmentType: eq,
            source: Math.random() > 0.3 ? 'posted' : 'booked',
          });
        }
      }
    }

    this.logger.log(`Seeded ${this.rateHistory.length} rate data points`);
  }
}
