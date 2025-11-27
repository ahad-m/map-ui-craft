/**
 * Optimized Search Container Component
 * 
 * High-performance search container with memoization and optimized rendering
 */

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PropertyDetailsDialog } from "@/components/PropertyDetailsDialog";
import { useFavorites } from "@/hooks/useFavorites";
import { useRealEstateAssistant } from "@/hooks/useRealEstateAssistant";
import { PropertyMap } from "@/components/realestate/PropertyMap";
import { FilterSheet } from "@/components/realestate/FilterSheet";
import { OptimizedChatbotPanel } from "@/components/realestate/OptimizedChatbotPanel";
import { FavoritesSheet } from "@/components/realestate/FavoritesSheet";
import { TopSearchBar } from "@/components/realestate/TopSearchBar";
import { ResultsCounter } from "@/components/realestate/ResultsCounter";
import { ClearChatbotButton } from "@/components/realestate/ClearChatbotButton";
import { useChatbotSearch } from "@/hooks/useChatbotSearch";
import { useOptimizedFavoritesLogic } from "@/hooks/useOptimizedFavoritesLogic";
import {
  usePropertiesCenter,
  useFilteredProperties,
  useNearbySchools,
  useNearbyUniversities,
  useNearbyMosques,
  usePropertiesNearSchools,
  usePropertiesNearUniversities,
  usePropertiesNearMosques,
} from "@/hooks/useOptimizedGeoFiltering";
import { useOptimizedPropertyData } from "@/hooks/useOptimizedPropertyData";
import { useFilterState } from "@/hooks/useFilterState";

interface OptimizedSearchContainerProps {
  transactionType: "rent" | "sale";
  onTransactionTypeChange: (type: "rent" | "sale") => void;
}

export const OptimizedSearchContainer = memo(({
  transactionType,
  onTransactionTypeChange,
}: OptimizedSearchContainerProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [visitedProperties, setVisitedProperties] = useState<Set<string>>(new Set());
  const [mapLoaded, setMapLoaded] = useState(false);

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

  // Optimized data fetching with caching (deferred until map loads)
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
  } = useOptimizedPropertyData({
    transactionType,
    filters,
    searchQuery,
    customSearchTerms,
    enabled: mapLoaded,
  });

  // Memoized filtered properties
  const properties = useFilteredProperties(rawProperties, {
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    areaMin: filters.areaMin,
    areaMax: filters.areaMax,
    nearMetro: filters.nearMetro,
    minMetroTime: filters.minMetroTime,
  });

  // Base properties (chatbot or filtered)
  const baseProperties = useMemo(
    () => (showChatbotResults ? chatbotProperties : properties),
    [showChatbotResults, chatbotProperties, properties]
  );

  // Calculate properties center
  const propertiesCenterLocation = usePropertiesCenter(baseProperties);

  // Calculate nearby schools
  const schoolFilterActive = useMemo(
    () => !!(filters.schoolGender || filters.schoolLevel || currentCriteria?.school_requirements?.required),
    [filters.schoolGender, filters.schoolLevel, currentCriteria]
  );
  
  const nearbySchools = useNearbySchools(
    allSchools,
    propertiesCenterLocation,
    filters.maxSchoolTime,
    hasSearched,
    schoolFilterActive
  );

  // Calculate nearby universities
  const universityFilterActive = useMemo(
    () => !!(
      filters.selectedUniversity ||
      filters.maxUniversityTime < 30 ||
      currentCriteria?.university_requirements
    ),
    [filters.selectedUniversity, filters.maxUniversityTime, currentCriteria]
  );
  
  const nearbyUniversities = useNearbyUniversities(
    allUniversities,
    propertiesCenterLocation,
    filters.selectedUniversity,
    filters.maxUniversityTime,
    hasSearched,
    universityFilterActive
  );

  // Calculate nearby mosques
  const nearbyMosques = useNearbyMosques(
    allMosques,
    propertiesCenterLocation,
    filters.maxMosqueTime,
    hasSearched,
    filters.nearMosques
  );

  // Apply geographic filters with memoization
  const displayedProperties = useMemo(() => {
    let result = baseProperties;

    if (hasSearched && schoolFilterActive && nearbySchools.length > 0) {
      result = usePropertiesNearSchools(result, nearbySchools, filters.maxSchoolTime);
    }

    if (universityFilterActive && nearbyUniversities.length > 0) {
      result = usePropertiesNearUniversities(result, nearbyUniversities, filters.maxUniversityTime);
    }

    if (filters.nearMosques && nearbyMosques.length > 0) {
      result = usePropertiesNearMosques(result, nearbyMosques, filters.maxMosqueTime);
    }

    return result;
  }, [
    baseProperties,
    hasSearched,
    schoolFilterActive,
    nearbySchools,
    filters.maxSchoolTime,
    universityFilterActive,
    nearbyUniversities,
    filters.maxUniversityTime,
    filters.nearMosques,
    nearbyMosques,
    filters.maxMosqueTime,
  ]);

  // Optimized favorites logic
  const { displayedFavorites, favoritesCount, handleToggleFavorite, isPropertyFavorited } = useOptimizedFavoritesLogic({
    properties: displayedProperties,
    favorites,
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

  // Memoized handlers
  const handleSearchModeSelection = useCallback(
    async (mode: "exact" | "similar") => {
      await selectSearchMode(mode);
    },
    [selectSearchMode]
  );

  const toggleLanguage = useCallback(() => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
  }, [i18n]);

  const handlePropertyClick = useCallback((property: any) => {
    setSelectedProperty(property);
    setShowPropertyDialog(true);
    setVisitedProperties((prev) => new Set(prev).add(property.id));
  }, []);

  const handleBack = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      navigate("/", { replace: true });
      toast({ title: t("loggedOut") || "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/", { replace: true });
    }
  }, [navigate, t]);

  const handleFiltersApply = useCallback(() => {
    setShowFilters(false);
    setHasSearched(true);
  }, []);

  const handleClearChatbot = useCallback(() => {
    clearChatbotResults();
    setFilters((prev) => ({
      ...prev,
      schoolGender: "",
      schoolLevel: "",
      maxSchoolTime: 15,
    }));
  }, [clearChatbotResults, setFilters]);

  const handleClearChat = useCallback(() => {
    clearChat();
    clearChatbotResults();
  }, [clearChat, clearChatbotResults]);

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
          onMapLoad={() => setMapLoaded(true)}
          t={t}
        />
        
        {/* Loading overlay until map and pins are ready */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-lg font-medium text-foreground">{t("loadingMap") || "Loading map..."}</p>
            </div>
          </div>
        )}
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
            onApply={handleFiltersApply}
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
        onClear={handleClearChatbot}
      />

      {/* Results Counter */}
      <ResultsCounter
        isLoading={isLoadingProperties}
        propertiesCount={displayedProperties.length}
        hasSearched={hasSearched}
        selectedProperty={selectedProperty}
        t={t}
      />

      {/* Optimized Chatbot Panel */}
      <OptimizedChatbotPanel
        isOpen={isChatOpen}
        onOpenChange={setIsChatOpen}
        messages={messages}
        isLoading={isChatLoading}
        isBackendOnline={isBackendOnline}
        onSendMessage={sendMessage}
        onClearChat={handleClearChat}
        onSearchModeSelect={handleSearchModeSelection}
      />
    </>
  );
});

OptimizedSearchContainer.displayName = "OptimizedSearchContainer";
