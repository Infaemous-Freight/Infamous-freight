/**
 * Advanced Reporting & Business Intelligence Service
 * Provides comprehensive analytics, KPIs, and data insights
 * 
 * Features:
 * - Executive dashboards with KPIs
 * - Custom report generation
 * - Data visualization preparation
 * - Trend analysis and forecasting
 * - Performance benchmarking
 * - Export to CSV, Excel, PDF
 * 
 * @module services/advancedReporting
 */

const { PrismaClient } = require('@prisma/client');
const { Parser } = require('@json2csv/node');
const { logger } = require('../middleware/logger');

const prisma = new PrismaClient();

/**
 * Report types enumeration
 */
const REPORT_TYPES = {
  EXECUTIVE_DASHBOARD: 'executive_dashboard',
  SHIPMENT_ANALYTICS: 'shipment_analytics',
  DRIVER_PERFORMANCE: 'driver_performance',
  REVENUE_ANALYSIS: 'revenue_analysis',
  OPERATIONAL_EFFICIENCY: 'operational_efficiency',
  CUSTOMER_INSIGHTS: 'customer_insights',
  ROUTE_OPTIMIZATION: 'route_optimization',
  COST_ANALYSIS: 'cost_analysis',
  DELIVERY_PERFORMANCE: 'delivery_performance',
  TREND_FORECAST: 'trend_forecast',
};

/**
 * Time period presets
 */
const TIME_PERIODS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  LAST_90_DAYS: 'last_90_days',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_QUARTER: 'this_quarter',
  THIS_YEAR: 'this_year',
  CUSTOM: 'custom',
};

/**
 * Advanced Reporting Service
 */
class AdvancedReportingService {
  constructor() {
    this.reportTypes = REPORT_TYPES;
    this.timePeriods = TIME_PERIODS;
  }

  /**
   * Get date range for time period
   * @param {string} period - Time period constant
   * @param {Date} startDate - Custom start date
   * @param {Date} endDate - Custom end date
   * @returns {Object} Date range with startDate and endDate
   */
  getDateRange(period, startDate = null, endDate = null) {
    const now = new Date();
    let start, end;

    switch (period) {
      case TIME_PERIODS.TODAY:
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      
      case TIME_PERIODS.YESTERDAY:
        start = new Date(now.setDate(now.getDate() - 1));
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        break;
      
      case TIME_PERIODS.LAST_7_DAYS:
        end = new Date();
        start = new Date(now.setDate(now.getDate() - 7));
        break;
      
      case TIME_PERIODS.LAST_30_DAYS:
        end = new Date();
        start = new Date(now.setDate(now.getDate() - 30));
        break;
      
      case TIME_PERIODS.LAST_90_DAYS:
        end = new Date();
        start = new Date(now.setDate(now.getDate() - 90));
        break;
      
      case TIME_PERIODS.THIS_MONTH:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      
      case TIME_PERIODS.LAST_MONTH:
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      
      case TIME_PERIODS.THIS_QUARTER: {
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);
        break;
      }
      
      case TIME_PERIODS.THIS_YEAR:
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      
      case TIME_PERIODS.CUSTOM:
        if (!startDate || !endDate) {
          throw new Error('Custom period requires startDate and endDate');
        }
        start = new Date(startDate);
        end = new Date(endDate);
        break;
      
      default:
        throw new Error(`Invalid time period: ${period}`);
    }

    return { startDate: start, endDate: end };
  }

  /**
   * Generate Executive Dashboard
   * @param {Object} options - Report options
   * @returns {Object} Executive dashboard data
   */
  async generateExecutiveDashboard(options = {}) {
    const { period = TIME_PERIODS.LAST_30_DAYS, organizationId = null } = options;
    const { startDate, endDate } = this.getDateRange(period, options.startDate, options.endDate);

    logger.info('Generating executive dashboard', { period, startDate, endDate });

    const where = {
      createdAt: { gte: startDate, lte: endDate },
      ...(organizationId && { organizationId }),
    };

    // Parallel data fetching for performance
    const [
      totalShipments,
      deliveredShipments,
      inTransitShipments,
      pendingShipments,
      cancelledShipments,
      totalRevenue,
      avgDeliveryTime,
      onTimeDeliveries,
      topCustomers,
      topRoutes,
    ] = await Promise.all([
      // Total shipments
      prisma.shipment.count({ where }),
      
      // Delivered shipments
      prisma.shipment.count({ where: { ...where, status: 'DELIVERED' } }),
      
      // In transit
      prisma.shipment.count({ where: { ...where, status: 'IN_TRANSIT' } }),
      
      // Pending
      prisma.shipment.count({ where: { ...where, status: 'PENDING' } }),
      
      // Cancelled
      prisma.shipment.count({ where: { ...where, status: 'CANCELLED' } }),
      
      // Total revenue (placeholder - add revenue field to schema)
      prisma.shipment.aggregate({
        where: { ...where, status: 'DELIVERED' },
        _sum: { weight: true },
      }),
      
      // Average delivery time
      this._calculateAvgDeliveryTime(where),
      
      // On-time delivery rate
      this._calculateOnTimeRate(where),
      
      // Top customers
      this._getTopCustomers(where, 10),
      
      // Top routes
      this._getTopRoutes(where, 10),
    ]);

    const completionRate = totalShipments > 0 
      ? ((deliveredShipments / totalShipments) * 100).toFixed(2) 
      : 0;

    return {
      reportType: REPORT_TYPES.EXECUTIVE_DASHBOARD,
      period,
      dateRange: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      
      kpis: {
        totalShipments,
        deliveredShipments,
        inTransitShipments,
        pendingShipments,
        cancelledShipments,
        completionRate: parseFloat(completionRate),
        totalRevenue: totalRevenue._sum.weight || 0, // Replace with actual revenue
        avgDeliveryTime: avgDeliveryTime || 0,
        onTimeDeliveryRate: onTimeDeliveries || 0,
      },
      
      insights: {
        topCustomers,
        topRoutes,
        trends: await this._calculateTrends(where),
      },
      
      performance: {
        utilizationRate: await this._calculateUtilizationRate(where),
        efficiency: await this._calculateEfficiency(where),
      },
    };
  }

  /**
   * Generate Shipment Analytics Report
   * @param {Object} options - Report options
   * @returns {Object} Shipment analytics data
   */
  async generateShipmentAnalytics(options = {}) {
    const { period = TIME_PERIODS.LAST_30_DAYS, organizationId = null } = options;
    const { startDate, endDate } = this.getDateRange(period, options.startDate, options.endDate);

    const where = {
      createdAt: { gte: startDate, lte: endDate },
      ...(organizationId && { organizationId }),
    };

    const [
      statusBreakdown,
      volumeTrend,
      topOrigins,
      topDestinations,
      avgWeightByStatus,
    ] = await Promise.all([
      this._getStatusBreakdown(where),
      this._getVolumeTrend(where),
      this._getTopLocations(where, 'origin', 10),
      this._getTopLocations(where, 'destination', 10),
      this._getAvgWeightByStatus(where),
    ]);

    return {
      reportType: REPORT_TYPES.SHIPMENT_ANALYTICS,
      period,
      dateRange: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      
      statusBreakdown,
      volumeTrend,
      geography: {
        topOrigins,
        topDestinations,
      },
      avgWeightByStatus,
    };
  }

  /**
   * Generate Driver Performance Report
   * @param {Object} options - Report options
   * @returns {Object} Driver performance data
   */
  async generateDriverPerformance(options = {}) {
    const { period = TIME_PERIODS.LAST_30_DAYS, organizationId = null, driverId = null } = options;
    const { startDate, endDate } = this.getDateRange(period, options.startDate, options.endDate);

    const where = {
      createdAt: { gte: startDate, lte: endDate },
      ...(organizationId && { organizationId }),
      ...(driverId && { driverId }),
    };

    const drivers = await prisma.shipment.groupBy({
      by: ['driverId'],
      where: { ...where, driverId: { not: null } },
      _count: { id: true },
      _avg: { weight: true },
    });

    const driverStats = await Promise.all(
      drivers.map(async (driver) => {
        const driverWhere = { ...where, driverId: driver.driverId };
        
        const [delivered, onTime, avgDeliveryTime] = await Promise.all([
          prisma.shipment.count({ where: { ...driverWhere, status: 'DELIVERED' } }),
          this._calculateOnTimeDeliveries(driverWhere),
          this._calculateAvgDeliveryTime(driverWhere),
        ]);

        return {
          driverId: driver.driverId,
          totalShipments: driver._count.id,
          deliveredShipments: delivered,
          avgWeight: driver._avg.weight || 0,
          onTimeRate: onTime,
          avgDeliveryTime,
          performanceScore: this._calculatePerformanceScore({
            totalShipments: driver._count.id,
            delivered,
            onTimeRate: onTime,
            avgDeliveryTime,
          }),
        };
      })
    );

    // Sort by performance score
    driverStats.sort((a, b) => b.performanceScore - a.performanceScore);

    return {
      reportType: REPORT_TYPES.DRIVER_PERFORMANCE,
      period,
      dateRange: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      drivers: driverStats,
      summary: {
        totalDrivers: driverStats.length,
        avgPerformanceScore: driverStats.reduce((sum, d) => sum + d.performanceScore, 0) / driverStats.length || 0,
        topPerformers: driverStats.slice(0, 5),
        needsImprovement: driverStats.slice(-5).reverse(),
      },
    };
  }

  /**
   * Export report to CSV
   * @param {Object} data - Report data
   * @param {string} reportType - Report type
   * @returns {string} CSV string
   */
  async exportToCSV(data, reportType) {
    logger.info('Exporting report to CSV', { reportType });

    let fields, records;

    switch (reportType) {
      case REPORT_TYPES.SHIPMENT_ANALYTICS:
        fields = ['date', 'totalShipments', 'delivered', 'inTransit', 'pending', 'cancelled'];
        records = data.volumeTrend || [];
        break;
      
      case REPORT_TYPES.DRIVER_PERFORMANCE:
        fields = ['driverId', 'totalShipments', 'deliveredShipments', 'onTimeRate', 'avgDeliveryTime', 'performanceScore'];
        records = data.drivers || [];
        break;
      
      default:
        fields = Object.keys(data.kpis || data);
        records = [data.kpis || data];
    }

    const parser = new Parser({ fields });
    return parser.parse(records);
  }

  /**
   * Calculate trends
   * @private
   */
  async _calculateTrends(where) {
    const now = new Date();
    const last30Days = new Date(now.setDate(now.getDate() - 30));
    const prev30Days = new Date(now.setDate(now.getDate() - 30));

    const [current, previous] = await Promise.all([
      prisma.shipment.count({ where: { ...where, createdAt: { gte: last30Days } } }),
      prisma.shipment.count({ where: { ...where, createdAt: { gte: prev30Days, lt: last30Days } } }),
    ]);

    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return {
      current,
      previous,
      change: change.toFixed(2),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    };
  }

  /**
   * Calculate average delivery time
   * @private
   */
  async _calculateAvgDeliveryTime(where) {
    const shipments = await prisma.shipment.findMany({
      where: {
        ...where,
        status: 'DELIVERED',
        actualDelivery: { not: null },
      },
      select: {
        createdAt: true,
        actualDelivery: true,
      },
    });

    if (shipments.length === 0) return 0;

    const totalTime = shipments.reduce((sum, s) => {
      const time = new Date(s.actualDelivery).getTime() - new Date(s.createdAt).getTime();
      return sum + time;
    }, 0);

    const avgMs = totalTime / shipments.length;
    return Math.round(avgMs / (1000 * 60 * 60 * 24)); // Convert to days
  }

  /**
   * Calculate on-time delivery rate
   * @private
   */
  async _calculateOnTimeRate(where) {
    const delivered = await prisma.shipment.findMany({
      where: {
        ...where,
        status: 'DELIVERED',
        actualDelivery: { not: null },
        estimatedDelivery: { not: null },
      },
      select: {
        actualDelivery: true,
        estimatedDelivery: true,
      },
    });

    if (delivered.length === 0) return 0;

    const onTime = delivered.filter(
      (s) => new Date(s.actualDelivery) <= new Date(s.estimatedDelivery)
    ).length;

    return ((onTime / delivered.length) * 100).toFixed(2);
  }

  /**
   * Calculate on-time deliveries count
   * @private
   */
  async _calculateOnTimeDeliveries(where) {
    const delivered = await prisma.shipment.findMany({
      where: {
        ...where,
        status: 'DELIVERED',
        actualDelivery: { not: null },
        estimatedDelivery: { not: null },
      },
      select: {
        actualDelivery: true,
        estimatedDelivery: true,
      },
    });

    if (delivered.length === 0) return 0;

    const onTime = delivered.filter(
      (s) => new Date(s.actualDelivery) <= new Date(s.estimatedDelivery)
    ).length;

    return ((onTime / delivered.length) * 100).toFixed(2);
  }

  /**
   * Get top customers
   * @private
   */
  async _getTopCustomers(where, limit = 10) {
    return prisma.shipment.groupBy({
      by: ['customerId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });
  }

  /**
   * Get top routes
   * @private
   */
  async _getTopRoutes(where, limit = 10) {
    return prisma.shipment.groupBy({
      by: ['origin', 'destination'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });
  }

  /**
   * Calculate utilization rate
   * @private
   */
  async _calculateUtilizationRate(where) {
    const total = await prisma.shipment.count({ where });
    const active = await prisma.shipment.count({ 
      where: { ...where, status: { in: ['IN_TRANSIT', 'PENDING'] } } 
    });
    
    return total > 0 ? ((active / total) * 100).toFixed(2) : 0;
  }

  /**
   * Calculate efficiency
   * @private
   */
  async _calculateEfficiency(where) {
    const total = await prisma.shipment.count({ where });
    const delivered = await prisma.shipment.count({ 
      where: { ...where, status: 'DELIVERED' } 
    });
    
    return total > 0 ? ((delivered / total) * 100).toFixed(2) : 0;
  }

  /**
   * Get status breakdown
   * @private
   */
  async _getStatusBreakdown(where) {
    return prisma.shipment.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });
  }

  /**
   * Get volume trend
   * @private
   */
  async _getVolumeTrend(where) {
    const shipments = await prisma.shipment.findMany({
      where,
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const trend = shipments.reduce((acc, shipment) => {
      const date = shipment.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, total: 0, delivered: 0, inTransit: 0, pending: 0, cancelled: 0 };
      }
      acc[date].total++;
      acc[date][shipment.status.toLowerCase()] = (acc[date][shipment.status.toLowerCase()] || 0) + 1;
      return acc;
    }, {});

    return Object.values(trend);
  }

  /**
   * Get top locations
   * @private
   */
  async _getTopLocations(where, field, limit = 10) {
    return prisma.shipment.groupBy({
      by: [field],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });
  }

  /**
   * Get average weight by status
   * @private
   */
  async _getAvgWeightByStatus(where) {
    return prisma.shipment.groupBy({
      by: ['status'],
      where,
      _avg: { weight: true },
    });
  }

  /**
   * Calculate performance score
   * @private
   */
  _calculatePerformanceScore({ totalShipments, delivered, onTimeRate, avgDeliveryTime }) {
    const deliveryRate = totalShipments > 0 ? (delivered / totalShipments) * 100 : 0;
    const timeScore = avgDeliveryTime > 0 ? Math.max(0, 100 - avgDeliveryTime) : 50;
    
    // Weighted scoring: 40% delivery rate, 40% on-time rate, 20% time efficiency
    const score = (deliveryRate * 0.4) + (parseFloat(onTimeRate) * 0.4) + (timeScore * 0.2);
    
    return Math.min(100, Math.max(0, score)).toFixed(2);
  }
}

module.exports = new AdvancedReportingService();
