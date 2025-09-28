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
  private mapKey = 'a7273121aea29a494f52744e6dcdc093';
  
  /**
   * Get active fire hotspots from VIIRS satellite data using FIRMS API
   * @param boundingBox - Optional bounding box to filter fires by region
   * @param days - Number of days back to retrieve (1-10)
   */
  async getActiveFiresVIIRS(
    boundingBox?: {
      west: number;
      south: number;
      east: number;
      north: number;
    },
    days: number = 3
  ): Promise<NASAFireHotspot[]> {
    try {
      let url: string;
      
      if (boundingBox) {
        // Use area endpoint with bounding box
        const bbox = `${boundingBox.west},${boundingBox.south},${boundingBox.east},${boundingBox.north}`;
        url = `${this.baseUrl}/area/csv/${this.mapKey}/VIIRS_SNPP_NRT/${bbox}/${days}`;
      } else {
        // Use CONUS (Continental US) as default area
        url = `${this.baseUrl}/area/csv/${this.mapKey}/VIIRS_SNPP_NRT/-125,25,-66,49/${days}`;
      }
      
      console.log('Fetching FIRMS fire data from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`FIRMS API error: ${response.status} ${response.statusText}`);
      }
      
      const csvText = await response.text();
      const fires = this.parseFireCSV(csvText);
      
      console.log(`Found ${fires.length} fire hotspots from FIRMS API`);
      return fires;
      
    } catch (error) {
      console.warn('FIRMS API unavailable, using mock data:', error);
      return this.getMockFireData();
    }
  }

  /**
   * Get active fires in a bounding box (legacy method - use getActiveFiresVIIRS instead)
   */
  async getFiresInBoundingBox(
    north: number,
    south: number,
    east: number,
    west: number,
    days: number = 3
  ): Promise<NASAFireHotspot[]> {
    return this.getActiveFiresVIIRS({ west, south, east, north }, days);
  }

  /**
   * Parse CSV response from FIRMS API to fire hotspot objects
   * FIRMS CSV format: latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
   */
  private parseFireCSV(csvText: string): NASAFireHotspot[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',');
    const fires: NASAFireHotspot[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < 14) continue; // Ensure we have all required fields

      try {
        fires.push({
          latitude: parseFloat(values[0]),
          longitude: parseFloat(values[1]),
          brightness: parseFloat(values[2]), // bright_ti4
          scan: parseFloat(values[3]),
          track: parseFloat(values[4]),
          acq_date: values[5],
          acq_time: values[6],
          satellite: values[7],
          instrument: values[8],
          confidence: this.parseConfidence(values[9]), // Handle 'n' for nominal
          version: values[10],
          bright_t31: parseFloat(values[11]), // bright_ti5
          frp: parseFloat(values[12]),
          daynight: values[13] as 'D' | 'N',
          type: 0, // Default type since FIRMS doesn't provide this field
        });
      } catch (error) {
        console.warn('Error parsing fire data row:', values, error);
        continue;
      }
    }

      // Filter to show only significant wildfires (not all fire detections)
      const significantFires = fires.filter(fire => this.isSignificantWildfire(fire));
      
      console.log(`Parsed ${fires.length} fire detections, filtered to ${significantFires.length} significant wildfires`);
      return significantFires;
  }

  /**
   * Parse confidence value from FIRMS data ('n' = nominal, number = actual confidence)
   */
  private parseConfidence(confidenceStr: string): number {
    if (confidenceStr === 'n' || confidenceStr === 'N') {
      return 50; // Nominal confidence - treat as medium
    }
    const confidence = parseFloat(confidenceStr);
    return isNaN(confidence) ? 50 : confidence;
  }

  /**
   * Determine if a fire detection represents a significant wildfire
   * Filters out small fires, controlled burns, and low-confidence detections
   */
  private isSignificantWildfire(fire: NASAFireHotspot): boolean {
    // Filter criteria for actual wildfires:
    
    // 1. High Fire Radiative Power (FRP) - indicates significant fire intensity
    if (fire.frp < 5) return false; // FRP < 5 MW typically indicates small fires
    
    // 2. High brightness temperature - indicates substantial fire
    if (fire.brightness < 310) return false; // Lower brightness may indicate controlled burns
    
    // 3. Reasonable confidence level (exclude very low confidence detections)
    if (fire.confidence < 30) return false; // Very low confidence detections
    
    // 4. Exclude obvious non-wildfire detections based on scan/track values
    // Very small scan/track values might indicate industrial sources
    if (fire.scan < 0.3 || fire.track < 0.3) return false;
    
    // 5. Prefer daytime detections for better accuracy (optional - can be removed)
    // if (fire.daynight === 'N') return false; // Uncomment to show only daytime fires
    
    return true;
  }

  /**
   * Get wildfire severity based on FRP and brightness
   */
  getWildFireSeverity(fire: NASAFireHotspot): 'low' | 'moderate' | 'high' | 'extreme' {
    const combinedIntensity = fire.frp * 0.7 + (fire.brightness - 300) * 0.3;
    
    if (combinedIntensity > 50) return 'extreme';
    if (combinedIntensity > 25) return 'high';
    if (combinedIntensity > 10) return 'moderate';
    return 'low';
  }

  /**
   * Get wildfire color based on severity
   */
  getWildFireColor(fire: NASAFireHotspot): string {
    const severity = this.getWildFireSeverity(fire);
    switch (severity) {
      case 'extreme': return '#8B0000'; // Dark Red - Extreme wildfire
      case 'high': return '#FF0000';    // Red - High intensity wildfire  
      case 'moderate': return '#FF4500'; // Orange Red - Moderate wildfire
      case 'low': return '#FF8C00';     // Dark Orange - Low intensity wildfire
      default: return '#FF6600';        // Orange - Default
    }
  }

  /**
   * Get fire confidence color (legacy - use getWildFireColor instead)
   */
  getConfidenceColor(confidence: number): string {
    if (confidence >= 80) return '#FF0000'; // Red - High confidence
    if (confidence >= 50) return '#FF6600'; // Orange - Medium confidence
    return '#FFFF00'; // Yellow - Low confidence
  }

  /**
   * Get wildfire marker size based on fire intensity
   */
  getWildFireSize(fire: NASAFireHotspot): number {
    const severity = this.getWildFireSeverity(fire);
    switch (severity) {
      case 'extreme': return 25; // Large marker for extreme fires
      case 'high': return 20;    // Large marker for high intensity
      case 'moderate': return 15; // Medium marker for moderate fires
      case 'low': return 12;     // Smaller marker for low intensity
      default: return 10;        // Default size
    }
  }

  /**
   * Get fire size based on brightness and FRP (legacy method)
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
   * Mock wildfire data representing significant wildfires (fallback when FIRMS API unavailable)
   */
  private getMockFireData(): NASAFireHotspot[] {
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        latitude: 34.2431,  // Angeles National Forest area
        longitude: -118.1542,
        brightness: 325.5,  // High brightness indicating significant fire
        scan: 0.8,
        track: 0.75,
        acq_date: today,
        acq_time: '1430',
        satellite: 'N',
        instrument: 'VIIRS',
        confidence: 85,      // High confidence
        version: '2.0NRT',
        bright_t31: 295.2,
        frp: 15.6,          // High FRP indicating significant wildfire
        daynight: 'D',
        type: 0,
      },
      {
        latitude: 37.8044,  // Napa Valley area
        longitude: -122.2711,
        brightness: 318.7,
        scan: 0.6,
        track: 0.55,
        acq_date: today,
        acq_time: '1645',
        satellite: 'N',
        instrument: 'VIIRS',
        confidence: 78,
        version: '2.0NRT',
        bright_t31: 292.1,
        frp: 12.3,          // Moderate to high FRP
        daynight: 'D',
        type: 0,
      },
      {
        latitude: 39.4899,  // Mendocino National Forest
        longitude: -123.1351,
        brightness: 335.1,
        scan: 0.9,
        track: 0.8,
        acq_date: today,
        acq_time: '1205',
        satellite: 'N',
        instrument: 'VIIRS',
        confidence: 92,      // Very high confidence
        version: '2.0NRT',
        bright_t31: 298.5,
        frp: 28.7,          // Very high FRP indicating major wildfire
        daynight: 'D',
        type: 0,
      },
    ];
  }
}

export const nasaApi = new NASAApi();
