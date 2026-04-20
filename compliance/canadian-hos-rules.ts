/**
 * Canadian HOS (Hours of Service) Compliance Module
 * Implements Canadian Commercial Vehicle Drivers HOS Regulations (SOR/2005-313)
 */

export interface CanadianDriverState {
  shiftElapsedMinutes: number;        // Current shift elapsed time
  drivingMinutesToday: number;        // Driving time today
  drivingMinutesThisShift: number;    // Driving time in current shift
  onDutyMinutesToday: number;         // On-duty time today (driving + other work)
  onDutyMinutesThisShift: number;     // On-duty time in current shift
  consecutiveDrivingMinutes: number;  // Current consecutive driving without break
  dailyRestMinutes: number;           // Rest taken today
  cycleElapsedMinutes: number;        // Cycle (7 or 14 day) elapsed time
  deferralUsed: boolean;              // Daily deferral used today
  deferralMinutes: number;            // Deferred rest minutes if used
}

export interface CanadianHOSResult {
  status: 'compliant' | 'warning' | 'violation';
  violations: CanadianHOSViolation[];
  limits: CanadianHOSLimits;
  requiredRestMinutes: number;
  canDrive: boolean;
  canWork: boolean;
}

export interface CanadianHOSViolation {
  rule: string;
  severity: 'critical' | 'warning';
  currentValue: number;
  limitValue: number;
  message: string;
}

export interface CanadianHOSLimits {
  maxDrivingMinutesPerDay: number;
  maxOnDutyMinutesPerDay: number;
  maxShiftMinutes: number;
  maxConsecutiveDrivingMinutes: number;
  requiredRestMinutesPerDay: number;
  minOffDutyBetweenShifts: number;
  cycleType: 'south' | 'north';       // South of 60°N = 7-day, North = 14-day
  maxOnDutyMinutesInCycle: number;
}

// Default limits for south of 60°N (7-day cycle)
const SOUTH_60_LIMITS: CanadianHOSLimits = {
  maxDrivingMinutesPerDay: 780,        // 13 hours
  maxOnDutyMinutesPerDay: 840,         // 14 hours
  maxShiftMinutes: 960,                // 16 hours (including breaks)
  maxConsecutiveDrivingMinutes: 480,   // 8 hours before 30-min break
  requiredRestMinutesPerDay: 600,      // 10 hours minimum daily
  minOffDutyBetweenShifts: 480,        // 8 hours off between shifts
  cycleType: 'south',
  maxOnDutyMinutesInCycle: 4200,       // 70 hours in 7 days
};

// Limits for north of 60°N (14-day cycle)
const NORTH_60_LIMITS: CanadianHOSLimits = {
  maxDrivingMinutesPerDay: 900,        // 15 hours
  maxOnDutyMinutesPerDay: 960,         // 16 hours
  maxShiftMinutes: 1200,               // 20 hours
  maxConsecutiveDrivingMinutes: 480,   // 8 hours before 30-min break
  requiredRestMinutesPerDay: 480,      // 8 hours minimum daily
  minOffDutyBetweenShifts: 360,        // 6 hours off between shifts
  cycleType: 'north',
  maxOnDutyMinutesInCycle: 7200,       // 120 hours in 14 days
};

export class CanadianHOSValidator {
  private readonly limits: CanadianHOSLimits;

  constructor(cycleType: 'south' | 'north' = 'south') {
    this.limits = cycleType === 'south' ? SOUTH_60_LIMITS : NORTH_60_LIMITS;
  }

  validate(driver: CanadianDriverState): CanadianHOSResult {
    const violations: CanadianHOSViolation[] = [];

    // Rule 1: Daily driving limit (13h south / 15h north)
    if (driver.drivingMinutesToday > this.limits.maxDrivingMinutesPerDay) {
      violations.push({
        rule: 'Daily Driving Limit',
        severity: 'critical',
        currentValue: Math.round(driver.drivingMinutesToday / 60 * 100) / 100,
        limitValue: this.limits.maxDrivingMinutesPerDay / 60,
        message: `Driving time (${(driver.drivingMinutesToday / 60).toFixed(1)}h) exceeds daily limit (${this.limits.maxDrivingMinutesPerDay / 60}h)`,
      });
    } else if (driver.drivingMinutesToday > this.limits.maxDrivingMinutesPerDay * 0.9) {
      violations.push({
        rule: 'Daily Driving Limit',
        severity: 'warning',
        currentValue: Math.round(driver.drivingMinutesToday / 60 * 100) / 100,
        limitValue: this.limits.maxDrivingMinutesPerDay / 60,
        message: `Driving time within 10% of daily limit`,
      });
    }

    // Rule 2: Daily on-duty limit (14h south / 16h north)
    if (driver.onDutyMinutesToday > this.limits.maxOnDutyMinutesPerDay) {
      violations.push({
        rule: 'Daily On-Duty Limit',
        severity: 'critical',
        currentValue: Math.round(driver.onDutyMinutesToday / 60 * 100) / 100,
        limitValue: this.limits.maxOnDutyMinutesPerDay / 60,
        message: `On-duty time (${(driver.onDutyMinutesToday / 60).toFixed(1)}h) exceeds daily limit`,
      });
    }

    // Rule 3: Shift limit (16h south / 20h north)
    if (driver.shiftElapsedMinutes > this.limits.maxShiftMinutes) {
      violations.push({
        rule: 'Shift Limit',
        severity: 'critical',
        currentValue: Math.round(driver.shiftElapsedMinutes / 60 * 100) / 100,
        limitValue: this.limits.maxShiftMinutes / 60,
        message: `Current shift (${(driver.shiftElapsedMinutes / 60).toFixed(1)}h) exceeds maximum shift length`,
      });
    }

    // Rule 4: Consecutive driving (8h before 30-min break)
    if (driver.consecutiveDrivingMinutes > this.limits.maxConsecutiveDrivingMinutes) {
      violations.push({
        rule: 'Consecutive Driving',
        severity: 'critical',
        currentValue: driver.consecutiveDrivingMinutes,
        limitValue: this.limits.maxConsecutiveDrivingMinutes,
        message: `Must take 30-minute break after ${this.limits.maxConsecutiveDrivingMinutes / 60} hours of consecutive driving`,
      });
    } else if (driver.consecutiveDrivingMinutes > this.limits.maxConsecutiveDrivingMinutes * 0.85) {
      violations.push({
        rule: 'Consecutive Driving',
        severity: 'warning',
        currentValue: driver.consecutiveDrivingMinutes,
        limitValue: this.limits.maxConsecutiveDrivingMinutes,
        message: `30-minute break required soon`,
      });
    }

    // Rule 5: Cycle limit (70h/7 south / 120h/14 north)
    if (driver.cycleElapsedMinutes > this.limits.maxOnDutyMinutesInCycle) {
      violations.push({
        rule: 'Cycle Limit',
        severity: 'critical',
        currentValue: Math.round(driver.cycleElapsedMinutes / 60 * 100) / 100,
        limitValue: this.limits.maxOnDutyMinutesInCycle / 60,
        message: `Cycle hours (${(driver.cycleElapsedMinutes / 60).toFixed(1)}h) exceeded`,
      });
    }

    // Rule 6: Daily rest requirement
    if (driver.dailyRestMinutes < this.limits.requiredRestMinutesPerDay && !driver.deferralUsed) {
      violations.push({
        rule: 'Daily Rest Requirement',
        severity: 'critical',
        currentValue: Math.round(driver.dailyRestMinutes / 60 * 100) / 100,
        limitValue: this.limits.requiredRestMinutesPerDay / 60,
        message: `Daily rest (${(driver.dailyRestMinutes / 60).toFixed(1)}h) below minimum (${this.limits.requiredRestMinutesPerDay / 60}h)`,
      });
    }

    // Determine overall status
    let status: 'compliant' | 'warning' | 'violation' = 'compliant';
    if (violations.some(v => v.severity === 'critical')) {
      status = 'violation';
    } else if (violations.length > 0) {
      status = 'warning';
    }

    // Calculate required rest
    const requiredRestMinutes = this.calculateRequiredRest(driver);

    return {
      status,
      violations,
      limits: this.limits,
      requiredRestMinutes,
      canDrive: status !== 'violation' && driver.consecutiveDrivingMinutes < this.limits.maxConsecutiveDrivingMinutes,
      canWork: status !== 'violation',
    };
  }

  private calculateRequiredRest(driver: CanadianDriverState): number {
    // If cycle exhausted, need 36h consecutive off (south) or 72h (north)
    if (driver.cycleElapsedMinutes > this.limits.maxOnDutyMinutesInCycle) {
      return this.limits.cycleType === 'south' ? 2160 : 4320; // 36h or 72h
    }

    // If daily limits hit, need standard off-duty
    const neededForDaily = Math.max(0, this.limits.requiredRestMinutesPerDay - driver.dailyRestMinutes);
    const neededBetweenShifts = this.limits.minOffDutyBetweenShifts;

    return Math.max(neededForDaily, neededBetweenShifts);
  }

  // Check if a proposed load can be legally assigned
  canAssignLoad(driver: CanadianDriverState, estimatedDrivingMinutes: number, estimatedOnDutyMinutes: number): boolean {
    const projected = {
      ...driver,
      drivingMinutesToday: driver.drivingMinutesToday + estimatedDrivingMinutes,
      onDutyMinutesToday: driver.onDutyMinutesToday + estimatedOnDutyMinutes,
      shiftElapsedMinutes: driver.shiftElapsedMinutes + estimatedOnDutyMinutes,
      consecutiveDrivingMinutes: driver.consecutiveDrivingMinutes + estimatedDrivingMinutes,
    };

    const result = this.validate(projected);
    return result.canDrive && result.status !== 'violation';
  }

  // Get remaining available driving minutes today
  getRemainingDrivingMinutes(driver: CanadianDriverState): number {
    return Math.max(0, this.limits.maxDrivingMinutesPerDay - driver.drivingMinutesToday);
  }

  // Get remaining available on-duty minutes today
  getRemainingOnDutyMinutes(driver: CanadianDriverState): number {
    return Math.max(0, this.limits.maxOnDutyMinutesPerDay - driver.onDutyMinutesToday);
  }
}

// Export default limits for reference
export { SOUTH_60_LIMITS, NORTH_60_LIMITS };
