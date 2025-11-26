/**
 * Distance and Travel Time Utilities
 * 
 * Provides functions for calculating distances between geographic coordinates
 * and estimating travel times based on average speeds.
 * 
 * Uses the Haversine formula for accurate distance calculations on a sphere (Earth).
 * 
 * @module utils/distanceUtils
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * 
 * The Haversine formula calculates the great-circle distance between two points
 * on a sphere given their longitudes and latitudes. This is useful for determining
 * the shortest distance over the Earth's surface.
 * 
 * Formula:
 * a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
 * c = 2 × atan2(√a, √(1-a))
 * distance = R × c
 * 
 * Where R is Earth's radius (6371 km)
 * 
 * @param lat1 - Latitude of first point in degrees
 * @param lon1 - Longitude of first point in degrees
 * @param lat2 - Latitude of second point in degrees
 * @param lon2 - Longitude of second point in degrees
 * @returns Distance in kilometers
 * 
 * @example
 * // Calculate distance between Riyadh and Jeddah
 * const distance = calculateDistance(24.7136, 46.6753, 21.4858, 39.1925);
 * console.log(distance); // ~863 km
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
  
  // Haversine formula calculation
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  // Calculate central angle
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Calculate final distance
  return R * c;
};

/**
 * Calculate travel time based on distance and average speed
 * 
 * Estimates the time required to travel a given distance at a specified average speed.
 * Default speed is 30 km/h, which represents typical city driving conditions.
 * 
 * Formula: time (minutes) = (distance / speed) × 60
 * 
 * @param distanceKm - Distance in kilometers
 * @param avgSpeed - Average speed in km/h (default: 30 km/h for city driving)
 * @returns Travel time in minutes, rounded to nearest integer
 * 
 * @example
 * // Calculate travel time for 15 km at default city speed
 * const time = calculateTravelTime(15);
 * console.log(time); // 30 minutes
 * 
 * @example
 * // Calculate travel time for 100 km at highway speed
 * const time = calculateTravelTime(100, 100);
 * console.log(time); // 60 minutes
 */
export const calculateTravelTime = (
  distanceKm: number,
  avgSpeed: number = 30
): number => {
  // Convert hours to minutes and round to nearest integer
  return Math.round((distanceKm / avgSpeed) * 60);
};

/**
 * Parse numeric value from various input types
 * 
 * Safely converts string or number values to a numeric type.
 * Handles comma-separated numbers (e.g., "1,234.56") by removing commas.
 * Returns 0 for invalid or non-numeric values.
 * 
 * @param value - Value to parse (string, number, or any)
 * @returns Parsed number or 0 if parsing fails
 * 
 * @example
 * parseNumber("1,234.56") // 1234.56
 * parseNumber(1234) // 1234
 * parseNumber("invalid") // 0
 * parseNumber(null) // 0
 */
export const parseNumber = (value: any): number => {
  // Handle string values with comma separators
  if (typeof value === 'string') {
    return parseFloat(value.replace(/,/g, '')) || 0;
  }
  
  // Convert to number, return 0 if invalid
  return Number(value) || 0;
};
