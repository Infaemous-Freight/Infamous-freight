function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

export class GpsAnomalyService {
  detectSignalLoss(lastPingAt: Date, now = new Date(), thresholdMin = 20) {
    const minutesWithoutSignal = (now.getTime() - lastPingAt.getTime()) / 60000;

    return {
      anomalous: minutesWithoutSignal > thresholdMin,
      score: Math.min(100, minutesWithoutSignal * 2),
      minutesWithoutSignal: Number(minutesWithoutSignal.toFixed(1))
    };
  }

  detectSuspiciousStop(pings: { lat: number; lng: number; recordedAt: Date }[]) {
    if (pings.length < 2) {
      return { anomalous: false, score: 0, stationaryMinutes: 0 };
    }

    const first = pings[0]!;
    const last = pings[pings.length - 1]!;
    const moved = haversineMiles(first.lat, first.lng, last.lat, last.lng);
    const stationaryMinutes = (last.recordedAt.getTime() - first.recordedAt.getTime()) / 60000;

    return {
      anomalous: moved < 0.2 && stationaryMinutes >= 45,
      score: moved < 0.2 ? Math.min(100, stationaryMinutes) : 0,
      stationaryMinutes: Number(stationaryMinutes.toFixed(1))
    };
  }
}
