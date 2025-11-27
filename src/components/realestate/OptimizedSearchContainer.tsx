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
import { ClusteredPropertyMap } from "@/components/realestate/ClusteredPropertyMap";
import { FilterSheet } from "@/components/realestate/FilterSheet";
import { OptimizedChatbotPanel } from "@/components/realestate/OptimizedChatbotPanel";
import { FavoritesSheet } from "@/components/realestate/FavoritesSheet";
import { TopSearchBar } from "@/components/realestate/TopSearchBar";
import { ResultsCounter } from "@/components/realestate/ResultsCounter";
import { ClearChatbotButton } from "@/components/realestate/ClearChatbotButton";
import { useChatbotSearch } from "@/hooks/useChatbotSearch";
import { useOptimizedFavoritesLogic } from "@/hooks/useOptimizedFavoritesLogic";
import { useViewportProperties } from "@/hooks/useViewportProperties";
import { useFilterState } from "@/hooks/useFilterState";
import { useFilterData } from "@/hooks/useFilterData";

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
  const [viewport, setViewport] = useState<{ north: number; south: number; east: number; west: number } | null>(null);

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

  // Viewport-based property loading (optimized for fast initial load)
  const {
    properties: viewportProperties,
    isLoading: isLoadingViewport,
    isMapReady,
    handleMapReady,
  } = useViewportProperties({
    transactionType,
    viewport,
    filters: {
      propertyType: filters.propertyType,
      neighborhood: filters.neighborhood,
    },
  });

  // For filters data (lightweight queries)
  const {
    allPropertyTypes,
    neighborhoods,
    allSchoolGenders,
    allSchoolLevels,
    allSchools,
    allUniversities,
    allMosques,
  } = useFilterData({
    customSearchTerms,
    filters: {
      schoolGender: filters.schoolGender,
      schoolLevel: filters.schoolLevel,
    },
  });

  // Base properties (viewport-based or chatbot results)
  const baseProperties = useMemo(
    () => (showChatbotResults ? chatbotProperties : viewportProperties),
    [showChatbotResults, chatbotProperties, viewportProperties]
  );

  // Displayed properties (viewport-based for fast loading)
  const displayedProperties = baseProperties;

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

  const handleViewportChange = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
    setViewport(bounds);
  }, []);

  return (
    <>
      <div className="absolute inset-0">
        <ClusteredPropertyMap
          properties={displayedProperties}
          isLoading={isLoadingViewport}
          onViewportChange={handleViewportChange}
          onPropertyClick={handlePropertyClick}
          onMapReady={handleMapReady}
          visitedProperties={visitedProperties}
          favorites={favorites}
          defaultCenter={{ lat: 24.7136, lng: 46.6753 }}
          defaultZoom={12}
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
            nearbySchools={[]}
            nearbyUniversities={[]}
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
        isLoading={isLoadingViewport}
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
