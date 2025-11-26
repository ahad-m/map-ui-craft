/**
 * FilterSheet Component
 * 
 * Advanced property filters sheet component
 * Provides comprehensive filtering options for real estate search
 * 
 * @module components/realestate/FilterSheet
 */

import { useState } from "react";
import {
  SlidersHorizontal,
  X,
  MapPin,
  Bed,
  Bath,
  Maximize,
  School,
  Check,
  ChevronsUpDown,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface FilterSheetProps {
  /** Whether filter sheet is open */
  isOpen: boolean;
  /** Callback when sheet open state changes */
  onOpenChange: (open: boolean) => void;
  /** Current filter values */
  filters: any;
  /** Update filter values */
  setFilters: (filters: any) => void;
  /** Custom search terms for comboboxes */
  customSearchTerms: any;
  /** Update custom search terms */
  setCustomSearchTerms: (terms: any) => void;
  /** All available property types */
  allPropertyTypes: string[];
  /** All available neighborhoods */
  neighborhoods: string[];
  /** All available school genders */
  allSchoolGenders: string[];
  /** All available school levels */
  allSchoolLevels: string[];
  /** All available universities */
  allUniversities: any[];
  /** Nearby schools count */
  nearbySchools: any[];
  /** Nearby universities count */
  nearbyUniversities: any[];
  /** Reset all filters */
  resetFilters: () => void;
  /** Apply filters callback */
  onApply: () => void;
  /** Translation function */
  t: (key: string) => string;
  /** Current language */
  language: string;
}

/**
 * FilterSheet Component
 * 
 * Renders comprehensive filter controls in a side sheet.
 * Includes property details, price/area, room details, education filters, and proximity filters.
 */
export const FilterSheet = ({
  isOpen,
  onOpenChange,
  filters,
  setFilters,
  customSearchTerms,
  setCustomSearchTerms,
  allPropertyTypes,
  neighborhoods,
  allSchoolGenders,
  allSchoolLevels,
  allUniversities,
  nearbySchools,
  nearbyUniversities,
  resetFilters,
  onApply,
  t,
  language,
}: FilterSheetProps) => {
  const [openPropertyTypeCombobox, setOpenPropertyTypeCombobox] = useState(false);
  const [openNeighborhoodCombobox, setOpenNeighborhoodCombobox] = useState(false);
  const [openSchoolGenderCombobox, setOpenSchoolGenderCombobox] = useState(false);
  const [openSchoolLevelCombobox, setOpenSchoolLevelCombobox] = useState(false);
  const [openUniversityCombobox, setOpenUniversityCombobox] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="gap-3 px-8 py-6 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] text-primary-foreground font-bold text-base shadow-glow hover:bg-[position:100%_0] hover:scale-110 transition-all duration-500 border-2 border-primary-foreground/20 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <SlidersHorizontal className="h-6 w-6 group-hover:rotate-180 transition-transform duration-500 relative z-10" />
          <span className="relative z-10">{t("advancedFilters")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto bg-background/98 backdrop-blur-md"
      >
        <SheetHeader className="pb-6 border-b-2 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
            </div>
            <SheetTitle className="text-2xl font-bold">{t("advancedFilters")}</SheetTitle>
          </div>
        </SheetHeader>

        <div className="space-y-8 mt-6 pb-4">
          {/* Property Details Section */}
          <div className="space-y-4 p-5 rounded-xl border border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-elegant">
            <h3 className="font-bold text-lg flex items-center gap-3 text-foreground">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              {t("propertyDetails")}
            </h3>

            <div className="space-y-3">
              {/* Property Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("propertyType")}</Label>
                <Popover open={openPropertyTypeCombobox} onOpenChange={setOpenPropertyTypeCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between bg-background hover:bg-accent"
                    >
                      {filters.propertyType || t("selectPropertyType")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0 z-[100]">
                    <Command>
                      <CommandInput
                        placeholder={t("propertyType")}
                        onValueChange={(value) => {
                          setCustomSearchTerms({ ...customSearchTerms, propertyType: value });
                        }}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {allPropertyTypes.length === 0 ? t("notFound") : t("selectPropertyType")}
                        </CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setFilters({ ...filters, propertyType: "" });
                              setCustomSearchTerms({ ...customSearchTerms, propertyType: "" });
                              setOpenPropertyTypeCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !filters.propertyType ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {t("none")}
                          </CommandItem>
                          {allPropertyTypes.map((type) => (
                            <CommandItem
                              key={type}
                              value={type}
                              onSelect={() => {
                                setFilters({ ...filters, propertyType: type });
                                setCustomSearchTerms({ ...customSearchTerms, propertyType: "" });
                                setOpenPropertyTypeCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filters.propertyType === type ? "opacity-100" : "opacity-0",
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
                <Label className="text-sm font-medium">{t("neighborhood")}</Label>
                <Popover open={openNeighborhoodCombobox} onOpenChange={setOpenNeighborhoodCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between bg-background hover:bg-accent"
                    >
                      {filters.neighborhood || t("selectNeighborhood")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0 z-[100]">
                    <Command>
                      <CommandInput
                        placeholder={t("searchNeighborhood")}
                        onValueChange={(value) => {
                          setCustomSearchTerms({ ...customSearchTerms, neighborhood: value });
                        }}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {neighborhoods.length === 0 ? t("notFound") : t("noNeighborhoodFound")}
                        </CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setFilters({ ...filters, neighborhood: "" });
                              setCustomSearchTerms({ ...customSearchTerms, neighborhood: "" });
                              setOpenNeighborhoodCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !filters.neighborhood ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {t("none")}
                          </CommandItem>
                          {neighborhoods.map((neighborhood) => (
                            <CommandItem
                              key={neighborhood}
                              value={neighborhood}
                              onSelect={() => {
                                setFilters({ ...filters, neighborhood });
                                setCustomSearchTerms({ ...customSearchTerms, neighborhood: "" });
                                setOpenNeighborhoodCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filters.neighborhood === neighborhood ? "opacity-100" : "opacity-0",
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

          {/* Price & Area Section */}
          <div className="space-y-4 p-5 rounded-xl border border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-elegant">
            <h3 className="font-bold text-lg flex items-center gap-3 text-foreground">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10">
                <Maximize className="h-5 w-5 text-primary" />
              </div>
              {t("priceAndArea")}
            </h3>

            <div className="space-y-3">
              {/* Price Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("price")} (SAR)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t("min")}</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min="0"
                        placeholder={t("min")}
                        value={filters.minPrice || ""}
                        onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) })}
                        className="bg-background"
                      />
                      {filters.minPrice > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setFilters({ ...filters, minPrice: 0 })}
                          className="shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t("max")}</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min="0"
                        placeholder={t("max")}
                        value={filters.maxPrice || ""}
                        onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                        className="bg-background"
                      />
                      {filters.maxPrice > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setFilters({ ...filters, maxPrice: 0 })}
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
                <Label className="text-sm font-medium">{t("areaSize")} (م²)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t("min")}</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min="0"
                        placeholder={t("min")}
                        value={filters.areaMin || ""}
                        onChange={(e) => setFilters({ ...filters, areaMin: Number(e.target.value) })}
                        className="bg-background"
                      />
                      {filters.areaMin > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setFilters({ ...filters, areaMin: 0 })}
                          className="shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t("max")}</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min="0"
                        placeholder={t("max")}
                        value={filters.areaMax || ""}
                        onChange={(e) => setFilters({ ...filters, areaMax: Number(e.target.value) })}
                        className="bg-background"
                      />
                      {filters.areaMax > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setFilters({ ...filters, areaMax: 0 })}
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

          {/* Room Details Section */}
          <div className="space-y-4 p-5 rounded-xl border border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-elegant">
            <h3 className="font-bold text-lg flex items-center gap-3 text-foreground">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10">
                <Bed className="h-5 w-5 text-primary" />
              </div>
              {t("roomDetails")}
            </h3>

            <div className="space-y-3">
              {/* Bedrooms */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("bedrooms")}</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder={t("bedrooms")}
                    value={filters.bedrooms || ""}
                    onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                    className="bg-background flex-1"
                  />
                  {filters.bedrooms && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setFilters({ ...filters, bedrooms: "" })}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Living Rooms */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("livingRooms")}</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder={t("livingRooms")}
                    value={filters.livingRooms || ""}
                    onChange={(e) => setFilters({ ...filters, livingRooms: e.target.value })}
                    className="bg-background flex-1"
                  />
                  {filters.livingRooms && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setFilters({ ...filters, livingRooms: "" })}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Bathrooms */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("bathrooms")}</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder={t("bathrooms")}
                    value={filters.bathrooms || ""}
                    onChange={(e) => setFilters({ ...filters, bathrooms: e.target.value })}
                    className="bg-background flex-1"
                  />
                  {filters.bathrooms && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setFilters({ ...filters, bathrooms: "" })}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Education Section */}
          <div className="space-y-4 p-5 rounded-xl border border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-elegant">
            <h3 className="font-bold text-lg flex items-center gap-3 text-foreground">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10">
                <School className="h-5 w-5 text-primary" />
              </div>
              {t("education")}
            </h3>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("schools")}</Label>

                {/* School Gender Filter */}
                <Popover open={openSchoolGenderCombobox} onOpenChange={setOpenSchoolGenderCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between bg-background hover:bg-accent"
                    >
                      {filters.schoolGender === "All"
                        ? t("all")
                        : filters.schoolGender === "Boys"
                          ? t("boys")
                          : filters.schoolGender === "Girls"
                            ? t("girls")
                            : filters.schoolGender || t("gender")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0 z-[100]">
                    <Command>
                      <CommandInput
                        placeholder={t("gender")}
                        onValueChange={(value) => {
                          setCustomSearchTerms({ ...customSearchTerms, schoolGender: value });
                        }}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {allSchoolGenders.length === 0 ? t("notFound") : t("gender")}
                        </CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setFilters({ ...filters, schoolGender: "All" });
                              setCustomSearchTerms({ ...customSearchTerms, schoolGender: "" });
                              setOpenSchoolGenderCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.schoolGender === "All" ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {t("all")}
                          </CommandItem>
                          {allSchoolGenders.map((gender) => (
                            <CommandItem
                              key={gender}
                              value={gender}
                              onSelect={() => {
                                setFilters({ ...filters, schoolGender: gender });
                                setCustomSearchTerms({ ...customSearchTerms, schoolGender: "" });
                                setOpenSchoolGenderCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filters.schoolGender === gender ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {gender === "All"
                                ? t("all")
                                : gender === "Boys"
                                  ? t("boys")
                                  : gender === "Girls"
                                    ? t("girls")
                                    : gender}
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
                      {filters.schoolLevel === "combined"
                        ? t("combined")
                        : filters.schoolLevel === "nursery"
                          ? t("nursery")
                          : filters.schoolLevel === "kindergarten"
                            ? t("kindergarten")
                            : filters.schoolLevel === "elementary"
                              ? t("elementary")
                              : filters.schoolLevel === "middle"
                                ? t("middle")
                                : filters.schoolLevel === "high"
                                  ? t("high")
                                  : filters.schoolLevel || t("schoolLevel")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0 z-[100]">
                    <Command>
                      <CommandInput
                        placeholder={t("schoolLevel")}
                        onValueChange={(value) => {
                          setCustomSearchTerms({ ...customSearchTerms, schoolLevel: value });
                        }}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {allSchoolLevels.length === 0 ? t("notFound") : t("schoolLevel")}
                        </CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setFilters({ ...filters, schoolLevel: "combined" });
                              setCustomSearchTerms({ ...customSearchTerms, schoolLevel: "" });
                              setOpenSchoolLevelCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.schoolLevel === "combined" ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {t("combined")}
                          </CommandItem>
                          {allSchoolLevels.map((level) => (
                            <CommandItem
                              key={level}
                              value={level}
                              onSelect={() => {
                                setFilters({ ...filters, schoolLevel: level });
                                setCustomSearchTerms({ ...customSearchTerms, schoolLevel: "" });
                                setOpenSchoolLevelCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filters.schoolLevel === level ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {level === "combined"
                                ? t("combined")
                                : level === "nursery"
                                  ? t("nursery")
                                  : level === "kindergarten"
                                    ? t("kindergarten")
                                    : level === "elementary"
                                      ? t("elementary")
                                      : level === "middle"
                                        ? t("middle")
                                        : level === "high"
                                          ? t("high")
                                          : level}
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
                    {t("maxTravelTime")}: {filters.maxSchoolTime} {t("minutes")}
                  </Label>
                  <Slider
                    value={[filters.maxSchoolTime]}
                    onValueChange={(value) => setFilters({ ...filters, maxSchoolTime: value[0] })}
                    min={1}
                    max={15}
                    step={1}
                    className="w-full"
                  />
                  {nearbySchools.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {nearbySchools.length} {t("schoolsFound")}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("universities")}</Label>

                {/* University Selection Dropdown */}
                <Popover open={openUniversityCombobox} onOpenChange={setOpenUniversityCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between bg-background hover:bg-accent"
                    >
                      {filters.selectedUniversity || t("selectUniversity")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0 z-[100] bg-popover">
                    <Command className="bg-popover">
                      <CommandInput
                        placeholder={t("searchUniversity")}
                        onValueChange={(value) => {
                          setCustomSearchTerms({ ...customSearchTerms, university: value });
                        }}
                        className="bg-background"
                      />
                      <CommandList className="bg-popover">
                        <CommandEmpty>
                          {allUniversities.length === 0 ? t("notFound") : t("noResults")}
                        </CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setFilters({ ...filters, selectedUniversity: "" });
                              setCustomSearchTerms({ ...customSearchTerms, university: "" });
                              setOpenUniversityCombobox(false);
                            }}
                            className="bg-popover hover:bg-accent"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !filters.selectedUniversity ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {t("all")}
                          </CommandItem>
                          {allUniversities.map((uni) => (
                            <CommandItem
                              key={uni.name_ar}
                              value={language === "ar" ? uni.name_ar : uni.name_en}
                              onSelect={() => {
                                setFilters({
                                  ...filters,
                                  selectedUniversity: language === "ar" ? uni.name_ar : uni.name_en,
                                });
                                setCustomSearchTerms({ ...customSearchTerms, university: "" });
                                setOpenUniversityCombobox(false);
                              }}
                              className="bg-popover hover:bg-accent"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filters.selectedUniversity ===
                                    (language === "ar" ? uni.name_ar : uni.name_en)
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {language === "ar" ? uni.name_ar : uni.name_en}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* University Time Slider */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    {t("maxTravelTime")}: {filters.maxUniversityTime} {t("minutes")}
                  </Label>
                  <Slider
                    value={[filters.maxUniversityTime]}
                    onValueChange={(value) => setFilters({ ...filters, maxUniversityTime: value[0] })}
                    min={1}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                  {nearbyUniversities.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {nearbyUniversities.length} {t("universitiesFound")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Proximity Filters Section */}
          <div className="space-y-4 p-4 rounded-lg border border-border bg-card/50">
            <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-md bg-primary/15">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              {t("proximityFilters")}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Checkbox
                  id="nearMosques"
                  checked={filters.nearMosques}
                  onCheckedChange={(checked) => setFilters({ ...filters, nearMosques: checked as boolean })}
                />
                <label htmlFor="nearMosques" className="text-sm cursor-pointer">
                  {t("nearMosques")}
                </label>
              </div>
              {filters.nearMosques && (
                <div className="ml-6 space-y-2 p-3 bg-background/50 rounded-lg rtl:mr-6 rtl:ml-0">
                  <Label className="text-xs font-medium">
                    {t("maxTravelTime")}: {filters.maxMosqueTime} {t("minutes")}
                  </Label>
                  <Slider
                    value={[filters.maxMosqueTime]}
                    onValueChange={(value) => setFilters({ ...filters, maxMosqueTime: value[0] })}
                    min={1}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metro"
                  checked={filters.nearMetro}
                  onCheckedChange={(checked) => setFilters({ ...filters, nearMetro: checked as boolean })}
                />
                <label htmlFor="metro" className="text-sm cursor-pointer">
                  {t("nearMetro")}
                </label>
              </div>
              {filters.nearMetro && (
                <div className="ml-6 space-y-2 p-3 bg-background/50 rounded-lg">
                  <Label className="text-xs font-medium">
                    {t("maxWalkingTime")}: {filters.minMetroTime} {t("minutes")}
                  </Label>
                  <Slider
                    value={[filters.minMetroTime]}
                    onValueChange={(value) => setFilters({ ...filters, minMetroTime: value[0] })}
                    min={1}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Apply/Reset Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-border/50">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-12 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all"
              onClick={resetFilters}
            >
              <X className={`h-5 w-5 ${language === "ar" ? "ml-2" : "mr-2"}`} />
              {t("resetFilters")}
            </Button>
            <Button
              size="lg"
              className="flex-1 h-12 bg-gradient-to-r from-primary to-accent shadow-glow hover:shadow-elevated hover:scale-105 transition-all duration-300 font-bold"
              onClick={onApply}
            >
              <Search className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
              {t("applyFilters")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
