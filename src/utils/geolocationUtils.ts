/**
 * Geolocation Utilities
 * 
 * Utility functions for calculating distances and travel times between geographic coordinates.
 * Uses the Haversine formula for accurate distance calculations on Earth's surface.
 * 
 * @module utils/geolocationUtils
 */

/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * 
 * The Haversine formula determines the great-circle distance between two points
 * on a sphere given their longitudes and latitudes. This implementation uses
 * Earth's radius (6371 km) to calculate the distance in kilometers.
 * 
 * @param lat1 - Latitude of first point in decimal degrees
 * @param lon1 - Longitude of first point in decimal degrees
 * @param lat2 - Latitude of second point in decimal degrees
 * @param lon2 - Longitude of second point in decimal degrees
 * @returns Distance between the two points in kilometers
 * 
 * @example
 * ```ts
 * // Calculate distance between Riyadh and Jeddah
 * const distance = calculateDistance(24.7136, 46.6753, 21.5433, 39.1728);
 * console.log(distance); // ~848 km
 * ```
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  // Earth's radius in kilometers
  const R = 6371;
  
  // Convert latitude difference to radians
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  // Convert longitude difference to radians
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Distance in kilometers
  return R * c;
};

/**
 * Calculate estimated travel time in minutes based on distance
 * 
 * Calculates travel time assuming average city driving speed of 30 km/h.
 * This speed accounts for typical urban traffic conditions, traffic lights,
 * and stop signs in Saudi Arabian cities.
 * 
 * @param distanceKm - Distance in kilometers
 * @param avgSpeed - Average speed in km/h (default: 30 km/h for city driving)
 * @returns Estimated travel time in minutes (rounded)
 * 
 * @example
 * ```ts
 * // Calculate travel time for 10 km at average city speed
 * const time = calculateTravelTime(10);
 * console.log(time); // 20 minutes
 * 
 * // Calculate travel time with custom speed (highway)
 * const highwayTime = calculateTravelTime(100, 120);
 * console.log(highwayTime); // 50 minutes
 * ```
 */
export const calculateTravelTime = (
  distanceKm: number,
  avgSpeed: number = 30
): number => {
  // Convert distance to time in minutes: (distance / speed) * 60
  const timeInMinutes = (distanceKm / avgSpeed) * 60;
  
  // Round to nearest minute
  return Math.round(timeInMinutes);
};

/**
 * Calculate travel time between two geographic coordinates
 * 
 * Convenience function that combines distance calculation and travel time estimation.
 * Useful when you need both the distance and travel time between two points.
 * 
 * @param lat1 - Latitude of first point in decimal degrees
 * @param lon1 - Longitude of first point in decimal degrees
 * @param lat2 - Latitude of second point in decimal degrees
 * @param lon2 - Longitude of second point in decimal degrees
 * @param avgSpeed - Average speed in km/h (default: 30 km/h)
 * @returns Object containing distance in km and travel time in minutes
 * 
 * @example
 * ```ts
 * const result = calculateDistanceAndTime(24.7136, 46.6753, 24.7500, 46.7000);
 * console.log(result); // { distanceKm: 4.2, travelMinutes: 8 }
 * ```
 */
export const calculateDistanceAndTime = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  avgSpeed: number = 30
): { distanceKm: number; travelMinutes: number } => {
  const distanceKm = calculateDistance(lat1, lon1, lat2, lon2);
  const travelMinutes = calculateTravelTime(distanceKm, avgSpeed);
  
  return {
    distanceKm,
    travelMinutes,
  };
};

/**
 * Check if a location is within a specified radius of a center point
 * 
 * Determines whether a target location falls within a circular area
 * defined by a center point and radius.
 * 
 * @param centerLat - Latitude of center point
 * @param centerLon - Longitude of center point
 * @param targetLat - Latitude of target point
 * @param targetLon - Longitude of target point
 * @param radiusKm - Radius in kilometers
 * @returns True if target is within radius, false otherwise
 * 
 * @example
 * ```ts
 * // Check if location is within 5 km of Riyadh center
 * const isNearby = isWithinRadius(24.7136, 46.6753, 24.7200, 46.6800, 5);
 * console.log(isNearby); // true or false
 * ```
 */
export const isWithinRadius = (
  centerLat: number,
  centerLon: number,
  targetLat: number,
  targetLon: number,
  radiusKm: number
): boolean => {
  const distance = calculateDistance(centerLat, centerLon, targetLat, targetLon);
  return distance <= radiusKm;
};
