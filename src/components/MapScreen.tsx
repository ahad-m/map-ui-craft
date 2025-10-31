import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { Search, Mic, User, Home, UtensilsCrossed, Shirt, ShoppingBag, Navigation, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import riyalEstateLogo from '@/assets/riyal-estate-logo.jpg';

const MapScreen = () => {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(true);

  const categories = [
    { icon: Home, label: 'Home' },
    { icon: UtensilsCrossed, label: 'Restaurants' },
    { icon: Shirt, label: 'Apparel' },
    { icon: ShoppingBag, label: 'Shopping' },
  ];

  if (showApiInput) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="p-6 max-w-md w-full space-y-4">
          <h2 className="text-xl font-semibold">Enter Google Maps API Key</h2>
          <p className="text-sm text-muted-foreground">
            Get your API key from{' '}
            <a
              href="https://console.cloud.google.com/google/maps-apis"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Google Cloud Console
            </a>
          </p>
          <Input
            type="text"
            placeholder="Your Google Maps API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <Button
            onClick={() => apiKey && setShowApiInput(false)}
            className="w-full"
            disabled={!apiKey}
          >
            Continue
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative h-screen w-full overflow-hidden bg-background">
        {/* Top Search Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search here"
                  className="pl-10 pr-10 h-12 bg-card"
                />
                <Mic className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              <Button size="icon" variant="outline" className="h-12 w-12 rounded-full">
                <User className="h-5 w-5" />
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
        <div className="absolute inset-0">
          <Map
            defaultCenter={{ lat: 24.7136, lng: 46.6753 }}
            defaultZoom={12}
            gestureHandling="greedy"
            disableDefaultUI={false}
          />
        </div>

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
            <p className="text-sm font-medium">Latest in the area</p>
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
              <span className="text-xs">Explore</span>
            </Button>

            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2 px-4 text-primary"
            >
              <Navigation className="h-5 w-5" />
              <span className="text-xs font-semibold">You</span>
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
              <span className="text-xs font-semibold text-primary">RiyalEstate</span>
            </Button>

            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2 px-4"
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs">Contribute</span>
            </Button>
          </div>
        </div>
      </div>
    </APIProvider>
  );
};

export default MapScreen;
