/**
 * Filter State Hook
 * 
 * Manages all filter state and custom search terms for property search.
 */

import { useState } from "react";

export interface FilterState {
  propertyType: string;
  city: string;
  neighborhood: string;
  minPrice: number;
  maxPrice: number;
  areaMin: number;
  areaMax: number;
  bedrooms: string;
  livingRooms: string;
  bathrooms: string;
  schoolGender: string;
  schoolLevel: string;
  maxSchoolTime: number;
  selectedUniversity: string;
  maxUniversityTime: number;
  nearMetro: boolean;
  minMetroTime: number;
  nearHospitals: boolean;
  nearMosques: boolean;
  maxMosqueTime: number;
}

export interface CustomSearchTerms {
  propertyType: string;
  neighborhood: string;
  school: string;
  university: string;
  schoolGender: string;
  schoolLevel: string;
}

const initialFilterState: FilterState = {
  propertyType: "",
  city: "الرياض",
  neighborhood: "",
  minPrice: 0,
  maxPrice: 0,
  areaMin: 0,
  areaMax: 0,
  bedrooms: "",
  livingRooms: "",
  bathrooms: "",
  schoolGender: "",
  schoolLevel: "",
  maxSchoolTime: 15,
  selectedUniversity: "",
  maxUniversityTime: 30,
  nearMetro: false,
  minMetroTime: 1,
  nearHospitals: false,
  nearMosques: false,
  maxMosqueTime: 30,
};

const initialCustomSearchTerms: CustomSearchTerms = {
  propertyType: "",
  neighborhood: "",
  school: "",
  university: "",
  schoolGender: "",
  schoolLevel: "",
};

export const useFilterState = () => {
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [customSearchTerms, setCustomSearchTerms] = useState<CustomSearchTerms>(initialCustomSearchTerms);

  const resetFilters = () => {
    setFilters(initialFilterState);
    setCustomSearchTerms(initialCustomSearchTerms);
  };

  const hasActiveFilters =
    filters.propertyType ||
    filters.neighborhood ||
    filters.minPrice > 0 ||
    filters.maxPrice > 0 ||
    filters.areaMin > 0 ||
    filters.areaMax > 0 ||
    filters.bedrooms ||
    filters.bathrooms ||
    filters.livingRooms ||
    filters.schoolGender ||
    filters.schoolLevel ||
    filters.selectedUniversity ||
    filters.nearMetro ||
    filters.nearMosques;

  return {
    filters,
    setFilters,
    customSearchTerms,
    setCustomSearchTerms,
    resetFilters,
    hasActiveFilters,
  };
};
