import type { Street } from './OverpassService';

interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

class StreetMatcher {
  private readonly matchThreshold = 30; // mètres - distance max pour matcher une rue

  // Trouver toutes les rues intersectées par un parcours GPS
  findIntersectingStreets(gpsPoints: GPSPoint[], streets: Street[]): number[] {
    const exploredStreetIds = new Set<number>();

    for (const point of gpsPoints) {
      for (const street of streets) {
        if (this.isPointNearStreet(point, street)) {
          exploredStreetIds.add(street.id);
        }
      }
    }

    return Array.from(exploredStreetIds);
  }

  // Vérifier si un point GPS est proche d'une rue
  private isPointNearStreet(point: GPSPoint, street: Street): boolean {
    // Calculer la distance minimale entre le point et tous les segments de la rue
    let minDistance = Infinity;

    for (let i = 0; i < street.coordinates.length - 1; i++) {
      const segmentStart = street.coordinates[i];
      const segmentEnd = street.coordinates[i + 1];
      
      const distance = this.distanceToSegment(
        point.lat,
        point.lng,
        segmentStart[1], // lat
        segmentStart[0], // lng
        segmentEnd[1],
        segmentEnd[0]
      );

      minDistance = Math.min(minDistance, distance);
    }

    return minDistance <= this.matchThreshold;
  }

  // Calculer la distance d'un point à un segment de ligne
  private distanceToSegment(
    pointLat: number,
    pointLng: number,
    segStartLat: number,
    segStartLng: number,
    segEndLat: number,
    segEndLng: number
  ): number {
    const A = pointLat - segStartLat;
    const B = pointLng - segStartLng;
    const C = segEndLat - segStartLat;
    const D = segEndLng - segStartLng;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = segStartLat;
      yy = segStartLng;
    } else if (param > 1) {
      xx = segEndLat;
      yy = segEndLng;
    } else {
      xx = segStartLat + param * C;
      yy = segStartLng + param * D;
    }

    return this.haversineDistance(pointLat, pointLng, xx, yy);
  }

  // Calculer la distance haversine entre deux points (en mètres)
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Calculer la distance totale d'un parcours
  calculateTotalDistance(gpsPoints: GPSPoint[]): number {
    let totalDistance = 0;

    for (let i = 1; i < gpsPoints.length; i++) {
      const prev = gpsPoints[i - 1];
      const curr = gpsPoints[i];
      totalDistance += this.haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
    }

    return totalDistance;
  }

  // Simplifier un parcours GPS (réduire le nombre de points)
  simplifyTrack(gpsPoints: GPSPoint[], toleranceMeters: number = 10): GPSPoint[] {
    if (gpsPoints.length <= 2) return gpsPoints;

    // Algorithme Douglas-Peucker simplifié
    const simplified: GPSPoint[] = [gpsPoints[0]];
    
    for (let i = 1; i < gpsPoints.length - 1; i++) {
      const prev = simplified[simplified.length - 1];
      const curr = gpsPoints[i];
      
      const distance = this.haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      
      if (distance > toleranceMeters) {
        simplified.push(curr);
      }
    }
    
    simplified.push(gpsPoints[gpsPoints.length - 1]);
    return simplified;
  }
}

export const streetMatcher = new StreetMatcher();
export type { GPSPoint };
