import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Search, MapPin, MessageCircle, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const RealEstateSearch = () => {
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(true);
  const [transactionType, setTransactionType] = useState<'rent' | 'sale'>('sale');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

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
          <Card className="p-4 bg-card/95 backdrop-blur-sm shadow-lg">
            <div className="flex flex-col gap-4">
              {/* Transaction Type Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={transactionType === 'sale' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setTransactionType('sale')}
                >
                  For Sale
                </Button>
                <Button
                  variant={transactionType === 'rent' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setTransactionType('rent')}
                >
                  For Rent
                </Button>
              </div>

              {/* Search Input */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by location, neighborhood..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background"
                  />
                </div>
                <Sheet open={showFilters} onOpenChange={setShowFilters}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <SlidersHorizontal className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Advanced Filters</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-6 mt-6">
                      {/* Property Type */}
                      <div className="space-y-2">
                        <Label>Property Type</Label>
                        <Select
                          value={filters.propertyType}
                          onValueChange={(value) =>
                            setFilters({ ...filters, propertyType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="villa">Villa</SelectItem>
                            <SelectItem value="land">Land</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* City */}
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          placeholder="Enter city"
                          value={filters.city}
                          onChange={(e) =>
                            setFilters({ ...filters, city: e.target.value })
                          }
                        />
                      </div>

                      {/* Neighborhood */}
                      <div className="space-y-2">
                        <Label>Neighborhood (District)</Label>
                        <Input
                          placeholder="Enter neighborhood"
                          value={filters.neighborhood}
                          onChange={(e) =>
                            setFilters({ ...filters, neighborhood: e.target.value })
                          }
                        />
                      </div>

                      {/* Price Range */}
                      <div className="space-y-2">
                        <Label>Price (SAR)</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={filters.priceMin}
                            onChange={(e) =>
                              setFilters({ ...filters, priceMin: Number(e.target.value) })
                            }
                          />
                          <span>-</span>
                          <Input
                            type="number"
                            placeholder="Max"
                            value={filters.priceMax}
                            onChange={(e) =>
                              setFilters({ ...filters, priceMax: Number(e.target.value) })
                            }
                          />
                        </div>
                      </div>

                      {/* Area Range */}
                      <div className="space-y-2">
                        <Label>Area (m²)</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={filters.areaMin}
                            onChange={(e) =>
                              setFilters({ ...filters, areaMin: Number(e.target.value) })
                            }
                          />
                          <span>-</span>
                          <Input
                            type="number"
                            placeholder="Max"
                            value={filters.areaMax}
                            onChange={(e) =>
                              setFilters({ ...filters, areaMax: Number(e.target.value) })
                            }
                          />
                        </div>
                      </div>

                      {/* Bedrooms */}
                      <div className="space-y-2">
                        <Label>Number of Bedrooms</Label>
                        <Select
                          value={filters.bedrooms}
                          onValueChange={(value) =>
                            setFilters({ ...filters, bedrooms: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select bedrooms" />
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
                        <Label>Number of Living Rooms</Label>
                        <Select
                          value={filters.livingRooms}
                          onValueChange={(value) =>
                            setFilters({ ...filters, livingRooms: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select living rooms" />
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
                        <Label>Number of Bathrooms</Label>
                        <Select
                          value={filters.bathrooms}
                          onValueChange={(value) =>
                            setFilters({ ...filters, bathrooms: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select bathrooms" />
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
                        <Label>Proximity to Points of Interest</Label>
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
                              Near Schools
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
                              Near Universities
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
                              Near Hospitals/Clinics
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
                              Near Mosques
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Apply Filters Button */}
                      <Button className="w-full" onClick={() => setShowFilters(false)}>
                        Apply Filters
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
                <Button>
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Chatbot Button */}
        <Button
          size="lg"
          className="fixed bottom-6 right-6 z-20 rounded-full h-16 w-16 shadow-lg"
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
          <Card className="fixed bottom-24 right-6 z-20 w-96 h-[500px] shadow-xl bg-card/95 backdrop-blur-sm">
            <div className="flex flex-col h-full p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">AI Assistant</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowChatbot(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">
                    Hello! I'm your AI assistant. I can help you find the perfect property,
                    answer questions about neighborhoods, or provide information about the
                    local area. How can I assist you today?
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Ask me anything..." />
                <Button>Send</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </APIProvider>
  );
};

export default RealEstateSearch;
