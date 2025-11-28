/**
 * useMapControls Hook
 * 
 * SOLID Principles:
 * - Single Responsibility: Only handles map control logic
 * - Dependency Inversion: Works with any map instance via ref
 */

import { useRef, useEffect, useCallback } from 'react';
import type { Property } from '../types';
import { RIYADH_CENTER } from '../types';
import { isValidCoordinates } from '../utils/distanceCalculations';

interface UseMapControlsProps {
  displayedProperties: Property[];
  hasSearched: boolean;
  showChatbotResults: boolean;
  chatbotProperties: Property[];
}

interface UseMapControlsReturn {
  mapRef: React.MutableRefObject<google.maps.Map | null>;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  fitBoundsToProperties: () => void;
  centerOnChatbotResults: () => void;
}

export function useMapControls({
  displayedProperties,
  hasSearched,
  showChatbotResults,
  chatbotProperties,
}: UseMapControlsProps): UseMapControlsReturn {
  const mapRef = useRef<google.maps.Map | null>(null);

  /**
   * Fit map bounds to displayed properties
   */
  const fitBoundsToProperties = useCallback(() => {
    if (!mapRef.current || displayedProperties.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    
    displayedProperties.forEach((property) => {
      const lat = Number(property.lat);
      const lng = Number(property.lon);
      if (isValidCoordinates(lat, lng)) {
        bounds.extend({ lat, lng });
      }
    });
    
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds);
    }
  }, [displayedProperties]);

  /**
   * Center map on chatbot results
   */
  const centerOnChatbotResults = useCallback(() => {
    if (!mapRef.current || chatbotProperties.length === 0) return;
    
    const lats = chatbotProperties
      .map((p) => Number(p.lat))
      .filter((lat) => !isNaN(lat) && lat !== 0);
    const lngs = chatbotProperties
      .map((p) => Number(p.lon))
      .filter((lng) => !isNaN(lng) && lng !== 0);
    
    if (lats.length > 0 && lngs.length > 0) {
      const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
      mapRef.current.setCenter({ lat: avgLat, lng: avgLng });
      mapRef.current.setZoom(13);
    }
  }, [chatbotProperties]);

  /**
   * Auto-center on chatbot results when they change
   */
  useEffect(() => {
    if (showChatbotResults && chatbotProperties.length > 0) {
      centerOnChatbotResults();
    }
  }, [showChatbotResults, chatbotProperties, centerOnChatbotResults]);

  /**
   * Auto-fit bounds when displayed properties change
   */
  useEffect(() => {
    if (hasSearched && displayedProperties.length > 0 && !showChatbotResults) {
      fitBoundsToProperties();
    }
  }, [displayedProperties, hasSearched, showChatbotResults, fitBoundsToProperties]);

  return {
    mapRef,
    mapCenter: RIYADH_CENTER,
    mapZoom: 12,
    fitBoundsToProperties,
    centerOnChatbotResults,
  };
}
