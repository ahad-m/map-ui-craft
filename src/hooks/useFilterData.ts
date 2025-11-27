/**
 * Filter Data Hook
 * 
 * Lightweight hook for fetching filter options only
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  fetchPropertyTypes,
  fetchNeighborhoods,
  fetchSchools,
  fetchSchoolGenders,
  fetchSchoolLevels,
  fetchUniversities,
  fetchMosques,
} from "@/services/supabaseService";

interface UseFilterDataProps {
  customSearchTerms: {
    propertyType: string;
    neighborhood: string;
    school: string;
    university: string;
    schoolGender: string;
    schoolLevel: string;
  };
  filters: {
    schoolGender: string;
    schoolLevel: string;
  };
}

export const useFilterData = ({
  customSearchTerms,
  filters,
}: UseFilterDataProps) => {
  const debouncedPropertyTypeSearch = useDebouncedValue(customSearchTerms.propertyType, 300);
  const debouncedNeighborhoodSearch = useDebouncedValue(customSearchTerms.neighborhood, 300);
  const debouncedSchoolSearch = useDebouncedValue(customSearchTerms.school, 300);
  const debouncedUniversitySearch = useDebouncedValue(customSearchTerms.university, 300);

  const predefinedOptions = useMemo(() => ({
    propertyTypes: ["استوديو", "شقق", "فلل", "تاون هاوس", "دوبلكس", "دور", "عمائر"],
    schoolGenders: ["Boys", "Girls"],
    schoolLevels: ["nursery", "kindergarten", "elementary", "middle", "high"],
  }), []);

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
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: allUniversities = [] } = useQuery({
    queryKey: ["universities", debouncedUniversitySearch],
    queryFn: async () => {
      const data = await fetchUniversities(debouncedUniversitySearch);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: allMosques = [] } = useQuery({
    queryKey: ["mosques"],
    queryFn: async () => {
      const data = await fetchMosques();
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const allPropertyTypes = useMemo(
    () => [...predefinedOptions.propertyTypes, ...additionalPropertyTypes],
    [predefinedOptions.propertyTypes, additionalPropertyTypes]
  );

  const allSchoolGenders = useMemo(
    () => [...predefinedOptions.schoolGenders, ...additionalSchoolGenders],
    [predefinedOptions.schoolGenders, additionalSchoolGenders]
  );

  const allSchoolLevels = useMemo(
    () => [...predefinedOptions.schoolLevels, ...additionalSchoolLevels],
    [predefinedOptions.schoolLevels, additionalSchoolLevels]
  );

  return {
    allPropertyTypes,
    neighborhoods,
    allSchoolGenders,
    allSchoolLevels,
    allSchools,
    allUniversities,
    allMosques,
  };
};
