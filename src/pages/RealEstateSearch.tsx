import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Search, MapPin, MessageCircle, SlidersHorizontal, X, Sparkles, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import riyalEstateLogo from '@/assets/riyal-estate-logo.jpg';

const RealEstateSearch = () => {
  const { t, i18n } = useTranslation();
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(true);
  const [transactionType, setTransactionType] = useState<'rent' | 'sale'>('sale');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

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
    city: '',
    neighborhood: '',
    priceMin: 0,
    priceMax: 10000000,
    areaMin: 0,
    areaMax: 1000,
    bedrooms: '',
    livingRooms: '',
    bathrooms: '',
    nearSchools: false,
    nearUniversities: false,
    nearHospitals: false,
    nearMosques: false,
  });

  if (showApiInput) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Card className="p-8 max-w-md w-full space-y-6 shadow-elegant border-0 bg-gradient-to-b from-card to-card/50 backdrop-blur-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="absolute top-4 right-4 gap-2"
          >
            <Languages className="h-4 w-4" />
            {i18n.language === 'en' ? 'العربية' : 'English'}
          </Button>
          <div className="flex items-center justify-center mb-4">
            <img 
              src={riyalEstateLogo} 
              alt="RiyalEstate" 
              className="h-20 w-20 rounded-full object-cover ring-4 ring-primary/20"
            />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('welcome')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('enterApiKey')}
            </p>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Get your API key from{' '}
            <a
              href="https://console.cloud.google.com/google/maps-apis"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-accent transition-colors"
            >
              Google Cloud Console
            </a>
          </p>
          <Input
            type="text"
            placeholder={t('apiKeyPlaceholder')}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="border-primary/20 focus-visible:ring-primary"
          />
          <Button
            onClick={() => apiKey && setShowApiInput(false)}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg"
            disabled={!apiKey}
          >
            <Sparkles className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {t('continue')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative h-screen w-full overflow-hidden">
        {/* Map Background */}
        <div className="absolute inset-0">
          <Map
            defaultCenter={{ lat: 24.7136, lng: 46.6753 }}
            defaultZoom={12}
            mapId="real-estate-map"
            gestureHandling="greedy"
            disableDefaultUI={false}
          />
        </div>

        {/* Top Search Bar */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <Card className="p-6 bg-card/98 backdrop-blur-md shadow-elegant border-primary/10 animate-fade-in">
            <div className="flex flex-col gap-4">
              {/* Logo, Title and Language Toggle */}
              <div className="flex items-center gap-3 pb-3 border-b border-border">
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

              {/* Transaction Type Toggle */}
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

              {/* Search Input */}
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
                      variant="outline" 
                      size="icon"
                      className="hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all"
                    >
                      <SlidersHorizontal className="h-5 w-5" />
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
                          onValueChange={(value) =>
                            setFilters({ ...filters, propertyType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectPropertyType')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="apartment">{t('apartment')}</SelectItem>
                            <SelectItem value="villa">{t('villa')}</SelectItem>
                            <SelectItem value="land">{t('land')}</SelectItem>
                            <SelectItem value="commercial">{t('commercial')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* City */}
                      <div className="space-y-2">
                        <Label>{t('city')}</Label>
                        <Input
                          placeholder={t('enterCity')}
                          value={filters.city}
                          onChange={(e) =>
                            setFilters({ ...filters, city: e.target.value })
                          }
                        />
                      </div>

                      {/* Neighborhood */}
                      <div className="space-y-2">
                        <Label>{t('neighborhood')}</Label>
                        <Input
                          placeholder={t('enterNeighborhood')}
                          value={filters.neighborhood}
                          onChange={(e) =>
                            setFilters({ ...filters, neighborhood: e.target.value })
                          }
                        />
                      </div>

                      {/* Price Range */}
                      <div className="space-y-2">
                        <Label>{t('priceRange')}</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            placeholder={t('minPrice')}
                            value={filters.priceMin}
                            onChange={(e) =>
                              setFilters({ ...filters, priceMin: Number(e.target.value) })
                            }
                          />
                          <span>-</span>
                          <Input
                            type="number"
                            placeholder={t('maxPrice')}
                            value={filters.priceMax}
                            onChange={(e) =>
                              setFilters({ ...filters, priceMax: Number(e.target.value) })
                            }
                          />
                        </div>
                      </div>

                      {/* Area Range */}
                      <div className="space-y-2">
                        <Label>{t('areaSize')}</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            placeholder={t('minArea')}
                            value={filters.areaMin}
                            onChange={(e) =>
                              setFilters({ ...filters, areaMin: Number(e.target.value) })
                            }
                          />
                          <span>-</span>
                          <Input
                            type="number"
                            placeholder={t('maxArea')}
                            value={filters.areaMax}
                            onChange={(e) =>
                              setFilters({ ...filters, areaMax: Number(e.target.value) })
                            }
                          />
                        </div>
                      </div>

                      {/* Bedrooms */}
                      <div className="space-y-2">
                        <Label>{t('bedrooms')}</Label>
                        <Select
                          value={filters.bedrooms}
                          onValueChange={(value) =>
                            setFilters({ ...filters, bedrooms: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectBedrooms')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5+">5+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Living Rooms */}
                      <div className="space-y-2">
                        <Label>{t('livingRooms')}</Label>
                        <Select
                          value={filters.livingRooms}
                          onValueChange={(value) =>
                            setFilters({ ...filters, livingRooms: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectLivingRooms')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4+">4+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Bathrooms */}
                      <div className="space-y-2">
                        <Label>{t('bathrooms')}</Label>
                        <Select
                          value={filters.bathrooms}
                          onValueChange={(value) =>
                            setFilters({ ...filters, bathrooms: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectBathrooms')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4+">4+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Proximity Filters */}
                      <div className="space-y-3">
                        <Label>{t('proximityFilters')}</Label>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="schools"
                              checked={filters.nearSchools}
                              onCheckedChange={(checked) =>
                                setFilters({ ...filters, nearSchools: checked as boolean })
                              }
                            />
                            <label htmlFor="schools" className="text-sm cursor-pointer">
                              {t('nearSchools')}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="universities"
                              checked={filters.nearUniversities}
                              onCheckedChange={(checked) =>
                                setFilters({ ...filters, nearUniversities: checked as boolean })
                              }
                            />
                            <label htmlFor="universities" className="text-sm cursor-pointer">
                              {t('nearUniversities')}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="hospitals"
                              checked={filters.nearHospitals}
                              onCheckedChange={(checked) =>
                                setFilters({ ...filters, nearHospitals: checked as boolean })
                              }
                            />
                            <label htmlFor="hospitals" className="text-sm cursor-pointer">
                              {t('nearHospitals')}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="mosques"
                              checked={filters.nearMosques}
                              onCheckedChange={(checked) =>
                                setFilters({ ...filters, nearMosques: checked as boolean })
                              }
                            />
                            <label htmlFor="mosques" className="text-sm cursor-pointer">
                              {t('nearMosques')}
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Apply Filters Button */}
                      <Button 
                        className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg" 
                        onClick={() => setShowFilters(false)}
                      >
                        <Search className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                        {t('applyFilters')}
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
                <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg">
                  <Search className={`h-5 w-5 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {t('search')}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Chatbot Button */}
        <Button
          size="lg"
          className={`fixed bottom-6 z-20 rounded-full h-16 w-16 bg-gradient-to-br from-primary to-accent hover:opacity-90 shadow-glow transition-all hover:scale-110 animate-pulse ${i18n.language === 'ar' ? 'left-6' : 'right-6'}`}
          onClick={() => setShowChatbot(!showChatbot)}
        >
          {showChatbot ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
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
