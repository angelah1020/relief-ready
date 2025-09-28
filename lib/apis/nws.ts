/**
 * National Weather Service API Integration
 * API Documentation: https://api.weather.gov/openapi.json
 */

export interface NWSAlert {
  id: string;
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  properties: {
    id: string;
    areaDesc: string;
    geocode: {
      FIPS6: string[];
      UGC: string[];
    };
    affectedZones: string[];
    references: any[];
    sent: string;
    effective: string;
    onset: string;
    expires: string;
    ends: string;
    status: 'Actual' | 'Exercise' | 'System' | 'Test' | 'Draft';
    messageType: 'Alert' | 'Update' | 'Cancel';
    category: 'Geo' | 'Met' | 'Safety' | 'Security' | 'Rescue' | 'Fire' | 'Health' | 'Env' | 'Transport' | 'Infra' | 'CBRNE' | 'Other';
    severity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';
    certainty: 'Observed' | 'Likely' | 'Possible' | 'Unlikely' | 'Unknown';
    urgency: 'Immediate' | 'Expected' | 'Future' | 'Past' | 'Unknown';
    event: string;
    sender: string;
    senderName: string;
    headline: string;
    description: string;
    instruction: string;
    response: 'Shelter' | 'Evacuate' | 'Prepare' | 'Execute' | 'Avoid' | 'Monitor' | 'Assess' | 'AllClear' | 'None';
    parameters: {
      [key: string]: string[];
    };
  };
}

export interface NWSAlertsResponse {
  type: 'FeatureCollection';
  features: NWSAlert[];
  title: string;
  updated: string;
}

export interface HurricaneAlert extends NWSAlert {
  properties: NWSAlert['properties'] & {
    stormName?: string;
    stormCategory?: number;
    maxWinds?: number;
    centralPressure?: number;
    movement?: string;
    stormSurge?: string;
  };
}

export interface HurricaneTrack {
  id: string;
  name: string;
  category: number;
  currentPosition: {
    latitude: number;
    longitude: number;
    time: string;
  };
  maxWinds: number;
  centralPressure: number;
  movement: {
    direction: number;
    speed: number;
  };
  forecast: {
    latitude: number;
    longitude: number;
    time: string;
    category: number;
    maxWinds: number;
  }[];
}

class NWSApi {
  private baseUrl = 'https://api.weather.gov';
  private userAgent = 'Relief Ready/1.0 (emergency-prep-app@example.com)';

  private async fetchWithUserAgent(url: string): Promise<Response> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/geo+json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`NWS API error: ${response.status} ${response.statusText}`);
    }
    
    return response;
  }

  /**
   * Get all active alerts including storms, hurricanes, tornadoes, heat, winter storms
   */
  async getActiveAlerts(): Promise<NWSAlertsResponse> {
    try {
      // Get all active alerts and filter client-side for better reliability
      const response = await this.fetchWithUserAgent(`${this.baseUrl}/alerts/active?status=actual`);
      const data = await response.json();
      
      // Filter for specific event types we're interested in
      const relevantEventTypes = [
        'Hurricane Warning', 'Hurricane Watch', 'Tropical Storm Warning', 'Tropical Storm Watch',
        'Tornado Warning', 'Tornado Watch', 'Severe Thunderstorm Warning', 'Severe Thunderstorm Watch',
        'Heat Warning', 'Excessive Heat Warning', 'Heat Advisory',
        'Winter Storm Warning', 'Winter Storm Watch', 'Blizzard Warning', 'Ice Storm Warning',
        'Flood Warning', 'Flash Flood Warning', 'Flood Watch', 'Flash Flood Watch',
        'High Wind Warning', 'High Wind Watch', 'Wind Advisory',
        'Fire Weather Watch', 'Red Flag Warning'
      ];
      
      // Filter alerts by event type
      const filteredFeatures = data.features?.filter((alert: NWSAlert) => 
        relevantEventTypes.some(eventType => 
          alert.properties.event.toLowerCase().includes(eventType.toLowerCase().split(' ')[0])
        )
      ) || [];
      
      return {
        ...data,
        features: filteredFeatures
      };
    } catch (error) {
      console.warn('NWS API error:', error);
      // Return mock data on error
      return {
        type: 'FeatureCollection',
        features: [],
        title: 'Mock NWS Alerts',
        updated: new Date().toISOString()
      };
    }
  }

  /**
   * Get active alerts for a specific point (lat, lon)
   */
  async getActiveAlertsForPoint(latitude: number, longitude: number): Promise<NWSAlertsResponse> {
    const response = await this.fetchWithUserAgent(
      `${this.baseUrl}/alerts/active?point=${latitude},${longitude}`
    );
    return response.json();
  }

  /**
   * Get active alerts for a specific area (state code)
   */
  async getActiveAlertsForArea(areaCode: string): Promise<NWSAlertsResponse> {
    const response = await this.fetchWithUserAgent(
      `${this.baseUrl}/alerts/active/area/${areaCode}`
    );
    return response.json();
  }

  /**
   * Get alerts by event type (hurricane, tornado, flood, etc.)
   */
  async getAlertsByEvent(eventType: string): Promise<NWSAlertsResponse> {
    const response = await this.fetchWithUserAgent(
      `${this.baseUrl}/alerts/active?event=${encodeURIComponent(eventType)}`
    );
    return response.json();
  }

  /**
   * Get active hurricane and tropical storm alerts
   */
  async getHurricaneAlerts(): Promise<HurricaneAlert[]> {
    try {
      console.log('Fetching hurricane and tropical storm alerts...');
      
      const hurricaneEvents = [
        'Hurricane Warning',
        'Hurricane Watch', 
        'Tropical Storm Warning',
        'Tropical Storm Watch',
        'Storm Surge Warning',
        'Storm Surge Watch'
      ];

      const allAlerts: HurricaneAlert[] = [];

      // Fetch alerts for each hurricane-related event type
      for (const event of hurricaneEvents) {
        try {
          const response = await this.getAlertsByEvent(event);
          const enhancedAlerts = response.features.map(alert => this.enhanceHurricaneAlert(alert));
          allAlerts.push(...enhancedAlerts);
        } catch (error) {
          console.warn(`Failed to fetch ${event} alerts:`, error);
        }
      }

      // Remove duplicates based on alert ID
      const uniqueAlerts = allAlerts.filter((alert, index, arr) => 
        arr.findIndex(a => a.id === alert.id) === index
      );

      console.log(`Found ${uniqueAlerts.length} hurricane/tropical storm alerts`);
      return uniqueAlerts;

    } catch (error) {
      console.warn('Failed to fetch hurricane alerts:', error);
      return [];
    }
  }

  /**
   * Enhance regular alert with hurricane-specific data
   */
  private enhanceHurricaneAlert(alert: NWSAlert): HurricaneAlert {
    const description = alert.properties.description || '';
    const parameters = alert.properties.parameters || {};

    // Extract hurricane data from description and parameters
    const stormName = this.extractStormName(description, alert.properties.headline);
    const maxWinds = this.extractMaxWinds(description);
    const centralPressure = this.extractPressure(description);
    const movement = this.extractMovement(description);
    const stormSurge = this.extractStormSurge(description);
    const category = this.calculateCategory(maxWinds);

    return {
      ...alert,
      properties: {
        ...alert.properties,
        stormName,
        stormCategory: category,
        maxWinds,
        centralPressure,
        movement,
        stormSurge,
      }
    };
  }

  /**
   * Extract storm name from alert text
   */
  private extractStormName(description: string, headline: string): string | undefined {
    const text = `${headline} ${description}`.toUpperCase();
    
    // Look for common storm name patterns
    const namePatterns = [
      /(?:HURRICANE|TROPICAL STORM)\s+([A-Z]+)/,
      /STORM\s+([A-Z]+)/,
      /([A-Z]+)\s+(?:HURRICANE|TROPICAL STORM)/
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Extract maximum wind speed from alert description
   */
  private extractMaxWinds(description: string): number | undefined {
    const windPatterns = [
      /MAXIMUM SUSTAINED WINDS[^\d]*(\d+)\s*MPH/i,
      /MAX WINDS[^\d]*(\d+)\s*MPH/i,
      /WINDS[^\d]*(\d+)\s*MPH/i,
      /(\d+)\s*MPH WINDS/i
    ];

    for (const pattern of windPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1]);
      }
    }

    return undefined;
  }

  /**
   * Extract central pressure from alert description
   */
  private extractPressure(description: string): number | undefined {
    const pressurePattern = /(\d+(?:\.\d+)?)\s*(?:MB|MILLIBARS|INCHES)/i;
    const match = description.match(pressurePattern);
    return match ? parseFloat(match[1]) : undefined;
  }

  /**
   * Extract storm movement from alert description
   */
  private extractMovement(description: string): string | undefined {
    const movementPatterns = [
      /MOVING\s+([\w\s]+?)(?:AT|\.|\n)/i,
      /MOVEMENT\s+([\w\s]+?)(?:AT|\.|\n)/i
    ];

    for (const pattern of movementPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract storm surge information from alert description
   */
  private extractStormSurge(description: string): string | undefined {
    const surgePatterns = [
      /STORM SURGE[^\n]*(\d+(?:\s*TO\s*\d+)?)\s*(?:FEET|FT)/i,
      /SURGE[^\n]*(\d+(?:\s*TO\s*\d+)?)\s*(?:FEET|FT)/i
    ];

    for (const pattern of surgePatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return `${match[1]} feet`;
      }
    }

    return undefined;
  }

  /**
   * Calculate hurricane category based on wind speed
   */
  private calculateCategory(windSpeed?: number): number {
    if (!windSpeed) return 0;
    
    if (windSpeed >= 157) return 5;
    if (windSpeed >= 130) return 4;
    if (windSpeed >= 111) return 3;
    if (windSpeed >= 96) return 2;
    if (windSpeed >= 74) return 1;
    return 0; // Tropical Storm
  }

  /**
   * Get alert types available
   */
  async getAlertTypes(): Promise<{ eventTypes: string[] }> {
    const response = await this.fetchWithUserAgent(`${this.baseUrl}/alerts/types`);
    return response.json();
  }

  /**
   * Map NWS severity to color codes
   */
  getSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'extreme': return '#8B00FF'; // Purple
      case 'severe': return '#FF0000';  // Red  
      case 'moderate': return '#FFA500'; // Orange
      case 'minor': return '#FFFF00';   // Yellow
      default: return '#808080';        // Gray
    }
  }

  /**
   * Get event type category for better organization
   */
  getEventCategory(eventType: string): string {
    const event = eventType.toLowerCase();
    
    if (event.includes('hurricane') || event.includes('tropical')) return 'Hurricane';
    if (event.includes('tornado')) return 'Tornado';
    if (event.includes('thunderstorm') || event.includes('storm')) return 'Storm';
    if (event.includes('heat') || event.includes('temperature')) return 'Heat';
    if (event.includes('winter') || event.includes('blizzard') || event.includes('ice')) return 'Winter Storm';
    if (event.includes('flood') || event.includes('flash flood')) return 'Flood';
    if (event.includes('wind')) return 'Wind';
    if (event.includes('fire')) return 'Fire Weather';
    
    return 'Other';
  }

  /**
   * Get hurricane category color
   */
  getHurricaneCategoryColor(category: number): string {
    switch (category) {
      case 5: return '#8B00FF'; // Purple - Catastrophic
      case 4: return '#FF0000'; // Red - Extreme  
      case 3: return '#FF4500'; // Orange Red - Major
      case 2: return '#FFA500'; // Orange - Moderate
      case 1: return '#FFFF00'; // Yellow - Minimal
      case 0: return '#00FF00'; // Green - Tropical Storm
      default: return '#808080'; // Gray - Unknown
    }
  }

  /**
   * Get hurricane category size for map markers
   */
  getHurricaneCategorySize(category: number): number {
    switch (category) {
      case 5: return 35; // Largest for Category 5
      case 4: return 30; // Large for Category 4
      case 3: return 25; // Medium-large for Category 3
      case 2: return 22; // Medium for Category 2
      case 1: return 20; // Standard for Category 1
      case 0: return 18; // Smaller for Tropical Storm
      default: return 15; // Smallest for unknown
    }
  }

  /**
   * Get hurricane category name
   */
  getHurricaneCategoryName(category: number): string {
    switch (category) {
      case 5: return 'Category 5 Hurricane';
      case 4: return 'Category 4 Hurricane';
      case 3: return 'Category 3 Hurricane';
      case 2: return 'Category 2 Hurricane';
      case 1: return 'Category 1 Hurricane';
      case 0: return 'Tropical Storm';
      default: return 'Storm System';
    }
  }

  /**
   * Get event icon based on category
   */
  getEventIcon(eventType: string): string {
    const category = this.getEventCategory(eventType);
    
    switch (category) {
      case 'Hurricane': return '🌀';
      case 'Tornado': return '🌪️';
      case 'Storm': return '⛈️';
      case 'Heat': return '🌡️';
      case 'Winter Storm': return '❄️';
      case 'Flood': return '🌊';
      case 'Wind': return '💨';
      case 'Fire Weather': return '🔥';
      default: return '⚠️';
    }
  }

  /**
   * Get hazard icon based on event type
   */
  getHazardIcon(event: string): string {
    const eventLower = event.toLowerCase();
    if (eventLower.includes('hurricane') || eventLower.includes('storm')) return '🌀';
    if (eventLower.includes('tornado')) return '🌪️';
    if (eventLower.includes('flood')) return '🌊';
    if (eventLower.includes('fire')) return '🔥';
    if (eventLower.includes('heat')) return '🌡️';
    if (eventLower.includes('winter') || eventLower.includes('snow')) return '❄️';
    if (eventLower.includes('wind')) return '💨';
    return '⚠️';
  }
}

export const nwsApi = new NWSApi();
