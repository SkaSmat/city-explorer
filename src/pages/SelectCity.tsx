import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, Navigation, TrendingUp, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";

interface City {
  name: string;
  country: string;
  flag: string;
  population?: string;
}

const POPULAR_CITIES: City[] = [
  { name: "Paris", country: "France", flag: "🇫🇷", population: "2.2M" },
  { name: "Lyon", country: "France", flag: "🇫🇷", population: "516K" },
  { name: "Marseille", country: "France", flag: "🇫🇷", population: "870K" },
  { name: "Toulouse", country: "France", flag: "🇫🇷", population: "479K" },
  { name: "Nice", country: "France", flag: "🇫🇷", population: "341K" },
  { name: "Nantes", country: "France", flag: "🇫🇷", population: "309K" },
  { name: "Strasbourg", country: "France", flag: "🇫🇷", population: "280K" },
  { name: "Bordeaux", country: "France", flag: "🇫🇷", population: "254K" },
  { name: "London", country: "United Kingdom", flag: "🇬🇧", population: "9M" },
  { name: "New York", country: "United States", flag: "🇺🇸", population: "8.3M" },
  { name: "Barcelona", country: "Spain", flag: "🇪🇸", population: "1.6M" },
  { name: "Berlin", country: "Germany", flag: "🇩🇪", population: "3.7M" },
];

export default function SelectCity() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [filteredCities, setFilteredCities] = useState<City[]>(POPULAR_CITIES);

  // Filter cities based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCities(POPULAR_CITIES);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = POPULAR_CITIES.filter(
      (city) =>
        city.name.toLowerCase().includes(query) ||
        city.country.toLowerCase().includes(query)
    );
    setFilteredCities(filtered);
  }, [searchQuery]);

  // Detect user's current location
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
      const { latitude, longitude } = position.coords;

      // Use Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();

      const detectedCity =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.municipality ||
        "Unknown City";

      toast.success(`Ville détectée : ${detectedCity}`);

      // Navigate to map with detected city
      navigate(`/map?city=${encodeURIComponent(detectedCity)}`);
    } catch (error: any) {
      console.error("Error detecting location:", error);

      if (error.code === 1) {
        toast.error("Permission de localisation refusée");
      } else if (error.code === 2) {
        toast.error("Position indisponible");
      } else if (error.code === 3) {
        toast.error("Délai de localisation dépassé");
      } else {
        toast.error("Erreur de détection de la position");
      }
    } finally {
      setIsDetecting(false);
    }
  };

  // Handle city selection
  const handleSelectCity = (cityName: string) => {
    navigate(`/map?city=${encodeURIComponent(cityName)}`);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <AppLayout>
      <div className="px-6 py-8 animate-fade-in">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-gradient">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Sélectionnez une ville</h1>
          <p className="text-muted-foreground">
            Choisissez une ville à explorer ou utilisez votre position actuelle
          </p>
        </header>

        {/* Detect Location Button */}
        <Button
          onClick={handleDetectLocation}
          disabled={isDetecting}
          className="w-full mb-6 rounded-xl h-14 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all"
          size="lg"
        >
          {isDetecting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Détection en cours...
            </>
          ) : (
            <>
              <Navigation className="w-5 h-5 mr-2" />
              Utiliser ma position actuelle
            </>
          )}
        </Button>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher une ville..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-12 h-14 rounded-xl border-2 text-base transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Popular Cities Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">
              {searchQuery ? "Résultats de recherche" : "Villes populaires"}
            </h2>
          </div>

          {filteredCities.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">Aucune ville trouvée</p>
              <p className="text-sm text-muted-foreground">
                Essayez avec un autre nom de ville
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredCities.map((city, index) => (
                <button
                  key={city.name}
                  onClick={() => handleSelectCity(city.name)}
                  className={`bg-card rounded-2xl border border-border p-4 text-left transition-all hover:border-primary hover:shadow-md hover:scale-[1.02] active:scale-[0.98] animate-fade-in stagger-delay-${(index % 9) + 1}`}
                  style={{ animationFillMode: 'both' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{city.flag}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{city.name}</h3>
                      <p className="text-sm text-muted-foreground">{city.country}</p>
                    </div>
                    {city.population && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-primary">{city.population}</p>
                        <p className="text-xs text-muted-foreground">habitants</p>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Info Text */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Plus de villes seront ajoutées prochainement !
        </p>
      </div>
    </AppLayout>
  );
}
