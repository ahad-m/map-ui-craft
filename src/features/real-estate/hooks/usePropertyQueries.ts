/**
 * usePropertyQueries Hook
 * 

 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  Property,
  PropertyFilters,
  School,
  University,
  Mosque,
  TransactionType,
  CustomSearchTerms,
} from '../types';
import { PREDEFINED_PROPERTY_TYPES } from '../types';
import { applyClientSideFilters } from '../utils/filterHelpers';

interface UsePropertyQueriesProps {
  transactionType: TransactionType;
  appliedFilters: PropertyFilters;
  appliedSearchQuery: string;
  customSearchTerms: CustomSearchTerms;
}

interface UsePropertyQueriesReturn {
  // Data
  properties: Property[];
  allSchools: School[];
  allUniversities: University[];
  allMosques: Mosque[];
  propertyTypes: string[];
  neighborhoods: string[];
  schoolGenders: string[];
  schoolLevels: string[];
  
  // Loading states
  isLoadingProperties: boolean;
  isLoadingSchools: boolean;
  isLoadingUniversities: boolean;
  isLoadingMosques: boolean;
}

export function usePropertyQueries({
  transactionType,
  appliedFilters,
  appliedSearchQuery,
  customSearchTerms,
}: UsePropertyQueriesProps): UsePropertyQueriesReturn {
  
  /**
   * Fetch properties
   */
  const {
    data: rawProperties = [],
    isLoading: isLoadingProperties,
  } = useQuery({
    queryKey: ['properties', transactionType, appliedFilters, appliedSearchQuery],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('purpose', transactionType === 'sale' ? 'للبيع' : 'للايجار')
        .not('final_lat', 'is', null)
        .not('final_lon', 'is', null);
      
      if (appliedFilters.propertyType) {
        query = query.eq('property_type', appliedFilters.propertyType);
      }
      
      if (appliedFilters.neighborhood) {
        query = query.eq('district', appliedFilters.neighborhood);
      }
      
      if (appliedSearchQuery) {
        query = query.or(
          `city.ilike.%${appliedSearchQuery}%,district.ilike.%${appliedSearchQuery}%,title.ilike.%${appliedSearchQuery}%`
        );
      }
      
      if (appliedFilters.bedrooms && appliedFilters.bedrooms !== 'other') {
        const count = parseInt(appliedFilters.bedrooms);
        if (!isNaN(count)) query = query.eq('rooms', count);
      }
      
      if (appliedFilters.bathrooms && appliedFilters.bathrooms !== 'other') {
        const count = parseInt(appliedFilters.bathrooms);
        if (!isNaN(count)) query = query.eq('baths', count);
      }
      
      if (appliedFilters.livingRooms && appliedFilters.livingRooms !== 'other') {
        const count = parseInt(appliedFilters.livingRooms);
        if (!isNaN(count)) query = query.eq('halls', count);
      }
      
      const { data, error } = await query.limit(500);
      if (error) throw error;
      
      return (data || []) as Property[];
    },
  });

  /**
   * Apply client-side filters
   */
  const properties = applyClientSideFilters(rawProperties, appliedFilters);

  /**
   * Fetch additional property types based on search
   */
  const { data: additionalPropertyTypes = [] } = useQuery({
    queryKey: ['propertyTypes', customSearchTerms.propertyType],
    queryFn: async () => {
      if (!customSearchTerms.propertyType) return [];
      
      const { data, error } = await supabase
        .from('properties')
        .select('property_type')
        .not('property_type', 'is', null)
        .not('property_type', 'eq', '')
        .ilike('property_type', `%${customSearchTerms.propertyType}%`);
      
      if (error) throw error;
      
      const uniqueTypes = [
        ...new Set(
          data
            ?.map((p) => p.property_type?.trim())
            .filter((n) => n && n !== '' && !PREDEFINED_PROPERTY_TYPES.includes(n)) || []
        ),
      ];
      
      return uniqueTypes.sort((a, b) => a.localeCompare(b, 'ar'));
    },
  });

  const propertyTypes = [...PREDEFINED_PROPERTY_TYPES, ...additionalPropertyTypes];

  /**
   * Fetch neighborhoods
   */
  const { data: neighborhoods = [] } = useQuery({
    queryKey: ['neighborhoods', customSearchTerms.neighborhood],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('district')
        .not('district', 'is', null)
        .not('district', 'eq', '');
      
      if (customSearchTerms.neighborhood) {
        query = query.ilike('district', `%${customSearchTerms.neighborhood}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const uniqueNeighborhoods = [
        ...new Set(data?.map((p) => p.district?.trim()).filter((n) => n && n !== '') || []),
      ];
      
      return uniqueNeighborhoods.sort((a, b) => a.localeCompare(b, 'ar'));
    },
  });

  /**
   * Fetch schools
   */
  const {
    data: allSchools = [],
    isLoading: isLoadingSchools,
  } = useQuery({
    queryKey: ['schools', appliedFilters.schoolGender, appliedFilters.schoolLevel, customSearchTerms.school],
    queryFn: async () => {
      let query = supabase
        .from('schools')
        .select('*')
        .not('lat', 'is', null)
        .not('lon', 'is', null)
        .not('name', 'is', null);
      
      if (appliedFilters.schoolGender && appliedFilters.schoolGender !== 'All') {
        const genderValue =
          appliedFilters.schoolGender === 'Boys'
            ? 'boys'
            : appliedFilters.schoolGender === 'Girls'
            ? 'girls'
            : 'both';
        query = query.eq('gender', genderValue);
      }
      
      if (appliedFilters.schoolLevel && appliedFilters.schoolLevel !== 'combined') {
        query = query.eq('primary_level', appliedFilters.schoolLevel);
      }
      
      if (customSearchTerms.school) {
        query = query.or(
          `name.ilike.%${customSearchTerms.school}%,district.ilike.%${customSearchTerms.school}%`
        );
      }
      
      const { data, error } = await query.order('name', { ascending: true });
      if (error) throw error;
      
      return (data || []) as School[];
    },
  });

  /**
   * Fetch school genders
   */
  const { data: additionalSchoolGenders = [] } = useQuery({
    queryKey: ['schoolGenders', customSearchTerms.schoolGender],
    queryFn: async () => {
      if (!customSearchTerms.schoolGender) return [];
      
      const { data, error } = await supabase
        .from('schools')
        .select('gender')
        .not('gender', 'is', null)
        .not('gender', 'eq', '')
        .ilike('gender', `%${customSearchTerms.schoolGender}%`);
      
      if (error) throw error;
      
      const uniqueGenders = [
        ...new Set(
          data
            ?.map((s) => s.gender?.trim())
            .filter((g) => g && g !== '' && !['boys', 'girls'].includes(g.toLowerCase())) || []
        ),
      ];
      
      return uniqueGenders;
    },
  });

  const schoolGenders = ['Boys', 'Girls', ...additionalSchoolGenders];

  /**
   * Fetch school levels
   */
  const { data: additionalSchoolLevels = [] } = useQuery({
    queryKey: ['schoolLevels', customSearchTerms.schoolLevel],
    queryFn: async () => {
      if (!customSearchTerms.schoolLevel) return [];
      
      const predefinedLevels = ['nursery', 'kindergarten', 'elementary', 'middle', 'high'];
      
      const { data, error } = await supabase
        .from('schools')
        .select('primary_level')
        .not('primary_level', 'is', null)
        .not('primary_level', 'eq', '')
        .ilike('primary_level', `%${customSearchTerms.schoolLevel}%`);
      
      if (error) throw error;
      
      const uniqueLevels = [
        ...new Set(
          data
            ?.map((s) => s.primary_level?.trim())
            .filter((l) => l && l !== '' && !predefinedLevels.includes(l.toLowerCase())) || []
        ),
      ];
      
      return uniqueLevels;
    },
  });

  const schoolLevels = ['nursery', 'kindergarten', 'elementary', 'middle', 'high', ...additionalSchoolLevels];

  /**
   * Fetch universities
   */
  const {
    data: allUniversities = [],
    isLoading: isLoadingUniversities,
  } = useQuery({
    queryKey: ['universities', customSearchTerms.university],
    queryFn: async () => {
      let query = supabase
        .from('universities')
        .select('*')
        .not('lat', 'is', null)
        .not('lon', 'is', null)
        .not('name_ar', 'is', null)
        .not('name_en', 'is', null);
      
      if (customSearchTerms.university) {
        query = query.or(
          `name_ar.ilike.%${customSearchTerms.university}%,name_en.ilike.%${customSearchTerms.university}%`
        );
      }
      
      const { data, error } = await query.order('name_ar', { ascending: true });
      if (error) throw error;
      
      return (data || []) as University[];
    },
  });

  /**
   * Fetch mosques
   */
  const {
    data: allMosques = [],
    isLoading: isLoadingMosques,
  } = useQuery({
    queryKey: ['mosques'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mosques')
        .select('*')
        .not('lat', 'is', null)
        .not('lon', 'is', null)
        .not('name', 'is', null);
      
      if (error) {
        console.error('Error fetching mosques:', error);
        throw error;
      }
      
      return (data || []) as unknown as Mosque[];
    },
  });

  return {
    properties,
    allSchools,
    allUniversities,
    allMosques,
    propertyTypes,
    neighborhoods,
    schoolGenders,
    schoolLevels,
    isLoadingProperties,
    isLoadingSchools,
    isLoadingUniversities,
    isLoadingMosques,
  };
}
