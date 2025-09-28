/**
 * National Interagency Fire Center (NIFC) API Integration
 * API Documentation: https://data-nifc.opendata.arcgis.com/
 */

export interface NIFCWildfireIncident {
  id: string;
  incidentName: string;
  latitude: number;
  longitude: number;
  acres: number;
  containmentPercent: number;
  fireDiscoveryDateTime: string;
  controlDateTime?: string;
  containmentDateTime?: string;
  fireOutDateTime?: string;
  lastUpdate: string;
  incidentTypeCategory: string;
  gacc: string; // Geographic Area Coordination Center
  state: string;
  county: string;
  unitId: string;
  fireCode: string;
  irwinId: string;
  complexName?: string;
  incidentShortDescription?: string;
  incidentCause: string;
  primaryFuelModel?: string;
  primaryFuelType?: string;
  percentContained: number;
  estimatedCostToDate?: number;
  projectedFinalCost?: number;
  reportDateTime: string;
  uniqueFireIdentifier: string;
  isActive: boolean;
  isComplex: boolean;
  fireYear: number;
}

export interface NIFCWildfireResponse {
  features: Array<{
    attributes: any;
    geometry: {
      x: number;
      y: number;
    };
  }>;
}

class NIFCApi {
  private baseUrl = 'https://services.arcgis.com/SXbDpmb7xQkk44JV/ArcGIS/rest/services';
  private incidentsEndpoint = '/WFIGS_Incident_Locations_Current/FeatureServer/0/query';

  /**
   * Get active wildfire incidents from NIFC
   */
  async getActiveWildfireIncidents(): Promise<NIFCWildfireIncident[]> {
    try {
      // Query for active wildfire incidents
      const url = `${this.baseUrl}${this.incidentsEndpoint}?where=1=1&outFields=*&f=json&resultRecordCount=1000`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NIFC API error: ${response.status} ${response.statusText}`);
      }
      
      const data: NIFCWildfireResponse = await response.json();
      
      if (!data.features || !Array.isArray(data.features)) {
        return [];
      }

      return data.features
        .map(feature => this.mapNIFCFeatureToIncident(feature))
        .filter(incident => incident !== null) as NIFCWildfireIncident[];
        
    } catch (error) {
      // NIFC API unavailable, return empty array
      return [];
    }
  }

  /**
   * Get active wildfire incidents in a bounding box
   */
  async getWildfiresInBoundingBox(
    north: number,
    south: number,
    east: number,
    west: number
  ): Promise<NIFCWildfireIncident[]> {
    try {
      // Create geometry parameter for spatial query
      const geometry = `${west},${south},${east},${north}`;
      const url = `${this.baseUrl}${this.incidentsEndpoint}?where=1=1&geometry=${geometry}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&f=json&resultRecordCount=1000`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NIFC API error: ${response.status} ${response.statusText}`);
      }
      
      const data: NIFCWildfireResponse = await response.json();
      
      if (!data.features || !Array.isArray(data.features)) {
        return [];
      }

      return data.features
        .map(feature => this.mapNIFCFeatureToIncident(feature))
        .filter(incident => incident !== null) as NIFCWildfireIncident[];
        
    } catch (error) {
      // NIFC API unavailable, return empty array
      return [];
    }
  }

  /**
   * Map NIFC feature to wildfire incident interface
   */
  private mapNIFCFeatureToIncident(feature: any): NIFCWildfireIncident | null {
    const attrs = feature.attributes;
    const geometry = feature.geometry;
    
    // Validate required fields
    if (!attrs || !geometry || !attrs.IncidentName) {
      return null;
    }

    // Convert acres to number, handle various formats
    const acres = this.parseNumericValue(attrs.DailyAcres || attrs.CalculatedAcres || attrs.GISAcres || 0);
    
    // Parse containment percentage
    const containmentPercent = this.parseNumericValue(attrs.PercentContained || attrs.ContainmentPercent || 0);

    return {
      id: attrs.UniqueFireIdentifier || attrs.IRWINID || attrs.IncidentName || 'unknown',
      incidentName: attrs.IncidentName || 'Unnamed Fire',
      latitude: geometry.y || 0,
      longitude: geometry.x || 0,
      acres: acres,
      containmentPercent: Math.min(100, Math.max(0, containmentPercent)), // Ensure 0-100 range
      fireDiscoveryDateTime: attrs.FireDiscoveryDateTime || new Date().toISOString(),
      controlDateTime: attrs.ControlDateTime || undefined,
      containmentDateTime: attrs.ContainmentDateTime || undefined,
      fireOutDateTime: attrs.FireOutDateTime || undefined,
      lastUpdate: attrs.ModifiedOnDateTime || attrs.CreateOnDateTime || new Date().toISOString(),
      incidentTypeCategory: attrs.IncidentTypeCategory || 'Wildfire',
      gacc: attrs.GACC || 'Unknown',
      state: attrs.POOState || attrs.UnitIdentifier?.substring(0, 2) || 'Unknown',
      county: attrs.POOCounty || 'Unknown',
      unitId: attrs.UnitIdentifier || 'Unknown',
      fireCode: attrs.LocalIncidentIdentifier || 'Unknown',
      irwinId: attrs.IRWINID || '',
      complexName: attrs.ComplexName || undefined,
      incidentShortDescription: attrs.IncidentShortDescription || undefined,
      incidentCause: attrs.FireCause || attrs.StatisticalCause || 'Unknown',
      primaryFuelModel: attrs.PrimaryFuelModel || undefined,
      primaryFuelType: attrs.PrimaryFuelType || undefined,
      percentContained: Math.min(100, Math.max(0, containmentPercent)),
      estimatedCostToDate: this.parseNumericValue(attrs.EstimatedCostToDate),
      projectedFinalCost: this.parseNumericValue(attrs.ProjectedFinalCost),
      reportDateTime: attrs.ICS209ReportDateTime || attrs.ModifiedOnDateTime || new Date().toISOString(),
      uniqueFireIdentifier: attrs.UniqueFireIdentifier || attrs.IRWINID || attrs.IncidentName || 'unknown',
      isActive: !attrs.FireOutDateTime && attrs.IncidentTypeCategory !== 'Prescribed Fire',
      isComplex: !!attrs.ComplexName,
      fireYear: new Date(attrs.FireDiscoveryDateTime || Date.now()).getFullYear(),
    };
  }

  /**
   * Parse numeric values safely
   */
  private parseNumericValue(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[,$]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Get wildfire status color based on containment and size
   */
  getWildfireStatusColor(incident: NIFCWildfireIncident): string {
    if (incident.fireOutDateTime) return '#808080'; // Gray - Fire is out
    if (incident.percentContained >= 100) return '#00FF00'; // Green - Fully contained
    if (incident.percentContained >= 75) return '#90EE90'; // Light Green - Mostly contained
    if (incident.percentContained >= 50) return '#FFFF00'; // Yellow - Half contained
    if (incident.percentContained >= 25) return '#FFA500'; // Orange - Partially contained
    return '#FF0000'; // Red - Uncontained or low containment
  }

  /**
   * Get wildfire size category
   */
  getWildfireSizeCategory(acres: number): 'small' | 'medium' | 'large' | 'very_large' | 'extreme' {
    if (acres >= 100000) return 'extreme';    // 100,000+ acres
    if (acres >= 50000) return 'very_large';  // 50,000+ acres
    if (acres >= 5000) return 'large';        // 5,000+ acres
    if (acres >= 100) return 'medium';        // 100+ acres
    return 'small';                           // < 100 acres
  }

  /**
   * Get marker size based on fire size
   */
  getWildfireMarkerSize(incident: NIFCWildfireIncident): number {
    const category = this.getWildfireSizeCategory(incident.acres);
    switch (category) {
      case 'extreme': return 30;
      case 'very_large': return 25;
      case 'large': return 20;
      case 'medium': return 15;
      case 'small': return 12;
      default: return 10;
    }
  }

  /**
   * Format acres for display
   */
  formatAcres(acres: number): string {
    if (acres >= 1000) {
      return `${(acres / 1000).toFixed(1)}K acres`;
    }
    return `${Math.round(acres)} acres`;
  }

  /**
   * Format containment percentage for display
   */
  formatContainment(percent: number): string {
    if (percent >= 100) return 'Fully Contained';
    if (percent === 0) return 'Uncontained';
    return `${Math.round(percent)}% Contained`;
  }

  /**
   * Get time since fire started
   */
  getTimeSinceDiscovery(discoveryDateTime: string): string {
    const discovery = new Date(discoveryDateTime);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - discovery.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  }

  /**
   * Check if fire is considered a major incident
   */
  isMajorIncident(incident: NIFCWildfireIncident): boolean {
    return incident.acres >= 1000 || 
           incident.estimatedCostToDate && incident.estimatedCostToDate >= 1000000 ||
           incident.percentContained < 50;
  }
}

export const nifcApi = new NIFCApi();
