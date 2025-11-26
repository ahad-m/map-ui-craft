import { useState, useEffect, useRef, useMemo } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import {
  Search,
  MapPin,
  X,
  Languages,
  ArrowLeft,
  Heart,
  Loader2,
  User,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import riyalEstateLogo from "@/assets/riyal-estate-logo.jpg";
import { PropertyDetailsDialog } from "@/components/PropertyDetailsDialog";
import { useFavorites } from "@/hooks/useFavorites";
import { useRealEstateAssistant } from "@/hooks/useRealEstateAssistant";
import { arabicTextMatches } from "@/utils/arabicUtils";
import { PropertyMap } from "@/components/realestate/PropertyMap";
import { FilterSheet } from "@/components/realestate/FilterSheet";
import { calculateDistance, calculateTravelTime } from "@/utils/geolocationUtils";
import { ChatbotPanel } from "@/components/realestate/ChatbotPanel";
import { FavoritesSheet } from "@/components/realestate/FavoritesSheet";

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


  const [chatbotProperties, setChatbotProperties] = useState<any[]>([]);
  const [showChatbotResults, setShowChatbotResults] = useState(false);

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
      console.log("🎯 Chatbot Properties:", chatSearchResults);
      setChatbotProperties(chatSearchResults);
      setShowChatbotResults(true);
      setHasSearched(true);

      if (currentCriteria && currentCriteria.school_requirements?.required) {
        const schoolReqs = currentCriteria.school_requirements;
        let genderFilter = "";
        if (schoolReqs.gender === "بنات") genderFilter = "Girls";
        if (schoolReqs.gender === "بنين") genderFilter = "Boys";

        let levelFilter = "";
        if (schoolReqs.levels && schoolReqs.levels.length > 0) {
          const firstLevel = schoolReqs.levels[0];
          if (firstLevel.includes("ابتدائي")) levelFilter = "elementary";
          else if (firstLevel.includes("متوسط")) levelFilter = "middle";
          else if (firstLevel.includes("ثانوي")) levelFilter = "high";
          else if (firstLevel.includes("روضة")) levelFilter = "kindergarten";
          else if (firstLevel.includes("حضانة")) levelFilter = "nursery";
          else levelFilter = firstLevel;
        }

        setFilters((prevFilters) => ({
          ...prevFilters,
          schoolGender: genderFilter,
          schoolLevel: levelFilter,
          maxSchoolTime: schoolReqs.max_distance_minutes || 15,
        }));
      }

      if (currentCriteria && currentCriteria.university_requirements?.required) {
        const uniReqs = currentCriteria.university_requirements;
        setFilters((prevFilters) => ({
          ...prevFilters,
          selectedUniversity: uniReqs.university_name || "",
          maxUniversityTime: uniReqs.max_distance_minutes || 30,
        }));

        if (uniReqs.university_name) {
          setCustomSearchTerms((prev) => ({
            ...prev,
            university: uniReqs.university_name || "",
          }));
        }
      }
    }
  }, [chatSearchResults, currentCriteria]);

  // Extract entities from Backend results
  const nearbyUniversitiesFromBackend = useMemo(() => {
    if (chatbotProperties.length > 0 && chatbotProperties[0].nearby_universities) {
      console.log("🎓 Universities from backend:", chatbotProperties[0].nearby_universities);
      return chatbotProperties[0].nearby_universities;
    }
    return [];
  }, [chatbotProperties]);

  const nearbyMosquesFromBackend = useMemo(() => {
    if (chatbotProperties.length > 0 && chatbotProperties[0].nearby_mosques) {
      console.log("🕌 Mosques from backend:", chatbotProperties[0].nearby_mosques);
      return chatbotProperties[0].nearby_mosques;
    }
    return [];
  }, [chatbotProperties]);

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
      let query = supabase
        .from("properties")
        .select("property_type")
        .not("property_type", "is", null)
        .not("property_type", "eq", "")
        .ilike("property_type", `%${customSearchTerms.propertyType}%`);
      const { data, error } = await query;
      if (error) throw error;
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
      let query = supabase.from("properties").select("district").not("district", "is", null).not("district", "eq", "");
      if (customSearchTerms.neighborhood) {
        query = query.ilike("district", `%${customSearchTerms.neighborhood}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      const uniqueNeighborhoods = [...new Set(data?.map((p) => p.district?.trim()).filter((n) => n && n !== "") || [])];
      return uniqueNeighborhoods.sort((a, b) => a.localeCompare(b, "ar"));
    },
  });

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties", transactionType, filters, searchQuery, customSearchTerms],
    queryFn: async () => {
      let query = supabase
        .from("properties")
        .select("*")
        .eq("purpose", transactionType === "sale" ? "للبيع" : "للايجار")
        .not("final_lat", "is", null)
        .not("final_lon", "is", null);

      if (filters.propertyType) query = query.eq("property_type", filters.propertyType);
      if (filters.neighborhood) query = query.eq("district", filters.neighborhood);
      if (searchQuery) {
        query = query.or(`city.ilike.%${searchQuery}%,district.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
      }
      if (filters.bedrooms && filters.bedrooms !== "other") {
        const count = parseInt(filters.bedrooms);
        if (!isNaN(count)) query = query.eq("rooms", count);
      }
      if (filters.bathrooms && filters.bathrooms !== "other") {
        const count = parseInt(filters.bathrooms);
        if (!isNaN(count)) query = query.eq("baths", count);
      }
      if (filters.livingRooms && filters.livingRooms !== "other") {
        const count = parseInt(filters.livingRooms);
        if (!isNaN(count)) query = query.eq("halls", count);
      }

      const { data, error } = await query.limit(1000);
      if (error) throw error;

      return (data || []).filter((property) => {
        const priceValue = property.price_num as any;
        const price = typeof priceValue === "string" ? parseFloat(priceValue.replace(/,/g, "")) : Number(priceValue) || 0;
        const areaValue = property.area_m2 as any;
        const area = typeof areaValue === "string" ? parseFloat(areaValue.replace(/,/g, "")) : Number(areaValue) || 0;

        let priceMatch = true;
        if (filters.minPrice > 0 && filters.maxPrice > 0) priceMatch = price >= filters.minPrice && price <= filters.maxPrice;
        else if (filters.minPrice > 0) priceMatch = price >= filters.minPrice;
        else if (filters.maxPrice > 0) priceMatch = price <= filters.maxPrice;

        let areaMatch = true;
        if (filters.areaMin > 0 && filters.areaMax > 0) areaMatch = area >= filters.areaMin && area <= filters.areaMax;
        else if (filters.areaMin > 0) areaMatch = area >= filters.areaMin;
        else if (filters.areaMax > 0) areaMatch = area <= filters.areaMax;

        let metroMatch = true;
        if (filters.nearMetro) {
          if (!property.time_to_metro_min) metroMatch = false;
          else {
            const metroTime =
              typeof property.time_to_metro_min === "string"
                ? parseFloat(property.time_to_metro_min)
                : Number(property.time_to_metro_min);
            metroMatch = !isNaN(metroTime) && metroTime <= filters.minMetroTime;
          }
        }
        return priceMatch && areaMatch && metroMatch;
      });
    },
  });

  const predefinedSchoolGenders = ["Boys", "Girls"];
  const { data: additionalSchoolGenders = [] } = useQuery({
    queryKey: ["schoolGenders", customSearchTerms.schoolGender],
    queryFn: async () => {
      if (!customSearchTerms.schoolGender) return [];
      const { data, error } = await supabase
        .from("schools")
        .select("gender")
        .not("gender", "is", null)
        .not("gender", "eq", "")
        .ilike("gender", `%${customSearchTerms.schoolGender}%`);
      if (error) throw error;
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
      const { data, error } = await supabase
        .from("schools")
        .select("primary_level")
        .not("primary_level", "is", null)
        .not("primary_level", "eq", "")
        .ilike("primary_level", `%${customSearchTerms.schoolLevel}%`);
      if (error) throw error;
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
      let query = supabase
        .from("schools")
        .select("*")
        .not("lat", "is", null)
        .not("lon", "is", null)
        .not("name", "is", null);

      if (filters.schoolGender && filters.schoolGender !== "All") {
        const genderValue = filters.schoolGender === "Boys" ? "boys" : filters.schoolGender === "Girls" ? "girls" : "both";
        query = query.eq("gender", genderValue);
      }
      if (filters.schoolLevel && filters.schoolLevel !== "combined") {
        query = query.eq("primary_level", filters.schoolLevel);
      }
      if (customSearchTerms.school) {
        query = query.or(`name.ilike.%${customSearchTerms.school}%,district.ilike.%${customSearchTerms.school}%`);
      }
      const { data, error } = await query.order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const baseProperties = showChatbotResults ? chatbotProperties : properties;

  const propertiesCenterLocation = useMemo(() => {
    if (baseProperties.length === 0) return null;
    const validProperties = baseProperties.filter(
      (p) =>
        p.lat && p.lon && !isNaN(Number(p.lat)) && !isNaN(Number(p.lon)) && Number(p.lat) !== 0 && Number(p.lon) !== 0,
    );
    if (validProperties.length === 0) return null;
    const sumLat = validProperties.reduce((sum, p) => sum + Number(p.lat), 0);
    const sumLon = validProperties.reduce((sum, p) => sum + Number(p.lon), 0);
    return {
      lat: sumLat / validProperties.length,
      lon: sumLon / validProperties.length,
    };
  }, [baseProperties]);

  const nearbySchools = useMemo(() => {
    if (!hasSearched) return [];
    const requestedFromChatbot = currentCriteria?.school_requirements?.required;
    const requestedFromFilters = filters.schoolGender || filters.schoolLevel;
    if (!requestedFromChatbot && !requestedFromFilters) return [];
    if (allSchools.length === 0) return [];

    // Use property center if available, otherwise fallback to Riyadh center (24.7136, 46.6753)
    const referenceLocation = propertiesCenterLocation || { lat: 24.7136, lon: 46.6753 };

    return allSchools
      .map((school) => {
        const distance = calculateDistance(
          referenceLocation.lat,
          referenceLocation.lon,
          school.lat,
          school.lon,
        );
        const travelTime = calculateTravelTime(distance);
        return { ...school, travelTime };
      })
      .filter((school) => school.travelTime <= filters.maxSchoolTime);
  }, [
    allSchools,
    propertiesCenterLocation,
    filters.maxSchoolTime,
    filters.schoolGender,
    filters.schoolLevel,
    hasSearched,
    currentCriteria,
  ]);

  const { data: allUniversities = [] } = useQuery({
    queryKey: ["universities", customSearchTerms.university],
    queryFn: async () => {
      let query = supabase
        .from("universities")
        .select("*")
        .not("lat", "is", null)
        .not("lon", "is", null)
        .not("name_ar", "is", null)
        .not("name_en", "is", null);

      if (customSearchTerms.university) {
        query = query.or(
          `name_ar.ilike.%${customSearchTerms.university}%,name_en.ilike.%${customSearchTerms.university}%`,
        );
      }
      const { data, error } = await query.order("name_ar", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const nearbyUniversities = useMemo(() => {
    if (!hasSearched) return [];

    const hasSelectedUniversity = !!filters.selectedUniversity;
    const timeFilterChanged = filters.maxUniversityTime < 30;
    const requestedFromChatbot = !!currentCriteria?.university_requirements;

    // University filter is active if: specific university selected, or time slider adjusted (not at default 30), or chatbot requested it
    const universityFilterActive = hasSelectedUniversity || timeFilterChanged || requestedFromChatbot;
    if (!universityFilterActive || allUniversities.length === 0) return [];

    // When a specific university is selected, we must NOT pre-filter by time using a generic center,
    // otherwise the selected university can be excluded incorrectly. We only filter by name here;
    // the time filter is applied later per-property in displayedProperties.
    if (hasSelectedUniversity) {
      const searchTerm = filters.selectedUniversity!;

      // Use property center if available, otherwise fallback to Riyadh center (24.7136, 46.6753)
      const referenceLocation = propertiesCenterLocation || { lat: 24.7136, lon: 46.6753 };

      return allUniversities
        .map((university) => {
          const distance = calculateDistance(
            referenceLocation.lat,
            referenceLocation.lon,
            university.lat,
            university.lon,
          );
          const travelTime = calculateTravelTime(distance);
          return { ...university, travelTime };
        })
        .filter((university) => {
          const nameAr = university.name_ar || "";
          const nameEn = university.name_en || "";
          return arabicTextMatches(searchTerm, nameAr) || arabicTextMatches(searchTerm, nameEn);
        });
    }

    // No specific university selected: use center-based time filtering
    const referenceLocation = propertiesCenterLocation || { lat: 24.7136, lon: 46.6753 };

    return allUniversities
      .map((university) => {
        const distance = calculateDistance(
          referenceLocation.lat,
          referenceLocation.lon,
          university.lat,
          university.lon,
        );
        const travelTime = calculateTravelTime(distance);
        return { ...university, travelTime };
      })
      .filter((university) => university.travelTime <= filters.maxUniversityTime);
  }, [
    allUniversities,
    propertiesCenterLocation,
    filters.maxUniversityTime,
    filters.selectedUniversity,
    hasSearched,
    currentCriteria,
  ]);

  const { data: allMosques = [] } = useQuery({
    queryKey: ["mosques"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mosques")
        .select("*")
        .not("lat", "is", null)
        .not("lon", "is", null)
        .not("name", "is", null);

      if (error) {
        console.error("Error fetching mosques:", error);
        throw error;
      }
      return data || [];
    },
  });

  const nearbyMosques = useMemo(() => {
    if (!hasSearched || !filters.nearMosques || allMosques.length === 0) return [];
    
    // Use property center if available, otherwise fallback to Riyadh center (24.7136, 46.6753)
    const referenceLocation = propertiesCenterLocation || { lat: 24.7136, lon: 46.6753 };
    
    const nearby = allMosques
      .map((mosque) => {
        const distance = calculateDistance(
          referenceLocation.lat,
          referenceLocation.lon,
          mosque.lat,
          mosque.lon,
        );
        const travelTime = calculateTravelTime(distance);
        return { ...mosque, travelTime };
      })
      .filter((mosque) => mosque.travelTime <= filters.maxMosqueTime);
    return nearby;
  }, [allMosques, propertiesCenterLocation, filters.maxMosqueTime, filters.nearMosques, hasSearched]);

  const displayedProperties = useMemo(() => {
    let filtered = [...baseProperties];

    if (hasSearched && (filters.schoolGender || filters.schoolLevel) && nearbySchools.length > 0) {
      filtered = filtered.filter((property) => {
        const lat = Number(property.lat);
        const lon = Number(property.lon);
        if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) return false;
        return nearbySchools.some((school) => {
          const distance = calculateDistance(lat, lon, school.lat, school.lon);
          const travelTime = calculateTravelTime(distance);
          return travelTime <= filters.maxSchoolTime;
        });
      });
    }

    // Filter by university if filter is active (specific university OR time slider adjusted)
    const universityFilterActive = filters.selectedUniversity || filters.maxUniversityTime < 30;
    if (universityFilterActive && nearbyUniversities.length > 0) {
      filtered = filtered.filter((property) => {
        const lat = Number(property.lat);
        const lon = Number(property.lon);
        if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) return false;
        return nearbyUniversities.some((uni) => {
          const distance = calculateDistance(lat, lon, uni.lat, uni.lon);
          const travelTime = calculateTravelTime(distance);
          return travelTime <= filters.maxUniversityTime;
        });
      });
    }

    if (filters.nearMosques && nearbyMosques.length > 0) {
      filtered = filtered.filter((property) => {
        const lat = Number(property.lat);
        const lon = Number(property.lon);
        if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) return false;
        return nearbyMosques.some((mosque) => {
          const distance = calculateDistance(lat, lon, mosque.lat, mosque.lon);
          const travelTime = calculateTravelTime(distance);
          return travelTime <= filters.maxMosqueTime;
        });
      });
    }

    return filtered;
  }, [
    baseProperties,
    hasSearched,
    filters.schoolGender,
    filters.schoolLevel,
    filters.maxSchoolTime,
    filters.selectedUniversity,
    filters.maxUniversityTime,
    filters.nearMosques,
    filters.maxMosqueTime,
    nearbySchools,
    nearbyUniversities,
    nearbyMosques,
  ]);

  const displayedFavorites = displayedProperties.filter((p) => favorites.includes(p.id));
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

  const handleToggleFavorite = (propertyId: string) => {
    toggleFavorite(propertyId);
    if (isFavorite(propertyId)) {
      toast({ title: t("removedFromFavorites") });
    } else {
      toast({ title: t("addedToFavorites") });
    }
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
                    <Heart className={`h-4 w-4 transition-all duration-300 ${favorites.length > 0 ? "fill-red-500 text-red-500" : ""}`} />
                    {favorites.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse-glow">
                        {favorites.length}
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
          isFavorite={selectedProperty ? isFavorite(selectedProperty.id) : false}
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
                setShowChatbotResults(false);
                setChatbotProperties([]);
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
            setChatbotProperties([]);
            setShowChatbotResults(false);
          }}
          onSearchModeSelect={handleSearchModeSelection}
        />
      </div>
    </APIProvider>
  );
};

export default RealEstateSearch;
