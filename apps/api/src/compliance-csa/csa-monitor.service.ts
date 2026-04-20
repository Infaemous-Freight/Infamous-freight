import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

// FMCSA BASIC categories
export type BASICCategory =
  | 'Unsafe Driving'
  | 'Hours-of-Service Compliance'
  | 'Driver Fitness'
  | 'Controlled Substances/Alcohol'
  | 'Vehicle Maintenance'
  | 'Hazardous Materials Compliance'
  | 'Crash Indicator';

export interface BASICScore {
  category: BASICCategory;
  percentile: number; // 0-100
  alertStatus: 'no_alert' | 'alert' | 'intervention';
  violations: number;
  inspections: number;
  benchmark: 'above_average' | 'average' | 'below_average';
}

export interface CarrierCSAProfile {
  carrierId: string;
  carrierName: string;
  dotNumber: string;
  mcNumber: string;
  overallRating: 'Satisfactory' | 'Conditional' | 'Unsatisfactory' | 'None';
  smsPercentile: number;
  basicScores: BASICScore[];
  totalViolations: number;
  totalCrashes: number;
  fatalCrashes: number;
  injuryCrashes: number;
  towCrashes: number;
  lastUpdated: Date;
  nextReviewDate?: Date;
}

export interface DriverCSA {
  driverId: string;
  driverName: string;
  cdlNumber: string;
  cdlState: string;
  pspScore: number;
  violations: Array<{
    date: Date;
    basic: BASICCategory;
    description: string;
    severity: 1 | 2 | 3;
    oos: boolean;
  }>;
  totalViolations: number;
  oosViolations: number;
}

export interface AlertThreshold {
  basic: BASICCategory;
  warningAt: number; // percentile
  criticalAt: number; // percentile
}

const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  { basic: 'Unsafe Driving', warningAt: 50, criticalAt: 80 },
  { basic: 'Hours-of-Service Compliance', warningAt: 65, criticalAt: 80 },
  { basic: 'Driver Fitness', warningAt: 65, criticalAt: 80 },
  { basic: 'Controlled Substances/Alcohol', warningAt: 65, criticalAt: 80 },
  { basic: 'Vehicle Maintenance', warningAt: 65, criticalAt: 80 },
  { basic: 'Hazardous Materials Compliance', warningAt: 65, criticalAt: 80 },
  { basic: 'Crash Indicator', warningAt: 65, criticalAt: 80 },
];

@Injectable()
export class CSAMonitorService {
  private readonly logger = new Logger(CSAMonitorService.name);
  private profiles: Map<string, CarrierCSAProfile> = new Map();
  private driverCSA: Map<string, DriverCSA> = new Map();
  private thresholds: AlertThreshold[] = DEFAULT_THRESHOLDS;

  constructor(private readonly http: HttpService) {}

  async fetchCarrierCSA(dotNumber: string): Promise<CarrierCSAProfile> {
    try {
      // FMCSA SAFER API (simplified XML) or web scraping
      // In production: integrate with https://ai.fmcsa.dot.gov/SMS
      const response = await firstValueFrom(
        this.http.get(`https://ai.fmcsa.dot.gov/SMS/Tools/Downloads.aspx`, {
          params: { dotNumber },
        }).catch(() => ({ data: null })),
      );

      // Parse or use seeded data
      const profile = this.generateSampleProfile(dotNumber);
      this.profiles.set(dotNumber, profile);

      return profile;
    } catch (err) {
      this.logger.error(`CSA fetch failed for ${dotNumber}:`, err.message);
      return this.generateSampleProfile(dotNumber);
    }
  }

  async getCarrierCSA(dotNumber: string): Promise<CarrierCSAProfile> {
    const cached = this.profiles.get(dotNumber);
    if (cached && this.isFresh(cached.lastUpdated)) {
      return cached;
    }
    return this.fetchCarrierCSA(dotNumber);
  }

  async checkAlerts(dotNumber: string): Promise<Array<{
    basic: BASICCategory;
    percentile: number;
    alertLevel: 'warning' | 'critical';
    message: string;
    actionRequired: string;
  }>> {
    const profile = await this.getCarrierCSA(dotNumber);
    const alerts: Array<{
      basic: BASICCategory;
      percentile: number;
      alertLevel: 'warning' | 'critical';
      message: string;
      actionRequired: string;
    }> = [];

    for (const basic of profile.basicScores) {
      const threshold = this.thresholds.find(t => t.basic === basic.category);
      if (!threshold) continue;

      if (basic.percentile >= threshold.criticalAt) {
        alerts.push({
          basic: basic.category,
          percentile: basic.percentile,
          alertLevel: 'critical',
          message: `${basic.category} percentile at ${basic.percentile}% — intervention threshold exceeded`,
          actionRequired: this.getActionPlan(basic.category, 'critical'),
        });
      } else if (basic.percentile >= threshold.warningAt) {
        alerts.push({
          basic: basic.category,
          percentile: basic.percentile,
          alertLevel: 'warning',
          message: `${basic.category} percentile at ${basic.percentile}% — approaching intervention threshold`,
          actionRequired: this.getActionPlan(basic.category, 'warning'),
        });
      }
    }

    return alerts;
  }

  async addDriverCSA(driverCSA: DriverCSA): Promise<void> {
    this.driverCSA.set(driverCSA.driverId, driverCSA);
    this.logger.log(`Driver CSA recorded: ${driverCSA.driverName} — ${driverCSA.totalViolations} violations`);
  }

  async getDriverCSA(driverId: string): Promise<DriverCSA | null> {
    return this.driverCSA.get(driverId) || null;
  }

  async getHighRiskDrivers(carrierId: string): Promise<DriverCSA[]> {
    return Array.from(this.driverCSA.values())
      .filter(d => d.oosViolations > 0 || d.totalViolations > 3)
      .sort((a, b) => b.totalViolations - a.totalViolations);
  }

  async generateActionPlan(dotNumber: string, basic: BASICCategory): Promise<string[]> {
    return this.getActionSteps(basic);
  }

  // Schedule monthly CSA check for all carriers
  async scheduleMonthlyCheck(): Promise<void> {
    for (const [dotNumber, profile] of this.profiles) {
      const alerts = await this.checkAlerts(dotNumber);
      if (alerts.length > 0) {
        this.logger.warn(`CSA ALERT: ${profile.carrierName} has ${alerts.length} alert(s)`);
      }
    }
  }

  private getActionPlan(basic: BASICCategory, level: 'warning' | 'critical'): string {
    const plans: Record<BASICCategory, Record<string, string>> = {
      'Unsafe Driving': {
        warning: 'Review driver behavior data. Implement driver coaching program.',
        critical: 'Immediate action: Remove high-risk drivers from dispatch priority. Implement ELD-connected speed monitoring. Schedule safety meeting within 48 hours.',
      },
      'Hours-of-Service Compliance': {
        warning: 'Audit driver logs. Ensure ELD compliance.',
        critical: 'CRITICAL: Potential for OOS orders. Audit all driver HOS immediately. Check for falsified logs. Review dispatch practices.',
      },
      'Driver Fitness': {
        warning: 'Verify all CDLs are current. Schedule medical recertifications.',
        critical: 'GROUND drivers with expired medical certificates immediately. Verify all CDL endorsements.',
      },
      'Controlled Substances/Alcohol': {
        warning: 'Verify drug testing program compliance. Check random testing rates.',
        critical: 'IMMEDIATE: Verify all testing records. Ground driver if positive test. Contact SAP if needed.',
      },
      'Vehicle Maintenance': {
        warning: 'Increase pre-trip inspection frequency. Schedule overdue maintenance.',
        critical: 'Pull vehicles with open violations. Complete all outstanding repairs before next dispatch.',
      },
      'Hazardous Materials Compliance': {
        warning: 'Audit hazmat training records. Verify shipping papers.',
        critical: 'STOP all hazmat operations until compliance verified. Contact DOT hazmat specialist.',
      },
      'Crash Indicator': {
        warning: 'Review crash prevention training. Analyze crash causes.',
        critical: 'Comprehensive safety review required. Consider defensive driving course for all drivers.',
      },
    };
    return plans[basic]?.[level] || 'Review compliance data and take corrective action.';
  }

  private getActionSteps(basic: BASICCategory): string[] {
    const steps: Record<BASICCategory, string[]> = {
      'Unsafe Driving': [
        'Pull driver behavior reports from ELD',
        'Identify top 3 violation types',
        'Schedule driver coaching sessions',
        'Implement speed monitoring alerts',
        'Retrain within 30 days',
      ],
      'Hours-of-Service Compliance': [
        'Export all driver logs for last 30 days',
        'Check for form & manner violations',
        'Verify ELD registration current',
        'Audit dispatch-load assignment timing',
        'Implement HOS pre-assignment checks',
      ],
      'Driver Fitness': [
        'Export driver qualification files',
        'Flag expired medical certificates',
        'Schedule recertification appointments',
        'Verify MVRs are current',
        'Ground non-compliant drivers',
      ],
      'Controlled Substances/Alcohol': [
        'Verify testing consortium membership',
        'Check random testing completion rate',
        'Verify pre-employment test records',
        'Ensure supervisor training current',
        'Document all testing for audit',
      ],
      'Vehicle Maintenance': [
        'Run all open vehicle violations report',
        'Schedule immediate repairs',
        'Increase DVIR compliance monitoring',
        'Verify maintenance records complete',
        'Implement preventive maintenance schedule',
      ],
      'Hazardous Materials Compliance': [
        'Audit hazmat employee training records',
        'Verify shipping paper accuracy',
        'Check hazmat registration current',
        'Ensure proper placarding procedures',
        'Contact DOT hazmat specialist',
      ],
      'Crash Indicator': [
        'Pull crash reports from last 24 months',
        'Analyze preventable vs non-preventable',
        'Schedule defensive driving training',
        'Review following distance policies',
        'Implement dashcam review process',
      ],
    };
    return steps[basic] || ['Review compliance data', 'Take corrective action', 'Monitor improvement'];
  }

  private generateSampleProfile(dotNumber: string): CarrierCSAProfile {
    return {
      carrierId: dotNumber,
      carrierName: 'Sample Carrier',
      dotNumber,
      mcNumber: `MC-${dotNumber}`,
      overallRating: 'Satisfactory',
      smsPercentile: 42,
      basicScores: [
        { category: 'Unsafe Driving', percentile: 35, alertStatus: 'no_alert', violations: 2, inspections: 12, benchmark: 'average' },
        { category: 'Hours-of-Service Compliance', percentile: 72, alertStatus: 'alert', violations: 4, inspections: 12, benchmark: 'below_average' },
        { category: 'Driver Fitness', percentile: 15, alertStatus: 'no_alert', violations: 0, inspections: 12, benchmark: 'above_average' },
        { category: 'Controlled Substances/Alcohol', percentile: 0, alertStatus: 'no_alert', violations: 0, inspections: 12, benchmark: 'above_average' },
        { category: 'Vehicle Maintenance', percentile: 58, alertStatus: 'alert', violations: 6, inspections: 12, benchmark: 'average' },
        { category: 'Crash Indicator', percentile: 45, alertStatus: 'no_alert', violations: 0, inspections: 12, benchmark: 'average' },
      ],
      totalViolations: 12,
      totalCrashes: 1,
      fatalCrashes: 0,
      injuryCrashes: 0,
      towCrashes: 1,
      lastUpdated: new Date(),
    };
  }

  private isFresh(date: Date): boolean {
    return Date.now() - date.getTime() < 7 * 24 * 3600 * 1000; // 1 week
  }
}
