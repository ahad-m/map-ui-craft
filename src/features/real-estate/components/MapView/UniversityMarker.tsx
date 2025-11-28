/**
 * UniversityMarker Component
 * 
 * SOLID Principles:
 * - Single Responsibility: Only renders a university marker
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { GraduationCap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { UniversityWithTravelTime, NearbyUniversity } from '../../types';

interface UniversityMarkerProps {
  university: UniversityWithTravelTime | NearbyUniversity;
  isFromBackend?: boolean;
}

export const UniversityMarker = memo(function UniversityMarker({
  university,
  isFromBackend = false,
}: UniversityMarkerProps) {
  const { t, i18n } = useTranslation();

  const displayName = i18n.language === 'ar' ? university.name_ar : university.name_en;
  const backgroundColor = isFromBackend ? '#0d9488' : '#14b8a6';
  const hoverBackground = isFromBackend
    ? 'rgba(13, 148, 136, 0.3)'
    : 'rgba(20, 184, 166, 0.3)';

  // Get travel time based on whether it's from backend or local calculation
  const travelTime =
    'drive_minutes' in university
      ? university.drive_minutes
      : 'travelTime' in university
      ? university.travelTime
      : undefined;

  return (
    <AdvancedMarker
      position={{ lat: university.lat, lng: university.lon }}
      zIndex={50}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative group cursor-pointer transition-all duration-300 hover:scale-125 hover:-translate-y-2">
            <div
              className="p-2 rounded-full shadow-elevated"
              style={{ backgroundColor }}
            >
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-0 group-hover:opacity-100"
              style={{
                backgroundColor: hoverBackground,
                animationDuration: '1.5s',
              }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{displayName}</p>
          {travelTime !== undefined && (
            <p className="text-xs text-muted-foreground">
              {t('drivingTime') || 'وقت القيادة'}: {Math.round(travelTime)}{' '}
              {t('minutes') || 'دقيقة'}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </AdvancedMarker>
  );
});
