import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { School } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SchoolWithTravelTime } from '../../types';

interface SchoolMarkerProps {
  school: SchoolWithTravelTime;
}

export const SchoolMarker = memo(function SchoolMarker({
  school,
}: SchoolMarkerProps) {
  const { t } = useTranslation();

  return (
    <AdvancedMarker
      position={{ lat: school.lat, lng: school.lon }}
      zIndex={50}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative group cursor-pointer transition-all duration-300 hover:scale-125 hover:-translate-y-2">
            <div
              className="p-2 rounded-full shadow-elevated"
              style={{ backgroundColor: '#84cc16' }}
            >
              <School className="h-5 w-5 text-white" />
            </div>
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-0 group-hover:opacity-100"
              style={{
                backgroundColor: 'rgba(132, 204, 22, 0.3)',
                animationDuration: '1.5s',
              }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{school.name}</p>
          {school.travelTime !== undefined && (
            <p className="text-xs text-muted-foreground">
              {t('maxTravelTime')}: {school.travelTime} {t('minutes')}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </AdvancedMarker>
  );
});
