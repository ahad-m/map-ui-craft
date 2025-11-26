/**
 * Chatbot Search Hook
 * 
 * Manages chatbot search results synchronization with filters.
 * Extracts and applies criteria from chatbot responses to property filters.
 */

import { useEffect, useState, useCallback } from "react";

interface SchoolRequirements {
  required: boolean;
  gender?: string;
  levels?: string[];
  max_distance_minutes?: number;
}

interface UniversityRequirements {
  required: boolean;
  university_name?: string;
  max_distance_minutes?: number;
}

interface SearchCriteria {
  school_requirements?: SchoolRequirements;
  university_requirements?: UniversityRequirements;
}

interface Filters {
  schoolGender: string;
  schoolLevel: string;
  maxSchoolTime: number;
  selectedUniversity: string;
  maxUniversityTime: number;
}

export const useChatbotSearch = (
  chatSearchResults: any[],
  currentCriteria: SearchCriteria | null
) => {
  const [chatbotProperties, setChatbotProperties] = useState<any[]>([]);
  const [showChatbotResults, setShowChatbotResults] = useState(false);

  /**
   * Extract nearby entities from chatbot results
   */
  const nearbyUniversitiesFromBackend = chatSearchResults.length > 0 && chatSearchResults[0].nearby_universities
    ? chatSearchResults[0].nearby_universities
    : [];

  const nearbyMosquesFromBackend = chatSearchResults.length > 0 && chatSearchResults[0].nearby_mosques
    ? chatSearchResults[0].nearby_mosques
    : [];

  /**
   * Extract filter updates from chatbot criteria
   */
  const extractFiltersFromCriteria = useCallback((criteria: SearchCriteria | null): Partial<Filters> => {
    if (!criteria) return {};

    const updates: Partial<Filters> = {};

    // Extract school requirements
    if (criteria.school_requirements?.required) {
      const schoolReqs = criteria.school_requirements;
      
      // Gender filter
      if (schoolReqs.gender === "بنات") updates.schoolGender = "Girls";
      else if (schoolReqs.gender === "بنين") updates.schoolGender = "Boys";
      
      // Level filter
      if (schoolReqs.levels && schoolReqs.levels.length > 0) {
        const firstLevel = schoolReqs.levels[0];
        if (firstLevel.includes("ابتدائي")) updates.schoolLevel = "elementary";
        else if (firstLevel.includes("متوسط")) updates.schoolLevel = "middle";
        else if (firstLevel.includes("ثانوي")) updates.schoolLevel = "high";
        else if (firstLevel.includes("روضة")) updates.schoolLevel = "kindergarten";
        else if (firstLevel.includes("حضانة")) updates.schoolLevel = "nursery";
        else updates.schoolLevel = firstLevel;
      }
      
      // Time filter
      if (schoolReqs.max_distance_minutes) {
        updates.maxSchoolTime = schoolReqs.max_distance_minutes;
      }
    }

    // Extract university requirements
    if (criteria.university_requirements?.required) {
      const uniReqs = criteria.university_requirements;
      
      if (uniReqs.university_name) {
        updates.selectedUniversity = uniReqs.university_name;
      }
      
      if (uniReqs.max_distance_minutes) {
        updates.maxUniversityTime = uniReqs.max_distance_minutes;
      }
    }

    return updates;
  }, []);

  /**
   * Sync chatbot results with local state
   */
  useEffect(() => {
    if (chatSearchResults.length > 0) {
      console.log("🎯 Chatbot Properties:", chatSearchResults);
      setChatbotProperties(chatSearchResults);
      setShowChatbotResults(true);
    }
  }, [chatSearchResults]);

  /**
   * Clear chatbot results
   */
  const clearChatbotResults = useCallback(() => {
    setShowChatbotResults(false);
    setChatbotProperties([]);
  }, []);

  return {
    chatbotProperties,
    showChatbotResults,
    nearbyUniversitiesFromBackend,
    nearbyMosquesFromBackend,
    extractFiltersFromCriteria,
    clearChatbotResults,
  };
};
