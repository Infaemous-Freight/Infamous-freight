import { Injectable } from '@nestjs/common';

export type ELDProvider = 'samsara' | 'motive' | 'omnitracs' | 'geotab';

export interface UnifiedDriverHOS {
  driverId: string;
  driverName: string;
  provider: ELDProvider;

  // Duty status
  currentStatus: 'off_duty' | 'sleeper' | 'driving' | 'on_duty' | 'personal_use';
  statusSince: Date;

  // Daily clocks
  drivingMinutesToday: number;
  onDutyMinutesToday: number;
  shiftElapsedMinutes: number;

  // Weekly/cycle clocks
  onDutyMinutesThisWeek: number;    // US: 70hr/8day, Canada: varies
  cycleType: 'us_70_8' | 'us_60_7' | 'canada_south' | 'canada_north';
  cycleResetAt?: Date;

  // Break requirements
  consecutiveDrivingMinutes: number;
  breakRequiredInMinutes: number;
  dailyRestMinutes: number;
  restRequiredInMinutes: number;

  // Flags
  canDrive: boolean;
  canWork: boolean;
  isInViolation: boolean;
  violations: string[];
  warnings: string[];

  // Location
  currentLocation?: { lat: number; lng: number; timestamp: Date };

  // Raw data for debugging
  rawData?: any;
}

@Injectable()
export class UnifiedHOSAdapter {
  normalize(raw: any, provider: ELDProvider): UnifiedDriverHOS {
    switch (provider) {
      case 'samsara':
        return this.normalizeSamsara(raw);
      case 'motive':
        return this.normalizeMotive(raw);
      case 'omnitracs':
        return this.normalizeOmnitracs(raw);
      case 'geotab':
        return this.normalizeGeotab(raw);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private normalizeSamsara(raw: any): UnifiedDriverHOS {
    const clocks = raw.clocks || {};
    return {
      driverId: raw.driver?.id || raw.driverId,
      driverName: raw.driver?.name || 'Unknown',
      provider: 'samsara',
      currentStatus: this.mapSamsaraStatus(raw.dutyStatus?.status),
      statusSince: new Date(raw.dutyStatus?.startTime || Date.now()),
      drivingMinutesToday: Math.floor((clocks.drivingRemainingMs || 0) / 60000),
      onDutyMinutesToday: Math.floor((clocks.dutyRemainingMs || 0) / 60000),
      shiftElapsedMinutes: Math.floor((clocks.shiftRemainingMs || 0) / 60000),
      onDutyMinutesThisWeek: Math.floor((clocks.cycleRemainingMs || 0) / 60000),
      cycleType: 'us_70_8',
      consecutiveDrivingMinutes: Math.floor((clocks.driveTimeSinceBreakMs || 0) / 60000),
      breakRequiredInMinutes: Math.max(0, 480 - Math.floor((clocks.driveTimeSinceBreakMs || 0) / 60000)),
      dailyRestMinutes: 0, // Calculate from logs
      restRequiredInMinutes: 600,
      canDrive: !raw.isInViolation && (clocks.drivingRemainingMs || 0) > 0,
      canWork: !raw.isInViolation,
      isInViolation: raw.isInViolation || false,
      violations: raw.violations?.map((v: any) => v.type) || [],
      warnings: raw.warnings?.map((w: any) => w.type) || [],
      currentLocation: raw.driver?.currentLocation,
      rawData: raw,
    };
  }

  private normalizeMotive(raw: any): UnifiedDriverHOS {
    const dutyStatus = raw.duty_status || {};
    const clocks = raw.clocks || {};
    return {
      driverId: raw.driver_id || raw.id,
      driverName: `${raw.first_name || ''} ${raw.last_name || ''}`.trim(),
      provider: 'motive',
      currentStatus: this.mapMotiveStatus(dutyStatus.status),
      statusSince: new Date(dutyStatus.since || Date.now()),
      drivingMinutesToday: Math.floor((clocks.driving_remaining_seconds || 0) / 60),
      onDutyMinutesToday: Math.floor((clocks.on_duty_remaining_seconds || 0) / 60),
      shiftElapsedMinutes: Math.floor((clocks.shift_remaining_seconds || 0) / 60),
      onDutyMinutesThisWeek: Math.floor((clocks.cycle_remaining_seconds || 0) / 60),
      cycleType: 'us_70_8',
      consecutiveDrivingMinutes: Math.floor((clocks.driving_since_break_seconds || 0) / 60),
      breakRequiredInMinutes: Math.max(0, 480 - Math.floor((clocks.driving_since_break_seconds || 0) / 60)),
      dailyRestMinutes: 0,
      restRequiredInMinutes: 600,
      canDrive: (clocks.driving_remaining_seconds || 0) > 0,
      canWork: (clocks.on_duty_remaining_seconds || 0) > 0,
      isInViolation: raw.in_violation || false,
      violations: raw.violations || [],
      warnings: raw.warnings || [],
      currentLocation: raw.current_location,
      rawData: raw,
    };
  }

  private normalizeOmnitracs(raw: any): UnifiedDriverHOS {
    return {
      driverId: raw.driverId || raw.personId,
      driverName: raw.driverName || 'Unknown',
      provider: 'omnitracs',
      currentStatus: this.mapOmnitracsStatus(raw.currentStatus),
      statusSince: new Date(raw.statusSince || Date.now()),
      drivingMinutesToday: Math.floor((raw.drivingTimeLeftToday || 0) / 60),
      onDutyMinutesToday: Math.floor((raw.onDutyTimeLeftToday || 0) / 60),
      shiftElapsedMinutes: Math.floor((raw.shiftTimeLeft || 0) / 60),
      onDutyMinutesThisWeek: Math.floor((raw.cycleTimeLeft || 0) / 60),
      cycleType: 'us_70_8',
      consecutiveDrivingMinutes: Math.floor((raw.consecutiveDriving || 0) / 60),
      breakRequiredInMinutes: Math.max(0, 480 - Math.floor((raw.consecutiveDriving || 0) / 60)),
      dailyRestMinutes: 0,
      restRequiredInMinutes: 600,
      canDrive: raw.canDrive || false,
      canWork: raw.canWork || false,
      isInViolation: raw.isInViolation || false,
      violations: raw.violations || [],
      warnings: raw.warnings || [],
      currentLocation: raw.location,
      rawData: raw,
    };
  }

  private normalizeGeotab(raw: any): UnifiedDriverHOS {
    return {
      driverId: raw.driver?.id || raw.id,
      driverName: raw.driver?.name || 'Unknown',
      provider: 'geotab',
      currentStatus: this.mapGeotabStatus(raw.status),
      statusSince: new Date(raw.statusDateTime || Date.now()),
      drivingMinutesToday: 0, // Geotab provides via DutyStatusLog search
      onDutyMinutesToday: 0,
      shiftElapsedMinutes: 0,
      onDutyMinutesThisWeek: 0,
      cycleType: 'us_70_8',
      consecutiveDrivingMinutes: 0,
      breakRequiredInMinutes: 480,
      dailyRestMinutes: 0,
      restRequiredInMinutes: 600,
      canDrive: true,
      canWork: true,
      isInViolation: false,
      violations: [],
      warnings: [],
      currentLocation: raw.device?.lastLocation,
      rawData: raw,
    };
  }

  // Status mappings
  private mapSamsaraStatus(s?: string): UnifiedDriverHOS['currentStatus'] {
    switch (s) {
      case 'OFF_DUTY': return 'off_duty';
      case 'ON_DUTY': return 'on_duty';
      case 'DRIVE': return 'driving';
      case 'SLEEPER': return 'sleeper';
      case 'YARD_MOVE': return 'on_duty';
      case 'PERSONAL_CONVEYANCE': return 'personal_use';
      default: return 'off_duty';
    }
  }

  private mapMotiveStatus(s?: string): UnifiedDriverHOS['currentStatus'] {
    switch (s) {
      case 'off_duty': return 'off_duty';
      case 'on_duty': return 'on_duty';
      case 'driving': return 'driving';
      case 'sleeper_berth': return 'sleeper';
      case 'personal_use': return 'personal_use';
      default: return 'off_duty';
    }
  }

  private mapOmnitracsStatus(s?: string): UnifiedDriverHOS['currentStatus'] {
    switch (s) {
      case 'OFF': return 'off_duty';
      case 'D': return 'driving';
      case 'ON': return 'on_duty';
      case 'SB': return 'sleeper';
      default: return 'off_duty';
    }
  }

  private mapGeotabStatus(s?: string): UnifiedDriverHOS['currentStatus'] {
    switch (s) {
      case 'OffDuty': return 'off_duty';
      case 'OnDuty': return 'on_duty';
      case 'Driving': return 'driving';
      case 'SleepRest': return 'sleeper';
      default: return 'off_duty';
    }
  }
}
