/**
 * Search Container Component
 * 
 * Main container that orchestrates property search, filtering, and map display.
 * Handles property filtering pipeline and geo-based filtering.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PropertyDetailsDialog } from "@/components/PropertyDetailsDialog";
import { useFavorites } from "@/hooks/useFavorites";
import { useRealEstateAssistant } from "@/hooks/useRealEstateAssistant";
import { PropertyMap } from "@/components/realestate/PropertyMap";
import { FilterSheet } from "@/components/realestate/FilterSheet";
import { ChatbotPanel } from "@/components/realestate/ChatbotPanel";
import { FavoritesSheet } from "@/components/realestate/FavoritesSheet";
import { TopSearchBar } from "@/components/realestate/TopSearchBar";
import { ResultsCounter } from "@/components/realestate/ResultsCounter";
import { ClearChatbotButton } from "@/components/realestate/ClearChatbotButton";
import { useChatbotSearch } from "@/hooks/useChatbotSearch";
import { useFavoritesLogic } from "@/hooks/useFavoritesLogic";
import {
  usePropertiesCenter,
  useFilteredProperties,
  useNearbySchools,
  useNearbyUniversities,
  useNearbyMosques,
  usePropertiesNearSchools,
  usePropertiesNearUniversities,
  usePropertiesNearMosques,
} from "@/hooks/useGeoFiltering";
import { usePropertyData } from "@/hooks/usePropertyData";
import { useFilterState } from "@/hooks/useFilterState";

interface SearchContainerProps {
  transactionType: "rent" | "sale";
  onTransactionTypeChange: (type: "rent" | "sale") => void;
}

export const SearchContainer = ({
  transactionType,
  onTransactionTypeChange,
}: SearchContainerProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [visitedProperties, setVisitedProperties] = useState<Set<string>>(new Set());

  // Hooks
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { filters, setFilters, customSearchTerms, setCustomSearchTerms, resetFilters } = useFilterState();
  
  const {
    messages,
    isLoading: isChatLoading,
    isBackendOnline,
    currentCriteria,
    searchResults: chatSearchResults,
    sendMessage,
    selectSearchMode,
    clearChat,
  } = useRealEstateAssistant();

  // Chatbot search integration
  const {
    chatbotProperties,
    showChatbotResults,
    nearbyUniversitiesFromBackend,
    nearbyMosquesFromBackend,
    extractFiltersFromCriteria,
    clearChatbotResults,
  } = useChatbotSearch(chatSearchResults, currentCriteria);

  // Data fetching
  const {
    allPropertyTypes,
    neighborhoods,
    rawProperties,
    allSchoolGenders,
    allSchoolLevels,
    allSchools,
    allUniversities,
    allMosques,
    isLoadingProperties,
  } = usePropertyData({
    transactionType,
    filters,
    searchQuery,
    customSearchTerms,
  });

  // Apply price, area, and metro filters (ensure arrays are never undefined)
  const properties = useFilteredProperties(rawProperties || [], {
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    areaMin: filters.areaMin,
    areaMax: filters.areaMax,
    nearMetro: filters.nearMetro,
    minMetroTime: filters.minMetroTime,
  });

  // Base properties (chatbot or filtered) - ensure always an array
  const baseProperties = showChatbotResults ? chatbotProperties : properties;

  // Calculate properties center location
  const propertiesCenterLocation = usePropertiesCenter(baseProperties);

  // Calculate nearby schools - ensure arrays are never undefined
  const schoolFilterActive = !!(filters.schoolGender || filters.schoolLevel || currentCriteria?.school_requirements?.required);
  const nearbySchools = useNearbySchools(
    allSchools || [],
    propertiesCenterLocation,
    filters.maxSchoolTime,
    hasSearched,
    schoolFilterActive
  );

  // Calculate nearby universities - ensure arrays are never undefined
  const universityFilterActive = !!(
    filters.selectedUniversity ||
    filters.maxUniversityTime < 30 ||
    currentCriteria?.university_requirements
  );
  const nearbyUniversities = useNearbyUniversities(
    allUniversities || [],
    propertiesCenterLocation,
    filters.selectedUniversity,
    filters.maxUniversityTime,
    hasSearched,
    universityFilterActive
  );

  // Calculate nearby mosques - ensure arrays are never undefined
  const nearbyMosques = useNearbyMosques(
    allMosques || [],
    propertiesCenterLocation,
    filters.maxMosqueTime,
    hasSearched,
    filters.nearMosques
  );

  // Apply geographic filters
  let displayedProperties = baseProperties;

  if (hasSearched && schoolFilterActive && nearbySchools.length > 0) {
    displayedProperties = usePropertiesNearSchools(displayedProperties, nearbySchools, filters.maxSchoolTime);
  }

  if (universityFilterActive && nearbyUniversities.length > 0) {
    displayedProperties = usePropertiesNearUniversities(displayedProperties, nearbyUniversities, filters.maxUniversityTime);
  }

  if (filters.nearMosques && nearbyMosques.length > 0) {
    displayedProperties = usePropertiesNearMosques(displayedProperties, nearbyMosques, filters.maxMosqueTime);
  }

  // Favorites logic - ensure arrays are never undefined
  const { displayedFavorites, favoritesCount, handleToggleFavorite, isPropertyFavorited } = useFavoritesLogic({
    properties: displayedProperties || [],
    favorites: favorites || [],
    isFavorite,
    toggleFavorite,
    t,
  });

  // Effects
  useEffect(() => {
    if (searchQuery.trim() !== "") {
      setHasSearched(true);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (chatSearchResults.length > 0) {
      setHasSearched(true);
      const filterUpdates = extractFiltersFromCriteria(currentCriteria);
      
      if (Object.keys(filterUpdates).length > 0) {
        setFilters((prev) => ({ ...prev, ...filterUpdates }));
      }

      if (filterUpdates.selectedUniversity) {
        setCustomSearchTerms((prev) => ({
          ...prev,
          university: filterUpdates.selectedUniversity || "",
        }));
      }
    }
  }, [chatSearchResults, currentCriteria, extractFiltersFromCriteria]);

  // Handlers
  const handleSearchModeSelection = async (mode: "exact" | "similar") => {
    await selectSearchMode(mode);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
  };

  const handlePropertyClick = (property: any) => {
    setSelectedProperty(property);
    setShowPropertyDialog(true);
    setVisitedProperties((prev) => new Set(prev).add(property.id));
  };

  const handleBack = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/", { replace: true });
      toast({ title: t("loggedOut") || "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/", { replace: true });
    }
  };

  return (
    <>
      <div className="absolute inset-0">
        <PropertyMap
          properties={displayedProperties}
          transactionType={transactionType}
          visitedProperties={visitedProperties}
          favorites={favorites}
          hasSearched={hasSearched}
          nearbySchools={nearbySchools}
          nearbyUniversities={nearbyUniversities}
          nearbyMosquesFromBackend={nearbyMosquesFromBackend}
          nearbyMosques={nearbyMosques}
          defaultCenter={{ lat: 24.7136, lng: 46.6753 }}
          defaultZoom={12}
          language={i18n.language}
          onPropertyClick={handlePropertyClick}
          t={t}
        />
      </div>

      {/* Top Search Bar */}
      <TopSearchBar
        transactionType={transactionType}
        searchQuery={searchQuery}
        favoritesCount={favoritesCount}
        language={i18n.language}
        onTransactionTypeChange={onTransactionTypeChange}
        onSearchQueryChange={setSearchQuery}
        onSearchExecute={() => setHasSearched(true)}
        onToggleLanguage={toggleLanguage}
        onToggleFavorites={() => setShowFavorites(true)}
        onProfileClick={() => navigate("/profile")}
        onBack={handleBack}
        filterButton={
          <FilterSheet
            isOpen={showFilters}
            onOpenChange={setShowFilters}
            filters={filters}
            setFilters={setFilters}
            customSearchTerms={customSearchTerms}
            setCustomSearchTerms={setCustomSearchTerms}
            allPropertyTypes={allPropertyTypes}
            neighborhoods={neighborhoods}
            allSchoolGenders={allSchoolGenders}
            allSchoolLevels={allSchoolLevels}
            allUniversities={allUniversities}
            nearbySchools={nearbySchools}
            nearbyUniversities={nearbyUniversities}
            resetFilters={resetFilters}
            onApply={() => {
              setShowFilters(false);
              setHasSearched(true);
            }}
            t={t}
            language={i18n.language}
          />
        }
        t={t}
        isRTL={i18n.language === "ar"}
      />

      {/* Property Details Dialog */}
      <PropertyDetailsDialog
        property={selectedProperty}
        isOpen={showPropertyDialog}
        onClose={() => {
          setShowPropertyDialog(false);
          setSelectedProperty(null);
        }}
        isFavorite={selectedProperty ? isPropertyFavorited(selectedProperty.id) : false}
        onToggleFavorite={() => selectedProperty && handleToggleFavorite(selectedProperty.id)}
        selectedSchool={null}
        selectedUniversity={null}
      />

      {/* Favorites Sheet */}
      <FavoritesSheet
        isOpen={showFavorites}
        onOpenChange={setShowFavorites}
        displayedFavorites={displayedFavorites}
        onPropertyClick={(property) => {
          setSelectedProperty(property);
          setShowPropertyDialog(true);
        }}
        onToggleFavorite={handleToggleFavorite}
        t={t}
        language={i18n.language}
      />

      {/* Clear Chatbot Results Button */}
      <ClearChatbotButton
        isVisible={showChatbotResults}
        language={i18n.language}
        onClear={() => {
          clearChatbotResults();
          setFilters((prev) => ({
            ...prev,
            schoolGender: "",
            schoolLevel: "",
            maxSchoolTime: 15,
          }));
        }}
      />

      {/* Results Counter */}
      <ResultsCounter
        isLoading={isLoadingProperties}
        propertiesCount={displayedProperties.length}
        hasSearched={hasSearched}
        selectedProperty={selectedProperty}
        t={t}
      />

      {/* Chatbot Panel */}
      <ChatbotPanel
        isOpen={isChatOpen}
        onOpenChange={setIsChatOpen}
        messages={messages}
        isLoading={isChatLoading}
        isBackendOnline={isBackendOnline}
        onSendMessage={sendMessage}
        onClearChat={() => {
          clearChat();
          clearChatbotResults();
        }}
        onSearchModeSelect={handleSearchModeSelection}
      />
    </>
  );
};
