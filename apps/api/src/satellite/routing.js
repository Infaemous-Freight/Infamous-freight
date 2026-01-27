/*
 * Lightweight routing math helpers (distance + risk scoring)
 */

function toRad(deg) {
    return (deg * Math.PI) / 180;
}

function haversineMiles(a, b) {
    const R = 3958.8; // Earth radius in miles
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * (Math.sin(dLon / 2) ** 2);

    return 2 * R * Math.asin(Math.sqrt(h));
}

function summarizeRoute(input, weatherPoints = []) {
    const mph = input.avgSpeedMph ?? 55;
    const distanceMiles = haversineMiles(input.origin, input.destination);
    const etaHours = Math.max(0.25, distanceMiles / Math.max(5, mph));

    let score = 0;
    const reasons = [];

    for (const w of weatherPoints) {
        if ((w.windKph ?? 0) >= 50) {
            score += 2;
            reasons.push("high wind");
        }
        if ((w.precipMm ?? 0) >= 5) {
            score += 2;
            reasons.push("heavy precipitation");
        }
        if ((w.visibilityM ?? 999999) <= 2000) {
            score += 2;
            reasons.push("low visibility");
        }
    }

    const uniqReasons = [...new Set(reasons)];
    const level = score >= 5 ? "high" : score >= 2 ? "medium" : "low";

    return {
        distanceMiles: Math.round(distanceMiles * 10) / 10,
        etaHours: Math.round(etaHours * 10) / 10,
        risk: { level, reasons: uniqReasons },
    };
}

module.exports = {
    haversineMiles,
    summarizeRoute,
};
