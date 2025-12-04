/**
 * PropertyMarker Component
 * 
 * SOLID Principles:
 * - Single Responsibility: Only renders a property marker
 */

import { memo } from 'react';
import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Property, TransactionType } from '../../types';
import { isValidCoordinates } from '../../utils/distanceCalculations';

interface PropertyMarkerProps {
  property: Property;
  isVisited: boolean;
  isFavorite: boolean;
  transactionType: TransactionType;
  onClick: () => void;
}

export const PropertyMarker = memo(function PropertyMarker({
  property,
  isVisited,
  isFavorite,
  transactionType,
  onClick,
}: PropertyMarkerProps) {
  const lat = Number(property.lat);
  const lon = Number(property.lon);

  if (!isValidCoordinates(lat, lon)) {
    return null;
  }

  // Red for favorites, Gray for non-favorites
  const pinBackground = isFavorite ? '#ef4444' : '#94a3b8';
  const pinBorderColor = isFavorite ? '#dc2626' : '#64748b';

  return (
    <AdvancedMarker
      position={{ lat, lng: lon }}
      onClick={onClick}
      zIndex={100}
    >
      <div className="relative group cursor-pointer">
        <div
          className={cn(
            'transition-all duration-500',
            isFavorite
              ? 'group-hover:scale-125 group-hover:-translate-y-2'
              : 'scale-75 opacity-70'
          )}
        >
          <Pin
            background={pinBackground}
            borderColor={pinBorderColor}
            glyphColor="#ffffff"
          />
        </div>

        {/* Ping animation on hover (favorites only) */}
        {isFavorite && (
          <div
            className="absolute inset-0 rounded-full bg-red-500/20 animate-ping opacity-0 group-hover:opacity-100"
            style={{ animationDuration: '1.5s' }}
          />
        )}

        {/* Favorite indicator */}
        {isFavorite && (
          <div className="absolute -top-2 -left-2 animate-pulse-glow">
            <Heart className="h-4 w-4 fill-red-500 text-red-500 drop-shadow-lg" />
          </div>
        )}
      </div>
    </AdvancedMarker>
  );
});
