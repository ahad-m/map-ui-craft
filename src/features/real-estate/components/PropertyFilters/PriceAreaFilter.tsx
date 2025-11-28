/**
 * PriceAreaFilter Component
 * 
 * SOLID Principles:
 * - Single Responsibility: Only handles price and area filters
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Maximize, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PropertyFilters } from '../../types';

interface PriceAreaFilterProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
}

export const PriceAreaFilter = memo(function PriceAreaFilter({
  filters,
  onFiltersChange,
}: PriceAreaFilterProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 p-5 rounded-xl border border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-elegant">
      <h3 className="font-bold text-lg flex items-center gap-3 text-foreground">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10">
          <Maximize className="h-5 w-5 text-primary" />
        </div>
        {t('priceAndArea')}
      </h3>
      
      <div className="space-y-3">
        {/* Price Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('price')} (SAR)</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('min')}</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  min="0"
                  placeholder={t('min')}
                  value={filters.minPrice || ''}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, minPrice: Number(e.target.value) })
                  }
                  className="bg-background"
                />
                {filters.minPrice > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onFiltersChange({ ...filters, minPrice: 0 })}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('max')}</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  min="0"
                  placeholder={t('max')}
                  value={filters.maxPrice || ''}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, maxPrice: Number(e.target.value) })
                  }
                  className="bg-background"
                />
                {filters.maxPrice > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onFiltersChange({ ...filters, maxPrice: 0 })}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Area Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('areaSize')} (م²)</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('min')}</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  min="0"
                  placeholder={t('min')}
                  value={filters.areaMin || ''}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, areaMin: Number(e.target.value) })
                  }
                  className="bg-background"
                />
                {filters.areaMin > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onFiltersChange({ ...filters, areaMin: 0 })}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('max')}</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  min="0"
                  placeholder={t('max')}
                  value={filters.areaMax || ''}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, areaMax: Number(e.target.value) })
                  }
                  className="bg-background"
                />
                {filters.areaMax > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onFiltersChange({ ...filters, areaMax: 0 })}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
