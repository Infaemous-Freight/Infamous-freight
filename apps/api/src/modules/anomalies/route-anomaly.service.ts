function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function bearingDegrees(lat1: number, lng1: number, lat2: number, lng2: number) {
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export class RouteAnomalyService {
  detectWrongDirection(
    current: { lat: number; lng: number },
    nextExpected: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ) {
    const expected = bearingDegrees(current.lat, current.lng, nextExpected.lat, nextExpected.lng);
    const actual = bearingDegrees(current.lat, current.lng, destination.lat, destination.lng);
    const diff = Math.abs(expected - actual);
    const normalized = Math.min(diff, 360 - diff);

    return {
      anomalous: normalized > 90,
      score: Number(Math.min(100, normalized).toFixed(2))
    };
  }
}
