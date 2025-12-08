/**
 * EducationFilter Component
 * 
 */

import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { School, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
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
import type { PropertyFilters, CustomSearchTerms, University } from '../../types';
import { getSchoolGenderLabel, getSchoolLevelLabel } from '../../utils/filterHelpers';

interface EducationFilterProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  customSearchTerms: CustomSearchTerms;
  onCustomSearchTermsChange: (terms: CustomSearchTerms) => void;
  schoolGenders: string[];
  schoolLevels: string[];
  universities: University[];
  nearbySchoolsCount: number;
  nearbyUniversitiesCount: number;
}

export const EducationFilter = memo(function EducationFilter({
  filters,
  onFiltersChange,
  customSearchTerms,
  onCustomSearchTermsChange,
  schoolGenders,
  schoolLevels,
  universities,
  nearbySchoolsCount,
  nearbyUniversitiesCount,
}: EducationFilterProps) {
  const { t, i18n } = useTranslation();
  const [openSchoolGenderCombobox, setOpenSchoolGenderCombobox] = useState(false);
  const [openSchoolLevelCombobox, setOpenSchoolLevelCombobox] = useState(false);
  const [openUniversityCombobox, setOpenUniversityCombobox] = useState(false);

  return (
    <div className="space-y-4 p-5 rounded-xl border border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-elegant">
      <h3 className="font-bold text-lg flex items-center gap-3 text-foreground">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10">
          <School className="h-5 w-5 text-primary" />
        </div>
        {t('education')}
      </h3>
      
      <div className="space-y-3">
        {/* Schools Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('schools')}</Label>
          
          {/* School Gender Filter */}
          <Popover open={openSchoolGenderCombobox} onOpenChange={setOpenSchoolGenderCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-background hover:bg-accent"
              >
                {filters.schoolGender
                  ? getSchoolGenderLabel(filters.schoolGender, t)
                  : t('gender')}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 z-[100]">
              <Command>
                <CommandInput
                  placeholder={t('gender')}
                  onValueChange={(value) => {
                    onCustomSearchTermsChange({ ...customSearchTerms, schoolGender: value });
                  }}
                />
                <CommandList>
                  <CommandEmpty>{t('notFound')}</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        onFiltersChange({ ...filters, schoolGender: 'All' });
                        setOpenSchoolGenderCombobox(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          filters.schoolGender === 'All' ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {t('all')}
                    </CommandItem>
                    {schoolGenders.map((gender) => (
                      <CommandItem
                        key={gender}
                        value={gender}
                        onSelect={() => {
                          onFiltersChange({
                            ...filters,
                            schoolGender: gender as PropertyFilters['schoolGender'],
                          });
                          setOpenSchoolGenderCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            filters.schoolGender === gender ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {getSchoolGenderLabel(gender, t)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* School Level Filter */}
          <Popover open={openSchoolLevelCombobox} onOpenChange={setOpenSchoolLevelCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-background hover:bg-accent"
              >
                {filters.schoolLevel
                  ? getSchoolLevelLabel(filters.schoolLevel, t)
                  : t('schoolLevel')}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 z-[100]">
              <Command>
                <CommandInput
                  placeholder={t('schoolLevel')}
                  onValueChange={(value) => {
                    onCustomSearchTermsChange({ ...customSearchTerms, schoolLevel: value });
                  }}
                />
                <CommandList>
                  <CommandEmpty>{t('notFound')}</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        onFiltersChange({ ...filters, schoolLevel: 'combined' });
                        setOpenSchoolLevelCombobox(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          filters.schoolLevel === 'combined' ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {t('combined')}
                    </CommandItem>
                    {schoolLevels.map((level) => (
                      <CommandItem
                        key={level}
                        value={level}
                        onSelect={() => {
                          onFiltersChange({ ...filters, schoolLevel: level });
                          setOpenSchoolLevelCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            filters.schoolLevel === level ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {getSchoolLevelLabel(level, t)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* School Time Slider */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              {t('maxTravelTime')}: {filters.maxSchoolTime} {t('minutes')}
            </Label>
            <Slider
              value={[filters.maxSchoolTime]}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, maxSchoolTime: value[0] })
              }
              min={1}
              max={15}
              step={1}
              className="w-full"
            />
            {nearbySchoolsCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {nearbySchoolsCount} {t('schoolsFound')}
              </p>
            )}
          </div>
        </div>

        {/* Universities Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('universities')}</Label>
          
          <Popover open={openUniversityCombobox} onOpenChange={setOpenUniversityCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-background hover:bg-accent"
              >
                {filters.selectedUniversity || t('selectUniversity')}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 z-[100] bg-popover">
              <Command className="bg-popover">
                <CommandInput
                  placeholder={t('searchUniversity')}
                  onValueChange={(value) => {
                    onCustomSearchTermsChange({ ...customSearchTerms, university: value });
                  }}
                  className="bg-background"
                />
                <CommandList className="bg-popover">
                  <CommandEmpty>
                    {universities.length === 0 ? t('notFound') : t('noResults')}
                  </CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        onFiltersChange({ ...filters, selectedUniversity: '' });
                        onCustomSearchTermsChange({ ...customSearchTerms, university: '' });
                        setOpenUniversityCombobox(false);
                      }}
                      className="bg-popover hover:bg-accent"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          !filters.selectedUniversity ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {t('all')}
                    </CommandItem>
                    {universities.map((uni) => {
                      const displayName = i18n.language === 'ar' ? uni.name_ar : uni.name_en;
                      return (
                        <CommandItem
                          key={uni.name_ar}
                          value={displayName}
                          onSelect={() => {
                            onFiltersChange({ ...filters, selectedUniversity: displayName });
                            onCustomSearchTermsChange({ ...customSearchTerms, university: '' });
                            setOpenUniversityCombobox(false);
                          }}
                          className="bg-popover hover:bg-accent"
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              filters.selectedUniversity === displayName
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          {displayName}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* University Time Slider */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              {t('maxTravelTime')}: {filters.maxUniversityTime} {t('minutes')}
            </Label>
            <Slider
              value={[filters.maxUniversityTime]}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, maxUniversityTime: value[0] })
              }
              min={1}
              max={30}
              step={1}
              className="w-full"
            />
            {nearbyUniversitiesCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {nearbyUniversitiesCount} {t('universitiesFound')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
