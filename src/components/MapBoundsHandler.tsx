import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface MapBoundsHandlerProps {
  onBoundsChange: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
}

export const MapBoundsHandler = ({ onBoundsChange }: MapBoundsHandlerProps) => {
  const map = useMap();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!map) return;

    // Immediately trigger bounds on initial load
    const triggerBounds = () => {
      const bounds = map.getBounds();
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        onBoundsChange({
          north: ne.lat(),
          south: sw.lat(),
          east: ne.lng(),
          west: sw.lng(),
        });
      }
    };

    // Initial load - trigger immediately
    if (initialLoadRef.current) {
      // Wait a tiny bit for map to be fully ready
      setTimeout(() => {
        triggerBounds();
        initialLoadRef.current = false;
      }, 100);
    }

    // Debounced updates on map movement
    const handleBoundsChange = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        triggerBounds();
      }, 300); // 300ms debounce
    };

    // Listen to idle event (when user stops panning/zooming)
    const idleListener = map.addListener('idle', handleBoundsChange);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (idleListener) {
        google.maps.event.removeListener(idleListener);
      }
    };
  }, [map, onBoundsChange]);

  return null;
};
