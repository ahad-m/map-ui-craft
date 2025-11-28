/**
 * MosqueMarker Component
 * 
 * SOLID Principles:
 * - Single Responsibility: Only renders a mosque marker
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import mosqueIcon from '@/assets/mosque-icon.png';
import type { MosqueWithTravelTime, NearbyMosque } from '../../types';

interface MosqueMarkerProps {
  mosque: MosqueWithTravelTime | NearbyMosque;
  isFromBackend?: boolean;
}

export const MosqueMarker = memo(function MosqueMarker({
  mosque,
  isFromBackend = false,
}: MosqueMarkerProps) {
  const { t } = useTranslation();

  // Get travel time based on source
  const walkMinutes = 'walk_minutes' in mosque ? mosque.walk_minutes : undefined;
  const driveMinutes = 'drive_minutes' in mosque ? mosque.drive_minutes : undefined;
  const travelTime = 'travelTime' in mosque ? mosque.travelTime : undefined;

  const timeLabel = walkMinutes
    ? `${t('walkingTime') || 'وقت المشي'}: ${Math.round(walkMinutes)} ${t('minutes') || 'دقيقة'}`
    : driveMinutes
    ? `${t('drivingTime') || 'وقت القيادة'}: ${Math.round(driveMinutes)} ${t('minutes') || 'دقيقة'}`
    : travelTime !== undefined
    ? `${t('maxTravelTime')}: ${travelTime} ${t('minutes')}`
    : null;

  return (
    <AdvancedMarker
      position={{ lat: Number(mosque.lat), lng: Number(mosque.lon) }}
      zIndex={50}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative group cursor-pointer transition-all duration-300 hover:scale-125 hover:-translate-y-2">
            <div
              className="p-2 rounded-full shadow-elevated border-2 border-white"
              style={{ backgroundColor: '#16a34a' }}
            >
              <img src={mosqueIcon} alt="Mosque" className="h-5 w-5 invert" />
            </div>
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-0 group-hover:opacity-100"
              style={{
                backgroundColor: 'rgba(22, 163, 74, 0.3)',
                animationDuration: '1.5s',
              }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{mosque.name}</p>
          {timeLabel && (
            <p className="text-xs text-muted-foreground">{timeLabel}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </AdvancedMarker>
  );
});
