const KEYWORD_INTENTS = [
  {
    type: "BOOK_LOAD",
    label: "Book Load",
    keywords: ["book", "tender", "assign", "dispatch"],
    toolName: "bookLoad",
  },
  {
    type: "FIND_CARRIER",
    label: "Find Carrier",
    keywords: ["find carrier", "source carrier", "best carrier", "carrier for"],
    toolName: "findCarrier",
  },
  {
    type: "PRICE_LOAD",
    label: "Price Load",
    keywords: ["price", "quote", "rate", "rpm", "per mile"],
    toolName: "predictRate",
  },
  {
    type: "ROUTE_OPTIMIZE",
    label: "Route Optimize",
    keywords: ["optimize route", "multi-stop", "route", "stops"],
    toolName: "optimizeRoute",
  },
  {
    type: "TRACK_SHIPMENT",
    label: "Track Shipment",
    keywords: ["track", "eta", "delay", "where is", "shipment status"],
    toolName: "predictDelay",
  },
  {
    type: "AUTO_POST_LOAD",
    label: "Auto Post Load",
    keywords: ["post load", "load board", "auto post", "publish load"],
    toolName: "postLoad",
  },
];

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectIntent(commandText) {
  const normalized = normalizeText(commandText);

  for (const intent of KEYWORD_INTENTS) {
    const sortedKeywords = intent.keywords.slice().sort((a, b) => b.length - a.length);

    if (
      sortedKeywords.some((keyword) => {
        const escaped = escapeRegExp(keyword);
        const pattern = new RegExp(`\\b${escaped}\\b`);
        return pattern.test(normalized);
      })
    ) {
      return intent;
    }
  }

  return {
    type: "GENERAL_ASSIST",
    label: "General Freight Assistant",
    toolName: "recommendAction",
  };
}

function calculateCarrierScore(metrics = {}) {
  const safeMetric = (key) => {
    const value = Number(metrics[key]);
    if (!Number.isFinite(value)) return 0;
    return Math.min(100, Math.max(0, value));
  };

  const score =
    safeMetric("onTimeRate") * 0.3 +
    safeMetric("tenderAcceptance") * 0.2 +
    safeMetric("safetyScore") * 0.2 +
    safeMetric("priceCompetitiveness") * 0.15 +
    safeMetric("serviceRating") * 0.15;

  return Number(score.toFixed(2));
}

function predictRatePerMile(input = {}) {
  const distance = Math.max(50, Number(input.distanceMiles) || 550);
  const fuelPrice = Math.max(2, Number(input.fuelPricePerGallon) || 3.75);
  const seasonalityIndex = Number.isFinite(Number(input.seasonalityIndex))
    ? Number(input.seasonalityIndex)
    : 1;
  const marketCapacity = Number.isFinite(Number(input.marketCapacityIndex))
    ? Number(input.marketCapacityIndex)
    : 1;
  const carrierDemand = Number.isFinite(Number(input.carrierDemandIndex))
    ? Number(input.carrierDemandIndex)
    : 1;
  const historicalSpotRate = Math.max(1.2, Number(input.historicalSpotRatePerMile) || 2.35);

  const distanceFactor = distance > 900 ? 0.94 : 1.03;
  const fuelAdjustment = (fuelPrice - 3.25) * 0.18;
  const marketAdjustment = (carrierDemand - marketCapacity) * 0.22;
  const prediction = (historicalSpotRate + fuelAdjustment + marketAdjustment) * seasonalityIndex * distanceFactor;

  const volatility = Math.abs(marketAdjustment) + Math.abs(fuelAdjustment) * 0.5;
  const confidenceScore = Math.max(0.52, Math.min(0.96, 0.9 - volatility * 0.15));

  return {
    predictedRatePerMile: Number(prediction.toFixed(2)),
    confidenceScore: Number(confidenceScore.toFixed(2)),
    inputsUsed: {
      distanceMiles: distance,
      fuelPricePerGallon: fuelPrice,
      seasonalityIndex,
      marketCapacityIndex: marketCapacity,
      carrierDemandIndex: carrierDemand,
      historicalSpotRatePerMile: historicalSpotRate,
    },
  };
}

function buildCommandPlan(commandText) {
  const intent = detectIntent(commandText);

  return {
    intent: intent.type,
    commandLabel: intent.label,
    tools: [
      {
        name: intent.toolName,
        arguments: {
          command: String(commandText || "").trim(),
        },
      },
    ],
  };
}

function executePlan(plan, context = {}) {
  const tool = plan?.tools?.[0];
  if (!tool) {
    return {
      summary: "No action generated",
      outputs: [],
    };
  }

  if (tool.name === "findCarrier") {
    const carrierScore = calculateCarrierScore(context.carrierMetrics || {});
    return {
      summary: "Carrier shortlist generated",
      outputs: [{ carrierScore, selectedCarrier: "carrier-synthetic-01" }],
    };
  }

  if (tool.name === "predictRate") {
    const pricing = predictRatePerMile(context.pricingInput || {});
    return {
      summary: "Autonomous rate prediction completed",
      outputs: [pricing],
    };
  }

  if (tool.name === "predictDelay") {
    return {
      summary: "Shipment delay risk computed",
      outputs: [
        {
          predictedEta: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          delayRisk: "LOW",
          confidenceScore: 0.78,
        },
      ],
    };
  }

  return {
    summary: `Command executed using ${tool.name}`,
    outputs: [{ ok: true }],
  };
}

module.exports = {
  KEYWORD_INTENTS,
  buildCommandPlan,
  calculateCarrierScore,
  detectIntent,
  executePlan,
  predictRatePerMile,
};
