/**
 * Official OpenFEMA API Integration
 * API Documentation: https://www.fema.gov/openfema-data-page
 * Provides real FEMA disaster declarations and emergency data
 */

export interface FEMADisasterDeclaration {
  femaDeclarationString: string;
  disasterNumber: number;
  state: string;
  declarationType: 'DR' | 'EM' | 'FM'; // Disaster, Emergency, Fire Management
  declarationDate: string;
  fyDeclared: number;
  incidentType: string;
  declarationTitle: string;
  ihProgramDeclared: boolean; // Individual Assistance
  iaProgramDeclared: boolean; // Individual Assistance
  paProgramDeclared: boolean; // Public Assistance
  hmProgramDeclared: boolean; // Hazard Mitigation
  incidentBeginDate: string;
  incidentEndDate: string;
  disasterCloseoutDate?: string;
  tribalRequest: boolean;
  fipsStateCode: string;
  fipsCountyCode: string;
  placeCode: string;
  designatedArea: string;
  declarationRequestNumber: string;
  lastIAFilingDate?: string;
  incidentId: string;
  region: number;
  designatedIncidentTypes: string;
  lastRefresh: string;
  hash: string;
  id: string;
}

export interface OpenFEMAResponse {
  metadata?: {
    count: number;
    skip: number;
    top: number;
    entityname: string;
    version: string;
    url: string;
    rundate: string;
    runtime: string;
  };
  [key: number]: FEMADisasterDeclaration;
}

class OpenFEMAApi {
  private baseUrl = 'https://www.fema.gov/api/open/v2';

  /**
   * Get active disaster declarations (within last 30 days)
   */
  async getActiveDisasters(): Promise<FEMADisasterDeclaration[]> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];
      
      const url = `${this.baseUrl}/DisasterDeclarationsSummaries`;
      console.log('Fetching active FEMA disasters from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OpenFEMA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Extract disasters from OpenFEMA response structure
      const disasters: FEMADisasterDeclaration[] = data.DisasterDeclarationsSummaries || [];
      
      // Filter for recent disasters and emergency types that would require shelters
      const recentDisasters = disasters.filter(disaster => {
        const declarationDate = new Date(disaster.declarationDate);
        const isRecent = declarationDate >= thirtyDaysAgo;
        const needsShelters = this.disasterRequiresShelters(disaster.incidentType, disaster.declarationType);
        return isRecent && needsShelters;
      });

      console.log(`Found ${recentDisasters.length} active FEMA disasters requiring shelters`);
      return recentDisasters;
    } catch (error) {
      console.warn('OpenFEMA API unavailable:', error);
      return [];
    }
  }

  /**
   * Get disasters by state
   */
  async getDisastersByState(stateCode: string): Promise<FEMADisasterDeclaration[]> {
    try {
      const url = `${this.baseUrl}/DisasterDeclarationsSummaries`;
      console.log(`Fetching FEMA disasters for state ${stateCode}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OpenFEMA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const disasters: FEMADisasterDeclaration[] = data.DisasterDeclarationsSummaries || [];
      
      // Filter by state and recent disasters
      const stateDisasters = disasters.filter(disaster => 
        disaster.state === stateCode.toUpperCase() && 
        this.disasterRequiresShelters(disaster.incidentType, disaster.declarationType)
      );

      console.log(`Found ${stateDisasters.length} FEMA disasters for state ${stateCode}`);
      return stateDisasters;
    } catch (error) {
      console.warn('OpenFEMA API unavailable for state query:', error);
      return [];
    }
  }

  /**
   * Get disasters affecting a specific county by FIPS code
   */
  async getDisastersByCounty(stateCode: string, countyCode: string): Promise<FEMADisasterDeclaration[]> {
    try {
      const stateDisasters = await this.getDisastersByState(stateCode);
      
      // Filter by county FIPS code
      const countyDisasters = stateDisasters.filter(disaster => 
        disaster.fipsCountyCode === countyCode.padStart(3, '0')
      );

      console.log(`Found ${countyDisasters.length} FEMA disasters for county ${stateCode}-${countyCode}`);
      return countyDisasters;
    } catch (error) {
      console.warn('OpenFEMA API unavailable for county query:', error);
      return [];
    }
  }

  /**
   * Determine if disaster type requires emergency shelters
   */
  private disasterRequiresShelters(incidentType: string, declarationType: string): boolean {
    const incident = incidentType.toLowerCase();
    
    // Emergency declarations typically require immediate shelter response
    if (declarationType === 'EM') return true;
    
    // Disaster types that typically require shelters
    const shelterRequiringDisasters = [
      'hurricane', 'tropical storm', 'typhoon',
      'tornado', 'severe storm',
      'flood', 'flooding', 'flash flood',
      'wildfire', 'fire',
      'winter storm', 'blizzard', 'ice storm',
      'earthquake',
      'volcanic', 'tsunami',
      'terrorist', 'chemical', 'biological'
    ];

    return shelterRequiringDisasters.some(disasterType => 
      incident.includes(disasterType)
    );
  }

  /**
   * Get shelter priority level based on disaster type
   */
  getShelterPriority(disaster: FEMADisasterDeclaration): 'critical' | 'high' | 'medium' | 'low' {
    const incident = disaster.incidentType.toLowerCase();
    
    // Critical - immediate evacuation disasters
    if (incident.includes('hurricane') || incident.includes('wildfire') || 
        incident.includes('tsunami') || incident.includes('volcanic')) {
      return 'critical';
    }
    
    // High - major displacement disasters
    if (incident.includes('tornado') || incident.includes('flood') || 
        incident.includes('earthquake') || disaster.declarationType === 'EM') {
      return 'high';
    }
    
    // Medium - significant impact disasters
    if (incident.includes('severe storm') || incident.includes('winter storm') || 
        incident.includes('blizzard')) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Format disaster for display
   */
  formatDisaster(disaster: FEMADisasterDeclaration): string {
    const date = new Date(disaster.declarationDate).toLocaleDateString();
    return `${disaster.incidentType} - ${disaster.designatedArea} (${date})`;
  }

  /**
   * Check if disaster is currently active (not closed)
   */
  isDisasterActive(disaster: FEMADisasterDeclaration): boolean {
    if (disaster.disasterCloseoutDate) {
      return new Date(disaster.disasterCloseoutDate) > new Date();
    }
    
    // If no closeout date, consider active if incident end date is future or recent
    const endDate = new Date(disaster.incidentEndDate);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return endDate >= oneWeekAgo;
  }
}

export const openFEMAApi = new OpenFEMAApi();
