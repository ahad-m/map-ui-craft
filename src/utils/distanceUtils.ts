/**
 * Utility functions for distance and travel time calculations
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculate travel time based on distance
 * @param distanceKm - Distance in kilometers
 * @param avgSpeed - Average speed in km/h (default: 30)
 * @returns Travel time in minutes
 */
export const calculateTravelTime = (
  distanceKm: number,
  avgSpeed: number = 30
): number => {
  return Math.round((distanceKm / avgSpeed) * 60);
};

/**
 * Parse numeric value from string or number
 * @param value - Value to parse
 * @returns Parsed number or 0
 */
export const parseNumber = (value: any): number => {
  if (typeof value === 'string') {
    return parseFloat(value.replace(/,/g, '')) || 0;
  }
  return Number(value) || 0;
};
