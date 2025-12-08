import { memo } from 'react';
import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Check, Heart } from 'lucide-react';
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

  const pinBackground = isFavorite
    ? '#ef4444'
    : isVisited
    ? '#94a3b8'
    : transactionType === 'sale'
    ? '#065f46'
    : '#10b981';

  const pinBorderColor = isFavorite
    ? '#dc2626'
    : isVisited
    ? '#64748b'
    : transactionType === 'sale'
    ? '#064e3b'
    : '#059669';

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
            isVisited
              ? 'scale-75 opacity-70'
              : 'group-hover:scale-125 group-hover:-translate-y-2'
          )}
        >
          <Pin
            background={pinBackground}
            borderColor={pinBorderColor}
            glyphColor="#ffffff"
          />
        </div>

        {/* Ping animation on hover (non-visited only) */}
        {!isVisited && (
          <div
            className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-0 group-hover:opacity-100"
            style={{ animationDuration: '1.5s' }}
          />
        )}

        {/* Visited indicator */}
        {isVisited && (
          <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-0.5 shadow-lg border-2 border-white">
            <Check className="h-3 w-3 text-white" />
          </div>
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
