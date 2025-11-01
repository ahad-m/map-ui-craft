import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Search, MapPin, MessageCircle, SlidersHorizontal, X, Sparkles, Languages, ArrowLeft, Bed, Bath, Maximize, School, GraduationCap, Check, ChevronsUpDown, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import riyalEstateLogo from '@/assets/riyal-estate-logo.jpg';
import { PropertyDetailsDialog } from '@/components/PropertyDetailsDialog';
import { useFavorites } from '@/hooks/useFavorites';

const NEIGHBORHOODS = [
  'أبرق الرغامة', 'أم الحمام الشرقي', 'أم الحمام الغربي', 'أم سليم', 'احد', 'اشبيلية',
  'الازدهار', 'الاندلس', 'البادية', 'البديع الغربي', 'البديعة', 'البرية', 'البيان',
  'التعاون', 'الجرادية', 'الجزيرة', 'الجنادرية', 'الحائر', 'الحزم', 'الحمراء',
  'الخالدية', 'الخليج', 'الدار البيضاء', 'الدريهمية', 'الديرة', 'الرائد', 'الراية',
  'الربوة', 'الربيع', 'الرحمانية', 'الرفيعة', 'الرمال', 'الرماية', 'الروابي',
  'الروضة', 'الريان', 'الزاهر', 'الزهراء', 'الزهرة', 'السامر', 'السحاب', 'السد',
  'السعادة', 'السلام', 'السلي', 'السليمانية', 'السويدي', 'السويدي الغربي',
  'الشرفية', 'الشعلة'
];

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
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

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
    maxPrice: 50000000,
    areaMin: 0,
    areaMax: 2000,
    bedrooms: '',
    livingRooms: '',
    bathrooms: '',
    schoolGender: '',
    schoolLevel: '',
    selectedSchool: '',
    selectedUniversity: '',
    nearMetro: false,
    minMetroTime: 5,
    nearHospitals: false,
    nearMosques: false,
  });

  // Fetch properties from Supabase
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties', transactionType, filters, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('purpose', transactionType === 'sale' ? 'للبيع' : 'للايجار')
        .not('final_lat', 'is', null)
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
        const count = filters.bedrooms === '5+' ? 5 : parseInt(filters.bedrooms);
        query = filters.bedrooms === '5+' ? query.gte('rooms', count) : query.eq('rooms', count);
      }
      if (filters.bathrooms) {
        const count = filters.bathrooms === '4+' ? 4 : parseInt(filters.bathrooms);
        query = filters.bathrooms === '4+' ? query.gte('baths', count) : query.eq('baths', count);
      }
      if (filters.livingRooms) {
        const count = filters.livingRooms === '4+' ? 4 : parseInt(filters.livingRooms);
        query = filters.livingRooms === '4+' ? query.gte('halls', count) : query.eq('halls', count);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;

      return (data || []).filter(property => {
        const price = parseFloat(property.price_num?.replace(/,/g, '') || '0');
        const area = parseFloat(property.area_m2?.replace(/,/g, '') || '0');
        const priceMatch = price <= filters.maxPrice;
        const areaMatch = area >= filters.areaMin && area <= filters.areaMax;
        
        let metroMatch = true;
        if (filters.nearMetro && property.time_to_metro_min) {
          const metroTime = parseFloat(property.time_to_metro_min);
          metroMatch = !isNaN(metroTime) && metroTime >= filters.minMetroTime;
        }
        
        return priceMatch && areaMatch && metroMatch;
      });
    },
  });

  // Fetch schools with filters
  const { data: allSchools = [] } = useQuery({
    queryKey: ['schools', filters.schoolGender, filters.schoolLevel],
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
      
      const { data, error } = await query.order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const selectedSchoolData = allSchools.find(school => school.id === filters.selectedSchool);

  // Fetch all universities without gender filter
  const { data: allUniversities = [] } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .not('lat', 'is', null)
        .not('lon', 'is', null)
        .not('name_ar', 'is', null)
        .not('name_en', 'is', null)
        .order('name_ar', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const selectedUniversityData = allUniversities.find(uni => 
    (i18n.language === 'ar' ? uni.name_ar : uni.name_en) === filters.selectedUniversity
  );

  const favoriteProperties = properties.filter(p => favorites.includes(p.id));

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

  // Update map center
  useEffect(() => {
    if (selectedSchoolData) {
      setMapCenter({ lat: selectedSchoolData.lat, lng: selectedSchoolData.lon });
      setMapZoom(15);
    } else if (selectedUniversityData) {
      setMapCenter({ lat: selectedUniversityData.lat, lng: selectedUniversityData.lon });
      setMapZoom(15);
    } else if (properties.length > 0) {
      const lats = properties.map(p => parseFloat(p.final_lat)).filter(lat => !isNaN(lat));
      const lngs = properties.map(p => parseFloat(p.final_lon)).filter(lng => !isNaN(lng));
      
      if (lats.length > 0 && lngs.length > 0) {
        const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
        const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
        setMapCenter({ lat: avgLat, lng: avgLng });
        setMapZoom(12);
      }
    }
  }, [properties, selectedSchoolData, selectedUniversityData]);

  const resetFilters = () => {
    setFilters({
      propertyType: '',
      city: 'الرياض',
      neighborhood: '',
      maxPrice: 50000000,
      areaMin: 0,
      areaMax: 2000,
      bedrooms: '',
      livingRooms: '',
      bathrooms: '',
      schoolGender: '',
      schoolLevel: '',
      selectedSchool: '',
      selectedUniversity: '',
      nearMetro: false,
      minMetroTime: 5,
      nearHospitals: false,
      nearMosques: false,
    });
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
            {properties.map((property) => {
              const lat = parseFloat(property.final_lat);
              const lon = parseFloat(property.final_lon);
              if (isNaN(lat) || isNaN(lon)) return null;
              
              return (
                <AdvancedMarker
                  key={property.id}
                  position={{ lat, lng: lon }}
                  onClick={() => handlePropertyClick(property)}
                >
                  <div className="relative">
                    <Pin
                      background={transactionType === 'sale' ? '#16a34a' : '#0ea5e9'}
                      borderColor={transactionType === 'sale' ? '#15803d' : '#0284c7'}
                      glyphColor={'#ffffff'}
                    />
                    {isFavorite(property.id) && (
                      <Heart className="absolute -top-2 -right-2 h-4 w-4 fill-red-500 text-red-500" />
                    )}
                  </div>
                </AdvancedMarker>
              );
            })}

            {selectedSchoolData && (
              <AdvancedMarker
                key={`school-${selectedSchoolData.id}`}
                position={{ lat: selectedSchoolData.lat, lng: selectedSchoolData.lon }}
              >
                <div className="bg-blue-500 p-2 rounded-full shadow-lg">
                  <School className="h-5 w-5 text-white" />
                </div>
              </AdvancedMarker>
            )}

            {selectedUniversityData && (
              <AdvancedMarker
                key={`university-${selectedUniversityData.name_ar}`}
                position={{ lat: selectedUniversityData.lat, lng: selectedUniversityData.lon }}
              >
                <div className="bg-purple-500 p-2 rounded-full shadow-lg">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
              </AdvancedMarker>
            )}
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
                  <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-gradient-to-b from-card to-card/95">
                    <SheetHeader className="pb-4 border-b border-border">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-5 w-5 text-primary" />
                        <SheetTitle className="text-xl">{t('advancedFilters')}</SheetTitle>
                      </div>
                    </SheetHeader>
                    <div className="space-y-6 mt-6">
                      {/* Property Type */}
                      <div className="space-y-2">
                        <Label>{t('propertyType')}</Label>
                        <Select
                          value={filters.propertyType}
                          onValueChange={(value) => setFilters({ ...filters, propertyType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectPropertyType')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="استوديو">{t('studio')}</SelectItem>
                            <SelectItem value="شقق">{t('apartments')}</SelectItem>
                            <SelectItem value="فلل">{t('villas')}</SelectItem>
                            <SelectItem value="تاون هاوس">{t('townhouse')}</SelectItem>
                            <SelectItem value="دوبلكس">{t('duplex')}</SelectItem>
                            <SelectItem value="دور">{t('floor')}</SelectItem>
                            <SelectItem value="عمائر">{t('buildings')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Neighborhood with Search */}
                      <div className="space-y-2">
                        <Label>{t('neighborhood')}</Label>
                        <Popover open={openNeighborhoodCombobox} onOpenChange={setOpenNeighborhoodCombobox}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              {filters.neighborhood || t('selectNeighborhood')}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0">
                            <Command>
                              <CommandInput placeholder={t('searchNeighborhood')} />
                              <CommandList>
                                <CommandEmpty>{t('noNeighborhoodFound')}</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    onSelect={() => {
                                      setFilters({ ...filters, neighborhood: '' });
                                      setOpenNeighborhoodCombobox(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", !filters.neighborhood ? "opacity-100" : "opacity-0")} />
                                    {t('none')}
                                  </CommandItem>
                                  {NEIGHBORHOODS.map((neighborhood) => (
                                    <CommandItem
                                      key={neighborhood}
                                      value={neighborhood}
                                      onSelect={() => {
                                        setFilters({ ...filters, neighborhood });
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

                      {/* Maximum Price */}
                      <div className="space-y-2">
                        <Label>{t('maxPrice')} (SAR)</Label>
                        <Input
                          type="number"
                          placeholder={t('maxPrice')}
                          value={filters.maxPrice}
                          onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                        />
                      </div>

                      {/* Area Range */}
                      <div className="space-y-2">
                        <Label>{t('areaSize')}</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            placeholder={t('minArea')}
                            value={filters.areaMin}
                            onChange={(e) => setFilters({ ...filters, areaMin: Number(e.target.value) })}
                          />
                          <span>-</span>
                          <Input
                            type="number"
                            placeholder={t('maxArea')}
                            value={filters.areaMax}
                            onChange={(e) => setFilters({ ...filters, areaMax: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      {/* Bedrooms */}
                      <div className="space-y-2">
                        <Label>{t('bedrooms')}</Label>
                        <Select value={filters.bedrooms === 'other' || (filters.bedrooms && !['1', '2', '3', '4', '5+'].includes(filters.bedrooms)) ? 'other' : filters.bedrooms} onValueChange={(value) => setFilters({ ...filters, bedrooms: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectBedrooms')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5+">5+</SelectItem>
                            <SelectItem value="other">{t('other')}</SelectItem>
                          </SelectContent>
                        </Select>
                        {(filters.bedrooms === 'other' || (filters.bedrooms && !['1', '2', '3', '4', '5+', ''].includes(filters.bedrooms))) && (
                          <Input
                            type="number"
                            min="1"
                            placeholder={t('customValue')}
                            value={filters.bedrooms === 'other' ? '' : filters.bedrooms}
                            onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                          />
                        )}
                      </div>

                      {/* Living Rooms */}
                      <div className="space-y-2">
                        <Label>{t('livingRooms')}</Label>
                        <Select value={filters.livingRooms === 'other' || (filters.livingRooms && !['1', '2', '3', '4+'].includes(filters.livingRooms)) ? 'other' : filters.livingRooms} onValueChange={(value) => setFilters({ ...filters, livingRooms: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectLivingRooms')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4+">4+</SelectItem>
                            <SelectItem value="other">{t('other')}</SelectItem>
                          </SelectContent>
                        </Select>
                        {(filters.livingRooms === 'other' || (filters.livingRooms && !['1', '2', '3', '4+', ''].includes(filters.livingRooms))) && (
                          <Input
                            type="number"
                            min="1"
                            placeholder={t('customValue')}
                            value={filters.livingRooms === 'other' ? '' : filters.livingRooms}
                            onChange={(e) => setFilters({ ...filters, livingRooms: e.target.value })}
                          />
                        )}
                      </div>

                      {/* Bathrooms */}
                      <div className="space-y-2">
                        <Label>{t('bathrooms')}</Label>
                        <Select value={filters.bathrooms === 'other' || (filters.bathrooms && !['1', '2', '3', '4+'].includes(filters.bathrooms)) ? 'other' : filters.bathrooms} onValueChange={(value) => setFilters({ ...filters, bathrooms: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectBathrooms')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4+">4+</SelectItem>
                            <SelectItem value="other">{t('other')}</SelectItem>
                          </SelectContent>
                        </Select>
                        {(filters.bathrooms === 'other' || (filters.bathrooms && !['1', '2', '3', '4+', ''].includes(filters.bathrooms))) && (
                          <Input
                            type="number"
                            min="1"
                            placeholder={t('customValue')}
                            value={filters.bathrooms === 'other' ? '' : filters.bathrooms}
                            onChange={(e) => setFilters({ ...filters, bathrooms: e.target.value })}
                          />
                        )}
                      </div>

                      {/* Schools */}
                      <div className="space-y-2">
                        <Label>{t('schools')}</Label>
                        
                        {/* School Gender Filter */}
                        <Select value={filters.schoolGender} onValueChange={(value) => setFilters({ ...filters, schoolGender: value === 'all' ? '' : value })}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('gender')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('all')}</SelectItem>
                            <SelectItem value="Boys">{t('boys')}</SelectItem>
                            <SelectItem value="Girls">{t('girls')}</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* School Level Filter */}
                        <Select value={filters.schoolLevel} onValueChange={(value) => setFilters({ ...filters, schoolLevel: value === 'all_levels' ? '' : value })}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('schoolLevel')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all_levels">{t('allLevels')}</SelectItem>
                            <SelectItem value="all">{t('combined')}</SelectItem>
                            <SelectItem value="nursery">{t('nursery')}</SelectItem>
                            <SelectItem value="kindergarten">{t('kindergarten')}</SelectItem>
                            <SelectItem value="elementary">{t('elementary')}</SelectItem>
                            <SelectItem value="middle">{t('middle')}</SelectItem>
                            <SelectItem value="high">{t('high')}</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* School Selection */}
                        <Popover open={openSchoolCombobox} onOpenChange={setOpenSchoolCombobox}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                              {filters.selectedSchool
                                ? allSchools.find((s) => s.id === filters.selectedSchool)?.name || t('selectSchool')
                                : t('selectSchool')}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0">
                            <Command>
                              <CommandInput placeholder={t('searchSchool')} />
                              <CommandList>
                                <CommandEmpty>{t('noSchoolFound')}</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    onSelect={() => {
                                      setFilters({ ...filters, selectedSchool: '' });
                                      setOpenSchoolCombobox(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", !filters.selectedSchool ? "opacity-100" : "opacity-0")} />
                                    {t('none')}
                                  </CommandItem>
                                  {allSchools.map((school) => (
                                    <CommandItem
                                      key={school.id}
                                      value={`${school.name} ${school.district || ''}`}
                                      onSelect={() => {
                                        setFilters({ ...filters, selectedSchool: school.id || '' });
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

                      {/* Universities */}
                      <div className="space-y-2">
                        <Label>{t('universities')}</Label>
                        
                        {/* University Selection with Search */}
                        <Popover open={openUniversityCombobox} onOpenChange={setOpenUniversityCombobox}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                              {filters.selectedUniversity || t('selectUniversity')}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0">
                            <Command>
                              <CommandInput placeholder={t('searchUniversity')} />
                              <CommandList>
                                <CommandEmpty>{t('noUniversityFound')}</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    onSelect={() => {
                                      setFilters({ ...filters, selectedUniversity: '' });
                                      setOpenUniversityCombobox(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", !filters.selectedUniversity ? "opacity-100" : "opacity-0")} />
                                    {t('none')}
                                  </CommandItem>
                                  {allUniversities.map((uni, index) => {
                                    const uniName = i18n.language === 'ar' ? uni.name_ar : uni.name_en;
                                    return (
                                      <CommandItem
                                        key={index}
                                        value={uniName || ''}
                                        onSelect={() => {
                                          setFilters({ ...filters, selectedUniversity: uniName || '' });
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

                      {/* Proximity Filters */}
                      <div className="space-y-3">
                        <Label>{t('proximityFilters')}</Label>
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
                            <div className="ml-6 space-y-2">
                              <Label className="text-xs">Minimum Distance: {filters.minMetroTime} {t('minutes')}</Label>
                              <Slider
                                value={[filters.minMetroTime]}
                                onValueChange={(value) => setFilters({ ...filters, minMetroTime: value[0] })}
                                min={5}
                                max={30}
                                step={5}
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
                        <Button className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg" onClick={() => setShowFilters(false)}>
                          <Search className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                          {t('applyFilters')}
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <Search className={`h-5 w-5 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {t('search')}
                </Button>
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
        />

        {/* Favorites Sheet */}
        <Sheet open={showFavorites} onOpenChange={setShowFavorites}>
          <SheetContent side={i18n.language === 'ar' ? 'left' : 'right'} className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                {t('favorites')} ({favoriteProperties.length})
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {favoriteProperties.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('noFavorites')}</p>
                </div>
              ) : (
                favoriteProperties.map(property => (
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

        {/* Results Count */}
        {!selectedProperty && (
          <div className="absolute bottom-24 left-4 right-4 z-10">
            <Card className="p-3 bg-card/95 backdrop-blur-sm shadow-elegant border-primary/10">
              <div className="text-center">
                <p className="text-sm font-medium">
                  {isLoading ? t('loading') : `${properties.length} ${t('propertiesFound')}`}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* AI Chatbot Button */}
        <Button
          size="lg"
          className={`fixed bottom-6 z-20 rounded-full h-16 w-16 bg-gradient-to-br from-primary to-accent hover:opacity-90 shadow-glow transition-all hover:scale-110 animate-pulse ${i18n.language === 'ar' ? 'left-6' : 'right-6'}`}
          onClick={() => setShowChatbot(!showChatbot)}
        >
          {showChatbot ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>

        {/* Chatbot Panel */}
        {showChatbot && (
          <Card className={`fixed bottom-24 z-20 w-96 h-[500px] shadow-elegant border-primary/10 bg-gradient-to-b from-card to-card/95 backdrop-blur-md animate-scale-in ${i18n.language === 'ar' ? 'left-6' : 'right-6'}`}>
            <div className="flex flex-col h-full p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">{t('aiAssistant')}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowChatbot(false)}
                  className="hover:bg-primary/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-xl border border-primary/20 animate-fade-in">
                  <p className="text-sm leading-relaxed">
                    {t('helpMessage')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder={t('askQuestion')}
                  className="border-primary/20 focus-visible:ring-primary"
                />
                <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
                  {t('send')}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </APIProvider>
  );
};

export default RealEstateSearch;
