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
    city: string;
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
  // Debounce search queries for performance
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const debouncedPropertyTypeSearch = useDebouncedValue(customSearchTerms.propertyType, 300);
  const debouncedNeighborhoodSearch = useDebouncedValue(customSearchTerms.neighborhood, 300);
  const debouncedSchoolSearch = useDebouncedValue(customSearchTerms.school, 300);
  const debouncedUniversitySearch = useDebouncedValue(customSearchTerms.university, 300);

  // Predefined options (memoized)
  const predefinedOptions = useMemo(() => ({
    propertyTypes: ["استوديو", "شقق", "فلل", "تاون هاوس", "دوبلكس", "دور", "عمائر"],
    schoolGenders: ["Boys", "Girls"],
    schoolLevels: ["nursery", "kindergarten", "elementary", "middle", "high"],
  }), []);

  // Main properties query - fresh data on every search
  const { data: rawProperties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ["properties", transactionType, filters, debouncedSearchQuery],
    queryFn: async () => {
      console.log("🔍 Fetching properties from database:", { transactionType, filters, debouncedSearchQuery });
      const data = await fetchProperties(
        transactionType,
        {
          propertyType: filters.propertyType,
          neighborhood: filters.neighborhood,
          bedrooms: filters.bedrooms,
          bathrooms: filters.bathrooms,
          livingRooms: filters.livingRooms,
          city: filters.city,
        },
        debouncedSearchQuery
      );
      console.log(`✅ Database returned ${data?.length || 0} properties`);
      return data || [];
    },
    enabled,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache - always fresh
    refetchOnMount: 'always', // Always refetch
    refetchOnWindowFocus: true, // Refetch on window focus
    refetchOnReconnect: true, // Refetch on reconnect
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

  // Schools query (fresh data when filters change)
  const { data: allSchools = [] } = useQuery({
    queryKey: ["schools", filters.schoolGender, filters.schoolLevel, debouncedSchoolSearch],
    queryFn: async () => {
      console.log("🔍 Fetching schools:", { gender: filters.schoolGender, level: filters.schoolLevel, search: debouncedSchoolSearch });
      const data = await fetchSchools(
        filters.schoolGender,
        filters.schoolLevel,
        debouncedSchoolSearch
      );
      console.log(`✅ Database returned ${data?.length || 0} schools`);
      return data || [];
    },
    staleTime: 0, // Always fetch fresh when filters change
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
  });

  // Universities query (fresh data when filters change)
  const { data: allUniversities = [] } = useQuery({
    queryKey: ["universities", debouncedUniversitySearch],
    queryFn: async () => {
      console.log("🔍 Fetching universities:", { search: debouncedUniversitySearch });
      const data = await fetchUniversities(debouncedUniversitySearch);
      console.log(`✅ Database returned ${data?.length || 0} universities`);
      return data || [];
    },
    staleTime: 0, // Always fetch fresh when search changes
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
  });

  // Mosques query (fresh data on mount)
  const { data: allMosques = [] } = useQuery({
    queryKey: ["mosques"],
    queryFn: async () => {
      console.log("🔍 Fetching mosques");
      const data = await fetchMosques();
      console.log(`✅ Database returned ${data?.length || 0} mosques`);
      return data || [];
    },
    staleTime: 0, // Always fetch fresh
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
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
