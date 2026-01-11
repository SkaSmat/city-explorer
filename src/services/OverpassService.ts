interface Street {
  id: number;
  name: string;
  type: string;
  coordinates: [number, number][];
}

interface BBox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

class OverpassService {
  private readonly baseUrl = 'https://overpass-api.de/api/interpreter';
  private readonly cacheDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly requestDelay = 6000; // 6 seconds between requests
  private lastRequestTime = 0;

  // Récupérer les rues dans une bbox
  async getStreetsInBbox(bbox: BBox): Promise<Street[]> {
    // Check cache first
    const cacheKey = `streets_${bbox.minLat}_${bbox.minLng}_${bbox.maxLat}_${bbox.maxLng}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log('📦 Using cached streets');
      return cached;
    }

    // Rate limiting
    await this.waitForRateLimit();

    console.log('🌐 Fetching streets from Overpass API...');

    const query = `
      [out:json][timeout:90];
      way["highway"]["name"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
      out geom;
    `;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();
      const streets = this.parseOverpassResponse(data);

      // Cache the results
      this.saveToCache(cacheKey, streets);

      console.log(`✅ Fetched ${streets.length} streets from Overpass`);
      return streets;

    } catch (error) {
      console.error('❌ Error fetching from Overpass:', error);
      throw error;
    }
  }

  // Récupérer les rues autour d'une position (rayon en km)
  async getStreetsAroundPosition(lat: number, lng: number, radiusKm: number = 2): Promise<Street[]> {
    const bbox = this.calculateBbox(lat, lng, radiusKm);
    return this.getStreetsInBbox(bbox);
  }

  // Calculer une bbox autour d'une position
  private calculateBbox(lat: number, lng: number, radiusKm: number): BBox {
    const latDelta = radiusKm / 111; // 1 degree latitude ≈ 111 km
    const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    return {
      minLat: lat - latDelta,
      minLng: lng - lngDelta,
      maxLat: lat + latDelta,
      maxLng: lng + lngDelta,
    };
  }

  // Parser la réponse Overpass
  private parseOverpassResponse(data: any): Street[] {
    const streets: Street[] = [];

    for (const element of data.elements || []) {
      if (!element.tags?.name || !element.geometry) continue;

      const coordinates: [number, number][] = element.geometry.map((node: any) => [
        node.lon,
        node.lat,
      ]);

      if (coordinates.length < 2) continue;

      streets.push({
        id: element.id,
        name: element.tags.name,
        type: element.tags.highway || 'unknown',
        coordinates,
      });
    }

    return streets;
  }

  // Rate limiting
  private async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.requestDelay) {
      const waitTime = this.requestDelay - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${Math.round(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  // Cache management
  private getFromCache(key: string): Street[] | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age > this.cacheDuration) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  private saveToCache(key: string, data: Street[]) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache streets:', error);
    }
  }

  // Clear expired cache
  clearExpiredCache() {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('streets_')) {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const { timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp > this.cacheDuration) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Cleared ${keysToRemove.length} expired cache entries`);
  }
}

export const overpassService = new OverpassService();
export type { Street, BBox };
