const DAY_MS = 24 * 60 * 60 * 1000;

function diffInDays(from, to) {
  if (!from || !to) return null;
  return Math.ceil((to.getTime() - from.getTime()) / DAY_MS);
}

function evaluateRequirement({ requirement, certificates, now }) {
  const cert = certificates.find(
    (item) => item.coverageType === requirement.coverageType,
  );
  const reasons = [];
  let state = "COMPLIANT";
  let daysToExpiration = null;

  if (!cert) {
    return {
      state: "NON_COMPLIANT",
      reasons: [
        `Missing ${requirement.coverageType} certificate`,
      ],
      daysToExpiration,
    };
  }

  if (cert.status === "REJECTED") {
    return {
      state: "NON_COMPLIANT",
      reasons: [
        `${requirement.coverageType} certificate was rejected`,
      ],
      daysToExpiration,
    };
  }

  if (!cert.expirationDate) {
    return {
      state: "NON_COMPLIANT",
      reasons: [
        `${requirement.coverageType} certificate is missing an expiration date`,
      ],
      daysToExpiration,
    };
  }

  daysToExpiration = diffInDays(now, new Date(cert.expirationDate));

  if (daysToExpiration < 0) {
    const daysPast = Math.abs(daysToExpiration);
    if (daysPast > requirement.graceDays) {
      state = "SUSPENDED";
      reasons.push(
        `${requirement.coverageType} certificate expired ${daysPast} days ago (beyond grace period)`,
      );
    } else {
      state = "NON_COMPLIANT";
      reasons.push(
        `${requirement.coverageType} certificate expired ${daysPast} days ago`,
      );
    }
  } else if (daysToExpiration <= requirement.warningDays) {
    state = "WARNING";
    reasons.push(
      `${requirement.coverageType} certificate expires in ${daysToExpiration} days`,
    );
  }

  if (cert.status === "PENDING") {
    reasons.push(`${requirement.coverageType} certificate is pending verification`);
    if (state === "COMPLIANT") {
      state = "WARNING";
    }
  }

  return {
    state,
    reasons,
    daysToExpiration,
  };
}

function evaluateCompliance({ requirements, certificates, now = new Date() }) {
  if (!requirements?.length) {
    return {
      state: "COMPLIANT",
      reasons: ["No coverage requirements configured"],
      coverage: [],
    };
  }

  const coverage = requirements.map((requirement) => {
    const result = evaluateRequirement({ requirement, certificates, now });
    return {
      coverageType: requirement.coverageType,
      ...result,
    };
  });

  const states = coverage.map((item) => item.state);
  let state = "COMPLIANT";
  if (states.includes("SUSPENDED")) {
    state = "SUSPENDED";
  } else if (states.includes("NON_COMPLIANT")) {
    state = "NON_COMPLIANT";
  } else if (states.includes("WARNING")) {
    state = "WARNING";
  }

  const reasons = coverage.flatMap((item) => item.reasons);

  return {
    state,
    reasons,
    coverage,
  };
}

function computeRiskScore({ evaluation, suspensionsLast90Days = 0 }) {
  let score = 0;
  const hasRequiredCoverage = !evaluation.coverage.some(
    (item) => item.state === "NON_COMPLIANT" || item.state === "SUSPENDED",
  );
  if (hasRequiredCoverage) score += 40;

  const expiringSoon = evaluation.coverage.some(
    (item) => item.daysToExpiration !== null && item.daysToExpiration <= 14,
  );
  if (!expiringSoon) score += 10;

  if (evaluation.state === "COMPLIANT") score += 20;
  if (evaluation.state === "WARNING") score += 10;

  if (suspensionsLast90Days === 0) score += 20;

  const cleanVerification = evaluation.coverage.every(
    (item) => !item.reasons.some((reason) => reason.includes("pending")),
  );
  if (cleanVerification) score += 10;

  return Math.min(100, score);
}

module.exports = {
  evaluateCompliance,
  computeRiskScore,
};
