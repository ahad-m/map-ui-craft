/**
 * usePropertyFilters Hook
 * 

 */

import { useState, useCallback, useMemo } from 'react';
import type {
  PropertyFilters,
  CustomSearchTerms,
  SearchCriteria,
} from '../types';
import {
  DEFAULT_FILTERS,
  DEFAULT_CUSTOM_SEARCH_TERMS,
} from '../types';
import {
  mapSchoolGenderToFilter,
  mapSchoolLevelToFilter,
  hasActiveFilters,
} from '../utils/filterHelpers';

interface UsePropertyFiltersReturn {
  // State
  filters: PropertyFilters;
  appliedFilters: PropertyFilters;
  customSearchTerms: CustomSearchTerms;
  searchQuery: string;
  appliedSearchQuery: string;
  hasSearched: boolean;
  
  // Actions
  setFilters: React.Dispatch<React.SetStateAction<PropertyFilters>>;
  setCustomSearchTerms: React.Dispatch<React.SetStateAction<CustomSearchTerms>>;
  setSearchQuery: (query: string) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  triggerSearch: () => void;
  syncFromChatbot: (criteria: SearchCriteria) => void;
  
  // Computed
  hasActiveFilters: boolean;
}

export function usePropertyFilters(): UsePropertyFiltersReturn {
  // Current filter state (not yet applied)
  const [filters, setFilters] = useState<PropertyFilters>(DEFAULT_FILTERS);
  
  // Applied filters (trigger data refetch)
  const [appliedFilters, setAppliedFilters] = useState<PropertyFilters>(DEFAULT_FILTERS);
  
  // Custom search terms for combobox filtering
  const [customSearchTerms, setCustomSearchTerms] = useState<CustomSearchTerms>(
    DEFAULT_CUSTOM_SEARCH_TERMS
  );
  
  // Search query state
  const [searchQuery, setSearchQueryState] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  
  // Track if user has searched
  const [hasSearched, setHasSearched] = useState(false);

  /**
   * Set search query and mark as searched if not empty
   */
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
    if (query.trim() !== '') {
      setHasSearched(true);
      setAppliedSearchQuery(query);
    }
  }, []);

  /**
   * Apply current filters
   */
  const applyFilters = useCallback(() => {
    setAppliedFilters(filters);
    setAppliedSearchQuery(searchQuery);
    setHasSearched(true);
  }, [filters, searchQuery]);

  /**
   * Reset all filters to default
   */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setSearchQueryState('');
    setAppliedSearchQuery('');
    setCustomSearchTerms(DEFAULT_CUSTOM_SEARCH_TERMS);
    setHasSearched(false);
  }, []);

  /**
   * Trigger search without changing filters
   */
  const triggerSearch = useCallback(() => {
    setHasSearched(true);
  }, []);

  /**
   * Sync filters from chatbot search criteria
   */
  const syncFromChatbot = useCallback((criteria: SearchCriteria) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters };
      
      // Sync school requirements
      if (criteria.school_requirements?.required) {
        const schoolReqs = criteria.school_requirements;
        newFilters.schoolGender = mapSchoolGenderToFilter(schoolReqs.gender) as PropertyFilters['schoolGender'];
        
        if (schoolReqs.levels && schoolReqs.levels.length > 0) {
          newFilters.schoolLevel = mapSchoolLevelToFilter(schoolReqs.levels[0]);
        }
        
        if (schoolReqs.max_distance_minutes) {
          newFilters.maxSchoolTime = schoolReqs.max_distance_minutes;
        }
      }
      
      // Sync university requirements
      if (criteria.university_requirements?.required) {
        const uniReqs = criteria.university_requirements;
        if (uniReqs.university_name) {
          newFilters.selectedUniversity = uniReqs.university_name;
        }
        if (uniReqs.max_distance_minutes) {
          newFilters.maxUniversityTime = uniReqs.max_distance_minutes;
        }
      }
      
      // Sync mosque requirements
      if (criteria.mosque_requirements?.required) {
        newFilters.nearMosques = true;
        if (criteria.mosque_requirements.max_distance_minutes) {
          newFilters.maxMosqueTime = criteria.mosque_requirements.max_distance_minutes;
        }
      }
      
      return newFilters;
    });
    
    // Also update custom search terms for university
    if (criteria.university_requirements?.university_name) {
      setCustomSearchTerms((prev) => ({
        ...prev,
        university: criteria.university_requirements!.university_name || '',
      }));
    }
    
    setHasSearched(true);
  }, []);

  /**
   * Check if any filters are active
   */
  const hasActiveFiltersValue = useMemo(
    () => hasActiveFilters(filters),
    [filters]
  );

  return {
    // State
    filters,
    appliedFilters,
    customSearchTerms,
    searchQuery,
    appliedSearchQuery,
    hasSearched,
    
    // Actions
    setFilters,
    setCustomSearchTerms,
    setSearchQuery,
    applyFilters,
    resetFilters,
    triggerSearch,
    syncFromChatbot,
    
    // Computed
    hasActiveFilters: hasActiveFiltersValue,
  };
}
