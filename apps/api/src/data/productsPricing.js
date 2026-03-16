/**
 * Infæmous Freight Products & Services Pricing - 2026
 * Comprehensive pricing for all freight and logistics services
 * Prices in USD with regional adjustments available
 */

const PRODUCTS_PRICING = {
  // ============================================================================
  // FREIGHT SERVICES
  // ============================================================================

  freightServices: {
    // General Freight Services
    "domestic-ground": {
      id: "svc_domestic_ground",
      name: "Domestic Ground Freight",
      description: "Standard ground transportation within country",
      category: "freight",
      basePrice: 2.5,
      pricingModel: "perShipment",
      unit: "shipment",
      weightBasedPricing: {
        enabled: true,
        unit: "kg",
        rates: [
          { weight: [0, 10], pricePerUnit: 0.5 },
          { weight: [10, 50], pricePerUnit: 0.4 },
          { weight: [50, 100], pricePerUnit: 0.35 },
          { weight: [100, 500], pricePerUnit: 0.3 },
          { weight: [500, 1000], pricePerUnit: 0.25 },
          { weight: [1000, 5000], pricePerUnit: 0.2 },
        ],
        minCharge: 2.5,
      },
      distanceBasedPricing: {
        enabled: true,
        unit: "km",
        rates: [
          { distance: [0, 50], pricePerUnit: 0.08, label: "Local" },
          { distance: [50, 200], pricePerUnit: 0.06, label: "Regional" },
          { distance: [200, 500], pricePerUnit: 0.05, label: "Long Distance" },
          { distance: [500, 2000], pricePerUnit: 0.04, label: "Cross Country" },
        ],
        minCharge: 2.5,
      },
      available: true,
      regions: ["US", "EU", "UK", "Canada", "Australia", "India"],
    },

    "express-overnight": {
      id: "svc_express_overnight",
      name: "Express Overnight Delivery",
      description: "Next-day guaranteed delivery",
      category: "freight",
      basePrice: 35.0,
      surcharge: 0.0,
      pricingModel: "perShipment",
      unit: "shipment",
      estimatedDays: 1,
      available: true,
      regions: ["US-East", "US-West", "EU", "UK", "Singapore", "Australia"],
    },

    "same-day-delivery": {
      id: "svc_same_day",
      name: "Same Day Delivery",
      description: "Delivery on the same day",
      category: "freight",
      basePrice: 75.0,
      surcharge: 0.0,
      pricingModel: "perShipment",
      unit: "shipment",
      estimatedHours: 4,
      available: true,
      regions: ["US-East", "US-West", "Germany", "UK", "Tokyo", "Singapore"],
      availability: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: false,
      },
    },

    "international-shipping": {
      id: "svc_intl_shipping",
      name: "International Shipping",
      description: "Cross-border freight shipping",
      category: "freight",
      basePrice: 50.0,
      pricingModel: "perShipment",
      unit: "shipment",
      weightBasedPricing: {
        enabled: true,
        unit: "kg",
        rates: [
          { weight: [0, 10], pricePerUnit: 1.5 },
          { weight: [10, 50], pricePerUnit: 1.2 },
          { weight: [50, 100], pricePerUnit: 1.0 },
          { weight: [100, 500], pricePerUnit: 0.8 },
          { weight: [500, 1000], pricePerUnit: 0.6 },
        ],
        minCharge: 50.0,
      },
      estimatedDays: 10,
      available: true,
      regions: "all",
    },

    "bulk-freight-ltl": {
      id: "svc_ltl",
      name: "Less Than Truckload (LTL)",
      description: "Partial truck load shipping",
      category: "freight",
      basePrice: 200.0,
      pricingModel: "perShipment",
      unit: "shipment",
      weightRange: { min: "100 kg", max: "5000 kg" },
      available: true,
      regions: ["US", "EU", "Canada"],
    },

    "full-truckload-ftl": {
      id: "svc_ftl",
      name: "Full Truckload (FTL)",
      description: "Complete truck load shipping",
      category: "freight",
      basePrice: 1500.0,
      pricingModel: "perShipment",
      unit: "shipment",
      weightRange: { min: "5000 kg", max: "30000 kg" },
      volumeRange: { min: "10 m³", max: "25 m³" },
      available: true,
      regions: ["US", "EU", "Canada", "Australia"],
    },

    "drayage-service": {
      id: "svc_drayage",
      name: "Drayage Service",
      description: "Short distance truck transportation",
      category: "freight",
      basePrice: 75.0,
      pricingModel: "perMile",
      unit: "mile",
      pricePerMile: 1.5,
      minCharge: 75.0,
      available: true,
      regions: ["US", "EU", "UK"],
    },
  },

  // ============================================================================
  // SPECIALIZED SERVICES
  // ============================================================================

  specializedServices: {
    "hazmat-transport": {
      id: "svc_hazmat",
      name: "Hazardous Materials Transport",
      description: "Certified hazmat freight handling",
      category: "specialized",
      basePrice: 150.0,
      surcharge: 25.0,
      pricingModel: "perShipment",
      unit: "shipment",
      requirements: ["DOT-certified-driver", "hazmat-training", "special-packaging"],
      available: true,
      regions: ["US", "EU", "Canada", "Australia"],
    },

    "refrigerated-transport": {
      id: "svc_refrigerated",
      name: "Refrigerated Transport",
      description: "Temperature-controlled freight",
      category: "specialized",
      basePrice: 4.5,
      surcharge: 20.0,
      pricingModel: "perKm",
      unit: "km",
      temperatureRanges: [
        { temp: "0°C to 8°C", label: "Chilled" },
        { temp: "-18°C or below", label: "Frozen" },
        { temp: "15°C to 25°C", label: "Controlled Room Temperature" },
      ],
      monitoring: "real-time",
      available: true,
      regions: ["US", "EU", "UK", "Australia", "Singapore"],
    },

    "pharmaceutical-logistics": {
      id: "svc_pharma",
      name: "Pharmaceutical Logistics",
      description: "Regulated pharmaceutical transport (GXP/GDP)",
      category: "specialized",
      basePrice: 200.0,
      surcharge: 40.0,
      pricingModel: "perShipment",
      unit: "shipment",
      requirements: ["GXP-certified", "GDP-trained", "temperature-monitoring"],
      certifications: ["GDP", "GXP", "RALS"],
      available: true,
      regions: ["US", "EU", "UK", "Canada", "India"],
    },

    "cold-chain-monitoring": {
      id: "svc_cold_chain",
      name: "Cold Chain Monitoring",
      description: "Advanced temp/humidity monitoring for pharmaceutical",
      category: "specialized",
      basePrice: 30.0,
      pricingModel: "perShipment",
      unit: "shipment",
      dataPoints: ["temperature", "humidity", "light-exposure", "vibration"],
      reportingFrequency: "hourly",
      available: true,
      regions: ["US", "EU", "UK", "Canada", "Singapore"],
    },

    "food-transport": {
      id: "svc_food",
      name: "Food & Beverage Transport",
      description: "Food safety certified transport",
      category: "specialized",
      basePrice: 3.5,
      surcharge: 15.0,
      pricingModel: "perKm",
      unit: "km",
      certifications: ["HACCP", "IFS", "BRC", "Food-Handler"],
      hygieneTraining: true,
      available: true,
      regions: ["US", "EU", "UK", "Canada", "Australia", "Singapore"],
    },

    "fine-art-transport": {
      id: "svc_fine_art",
      name: "Fine Art & Antiques",
      description: "Museum-grade art handling and transportation",
      category: "specialized",
      basePrice: 500.0,
      surcharge: 50.0,
      pricingModel: "perShipment",
      unit: "shipment",
      requirements: ["art-handler-certification", "conservation-training"],
      insurance: "included",
      whiteGloveService: true,
      available: true,
      regions: ["US", "EU", "UK", "Singapore", "Hong Kong", "Tokyo"],
    },

    "vehicle-transport": {
      id: "svc_vehicle",
      name: "Vehicle Transport",
      description: "Enclosed vehicle transportation",
      category: "specialized",
      basePrice: 500.0,
      pricingModel: "perMile",
      unit: "mile",
      pricePerMile: 2.5,
      vehicleTypes: ["sedan", "suv", "truck", "classic-car"],
      insurance: "included",
      available: true,
      regions: ["US", "EU", "UK", "Canada"],
    },
  },

  // ============================================================================
  // VALUE-ADDED SERVICES
  // ============================================================================

  valueAddedServices: {
    "insurance-full-value": {
      id: "vas_insurance",
      name: "Full Value Insurance",
      description: "Complete coverage up to declared value",
      category: "insurance",
      basePrice: 0.0,
      pricingModel: "percentOfValue",
      rate: 0.02, // 2% of shipment value
      minCharge: 5.0,
      maxCoverage: 1000000.0,
      available: true,
      regions: "all",
    },

    "signature-required": {
      id: "vas_signature",
      name: "Signature Confirmation",
      description: "Proof of delivery with recipient signature",
      category: "confirmation",
      basePrice: 8.0,
      pricingModel: "perShipment",
      unit: "shipment",
      proofIncluded: true,
      available: true,
      regions: "all",
    },

    "photo-proof-delivery": {
      id: "vas_photo",
      name: "Photo Proof of Delivery",
      description: "Automatic photo capture at delivery",
      category: "confirmation",
      basePrice: 5.0,
      pricingModel: "perShipment",
      unit: "shipment",
      digitalProof: true,
      available: true,
      regions: "all",
    },

    "address-validation": {
      id: "vas_address",
      name: "Address Validation & Correction",
      description: "Ensure accurate delivery address",
      category: "support",
      basePrice: 3.0,
      pricingModel: "perShipment",
      unit: "shipment",
      databaseCoverage: ["US", "EU", "UK", "Canada", "Australia"],
      available: true,
      regions: "all",
    },

    "gps-tracking-premium": {
      id: "vas_gps",
      name: "Premium GPS Tracking",
      description: "Real-time GPS tracking with updates",
      category: "tracking",
      basePrice: 10.0,
      pricingModel: "perMonth",
      unit: "month",
      updateFrequency: "5-minute intervals",
      liveNotifications: true,
      available: true,
      regions: "all",
    },

    "delivery-window-selection": {
      id: "vas_delivery_window",
      name: "Delivery Window Selection",
      description: "Customer selects delivery time window",
      category: "convenience",
      basePrice: 8.0,
      pricingModel: "perShipment",
      unit: "shipment",
      windows: ["morning", "afternoon", "evening", "2-hour-window"],
      available: true,
      regions: ["US", "EU", "UK", "Canada", "Australia"],
    },

    "white-glove-delivery": {
      id: "vas_white_glove",
      name: "White Glove Delivery",
      description: "Full setup and placement service",
      category: "premium",
      basePrice: 50.0,
      pricingModel: "perDelivery",
      unit: "delivery",
      services: ["unboxing", "placement", "debris-removal", "assembly-help"],
      available: true,
      regions: ["US", "EU", "UK", "Canada", "Australia", "Singapore"],
    },

    "customs-clearance-assist": {
      id: "vas_customs",
      name: "Customs Clearance Assistance",
      description: "Help with international customs documentation",
      category: "compliance",
      basePrice: 75.0,
      pricingModel: "perShipment",
      unit: "shipment",
      documentPreparation: true,
      brokerNetwork: true,
      available: true,
      regions: "all",
    },
  },

  // ============================================================================
  // SOFTWARE & TECHNOLOGY SERVICES
  // ============================================================================

  softwareServices: {
    "api-integration": {
      id: "svc_api_integration",
      name: "Custom API Integration",
      description: "Dedicated technical setup and integration",
      category: "software",
      basePrice: 2000.0,
      pricingModel: "oneTime",
      setup: true,
      support: "3-months-included",
      available: true,
      regions: "all",
    },

    "webhook-streaming": {
      id: "svc_webhooks",
      name: "Advanced Webhooks & Streaming",
      description: "Real-time event streaming for integrations",
      category: "software",
      basePrice: 200.0,
      pricingModel: "perMonth",
      unit: "month",
      eventsPerSecond: 1000,
      available: true,
      regions: "all",
    },

    "real-time-tracking-widget": {
      id: "svc_tracking_widget",
      name: "Real-Time Tracking Widget",
      description: "Embedded tracking widget for websites",
      category: "software",
      basePrice: 50.0,
      pricingModel: "perMonth",
      unit: "month",
      customization: "yes",
      multiLanguage: true,
      available: true,
      regions: "all",
    },

    "white-label-solution": {
      id: "svc_white_label",
      name: "White Label Platform",
      description: "Fully branded custom logistics platform",
      category: "software",
      basePrice: 500.0,
      pricingModel: "perMonth",
      unit: "month",
      customDomain: true,
      customBranding: true,
      dedicated: true,
      minCommitment: 6,
      available: true,
      regions: "all",
    },

    "reporting-analytics-dashboard": {
      id: "svc_analytics",
      name: "Advanced Analytics Dashboard",
      description: "Custom business intelligence reports",
      category: "software",
      basePrice: 150.0,
      pricingModel: "perMonth",
      unit: "month",
      customReports: 10,
      dataRetention: "5-years",
      available: true,
      regions: "all",
    },
  },

  // ============================================================================
  // CONSULTING & SUPPORT SERVICES
  // ============================================================================

  consultingServices: {
    "supply-chain-optimization": {
      id: "svc_supply_chain",
      name: "Supply Chain Optimization",
      description: "Expert consulting for logistics optimization",
      category: "consulting",
      basePrice: 5000.0,
      pricingModel: "engagement",
      engagement: "3-months",
      includes: ["analysis", "recommendations", "implementation-support"],
      available: true,
      regions: "all",
    },

    "logistics-audit": {
      id: "svc_logistics_audit",
      name: "Logistics Operations Audit",
      description: "Comprehensive audit of logistics operations",
      category: "consulting",
      basePrice: 3000.0,
      pricingModel: "engagement",
      duration: "2-weeks",
      deliverables: ["report", "recommendations", "implementation-plan"],
      available: true,
      regions: "all",
    },

    "training-certification": {
      id: "svc_training",
      name: "Staff Training & Certification",
      description: "Professional training for logistics staff",
      category: "consulting",
      basePrice: 2000.0,
      pricingModel: "perSession",
      unit: "per-person",
      programs: ["hazmat", "pharmacy", "food-safety", "general-logistics"],
      certification: "included",
      available: true,
      regions: "all",
    },

    "technology-consulting": {
      id: "svc_tech_consulting",
      name: "Technology & Digital Transformation",
      description: "Tech strategy and digital transformation",
      category: "consulting",
      basePrice: 300.0,
      pricingModel: "hourly",
      unit: "hour",
      minEngagement: 40,
      available: true,
      regions: "all",
    },
  },

  // ============================================================================
  // COMPLIANCE & CERTIFICATIONS
  // ============================================================================

  complianceServices: {
    "iso9001-certification": {
      id: "cert_iso9001",
      name: "ISO 9001 Certification",
      description: "Quality management system certification",
      category: "compliance",
      basePrice: 4000.0,
      pricingModel: "oneTime",
      validity: "3-years",
      available: true,
      regions: "all",
    },

    "iso45001-safety": {
      id: "cert_iso45001",
      name: "ISO 45001 Occupational Health & Safety",
      description: "OH&S management certification",
      category: "compliance",
      basePrice: 3500.0,
      pricingModel: "oneTime",
      validity: "3-years",
      available: true,
      regions: "all",
    },

    "food-safety-certification": {
      id: "cert_food_safety",
      name: "Food Safety Certification",
      description: "HACCP, IFS, BRC certifications",
      category: "compliance",
      basePrice: 2500.0,
      pricingModel: "oneTime",
      certifications: ["HACCP", "IFS", "BRC"],
      validity: "2-years",
      available: true,
      regions: ["US", "EU", "UK", "Canada"],
    },

    "gdpr-compliance-audit": {
      id: "svc_gdpr_audit",
      name: "GDPR Compliance Audit",
      description: "Data protection and privacy audit",
      category: "compliance",
      basePrice: 2000.0,
      pricingModel: "engagement",
      duration: "4-weeks",
      available: true,
      regions: ["EU", "UK"],
    },
  },
};

module.exports = PRODUCTS_PRICING;
