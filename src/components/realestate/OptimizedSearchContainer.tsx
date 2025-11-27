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
  filterPropertiesNearSchools,
  filterPropertiesNearUniversities,
  filterPropertiesNearMosques,
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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

  // Optimized data fetching with aggressive caching - start immediately
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
    enabled: true, // Always enabled for instant loading
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

  // Log filtering pipeline for debugging
  useEffect(() => {
    console.log(`🔍 Property filtering pipeline:
      - Raw from DB: ${rawProperties.length}
      - After price/area filters: ${properties.length}
      - Transaction type: ${transactionType}`);
  }, [rawProperties.length, properties.length, transactionType]);

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
      result = filterPropertiesNearSchools(result, nearbySchools, filters.maxSchoolTime);
    }

    if (universityFilterActive && nearbyUniversities.length > 0) {
      result = filterPropertiesNearUniversities(result, nearbyUniversities, filters.maxUniversityTime);
    }

    if (filters.nearMosques && nearbyMosques.length > 0) {
      result = filterPropertiesNearMosques(result, nearbyMosques, filters.maxMosqueTime);
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

  // Filter properties with valid coordinates only (for accurate count and map display)
  const validDisplayedProperties = useMemo(() => {
    const valid = displayedProperties.filter((property) => {
      const lat = Number(property.lat);
      const lon = Number(property.lon);
      return !isNaN(lat) && !isNaN(lon) && !(lat === 0 && lon === 0);
    });
    
    // Comprehensive logging for debugging
    if (valid.length !== displayedProperties.length) {
      console.warn(`⚠️ Property count mismatch: ${displayedProperties.length} total, ${valid.length} valid coordinates, ${displayedProperties.length - valid.length} invalid`);
    }
    
    // Log final synchronized count
    console.log(`✓ Final synchronized count: ${valid.length} properties
      - Base properties: ${baseProperties.length}
      - After geo filters: ${displayedProperties.length}
      - Valid coordinates: ${valid.length}
      - Map pins will show: ${valid.length}`);
    
    return valid;
  }, [displayedProperties, baseProperties.length]);

  // Optimized favorites logic (use validDisplayedProperties for accurate counts)
  const { displayedFavorites, favoritesCount, handleToggleFavorite, isPropertyFavorited } = useOptimizedFavoritesLogic({
    properties: validDisplayedProperties,
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

  // Mark initial load as complete once we have properties
  useEffect(() => {
    if (rawProperties.length > 0 && isInitialLoad) {
      setIsInitialLoad(false);
      console.log(`⚡ Initial load complete: ${rawProperties.length} properties loaded`);
    }
  }, [rawProperties.length, isInitialLoad]);

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
          properties={validDisplayedProperties}
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
        
        {/* Simple loading indicator for pins only */}
        {isLoadingProperties && validDisplayedProperties.length === 0 && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-background/95 backdrop-blur-md rounded-full px-6 py-3 shadow-lg border border-primary/20 flex items-center gap-3 animate-slide-down">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm font-medium text-foreground">{t("loadingProperties") || "Loading properties..."}</p>
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
        propertiesCount={validDisplayedProperties.length}
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
