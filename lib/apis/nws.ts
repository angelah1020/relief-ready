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

class NWSApi {
  private baseUrl = 'https://api.weather.gov';
  private userAgent = 'ReliefReady/1.0 (emergency-prep-app@example.com)';

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
        features: this.getMockAlerts(),
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
   * Get event icon based on category
   */
  getEventIcon(eventType: string): string {
    const category = this.getEventCategory(eventType);
    
    switch (category) {
      case 'Hurricane': return '🌧️';
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
