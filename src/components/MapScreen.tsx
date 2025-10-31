import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Search, Mic, User, Home, UtensilsCrossed, Shirt, ShoppingBag, Navigation, Plus, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import riyalEstateLogo from '@/assets/riyal-estate-logo.jpg';

const MapScreen = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(true);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  const categories = [
    { icon: Home, label: t('home') },
    { icon: UtensilsCrossed, label: t('restaurants') },
    { icon: Shirt, label: t('apparel') },
    { icon: ShoppingBag, label: t('shopping') },
  ];

  // Sample locations for markers
  const locations = [
    { lat: 24.7136, lng: 46.6753, title: 'Riyadh Center' },
    { lat: 24.7242, lng: 46.6819, title: 'Al Olaya District' },
    { lat: 24.7017, lng: 46.6590, title: 'Kingdom Tower' },
    { lat: 24.7300, lng: 46.6500, title: 'Diplomatic Quarter' },
  ];

  useEffect(() => {
    if (!mapContainer.current || !apiKey || map.current) return;

    mapboxgl.accessToken = apiKey;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [46.6753, 24.7136],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add markers
    locations.forEach((location) => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.backgroundImage = 'url(https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png)';
      el.style.backgroundSize = 'cover';
      el.style.cursor = 'pointer';

      new mapboxgl.Marker(el)
        .setLngLat([location.lng, location.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>${location.title}</h3>`))
        .addTo(map.current!);
    });

    return () => {
      map.current?.remove();
    };
  }, [apiKey]);

  if (showApiInput) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="p-6 max-w-md w-full space-y-4">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="absolute top-4 right-4 gap-2"
          >
            <Languages className="h-4 w-4" />
            {i18n.language === 'en' ? 'العربية' : 'English'}
          </Button>
          <h2 className="text-xl font-semibold">Enter Mapbox Access Token</h2>
          <p className="text-sm text-muted-foreground">
            Get your free token from{' '}
            <a
              href="https://account.mapbox.com/access-tokens/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Mapbox Dashboard
            </a>
          </p>
          <Input
            type="text"
            placeholder="Your Mapbox Access Token"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <Button
            onClick={() => apiKey && setShowApiInput(false)}
            className="w-full"
            disabled={!apiKey}
          >
            {t('continue')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Top Search Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground ${i18n.language === 'ar' ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={t('searchHere')}
                className={`h-12 bg-card ${i18n.language === 'ar' ? 'pr-10 pl-10' : 'pl-10 pr-10'}`}
              />
              <Mic className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground ${i18n.language === 'ar' ? 'left-3' : 'right-3'}`} />
            </div>
            <Button size="icon" variant="outline" className="h-12 w-12 rounded-full">
              <User className="h-5 w-5" />
            </Button>
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
                variant="secondary"
                className="flex-shrink-0 gap-2"
                size="sm"
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Map View */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Floating Controls */}
      <div className="absolute top-32 right-4 z-10 flex flex-col gap-2">
        <Button
          size="icon"
          className="h-10 w-10 rounded-full bg-background shadow-lg hover:bg-accent"
          variant="outline"
        >
          <Navigation className="h-5 w-5" />
        </Button>
        <div className="bg-background rounded-full px-3 py-2 shadow-lg text-sm font-medium">
          34°
        </div>
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
          >
            <Search className="h-5 w-5" />
            <span className="text-xs">{t('explore')}</span>
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2 px-4 text-primary"
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
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs">{t('contribute')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MapScreen;
