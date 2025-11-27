/**
 * Optimized Property Data Hook
 * 
 * High-performance data fetching with caching, debouncing, and memoization
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  fetchProperties,
  fetchPropertyTypes,
  fetchNeighborhoods,
  fetchSchools,
  fetchSchoolGenders,
  fetchSchoolLevels,
  fetchUniversities,
  fetchMosques,
} from "@/services/supabaseService";

interface UseOptimizedPropertyDataProps {
  transactionType: "rent" | "sale";
  filters: {
    propertyType: string;
    neighborhood: string;
    bedrooms: string;
    bathrooms: string;
    livingRooms: string;
    schoolGender: string;
    schoolLevel: string;
  };
  searchQuery: string;
  customSearchTerms: {
    propertyType: string;
    neighborhood: string;
    school: string;
    university: string;
    schoolGender: string;
    schoolLevel: string;
  };
  enabled?: boolean;
}

/**
 * Optimized property data hook with debouncing and aggressive caching
 */
export const useOptimizedPropertyData = ({
  transactionType,
  filters,
  searchQuery,
  customSearchTerms,
  enabled = true,
}: UseOptimizedPropertyDataProps) => {
  // Debounce search queries for performance (reduced for faster response)
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 200);
  const debouncedPropertyTypeSearch = useDebouncedValue(customSearchTerms.propertyType, 200);
  const debouncedNeighborhoodSearch = useDebouncedValue(customSearchTerms.neighborhood, 200);
  const debouncedSchoolSearch = useDebouncedValue(customSearchTerms.school, 200);
  const debouncedUniversitySearch = useDebouncedValue(customSearchTerms.university, 200);

  // Predefined options (memoized)
  const predefinedOptions = useMemo(() => ({
    propertyTypes: ["استوديو", "شقق", "فلل", "تاون هاوس", "دوبلكس", "دور", "عمائر"],
    schoolGenders: ["Boys", "Girls"],
    schoolLevels: ["nursery", "kindergarten", "elementary", "middle", "high"],
  }), []);

  // Main properties query with aggressive caching for instant loading
  const { data: rawProperties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ["properties", transactionType, filters, debouncedSearchQuery],
    queryFn: async () => {
      const data = await fetchProperties(
        transactionType,
        {
          propertyType: filters.propertyType,
          neighborhood: filters.neighborhood,
          bedrooms: filters.bedrooms,
          bathrooms: filters.bathrooms,
          livingRooms: filters.livingRooms,
        },
        debouncedSearchQuery
      );
      return data || [];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes for instant loading
    gcTime: 30 * 60 * 1000, // Keep in memory for 30 minutes
    refetchOnMount: false, // Don't refetch on every mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Property types query
  const { data: additionalPropertyTypes = [] } = useQuery({
    queryKey: ["propertyTypes", debouncedPropertyTypeSearch],
    queryFn: async () => {
      if (!debouncedPropertyTypeSearch) return [];
      const data = await fetchPropertyTypes(debouncedPropertyTypeSearch);
      const uniquePropertyTypes = [
        ...new Set(
          data
            ?.map((p) => p.property_type?.trim())
            .filter((n) => n && n !== "" && !predefinedOptions.propertyTypes.includes(n)) || []
        ),
      ];
      return uniquePropertyTypes.sort((a, b) => a.localeCompare(b, "ar"));
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Neighborhoods query
  const { data: neighborhoods = [] } = useQuery({
    queryKey: ["neighborhoods", debouncedNeighborhoodSearch],
    queryFn: async () => {
      const data = await fetchNeighborhoods(debouncedNeighborhoodSearch);
      const uniqueNeighborhoods = [...new Set(data?.map((p) => p.district?.trim()).filter((n) => n && n !== "") || [])];
      return uniqueNeighborhoods.sort((a, b) => a.localeCompare(b, "ar"));
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // School genders query
  const { data: additionalSchoolGenders = [] } = useQuery({
    queryKey: ["schoolGenders", customSearchTerms.schoolGender],
    queryFn: async () => {
      if (!customSearchTerms.schoolGender) return [];
      const data = await fetchSchoolGenders(customSearchTerms.schoolGender);
      const uniqueGenders = [
        ...new Set(
          data
            ?.map((s) => s.gender?.trim())
            .filter((g) => g && g !== "" && !["boys", "girls"].includes(g.toLowerCase())) || []
        ),
      ];
      return uniqueGenders;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // School levels query
  const { data: additionalSchoolLevels = [] } = useQuery({
    queryKey: ["schoolLevels", customSearchTerms.schoolLevel],
    queryFn: async () => {
      if (!customSearchTerms.schoolLevel) return [];
      const data = await fetchSchoolLevels(customSearchTerms.schoolLevel);
      const uniqueLevels = [
        ...new Set(
          data
            ?.map((s) => s.primary_level?.trim())
            .filter((l) => l && l !== "" && !predefinedOptions.schoolLevels.includes(l.toLowerCase())) || []
        ),
      ];
      return uniqueLevels;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Schools query (static data with long caching)
  const { data: allSchools = [] } = useQuery({
    queryKey: ["schools", filters.schoolGender, filters.schoolLevel, debouncedSchoolSearch],
    queryFn: async () => {
      const data = await fetchSchools(
        filters.schoolGender,
        filters.schoolLevel,
        debouncedSchoolSearch
      );
      return data || [];
    },
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in memory for 1 hour
  });

  // Universities query (static data with long caching)
  const { data: allUniversities = [] } = useQuery({
    queryKey: ["universities", debouncedUniversitySearch],
    queryFn: async () => {
      const data = await fetchUniversities(debouncedUniversitySearch);
      return data || [];
    },
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    gcTime: 120 * 60 * 1000, // Keep in memory for 2 hours
  });

  // Mosques query (static data with very long caching)
  const { data: allMosques = [] } = useQuery({
    queryKey: ["mosques"],
    queryFn: async () => {
      const data = await fetchMosques();
      return data || [];
    },
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
    gcTime: 240 * 60 * 1000, // Keep in memory for 4 hours
  });

  // Memoized combined property types
  const allPropertyTypes = useMemo(
    () => [...predefinedOptions.propertyTypes, ...additionalPropertyTypes],
    [predefinedOptions.propertyTypes, additionalPropertyTypes]
  );

  // Memoized combined school genders
  const allSchoolGenders = useMemo(
    () => [...predefinedOptions.schoolGenders, ...additionalSchoolGenders],
    [predefinedOptions.schoolGenders, additionalSchoolGenders]
  );

  // Memoized combined school levels
  const allSchoolLevels = useMemo(
    () => [...predefinedOptions.schoolLevels, ...additionalSchoolLevels],
    [predefinedOptions.schoolLevels, additionalSchoolLevels]
  );

  return {
    // Data (always arrays, never undefined)
    allPropertyTypes,
    neighborhoods,
    rawProperties,
    allSchoolGenders,
    allSchoolLevels,
    allSchools,
    allUniversities,
    allMosques,
    
    // Loading states
    isLoadingProperties,
  };
};
