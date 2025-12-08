/**
 * FiltersSheet Component
 * 
 * SOLID Principles:
 * - Single Responsibility: Container for all filter sections
 * - Open/Closed: Easy to add new filter sections without modifying existing code
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  PropertyDetailsFilter,
  PriceAreaFilter,
  RoomDetailsFilter,
  EducationFilter,
  ProximityFilter,
} from './PropertyFilters';
import type {
  PropertyFilters,
  CustomSearchTerms,
  University,
} from '../types';

interface FiltersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  customSearchTerms: CustomSearchTerms;
  onCustomSearchTermsChange: (terms: CustomSearchTerms) => void;
  onApply: () => void;
  onReset: () => void;
  // Data for dropdowns
  propertyTypes: string[];
  neighborhoods: string[];
  schoolGenders: string[];
  schoolLevels: string[];
  universities: University[];
  nearbySchoolsCount: number;
  nearbyUniversitiesCount: number;
}

export const FiltersSheet = memo(function FiltersSheet({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  customSearchTerms,
  onCustomSearchTermsChange,
  onApply,
  onReset,
  propertyTypes,
  neighborhoods,
  schoolGenders,
  schoolLevels,
  universities,
  nearbySchoolsCount,
  nearbyUniversitiesCount,
}: FiltersSheetProps) {
  const { t, i18n } = useTranslation();

  const handleApply = () => {
    onApply();
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl lg:max-w-2xl overflow-y-auto bg-background/98 backdrop-blur-md p-4 sm:p-6"
      >
        <SheetHeader className="pb-4 sm:pb-6 border-b-2 border-primary/20">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
              <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <SheetTitle className="text-lg sm:text-xl lg:text-2xl font-bold">
              {t('advancedFilters')}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="space-y-5 sm:space-y-6 lg:space-y-8 mt-4 sm:mt-6 pb-4">
          {/* Property Details Section */}
          <PropertyDetailsFilter
            filters={filters}
            onFiltersChange={onFiltersChange}
            customSearchTerms={customSearchTerms}
            onCustomSearchTermsChange={onCustomSearchTermsChange}
            propertyTypes={propertyTypes}
            neighborhoods={neighborhoods}
          />

          {/* Price & Area Section */}
          <PriceAreaFilter
            filters={filters}
            onFiltersChange={onFiltersChange}
          />

          {/* Room Details Section */}
          <RoomDetailsFilter
            filters={filters}
            onFiltersChange={onFiltersChange}
          />

          {/* Education Section */}
          <EducationFilter
            filters={filters}
            onFiltersChange={onFiltersChange}
            customSearchTerms={customSearchTerms}
            onCustomSearchTermsChange={onCustomSearchTermsChange}
            schoolGenders={schoolGenders}
            schoolLevels={schoolLevels}
            universities={universities}
            nearbySchoolsCount={nearbySchoolsCount}
            nearbyUniversitiesCount={nearbyUniversitiesCount}
          />

          {/* Proximity Filters Section */}
          <ProximityFilter
            filters={filters}
            onFiltersChange={onFiltersChange}
          />

          {/* Apply/Reset Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border/50">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-10 sm:h-12 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all text-sm sm:text-base"
              onClick={onReset}
            >
              <X className={`h-4 w-4 sm:h-5 sm:w-5 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {t('resetFilters')}
            </Button>
            <Button
              size="lg"
              className="flex-1 h-10 sm:h-12 bg-gradient-to-r from-primary to-accent shadow-glow hover:shadow-elevated hover:scale-105 transition-all duration-300 font-bold text-sm sm:text-base"
              onClick={handleApply}
            >
              <Search className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {t('applyFilters')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});
