/**
 * PropertyDetailsFilter Component
 * 
 * SOLID Principles:
 * - Single Responsibility: Only handles property type and neighborhood filters
 * - Interface Segregation: Focused props interface
 */

import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { PropertyFilters, CustomSearchTerms } from '../../types';

interface PropertyDetailsFilterProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  customSearchTerms: CustomSearchTerms;
  onCustomSearchTermsChange: (terms: CustomSearchTerms) => void;
  propertyTypes: string[];
  neighborhoods: string[];
}

export const PropertyDetailsFilter = memo(function PropertyDetailsFilter({
  filters,
  onFiltersChange,
  customSearchTerms,
  onCustomSearchTermsChange,
  propertyTypes,
  neighborhoods,
}: PropertyDetailsFilterProps) {
  const { t } = useTranslation();
  const [openPropertyTypeCombobox, setOpenPropertyTypeCombobox] = useState(false);
  const [openNeighborhoodCombobox, setOpenNeighborhoodCombobox] = useState(false);

  return (
    <div className="space-y-4 p-5 rounded-xl border border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-elegant">
      <h3 className="font-bold text-lg flex items-center gap-3 text-foreground">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        {t('propertyDetails')}
      </h3>
      
      <div className="space-y-3">
        {/* Property Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('propertyType')}</Label>
          <Popover open={openPropertyTypeCombobox} onOpenChange={setOpenPropertyTypeCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-background hover:bg-accent"
              >
                {filters.propertyType || t('selectPropertyType')}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 z-[100]">
              <Command>
                <CommandInput
                  placeholder={t('propertyType')}
                  onValueChange={(value) => {
                    onCustomSearchTermsChange({ ...customSearchTerms, propertyType: value });
                  }}
                />
                <CommandList>
                  <CommandEmpty>
                    {propertyTypes.length === 0 ? t('notFound') : t('selectPropertyType')}
                  </CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        onFiltersChange({ ...filters, propertyType: '' });
                        onCustomSearchTermsChange({ ...customSearchTerms, propertyType: '' });
                        setOpenPropertyTypeCombobox(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          !filters.propertyType ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {t('none')}
                    </CommandItem>
                    {propertyTypes.map((type) => (
                      <CommandItem
                        key={type}
                        value={type}
                        onSelect={() => {
                          onFiltersChange({ ...filters, propertyType: type });
                          onCustomSearchTermsChange({ ...customSearchTerms, propertyType: '' });
                          setOpenPropertyTypeCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            filters.propertyType === type ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {type}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Neighborhood */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('neighborhood')}</Label>
          <Popover open={openNeighborhoodCombobox} onOpenChange={setOpenNeighborhoodCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-background hover:bg-accent"
              >
                {filters.neighborhood || t('selectNeighborhood')}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 z-[100]">
              <Command>
                <CommandInput
                  placeholder={t('searchNeighborhood')}
                  onValueChange={(value) => {
                    onCustomSearchTermsChange({ ...customSearchTerms, neighborhood: value });
                  }}
                />
                <CommandList>
                  <CommandEmpty>
                    {neighborhoods.length === 0 ? t('notFound') : t('noNeighborhoodFound')}
                  </CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        onFiltersChange({ ...filters, neighborhood: '' });
                        onCustomSearchTermsChange({ ...customSearchTerms, neighborhood: '' });
                        setOpenNeighborhoodCombobox(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          !filters.neighborhood ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {t('none')}
                    </CommandItem>
                    {neighborhoods.map((neighborhood) => (
                      <CommandItem
                        key={neighborhood}
                        value={neighborhood}
                        onSelect={() => {
                          onFiltersChange({ ...filters, neighborhood });
                          onCustomSearchTermsChange({ ...customSearchTerms, neighborhood: '' });
                          setOpenNeighborhoodCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            filters.neighborhood === neighborhood ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {neighborhood}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
});
