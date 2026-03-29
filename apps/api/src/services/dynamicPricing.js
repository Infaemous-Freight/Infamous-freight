// apps/api/src/services/dynamicPricing.js

class DynamicPricingService {
  /**
   * Real-time dynamic pricing based on demand, distance, and conditions
   */

  constructor(prisma) {
    this.prisma = prisma;
    this.baseRates = {
      perMile: 2.5,
      perPound: 0.15,
      baseCharge: 10,
    };
  }

  /**
   * Calculate dynamic price based on multiple factors
   */
  async calculateDynamicPrice(shipment) {
    // Base price
    let price = this.calculateBasePrice(shipment);

    // Apply demand multiplier
    const demandMultiplier = await this.getDemandMultiplier(shipment.destination, new Date());
    price *= demandMultiplier;

    // Apply urgency surcharge
    const urgencyMultiplier = this.getUrgencyMultiplier(shipment.urgency);
    price *= urgencyMultiplier;

    // Apply day/time surcharge
    const timeMultiplier = this.getTimeMultiplier(new Date());
    price *= timeMultiplier;

    // Apply weather surcharge if applicable
    const weatherMultiplier = await this.getWeatherMultiplier(shipment.destination);
    price *= weatherMultiplier;

    // Apply distance-based discount (bulk shipping)
    if (shipment.weight > 200 || shipment.distance > 1000) {
      price *= 0.85; // 15% discount for large shipments
    }

    // Apply seasonal pricing
    const seasonalMultiplier = this.getSeasonalMultiplier();
    price *= seasonalMultiplier;

    // Cap the price to avoid extreme outliers
    price = Math.max(price, this.baseRates.baseCharge);
    price = Math.min(price, price * 2.5); // Cap at 2.5x base

    return {
      basePrice: this.calculateBasePrice(shipment),
      demandMultiplier,
      urgencyMultiplier,
      timeMultiplier,
      weatherMultiplier,
      seasonalMultiplier,
      finalPrice: Math.round(price * 100) / 100,
      breakdown: {
        mileage: this.calculateBasePrice(shipment),
        demand: (demandMultiplier - 1) * 100,
        urgency: (urgencyMultiplier - 1) * 100,
        time: (timeMultiplier - 1) * 100,
        weather: (weatherMultiplier - 1) * 100,
      },
    };
  }

  /**
   * Calculate base price from weight and distance
   */
  calculateBasePrice(shipment) {
    const distanceCost = shipment.distance * this.baseRates.perMile;
    const weightCost = shipment.weight * this.baseRates.perPound;
    return this.baseRates.baseCharge + distanceCost + weightCost;
  }

  /**
   * Get demand multiplier for location and time
   */
  async getDemandMultiplier(location, timestamp) {
    // Check recent shipments to/from location
    const recentShipments = await this.prisma.shipment.count({
      where: {
        destination: location,
        createdAt: { gte: new Date(timestamp.getTime() - 60 * 60 * 1000) }, // Last hour
      },
    });

    // Available drivers
    const availableDrivers = await this.prisma.driver.count({
      where: { status: "available", preferredAreas: { has: location } },
    });

    if (availableDrivers === 0) return 1.5; // High demand
    if (recentShipments > 50) return 1.3;
    if (recentShipments > 20) return 1.15;
    if (recentShipments < 5) return 0.9; // Low demand discount

    return 1.0;
  }

  /**
   * Get urgency-based multiplier
   */
  getUrgencyMultiplier(urgency) {
    switch (urgency) {
      case "overnight":
        return 2.0;
      case "express":
        return 1.5;
      case "standard":
        return 1.0;
      default:
        return 1.0;
    }
  }

  /**
   * Get time-based multiplier (peak hours)
   */
  getTimeMultiplier(timestamp) {
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();

    // Peak hours: 8am-10am, 12pm-1pm, 4pm-6pm
    if ((hour >= 8 && hour < 10) || (hour >= 12 && hour < 13) || (hour >= 16 && hour < 18)) {
      // Weekend pricing is lower
      return dayOfWeek === 0 || dayOfWeek === 6 ? 1.1 : 1.3;
    }

    // Night hours (8pm-6am) are cheaper
    if (hour >= 20 || hour < 6) {
      return 0.8;
    }

    return 1.0;
  }

  /**
   * Get weather multiplier
   */
  async getWeatherMultiplier(location) {
    // In production, call weather API
    // For now, return default
    return 1.0;
  }

  /**
   * Get seasonal multiplier
   */
  getSeasonalMultiplier() {
    const month = new Date().getMonth();

    // Holiday season (Nov-Dec)
    if (month >= 10) return 1.2;

    // Summer (Jun-Aug)
    if (month >= 5 && month <= 7) return 1.1;

    return 1.0;
  }

  /**
   * Suggest optimal scheduling for cheaper rates
   */
  getSuggestedSchedules(shipment) {
    const suggestions = [];

    // Check next 7 days for cheapest times
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const morningPrice = this.getTimeMultiplier(new Date(date.setHours(9, 0))) * 0.8;
      const eveningPrice = this.getTimeMultiplier(new Date(date.setHours(22, 0))) * 0.9;

      suggestions.push({
        date: date.toISOString().split("T")[0],
        morningTime: "9:00 AM",
        morningCostMultiplier: morningPrice,
        eveningTime: "10:00 PM",
        eveningCostMultiplier: eveningPrice,
        cheapestOption: eveningPrice < morningPrice ? "evening" : "morning",
        estimatedSavings: `${Math.round((1 - Math.min(morningPrice, eveningPrice)) * 100)}%`,
      });
    }

    return suggestions;
  }

  /**
   * Bulk quote (multiple shipments)
   */
  async calculateBulkPrice(shipments) {
    let bulkDiscount = 0;

    // Calculate individual prices
    const prices = await Promise.all(shipments.map((s) => this.calculateDynamicPrice(s)));

    let totalPrice = prices.reduce((sum, p) => sum + p.finalPrice, 0);

    // Apply bulk discount
    if (shipments.length > 10)
      bulkDiscount = 0.15; // 15%
    else if (shipments.length > 5) bulkDiscount = 0.1; // 10%

    totalPrice *= 1 - bulkDiscount;

    return {
      itemCount: shipments.length,
      subtotal: prices.reduce((sum, p) => sum + p.finalPrice, 0),
      bulkDiscount: `${bulkDiscount * 100}%`,
      total: Math.round(totalPrice * 100) / 100,
    };
  }
}

module.exports = { DynamicPricingService };
