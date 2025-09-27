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
   * Get all active alerts
   */
  async getActiveAlerts(): Promise<NWSAlertsResponse> {
    const response = await this.fetchWithUserAgent(`${this.baseUrl}/alerts/active`);
    return response.json();
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
