/**
 * Map Controls Hook
 * 
 * Custom React hook for managing Google Maps state including center position and zoom level.
 * Provides convenient functions for common map operations like centering, zooming, and resetting.
 * 
 * Default location is set to Riyadh, Saudi Arabia.
 * 
 * @module hooks/useMapControls
 */

import { useState, useCallback } from 'react';

/**
 * Map state interface
 * 
 * Defines the structure for map center coordinates and zoom level.
 */
interface MapState {
  /** Map center coordinates */
  center: { lat: number; lng: number };
  /** Map zoom level (1-20) */
  zoom: number;
}

/**
 * Default map center coordinates (Riyadh, Saudi Arabia)
 * Latitude: 24.7136° N
 * Longitude: 46.6753° E
 */
const DEFAULT_CENTER = { lat: 24.7136, lng: 46.6753 };

/**
 * Default map zoom level
 * 12 provides a good overview of the city
 */
const DEFAULT_ZOOM = 12;

/**
 * Custom hook for managing map controls and state
 * 
 * Manages map center position and zoom level with memoized update functions.
 * All update functions are wrapped with useCallback to prevent unnecessary re-renders.
 * 
 * @returns Object containing map state and control functions
 * 
 * @example
 * const { mapCenter, mapZoom, centerMapOn, resetMapToDefault } = useMapControls();
 * 
 * // Center map on specific location
 * centerMapOn(24.7136, 46.6753, 15);
 * 
 * // Reset to default Riyadh location
 * resetMapToDefault();
 */
export const useMapControls = () => {
  // Initialize map state with default Riyadh location
  const [mapState, setMapState] = useState<MapState>({
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  });

  /**
   * Update map center and zoom level
   * 
   * Provides full control over map position and zoom.
   * Memoized with useCallback to maintain referential equality.
   * 
   * @param center - New map center coordinates
   * @param zoom - New zoom level (1-20)
   */
  const updateMapState = useCallback((center: { lat: number; lng: number }, zoom: number) => {
    setMapState({ center, zoom });
  }, []);

  /**
   * Reset map to default position
   * 
   * Returns map to the default Riyadh location with default zoom level.
   * Useful for "Home" or "Reset View" functionality.
   * 
   * Memoized with useCallback to maintain referential equality.
   */
  const resetMapToDefault = useCallback(() => {
    setMapState({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
  }, []);

  /**
   * Center map on specific coordinates
   * 
   * Convenience function to quickly center map on given coordinates.
   * Optionally accepts a zoom level; uses default zoom if not provided.
   * 
   * Memoized with useCallback to maintain referential equality.
   * 
   * @param lat - Latitude coordinate
   * @param lng - Longitude coordinate
   * @param zoom - Optional zoom level (uses default if not provided)
   * 
   * @example
   * // Center on location with custom zoom
   * centerMapOn(24.7136, 46.6753, 15);
   * 
   * // Center on location with default zoom
   * centerMapOn(24.7136, 46.6753);
   */
  const centerMapOn = useCallback((lat: number, lng: number, zoom?: number) => {
    setMapState({
      center: { lat, lng },
      zoom: zoom ?? DEFAULT_ZOOM,
    });
  }, []);

  return {
    /** Current map center coordinates */
    mapCenter: mapState.center,
    /** Current map zoom level */
    mapZoom: mapState.zoom,
    /** Update both center and zoom */
    updateMapState,
    /** Reset to default Riyadh location */
    resetMapToDefault,
    /** Center map on specific coordinates */
    centerMapOn,
  };
};
