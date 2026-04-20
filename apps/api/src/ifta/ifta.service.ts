import { Injectable, Logger } from '@nestjs/common';

export interface FuelPurchase {
  id: string;
  vehicleId: string;
  driverId: string;
  date: Date;
  state: string; // Jurisdiction
  gallons: number;
  totalCost: number;
  odometer: number;
  vendor?: string;
  receiptUrl?: string;
}

export interface MileageByJurisdiction {
  state: string;
  totalMiles: number;
  taxableMiles: number;
  fuelGallons: number;
  mpg: number;
  taxPaidGallons: number;
  netTaxableGallons: number;
  taxRate: number;
  taxOwing: number;
  taxCredit: number;
  netTax: number;
}

export interface IFTAQuarterlyReturn {
  carrierId: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  jurisdictions: MileageByJurisdiction[];
  totalMiles: number;
  totalTaxableMiles: number;
  totalFuelGallons: number;
  totalTaxOwing: number;
  totalTaxCredit: number;
  netTaxDue: number;
  interestDue: number;
  totalDue: number;
  filedAt?: Date;
  status: 'draft' | 'filed' | 'accepted';
}

@Injectable()
export class IFTAService {
  private readonly logger = new Logger(IFTAService.name);

  // 2024 IFTA tax rates per gallon (approximate, varies by jurisdiction)
  private readonly TAX_RATES: Record<string, number> = {
    AL: 0.29, AK: 0.0895, AZ: 0.26, AR: 0.285, CA: 0.579, CO: 0.205,
    CT: 0.4625, DE: 0.23, FL: 0.31917, GA: 0.311, ID: 0.32, IL: 0.559,
    IN: 0.49, IA: 0.325, KS: 0.26, KY: 0.323, LA: 0.20, ME: 0.332,
    MD: 0.3695, MA: 0.24, MI: 0.263, MN: 0.285, MS: 0.18, MO: 0.17,
    MT: 0.3175, NE: 0.288, NV: 0.28, NH: 0.222, NJ: 0.175, NM: 0.21,
    NY: 0.416, NC: 0.3635, ND: 0.23, OH: 0.28, OK: 0.19, OR: 0.38,
    PA: 0.747, RI: 0.34, SC: 0.28, SD: 0.30, TN: 0.27, TX: 0.20,
    UT: 0.3195, VT: 0.32, VA: 0.212, WA: 0.494, WV: 0.357, WI: 0.309,
    WY: 0.24, DC: 0.235,
  };

  async addFuelPurchase(purchase: FuelPurchase): Promise<void> {
    // In production: save to database
    this.logger.log(`Fuel purchase recorded: ${purchase.gallons} gal in ${purchase.state}`);
  }

  async importFuelCSV(carrierId: string, csvData: string): Promise<{
    imported: number;
    errors: string[];
  }> {
    // Parse CSV: date,vehicle_id,state,gallons,total_cost,odometer
    const lines = csvData.split('\n').slice(1); // Skip header
    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols.length < 5) {
        errors.push(`Line ${i + 2}: insufficient columns`);
        continue;
      }

      try {
        const purchase: FuelPurchase = {
          id: `fuel_${carrierId}_${Date.now()}_${i}`,
          vehicleId: cols[1].trim(),
          driverId: '', // Resolve from vehicle
          date: new Date(cols[0].trim()),
          state: cols[2].trim().toUpperCase(),
          gallons: parseFloat(cols[3].trim()),
          totalCost: parseFloat(cols[4].trim()),
          odometer: parseFloat(cols[5]?.trim() || '0'),
        };

        await this.addFuelPurchase(purchase);
        imported++;
      } catch (err) {
        errors.push(`Line ${i + 2}: ${err.message}`);
      }
    }

    return { imported, errors };
  }

  async calculateQuarterlyReturn(
    carrierId: string,
    year: number,
    quarter: 1 | 2 | 3 | 4,
    mileageData: Array<{ state: string; miles: number }>,
    fuelPurchases: FuelPurchase[],
  ): Promise<IFTAQuarterlyReturn> {
    // Group mileage and fuel by jurisdiction
    const jurisdictionData = new Map<string, { miles: number; fuel: number }>();

    for (const m of mileageData) {
      const key = m.state.toUpperCase();
      const existing = jurisdictionData.get(key) || { miles: 0, fuel: 0 };
      existing.miles += m.miles;
      jurisdictionData.set(key, existing);
    }

    for (const f of fuelPurchases) {
      const key = f.state.toUpperCase();
      const existing = jurisdictionData.get(key) || { miles: 0, fuel: 0 };
      existing.fuel += f.gallons;
      jurisdictionData.set(key, existing);
    }

    const jurisdictions: MileageByJurisdiction[] = [];
    let totalMiles = 0;
    let totalTaxableMiles = 0;
    let totalFuelGallons = 0;
    let totalTaxOwing = 0;
    let totalTaxCredit = 0;

    for (const [state, data] of jurisdictionData) {
      const taxableMiles = data.miles; // Simplified: all miles are taxable
      const mpg = data.fuel > 0 ? data.miles / data.fuel : 6.0; // Default 6 MPG
      const taxRate = this.TAX_RATES[state] || 0;
      const taxPaidGallons = data.fuel;
      const netTaxableGallons = (taxableMiles / mpg) - taxPaidGallons;
      const taxOwing = netTaxableGallons * taxRate;
      const taxCredit = taxPaidGallons * taxRate;

      jurisdictions.push({
        state,
        totalMiles: Math.round(data.miles * 100) / 100,
        taxableMiles: Math.round(taxableMiles * 100) / 100,
        fuelGallons: Math.round(data.fuel * 100) / 100,
        mpg: Math.round(mpg * 100) / 100,
        taxPaidGallons: Math.round(taxPaidGallons * 100) / 100,
        netTaxableGallons: Math.round(netTaxableGallons * 100) / 100,
        taxRate,
        taxOwing: Math.max(0, Math.round(taxOwing * 100) / 100),
        taxCredit: Math.round(taxCredit * 100) / 100,
        netTax: Math.round((taxOwing - taxCredit) * 100) / 100,
      });

      totalMiles += data.miles;
      totalTaxableMiles += taxableMiles;
      totalFuelGallons += data.fuel;
      totalTaxOwing += Math.max(0, taxOwing);
      totalTaxCredit += taxCredit;
    }

    const netTaxDue = totalTaxOwing - totalTaxCredit;
    const interestDue = 0; // Calculate if filing late
    const totalDue = netTaxDue + interestDue;

    return {
      carrierId,
      year,
      quarter,
      jurisdictions,
      totalMiles: Math.round(totalMiles * 100) / 100,
      totalTaxableMiles: Math.round(totalTaxableMiles * 100) / 100,
      totalFuelGallons: Math.round(totalFuelGallons * 100) / 100,
      totalTaxOwing: Math.round(totalTaxOwing * 100) / 100,
      totalTaxCredit: Math.round(totalTaxCredit * 100) / 100,
      netTaxDue: Math.round(netTaxDue * 100) / 100,
      interestDue,
      totalDue: Math.round(totalDue * 100) / 100,
      status: 'draft',
    };
  }

  async exportToExcel(report: IFTAQuarterlyReturn): Promise<{ downloadUrl: string }> {
    // In production: generate actual Excel with xlsx library
    this.logger.log(`IFTA report Q${report.quarter} ${report.year} exported`);
    return { downloadUrl: `/ifta/${report.carrierId}/Q${report.quarter}_${report.year}.xlsx` };
  }

  async exportToPDF(report: IFTAQuarterlyReturn): Promise<{ downloadUrl: string }> {
    // In production: generate PDF
    this.logger.log(`IFTA report Q${report.quarter} ${report.year} PDF exported`);
    return { downloadUrl: `/ifta/${report.carrierId}/Q${report.quarter}_${report.year}.pdf` };
  }

  // Get upcoming filing deadlines
  getFilingDeadlines(year: number): Array<{ quarter: number; deadline: Date }> {
    return [
      { quarter: 1, deadline: new Date(year, 3, 30) },  // April 30
      { quarter: 2, deadline: new Date(year, 6, 31) },  // July 31
      { quarter: 3, deadline: new Date(year, 9, 31) },  // October 31
      { quarter: 4, deadline: new Date(year + 1, 0, 31) }, // January 31
    ];
  }

  // Mileage from ELD GPS data (by jurisdiction)
  async getMileageFromELD(carrierId: string, startDate: Date, endDate: Date): Promise<Array<{ state: string; miles: number }>> {
    // In production: query ELD location history, match lat/lng to state polygons
    this.logger.log(`Calculating ELD mileage for ${carrierId} from ${startDate} to ${endDate}`);
    return []; // Placeholder
  }
}
