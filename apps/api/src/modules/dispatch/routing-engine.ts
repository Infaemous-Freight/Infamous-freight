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

export class RoutingEngine {
  estimateRoute(fromLat: number, fromLng: number, toLat: number, toLng: number) {
    const straight = haversineMiles(fromLat, fromLng, toLat, toLng);
    const distanceMi = Number((straight * 1.18).toFixed(2));
    const avgSpeedMph = 52;
    const durationMin = Math.ceil((distanceMi / avgSpeedMph) * 60);

    return {
      distanceMi,
      durationMin
    };
  }
}
