import { useState, useEffect, useRef, useMemo } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import {
  Search,
  MapPin,
  MessageCircle,
  SlidersHorizontal,
  X,
  Sparkles,
  Languages,
  ArrowLeft,
  Bed,
  Bath,
  Maximize,
  School,
  GraduationCap,
  Check,
  ChevronsUpDown,
  Heart,
  Bot,
  Send,
  Loader2,
  LogOut,
  Mic,
  User,
  RotateCcw, // [جديد] أيقونة الريستارت
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
import mosqueIcon from "@/assets/mosque-icon.png";
import { PropertyDetailsDialog } from "@/components/PropertyDetailsDialog";
import { useFavorites } from "@/hooks/useFavorites";
import { useRealEstateAssistant } from "@/hooks/useRealEstateAssistant";
import { arabicTextMatches } from "@/utils/arabicUtils";

// Component to save map reference
const MapRefHandler = ({ mapRef }: { mapRef: React.MutableRefObject<google.maps.Map | null> }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      mapRef.current = map;
    }
  }, [map, mapRef]);
  return null;
};

const RealEstateSearch = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const [transactionType, setTransactionType] = useState<"rent" | "sale">("sale");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showingSimilarResults, setShowingSimilarResults] = useState(false);
  const [openSchoolCombobox, setOpenSchoolCombobox] = useState(false);
  const [openUniversityCombobox, setOpenUniversityCombobox] = useState(false);
  const [openNeighborhoodCombobox, setOpenNeighborhoodCombobox] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 24.7136, lng: 46.6753 });
  const [mapZoom, setMapZoom] = useState(12);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const {
    messages,
    isLoading: isChatLoading,
    isBackendOnline,
    currentCriteria,
    searchResults: chatSearchResults,
    sendMessage,
    selectSearchMode,
    resetChat, // [جديد] استدعاء دالة الريستارت من الهوك
  } = useRealEstateAssistant();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  const [openPropertyTypeCombobox, setOpenPropertyTypeCombobox] = useState(false);
  const [openSchoolGenderCombobox, setOpenSchoolGenderCombobox] = useState(false);
  const [openSchoolLevelCombobox, setOpenSchoolLevelCombobox] = useState(false);

  const [chatbotProperties, setChatbotProperties] = useState<any[]>([]);
  const [showChatbotResults, setShowChatbotResults] = useState(false);

  // ---------------------------------------------------------
  // Helper to extract unique items (schools/mosques) from ALL properties
  // ---------------------------------------------------------
  const getUniqueItems = (properties: any[], key: string) => {
    if (!properties || properties.length === 0) return [];
    const allItems = properties.flatMap((p) => p[key] || []);
    const uniqueItems = new Map();

    allItems.forEach((item) => {
      const uniqueKey =
        item.lat && item.lon
          ? `${Number(item.lat).toFixed(5)}-${Number(item.lon).toFixed(5)}`
          : item.name || Math.random().toString();

      if (!uniqueItems.has(uniqueKey)) {
        uniqueItems.set(uniqueKey, item);
      }
    });

    return Array.from(uniqueItems.values());
  };

  // Extract entities from Backend results
  const nearbySchoolsFromBackend = useMemo(() => {
    return getUniqueItems(chatbotProperties, "nearby_schools");
  }, [chatbotProperties]);

  const nearbyUniversitiesFromBackend = useMemo(() => {
    return getUniqueItems(chatbotProperties, "nearby_universities");
  }, [chatbotProperties]);

  const nearbyMosquesFromBackend = useMemo(() => {
    return getUniqueItems(chatbotProperties, "nearby_mosques");
  }, [chatbotProperties]);
  // ---------------------------------------------------------

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    await sendMessage(chatInput);
    setChatInput("");
  };

  const handleSearchModeSelection = async (mode: "exact" | "similar") => {
    await selectSearchMode(mode);
  };

  // [جديد] دالة إعادة تشغيل المحادثة
  const handleRestartChat = () => {
    if (resetChat) resetChat();
    setChatbotProperties([]);
    setShowChatbotResults(false);

    // Reset local filters
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
    setChatInput("");
    toast({ title: "تم إعادة ضبط المحادثة" });
  };

  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
      toast({ title: t("loggedOut") || "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "غير مدعوم",
        description: "متصفحك لا يدعم ميزة الإدخال الصوتي. جرب متصفح Chrome أو Edge.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA";
    recognition.continuous = false;
    recognition.interimResults = false;
    let finalTranscript = "";

    recognition.onstart = () => {
      setIsListening(true);
      setChatInput("...جاري الاستماع");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      finalTranscript = transcript;
      setChatInput(transcript);
    };

    recognition.onnomatch = () => {
      toast({
        title: "لم يتم التعرف على الكلام",
        description: "حاول التحدث بوضوح أكثر.",
        variant: "destructive",
      });
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        toast({
          title: "المايكروفون محجوب",
          description: "تحتاج إلى السماح بالوصول إلى المايكروفون في إعدادات المتصفح (علامة القفل 🔒).",
          variant: "destructive",
        });
      } else {
        toast({
          title: "خطأ في الصوت",
          description: `حدث خطأ: ${event.error}. حاول مرة أخرى.`,
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript === "") {
        setChatInput("");
      }
    };

    try {
      recognition.start();
    } catch (e) {
      setIsListening(false);
      setChatInput("");
      toast({
        title: "خطأ",
        description: "لم يتمكن من بدء خدمة التعرف على الصوت. قد تكون قيد الاستخدام.",
        variant: "destructive",
      });
    }
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

      const { data, error } = await query.limit(500);
      if (error) throw error;

      return (data || []).filter((property) => {
        const priceValue = property.price_num as any;
        const price =
          typeof priceValue === "string" ? parseFloat(priceValue.replace(/,/g, "")) : Number(priceValue) || 0;
        const areaValue = property.area_m2 as any;
        const area = typeof areaValue === "string" ? parseFloat(areaValue.replace(/,/g, "")) : Number(areaValue) || 0;

        let priceMatch = true;
        if (filters.minPrice > 0 && filters.maxPrice > 0)
          priceMatch = price >= filters.minPrice && price <= filters.maxPrice;
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
        const genderValue =
          filters.schoolGender === "Boys" ? "boys" : filters.schoolGender === "Girls" ? "girls" : "both";
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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateTravelTime = (distanceKm: number): number => {
    const avgSpeed = 30;
    return Math.round((distanceKm / avgSpeed) * 60);
  };

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
    if (!propertiesCenterLocation || allSchools.length === 0) return [];

    return allSchools
      .map((school) => {
        const distance = calculateDistance(
          propertiesCenterLocation.lat,
          propertiesCenterLocation.lon,
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
    if (!filters.selectedUniversity && !currentCriteria?.university_requirements) return [];
    if (!propertiesCenterLocation || allUniversities.length === 0) return [];

    return allUniversities
      .map((university) => {
        const distance = calculateDistance(
          propertiesCenterLocation.lat,
          propertiesCenterLocation.lon,
          university.lat,
          university.lon,
        );
        const travelTime = calculateTravelTime(distance);
        return { ...university, travelTime };
      })
      .filter((university) => {
        if (university.travelTime > filters.maxUniversityTime) return false;
        if (filters.selectedUniversity) {
          const searchTerm = filters.selectedUniversity;
          const nameAr = university.name_ar || "";
          const nameEn = university.name_en || "";
          return arabicTextMatches(searchTerm, nameAr) || arabicTextMatches(searchTerm, nameEn);
        }
        return true;
      });
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
    if (!hasSearched || !filters.nearMosques || !propertiesCenterLocation || allMosques.length === 0) return [];
    const nearby = allMosques
      .map((mosque) => {
        const distance = calculateDistance(
          propertiesCenterLocation.lat,
          propertiesCenterLocation.lon,
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

    if (filters.selectedUniversity && nearbyUniversities.length > 0) {
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
  };

  const handleToggleFavorite = (propertyId: string) => {
    toggleFavorite(propertyId);
    if (isFavorite(propertyId)) {
      toast({ title: t("removedFromFavorites") });
    } else {
      toast({ title: t("addedToFavorites") });
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;
    if (showChatbotResults && chatbotProperties.length > 0) {
      const lats = chatbotProperties.map((p) => Number(p.lat)).filter((lat) => !isNaN(lat) && lat !== 0);
      const lngs = chatbotProperties.map((p) => Number(p.lon)).filter((lng) => !isNaN(lng) && lng !== 0);

      if (lats.length > 0 && lngs.length > 0) {
        const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
        const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
        mapRef.current.setCenter({ lat: avgLat, lng: avgLng });
        mapRef.current.setZoom(13);
      }
    }
  }, [showChatbotResults, chatbotProperties]);

  useEffect(() => {
    if (!mapRef.current || displayedProperties.length === 0 || !hasSearched) return;
    const bounds = new google.maps.LatLngBounds();
    displayedProperties.forEach((property) => {
      const lat = Number(property.lat);
      const lng = Number(property.lon);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        bounds.extend({ lat, lng });
      }
    });
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds);
    }
  }, [displayedProperties, hasSearched]);

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
        <div className="absolute inset-0">
          <Map
            defaultCenter={mapCenter}
            defaultZoom={mapZoom}
            mapId="real-estate-map"
            gestureHandling="greedy"
            disableDefaultUI={false}
          >
            <MapRefHandler mapRef={mapRef} />
            {displayedProperties.map((property) => {
              const lat = Number(property.lat);
              const lon = Number(property.lon);
              if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) return null;

              return (
                <AdvancedMarker
                  key={property.id}
                  position={{ lat, lng: lon }}
                  onClick={() => handlePropertyClick(property)}
                >
                  <div className="relative group cursor-pointer">
                    <div className="transition-transform duration-300 group-hover:scale-125 group-hover:-translate-y-2">
                      <Pin
                        background={transactionType === "sale" ? "#15803d" : "#22c55e"}
                        borderColor={transactionType === "sale" ? "#14532d" : "#16a34a"}
                        glyphColor={"#ffffff"}
                      />
                    </div>
                    <div
                      className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-0 group-hover:opacity-100"
                      style={{ animationDuration: "1.5s" }}
                    />
                    {isFavorite(property.id) && (
                      <div className="absolute -top-2 -right-2 animate-pulse-glow">
                        <Heart className="h-4 w-4 fill-red-500 text-red-500 drop-shadow-lg" />
                      </div>
                    )}
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* Standard School markers (Manual Filters) */}
            {hasSearched &&
              nearbySchools.map((school) => (
                <AdvancedMarker key={`school-${school.id}`} position={{ lat: school.lat, lng: school.lon }}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative group cursor-pointer transition-all duration-300 hover:scale-125 hover:-translate-y-2">
                        <div
                          className="p-2 rounded-full shadow-elevated"
                          style={{ backgroundColor: "hsl(142 71% 45%)" }}
                        >
                          <School className="h-5 w-5 text-white" />
                        </div>
                        <div
                          className="absolute inset-0 rounded-full animate-ping opacity-0 group-hover:opacity-100"
                          style={{ backgroundColor: "hsl(142 71% 45% / 0.3)", animationDuration: "1.5s" }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{school.name}</p>
                      {school.travelTime !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          {t("maxTravelTime")}: {school.travelTime} {t("minutes")}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </AdvancedMarker>
              ))}

            {/* Standard University markers */}
            {hasSearched &&
              nearbyUniversities.map((university) => (
                <AdvancedMarker
                  key={`university-${university.name_ar}`}
                  position={{ lat: university.lat, lng: university.lon }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative group cursor-pointer transition-all duration-300 hover:scale-125 hover:-translate-y-2">
                        <div
                          className="p-2 rounded-full shadow-elevated"
                          style={{ backgroundColor: "hsl(142 71% 45%)" }}
                        >
                          <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <div
                          className="absolute inset-0 rounded-full animate-ping opacity-0 group-hover:opacity-100"
                          style={{ backgroundColor: "hsl(142 71% 45% / 0.3)", animationDuration: "1.5s" }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{i18n.language === "ar" ? university.name_ar : university.name_en}</p>
                    </TooltipContent>
                  </Tooltip>
                </AdvancedMarker>
              ))}

            {/* --------------------------------------------------------- */}
            {/* [New] Schools markers from Backend */}
            {/* --------------------------------------------------------- */}
            {hasSearched &&
              nearbySchoolsFromBackend.map((school: any, index: number) => (
                <AdvancedMarker
                  key={`school-backend-${index}`}
                  position={{ lat: Number(school.lat), lng: Number(school.lon) }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative group cursor-pointer transition-all duration-300 hover:scale-125 hover:-translate-y-2">
                        <div
                          className="p-2 rounded-full shadow-elevated"
                          style={{ backgroundColor: "hsl(142 71% 45%)" }}
                        >
                          <School className="h-5 w-5 text-white" />
                        </div>
                        <div
                          className="absolute inset-0 rounded-full animate-ping opacity-0 group-hover:opacity-100"
                          style={{ backgroundColor: "hsl(142 71% 45% / 0.3)", animationDuration: "1.5s" }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{school.name}</p>
                      {school.travel_minutes !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          {t("maxTravelTime")}: {Math.round(school.travel_minutes)} {t("minutes")}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </AdvancedMarker>
              ))}

            {/* University markers from Backend */}
            {hasSearched &&
              nearbyUniversitiesFromBackend.map((university: any, index: number) => (
                <AdvancedMarker
                  key={`university-backend-${index}`}
                  position={{ lat: Number(university.lat), lng: Number(university.lon) }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative group cursor-pointer transition-all duration-300 hover:scale-125 hover:-translate-y-2">
                        <div
                          className="p-2 rounded-full shadow-elevated"
                          style={{ backgroundColor: "hsl(217 91% 60%)" }}
                        >
                          <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <div
                          className="absolute inset-0 rounded-full animate-ping opacity-0 group-hover:opacity-100"
                          style={{ backgroundColor: "hsl(217 91% 60% / 0.3)", animationDuration: "1.5s" }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{i18n.language === "ar" ? university.name_ar : university.name_en}</p>
                      {university.drive_minutes !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          {t("drivingTime") || "وقت القيادة"}: {Math.round(university.drive_minutes)}{" "}
                          {t("minutes") || "دقيقة"}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </AdvancedMarker>
              ))}

            {/* [Fixed] Mosque markers from Backend */}
            {hasSearched &&
              nearbyMosquesFromBackend.map((mosque: any, index: number) => (
                <AdvancedMarker
                  key={`mosque-backend-${index}`}
                  position={{ lat: Number(mosque.lat), lng: Number(mosque.lon) }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative group cursor-pointer transition-all duration-300 hover:scale-125 hover:-translate-y-2">
                        <div
                          className="p-2 rounded-full shadow-elevated border-2 border-white"
                          style={{ backgroundColor: "hsl(142 76% 36%)" }}
                        >
                          <img src={mosqueIcon} alt="Mosque" className="h-5 w-5 invert" />
                        </div>
                        <div
                          className="absolute inset-0 rounded-full animate-ping opacity-0 group-hover:opacity-100"
                          style={{
                            backgroundColor: "hsl(142 76% 36% / 0.3)",
                            animationDuration: "1.5s",
                          }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{mosque.name}</p>
                      {(mosque.walk_minutes !== undefined || mosque.drive_minutes !== undefined) && (
                        <p className="text-xs text-muted-foreground">
                          {mosque.walk_minutes
                            ? `${t("walkingTime") || "وقت المشي"}: ${Math.round(mosque.walk_minutes)} ${t("minutes") || "دقيقة"}`
                            : `${t("drivingTime") || "وقت القيادة"}: ${Math.round(mosque.drive_minutes)} ${t("minutes") || "دقيقة"}`}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </AdvancedMarker>
              ))}

            {/* Standard Mosque markers (Manual Filters) */}
            {hasSearched &&
              nearbyMosques.map((mosque) => (
                <AdvancedMarker key={`mosque-${mosque.id}`} position={{ lat: mosque.lat, lng: mosque.lon }}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative group cursor-pointer transition-all duration-300 hover:scale-125 hover:-translate-y-2">
                        <div
                          className="p-2 rounded-full shadow-elevated border-2 border-white"
                          style={{ backgroundColor: "hsl(142 76% 36%)" }}
                        >
                          <img src={mosqueIcon} alt="Mosque" className="h-5 w-5 invert" />
                        </div>
                        <div
                          className="absolute inset-0 rounded-full animate-ping opacity-0 group-hover:opacity-100"
                          style={{ backgroundColor: "hsl(142 76% 36% / 0.3)", animationDuration: "1.5s" }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{mosque.name}</p>
                      {mosque.travelTime !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          {t("maxTravelTime")}: {mosque.travelTime} {t("minutes")}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </AdvancedMarker>
              ))}
          </Map>
        </div>

        {/* Top Search Bar */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <Card className="p-6 glass-effect shadow-elevated border-primary/20 animate-fade-in">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border/50">
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
                  className="hover:bg-primary/10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <img
                  src={riyalEstateLogo}
                  alt="RiyalEstate"
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/30 shadow-elegant"
                />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {t("riyalEstate")}
                  </h1>
                  <p className="text-sm text-muted-foreground font-medium">{t("propertySearch")}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowFavorites(true)} className="gap-2 relative">
                    <Heart className={`h-4 w-4 ${favorites.length > 0 ? "fill-red-500 text-red-500" : ""}`} />
                    {favorites.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {favorites.length}
                      </span>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={toggleLanguage} className="gap-2">
                    <Languages className="h-4 w-4" />
                    {i18n.language === "en" ? "ع" : "EN"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/profile")}
                    className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant={transactionType === "sale" ? "default" : "outline"}
                  size="lg"
                  className={`flex-1 transition-all duration-300 font-semibold ${
                    transactionType === "sale"
                      ? "bg-gradient-to-r from-primary to-accent shadow-glow hover:shadow-elevated hover:scale-105"
                      : "hover:border-primary/50 hover:bg-primary/5"
                  }`}
                  onClick={() => setTransactionType("sale")}
                >
                  {t("forSale")}
                </Button>
                <Button
                  variant={transactionType === "rent" ? "default" : "outline"}
                  size="lg"
                  className={`flex-1 transition-all duration-300 font-semibold ${
                    transactionType === "rent"
                      ? "bg-gradient-to-r from-primary to-accent shadow-glow hover:shadow-elevated hover:scale-105"
                      : "hover:border-primary/50 hover:bg-primary/5"
                  }`}
                  onClick={() => setTransactionType("rent")}
                >
                  {t("forRent")}
                </Button>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 relative group">
                  <MapPin
                    className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-primary transition-all duration-300 group-hover:scale-110 ${i18n.language === "ar" ? "right-3" : "left-3"}`}
                  />
                  <Input
                    placeholder={t("searchLocation")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`bg-background/80 backdrop-blur-sm border-border focus-visible:ring-primary focus-visible:border-primary focus-visible:shadow-glow transition-all duration-300 ${i18n.language === "ar" ? "pr-10" : "pl-10"}`}
                  />
                </div>
                <Sheet open={showFilters} onOpenChange={setShowFilters}>
                  <SheetTrigger asChild>
                    <Button
                      size="lg"
                      className="gap-3 px-6 py-6 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] text-primary-foreground font-bold text-base shadow-glow hover:bg-[position:100%_0] hover:scale-110 transition-all duration-500 border-2 border-primary-foreground/20 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      <SlidersHorizontal className="h-6 w-6 group-hover:rotate-180 transition-transform duration-500 relative z-10" />
                      <span className="relative z-10">{t("advancedFilters")}</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="w-full sm:max-w-2xl overflow-y-auto bg-background/98 backdrop-blur-md"
                  >
                    <SheetHeader className="pb-6 border-b-2 border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <SlidersHorizontal className="h-5 w-5 text-primary" />
                        </div>
                        <SheetTitle className="text-2xl font-bold">{t("advancedFilters")}</SheetTitle>
                      </div>
                    </SheetHeader>

                    <div className="space-y-8 mt-6 pb-4">
                      {/* Property Details Section */}
                      <div className="space-y-4 p-5 rounded-xl border border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-elegant">
                        <h3 className="font-bold text-lg flex items-center gap-3 text-foreground">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10">
                            <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          {t("propertyDetails")}
                        </h3>

                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t("propertyType")}</Label>
                            <Popover open={openPropertyTypeCombobox} onOpenChange={setOpenPropertyTypeCombobox}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between bg-background hover:bg-accent"
                                >
                                  {filters.propertyType || t("selectPropertyType")}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0 z-[100]">
                                <Command>
                                  <CommandInput
                                    placeholder={t("propertyType")}
                                    onValueChange={(value) => {
                                      setCustomSearchTerms({ ...customSearchTerms, propertyType: value });
                                    }}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      {allPropertyTypes.length === 0 ? t("notFound") : t("selectPropertyType")}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      <CommandItem
                                        onSelect={() => {
                                          setFilters({ ...filters, propertyType: "" });
                                          setCustomSearchTerms({ ...customSearchTerms, propertyType: "" });
                                          setOpenPropertyTypeCombobox(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            !filters.propertyType ? "opacity-100" : "opacity-0",
                                          )}
                                        />
                                        {t("none")}
                                      </CommandItem>
                                      {allPropertyTypes.map((type) => (
                                        <CommandItem
                                          key={type}
                                          value={type}
                                          onSelect={() => {
                                            setFilters({ ...filters, propertyType: type });
                                            setCustomSearchTerms({ ...customSearchTerms, propertyType: "" });
                                            setOpenPropertyTypeCombobox(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              filters.propertyType === type ? "opacity-100" : "opacity-0",
                                            )}
                                          />
                                          {type}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t("neighborhood")}</Label>
                            <Popover open={openNeighborhoodCombobox} onOpenChange={setOpenNeighborhoodCombobox}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between bg-background hover:bg-accent"
                                >
                                  {filters.neighborhood || t("selectNeighborhood")}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0 z-[100]">
                                <Command>
                                  <CommandInput
                                    placeholder={t("searchNeighborhood")}
                                    onValueChange={(value) => {
                                      setCustomSearchTerms({ ...customSearchTerms, neighborhood: value });
                                    }}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      {neighborhoods.length === 0 ? t("notFound") : t("noNeighborhoodFound")}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      <CommandItem
                                        onSelect={() => {
                                          setFilters({ ...filters, neighborhood: "" });
                                          setCustomSearchTerms({ ...customSearchTerms, neighborhood: "" });
                                          setOpenNeighborhoodCombobox(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            !filters.neighborhood ? "opacity-100" : "opacity-0",
                                          )}
                                        />
                                        {t("none")}
                                      </CommandItem>
                                      {neighborhoods.map((neighborhood) => (
                                        <CommandItem
                                          key={neighborhood}
                                          value={neighborhood}
                                          onSelect={() => {
                                            setFilters({ ...filters, neighborhood });
                                            setCustomSearchTerms({ ...customSearchTerms, neighborhood: "" });
                                            setOpenNeighborhoodCombobox(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              filters.neighborhood === neighborhood ? "opacity-100" : "opacity-0",
                                            )}
                                          />
                                          {neighborhood}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>

                      {/* Price & Area Section */}
                      <div className="space-y-4 p-5 rounded-xl border border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-elegant">
                        <h3 className="font-bold text-lg flex items-center gap-3 text-foreground">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10">
                            <Maximize className="h-5 w-5 text-primary" />
                          </div>
                          {t("priceAndArea")}
                        </h3>

                        <div className="space-y-3">
                          {/* Price Range */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t("price")} (SAR)</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{t("min")}</Label>
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder={t("min")}
                                    value={filters.minPrice || ""}
                                    onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) })}
                                    className="bg-background"
                                  />
                                  {filters.minPrice > 0 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => setFilters({ ...filters, minPrice: 0 })}
                                      className="shrink-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{t("max")}</Label>
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder={t("max")}
                                    value={filters.maxPrice || ""}
                                    onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                                    className="bg-background"
                                  />
                                  {filters.maxPrice > 0 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => setFilters({ ...filters, maxPrice: 0 })}
                                      className="shrink-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Area Range */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t("areaSize")} (م²)</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{t("min")}</Label>
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder={t("min")}
                                    value={filters.areaMin || ""}
                                    onChange={(e) => setFilters({ ...filters, areaMin: Number(e.target.value) })}
                                    className="bg-background"
                                  />
                                  {filters.areaMin > 0 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => setFilters({ ...filters, areaMin: 0 })}
                                      className="shrink-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{t("max")}</Label>
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder={t("max")}
                                    value={filters.areaMax || ""}
                                    onChange={(e) => setFilters({ ...filters, areaMax: Number(e.target.value) })}
                                    className="bg-background"
                                  />
                                  {filters.areaMax > 0 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => setFilters({ ...filters, areaMax: 0 })}
                                      className="shrink-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Room Details Section */}
                      <div className="space-y-4 p-5 rounded-xl border border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-elegant">
                        <h3 className="font-bold text-lg flex items-center gap-3 text-foreground">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10">
                            <Bed className="h-5 w-5 text-primary" />
                          </div>
                          {t("roomDetails")}
                        </h3>

                        <div className="space-y-3">
                          {/* Bedrooms */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t("bedrooms")}</Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                min="0"
                                placeholder={t("bedrooms")}
                                value={filters.bedrooms || ""}
                                onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                                className="bg-background flex-1"
                              />
                              {filters.bedrooms && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setFilters({ ...filters, bedrooms: "" })}
                                  className="shrink-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Living Rooms */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t("livingRooms")}</Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                min="0"
                                placeholder={t("livingRooms")}
                                value={filters.livingRooms || ""}
                                onChange={(e) => setFilters({ ...filters, livingRooms: e.target.value })}
                                className="bg-background flex-1"
                              />
                              {filters.livingRooms && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setFilters({ ...filters, livingRooms: "" })}
                                  className="shrink-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Bathrooms */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t("bathrooms")}</Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                min="0"
                                placeholder={t("bathrooms")}
                                value={filters.bathrooms || ""}
                                onChange={(e) => setFilters({ ...filters, bathrooms: e.target.value })}
                                className="bg-background flex-1"
                              />
                              {filters.bathrooms && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setFilters({ ...filters, bathrooms: "" })}
                                  className="shrink-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Education Section */}
                      <div className="space-y-4 p-5 rounded-xl border border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-elegant">
                        <h3 className="font-bold text-lg flex items-center gap-3 text-foreground">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10">
                            <School className="h-5 w-5 text-primary" />
                          </div>
                          {t("education")}
                        </h3>

                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t("schools")}</Label>

                            {/* School Gender Filter */}
                            <Popover open={openSchoolGenderCombobox} onOpenChange={setOpenSchoolGenderCombobox}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between bg-background hover:bg-accent"
                                >
                                  {filters.schoolGender === "All"
                                    ? t("all")
                                    : filters.schoolGender === "Boys"
                                      ? t("boys")
                                      : filters.schoolGender === "Girls"
                                        ? t("girls")
                                        : filters.schoolGender || t("gender")}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0 z-[100]">
                                <Command>
                                  <CommandInput
                                    placeholder={t("gender")}
                                    onValueChange={(value) => {
                                      setCustomSearchTerms({ ...customSearchTerms, schoolGender: value });
                                    }}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      {allSchoolGenders.length === 0 ? t("notFound") : t("gender")}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      <CommandItem
                                        onSelect={() => {
                                          setFilters({ ...filters, schoolGender: "All" });
                                          setCustomSearchTerms({ ...customSearchTerms, schoolGender: "" });
                                          setOpenSchoolGenderCombobox(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.schoolGender === "All" ? "opacity-100" : "opacity-0",
                                          )}
                                        />
                                        {t("all")}
                                      </CommandItem>
                                      {allSchoolGenders.map((gender) => (
                                        <CommandItem
                                          key={gender}
                                          value={gender}
                                          onSelect={() => {
                                            setFilters({ ...filters, schoolGender: gender });
                                            setCustomSearchTerms({ ...customSearchTerms, schoolGender: "" });
                                            setOpenSchoolGenderCombobox(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              filters.schoolGender === gender ? "opacity-100" : "opacity-0",
                                            )}
                                          />
                                          {gender === "All"
                                            ? t("all")
                                            : gender === "Boys"
                                              ? t("boys")
                                              : gender === "Girls"
                                                ? t("girls")
                                                : gender}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>

                            {/* School Level Filter */}
                            <Popover open={openSchoolLevelCombobox} onOpenChange={setOpenSchoolLevelCombobox}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between bg-background hover:bg-accent"
                                >
                                  {filters.schoolLevel === "combined"
                                    ? t("combined")
                                    : filters.schoolLevel === "nursery"
                                      ? t("nursery")
                                      : filters.schoolLevel === "kindergarten"
                                        ? t("kindergarten")
                                        : filters.schoolLevel === "elementary"
                                          ? t("elementary")
                                          : filters.schoolLevel === "middle"
                                            ? t("middle")
                                            : filters.schoolLevel === "high"
                                              ? t("high")
                                              : filters.schoolLevel || t("schoolLevel")}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0 z-[100]">
                                <Command>
                                  <CommandInput
                                    placeholder={t("schoolLevel")}
                                    onValueChange={(value) => {
                                      setCustomSearchTerms({ ...customSearchTerms, schoolLevel: value });
                                    }}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      {allSchoolLevels.length === 0 ? t("notFound") : t("schoolLevel")}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      <CommandItem
                                        onSelect={() => {
                                          setFilters({ ...filters, schoolLevel: "combined" });
                                          setCustomSearchTerms({ ...customSearchTerms, schoolLevel: "" });
                                          setOpenSchoolLevelCombobox(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.schoolLevel === "combined" ? "opacity-100" : "opacity-0",
                                          )}
                                        />
                                        {t("combined")}
                                      </CommandItem>
                                      {allSchoolLevels.map((level) => (
                                        <CommandItem
                                          key={level}
                                          value={level}
                                          onSelect={() => {
                                            setFilters({ ...filters, schoolLevel: level });
                                            setCustomSearchTerms({ ...customSearchTerms, schoolLevel: "" });
                                            setOpenSchoolLevelCombobox(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              filters.schoolLevel === level ? "opacity-100" : "opacity-0",
                                            )}
                                          />
                                          {level === "combined"
                                            ? t("combined")
                                            : level === "nursery"
                                              ? t("nursery")
                                              : level === "kindergarten"
                                                ? t("kindergarten")
                                                : level === "elementary"
                                                  ? t("elementary")
                                                  : level === "middle"
                                                    ? t("middle")
                                                    : level === "high"
                                                      ? t("high")
                                                      : level}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>

                            {/* School Time Slider */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium">
                                {t("maxTravelTime")}: {filters.maxSchoolTime} {t("minutes")}
                              </Label>
                              <Slider
                                value={[filters.maxSchoolTime]}
                                onValueChange={(value) => setFilters({ ...filters, maxSchoolTime: value[0] })}
                                min={1}
                                max={15}
                                step={1}
                                className="w-full"
                              />
                              {nearbySchools.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {nearbySchools.length} {t("schoolsFound")}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t("universities")}</Label>

                            {/* University Selection Dropdown */}
                            <Popover open={openUniversityCombobox} onOpenChange={setOpenUniversityCombobox}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between bg-background hover:bg-accent"
                                >
                                  {filters.selectedUniversity || t("selectUniversity")}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0 z-[100]">
                                <Command>
                                  <CommandInput
                                    placeholder={t("searchUniversity")}
                                    onValueChange={(value) => {
                                      setCustomSearchTerms({ ...customSearchTerms, university: value });
                                    }}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      {allUniversities.length === 0 ? t("notFound") : t("noResults")}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      <CommandItem
                                        onSelect={() => {
                                          setFilters({ ...filters, selectedUniversity: "" });
                                          setCustomSearchTerms({ ...customSearchTerms, university: "" });
                                          setOpenUniversityCombobox(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            !filters.selectedUniversity ? "opacity-100" : "opacity-0",
                                          )}
                                        />
                                        {t("all")}
                                      </CommandItem>
                                      {allUniversities.map((uni) => (
                                        <CommandItem
                                          key={uni.name_ar}
                                          value={i18n.language === "ar" ? uni.name_ar : uni.name_en}
                                          onSelect={() => {
                                            setFilters({
                                              ...filters,
                                              selectedUniversity: i18n.language === "ar" ? uni.name_ar : uni.name_en,
                                            });
                                            setCustomSearchTerms({ ...customSearchTerms, university: "" });
                                            setOpenUniversityCombobox(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              filters.selectedUniversity ===
                                                (i18n.language === "ar" ? uni.name_ar : uni.name_en)
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                          {i18n.language === "ar" ? uni.name_ar : uni.name_en}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>

                            {/* University Time Slider */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium">
                                {t("maxTravelTime")}: {filters.maxUniversityTime} {t("minutes")}
                              </Label>
                              <Slider
                                value={[filters.maxUniversityTime]}
                                onValueChange={(value) => setFilters({ ...filters, maxUniversityTime: value[0] })}
                                min={1}
                                max={30}
                                step={1}
                                className="w-full"
                              />
                              {nearbyUniversities.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {nearbyUniversities.length} {t("universitiesFound")}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Proximity Filters Section */}
                      <div className="space-y-4 p-4 rounded-lg border border-border bg-card/50">
                        <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                          <div className="p-1.5 rounded-md bg-primary/15">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          {t("proximityFilters")}
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Checkbox
                              id="nearMosques"
                              checked={filters.nearMosques}
                              onCheckedChange={(checked) => setFilters({ ...filters, nearMosques: checked as boolean })}
                            />
                            <label htmlFor="nearMosques" className="text-sm cursor-pointer">
                              {t("nearMosques")}
                            </label>
                          </div>
                          {filters.nearMosques && (
                            <div className="ml-6 space-y-2 p-3 bg-background/50 rounded-lg rtl:mr-6 rtl:ml-0">
                              <Label className="text-xs font-medium">
                                {t("maxTravelTime")}: {filters.maxMosqueTime} {t("minutes")}
                              </Label>
                              <Slider
                                value={[filters.maxMosqueTime]}
                                onValueChange={(value) => setFilters({ ...filters, maxMosqueTime: value[0] })}
                                min={1}
                                max={30}
                                step={1}
                                className="w-full"
                              />
                            </div>
                          )}

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="metro"
                              checked={filters.nearMetro}
                              onCheckedChange={(checked) => setFilters({ ...filters, nearMetro: checked as boolean })}
                            />
                            <label htmlFor="metro" className="text-sm cursor-pointer">
                              {t("nearMetro")}
                            </label>
                          </div>
                          {filters.nearMetro && (
                            <div className="ml-6 space-y-2 p-3 bg-background/50 rounded-lg">
                              <Label className="text-xs font-medium">
                                {t("maxWalkingTime")}: {filters.minMetroTime} {t("minutes")}
                              </Label>
                              <Slider
                                value={[filters.minMetroTime]}
                                onValueChange={(value) => setFilters({ ...filters, minMetroTime: value[0] })}
                                min={1}
                                max={30}
                                step={1}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Apply/Reset Buttons */}
                      <div className="flex gap-3 mt-8 pt-6 border-t border-border/50">
                        <Button
                          variant="outline"
                          size="lg"
                          className="flex-1 h-12 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all"
                          onClick={resetFilters}
                        >
                          <X className={`h-5 w-5 ${i18n.language === "ar" ? "ml-2" : "mr-2"}`} />
                          {t("resetFilters")}
                        </Button>
                        <Button
                          size="lg"
                          className="flex-1 h-12 bg-gradient-to-r from-primary to-accent shadow-glow hover:shadow-elevated hover:scale-105 transition-all duration-300 font-bold"
                          onClick={() => {
                            setShowFilters(false);
                            setHasSearched(true);
                          }}
                        >
                          <Search className={`h-4 w-4 ${i18n.language === "ar" ? "ml-2" : "mr-2"}`} />
                          {t("applyFilters")}
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </Card>
        </div>

        {/* Chatbot Floating Button - Enhanced */}
        <div className="fixed bottom-6 left-6 z-50 animate-float">
          <div className="relative">
            <Button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="h-14 w-14 rounded-full shadow-elevated bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover-lift relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <Bot className="h-6 w-6 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
              {isBackendOnline && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white animate-pulse-glow" />
              )}
            </Button>
          </div>
        </div>

        {/* Chatbot Panel - Enhanced */}
        {isChatOpen && (
          <div className="fixed bottom-24 left-6 w-96 h-[500px] glass-effect rounded-2xl shadow-elevated z-50 flex flex-col animate-slide-up overflow-hidden">
            {/* Header - رأس المحادثة المحدث */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl flex items-center justify-between relative overflow-hidden shadow-md">
              {/* الخلفية اللامعة */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
                style={{ backgroundSize: "200% 100%" }}
              />

              {/* العنوان */}
              <div className="flex items-center gap-2 relative z-10">
                <Bot className="h-5 w-5 animate-float" />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">المساعد العقاري الذكي</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${isBackendOnline ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
                    />
                    <span className="text-[10px] opacity-90">{isBackendOnline ? "متصل" : "غير متصل"}</span>
                  </div>
                </div>
              </div>

              {/* أزرار التحكم (ريستارت + إغلاق) */}
              <div className="flex items-center gap-1 relative z-10">
                {/* زر الريستارت */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRestartChat}
                      className="h-8 w-8 text-white hover:bg-white/20 rounded-full transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>بدء محادثة جديدة</p>
                  </TooltipContent>
                </Tooltip>

                {/* زر الإغلاق */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation(); // منع تداخل النقرات
                        setIsChatOpen(false);
                      }}
                      className="h-8 w-8 text-white hover:bg-red-500/20 hover:text-red-100 rounded-full transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>إغلاق</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.type === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                      {/* أزرار اختيار نمط البحث */}
                      {msg.criteria && msg.type === "assistant" && (
                        <div className="mt-3 space-y-2">
                          <Button
                            onClick={() => handleSearchModeSelection("exact")}
                            disabled={isChatLoading}
                            className="w-full bg-white text-blue-600 hover:bg-gray-50 border border-blue-600"
                            size="sm"
                          >
                            بس المطابق
                          </Button>
                          <Button
                            onClick={() => handleSearchModeSelection("similar")}
                            disabled={isChatLoading}
                            className="w-full bg-blue-600 text-white hover:bg-blue-700"
                            size="sm"
                          >
                            اللي يشبهه
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Chat Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={isListening ? "...جاري الاستماع" : "اكتب طلبك هنا..."}
                  disabled={isChatLoading || !isBackendOnline || isListening} // تعطيل أثناء الاستماع
                  className="flex-1"
                  dir="rtl"
                />
                {/* --- زر المايكروفون --- */}
                <Button
                  onClick={handleVoiceInput}
                  disabled={isChatLoading || !isBackendOnline || isListening}
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-10 w-10", // حجم موحد
                    isListening && "animate-pulse bg-blue-100 border-blue-300 text-blue-700",
                  )}
                >
                  <Mic className="h-4 w-4" />
                </Button>
                {/* --- زر الإرسال --- */}
                <Button
                  onClick={handleSendMessage}
                  disabled={isChatLoading || !isBackendOnline || !chatInput.trim() || isListening} // تعطيل أثناء الاستماع
                  className="bg-blue-600 hover:bg-blue-700"
                  size="icon" // حجم موحد
                >
                  {isChatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

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
        <Sheet open={showFavorites} onOpenChange={setShowFavorites}>
          <SheetContent side={i18n.language === "ar" ? "left" : "right"} className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                {t("favorites")} ({displayedFavorites.length})
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {displayedFavorites.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t("noFavorites")}</p>
                </div>
              ) : (
                displayedFavorites.map((property, index) => (
                  <Card
                    key={property.id}
                    className="p-4 cursor-pointer hover-lift glass-effect animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => {
                      setSelectedProperty(property);
                      setShowPropertyDialog(true);
                      setShowFavorites(false);
                    }}
                  >
                    <div className="flex gap-3">
                      {property.image_url && (
                        <img
                          src={property.image_url}
                          alt={property.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-sm line-clamp-2">{property.title}</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(property.id);
                            }}
                          >
                            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {property.district}, {property.city}
                        </p>
                        <div className="flex items-center gap-2 text-xs mb-2">
                          {property.rooms && (
                            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10">
                              <Bed className="h-4 w-4 text-primary" />
                              <span className="font-medium">{property.rooms}</span>
                            </span>
                          )}
                          {property.baths && (
                            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10">
                              <Bath className="h-4 w-4 text-primary" />
                              <span className="font-medium">{property.baths}</span>
                            </span>
                          )}
                          {property.area_m2 && (
                            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10">
                              <Maximize className="h-4 w-4 text-primary" />
                              <span className="font-medium">{property.area_m2} m²</span>
                            </span>
                          )}
                        </div>
                        <div className="pt-3 border-t border-border/50">
                          <p className="text-primary font-bold text-xl">
                            {property.price_num} {property.price_currency}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>

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
            <Card className="glass-effect shadow-elevated border-primary/30">
              <div className="p-4">
                <div className="text-center">
                  {isLoading ? (
                    <p className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {t("loading")}
                    </p>
                  ) : displayedProperties.length === 0 ? (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-destructive">{t("noPropertiesFound")}</p>
                      <p className="text-xs text-muted-foreground">{t("tryAdjustingFilters")}</p>
                    </div>
                  ) : (
                    <p className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {`${displayedProperties.length} ${t("propertiesFound")}`}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </APIProvider>
  );
};

export default RealEstateSearch;
