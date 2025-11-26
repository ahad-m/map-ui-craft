import { useState, useEffect, useMemo } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Search, MapPin, X, Languages, ArrowLeft, Heart, Loader2, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import riyalEstateLogo from "@/assets/riyal-estate-logo.jpg";
import { PropertyDetailsDialog } from "@/components/PropertyDetailsDialog";
import { useFavorites } from "@/hooks/useFavorites";
import { useRealEstateAssistant } from "@/hooks/useRealEstateAssistant";
import { PropertyMap } from "@/components/realestate/PropertyMap";
import { FilterSheet } from "@/components/realestate/FilterSheet";
import { ChatbotPanel } from "@/components/realestate/ChatbotPanel";
import { FavoritesSheet } from "@/components/realestate/FavoritesSheet";
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

const RealEstateSearch = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const [transactionType, setTransactionType] = useState<"rent" | "sale">("sale");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [visitedProperties, setVisitedProperties] = useState<Set<string>>(new Set());

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

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    propertyType: "",
    city: "الرياض",
    neighborhood: "",
    minPrice: 0,
    maxPrice: 0,
    areaMin: 0,
    areaMax: 0,
    bedrooms: "",
    livingRooms: "",
    bathrooms: "",
    schoolGender: "",
    schoolLevel: "",
    maxSchoolTime: 15,
    selectedUniversity: "",
    maxUniversityTime: 30,
    nearMetro: false,
    minMetroTime: 1,
    nearHospitals: false,
    nearMosques: false,
    maxMosqueTime: 30,
  });

  const [customSearchTerms, setCustomSearchTerms] = useState({
    propertyType: "",
    neighborhood: "",
    school: "",
    university: "",
    schoolGender: "",
    schoolLevel: "",
  });

  // Chatbot search integration
  const {
    chatbotProperties,
    showChatbotResults,
    nearbyUniversitiesFromBackend,
    nearbyMosquesFromBackend,
    extractFiltersFromCriteria,
    clearChatbotResults,
  } = useChatbotSearch(chatSearchResults, currentCriteria);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setAuthChecked(true);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Just update auth state
    });

    return () => subscription.unsubscribe();
  }, [navigate]);


  useEffect(() => {
    if (searchQuery.trim() !== "") {
      setHasSearched(true);
    }
  }, [searchQuery]);

  // Sync filters from Chatbot
  useEffect(() => {
    if (chatSearchResults.length > 0) {
      setHasSearched(true);
      const filterUpdates = extractFiltersFromCriteria(currentCriteria);
      
      if (Object.keys(filterUpdates).length > 0) {
        setFilters((prev) => ({ ...prev, ...filterUpdates }));
      }

      // Update university search term if provided
      if (filterUpdates.selectedUniversity) {
        setCustomSearchTerms((prev) => ({
          ...prev,
          university: filterUpdates.selectedUniversity || "",
        }));
      }
    }
  }, [chatSearchResults, currentCriteria, extractFiltersFromCriteria]);

  const handleSearchModeSelection = async (mode: "exact" | "similar") => {
    await selectSearchMode(mode);
  };

  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
  };


  const predefinedPropertyTypes = ["استوديو", "شقق", "فلل", "تاون هاوس", "دوبلكس", "دور", "عمائر"];

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

  const { data: neighborhoods = [] } = useQuery({
    queryKey: ["neighborhoods", customSearchTerms.neighborhood],
    queryFn: async () => {
      const data = await fetchNeighborhoods(customSearchTerms.neighborhood);
      const uniqueNeighborhoods = [...new Set(data?.map((p) => p.district?.trim()).filter((n) => n && n !== "") || [])];
      return uniqueNeighborhoods.sort((a, b) => a.localeCompare(b, "ar"));
    },
  });

  const { data: rawProperties = [], isLoading } = useQuery({
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

  // Apply price, area, and metro filters
  const properties = useFilteredProperties(rawProperties, {
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    areaMin: filters.areaMin,
    areaMax: filters.areaMax,
    nearMetro: filters.nearMetro,
    minMetroTime: filters.minMetroTime,
  });

  const predefinedSchoolGenders = ["Boys", "Girls"];
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

  const predefinedSchoolLevels = ["nursery", "kindergarten", "elementary", "middle", "high"];
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

  const baseProperties = showChatbotResults ? chatbotProperties : properties;

  // Calculate properties center location
  const propertiesCenterLocation = usePropertiesCenter(baseProperties);

  // Calculate nearby schools
  const schoolFilterActive = !!(filters.schoolGender || filters.schoolLevel || currentCriteria?.school_requirements?.required);
  const nearbySchools = useNearbySchools(
    allSchools,
    propertiesCenterLocation,
    filters.maxSchoolTime,
    hasSearched,
    schoolFilterActive
  );

  const { data: allUniversities = [] } = useQuery({
    queryKey: ["universities", customSearchTerms.university],
    queryFn: async () => {
      const data = await fetchUniversities(customSearchTerms.university);
      return data || [];
    },
  });

  // Calculate nearby universities
  const universityFilterActive = !!(
    filters.selectedUniversity ||
    filters.maxUniversityTime < 30 ||
    currentCriteria?.university_requirements
  );
  const nearbyUniversities = useNearbyUniversities(
    allUniversities,
    propertiesCenterLocation,
    filters.selectedUniversity,
    filters.maxUniversityTime,
    hasSearched,
    universityFilterActive
  );

  const { data: allMosques = [] } = useQuery({
    queryKey: ["mosques"],
    queryFn: async () => {
      const data = await fetchMosques();
      return data || [];
    },
  });

  // Calculate nearby mosques
  const nearbyMosques = useNearbyMosques(
    allMosques,
    propertiesCenterLocation,
    filters.maxMosqueTime,
    hasSearched,
    filters.nearMosques
  );

  // Apply geographic filters
  let displayedProperties = baseProperties;

  // Filter by schools
  if (hasSearched && schoolFilterActive && nearbySchools.length > 0) {
    displayedProperties = usePropertiesNearSchools(displayedProperties, nearbySchools, filters.maxSchoolTime);
  }

  // Filter by universities
  if (universityFilterActive && nearbyUniversities.length > 0) {
    displayedProperties = usePropertiesNearUniversities(displayedProperties, nearbyUniversities, filters.maxUniversityTime);
  }

  // Filter by mosques
  if (filters.nearMosques && nearbyMosques.length > 0) {
    displayedProperties = usePropertiesNearMosques(displayedProperties, nearbyMosques, filters.maxMosqueTime);
  }

  // Favorites logic
  const { displayedFavorites, favoritesCount, handleToggleFavorite, isPropertyFavorited } = useFavoritesLogic({
    properties: displayedProperties,
    favorites,
    isFavorite,
    toggleFavorite,
    t,
  });

  const hasActiveFilters =
    filters.propertyType ||
    filters.neighborhood ||
    filters.minPrice > 0 ||
    filters.maxPrice > 0 ||
    filters.areaMin > 0 ||
    filters.areaMax > 0 ||
    filters.bedrooms ||
    filters.bathrooms ||
    filters.livingRooms ||
    filters.schoolGender ||
    filters.schoolLevel ||
    filters.selectedUniversity ||
    filters.nearMetro ||
    filters.nearMosques;

  const handlePropertyClick = (property: any) => {
    setSelectedProperty(property);
    setShowPropertyDialog(true);
    setVisitedProperties((prev) => new Set(prev).add(property.id));
  };



  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const resetFilters = () => {
    setFilters({
      propertyType: "",
      city: "الرياض",
      neighborhood: "",
      minPrice: 0,
      maxPrice: 0,
      areaMin: 0,
      areaMax: 0,
      bedrooms: "",
      livingRooms: "",
      bathrooms: "",
      schoolGender: "",
      schoolLevel: "",
      maxSchoolTime: 15,
      selectedUniversity: "",
      maxUniversityTime: 30,
      nearMetro: false,
      minMetroTime: 1,
      nearHospitals: false,
      nearMosques: false,
      maxMosqueTime: 30,
    });
    setCustomSearchTerms({
      propertyType: "",
      neighborhood: "",
      school: "",
      university: "",
      schoolGender: "",
      schoolLevel: "",
    });
    setHasSearched(false);
  };

  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative h-screen w-full overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-light/20 via-background to-accent-light/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_hsl(142_76%_48%/0.08)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_hsl(142_76%_48%/0.05)_0%,_transparent_50%)]" />
        
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
        <div className="absolute top-4 left-4 right-4 z-10">
          <Card className="p-6 glass-effect shadow-elevated border-primary/20 animate-fade-in backdrop-blur-md card-shine">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border/40">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    try {
                      await supabase.auth.signOut();
                      navigate("/", { replace: true });
                      toast({ title: t("loggedOut") || "Logged out successfully" });
                    } catch (error) {
                      console.error("Logout error:", error);
                      navigate("/", { replace: true });
                    }
                  }}
                  className="hover:bg-primary/10 transition-all duration-300 hover:scale-110"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <img
                  src={riyalEstateLogo}
                  alt="RiyalEstate"
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/40 shadow-elegant transition-all duration-300 hover:ring-primary hover:scale-110"
                />
                <div className="flex-1">
                  <h1 className="text-3xl font-bold gradient-text">
                    {t("riyalEstate")}
                  </h1>
                  <p className="text-sm text-muted-foreground font-medium">{t("propertySearch")}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowFavorites(true)} className="gap-2 relative hover:bg-red-50 hover:border-red-300 transition-all duration-300 hover:scale-105">
                    <Heart className={`h-4 w-4 transition-all duration-300 ${favoritesCount > 0 ? "fill-red-500 text-red-500" : ""}`} />
                    {favoritesCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse-glow">
                        {favoritesCount}
                      </span>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={toggleLanguage} className="gap-2 hover:bg-accent-light hover:border-primary transition-all duration-300 hover:scale-105">
                    <Languages className="h-4 w-4" />
                    {i18n.language === "en" ? "ع" : "EN"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/profile")}
                    className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all duration-300 hover:scale-105"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant={transactionType === "sale" ? "default" : "outline"}
                  size="lg"
                  className={`flex-1 transition-all duration-300 font-semibold text-base ${
                    transactionType === "sale"
                      ? "bg-gradient-to-r from-primary to-accent shadow-glow hover:shadow-elevated hover:scale-105"
                      : "hover:border-primary/50 hover:bg-accent-light/50"
                  }`}
                  onClick={() => setTransactionType("sale")}
                >
                  {t("forSale")}
                </Button>
                <Button
                  variant={transactionType === "rent" ? "default" : "outline"}
                  size="lg"
                  className={`flex-1 transition-all duration-300 font-semibold text-base ${
                    transactionType === "rent"
                      ? "bg-gradient-to-r from-primary to-accent shadow-glow hover:shadow-elevated hover:scale-105"
                      : "hover:border-primary/50 hover:bg-accent-light/50"
                  }`}
                  onClick={() => setTransactionType("rent")}
                >
                  {t("forRent")}
                </Button>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 relative group">
                  <MapPin
                    className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-primary transition-all duration-300 group-hover:scale-125 ${i18n.language === "ar" ? "right-3" : "left-3"}`}
                  />
                  <Input
                    placeholder={t("searchLocation")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && setHasSearched(true)}
                    className={`bg-background/90 backdrop-blur-sm border-border/60 focus-visible:ring-primary focus-visible:border-primary focus-visible:shadow-glow transition-all duration-300 h-12 ${i18n.language === "ar" ? "pr-10" : "pl-10"}`}
                  />
                </div>
                <Button
                  size="icon"
                  onClick={() => setHasSearched(true)}
                  className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent shadow-elevated hover:scale-110 hover:rotate-12 transition-all duration-300 border-2 border-primary/20 relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <Search className="h-5 w-5 text-primary-foreground relative z-10 group-hover:scale-110 transition-transform duration-300" />
                </Button>
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
              </div>
            </div>
          </Card>
        </div>

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
        {showChatbotResults && (
          <div className="absolute bottom-24 right-4 z-10">
            <Button
              onClick={() => {
                clearChatbotResults();
                setFilters((prev) => ({
                  ...prev,
                  schoolGender: "",
                  schoolLevel: "",
                  maxSchoolTime: 15,
                }));
              }}
              variant="outline"
              className="bg-white/95 backdrop-blur-sm shadow-lg"
            >
              <X className="h-4 w-4 mr-2" />
              {i18n.language === "ar" ? "إلغاء نتائج المساعد" : "Clear Assistant Results"}
            </Button>
          </div>
        )}

        {/* Results Count */}
        {!selectedProperty && hasSearched && (
          <div className="absolute bottom-24 left-4 right-4 z-10 animate-slide-up">
            <Card className="glass-effect shadow-elevated border-primary/30 backdrop-blur-md card-shine">
              <div className="p-4">
                <div className="text-center">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <p className="text-sm font-bold gradient-text">
                        {t("loading")}
                      </p>
                    </div>
                  ) : displayedProperties.length === 0 ? (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-destructive">{t("noPropertiesFound")}</p>
                      <p className="text-xs text-muted-foreground font-medium">{t("tryAdjustingFilters")}</p>
                    </div>
                  ) : (
                    <p className="text-base font-extrabold gradient-text">
                      {`${displayedProperties.length} ${t("propertiesFound")}`}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

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
      </div>
    </APIProvider>
  );
};

export default RealEstateSearch;
