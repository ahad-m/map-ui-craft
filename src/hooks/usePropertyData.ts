/**
 * Property Data Hook
 * 
 * Centralized hook for fetching all property-related data from Supabase.
 * Handles queries for properties, neighborhoods, schools, universities, and mosques.
 */

import { useQuery } from "@tanstack/react-query";
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

interface UsePropertyDataProps {
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
}

export const usePropertyData = ({
  transactionType,
  filters,
  searchQuery,
  customSearchTerms,
}: UsePropertyDataProps) => {
  // Predefined options
  const predefinedPropertyTypes = ["استوديو", "شقق", "فلل", "تاون هاوس", "دوبلكس", "دور", "عمائر"];
  const predefinedSchoolGenders = ["Boys", "Girls"];
  const predefinedSchoolLevels = ["nursery", "kindergarten", "elementary", "middle", "high"];

  // Property types query
  const { data: additionalPropertyTypes = [] } = useQuery({
    queryKey: ["propertyTypes", customSearchTerms.propertyType],
    queryFn: async () => {
      if (!customSearchTerms.propertyType) return [];
      const data = await fetchPropertyTypes(customSearchTerms.propertyType);
      const uniquePropertyTypes = [
        ...new Set(
          data
            ?.map((p) => p.property_type?.trim())
            .filter((n) => n && n !== "" && !predefinedPropertyTypes.includes(n)) || [],
        ),
      ];
      return uniquePropertyTypes.sort((a, b) => a.localeCompare(b, "ar"));
    },
  });

  const allPropertyTypes = [...predefinedPropertyTypes, ...additionalPropertyTypes];

  // Neighborhoods query
  const { data: neighborhoods = [] } = useQuery({
    queryKey: ["neighborhoods", customSearchTerms.neighborhood],
    queryFn: async () => {
      const data = await fetchNeighborhoods(customSearchTerms.neighborhood);
      const uniqueNeighborhoods = [...new Set(data?.map((p) => p.district?.trim()).filter((n) => n && n !== "") || [])];
      return uniqueNeighborhoods.sort((a, b) => a.localeCompare(b, "ar"));
    },
  });

  // Properties query
  const { data: rawProperties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ["properties", transactionType, filters, searchQuery, customSearchTerms],
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
        searchQuery
      );
      return data || [];
    },
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
            .filter((g) => g && g !== "" && !["boys", "girls"].includes(g.toLowerCase())) || [],
        ),
      ];
      return uniqueGenders;
    },
  });

  const allSchoolGenders = [...predefinedSchoolGenders, ...additionalSchoolGenders];

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
            .filter((l) => l && l !== "" && !predefinedSchoolLevels.includes(l.toLowerCase())) || [],
        ),
      ];
      return uniqueLevels;
    },
  });

  const allSchoolLevels = [...predefinedSchoolLevels, ...additionalSchoolLevels];

  // Schools query
  const { data: allSchools = [] } = useQuery({
    queryKey: ["schools", filters.schoolGender, filters.schoolLevel, customSearchTerms.school],
    queryFn: async () => {
      const data = await fetchSchools(
        filters.schoolGender,
        filters.schoolLevel,
        customSearchTerms.school
      );
      return data || [];
    },
  });

  // Universities query
  const { data: allUniversities = [] } = useQuery({
    queryKey: ["universities", customSearchTerms.university],
    queryFn: async () => {
      const data = await fetchUniversities(customSearchTerms.university);
      return data || [];
    },
  });

  // Mosques query
  const { data: allMosques = [] } = useQuery({
    queryKey: ["mosques"],
    queryFn: async () => {
      const data = await fetchMosques();
      return data || [];
    },
  });

  return {
    // Data
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
