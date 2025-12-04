/**
 * RealEstateSearch Page Component (Updated)
 * 
 * Now includes HighlightedPropertyProvider for Best Value feature.
 * 
 * This is the main orchestrator component that:
 * - Coordinates all child components
 * - Manages high-level state
 * - Handles cross-component communication
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Acts only as orchestrator, delegates to specialized components
 * - Open/Closed: Easy to extend with new features by adding new components
 * - Dependency Inversion: Depends on abstractions (hooks, component interfaces)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useFavorites } from '@/hooks/useFavorites';
import { PropertyDetailsDialog } from '@/components/PropertyDetailsDialog';

// Feature imports
import {
  usePropertyFilters,
  usePropertyQueries,
  useProximityCalculations,
  useMapControls,
  useChatAssistant,
} from '@/features/real-estate/hooks';

import {
  SearchHeader,
  FiltersSheet,
  FavoritesSheet,
  ResultsCounter,
  ClearChatbotResultsButton,
  PropertyMap,
  ChatPanel,
  ChatFloatingButton,
} from '@/features/real-estate/components';

// ✅ New: Import ClearHighlightedPropertyButton
import { ClearHighlightedPropertyButton } from '@/features/real-estate/components/ClearHighlightedPropertyButton';

// ✅ New: Import HighlightedPropertyProvider
import { HighlightedPropertyProvider } from '@/features/real-estate/context/HighlightedPropertyContext';

import type {
  Property,
  TransactionType,
  NearbyUniversity,
  NearbyMosque,
  NearbySchool,
} from '@/features/real-estate/types';

const RealEstateSearchContent = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  // ============================================
  // Authentication State
  // ============================================
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      await supabase.auth.getSession();
      setAuthChecked(true);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Auth state change handled
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // ============================================
  // Transaction Type State
  // ============================================
  const [transactionType, setTransactionType] = useState<TransactionType>('sale');

  // ============================================
  // UI State
  // ============================================
  const [showFilters, setShowFilters] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [visitedProperties, setVisitedProperties] = useState<Set<string>>(new Set());

  // ============================================
  // Chatbot Results State
  // ============================================
  const [chatbotProperties, setChatbotProperties] = useState<Property[]>([]);
  const [showChatbotResults, setShowChatbotResults] = useState(false);

  // ============================================
  // Hooks
  // ============================================
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const {
    filters,
    appliedFilters,
    customSearchTerms,
    searchQuery,
    hasSearched,
    setFilters,
    setCustomSearchTerms,
    setSearchQuery,
    applyFilters,
    resetFilters,
    triggerSearch,
    syncFromChatbot,
  } = usePropertyFilters();

  const {
    properties,
    allSchools,
    allUniversities,
    allMosques,
    propertyTypes,
    neighborhoods,
    schoolGenders,
    schoolLevels,
    isLoadingProperties,
  } = usePropertyQueries({
    transactionType,
    appliedFilters,
    appliedSearchQuery: searchQuery,
    customSearchTerms,
  });

  // Base properties: chatbot results or regular query results
  const baseProperties = showChatbotResults ? chatbotProperties : properties;

  const {
    nearbySchools,
    nearbyUniversities,
    nearbyMosques,
    displayedProperties,
  } = useProximityCalculations({
    properties: baseProperties,
    schools: allSchools,
    universities: allUniversities,
    mosques: allMosques,
    appliedFilters,
    hasSearched,
    currentCriteria: undefined,
  });

  const { mapRef, mapCenter, mapZoom } = useMapControls({
    displayedProperties,
    hasSearched,
    showChatbotResults,
    chatbotProperties,
  });

  // ============================================
  // Chat Assistant
  // ============================================
  const handleChatResultsReceived = useCallback((results: Property[]) => {
    setChatbotProperties(results);
    setShowChatbotResults(true);
    triggerSearch();
  }, [triggerSearch]);

  const handleFiltersSync = useCallback((criteria: any) => {
    syncFromChatbot(criteria);
  }, [syncFromChatbot]);

  const {
    isChatOpen,
    chatInput,
    isListening,
    messages,
    isLoading: isChatLoading,
    isBackendOnline,
    currentCriteria,
    setIsChatOpen,
    setChatInput,
    handleSendMessage,
    handleSearchModeSelection,
    handleVoiceInput,
    clearChat,
    messagesEndRef,
  } = useChatAssistant({
    onResultsReceived: handleChatResultsReceived,
    onFiltersSync: handleFiltersSync,
  });

  // ============================================
  // Extract Backend Entities
  // ============================================
  const nearbyUniversitiesFromBackend = useMemo((): NearbyUniversity[] => {
    if (chatbotProperties.length > 0 && chatbotProperties[0].nearby_universities) {
      return chatbotProperties[0].nearby_universities;
    }
    return [];
  }, [chatbotProperties]);

  const nearbyMosquesFromBackend = useMemo((): NearbyMosque[] => {
    if (chatbotProperties.length > 0 && chatbotProperties[0].nearby_mosques) {
      return chatbotProperties[0].nearby_mosques;
    }
    return [];
  }, [chatbotProperties]);

  const nearbySchoolsFromBackend = useMemo((): NearbySchool[] => {
    if (chatbotProperties.length === 0) return [];
    
    const schoolsMap = new Map<string, NearbySchool>();
    
    chatbotProperties.forEach(property => {
      if (property.nearby_schools && Array.isArray(property.nearby_schools)) {
        property.nearby_schools.forEach(school => {
          const key = `${school.name}-${school.lat}-${school.lon}`;
          if (!schoolsMap.has(key)) {
            schoolsMap.set(key, school);
          }
        });
      }
    });
    
    return Array.from(schoolsMap.values());
  }, [chatbotProperties]);

  // ============================================
  // Favorites in displayed properties
  // ============================================
  const displayedFavorites = useMemo(
    () => displayedProperties.filter((p) => favorites.includes(p.id)),
    [displayedProperties, favorites]
  );

  // ============================================
  // Event Handlers
  // ============================================
  const handlePropertyClick = useCallback((property: Property) => {
    setSelectedProperty(property);
    setShowPropertyDialog(true);
    setVisitedProperties((prev) => new Set(prev).add(property.id));
  }, []);

  const handleToggleFavorite = useCallback((propertyId: string) => {
    toggleFavorite(propertyId);
    if (isFavorite(propertyId)) {
      toast({ title: 'تمت إزالته من المفضلة' });
    } else {
      toast({ title: 'تمت إضافته للمفضلة' });
    }
  }, [toggleFavorite, isFavorite]);

  const handleClearChatbotResults = useCallback(() => {
    setShowChatbotResults(false);
    setChatbotProperties([]);
    setFilters((prev) => ({
      ...prev,
      schoolGender: '',
      schoolLevel: '',
      maxSchoolTime: 15,
    }));
  }, [setFilters]);

  const handleApplyFilters = useCallback(() => {
    applyFilters();
    setShowFilters(false);
  }, [applyFilters]);

  // ============================================
  // Language Direction Effect
  // ============================================
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // ============================================
  // Loading State
  // ============================================
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ============================================
  // Render
  // ============================================
  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-light/20 via-background to-accent-light/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_hsl(142_76%_48%/0.08)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_hsl(142_76%_48%/0.05)_0%,_transparent_50%)]" />

      {/* Map */}
      <PropertyMap
        properties={displayedProperties}
        schools={nearbySchools}
        universities={nearbyUniversities}
        mosques={nearbyMosques}
        backendUniversities={nearbyUniversitiesFromBackend}
        backendMosques={nearbyMosquesFromBackend}
        backendSchools={nearbySchoolsFromBackend}
        visitedProperties={visitedProperties}
        favoriteIds={favorites}
        transactionType={transactionType}
        hasSearched={hasSearched}
        onPropertyClick={handlePropertyClick}
        mapRef={mapRef}
        mapCenter={mapCenter}
        mapZoom={mapZoom}
      />

      {/* Search Header */}
      <SearchHeader
        transactionType={transactionType}
        onTransactionTypeChange={setTransactionType}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={triggerSearch}
        onToggleFilters={() => setShowFilters(true)}
        onToggleFavorites={() => setShowFavorites(true)}
        favoritesCount={favorites.length}
      />

      {/* Filters Sheet */}
      <FiltersSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        customSearchTerms={customSearchTerms}
        onCustomSearchTermsChange={setCustomSearchTerms}
        onApply={handleApplyFilters}
        onReset={resetFilters}
        propertyTypes={propertyTypes}
        neighborhoods={neighborhoods}
        schoolGenders={schoolGenders}
        schoolLevels={schoolLevels}
        universities={allUniversities}
        nearbySchoolsCount={nearbySchools.length}
        nearbyUniversitiesCount={nearbyUniversities.length}
      />

      {/* Property Details Dialog */}
      <PropertyDetailsDialog
        property={selectedProperty}
        isOpen={showPropertyDialog}
        onClose={() => {
          setShowPropertyDialog(false);
          setSelectedProperty(null);
        }}
        isFavorite={selectedProperty ? isFavorite(selectedProperty.id) : false}
        onToggleFavorite={() => selectedProperty && handleToggleFavorite(selectedProperty.id)}
        selectedSchool={null}
        selectedUniversity={null}
      />

      {/* Favorites Sheet */}
      <FavoritesSheet
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
        properties={displayedFavorites}
        onPropertySelect={(property) => {
          setSelectedProperty(property);
          setShowPropertyDialog(true);
        }}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Clear Chatbot Results Button */}
      <ClearChatbotResultsButton
        isVisible={showChatbotResults}
        onClear={handleClearChatbotResults}
      />

      {/* ✅ New: Clear Highlighted Property Button */}
      <ClearHighlightedPropertyButton />

      {/* Results Counter */}
      <ResultsCounter
        count={displayedProperties.length}
        isLoading={isLoadingProperties}
        isVisible={!selectedProperty && hasSearched}
      />

      {/* Chat Floating Button */}
      <ChatFloatingButton
        onClick={() => setIsChatOpen(!isChatOpen)}
        isBackendOnline={isBackendOnline}
      />

      {/* Chat Panel */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        isLoading={isChatLoading}
        isBackendOnline={isBackendOnline}
        chatInput={chatInput}
        onChatInputChange={setChatInput}
        onSendMessage={handleSendMessage}
        onSearchModeSelection={handleSearchModeSelection}
        onVoiceInput={handleVoiceInput}
        onClearChat={() => {
          clearChat();
          setChatbotProperties([]);
          setShowChatbotResults(false);
        }}
        isListening={isListening}
        messagesEndRef={messagesEndRef}
      />
    </div>
  );
};

// ✅ Main component wrapped with providers
const RealEstateSearch = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  
  return (
    <APIProvider apiKey={apiKey}>
      {/* ✅ Wrap with HighlightedPropertyProvider */}
      <HighlightedPropertyProvider>
        <RealEstateSearchContent />
      </HighlightedPropertyProvider>
    </APIProvider>
  );
};

export default RealEstateSearch;
