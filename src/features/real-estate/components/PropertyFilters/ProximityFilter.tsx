/**
 * ProximityFilter Component
 * 
 * SOLID Principles:
 * - Single Responsibility: Only handles proximity filters (mosques, metro)
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { PropertyFilters } from '../../types';

interface ProximityFilterProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
}

export const ProximityFilter = memo(function ProximityFilter({
  filters,
  onFiltersChange,
}: ProximityFilterProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 p-4 rounded-lg border border-border bg-card/50">
      <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
        <div className="p-1.5 rounded-md bg-primary/15">
          <MapPin className="h-4 w-4 text-primary" />
        </div>
        {t('proximityFilters')}
      </h3>
      
      <div className="space-y-3">
        {/* Near Mosques */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Checkbox
            id="nearMosques"
            checked={filters.nearMosques}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, nearMosques: checked as boolean })
            }
          />
          <label htmlFor="nearMosques" className="text-sm cursor-pointer">
            {t('nearMosques')}
          </label>
        </div>
        
        {filters.nearMosques && (
          <div className="ml-6 space-y-2 p-3 bg-background/50 rounded-lg rtl:mr-6 rtl:ml-0">
            <Label className="text-xs font-medium">
              {t('maxTravelTime')}: {filters.maxMosqueTime} {t('minutes')}
            </Label>
            <Slider
              value={[filters.maxMosqueTime]}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, maxMosqueTime: value[0] })
              }
              min={1}
              max={30}
              step={1}
              className="w-full"
            />
          </div>
        )}

        {/* Near Metro */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="metro"
            checked={filters.nearMetro}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, nearMetro: checked as boolean })
            }
          />
          <label htmlFor="metro" className="text-sm cursor-pointer">
            {t('nearMetro')}
          </label>
        </div>
        
        {filters.nearMetro && (
          <div className="ml-6 space-y-2 p-3 bg-background/50 rounded-lg">
            <Label className="text-xs font-medium">
              {t('maxWalkingTime')}: {filters.minMetroTime} {t('minutes')}
            </Label>
            <Slider
              value={[filters.minMetroTime]}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, minMetroTime: value[0] })
              }
              min={1}
              max={30}
              step={1}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
});
