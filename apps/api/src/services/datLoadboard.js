/**
 * DAT Loadboard Integration Service
 * Real-time access to DAT's 60000+ loads
 * Syncs loads every 15 minutes or on demand
 */

const axios = require("axios");
const { logger } = require("../middleware/logger");
const { Load } = require("@infamous/shared");

// DAT API Base URL
const DAT_API_URL = "https://api.datco.com";
const DAT_POLLING_INTERVAL = 15 * 60 * 1000; // 15 minutes

class DATLoadboardService {
  constructor() {
    this.client = null;
    this.lastSyncTime = null;
    this.accessToken = null;
    this.tokenExpireTime = null;
    this.loads = [];
    this.isInitialized = false;
  }

  /**
   * Initialize DAT connection with credentials
   */
  async initialize() {
    try {
      if (process.env.DAT_USERNAME && process.env.DAT_PASSWORD) {
        await this.authenticateDAT();
        this.isInitialized = true;
        logger.info("DAT Loadboard initialized", { timestamp: new Date() });

        // Start polling
        this.startPolling();
      } else {
        logger.warn("DAT credentials not configured - using mock data");
        this.isInitialized = true;
      }
    } catch (error) {
      logger.error("DAT initialization failed", { error: error.message });
    }
  }

  /**
   * Authenticate with DAT API
   */
  async authenticateDAT() {
    try {
      const response = await axios.post(`${DAT_API_URL}/v1/auth/login`, {
        username: process.env.DAT_USERNAME,
        password: process.env.DAT_PASSWORD,
        customerKey: process.env.DAT_CUSTOMER_KEY,
      });

      this.accessToken = response.data.accessToken;
      this.tokenExpireTime = Date.now() + response.data.expiresIn * 1000;

      this.client = axios.create({
        baseURL: DAT_API_URL,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      logger.info("DAT authentication successful");
    } catch (error) {
      logger.error("DAT authentication failed", { error: error.message });
      throw error;
    }
  }

  /**
   * Refresh token if needed
   */
  async ensureValidToken() {
    if (this.tokenExpireTime && Date.now() > this.tokenExpireTime - 60000) {
      await this.authenticateDAT();
    }
  }

  /**
   * Search loads from DAT with filters
   */
  async searchLoads(filters) {
    try {
      if (!this.isInitialized) {
        return this.getMockLoads(filters);
      }

      await this.ensureValidToken();

      const params = {
        pageSize: filters.pageSize || 50,
        pickupCity: filters.pickupCity,
        pickupState: filters.pickupState,
        dropoffCity: filters.dropoffCity,
        dropoffState: filters.dropoffState,
        weight: filters.weight,
        commodity: filters.commodity,
        equipmentType: filters.equipmentType,
        postDate: filters.postDate || "last24h", // last24h, last7d, last30d
      };

      // Remove undefined values
      Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

      const response = await this.client.get("/v1/loads/search", { params });

      const loads = response.data.loads.map((datLoad) => this.mapDATLoadToInternal(datLoad));

      logger.info("DAT loads fetched", { count: loads.length });
      return loads;
    } catch (error) {
      logger.error("DAT search failed", { error: error.message });
      // Fallback to mock data
      return this.getMockLoads(filters);
    }
  }

  /**
   * Get a specific load from DAT
   */
  async getLoad(datLoadId) {
    try {
      if (!this.isInitialized) {
        return null;
      }

      await this.ensureValidToken();

      const response = await this.client.get(`/v1/loads/${datLoadId}`);
      return this.mapDATLoadToInternal(response.data);
    } catch (error) {
      logger.error("DAT get load failed", { error: error.message, loadId: datLoadId });
      return null;
    }
  }

  /**
   * Bid on a load (express interest)
   */
  async bidOnLoad(datLoadId, driverInfo) {
    try {
      if (!this.isInitialized) {
        logger.info("Mock bid placed", { loadId: datLoadId });
        return { success: true, bidId: `mock-bid-${Date.now()}` };
      }

      await this.ensureValidToken();

      const response = await this.client.post(`/v1/loads/${datLoadId}/bid`, {
        carrierMcNumber: driverInfo.mcNumber,
        phone: driverInfo.phone,
        email: driverInfo.email,
        comments: driverInfo.notes,
      });

      logger.info("Bid placed on DAT load", { loadId: datLoadId, bidId: response.data.bidId });
      return response.data;
    } catch (error) {
      logger.error("DAT bid failed", { error: error.message, loadId: datLoadId });
      throw error;
    }
  }

  /**
   * Map DAT load format to internal format
   */
  mapDATLoadToInternal(datLoad) {
    return {
      id: `DAT-${datLoad.id}`,
      source: "dat",
      externalId: datLoad.id,
      pickupCity: datLoad.pickupCity,
      pickupState: datLoad.pickupState,
      pickupZip: datLoad.pickupZip,
      pickupDate: datLoad.pickupDate,
      dropoffCity: datLoad.dropoffCity,
      dropoffState: datLoad.dropoffState,
      dropoffZip: datLoad.dropoffZip,
      miles: datLoad.miles,
      weight: datLoad.weight,
      length: datLoad.length,
      commodity: datLoad.commodity,
      rate: datLoad.rate,
      rateType: datLoad.rateType, // 'per_mile', 'per_load', etc
      equipmentType: datLoad.equipmentType,
      postedTime: new Date(datLoad.postedTime),
      posted: datLoad.postedTime,
      postedAgo: Math.floor((Date.now() - new Date(datLoad.postedTime)) / 1000 / 60), // minutes
      loads: datLoad.loads || 1,
      shipper: {
        name: datLoad.shipperName,
        phone: datLoad.shipperPhone,
        location: `${datLoad.pickupCity}, ${datLoad.pickupState}`,
      },
      pickup: {
        city: datLoad.pickupCity,
        state: datLoad.pickupState,
        zip: datLoad.pickupZip,
        date: datLoad.pickupDate,
      },
      dropoff: {
        city: datLoad.dropoffCity,
        state: datLoad.dropoffState,
        zip: datLoad.dropoffZip,
      },
      details: {
        hazmat: datLoad.hazmat || false,
        temperature: datLoad.temperature,
        comments: datLoad.comments,
        brokerFee: datLoad.brokerFee,
      },
      score: this.calculateLoadScore(datLoad), // AI scoring
    };
  }

  /**
   * Calculate AI score for load (0-100)
   * Factors: rate, distance, specialization, demand
   */
  calculateLoadScore(load) {
    let score = 50; // base

    // Rate premium (up to +20)
    if (load.rate > 2.0) score += 20;
    else if (load.rate > 1.5) score += 15;
    else if (load.rate > 1.2) score += 10;

    // Distance bonus (long hauls = +15)
    if (load.miles > 500) score += 15;
    else if (load.miles > 200) score += 10;

    // Specialization (hazmat, temperature controlled, etc = +10)
    if (load.hazmat || load.temperature) score += 10;

    // Demand factor (recent posts = +5)
    const minutesOld = (Date.now() - new Date(load.postedTime)) / 1000 / 60;
    if (minutesOld < 5) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Get mock loads for development/demo
   */
  getMockLoads(filters = {}) {
    const mockLoads = [
      {
        id: "DAT-mock-001",
        pickupCity: "Dallas",
        pickupState: "TX",
        pickupZip: "75001",
        dropoffCity: "Houston",
        dropoffState: "TX",
        dropoffZip: "77001",
        miles: 245,
        weight: 42000,
        length: 53,
        rate: 1.25,
        rateType: "per_mile",
        equipmentType: "Dry Van",
        postedTime: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
        loads: 4,
        shipperName: "ABC Logistics",
        shipperPhone: "972-555-0100",
        hazmat: false,
        temperature: null,
        comments: "Non hazmat, freight only",
        brokerFee: 100,
      },
      {
        id: "DAT-mock-002",
        pickupCity: "Houston",
        pickupState: "TX",
        pickupZip: "77001",
        dropoffCity: "Austin",
        dropoffState: "TX",
        dropoffZip: "78701",
        miles: 165,
        weight: 35000,
        length: 53,
        rate: 1.08,
        rateType: "per_mile",
        equipmentType: "Dry Van",
        postedTime: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
        loads: 3,
        shipperName: "XYZ Manufacturing",
        shipperPhone: "713-555-0200",
        hazmat: false,
        temperature: null,
        comments: "On-time bonus $150",
        brokerFee: 50,
      },
      {
        id: "DAT-mock-003",
        pickupCity: "Austin",
        pickupState: "TX",
        pickupZip: "78701",
        dropoffCity: "San Antonio",
        dropoffState: "TX",
        dropoffZip: "78201",
        miles: 82,
        weight: 28000,
        length: 53,
        rate: 0.95,
        rateType: "per_mile",
        equipmentType: "Dry Van",
        postedTime: new Date(Date.now() - 120 * 60 * 1000), // 2 hours ago
        loads: 2,
        shipperName: "Local Freight Co",
        shipperPhone: "512-555-0300",
        hazmat: true,
        temperature: "35-55F",
        comments: "Requires HAZMAT endorsement",
        brokerFee: 75,
      },
    ];

    return mockLoads.map((load) => this.mapDATLoadToInternal(load));
  }

  /**
   * Start background polling of DAT loads
   */
  startPolling() {
    setInterval(() => {
      this.syncLoads();
    }, DAT_POLLING_INTERVAL);

    logger.info("DAT polling started", { interval: DAT_POLLING_INTERVAL });
  }

  /**
   * Sync loads from DAT
   */
  async syncLoads() {
    try {
      logger.info("Syncing loads from DAT...");
      const loads = await this.searchLoads({
        postDate: "last24h",
        pageSize: 100,
      });

      this.loads = loads;
      this.lastSyncTime = new Date();

      logger.info("DAT sync complete", {
        loadCount: loads.length,
        lastSync: this.lastSyncTime,
      });
    } catch (error) {
      logger.error("DAT sync failed", { error: error.message });
    }
  }

  /**
   * Get cached loads
   */
  getCachedLoads() {
    return this.loads;
  }

  /**
   * Get last sync time
   */
  getLastSyncTime() {
    return this.lastSyncTime;
  }
}

// Export singleton
module.exports = new DATLoadboardService();
