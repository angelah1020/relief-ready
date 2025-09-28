/**
 * FEMA API Integration for Disaster Relief Centers and Shelters
 * API Documentation: https://www.fema.gov/api/open
 */

export interface FEMADisasterDeclaration {
  disasterNumber: number;
  state: string;
  declarationType: string;
  declarationDate: string;
  fyDeclared: number;
  incidentType: string;
  declarationTitle: string;
  ihProgramDeclared: boolean;
  iaProgramDeclared: boolean;
  paProgramDeclared: boolean;
  hmProgramDeclared: boolean;
  incidentBeginDate: string;
  incidentEndDate: string;
  disasterCloseOutDate: string;
  fipsStateCode: string;
  fipsCountyCode: string;
  placeCode: string;
  designatedArea: string;
  declarationRequestNumber: string;
}

export interface FEMADisasterResponse {
  DisasterDeclarationsSummaries: FEMADisasterDeclaration[];
  metadata: {
    count: number;
    skip: number;
    top: number;
    entityname: string;
    version: string;
    url: string;
    rundate: string;
    runtime: string;
  };
}

export interface FEMAShelter {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  phone: string;
  capacity: number;
  currentOccupancy: number;
  status: 'open' | 'closed' | 'full' | 'alert' | 'standby' | 'limited';
  services: string[];
  accessibility: boolean;
  petFriendly: boolean;
  lastUpdated: string;
}

class FEMAApi {
  private baseUrl = 'https://www.fema.gov/api/open/v2';
  private allSheltersUrl = 'https://gis.fema.gov/arcgis/rest/services/NSS/FEMA_NSS/MapServer/5/query';

  /**
   * Get recent disaster declarations
   */
  async getRecentDisasters(limit: number = 100): Promise<FEMADisasterDeclaration[]> {
    const url = `${this.baseUrl}/DisasterDeclarationsSummaries?$top=${limit}&$orderby=declarationDate desc`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`FEMA API error: ${response.status} ${response.statusText}`);
      }
      
      const data: FEMADisasterResponse = await response.json();
      return data.DisasterDeclarationsSummaries;
    } catch (error) {
      console.warn('FEMA API unavailable:', error);
      return [];
    }
  }

  /**
   * Get disasters by state
   */
  async getDisastersByState(stateCode: string): Promise<FEMADisasterDeclaration[]> {
    const url = `${this.baseUrl}/DisasterDeclarationsSummaries?$filter=state eq '${stateCode}'&$orderby=declarationDate desc`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`FEMA API error: ${response.status} ${response.statusText}`);
      }
      
      const data: FEMADisasterResponse = await response.json();
      return data.DisasterDeclarationsSummaries;
    } catch (error) {
      console.warn('FEMA API unavailable:', error);
      return [];
    }
  }

  /**
   * Get active disasters (within last 30 days)
   */
  async getActiveDisasters(): Promise<FEMADisasterDeclaration[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];
    const url = `${this.baseUrl}/DisasterDeclarationsSummaries?$filter=declarationDate ge ${dateFilter}&$orderby=declarationDate desc`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`FEMA API error: ${response.status} ${response.statusText}`);
      }
      
      const data: FEMADisasterResponse = await response.json();
      return data.DisasterDeclarationsSummaries;
    } catch (error) {
      console.warn('FEMA API unavailable:', error);
      return [];
    }
  }

  /**
   * Fetch all shelter types from FEMA's unified Shelter Locations API
   * This endpoint includes OPEN, CLOSED, FULL, ALERT, STANDBY, and other status types
   */
  async fetchAllShelters(boundingBox?: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  }): Promise<FEMAShelter[]> {
    try {
      // Include all shelter types to show current shelter infrastructure
      // Note: During non-emergency periods, most shelters will be in "CLOSED" status
      let url = `${this.allSheltersUrl}?where=1=1&outFields=*&f=json&resultRecordCount=2000`;
      
      // Add spatial filter if bounding box provided
      if (boundingBox) {
        const geometry = `${boundingBox.minLng},${boundingBox.minLat},${boundingBox.maxLng},${boundingBox.maxLat}`;
        url += `&geometry=${geometry}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects`;
        console.log('Shelter API URL with spatial filter:', url);
      } else {
        console.log('Shelter API URL (no spatial filter):', url);
      }

      console.log('Fetching FEMA Shelters from unified API:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch FEMA Shelters: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.features || !Array.isArray(data.features)) {
        console.warn('No shelter features found in response');
        return [];
      }

      console.log(`Found ${data.features.length} total shelters from FEMA API`);
      
      return data.features.map((feature: any) => this.mapUnifiedShelterFeatureToFEMAShelter(feature))
        .filter((shelter: FEMAShelter | null) => shelter !== null) as FEMAShelter[];
      
    } catch (error) {
      console.warn('FEMA Shelter Locations API unavailable:', error);
      return [];
    }
  }

  /**
   * Map unified Shelter Locations ArcGIS feature to FEMAShelter interface
   */
  private mapUnifiedShelterFeatureToFEMAShelter(feature: any): FEMAShelter | null {
    const attrs = feature.attributes;
    
    // Validate required fields
    if (!attrs.shelter_id || !attrs.latitude || !attrs.longitude) {
      console.warn('Invalid shelter data: missing required fields', attrs);
      return null;
    }

    return {
      id: attrs.shelter_id.toString(),
      name: attrs.shelter_name || 'Unnamed Shelter',
      address: this.buildAddress(attrs),
      city: attrs.city || '',
      state: attrs.state || '',
      zipCode: attrs.zip || '',
      latitude: attrs.latitude,
      longitude: attrs.longitude,
      phone: this.formatPhone(attrs.org_main_phone || attrs.org_hotline_phone || attrs.org_other_phone),
      capacity: attrs.evacuation_capacity || attrs.post_impact_capacity || 0,
      currentOccupancy: attrs.total_population || 0,
      status: this.mapUnifiedShelterStatus(attrs.shelter_status_code),
      services: this.extractServices(attrs),
      accessibility: this.checkAccessibility(attrs),
      petFriendly: this.checkPetFriendly(attrs),
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Build full address from components
   */
  private buildAddress(attrs: any): string {
    const parts = [attrs.address_1, attrs.city, attrs.state, attrs.zip].filter(Boolean);
    return parts.join(', ');
  }

  /**
   * Format phone number
   */
  private formatPhone(phone: string | null | undefined): string {
    if (!phone) return '';
    
    // Clean the phone number and format if it's 10 digits
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }

  /**
   * Map unified shelter status code to our status enum
   * Handles all status codes from the Shelter Locations API
   */
  private mapUnifiedShelterStatus(statusCode: string | null | undefined): FEMAShelter['status'] {
    if (!statusCode) return 'closed';
    
    switch (statusCode.toUpperCase()) {
      case 'OPEN': 
        return 'open';
      case 'FULL':
        return 'full';
      case 'ALERT':
        return 'alert';
      case 'STANDBY':
        return 'standby';
      case 'CLOSED':
        return 'closed';
      default:
        return 'limited'; // For any unknown status codes
    }
  }

  /**
   * Extract available services from shelter attributes
   */
  private extractServices(attrs: any): string[] {
    const services: string[] = [];
    
    // Basic shelter service
    services.push('Emergency Shelter');
    
    // Check for specific services based on available fields
    if (attrs.generator_onsite === 'Y' || attrs.self_sufficient_electricity === 'Y') {
      services.push('Electricity/Charging');
    }
    
    if (attrs.pet_accommodations_code && attrs.pet_accommodations_code !== 'NONE') {
      services.push('Pet Accommodation');
    }
    
    if (attrs.evacuation_capacity > 0) {
      services.push('Evacuation Services');
    }
    
    if (attrs.post_impact_capacity > 0) {
      services.push('Post-Impact Housing');
    }
    
    // Add organization services if available
    if (attrs.org_organization_name) {
      services.push('Organization Support');
    }
    
    if (attrs.org_hotline_phone) {
      services.push('Hotline Support');
    }

    return services;
  }

  /**
   * Check accessibility features
   */
  private checkAccessibility(attrs: any): boolean {
    return attrs.ada_compliant === 'Y' || attrs.wheelchair_accessible === 'Y';
  }

  /**
   * Check pet-friendly status
   */
  private checkPetFriendly(attrs: any): boolean {
    return !!(attrs.pet_accommodations_code && attrs.pet_accommodations_code !== 'NONE');
  }



  /**
   * Get random services for mock shelters
   */
  private getRandomServices(): string[] {
    const allServices = [
      'Food Service',
      'Medical Care',
      'Showers',
      'Laundry',
      'Pet Care',
      'Child Care',
      'Internet Access',
      'Phone Charging',
      'Transportation',
      'Translation Services',
    ];

    const numServices = Math.floor(Math.random() * 5) + 2;
    const shuffled = allServices.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numServices);
  }

  /**
   * Get shelter status color
   */
  getShelterStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'open': return '#00FF00';     // Green - currently accepting people
      case 'alert': return '#FFA500';   // Orange - ready for activation
      case 'standby': return '#FFD700'; // Gold - on standby
      case 'full': return '#FF6600';    // Dark Orange - at capacity
      case 'limited': return '#FFFF00'; // Yellow - limited availability
      case 'closed': return '#FF0000';  // Red - not available
      default: return '#808080';        // Gray - unknown status
    }
  }

  /**
   * Calculate shelter occupancy percentage
   */
  getOccupancyPercentage(current: number, capacity: number): number {
    return Math.round((current / capacity) * 100);
  }

  /**
   * Format shelter services for display
   */
  formatServices(services: string[]): string {
    if (services.length <= 3) {
      return services.join(', ');
    }
    return `${services.slice(0, 3).join(', ')} +${services.length - 3} more`;
  }
}

export const femaApi = new FEMAApi();
