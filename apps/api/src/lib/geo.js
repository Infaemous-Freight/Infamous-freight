/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Geospatial Utilities
 */

/**
 * Calculate distance in miles between two GPS coordinates using Haversine formula
 * @param {number} aLat - Latitude of point A
 * @param {number} aLng - Longitude of point A
 * @param {number} bLat - Latitude of point B
 * @param {number} bLng - Longitude of point B
 * @returns {number} Distance in miles
 */
function milesBetween(aLat, aLng, bLat, bLng) {
  const R = 3958.8; // Earth's radius in miles
  const toRad = (d) => (d * Math.PI) / 180;

  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);

  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);

  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Find drivers within a radius of given coordinates
 * @param {number} lat - Reference latitude
 * @param {number} lng - Reference longitude
 * @param {Array} drivers - Array of driver objects with {id, lat, lng, isActive}
 * @param {number} radiusMiles - Search radius in miles
 * @returns {Array} Drivers sorted by distance, nearest first
 */
function findNearbyDrivers(lat, lng, drivers, radiusMiles) {
  return drivers
    .filter(d => d.isActive !== false) // Include active drivers
    .map(d => ({
      ...d,
      distance: milesBetween(lat, lng, d.lat, d.lng)
    }))
    .filter(d => d.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Create a location object from coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} Location object with {lat, lng}
 */
function getLocation(lat, lng) {
  return { lat, lng };
}

module.exports = { milesBetween, findNearbyDrivers, getLocation };
