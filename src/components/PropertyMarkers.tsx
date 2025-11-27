/**
 * Optimized Property Markers Component
 * Memoized to prevent unnecessary re-renders
 */
import React, { memo } from 'react';
import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Check, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyMarkersProps {
  properties: any[];
  onPropertyClick: (property: any) => void;
  visitedProperties: Set<string>;
  favoriteIds: Set<string>;
  transactionType: 'rent' | 'sale';
}

export const PropertyMarkers = memo(({ 
  properties, 
  onPropertyClick, 
  visitedProperties,
  favoriteIds,
  transactionType
}: PropertyMarkersProps) => {
  return (
    <>
      {properties.map((property) => {
        const lat = Number(property.lat);
        const lon = Number(property.lon);
        
        if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) return null;

        const isVisited = visitedProperties.has(property.id);
        const isFavorite = favoriteIds.has(property.id);

        return (
          <AdvancedMarker
            key={property.id}
            position={{ lat, lng: lon }}
            onClick={() => onPropertyClick(property)}
            zIndex={100}
          >
            <div className="relative cursor-pointer">
              <div className={cn(
                isVisited && "opacity-70"
              )}>
                <Pin
                  background={isVisited ? "#94a3b8" : (transactionType === "sale" ? "#065f46" : "#10b981")}
                  borderColor={isVisited ? "#64748b" : (transactionType === "sale" ? "#064e3b" : "#059669")}
                  glyphColor="#ffffff"
                />
              </div>
              {isVisited && (
                <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-0.5 shadow-lg border-2 border-white">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              {isFavorite && (
                <div className="absolute -top-2 -left-2">
                  <Heart className="h-4 w-4 fill-red-500 text-red-500 drop-shadow-lg" />
                </div>
              )}
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.properties === nextProps.properties &&
    prevProps.visitedProperties === nextProps.visitedProperties &&
    prevProps.favoriteIds === nextProps.favoriteIds &&
    prevProps.transactionType === nextProps.transactionType
  );
});

PropertyMarkers.displayName = 'PropertyMarkers';

