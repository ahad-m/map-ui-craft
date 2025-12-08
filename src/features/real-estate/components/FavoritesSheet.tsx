/**
 * FavoritesSheet Component
 * 
 * SOLID Principles:
 * - Single Responsibility: Handles favorites display
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Bed, Bath, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Property } from '../types';

interface FavoritesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onPropertySelect: (property: Property) => void;
  onToggleFavorite: (propertyId: string) => void;
}

export const FavoritesSheet = memo(function FavoritesSheet({
  isOpen,
  onClose,
  properties,
  onPropertySelect,
  onToggleFavorite,
}: FavoritesSheetProps) {
  const { t, i18n } = useTranslation();

  const handlePropertyClick = (property: Property) => {
    onPropertySelect(property);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side={i18n.language === 'ar' ? 'left' : 'right'}
        className="w-full sm:max-w-md lg:max-w-lg overflow-y-auto p-4 sm:p-6"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 fill-red-500" />
            {t('favorites')} ({properties.length})
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
          {properties.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Heart className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-3 sm:mb-4 animate-pulse" />
              <p className="text-muted-foreground font-medium text-sm sm:text-base">
                {t('noFavorites')}
              </p>
            </div>
          ) : (
            properties.map((property, index) => (
              <Card
                key={property.id}
                className="p-3 sm:p-4 cursor-pointer hover-lift glass-effect animate-slide-up card-shine shadow-card hover:shadow-elevated transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => handlePropertyClick(property)}
              >
                <div className="flex gap-2 sm:gap-3">
                  {property.image_url && (
                    <img
                      src={property.image_url}
                      alt={property.title}
                      className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 object-cover rounded-lg sm:rounded-xl ring-2 ring-primary/10 transition-all duration-300 hover:ring-primary/30 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <h3 className="font-bold text-xs sm:text-sm line-clamp-2">
                        {property.title}
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 hover:bg-red-50 rounded-full transition-all duration-300 hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(property.id);
                        }}
                      >
                        <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-red-500 text-red-500 animate-pulse" />
                      </Button>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 font-medium truncate">
                      {property.district}, {property.city}
                    </p>
                    <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs mb-2 sm:mb-3 flex-wrap">
                      {property.rooms && (
                        <span className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                          <Bed className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          <span className="font-semibold">{property.rooms}</span>
                        </span>
                      )}
                      {property.baths && (
                        <span className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                          <Bath className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          <span className="font-semibold">{property.baths}</span>
                        </span>
                      )}
                      {property.area_m2 && (
                        <span className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                          <Maximize className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          <span className="font-semibold">{property.area_m2} m²</span>
                        </span>
                      )}
                    </div>
                    <div className="pt-2 sm:pt-3 border-t border-border/50">
                      <p className="gradient-text font-extrabold text-base sm:text-lg lg:text-xl">
                        {property.price_num} {property.price_currency}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
});
