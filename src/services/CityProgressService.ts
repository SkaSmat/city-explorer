import { overpassService, type BBox } from './OverpassService';
import { supabase } from '@/integrations/supabase/client';

interface CityStreetCount {
  city: string;
  totalStreets: number;
  cachedAt: number;
}

const CACHE_KEY = 'city_street_counts';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

class CityProgressService {
  private cache: Map<string, CityStreetCount> = new Map();

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([city, count]) => {
          this.cache.set(city, count as CityStreetCount);
        });
      }
    } catch (e) {
      console.error('Error loading city cache:', e);
    }
  }

  private saveCache() {
    try {
      const data: { [key: string]: CityStreetCount } = {};
      this.cache.forEach((value, key) => {
        data[key] = value;
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving city cache:', e);
    }
  }

  // Get city coordinates from Nominatim
  async getCityBbox(cityName: string): Promise<BBox | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.length === 0) return null;

      const result = data[0];
      if (result.boundingbox) {
        return {
          minLat: parseFloat(result.boundingbox[0]),
          maxLat: parseFloat(result.boundingbox[1]),
          minLng: parseFloat(result.boundingbox[2]),
          maxLng: parseFloat(result.boundingbox[3]),
        };
      }
      
      // Fallback: use lat/lon with default radius
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      const radius = 5; // 5km radius
      const latDelta = radius / 111;
      const lngDelta = radius / (111 * Math.cos(lat * Math.PI / 180));
      
      return {
        minLat: lat - latDelta,
        maxLat: lat + latDelta,
        minLng: lon - lngDelta,
        maxLng: lon + lngDelta,
      };
    } catch (error) {
      console.error('Error getting city bbox:', error);
      return null;
    }
  }

  // Count total streets in a city
  async getTotalStreetsForCity(cityName: string): Promise<number> {
    // Check cache first
    const cached = this.cache.get(cityName);
    if (cached && Date.now() - cached.cachedAt < CACHE_DURATION) {
      console.log(`📦 Using cached street count for ${cityName}: ${cached.totalStreets}`);
      return cached.totalStreets;
    }

    // Check database cache
    const { data: dbCache } = await (supabase as any)
      .from('overpass_cache')
      .select('total_streets, cached_at')
      .eq('city', cityName)
      .maybeSingle();

    if (dbCache && Date.now() - new Date((dbCache as any).cached_at).getTime() < CACHE_DURATION) {
      const count = (dbCache as any).total_streets;
      this.cache.set(cityName, { city: cityName, totalStreets: count, cachedAt: Date.now() });
      this.saveCache();
      console.log(`📦 Using DB cached street count for ${cityName}: ${count}`);
      return count;
    }

    // Fetch from Overpass
    try {
      const bbox = await this.getCityBbox(cityName);
      if (!bbox) {
        console.warn(`Could not get bbox for ${cityName}`);
        return 0;
      }

      const streets = await overpassService.getStreetsInBbox(bbox);
      const uniqueStreets = new Set(streets.map(s => s.name));
      const totalStreets = uniqueStreets.size;

      // Save to cache
      this.cache.set(cityName, { city: cityName, totalStreets, cachedAt: Date.now() });
      this.saveCache();

      // Save to database cache
      await (supabase as any)
        .from('overpass_cache')
        .upsert({
          city: cityName,
          total_streets: totalStreets,
          cached_at: new Date().toISOString(),
          bbox: JSON.stringify(bbox),
        }, { onConflict: 'city' });

      console.log(`✅ Fetched and cached street count for ${cityName}: ${totalStreets}`);
      return totalStreets;

    } catch (error) {
      console.error(`Error getting streets for ${cityName}:`, error);
      return 0;
    }
  }

  // Calculate progress percentage
  async calculateCityProgress(cityName: string, exploredStreets: number): Promise<number> {
    const totalStreets = await this.getTotalStreetsForCity(cityName);
    if (totalStreets === 0) return 0;
    
    const progress = Math.min(100, Math.round((exploredStreets / totalStreets) * 100));
    return progress;
  }

  // Get progress for multiple cities
  async getCitiesProgress(cities: { city: string; streetsExplored: number }[]): Promise<Map<string, number>> {
    const progressMap = new Map<string, number>();
    
    // Process cities in parallel with rate limiting
    const promises = cities.map(async ({ city, streetsExplored }) => {
      const progress = await this.calculateCityProgress(city, streetsExplored);
      progressMap.set(city, progress);
    });

    await Promise.all(promises);
    return progressMap;
  }
}

export const cityProgressService = new CityProgressService();
