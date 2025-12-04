/**
 * BestValueSheet Component
 * 
 * A standalone sheet/drawer for displaying best value properties.
 * Appears as a separate button (star icon) next to the market insights button.
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Star,
  Search,
  MapPin,
  Loader2,
  TrendingDown,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useMarketStats } from '../hooks/useMarketStats';
import { useBestValueProperties } from '../hooks/useBestValueProperties';
import { BestValuePropertiesList } from './BestValuePropertiesList';
import { PropertyTypeSelector } from './PropertyTypeSelector';
import { useHighlightedProperty } from '../context/HighlightedPropertyContext';
import type { NormalizedPurpose, PropertyType, BestValueProperty } from '../types/bestValue';

export const BestValueSheet = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  // State
  const [activeTab, setActiveTab] = useState<NormalizedPurpose>('بيع');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyType | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Context for highlighting property on map
  const { setHighlightedProperty, clearHighlightedProperty } = useHighlightedProperty();

  // Fetch market stats (for district list)
  const { data: stats, isLoading: statsLoading } = useMarketStats(activeTab);

  // Fetch best value properties
  const { 
    data: bestValueProperties, 
    isLoading: bestValueLoading,
    error: bestValueError,
  } = useBestValueProperties({
    district: selectedDistrict,
    normalizedPurpose: activeTab,
    propertyType: selectedPropertyType,
    enabled: !!selectedDistrict,
    limit: 5,
  });

  // Filter districts based on search
  const filteredDistricts = useMemo(() => {
    if (!stats) return [];
    return stats.filter(stat => {
      const districtName = stat.district;
      if (!districtName || typeof districtName !== 'string') return false;
      if (!searchTerm.trim()) return true;
      return districtName.includes(searchTerm.trim());
    });
  }, [stats, searchTerm]);

  // Get selected district stats
  const selectedDistrictStats = useMemo(() => {
    if (!selectedDistrict || !stats) return null;
    return stats.find(s => s.district === selectedDistrict);
  }, [selectedDistrict, stats]);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Handle district selection
  const handleDistrictClick = (district: string) => {
    setSelectedDistrict(district);
  };

  // Handle property click - highlight on map
  const handlePropertyClick = (property: BestValueProperty) => {
    // Set the property to be highlighted on the map
    setHighlightedProperty(property);
    
    // Close the sheet so user can see the map
    setIsOpen(false);
    
    console.log('Property highlighted on map:', property.title || property.id);
  };

  // Clear highlighted property when sheet closes without selection
  const handleSheetClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Optional: clear highlight when sheet closes
      // clearHighlightedProperty();
    }
  };

  // Reset selection
  const handleBackToDistricts = () => {
    setSelectedDistrict(null);
    setSelectedPropertyType(null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetClose}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="relative hover:bg-amber-50 hover:border-amber-400 transition-all duration-300 hover:scale-105 group"
              >
                <Star className="h-5 w-5 text-amber-500 group-hover:fill-amber-500 transition-all" />
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-sm">
              {t('bestValue.tooltip', 'أفضل العقارات من حيث السعر')}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <SheetContent side="left" className="w-[400px] sm:w-[540px] flex flex-col h-full">
        <SheetHeader className="mb-4 flex-shrink-0">
          <SheetTitle className="flex items-center gap-2 text-xl text-amber-600">
            <Star className="h-6 w-6 fill-amber-500" />
            {t('bestValue.title', 'أفضل العقارات من حيث السعر')}
          </SheetTitle>
          <SheetDescription>
            {t('bestValue.description', 'هنا تجد أفضل العقارات من حيث السعر مقارنة بمتوسط سعر المتر في الحي')}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 flex-shrink-0">
          {/* Tabs: Sale / Rent */}
          <Tabs 
            value={activeTab} 
            dir="rtl" 
            onValueChange={(v) => {
              setActiveTab(v as NormalizedPurpose);
              setSelectedDistrict(null);
              setSelectedPropertyType(null);
            }} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="بيع">
                {t('bestValue.forSale', 'للبيع')}
              </TabsTrigger>
              <TabsTrigger value="إيجار">
                {t('bestValue.forRent', 'للإيجار')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search / District selector */}
          {!selectedDistrict ? (
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('bestValue.searchDistrict', 'ابحث عن الحي...')}
                className="pr-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          ) : (
            <>
              {/* Selected district indicator */}
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <MapPin className="h-4 w-4 text-amber-600" />
                <div className="flex-1">
                  <span className="font-semibold text-amber-800 dark:text-amber-200">{selectedDistrict}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100"
                  onClick={handleBackToDistricts}
                >
                  {t('bestValue.change', 'تغيير')}
                </Button>
              </div>

              {/* Property type filter */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  {t('bestValue.filterByType', 'تصفية حسب نوع العقار')}
                </label>
                <PropertyTypeSelector
                  value={selectedPropertyType}
                  onChange={setSelectedPropertyType}
                  showAllOption={true}
                />
              </div>
            </>
          )}
        </div>

        <Separator className="my-3" />

        {/* Main content */}
        <ScrollArea className="flex-1 -mr-4 pr-4">
          {!selectedDistrict ? (
            // District selection view
            <>
              {statsLoading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  <p>{t('bestValue.loadingDistricts', 'جاري تحميل الأحياء...')}</p>
                </div>
              ) : filteredDistricts.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? t('bestValue.noDistrictsFound', 'لا توجد نتائج لـ "{{term}}"', { term: searchTerm })
                      : t('bestValue.noData', 'لا تتوفر بيانات حالياً')
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pb-6">
                  <p className="text-xs text-muted-foreground mb-3">
                    {t('bestValue.selectDistrictHint', 'اختر الحي لعرض أفضل العقارات فيه')}
                  </p>
                  
                  {filteredDistricts.map((stat, index) => (
                    <div 
                      key={`${stat.district}-${index}`} 
                      className="group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                      onClick={() => handleDistrictClick(stat.district)}
                    >
                      <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-full group-hover:bg-amber-200 transition-colors">
                        <MapPin className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium block">{stat.district}</span>
                        <span className="text-xs text-muted-foreground">
                          {stat.properties_count} {t('bestValue.properties', 'عقار')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Best value properties view
            <div className="pb-6">
              <BestValuePropertiesList
                properties={bestValueProperties || []}
                isLoading={bestValueLoading}
                error={bestValueError}
                avgPricePerM2={selectedDistrictStats?.avg_price_per_m2}
                onPropertyClick={handlePropertyClick}
              />
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
