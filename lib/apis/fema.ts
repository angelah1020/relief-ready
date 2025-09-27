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
  status: 'Open' | 'Closed' | 'Full' | 'Limited';
  services: string[];
  accessibility: boolean;
  petFriendly: boolean;
  lastUpdated: string;
}

class FEMAApi {
  private baseUrl = 'https://www.fema.gov/api/open/v2';

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
   * Mock shelter data (FEMA doesn't provide real-time shelter API)
   * In production, this would integrate with Red Cross or local emergency management APIs
   */
  getMockShelters(latitude: number, longitude: number, radius: number = 50): FEMAShelter[] {
    // Generate mock shelters around the given location
    const shelters: FEMAShelter[] = [];
    const shelterTypes = [
      'Community Center',
      'High School Gymnasium', 
      'Church Fellowship Hall',
      'Recreation Center',
      'Convention Center',
      'Emergency Shelter',
    ];

    for (let i = 0; i < 5; i++) {
      const latOffset = (Math.random() - 0.5) * (radius / 69); // Roughly convert miles to degrees
      const lonOffset = (Math.random() - 0.5) * (radius / 54.6);
      
      shelters.push({
        id: `shelter_${i + 1}`,
        name: `${shelterTypes[i % shelterTypes.length]} - Site ${i + 1}`,
        address: `${100 + i * 50} Main Street`,
        city: 'Emergency City',
        state: 'ST',
        zipCode: `${12345 + i}`,
        latitude: latitude + latOffset,
        longitude: longitude + lonOffset,
        phone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        capacity: Math.floor(Math.random() * 200) + 50,
        currentOccupancy: Math.floor(Math.random() * 150),
        status: ['Open', 'Limited', 'Full'][Math.floor(Math.random() * 3)] as 'Open' | 'Limited' | 'Full',
        services: this.getRandomServices(),
        accessibility: Math.random() > 0.3,
        petFriendly: Math.random() > 0.5,
        lastUpdated: new Date().toISOString(),
      });
    }

    return shelters;
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
      case 'open': return '#00FF00';     // Green
      case 'limited': return '#FFFF00'; // Yellow  
      case 'full': return '#FF6600';    // Orange
      case 'closed': return '#FF0000';  // Red
      default: return '#808080';        // Gray
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
