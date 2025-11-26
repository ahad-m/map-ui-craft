import { useState } from 'react';

/**
 * Property filter state interface
 */
export interface PropertyFilters {
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

/**
 * Initial filter values
 */
const initialFilters: PropertyFilters = {
  propertyType: '',
  city: 'الرياض',
  neighborhood: '',
  minPrice: 0,
  maxPrice: 0,
  areaMin: 0,
  areaMax: 0,
  bedrooms: '',
  livingRooms: '',
  bathrooms: '',
  schoolGender: '',
  schoolLevel: '',
  maxSchoolTime: 15,
  selectedUniversity: '',
  maxUniversityTime: 30,
  nearMetro: false,
  minMetroTime: 1,
  nearHospitals: false,
  nearMosques: false,
  maxMosqueTime: 30,
};

/**
 * Custom hook for managing property filters
 */
export const usePropertyFilters = () => {
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters);

  const updateFilter = <K extends keyof PropertyFilters>(
    key: K,
    value: PropertyFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const updateFilters = (updates: Partial<PropertyFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
  };
};
