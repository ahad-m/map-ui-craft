import { useState, useCallback } from 'react';

/**
 * Map center and zoom state
 */
interface MapState {
  center: { lat: number; lng: number };
  zoom: number;
}

/**
 * Default Riyadh location
 */
const DEFAULT_CENTER = { lat: 24.7136, lng: 46.6753 };
const DEFAULT_ZOOM = 12;

/**
 * Custom hook for managing map controls and state
 */
export const useMapControls = () => {
  const [mapState, setMapState] = useState<MapState>({
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  });

  /**
   * Update map center and zoom
   */
  const updateMapState = useCallback((center: { lat: number; lng: number }, zoom: number) => {
    setMapState({ center, zoom });
  }, []);

  /**
   * Reset map to default position
   */
  const resetMapToDefault = useCallback(() => {
    setMapState({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
  }, []);

  /**
   * Center map on specific coordinates
   */
  const centerMapOn = useCallback((lat: number, lng: number, zoom?: number) => {
    setMapState({
      center: { lat, lng },
      zoom: zoom ?? DEFAULT_ZOOM,
    });
  }, []);

  return {
    mapCenter: mapState.center,
    mapZoom: mapState.zoom,
    updateMapState,
    resetMapToDefault,
    centerMapOn,
  };
};
