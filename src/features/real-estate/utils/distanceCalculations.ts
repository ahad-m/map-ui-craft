/**
 * Distance Calculation Utilities
 * 

 */

import type { GeoLocation } from '../types';

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate estimated travel time by car
 * Assumes average city speed of 30 km/h
 * @param distanceKm Distance in kilometers
 * @returns Travel time in minutes
 */
export function calculateTravelTime(distanceKm: number): number {
  const AVG_CITY_SPEED_KMH = 30;
  return Math.round((distanceKm / AVG_CITY_SPEED_KMH) * 60);
}

/**
 * Calculate walking time
 * Assumes average walking speed of 5 km/h
 * @param distanceKm Distance in kilometers
 * @returns Walking time in minutes
 */
export function calculateWalkingTime(distanceKm: number): number {
  const AVG_WALKING_SPEED_KMH = 5;
  return Math.round((distanceKm / AVG_WALKING_SPEED_KMH) * 60);
}

/**
 * Calculate distance and travel time from a reference point
 */
export function calculateDistanceAndTime(
  from: GeoLocation,
  to: GeoLocation
): { distance: number; travelTime: number } {
  const distance = calculateDistance(from.lat, from.lon, to.lat, to.lon);
  const travelTime = calculateTravelTime(distance);
  return { distance, travelTime };
}

/**
 * Check if coordinates are valid
 */
export function isValidCoordinates(lat: number, lon: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat !== 0 &&
    lon !== 0 &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

/**
 * Calculate center point of multiple locations
 */
export function calculateCenterPoint(
  locations: GeoLocation[]
): GeoLocation | null {
  const validLocations = locations.filter(
    (loc) => isValidCoordinates(loc.lat, loc.lon)
  );
  
  if (validLocations.length === 0) return null;
  
  const sumLat = validLocations.reduce((sum, loc) => sum + loc.lat, 0);
  const sumLon = validLocations.reduce((sum, loc) => sum + loc.lon, 0);
  
  return {
    lat: sumLat / validLocations.length,
    lon: sumLon / validLocations.length,
  };
}

/**
 * Filter items by maximum travel time from a reference point
 */
export function filterByTravelTime<T extends GeoLocation>(
  items: T[],
  referencePoint: GeoLocation,
  maxMinutes: number
): (T & { travelTime: number })[] {
  return items
    .map((item) => {
      const distance = calculateDistance(
        referencePoint.lat,
        referencePoint.lon,
        item.lat,
        item.lon
      );
      const travelTime = calculateTravelTime(distance);
      return { ...item, travelTime };
    })
    .filter((item) => item.travelTime <= maxMinutes);
}

/**
 * Add travel time to items without filtering
 */
export function addTravelTime<T extends GeoLocation>(
  items: T[],
  referencePoint: GeoLocation
): (T & { travelTime: number })[] {
  return items.map((item) => {
    const distance = calculateDistance(
      referencePoint.lat,
      referencePoint.lon,
      item.lat,
      item.lon
    );
    const travelTime = calculateTravelTime(distance);
    return { ...item, travelTime };
  });
}
