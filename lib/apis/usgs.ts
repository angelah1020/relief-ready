/**
 * USGS API Integration for Earthquakes and Water Data
 * Earthquake API: https://earthquake.usgs.gov/fdsnws/event/1/
 * Water API: https://waterservices.usgs.gov/rest/
 */

export interface USGSEarthquake {
  type: 'Feature';
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    tz: number;
    url: string;
    detail: string;
    felt: number | null;
    cdi: number | null;
    mmi: number | null;
    alert: 'green' | 'yellow' | 'orange' | 'red' | null;
    status: string;
    tsunami: 0 | 1;
    sig: number;
    net: string;
    code: string;
    ids: string;
    sources: string;
    types: string;
    nst: number | null;
    dmin: number | null;
    rms: number;
    gap: number | null;
    magType: string;
    type: string;
    title: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [longitude, latitude, depth]
  };
  id: string;
}

export interface USGSEarthquakeResponse {
  type: 'FeatureCollection';
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: USGSEarthquake[];
}

export interface USGSWaterSite {
  sourceInfo: {
    siteName: string;
    siteCode: string[];
    geoLocation: {
      geogLocation: {
        srs: string;
        latitude: number;
        longitude: number;
      };
    };
  };
  values: {
    value: {
      value: string;
      qualifiers: string[];
      dateTime: string;
    }[];
  }[];
}

export interface USGSWaterResponse {
  value: {
    timeSeries: USGSWaterSite[];
  };
}

class USGSApi {
  private earthquakeBaseUrl = 'https://earthquake.usgs.gov/fdsnws/event/1';
  private waterBaseUrl = 'https://waterservices.usgs.gov/nwis/iv';

  /**
   * Get recent earthquakes (last 24 hours by default)
   */
  async getRecentEarthquakes(
    minMagnitude: number = 2.5,
    hours: number = 24
  ): Promise<USGSEarthquakeResponse> {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const url = `${this.earthquakeBaseUrl}/query?format=geojson&starttime=${startTime}&minmagnitude=${minMagnitude}&orderby=time`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`USGS Earthquake API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get earthquakes in a specific region
   */
  async getEarthquakesInRegion(
    minLatitude: number,
    maxLatitude: number,
    minLongitude: number,
    maxLongitude: number,
    minMagnitude: number = 2.5,
    days: number = 7
  ): Promise<USGSEarthquakeResponse> {
    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const url = `${this.earthquakeBaseUrl}/query?format=geojson&starttime=${startTime}&minmagnitude=${minMagnitude}&minlatitude=${minLatitude}&maxlatitude=${maxLatitude}&minlongitude=${minLongitude}&maxlongitude=${maxLongitude}&orderby=time`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`USGS Earthquake API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get water data for flood monitoring
   */
  async getWaterLevels(
    siteCodes: string[],
    parameterCodes: string[] = ['00065'] // 00065 = Gage height
  ): Promise<USGSWaterResponse> {
    const sites = siteCodes.join(',');
    const params = parameterCodes.join(',');
    const url = `${this.waterBaseUrl}?format=json&sites=${sites}&parameterCd=${params}&siteStatus=active`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`USGS Water API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get earthquake magnitude color
   */
  getMagnitudeColor(magnitude: number): string {
    if (magnitude >= 7.0) return '#800080'; // Purple - Major
    if (magnitude >= 6.0) return '#FF0000'; // Red - Strong  
    if (magnitude >= 5.0) return '#FF6600'; // Orange - Moderate
    if (magnitude >= 4.0) return '#FFFF00'; // Yellow - Light
    if (magnitude >= 3.0) return '#00FF00'; // Green - Minor
    return '#0000FF'; // Blue - Micro
  }

  /**
   * Get earthquake size based on magnitude
   */
  getMagnitudeSize(magnitude: number): number {
    // Return radius in pixels
    return Math.max(5, Math.min(50, magnitude * 8));
  }

  /**
   * Calculate earthquake age opacity (newer = more opaque)
   */
  getAgeOpacity(timestamp: number): number {
    const now = Date.now();
    const ageHours = (now - timestamp) / (1000 * 60 * 60);
    
    if (ageHours < 1) return 1.0;      // Last hour - fully opaque
    if (ageHours < 24) return 0.8;     // Last day - mostly opaque
    if (ageHours < 168) return 0.6;    // Last week - medium
    return 0.3;                        // Older - faded
  }

  /**
   * Format earthquake time for display
   */
  formatEarthquakeTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Less than 1 hour ago';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }
}

export const usgsApi = new USGSApi();
