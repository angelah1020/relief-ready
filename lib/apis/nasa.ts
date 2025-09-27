/**
 * NASA FIRMS API Integration for Wildfire Data
 * API Documentation: https://firms.modaps.eosdis.nasa.gov/api/
 */

export interface NASAFireHotspot {
  latitude: number;
  longitude: number;
  brightness: number;
  scan: number;
  track: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  instrument: string;
  confidence: number;
  version: string;
  bright_t31: number;
  frp: number; // Fire Radiative Power
  daynight: 'D' | 'N';
  type: number;
}

export interface NASAFireResponse {
  data: NASAFireHotspot[];
}

class NASAApi {
  private baseUrl = 'https://firms.modaps.eosdis.nasa.gov/api';
  
  /**
   * Get active fire hotspots from VIIRS satellite data
   * @param area - Geographic area (world, usa, etc.) or bounding box
   * @param days - Number of days back to retrieve (1, 2, 3, 7, 10)
   */
  async getActiveFiresVIIRS(
    area: string = 'usa',
    days: number = 1
  ): Promise<NASAFireHotspot[]> {
    // Note: NASA FIRMS requires API key for real-time data
    // For demo purposes, we'll use the public CSV endpoint
    const url = `${this.baseUrl}/country/csv/viirs-snpp/${area}/${days}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NASA FIRMS API error: ${response.status} ${response.statusText}`);
      }
      
      const csvText = await response.text();
      return this.parseFireCSV(csvText);
    } catch (error) {
      console.warn('NASA FIRMS API unavailable, using mock data:', error);
      return this.getMockFireData();
    }
  }

  /**
   * Get active fires in a bounding box
   */
  async getFiresInBoundingBox(
    north: number,
    south: number,
    east: number,
    west: number,
    days: number = 1
  ): Promise<NASAFireHotspot[]> {
    const bbox = `${west},${south},${east},${north}`;
    const url = `${this.baseUrl}/area/csv/viirs-snpp/${bbox}/${days}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NASA FIRMS API error: ${response.status} ${response.statusText}`);
      }
      
      const csvText = await response.text();
      return this.parseFireCSV(csvText);
    } catch (error) {
      console.warn('NASA FIRMS API unavailable, using mock data:', error);
      return this.getMockFireData();
    }
  }

  /**
   * Parse CSV response to fire hotspot objects
   */
  private parseFireCSV(csvText: string): NASAFireHotspot[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',');
    const fires: NASAFireHotspot[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;

      fires.push({
        latitude: parseFloat(values[0]),
        longitude: parseFloat(values[1]),
        brightness: parseFloat(values[2]),
        scan: parseFloat(values[3]),
        track: parseFloat(values[4]),
        acq_date: values[5],
        acq_time: values[6],
        satellite: values[7],
        instrument: values[8],
        confidence: parseFloat(values[9]),
        version: values[10],
        bright_t31: parseFloat(values[11]),
        frp: parseFloat(values[12]),
        daynight: values[13] as 'D' | 'N',
        type: parseInt(values[14]),
      });
    }

    return fires;
  }

  /**
   * Get fire confidence color
   */
  getConfidenceColor(confidence: number): string {
    if (confidence >= 80) return '#FF0000'; // Red - High confidence
    if (confidence >= 50) return '#FF6600'; // Orange - Medium confidence
    return '#FFFF00'; // Yellow - Low confidence
  }

  /**
   * Get fire size based on brightness and FRP
   */
  getFireSize(brightness: number, frp: number): number {
    // Combine brightness and fire radiative power for size
    const combinedValue = (brightness / 400) + (frp / 100);
    return Math.max(3, Math.min(20, combinedValue * 10));
  }

  /**
   * Format fire detection time
   */
  formatFireTime(date: string, time: string): string {
    // time format: HHMM
    const hour = time.substring(0, 2);
    const minute = time.substring(2, 4);
    return `${date} ${hour}:${minute} UTC`;
  }

  /**
   * Check if fire is recent (within last 12 hours)
   */
  isRecentFire(date: string, time: string): boolean {
    const fireDateTime = new Date(`${date}T${time.substring(0, 2)}:${time.substring(2, 4)}:00Z`);
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    return fireDateTime > twelveHoursAgo;
  }

  /**
   * Mock fire data for demo purposes
   */
  private getMockFireData(): NASAFireHotspot[] {
    return [
      {
        latitude: 34.0522,
        longitude: -118.2437,
        brightness: 320.5,
        scan: 1.0,
        track: 1.0,
        acq_date: new Date().toISOString().split('T')[0],
        acq_time: '1430',
        satellite: 'N',
        instrument: 'VIIRS',
        confidence: 85,
        version: '2.0NRT',
        bright_t31: 290.2,
        frp: 45.6,
        daynight: 'D',
        type: 0,
      },
      {
        latitude: 37.7749,
        longitude: -122.4194,
        brightness: 298.1,
        scan: 1.1,
        track: 1.0,
        acq_date: new Date().toISOString().split('T')[0],
        acq_time: '1645',
        satellite: 'N',
        instrument: 'VIIRS',
        confidence: 72,
        version: '2.0NRT',
        bright_t31: 285.7,
        frp: 23.4,
        daynight: 'D',
        type: 0,
      },
    ];
  }
}

export const nasaApi = new NASAApi();
