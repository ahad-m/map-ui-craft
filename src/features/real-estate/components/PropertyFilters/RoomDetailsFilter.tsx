/**
 * RoomDetailsFilter Component
 * 
 * SOLID Principles:
 * - Single Responsibility: Only handles room filters (bedrooms, living rooms, bathrooms)
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bed, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PropertyFilters } from '../../types';

interface RoomDetailsFilterProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
}

export const RoomDetailsFilter = memo(function RoomDetailsFilter({
  filters,
  onFiltersChange,
}: RoomDetailsFilterProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 p-5 rounded-xl border border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-elegant">
      <h3 className="font-bold text-lg flex items-center gap-3 text-foreground">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10">
          <Bed className="h-5 w-5 text-primary" />
        </div>
        {t('roomDetails')}
      </h3>
      
      <div className="space-y-3">
        {/* Bedrooms */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('bedrooms')}</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              placeholder={t('bedrooms')}
              value={filters.bedrooms || ''}
              onChange={(e) => onFiltersChange({ ...filters, bedrooms: e.target.value })}
              className="bg-background flex-1"
            />
            {filters.bedrooms && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onFiltersChange({ ...filters, bedrooms: '' })}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Living Rooms */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('livingRooms')}</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              placeholder={t('livingRooms')}
              value={filters.livingRooms || ''}
              onChange={(e) => onFiltersChange({ ...filters, livingRooms: e.target.value })}
              className="bg-background flex-1"
            />
            {filters.livingRooms && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onFiltersChange({ ...filters, livingRooms: '' })}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Bathrooms */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('bathrooms')}</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              placeholder={t('bathrooms')}
              value={filters.bathrooms || ''}
              onChange={(e) => onFiltersChange({ ...filters, bathrooms: e.target.value })}
              className="bg-background flex-1"
            />
            {filters.bathrooms && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onFiltersChange({ ...filters, bathrooms: '' })}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
