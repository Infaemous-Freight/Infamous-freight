/*
 * Satellite weather adapter (Open-Meteo default, no API key required)
 */

const { safeFetch } = require("../lib/outboundHttp");

const SOURCE = "open-meteo";

function toNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toKph(ms) {
    return ms * 3.6;
}

async function getWeather(lat, lon) {
    const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}` +
        `&longitude=${encodeURIComponent(lon)}` +
        "&current=temperature_2m,wind_speed_10m,precipitation,visibility";

    const res = await safeFetch(url, { timeoutMs: 5000 });
    if (!res.ok) {
        throw new Error("Open-Meteo request failed");
    }

    const data = await res.json();
    const cur = data.current || {};

    const tempC = toNumber(cur.temperature_2m);
    const windMs = toNumber(cur.wind_speed_10m);
    const windKph = windMs != null ? Math.round(toKph(windMs) * 10) / 10 : undefined;
    const precipMm = toNumber(cur.precipitation);
    const visibilityM = toNumber(cur.visibility);

    const summaryParts = [];
    if (tempC != null) summaryParts.push(`${tempC}°C`);
    if (windKph != null) summaryParts.push(`wind ${windKph} km/h`);
    if (precipMm != null) summaryParts.push(`precip ${precipMm} mm`);
    if (visibilityM != null) summaryParts.push(`vis ${visibilityM} m`);

    return {
        lat,
        lon,
        tempC,
        windKph,
        precipMm,
        visibilityM,
        summary: summaryParts.join(" • ") || "ok",
        source: SOURCE,
        ts: new Date().toISOString(),
    };
}

module.exports = {
    getWeather,
};
