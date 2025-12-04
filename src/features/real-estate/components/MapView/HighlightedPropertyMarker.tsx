/**
 * HighlightedPropertyMarker Component
 * 
 * A special marker for properties selected from the Best Value list.
 * Shows a distinctive golden star marker that stands out on the map.
 */

import React, { useEffect } from 'react';
import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { Star, Home } from 'lucide-react';
import type { BestValueProperty } from '../../types/bestValue';

interface HighlightedPropertyMarkerProps {
  property: BestValueProperty;
  onClick?: () => void;
}

export const HighlightedPropertyMarker = React.memo(function HighlightedPropertyMarker({
  property,
  onClick,
}: HighlightedPropertyMarkerProps) {
  const map = useMap();

  // Get coordinates (prefer final_lat/final_lon, fallback to lat/lon)
  const lat = property.final_lat || property.lat;
  const lon = property.final_lon || property.lon;

  // If no valid coordinates, don't render
  if (!lat || !lon) {
    return null;
  }

  const position = { lat, lng: lon };

  // Pan and zoom to the property when it's highlighted
  useEffect(() => {
    if (map && lat && lon) {
      map.panTo(position);
      map.setZoom(16); // Zoom in closer
    }
  }, [map, lat, lon]);

  return (
    <AdvancedMarker
      position={position}
      onClick={onClick}
      zIndex={1000} // Make sure it's on top
    >
      <div className="relative cursor-pointer group">
        {/* Pulse animation ring */}
        <div className="absolute -inset-3 bg-amber-400/30 rounded-full animate-ping" />
        <div className="absolute -inset-2 bg-amber-400/20 rounded-full animate-pulse" />
        
        {/* Main marker */}
        <div className="relative flex flex-col items-center">
          {/* Pin body */}
          <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-3 rounded-full shadow-lg border-4 border-white group-hover:scale-110 transition-transform duration-200">
            <Star className="h-6 w-6 text-white fill-white" />
          </div>
          
          {/* Pin pointer */}
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[16px] border-l-transparent border-r-transparent border-t-amber-600 -mt-1" />
        </div>

        {/* Info tooltip on hover */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          <div className="bg-white rounded-lg shadow-xl p-3 min-w-[200px] border border-amber-200">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-amber-600">أفضل سعر</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 line-clamp-1">
              {property.title || property.property_type}
            </p>
            <p className="text-xs text-gray-500">{property.district}</p>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">سعر المتر</span>
              <span className="text-sm font-bold text-green-600">
                {property.price_per_m2?.toLocaleString('ar-SA')} ر.س
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">التوفير</span>
              <span className="text-sm font-bold text-green-600">
                {property.discount_pct}% أقل
              </span>
            </div>
          </div>
          {/* Tooltip arrow */}
          <div className="w-3 h-3 bg-white border-b border-r border-amber-200 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1.5" />
        </div>
      </div>
    </AdvancedMarker>
  );
});
