import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { Search, Mic, User, Home, UtensilsCrossed, Shirt, ShoppingBag, Navigation, Languages, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import riyalEstateLogo from '@/assets/riyal-estate-logo.jpg';

const MapScreen = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: 24.7136, lng: 46.6753 });
  const [mapZoom, setMapZoom] = useState(12);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      toast.success(t('searchingFor') || `Searching for: ${searchQuery}`);
      // In a real app, this would geocode the address and update the map
    }
  };

  const handleVoiceSearch = () => {
    toast.info(t('voiceSearchNotAvailable') || 'Voice search is not available yet');
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    if (category === t('home')) {
      navigate('/search');
    } else {
      toast.info(`${t('filtering') || 'Filtering'}: ${category}`);
    }
  };

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMapCenter(newCenter);
          setMapZoom(15);
          toast.success(t('locationFound') || 'Location found');
        },
        () => {
          toast.error(t('locationError') || 'Could not get your location');
        }
      );
    } else {
      toast.error(t('locationNotSupported') || 'Geolocation is not supported');
    }
  };

  const handleContribute = () => {
    toast.info(t('contributeFeature') || 'Contribute feature coming soon');
  };

  const categories = [
    { icon: Home, label: t('home') },
    { icon: UtensilsCrossed, label: t('restaurants') },
    { icon: Shirt, label: t('apparel') },
    { icon: ShoppingBag, label: t('shopping') },
  ];

  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative h-screen w-full overflow-hidden bg-background">
        {/* Top Search Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground ${i18n.language === 'ar' ? 'right-3' : 'left-3'} pointer-events-none`} />
                <Input
                  placeholder={t('searchHere')}
                  className={`h-12 bg-card ${i18n.language === 'ar' ? 'pr-10 pl-10' : 'pl-10 pr-10'}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className={`absolute top-1/2 -translate-y-1/2 h-8 w-8 ${i18n.language === 'ar' ? 'left-1' : 'right-1'}`}
                  onClick={handleVoiceSearch}
                >
                  <Mic className="h-5 w-5 text-muted-foreground" />
                </Button>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="icon" variant="outline" className="h-12 w-12 rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side={i18n.language === 'ar' ? 'left' : 'right'}>
                  <SheetHeader>
                    <SheetTitle>{t('userProfile') || 'User Profile'}</SheetTitle>
                  </SheetHeader>
                  <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">{t('signInToAccess') || 'Sign in to access your profile and preferences'}</p>
                    <Button className="w-full">{t('signIn') || 'Sign In'}</Button>
                  </div>
                </SheetContent>
              </Sheet>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleLanguage}
                className="h-12 w-12 rounded-full"
              >
                <Languages className="h-5 w-5" />
              </Button>
            </div>

            {/* Category Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => (
                <Button
                  key={cat.label}
                  variant={selectedCategory === cat.label ? "default" : "secondary"}
                  className="flex-shrink-0 gap-2"
                  size="sm"
                  onClick={() => handleCategoryClick(cat.label)}
                >
                  <cat.icon className="h-4 w-4" />
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Map View */}
        <div className="absolute inset-0">
          <Map
            center={mapCenter}
            zoom={mapZoom}
            gestureHandling="greedy"
            disableDefaultUI={false}
          />
        </div>

        {/* Floating Controls */}
        <div className={`absolute top-32 z-10 flex flex-col gap-2 ${i18n.language === 'ar' ? 'left-4' : 'right-4'}`}>
          <Button
            size="icon"
            className="h-10 w-10 rounded-full bg-background shadow-lg hover:bg-accent"
            variant="outline"
            onClick={handleMyLocation}
          >
            <Navigation className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            className="h-auto w-auto rounded-full bg-background shadow-lg hover:bg-accent px-3 py-2 text-sm font-medium"
            variant="outline"
            onClick={() => toast.info(t('weatherInfo') || 'Weather: 34°C Clear sky')}
          >
            34°
          </Button>
        </div>

        {/* Latest in the area banner */}
        <div className="absolute bottom-20 left-4 right-4 z-10">
          <Card className="p-3 bg-card/95 backdrop-blur-sm">
            <p className="text-sm font-medium">{t('latestInArea')}</p>
          </Card>
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-background border-t">
          <div className="flex items-center justify-around p-2 pb-safe">
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2 px-4"
              onClick={() => {
                setMapZoom(12);
                toast.info(t('exploreMode') || 'Explore mode');
              }}
            >
              <Search className="h-5 w-5" />
              <span className="text-xs">{t('explore')}</span>
            </Button>

            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2 px-4 text-primary"
              onClick={handleMyLocation}
            >
              <Navigation className="h-5 w-5" />
              <span className="text-xs font-semibold">{t('you')}</span>
            </Button>

            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2 px-4"
              onClick={() => navigate('/search')}
            >
              <img 
                src={riyalEstateLogo} 
                alt="RiyalEstate" 
                className="h-8 w-8 rounded-full object-cover"
              />
              <span className="text-xs font-semibold text-primary">{t('riyalEstate')}</span>
            </Button>

            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2 px-4"
              onClick={handleContribute}
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs">{t('contribute')}</span>
            </Button>
          </div>
        </div>
      </div>
    </APIProvider>
  );
};

export default MapScreen;
