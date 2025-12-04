/**
 * BestValuePropertiesList Component
 * 
 * Displays a list of properties that are priced below the district average.
 * Each property shows:
 * - Basic info (title, type)
 * - Price and area
 * - Price per m²
 * - Discount percentage compared to district average
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Loader2, 
  TrendingDown, 
  Home, 
  Maximize2,
  BadgePercent,
  ExternalLink,
  MapPin
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { BestValueProperty } from '../types/bestValue';
import { formatPriceSAR, formatArea, formatDiscountPct } from '../hooks/useBestValueProperties';

interface BestValuePropertiesListProps {
  /** List of best value properties to display */
  properties: BestValueProperty[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** The district average price per m² for context */
  avgPricePerM2?: number;
  /** Callback when a property is clicked */
  onPropertyClick?: (property: BestValueProperty) => void;
}

/**
 * Single property card in the best value list
 */
function BestValuePropertyCard({
  property,
  onClick,
}: {
  property: BestValueProperty;
  onClick?: () => void;
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const locale = isRTL ? 'ar' : 'en';

  return (
    <div 
      className="group relative bg-card hover:bg-accent/5 p-4 rounded-lg transition-all duration-200 border border-transparent hover:border-primary/30 hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      {/* Discount Badge - Top Right */}
      <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'}`}>
        <Badge 
          variant="default" 
          className="bg-green-600 hover:bg-green-700 text-white font-bold gap-1"
        >
          <TrendingDown className="h-3 w-3" />
          {formatDiscountPct(property.discount_pct, locale)}
        </Badge>
      </div>

      {/* Property Info */}
      <div className="space-y-3">
        {/* Title and Type */}
        <div className="pr-16">
          <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {property.title || t('marketInsights.bestValue.untitledProperty', 'عقار')}
          </h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Home className="h-3 w-3" />
            <span>{property.property_type}</span>
            {property.district && (
              <>
                <span>•</span>
                <MapPin className="h-3 w-3" />
                <span>{property.district}</span>
              </>
            )}
          </div>
        </div>

        {/* Price and Area Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Total Price */}
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground block">
              {t('marketInsights.bestValue.column.price', 'السعر')}
            </span>
            <span className="font-bold text-primary">
              {formatPriceSAR(property.price_num, locale)}
            </span>
          </div>

          {/* Area */}
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground block">
              {t('marketInsights.bestValue.column.area', 'المساحة')}
            </span>
            <span className="font-medium flex items-center gap-1">
              <Maximize2 className="h-3 w-3 text-muted-foreground" />
              {formatArea(property.area_m2, locale)}
            </span>
          </div>
        </div>

        {/* Price per m² comparison */}
        <div className="bg-green-50 dark:bg-green-950/30 rounded-md p-2.5 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">
              {t('marketInsights.bestValue.column.pricePerM2', 'سعر المتر')}
            </span>
            <span className="font-bold text-green-700 dark:text-green-400">
              {formatPriceSAR(property.price_per_m2, locale)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">
              {t('marketInsights.bestValue.districtAverage', 'متوسط الحي')}
            </span>
            <span className="text-muted-foreground line-through">
              {formatPriceSAR(property.avg_price_per_m2, locale)}
            </span>
          </div>
          <Separator className="my-1" />
          <div className="flex items-center justify-center gap-1.5 text-green-700 dark:text-green-400">
            <BadgePercent className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">
              {t('marketInsights.bestValue.savingsMessage', '{{percent}} أقل من متوسط الحي', {
                percent: formatDiscountPct(property.discount_pct, locale),
              })}
            </span>
          </div>
        </div>

        {/* View Details Button */}
        {property.url && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-xs hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              window.open(property.url!, '_blank');
            }}
          >
            <ExternalLink className="h-3 w-3" />
            {t('marketInsights.bestValue.viewDetails', 'عرض التفاصيل')}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Main component that renders the list of best value properties
 */
export function BestValuePropertiesList({
  properties,
  isLoading,
  error,
  avgPricePerM2,
  onPropertyClick,
}: BestValuePropertiesListProps) {
  const { t } = useTranslation();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm">
          {t('marketInsights.bestValue.loading', 'جاري البحث عن أفضل العقارات...')}
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8 space-y-2">
        <div className="bg-destructive/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
          <span className="text-destructive text-xl">!</span>
        </div>
        <p className="text-sm text-destructive">
          {t('marketInsights.bestValue.error', 'حدث خطأ في جلب البيانات')}
        </p>
        <p className="text-xs text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  // No results state
  if (!properties || properties.length === 0) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="bg-muted w-14 h-14 rounded-full flex items-center justify-center mx-auto">
          <TrendingDown className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <p className="text-sm text-muted-foreground px-4">
          {t(
            'marketInsights.bestValue.noResults',
            'لا توجد عقارات أقل من متوسط سعر المتر في هذا الحي وفقاً للفلتر الحالي'
          )}
        </p>
      </div>
    );
  }

  // Results list
  return (
    <div className="space-y-3">
      {/* Results count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          {t('marketInsights.bestValue.resultsCount', 'تم العثور على {{count}} عقار', {
            count: properties.length,
          })}
        </span>
        {avgPricePerM2 && (
          <span>
            {t('marketInsights.bestValue.avgPriceLabel', 'متوسط الحي: {{price}}', {
              price: formatPriceSAR(avgPricePerM2, 'ar'),
            })}
          </span>
        )}
      </div>

      {/* Properties list */}
      <div className="space-y-2">
        {properties.map((property) => (
          <BestValuePropertyCard
            key={property.id}
            property={property}
            onClick={() => onPropertyClick?.(property)}
          />
        ))}
      </div>
    </div>
  );
}
