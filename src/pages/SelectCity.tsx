import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, Navigation, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";

interface City {
  name: string;
  country: string;
  flag: string;
  lat: number;
  lng: number;
}

// Popular tourist cities for quick selection
const popularCities: City[] = [
  { name: "Paris", country: "France", flag: "🇫🇷", lat: 48.8566, lng: 2.3522 },
  { name: "London", country: "United Kingdom", flag: "🇬🇧", lat: 51.5074, lng: -0.1278 },
  { name: "New York", country: "United States", flag: "🇺🇸", lat: 40.7128, lng: -74.0060 },
  { name: "Tokyo", country: "Japan", flag: "🇯🇵", lat: 35.6762, lng: 139.6503 },
  { name: "Barcelona", country: "Spain", flag: "🇪🇸", lat: 41.3851, lng: 2.1734 },
  { name: "Rome", country: "Italy", flag: "🇮🇹", lat: 41.9028, lng: 12.4964 },
  { name: "Berlin", country: "Germany", flag: "🇩🇪", lat: 52.5200, lng: 13.4050 },
  { name: "Amsterdam", country: "Netherlands", flag: "🇳🇱", lat: 52.3676, lng: 4.9041 },
  { name: "Lisbon", country: "Portugal", flag: "🇵🇹", lat: 38.7223, lng: -9.1393 },
  { name: "Prague", country: "Czech Republic", flag: "🇨🇿", lat: 50.0755, lng: 14.4378 },
];

export default function SelectCity() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filter popular cities based on search
  const filteredCities = searchQuery
    ? popularCities.filter(
        (city) =>
          city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          city.country.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : popularCities;

  // Handle city selection
  const handleCitySelect = (city: City) => {
    toast.success(`${city.flag} ${city.name} sélectionnée`, {
      description: `Vous allez explorer ${city.name}`,
    });
    // Navigate to map with city parameter
    navigate(`/map?city=${encodeURIComponent(city.name)}&lat=${city.lat}&lng=${city.lng}`);
  };

  // Detect current location
  const handleDetectLocation = async () => {
    setIsDetecting(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      // Reverse geocode to get city name
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`,
        {
          headers: {
            'User-Agent': 'StreetExplorer/1.0',
          },
        }
      );
      const data = await response.json();

      const cityName =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.municipality ||
        'Unknown City';

      toast.success(`📍 Position détectée`, {
        description: `Vous êtes à ${cityName}`,
      });

      navigate(`/map?city=${encodeURIComponent(cityName)}&lat=${position.coords.latitude}&lng=${position.coords.longitude}`);
    } catch (error: any) {
      console.error('Location detection error:', error);
      toast.error('Erreur de localisation', {
        description: error.message === 'User denied Geolocation'
          ? 'Veuillez activer la localisation'
          : 'Impossible de détecter votre position',
      });
    } finally {
      setIsDetecting(false);
    }
  };

  // Search for cities using Nominatim
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'StreetExplorer/1.0',
          },
        }
      );
      const data = await response.json();

      const cities: City[] = data
        .filter((item: any) => item.type === 'city' || item.type === 'administrative')
        .map((item: any) => ({
          name: item.name,
          country: item.address?.country || '',
          flag: '🌍',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));

      setSearchResults(cities);
      if (cities.length === 0) {
        toast.info('Aucune ville trouvée', {
          description: 'Essayez une autre recherche',
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Erreur de recherche', {
        description: 'Veuillez réessayer',
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-6 py-8">
        {/* Header */}
        <header className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors mb-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold mb-2">Choisir une ville</h1>
          <p className="text-muted-foreground">
            Sélectionnez une ville à explorer ou détectez votre position
          </p>
        </header>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher une ville..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 h-12 text-base"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="h-12 px-6"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Rechercher'
              )}
            </Button>
          </div>
        </div>

        {/* Detect Location Button */}
        <Button
          onClick={handleDetectLocation}
          disabled={isDetecting}
          variant="outline"
          className="w-full mb-8 h-14 text-base border-2 border-dashed"
        >
          {isDetecting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Détection en cours...
            </>
          ) : (
            <>
              <Navigation className="w-5 h-5 mr-2" />
              Détecter ma position
            </>
          )}
        </Button>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Résultats de recherche</h2>
            <div className="grid gap-3">
              {searchResults.map((city, index) => (
                <button
                  key={`${city.name}-${index}`}
                  onClick={() => handleCitySelect(city)}
                  className="bg-card border border-border rounded-xl p-4 hover:bg-muted/50 transition-all text-left card-hover"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{city.flag}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{city.name}</h3>
                      <p className="text-sm text-muted-foreground">{city.country}</p>
                    </div>
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Popular Cities */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Villes populaires</h2>
          <div className="grid gap-3">
            {filteredCities.map((city) => (
              <button
                key={city.name}
                onClick={() => handleCitySelect(city)}
                className="bg-card border border-border rounded-xl p-4 hover:bg-muted/50 transition-all text-left card-hover animate-fade-in"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{city.flag}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{city.name}</h3>
                    <p className="text-sm text-muted-foreground">{city.country}</p>
                  </div>
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
