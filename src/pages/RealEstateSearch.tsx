import { useState, useEffect, useRef, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Search, MapPin, MessageCircle, SlidersHorizontal, X, Sparkles, Languages, ArrowLeft, Bed, Bath, Maximize, School, GraduationCap, Check, ChevronsUpDown, Heart, Bot, Send, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import riyalEstateLogo from '@/assets/riyal-estate-logo.jpg';
import { PropertyDetailsDialog } from '@/components/PropertyDetailsDialog';
import { useFavorites } from '@/hooks/useFavorites';
import { useRealEstateAssistant } from '@/hooks/useRealEstateAssistant';

const RealEstateSearch = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [transactionType, setTransactionType] = useState<'rent' | 'sale'>('sale');
  const [searchQuery, setSearchQuery] = useState('');
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
    searchResults: chatSearchResults,
    sendMessage,
    selectSearchMode,
  } = useRealEstateAssistant();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll للرسائل
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set hasSearched when user types in search query
  useEffect(() => {
    if (searchQuery.trim() !== '') {
      setHasSearched(true);
    }
  }, [searchQuery]);

  // تحديث العقارات عند البحث من الـ chatbot
  useEffect(() => {
    if (chatSearchResults.length > 0) {
      // تحديث العقارات المعروضة على الخريطة
      // ملاحظة: قد تحتاج تعديل اسم الدالة حسب الكود الموجود
      // تحديث العقارات من Chatbot
      console.log('🎯 Chatbot Properties:', chatSearchResults);
      console.log('🎯 Chatbot Properties Length:', chatSearchResults.length);
      setChatbotProperties(chatSearchResults);
      setShowChatbotResults(true);
      setHasSearched(true);
      
      // إغلاق الـ chatbot
      // setIsChatOpen(false); // تم تعطيل الإغلاق التلقائي
    }
  }, [chatSearchResults]);

  // دالة إرسال رسالة
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    await sendMessage(chatInput);
    setChatInput('');
  };

  // دالة اختيار نمط البحث
  const handleSearchModeSelection = async (mode: 'exact' | 'similar') => {
    await selectSearchMode(mode);
  };

  

  // Update document direction based on language
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  // Filter states
  const [filters, setFilters] = useState({
    propertyType: '',
    city: 'الرياض',
    neighborhood: '',
    minPrice: 0,
    maxPrice: 0,
    areaMin: 0,
    areaMax: 0,
    bedrooms: '',
    livingRooms: '',
    bathrooms: '',
    schoolGender: '',
    schoolLevel: '',
    selectedSchool: '',
    selectedUniversity: '',
    nearMetro: false,
    minMetroTime: 1,
    nearHospitals: false,
    nearMosques: false,
  });

  // Custom search states for database-wide search
  const [customSearchTerms, setCustomSearchTerms] = useState({
    propertyType: '',
    neighborhood: '',
    school: '',
    university: '',
    schoolGender: '',
    schoolLevel: '',
  });

  const [openPropertyTypeCombobox, setOpenPropertyTypeCombobox] = useState(false);
  const [openSchoolGenderCombobox, setOpenSchoolGenderCombobox] = useState(false);
  const [openSchoolLevelCombobox, setOpenSchoolLevelCombobox] = useState(false);

  // Predefined property types
  const predefinedPropertyTypes = ['استوديو', 'شقق', 'فلل', 'تاون هاوس', 'دوبلكس', 'دور', 'عمائر'];

  // Fetch additional property types from database with custom search
  const { data: additionalPropertyTypes = [] } = useQuery({
    queryKey: ['propertyTypes', customSearchTerms.propertyType],
    queryFn: async () => {
      // Only search database if user has typed something
      if (!customSearchTerms.propertyType) {
        return [];
      }

      let query = supabase
        .from('properties')
        .select('property_type')
        .not('property_type', 'is', null)
        .not('property_type', 'eq', '')
        .ilike('property_type', `%${customSearchTerms.propertyType}%`);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Get unique property types, filter out predefined ones and empty values
      const uniquePropertyTypes = [...new Set(
        data?.map(p => p.property_type?.trim())
          .filter(n => n && n !== '' && !predefinedPropertyTypes.includes(n)) || []
      )];
      return uniquePropertyTypes.sort((a, b) => a.localeCompare(b, 'ar'));
    },
  });

  // Combine predefined and additional property types
  const allPropertyTypes = [...predefinedPropertyTypes, ...additionalPropertyTypes];

  // Fetch unique neighborhoods from Supabase with custom search
  const { data: neighborhoods = [] } = useQuery({
    queryKey: ['neighborhoods', customSearchTerms.neighborhood],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('district')
        .not('district', 'is', null)
        .not('district', 'eq', '');
      
      // If custom search term exists, filter by it
      if (customSearchTerms.neighborhood) {
        query = query.ilike('district', `%${customSearchTerms.neighborhood}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Get unique neighborhoods, filter out empty/null values, and sort
      const uniqueNeighborhoods = [...new Set(
        data?.map(p => p.district?.trim()).filter(n => n && n !== '') || []
      )];
      return uniqueNeighborhoods.sort((a, b) => a.localeCompare(b, 'ar'));
    },
  });

  // Fetch properties from Supabase
    // State للعقارات من Chatbot
  const [chatbotProperties, setChatbotProperties] = useState<any[]>([]);
  const [showChatbotResults, setShowChatbotResults] = useState(false);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties', transactionType, filters, searchQuery, customSearchTerms],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('purpose', transactionType === 'sale' ? 'للبيع' : 'للايجار')
        .not('final_lat', 'is', null) // <-- الفلترة تتم بالـ final_lat في الباك إند
        .not('final_lon', 'is', null);

      if (filters.propertyType) {
        query = query.eq('property_type', filters.propertyType);
      }
      if (filters.neighborhood) {
        query = query.eq('district', filters.neighborhood);
      }
      if (searchQuery) {
        query = query.or(`city.ilike.%${searchQuery}%,district.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
      }
      if (filters.bedrooms) {
        const bedroomsValue = filters.bedrooms;
        if (bedroomsValue !== 'other') {
          const count = parseInt(bedroomsValue);
          if (!isNaN(count)) {
            query = query.eq('rooms', count);
          }
        }
      }
      if (filters.bathrooms) {
        const bathroomsValue = filters.bathrooms;
        if (bathroomsValue !== 'other') {
          const count = parseInt(bathroomsValue);
          if (!isNaN(count)) {
            query = query.eq('baths', count);
          }
        }
      }
      if (filters.livingRooms) {
        const livingRoomsValue = filters.livingRooms;
        if (livingRoomsValue !== 'other') {
          const count = parseInt(livingRoomsValue);
          if (!isNaN(count)) {
            query = query.eq('halls', count);
          }
        }
      }

      const { data, error } = await query.limit(500);
      if (error) throw error;

      return (data || []).filter(property => {
        // Handle numeric types (can be number or string depending on data)
        const priceValue = property.price_num as any;
        const price = typeof priceValue === 'string' 
          ? parseFloat(priceValue.replace(/,/g, '')) 
          : Number(priceValue) || 0;
        const areaValue = property.area_m2 as any;
        const area = typeof areaValue === 'string'
          ? parseFloat(areaValue.replace(/,/g, ''))
          : Number(areaValue) || 0;
        
        // Price matching logic: exact if only one value, range if both values
        let priceMatch = true;
        if (filters.minPrice > 0 && filters.maxPrice > 0) {
          // Both filled: range match
          priceMatch = price >= filters.minPrice && price <= filters.maxPrice;
        } else if (filters.minPrice > 0) {
          // Only min filled: exact match
          priceMatch = price === filters.minPrice;
        } else if (filters.maxPrice > 0) {
          // Only max filled: exact match
          priceMatch = price === filters.maxPrice;
        }
        
        // Area matching logic: exact if only one value, range if both values
        let areaMatch = true;
        if (filters.areaMin > 0 && filters.areaMax > 0) {
          // Both filled: range match
          areaMatch = area >= filters.areaMin && area <= filters.areaMax;
        } else if (filters.areaMin > 0) {
          // Only min filled: exact match
          areaMatch = area === filters.areaMin;
        } else if (filters.areaMax > 0) {
          // Only max filled: exact match
          areaMatch = area === filters.areaMax;
        }
        
        let metroMatch = true;
        if (filters.nearMetro && property.time_to_metro_min) {
          const metroTime = typeof property.time_to_metro_min === 'string'
            ? parseFloat(property.time_to_metro_min)
            : Number(property.time_to_metro_min);
          metroMatch = !isNaN(metroTime) && metroTime <= filters.minMetroTime;
        }
        
        return priceMatch && areaMatch && metroMatch;
      });
    },
  });

  // Predefined school gender options
  const predefinedSchoolGenders = ['Boys', 'Girls'];

  // Fetch additional school genders from database with custom search
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
      
      const uniqueGenders = [...new Set(
        data?.map(s => s.gender?.trim())
          .filter(g => g && g !== '' && !['boys', 'girls'].includes(g.toLowerCase())) || []
      )];
      return uniqueGenders;
    },
  });

  const allSchoolGenders = [...predefinedSchoolGenders, ...additionalSchoolGenders];

  // Predefined school level options
  const predefinedSchoolLevels = ['nursery', 'kindergarten', 'elementary', 'middle', 'high'];

  // Fetch additional school levels from database with custom search
  const { data: additionalSchoolLevels = [] } = useQuery({
    queryKey: ['schoolLevels', customSearchTerms.schoolLevel],
    queryFn: async () => {
      if (!customSearchTerms.schoolLevel) return [];
      
      const { data, error } = await supabase
        .from('schools')
        .select('primary_level')
        .not('primary_level', 'is', null)
        .not('primary_level', 'eq', '')
        .ilike('primary_level', `%${customSearchTerms.schoolLevel}%`);
      
      if (error) throw error;
      
      const uniqueLevels = [...new Set(
        data?.map(s => s.primary_level?.trim())
          .filter(l => l && l !== '' && !predefinedSchoolLevels.includes(l.toLowerCase())) || []
      )];
      return uniqueLevels;
    },
  });

  const allSchoolLevels = [...predefinedSchoolLevels, ...additionalSchoolLevels];

  // Fetch schools with filters and custom search
  const { data: allSchools = [] } = useQuery({
    queryKey: ['schools', filters.schoolGender, filters.schoolLevel, customSearchTerms.school],
    queryFn: async () => {
      let query = supabase
        .from('schools')
        .select('*')
        .not('lat', 'is', null)
        .not('lon', 'is', null)
        .not('name', 'is', null);
      
      if (filters.schoolGender) {
        const genderValue = filters.schoolGender === 'Boys' ? 'boys' : filters.schoolGender === 'Girls' ? 'girls' : 'both';
        query = query.eq('gender', genderValue);
      }
      
      if (filters.schoolLevel) {
        query = query.eq('primary_level', filters.schoolLevel);
      }

      // If custom search term exists, filter by it
      if (customSearchTerms.school) {
        query = query.or(`name.ilike.%${customSearchTerms.school}%,district.ilike.%${customSearchTerms.school}%`);
      }
      
      const { data, error } = await query.order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // حساب المسافة بين نقطتين (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // المسافة بالكيلومتر
  };

  // حساب وقت السفر (بافتراض سرعة متوسطة 30 كم/ساعة في المدينة)
  const calculateTravelTime = (distanceKm: number): number => {
    const avgSpeed = 30; // km/h in city traffic
    return Math.round((distanceKm / avgSpeed) * 60); // تحويل إلى دقائق
  };

  // حساب موقع مركز العقارات المفلترة
  const propertiesCenterLocation = useMemo(() => {
    if (properties.length === 0) return null;
    
    // !! التوحيد: اقرأ من 'lat' و 'lon' (لأن الباك إند يوحدها)
    const validProperties = properties.filter(p => 
      p.lat && p.lon && 
      !isNaN(Number(p.lat)) && !isNaN(Number(p.lon)) &&
      Number(p.lat) !== 0 && Number(p.lon) !== 0
    );
    
    if (validProperties.length === 0) return null;
    
    // حساب متوسط الإحداثيات
    const sumLat = validProperties.reduce((sum, p) => sum + Number(p.lat), 0);
    const sumLon = validProperties.reduce((sum, p) => sum + Number(p.lon), 0);
    
    return {
      lat: sumLat / validProperties.length,
      lon: sumLon / validProperties.length
    };
  }, [properties]);

  // تصفية المدارس لإظهار القريبة فقط (ضمن 30 دقيقة وقت سفر)
  const nearbySchools = useMemo(() => {
    if (!propertiesCenterLocation || allSchools.length === 0) return [];
    
    const MAX_TRAVEL_TIME_MIN = 30; // حد أقصى 30 دقيقة
    return allSchools.filter(school => {
      const distance = calculateDistance(
        propertiesCenterLocation.lat,
        propertiesCenterLocation.lon,
        school.lat,
        school.lon
      );
      const travelTime = calculateTravelTime(distance);
      return travelTime <= MAX_TRAVEL_TIME_MIN;
    });
  }, [allSchools, propertiesCenterLocation]);

  const selectedSchoolData = nearbySchools.find(school => school.id === filters.selectedSchool);

  // Fetch all universities with custom search
  const { data: allUniversities = [] } = useQuery({
    queryKey: ['universities', customSearchTerms.university],
    queryFn: async () => {
      let query = supabase
        .from('universities')
        .select('*')
        .not('lat', 'is', null)
        .not('lon', 'is', null)
        .not('name_ar', 'is', null)
        .not('name_en', 'is', null);

      // If custom search term exists, filter by it
      if (customSearchTerms.university) {
        query = query.or(`name_ar.ilike.%${customSearchTerms.university}%,name_en.ilike.%${customSearchTerms.university}%`);
      }
      
      const { data, error } = await query.order('name_ar', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // تصفية الجامعات لإظهار القريبة فقط (ضمن 30 دقيقة وقت سفر)
  const nearbyUniversities = useMemo(() => {
    if (!propertiesCenterLocation || allUniversities.length === 0) return [];
    
    const MAX_TRAVEL_TIME_MIN = 30; // حد أقصى 30 دقيقة
    return allUniversities.filter(uni => {
      const distance = calculateDistance(
        propertiesCenterLocation.lat,
        propertiesCenterLocation.lon,
        uni.lat,
        uni.lon
      );
      const travelTime = calculateTravelTime(distance);
      return travelTime <= MAX_TRAVEL_TIME_MIN;
    });
  }, [allUniversities, propertiesCenterLocation]);

  const selectedUniversityData = nearbyUniversities.find(uni => 
    (i18n.language === 'ar' ? uni.name_ar : uni.name_en) === filters.selectedUniversity
  );

  // دمج العقارات: إذا فيه نتائج من Chatbot، استخدمها، وإلا استخدم البحث العادي
  const baseProperties = showChatbotResults ? chatbotProperties : properties;

  // ترتيب العقارات بناءً على وقت السفر من المدرسة أو الجامعة المختارة
  const displayedProperties = useMemo(() => {
    const propsToSort = [...baseProperties];
    
    // !! التوحيد: استخدم 'lat' و 'lon'
    if (selectedSchoolData) {
      propsToSort.sort((a, b) => {
        const distA = calculateDistance(
          selectedSchoolData.lat, selectedSchoolData.lon,
          Number(a.lat), Number(a.lon)
        );
        const distB = calculateDistance(
          selectedSchoolData.lat, selectedSchoolData.lon,
          Number(b.lat), Number(b.lon)
        );
        const timeA = calculateTravelTime(distA);
        const timeB = calculateTravelTime(distB);
        return timeA - timeB;
      });
    } else if (selectedUniversityData) {
      propsToSort.sort((a, b) => {
        const distA = calculateDistance(
          selectedUniversityData.lat, selectedUniversityData.lon,
          Number(a.lat), Number(a.lon)
        );
        const distB = calculateDistance(
          selectedUniversityData.lat, selectedUniversityData.lon,
          Number(b.lat), Number(b.lon)
        );
        const timeA = calculateTravelTime(distA);
        const timeB = calculateTravelTime(distB);
        return timeA - timeB;
      });
    }
    
    return propsToSort;
  }, [baseProperties, selectedSchoolData, selectedUniversityData]);

  const displayedFavorites = displayedProperties.filter(p => favorites.includes(p.id));

  const handlePropertyClick = (property: any) => {
    setSelectedProperty(property);
    setShowPropertyDialog(true);
  };

  const handleToggleFavorite = (propertyId: string) => {
    toggleFavorite(propertyId);
    if (isFavorite(propertyId)) {
      toast({ title: t('removedFromFavorites') });
    } else {
      toast({ title: t('addedToFavorites') });
    }
  };

  // Update map center for school/university selection
  useEffect(() => {
    if (!mapRef.current) return;
    
    if (selectedSchoolData) {
      mapRef.current.setCenter({ lat: selectedSchoolData.lat, lng: selectedSchoolData.lon });
      mapRef.current.setZoom(15);
    } else if (selectedUniversityData) {
      mapRef.current.setCenter({ lat: selectedUniversityData.lat, lng: selectedUniversityData.lon });
      mapRef.current.setZoom(15);
    }
  }, [selectedSchoolData, selectedUniversityData]);

  // توجيه الخريطة عند البحث من الشات
  useEffect(() => {
    if (!mapRef.current) return;
    console.log('🗺️ Map useEffect triggered:', { showChatbotResults, chatbotPropertiesLength: chatbotProperties.length });
    if (showChatbotResults && chatbotProperties.length > 0) {
      
      // ================================================
      // !! تعديل رقم 2: فلترة إحداثيات الشات بوت (استخدم lat/lon) !!
      // ================================================
      const lats = chatbotProperties.map(p => Number(p.lat)).filter(lat => !isNaN(lat) && lat !== 0);
      const lngs = chatbotProperties.map(p => Number(p.lon)).filter(lng => !isNaN(lng) && lng !== 0);
      
      if (lats.length > 0 && lngs.length > 0) {
        const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
        const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
        console.log('🗺️ Moving map to:', { lat: avgLat, lng: avgLng, zoom: 13 });
        mapRef.current.setCenter({ lat: avgLat, lng: avgLng });
        mapRef.current.setZoom(13);
      }
    }
  }, [showChatbotResults, chatbotProperties]);

  // توجيه الخريطة عند تغيير نتائج البحث العادية
  useEffect(() => {
    if (!mapRef.current || displayedProperties.length === 0 || !hasSearched) return;
    
    const bounds = new google.maps.LatLngBounds();
    displayedProperties.forEach(property => {
      // !! التوحيد: استخدم 'lat' و 'lon'
      const lat = Number(property.lat);
      const lng = Number(property.lon);
      
      // ================================================
      // !! تعديل رقم 3: فلترة إحداثيات الزووم (استخدم lat/lon) !!
      // ================================================
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        bounds.extend({ lat, lng });
      }
    });
    
    // إضافة تحصين للتأكد أن الحدود ليست فارغة
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds);
    }
  }, [displayedProperties, hasSearched]);

  const resetFilters = () => {
    setFilters({
      propertyType: '',
      city: 'الرياض',
      neighborhood: '',
      minPrice: 0,
      maxPrice: 0,
      areaMin: 0,
      areaMax: 0,
      bedrooms: '',
      livingRooms: '',
      bathrooms: '',
      schoolGender: '',
      schoolLevel: '',
      selectedSchool: '',
      selectedUniversity: '',
      nearMetro: false,
      minMetroTime: 1,
      nearHospitals: false,
      nearMosques: false,
    });
    setCustomSearchTerms({
      propertyType: '',
      neighborhood: '',
      school: '',
      university: '',
      schoolGender: '',
      schoolLevel: '',
    });
    setHasSearched(false);
  };

  // Component to save map reference
  const MapRefHandler = () => {
    const map = useMap();
    useEffect(() => {
      if (map) {
        mapRef.current = map;
      }
    }, [map]);
    return null;
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
            <MapRefHandler />
            {displayedProperties.map((property) => {
              
              // ================================================
              // !! تعديل رقم 1: فلترة الدبابيس (Markers) (استخدم lat/lon) !!
              // ================================================
              // !! التوحيد: استخدم 'lat' و 'lon'
              const lat = Number(property.lat);
              const lon = Number(property.lon);
              // !! الفلترة: تأكد أنها ليست 0,0
              if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) return null;
              
              return (
                <AdvancedMarker
                  key={property.id}
                  position={{ lat, lng: lon }} // <-- الآن هذا الموضع صحيح
                  onClick={() => handlePropertyClick(property)}
                >
                  <div className="relative">
                    <Pin
                      background={transactionType === 'sale' ? '#15803d' : '#22c55e'}
                      borderColor={transactionType === 'sale' ? '#14532d' : '#16a34a'}
                      glyphColor={'#ffffff'}
                    />
                    {isFavorite(property.id) && (
                      <Heart className="absolute -top-2 -right-2 h-4 w-4 fill-red-500 text-red-500" />
                    )}
                  </div>
                </AdvancedMarker>
              );
            })}

            {hasSearched && nearbySchools.map((school) => (
              <AdvancedMarker
                key={`school-${school.id}`}
                position={{ lat: school.lat, lng: school.lon }}
                onClick={() => {
                  setFilters({ ...filters, selectedSchool: school.id });
                }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`p-2 rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110 ${
                      filters.selectedSchool === school.id ? 'bg-green-400 ring-4 ring-green-200' : 'bg-green-300'
                    }`}>
                      <School className="h-5 w-5 text-white" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{school.name}</p>
                  </TooltipContent>
                </Tooltip>
              </AdvancedMarker>
            ))}

            {hasSearched && nearbyUniversities.map((university) => (
              <AdvancedMarker
                key={`university-${university.name_ar}`}
                position={{ lat: university.lat, lng: university.lon }}
                onClick={() => {
                  const uniName = i18n.language === 'ar' ? university.name_ar : university.name_en;
                  setFilters({ ...filters, selectedUniversity: uniName });
                }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`p-2 rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110 ${
                      filters.selectedUniversity === (i18n.language === 'ar' ? university.name_ar : university.name_en) 
                        ? 'bg-green-700 ring-4 ring-green-400' : 'bg-green-600'
                    }`}>
                      <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{i18n.language === 'ar' ? university.name_ar : university.name_en}</p>
                  </TooltipContent>
                </Tooltip>
              </AdvancedMarker>
            ))}
          </Map>
        </div>

        {/* Top Search Bar */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <Card className="p-6 bg-card/98 backdrop-blur-md shadow-elegant border-primary/10 animate-fade-in">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/')}
                  className="hover:bg-primary/10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <img 
                  src={riyalEstateLogo} 
                  alt="RiyalEstate" 
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
                />
                <div className="flex-1">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {t('riyalEstate')}
                  </h1>
                  <p className="text-xs text-muted-foreground">{t('propertySearch')}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFavorites(true)}
                    className="gap-2 relative"
                  >
                    <Heart className={`h-4 w-4 ${favorites.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                    {favorites.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {favorites.length}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleLanguage}
                    className="gap-2"
                  >
                    <Languages className="h-4 w-4" />
                    {i18n.language === 'en' ? 'ع' : 'EN'}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={transactionType === 'sale' ? 'default' : 'outline'}
                  className={`flex-1 transition-all ${
                    transactionType === 'sale' 
                      ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setTransactionType('sale')}
                >
                  {t('forSale')}
                </Button>
                <Button
                  variant={transactionType === 'rent' ? 'default' : 'outline'}
                  className={`flex-1 transition-all ${
                    transactionType === 'rent' 
                      ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setTransactionType('rent')}
                >
                  {t('forRent')}
                </Button>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 relative group">
                  <MapPin className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-primary transition-colors ${i18n.language === 'ar' ? 'right-3' : 'left-3'}`} />
                  <Input
                    placeholder={t('searchLocation')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`bg-background border-border focus-visible:ring-primary focus-visible:border-primary transition-all ${i18n.language === 'ar' ? 'pr-10' : 'pl-10'}`}
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
                      <span className="relative z-10">{t('advancedFilters')}</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-background/98 backdrop-blur-md">
                    <SheetHeader className="pb-6 border-b-2 border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <SlidersHorizontal className="h-5 w-5 text-primary" />
                        </div>
                        <SheetTitle className="text-2xl font-bold">{t('advancedFilters')}</SheetTitle>
                      </div>
                    </SheetHeader>
                    
                    <div className="space-y-8 mt-6 pb-4">
                      {/* Property Details Section */}
                      <div className="space-y-4 p-4 rounded-lg border border-border bg-card/50">
                        <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                          <div className="p-1.5 rounded-md bg-primary/15">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          {t('propertyDetails')}
                        </h3>
                        
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t('propertyType')}</Label>
                            <Popover open={openPropertyTypeCombobox} onOpenChange={setOpenPropertyTypeCombobox}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between bg-background hover:bg-accent"
                                >
                                  {filters.propertyType || t('selectPropertyType')}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0 z-[100]">
                                <Command>
                                  <CommandInput 
                                    placeholder={t('propertyType')} 
                                    onValueChange={(value) => {
                                      setCustomSearchTerms({ ...customSearchTerms, propertyType: value });
                                    }}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      {allPropertyTypes.length === 0 ? t('notFound') : t('selectPropertyType')}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      <CommandItem
                                        onSelect={() => {
                                          setFilters({ ...filters, propertyType: '' });
                                          setCustomSearchTerms({ ...customSearchTerms, propertyType: '' });
                                          setOpenPropertyTypeCombobox(false);
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", !filters.propertyType ? "opacity-100" : "opacity-0")} />
                                        {t('none')}
                                      </CommandItem>
                                      {allPropertyTypes.map((type) => (
                                        <CommandItem
                                          key={type}
                                          value={type}
                                          onSelect={() => {
                                            setFilters({ ...filters, propertyType: type });
                                            setCustomSearchTerms({ ...customSearchTerms, propertyType: '' });
                                            setOpenPropertyTypeCombobox(false);
                                          }}
                                        >
                                          <Check className={cn("mr-2 h-4 w-4", filters.propertyType === type ? "opacity-100" : "opacity-0")} />
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
                            <Label className="text-sm font-medium">{t('neighborhood')}</Label>
                            <Popover open={openNeighborhoodCombobox} onOpenChange={setOpenNeighborhoodCombobox}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between bg-background hover:bg-accent"
                                >
                                  {filters.neighborhood || t('selectNeighborhood')}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0 z-[100]">
                                <Command>
                                  <CommandInput 
                                    placeholder={t('searchNeighborhood')} 
                                    onValueChange={(value) => {
                                      setCustomSearchTerms({ ...customSearchTerms, neighborhood: value });
                                    }}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      {neighborhoods.length === 0 ? t('notFound') : t('noNeighborhoodFound')}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      <CommandItem
                                        onSelect={() => {
                                          setFilters({ ...filters, neighborhood: '' });
                                          setCustomSearchTerms({ ...customSearchTerms, neighborhood: '' });
                                          setOpenNeighborhoodCombobox(false);
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", !filters.neighborhood ? "opacity-100" : "opacity-0")} />
                                        {t('none')}
                                      </CommandItem>
                                      {neighborhoods.map((neighborhood) => (
                                        <CommandItem
                                          key={neighborhood}
                                          value={neighborhood}
                                          onSelect={() => {
                                            setFilters({ ...filters, neighborhood });
                                            setCustomSearchTerms({ ...customSearchTerms, neighborhood: '' });
                                            setOpenNeighborhoodCombobox(false);
                                          }}
                                        >
                                          <Check className={cn("mr-2 h-4 w-4", filters.neighborhood === neighborhood ? "opacity-100" : "opacity-0")} />
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
                      <div className="space-y-4 p-4 rounded-lg border border-border bg-card/50">
                        <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                          <div className="p-1.5 rounded-md bg-primary/15">
                            <Maximize className="h-4 w-4 text-primary" />
                          </div>
                          {t('priceAndArea')}
                        </h3>
                        
                        <div className="space-y-3">
                          {/* Price Range */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t('price')} (SAR)</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{t('min')}</Label>
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder={t('min')}
                                    value={filters.minPrice || ''}
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
                                <Label className="text-xs text-muted-foreground">{t('max')}</Label>
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder={t('max')}
                                    value={filters.maxPrice || ''}
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
                            <Label className="text-sm font-medium">{t('areaSize')} (م²)</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{t('min')}</Label>
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder={t('min')}
                                    value={filters.areaMin || ''}
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
                                <Label className="text-xs text-muted-foreground">{t('max')}</Label>
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder={t('max')}
                                    value={filters.areaMax || ''}
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
                      <div className="space-y-4 p-4 rounded-lg border border-border bg-card/50">
                        <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                          <div className="p-1.5 rounded-md bg-primary/15">
                            <Bed className="h-4 w-4 text-primary" />
                          </div>
                          {t('roomDetails')}
                        </h3>
                        
                        <div className="space-y-3">
                          {/* Bedrooms */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t('bedrooms')}</Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                min="0"
                                placeholder={t('bedrooms')}
                                value={filters.bedrooms || ''}
                                onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                                className="bg-background flex-1"
                              />
                              {filters.bedrooms && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setFilters({ ...filters, bedrooms: '' })}
                                  className="shrink-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Living Rooms */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t('livingRooms')}</Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                min="0"
                                placeholder={t('livingRooms')}
                                value={filters.livingRooms || ''}
                                onChange={(e) => setFilters({ ...filters, livingRooms: e.target.value })}
                                className="bg-background flex-1"
                              />
                              {filters.livingRooms && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setFilters({ ...filters, livingRooms: '' })}
                                  className="shrink-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Bathrooms */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t('bathrooms')}</Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                min="0"
                                placeholder={t('bathrooms')}
                                value={filters.bathrooms || ''}
                                onChange={(e) => setFilters({ ...filters, bathrooms: e.target.value })}
                                className="bg-background flex-1"
                              />
                              {filters.bathrooms && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setFilters({ ...filters, bathrooms: '' })}
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
                      <div className="space-y-4 p-4 rounded-lg border border-border bg-card/50">
                        <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                          <div className="p-1.5 rounded-md bg-primary/15">
                            <School className="h-4 w-4 text-primary" />
                          </div>
                          {t('education')}
                        </h3>
                        
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t('schools')}</Label>
                            
                            {/* School Gender Filter */}
                            <Popover open={openSchoolGenderCombobox} onOpenChange={setOpenSchoolGenderCombobox}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between bg-background hover:bg-accent"
                                >
                                  {filters.schoolGender === 'Boys' ? t('boys') : filters.schoolGender === 'Girls' ? t('girls') : filters.schoolGender || t('gender')}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0 z-[100]">
                                <Command>
                                  <CommandInput 
                                    placeholder={t('gender')}
                                    onValueChange={(value) => {
                                      setCustomSearchTerms({ ...customSearchTerms, schoolGender: value });
                                    }}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      {allSchoolGenders.length === 0 ? t('notFound') : t('gender')}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      <CommandItem
                                        onSelect={() => {
                                          setFilters({ ...filters, schoolGender: '' });
                                          setCustomSearchTerms({ ...customSearchTerms, schoolGender: '' });
                                          setOpenSchoolGenderCombobox(false);
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", !filters.schoolGender ? "opacity-100" : "opacity-0")} />
                                        {t('all')}
                                      </CommandItem>
                                      {allSchoolGenders.map((gender) => (
                                        <CommandItem
                                          key={gender}
                                          value={gender}
                                          onSelect={() => {
                                            setFilters({ ...filters, schoolGender: gender });
                                            setCustomSearchTerms({ ...customSearchTerms, schoolGender: '' });
                                            setOpenSchoolGenderCombobox(false);
                                          }}
                                        >
                                          <Check className={cn("mr-2 h-4 w-4", filters.schoolGender === gender ? "opacity-100" : "opacity-0")} />
                                          {gender === 'Boys' ? t('boys') : gender === 'Girls' ? t('girls') : gender}
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
                                  {filters.schoolLevel === 'nursery' ? t('nursery') :
                                    filters.schoolLevel === 'kindergarten' ? t('kindergarten') :
                                    filters.schoolLevel === 'elementary' ? t('elementary') :
                                    filters.schoolLevel === 'middle' ? t('middle') :
                                    filters.schoolLevel === 'high' ? t('high') :
                                    filters.schoolLevel || t('schoolLevel')}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0 z-[100]">
                                <Command>
                                  <CommandInput 
                                    placeholder={t('schoolLevel')}
                                    onValueChange={(value) => {
                                      setCustomSearchTerms({ ...customSearchTerms, schoolLevel: value });
                                    }}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      {allSchoolLevels.length === 0 ? t('notFound') : t('schoolLevel')}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      <CommandItem
                                        onSelect={() => {
                                          setFilters({ ...filters, schoolLevel: '' });
                                          setCustomSearchTerms({ ...customSearchTerms, schoolLevel: '' });
                                          setOpenSchoolLevelCombobox(false);
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", !filters.schoolLevel ? "opacity-100" : "opacity-0")} />
                                        {t('combined')}
                                      </CommandItem>
                                      {allSchoolLevels.map((level) => (
                                        <CommandItem
                                          key={level}
                                          value={level}
                                          onSelect={() => {
                                            setFilters({ ...filters, schoolLevel: level });
                                            setCustomSearchTerms({ ...customSearchTerms, schoolLevel: '' });
                                            setOpenSchoolLevelCombobox(false);
                                          }}
                                        >
                                          <Check className={cn("mr-2 h-4 w-4", filters.schoolLevel === level ? "opacity-100" : "opacity-0")} />
                                          {level === 'nursery' ? t('nursery') :
                                            level === 'kindergarten' ? t('kindergarten') :
                                            level === 'elementary' ? t('elementary') :
                                            level === 'middle' ? t('middle') :
                                            level === 'high' ? t('high') :
                                            level}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>

                            {/* School Selection */}
                            <Popover open={openSchoolCombobox} onOpenChange={setOpenSchoolCombobox}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="w-full justify-between bg-background hover:bg-accent">
                                  {filters.selectedSchool
                                    ? nearbySchools.find((s) => s.id === filters.selectedSchool)?.name || t('selectSchool')
                                    : t('selectSchool')}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0 z-[100]">
                                <Command>
                                  <CommandInput 
                                    placeholder={t('searchSchool')} 
                                    onValueChange={(value) => {
                                      setCustomSearchTerms({ ...customSearchTerms, school: value });
                                    }}
                                  />
                                   <CommandList>
                                    <CommandEmpty>
                                      {nearbySchools.length === 0 ? t('noNearbySchools') || 'No nearby schools found' : t('noSchoolFound')}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      <CommandItem
                                        onSelect={() => {
                                          setFilters({ ...filters, selectedSchool: '' });
                                          setCustomSearchTerms({ ...customSearchTerms, school: '' });
                                          setOpenSchoolCombobox(false);
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", !filters.selectedSchool ? "opacity-100" : "opacity-0")} />
                                        {t('none')}
                                      </CommandItem>
                                      {nearbySchools.map((school) => (
                                        <CommandItem
                                          key={school.id}
                                          value={`${school.name} ${school.district || ''}`}
                                          onSelect={() => {
                                            setFilters({ ...filters, selectedSchool: school.id || '' });
                                            setCustomSearchTerms({ ...customSearchTerms, school: '' });
                                            setOpenSchoolCombobox(false);
                                          }}
                                        >
                                          <Check className={cn("mr-2 h-4 w-4", filters.selectedSchool === school.id ? "opacity-100" : "opacity-0")} />
                                          {school.name} {school.district ? `- ${school.district}` : ''}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t('universities')}</Label>
                            
                            {/* University Selection with Search */}
                            <Popover open={openUniversityCombobox} onOpenChange={setOpenUniversityCombobox}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="w-full justify-between bg-background hover:bg-accent">
                                  {filters.selectedUniversity || t('selectUniversity')}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0 z-[100]">
                                <Command>
                                  <CommandInput 
                                    placeholder={t('searchUniversity')} 
                                    onValueChange={(value) => {
                                      setCustomSearchTerms({ ...customSearchTerms, university: value });
                                    }}
                                  />
                                   <CommandList>
                                    <CommandEmpty>
                                      {nearbyUniversities.length === 0 ? t('noNearbyUniversities') || 'No nearby universities found' : t('noUniversityFound')}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      <CommandItem
                                        onSelect={() => {
                                          setFilters({ ...filters, selectedUniversity: '' });
                                          setCustomSearchTerms({ ...customSearchTerms, university: '' });
                                          setOpenUniversityCombobox(false);
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", !filters.selectedUniversity ? "opacity-100" : "opacity-0")} />
                                        {t('none')}
                                      </CommandItem>
                                      {nearbyUniversities.map((uni, index) => {
                                        const uniName = i18n.language === 'ar' ? uni.name_ar : uni.name_en;
                                        return (
                                          <CommandItem
                                            key={index}
                                            value={uniName || ''}
                                            onSelect={() => {
                                              setFilters({ ...filters, selectedUniversity: uniName || '' });
                                              setCustomSearchTerms({ ...customSearchTerms, university: '' });
                                              setOpenUniversityCombobox(false);
                                            }}
                                          >
                                            <Check className={cn("mr-2 h-4 w-4", filters.selectedUniversity === uniName ? "opacity-100" : "opacity-0")} />
                                            {uniName}
                                          </CommandItem>
                                        );
                                      })}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>

                      {/* Proximity Filters Section */}
                      <div className="space-y-4 p-4 rounded-lg border border-border bg-card/50">
                        <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                          <div className="p-1.5 rounded-md bg-primary/15">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          {t('proximityFilters')}
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="metro"
                              checked={filters.nearMetro}
                              onCheckedChange={(checked) => setFilters({ ...filters, nearMetro: checked as boolean })}
                            />
                            <label htmlFor="metro" className="text-sm cursor-pointer">
                              {t('nearMetro')} ({filters.minMetroTime} {t('minutes')} minimum)
                            </label>
                          </div>
                          {filters.nearMetro && (
                            <div className="ml-6 space-y-2 p-3 bg-background/50 rounded-lg">
                              <Label className="text-xs font-medium">
                                {t('maxMetroDistance')}: {filters.minMetroTime} {t('minutes')}
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
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={resetFilters}>
                          <X className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                          {t('resetFilters')}
                        </Button>
                        <Button 
                          className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg" 
                          onClick={() => {
                            setShowFilters(false);
                            setHasSearched(true);
                          }}
                        >
                          <Search className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                          {t('applyFilters')}
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
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
          selectedSchool={selectedSchoolData ? {
            name: selectedSchoolData.name,
            lat: selectedSchoolData.lat,
            lon: selectedSchoolData.lon
          } : null}
          selectedUniversity={selectedUniversityData ? {
            name: i18n.language === 'ar' ? selectedUniversityData.name_ar : selectedUniversityData.name_en,
            lat: selectedUniversityData.lat,
            lon: selectedUniversityData.lon
          } : null}
        />

        {/* Favorites Sheet */}
        <Sheet open={showFavorites} onOpenChange={setShowFavorites}>
          <SheetContent side={i18n.language === 'ar' ? 'left' : 'right'} className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                {t('favorites')} ({displayedFavorites.length})
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {displayedFavorites.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('noFavorites')}</p>
                </div>
              ) : (
                displayedFavorites.map(property => (
                  <Card
                    key={property.id}
                    className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
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
                            <span className="flex items-center gap-1">
                              <Bed className="h-3 w-3" /> {property.rooms}
                            </span>
                          )}
                          {property.baths && (
                            <span className="flex items-center gap-1">
                              <Bath className="h-3 w-3" /> {property.baths}
                            </span>
                          )}
                          {property.area_m2 && (
                            <span className="flex items-center gap-1">
                              <Maximize className="h-3 w-3" /> {property.area_m2} m²
                            </span>
                          )}
                        </div>
                        <p className="text-primary font-bold">
                          {property.price_num} {property.price_currency}
                        </p>
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
              }}
              variant="outline"
              className="bg-white/95 backdrop-blur-sm shadow-lg"
            >
              <X className="h-4 w-4 mr-2" />
              {i18n.language === 'ar' ? 'إلغاء نتائج المساعد' : 'Clear Assistant Results'}
            </Button>
          </div>
        )}

        {/* Results Count */}
        {!selectedProperty && hasSearched && (
          <div className="absolute bottom-24 left-4 right-4 z-10">
            <Card className="p-3 bg-card/95 backdrop-blur-sm shadow-elegant border-primary/10">
              <div className="text-center">
                <p className="text-sm font-medium">
                  {isLoading ? t('loading') : `${displayedProperties.length} ${t('propertiesFound')}`}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Chatbot Floating Button */}
        <div className="fixed bottom-6 left-6 z-50">
          <Button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 relative"
          >
            <Bot className="h-6 w-6 text-white" />
            {isBackendOnline && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
            )}
          </Button>
        </div>

        {/* Chatbot Panel */}
        {isChatOpen && (
          <div className="fixed bottom-24 left-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <span className="font-semibold">المساعد العقاري الذكي</span>
              </div>
              <div className="flex items-center gap-2">
                {isBackendOnline ? (
                  <span className="text-xs bg-green-500 px-2 py-1 rounded-full">متصل</span>
                ) : (
                  <span className="text-xs bg-red-500 px-2 py-1 rounded-full">غير متصل</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChatOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      
                      {/* أزرار اختيار نمط البحث */}
                      {msg.criteria && msg.type === 'assistant' && (
                        <div className="mt-3 space-y-2">
                          <Button
                            onClick={() => handleSearchModeSelection('exact')}
                            disabled={isChatLoading}
                            className="w-full bg-white text-blue-600 hover:bg-gray-50 border border-blue-600"
                            size="sm"
                          >
                            بس المطابق
                          </Button>
                          <Button
                            onClick={() => handleSearchModeSelection('similar')}
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

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="اكتب طلبك هنا..."
                  disabled={isChatLoading || !isBackendOnline}
                  className="flex-1"
                  dir="rtl"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isChatLoading || !isBackendOnline || !chatInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isChatLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </APIProvider>
  );
};

export default RealEstateSearch;
