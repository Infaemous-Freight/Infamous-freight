/**
 * Canadian Compliance Service
 * Handles CVOR, NSC, provincial regulations, and metric system requirements
 */

import { Injectable } from '@nestjs/common';
import { CanadianHOSValidator, CanadianDriverState, CanadianHOSResult } from './canadian-hos-rules';

export interface CanadianCarrierProfile {
  nscNumber?: string;                    // National Safety Code number
  cvorNumber?: string;                   // Commercial Vehicle Operator's Registration (Ontario)
  provincalOperatingAuthority: string[];  // Provincial authority numbers
  usDOT?: string;                        // If also operating in US
  scacCode?: string;                     // Standard Carrier Alpha Code
  weightClassification: 'light' | 'medium' | 'heavy'; // <4.5t, 4.5t-11.8t, >11.8t
  operatingJurisdiction: 'intra-provincial' | 'extra-provincial' | 'both';
}

export interface CanadianTripRequirements {
  tripNumber: string;
  driverName: string;
  driverLicenseNumber: string;
  driverLicenseProvince: string;
  vehiclePlateNumber: string;
  vehiclePlateProvince: string;
  trailerPlateNumber?: string;
  carrierName: string;
  carrierAddress: string;
  carrierNSCNumber?: string;
  homeTerminalAddress: string;
  coDriverName?: string;
  totalDistance?: number; // in kilometres
}

@Injectable()
export class CanadianComplianceService {
  private hosValidators: Map<string, CanadianHOSValidator> = new Map();

  constructor() {
    // Initialize validators for both zones
    this.hosValidators.set('south', new CanadianHOSValidator('south'));
    this.hosValidators.set('north', new CanadianHOSValidator('north'));
  }

  /**
   * Validate driver HOS status for Canadian operations
   */
  validateHOS(driver: CanadianDriverState, latitude: number): CanadianHOSResult {
    // Determine if north or south of 60°N
    const cycleType = latitude >= 60 ? 'north' : 'south';
    const validator = this.hosValidators.get(cycleType)!;
    return validator.validate(driver);
  }

  /**
   * Check if load can be assigned under Canadian HOS rules
   */
  canAssignLoad(
    driver: CanadianDriverState,
    latitude: number,
    estimatedDrivingMinutes: number,
    estimatedOnDutyMinutes: number,
  ): boolean {
    const cycleType = latitude >= 60 ? 'north' : 'south';
    const validator = this.hosValidators.get(cycleType)!;
    return validator.canAssignLoad(driver, estimatedDrivingMinutes, estimatedOnDutyMinutes);
  }

  /**
   * Convert imperial measurements to metric for Canadian compliance
   */
  convertToMetric(imperial: { miles: number; feet?: number; pounds?: number; gallons?: number; fahrenheit?: number }): {
    kilometres: number;
    metres?: number;
    kilograms?: number;
    litres?: number;
    celsius?: number;
  } {
    return {
      kilometres: Math.round(imperial.miles * 1.60934 * 10) / 10,
      ...(imperial.feet !== undefined && { metres: Math.round(imperial.feet * 0.3048 * 10) / 10 }),
      ...(imperial.pounds !== undefined && { kilograms: Math.round(imperial.pounds * 0.453592 * 10) / 10 }),
      ...(imperial.gallons !== undefined && { litres: Math.round(imperial.gallons * 3.78541 * 10) / 10 }),
      ...(imperial.fahrenheit !== undefined && {
        celsius: Math.round(((imperial.fahrenheit - 32) * 5 / 9) * 10) / 10,
      }),
    };
  }

  /**
   * Convert metric to imperial for US border crossings
   */
  convertToImperial(metric: { kilometres: number; metres?: number; kilograms?: number; litres?: number; celsius?: number }): {
    miles: number;
    feet?: number;
    pounds?: number;
    gallons?: number;
    fahrenheit?: number;
  } {
    return {
      miles: Math.round(metric.kilometres * 0.621371 * 10) / 10,
      ...(metric.metres !== undefined && { feet: Math.round(metric.metres * 3.28084 * 10) / 10 }),
      ...(metric.kilograms !== undefined && { pounds: Math.round(metric.kilograms * 2.20462 * 10) / 10 }),
      ...(metric.litres !== undefined && { gallons: Math.round(metric.litres * 0.264172 * 10) / 10 }),
      ...(metric.celsius !== undefined && {
        fahrenheit: Math.round((metric.celsius * 9 / 5 + 32) * 10) / 10,
      }),
    };
  }

  /**
   * Generate Canadian Daily Log requirements
   */
  generateDailyLogRequirements(carrier: CanadianCarrierProfile, trip: CanadianTripRequirements): string[] {
    const requirements: string[] = [];

    // NSC requirement: All extra-provincial carriers must have NSC number
    if (carrier.operatingJurisdiction !== 'intra-provincial' && !carrier.nscNumber) {
      requirements.push('NSC number required for extra-provincial operations');
    }

    // Ontario CVOR requirement
    if (trip.vehiclePlateProvince === 'ON' || trip.driverLicenseProvince === 'ON') {
      if (!carrier.cvorNumber) {
        requirements.push('CVOR required for Ontario operations');
      }
    }

    // Trip inspection required every 24 hours or at each fueling >1000km
    requirements.push('Pre-trip inspection required before first use of the day');
    requirements.push('Post-trip inspection required at end of day');

    if ((trip.totalDistance || 0) > 1000) {
      requirements.push('En-route inspection required (distance exceeds 1,000 km)');
    }

    // CDR (Commercial Driver Registration) for Quebec
    if (trip.vehiclePlateProvince === 'QC' || trip.driverLicenseProvince === 'QC') {
      requirements.push('Quebec CDR registration may be required');
    }

    // National Safety Code requirements
    requirements.push('Daily log must be maintained for all commercial drivers');
    requirements.push('Original daily logs retained for 6 months');
    requirements.push('Supporting documents must be reconciled with daily logs');

    return requirements;
  }

  /**
   * Calculate Canadian fuel tax (IFTA-equivalent provincial reporting)
   */
  calculateProvincialFuelTax(
    kilometresByProvince: Map<string, number>,
    totalLitres: number,
  ): Map<string, { litresConsumed: number; taxOwing: number }> {
    // Distribute fuel consumption proportionally by km
    const totalKm = Array.from(kilometresByProvince.values()).reduce((a, b) => a + b, 0);
    const litresPerKm = totalKm > 0 ? totalLitres / totalKm : 0;

    const result = new Map<string, { litresConsumed: number; taxOwing: number }>();

    // Provincial tax rates per litre (approximate 2024 rates)
    const taxRates: Record<string, number> = {
      AB: 0.00,   // No provincial fuel tax
      BC: 0.205,
      MB: 0.143,
      NB: 0.155,
      NL: 0.203,
      NS: 0.154,
      NT: 0.061,
      NU: 0.061,
      ON: 0.147,
      PE: 0.154,
      QC: 0.203,
      SK: 0.15,
      YT: 0.061,
    };

    kilometresByProvince.forEach((km, province) => {
      const litresConsumed = km * litresPerKm;
      const rate = taxRates[province] || 0;
      result.set(province, {
        litresConsumed: Math.round(litresConsumed * 100) / 100,
        taxOwing: Math.round(litresConsumed * rate * 100) / 100,
      });
    });

    return result;
  }

  /**
   * Get province-specific permit requirements
   */
  getPermitRequirements(provinces: string[], weightKg: number): string[] {
    const permits: string[] = [];

    provinces.forEach(province => {
      // Oversize/overweight permits
      if (weightKg > 63500) { // ~140,000 lbs
        permits.push(`${province}: Special overweight permit required (${Math.round(weightKg / 1000)}t)`);
      } else if (weightKg > 52500) { // ~115,500 lbs
        permits.push(`${province}: Extended weight permit may be required`);
      }

      // Province-specific
      switch (province) {
        case 'BC':
          permits.push('BC: Weigh2Go Pass recommended');
          break;
        case 'AB':
          if (weightKg > 63500) permits.push('AB: TRUCS permit required for LCV');
          break;
        case 'ON':
          permits.push('ON: Pre-clearance account recommended for 407 ETR');
          break;
        case 'QC':
          permits.push('QC: CDR registration check required');
          break;
      }
    });

    return permits;
  }

  /**
   * Format distance for Canadian drivers (metric primary, imperial secondary)
   */
  formatDistance(kilometres: number): string {
    const miles = Math.round(kilometres * 0.621371 * 10) / 10;
    return `${kilometres.toLocaleString()} km (${miles.toLocaleString()} mi)`;
  }

  /**
   * Format temperature for Canadian use
   */
  formatTemperature(celsius: number): string {
    const fahrenheit = Math.round((celsius * 9 / 5 + 32) * 10) / 10;
    return `${celsius}°C (${fahrenheit}°F)`;
  }

  /**
   * Format weight for Canadian use
   */
  formatWeight(kilograms: number): string {
    const pounds = Math.round(kilograms * 2.20462);
    if (kilograms >= 1000) {
      return `${(kilograms / 1000).toFixed(1)}t (${(pounds / 2000).toFixed(1)} tons)`;
    }
    return `${kilograms.toLocaleString()} kg (${pounds.toLocaleString()} lbs)`;
  }
}
