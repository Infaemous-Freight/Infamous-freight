/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Geolocation utilities for distance and location calculations
 */

/**
 * Calculate straight-line distance between two coordinates (Haversine formula)
 * @param lat1 Pickup latitude
 * @param lon1 Pickup longitude
 * @param lat2 Dropoff latitude
 * @param lon2 Dropoff longitude
 * @returns Distance in miles
 */
export function milesBetween(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Check if a driver is within radius of job pickup
 */
export function isWithinRadius(
  driverLat: number,
  driverLng: number,
  jobLat: number,
  jobLng: number,
  radiusMiles: number
): boolean {
  const distance = milesBetween(driverLat, driverLng, jobLat, jobLng);
  return distance <= radiusMiles;
}

/**
 * Filter drivers by pickup distance
 */
export interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
}

export function filterByRadius(
  drivers: DriverLocation[],
  pickupLat: number,
  pickupLng: number,
  radiusMiles: number
): DriverLocation[] {
  return drivers.filter((d) =>
    isWithinRadius(d.lat, d.lng, pickupLat, pickupLng, radiusMiles)
  );
}
