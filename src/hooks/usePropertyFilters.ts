/**
 * Property Filters Hook
 * 
 * Custom React hook for managing property search filters state.
 * Provides a centralized way to handle all filter-related state and operations.
 * 
 * @module hooks/usePropertyFilters
 */

import { useState } from 'react';

/**
 * Property filter state interface
 * 
 * Defines all available filters for property search functionality.
 * Includes basic property attributes, location filters, and proximity filters
 * for schools, universities, metro stations, and other amenities.
 */
export interface PropertyFilters {
  /** Type of property (e.g., apartment, villa) */
  propertyType: string;
  
  /** City name (default: Riyadh) */
  city: string;
  
  /** Neighborhood/district name */
  neighborhood: string;
  
  /** Minimum price filter */
  minPrice: number;
  
  /** Maximum price filter */
  maxPrice: number;
  
  /** Minimum area in square meters */
  areaMin: number;
  
  /** Maximum area in square meters */
  areaMax: number;
  
  /** Number of bedrooms */
  bedrooms: string;
  
  /** Number of living rooms */
  livingRooms: string;
  
  /** Number of bathrooms */
  bathrooms: string;
  
  /** School gender filter (Boys/Girls) */
  schoolGender: string;
  
  /** School level filter (elementary, middle, high) */
  schoolLevel: string;
  
  /** Maximum travel time to school in minutes */
  maxSchoolTime: number;
  
  /** Selected university name */
  selectedUniversity: string;
  
  /** Maximum travel time to university in minutes */
  maxUniversityTime: number;
  
  /** Filter for properties near metro stations */
  nearMetro: boolean;
  
  /** Minimum travel time to metro in minutes */
  minMetroTime: number;
  
  /** Filter for properties near hospitals */
  nearHospitals: boolean;
  
  /** Filter for properties near mosques */
  nearMosques: boolean;
  
  /** Maximum travel time to mosque in minutes */
  maxMosqueTime: number;
}

/**
 * Initial filter values
 * 
 * Default state for all property filters.
 * City defaults to Riyadh (الرياض).
 */
const initialFilters: PropertyFilters = {
  propertyType: '',
  city: 'الرياض', // Default to Riyadh
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
  maxSchoolTime: 15, // Default 15 minutes to school
  selectedUniversity: '',
  maxUniversityTime: 30, // Default 30 minutes to university
  nearMetro: false,
  minMetroTime: 1,
  nearHospitals: false,
  nearMosques: false,
  maxMosqueTime: 30, // Default 30 minutes to mosque
};

/**
 * Custom hook for managing property filters
 * 
 * Provides state management and utility functions for property search filters.
 * Handles individual filter updates, batch updates, and filter reset.
 * 
 * @returns Object containing filters state and update functions
 * 
 * @example
 * const { filters, updateFilter, updateFilters, resetFilters } = usePropertyFilters();
 * 
 * // Update single filter
 * updateFilter('propertyType', 'فلل');
 * 
 * // Update multiple filters at once
 * updateFilters({ minPrice: 500000, maxPrice: 1000000 });
 * 
 * // Reset all filters to defaults
 * resetFilters();
 */
export const usePropertyFilters = () => {
  // Initialize filters with default values
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters);

  /**
   * Update a single filter value
   * 
   * Type-safe update function that ensures the key exists in PropertyFilters
   * and the value matches the expected type.
   * 
   * @param key - The filter key to update
   * @param value - The new value for the filter
   */
  const updateFilter = <K extends keyof PropertyFilters>(
    key: K,
    value: PropertyFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Update multiple filters at once
   * 
   * Accepts a partial PropertyFilters object to update multiple
   * filter values in a single operation.
   * 
   * @param updates - Partial object containing filter updates
   */
  const updateFilters = (updates: Partial<PropertyFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  /**
   * Reset all filters to their initial values
   * 
   * Restores all filter values to the defaults defined in initialFilters.
   * Useful for "Clear All Filters" functionality.
   */
  const resetFilters = () => {
    setFilters(initialFilters);
  };

  return {
    /** Current filter values */
    filters,
    /** Update a single filter */
    updateFilter,
    /** Update multiple filters */
    updateFilters,
    /** Reset all filters */
    resetFilters,
  };
};
