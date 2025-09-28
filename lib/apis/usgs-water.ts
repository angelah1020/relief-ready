/**
 * USGS Water Data API Integration for Flood Gauges
 * API Key: 7ysxd23WgaK1JhsYK3ltdd0m9ZVek2pSvrcaFf7w
 * Documentation: https://waterservices.usgs.gov/rest/
 */

export interface USGSWaterSite {
  name: string;
  siteCode: string;
  latitude: number;
  longitude: number;
  currentValue: number;
  unit: string;
  floodStage?: number;
  actionStage?: number;
  status: 'normal' | 'action' | 'minor' | 'moderate' | 'major';
  lastUpdated: string;
}

export interface USGSWaterResponse {
  value: {
    timeSeries: Array<{
      sourceInfo: {
        siteName: string;
        siteCode: Array<{
          value: string;
          network: string;
        }>;
        geoLocation: {
          geogLocation: {
            latitude: number;
            longitude: number;
          };
        };
      };
      values: Array<{
        value: Array<{
          value: string;
          dateTime: string;
        }>;
      }>;
    }>;
  };
}

class USGSWaterApi {
  private baseUrl = 'https://waterservices.usgs.gov/nwis/iv';
  private apiKey = '7ysxd23WgaK1JhsYK3ltdd0m9ZVek2pSvrcaFf7w';

  /**
   * Get flood gauge data for a region
   */
  async getFloodGauges(
    minLatitude: number,
    maxLatitude: number,
    minLongitude: number,
    maxLongitude: number
  ): Promise<USGSWaterSite[]> {
    try {
      // USGS API has bounding box size limitations (max ~2.9 degrees width)
      // If the requested area is too large, limit it to a reasonable size
      const maxLatDelta = 2.5; // degrees
      const maxLngDelta = 2.5; // degrees
      
      let adjustedMinLat = minLatitude;
      let adjustedMaxLat = maxLatitude;
      let adjustedMinLng = minLongitude;
      let adjustedMaxLng = maxLongitude;
      
      // Calculate center point
      const centerLat = (minLatitude + maxLatitude) / 2;
      const centerLng = (minLongitude + maxLongitude) / 2;
      
      // If bounding box is too large, create a smaller one centered on the region
      if ((maxLatitude - minLatitude) > maxLatDelta) {
        adjustedMinLat = centerLat - maxLatDelta / 2;
        adjustedMaxLat = centerLat + maxLatDelta / 2;
      }
      
      if ((maxLongitude - minLongitude) > maxLngDelta) {
        adjustedMinLng = centerLng - maxLngDelta / 2;
        adjustedMaxLng = centerLng + maxLngDelta / 2;
      }
      
      const bbox = `${adjustedMinLng},${adjustedMinLat},${adjustedMaxLng},${adjustedMaxLat}`;
      const url = `${this.baseUrl}?format=json&bBox=${bbox}&parameterCd=00065&siteStatus=active`;
      
      console.log(`Fetching flood gauges with bbox: ${bbox} (original: ${minLongitude},${minLatitude},${maxLongitude},${maxLatitude})`);
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`USGS Water API error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`USGS Water API error: ${response.status} ${response.statusText}`);
      }

      const data: USGSWaterResponse = await response.json();
      const gauges = this.parseWaterData(data);
      console.log(`Fetched ${gauges.length} flood gauges from USGS API`);
      return gauges;
    } catch (error) {
      console.warn('USGS Water API unavailable, using mock data:', error);
      return this.getMockFloodGauges(minLatitude, maxLatitude, minLongitude, maxLongitude);
    }
  }

  /**
   * Parse USGS water data response
   */
  private parseWaterData(data: USGSWaterResponse): USGSWaterSite[] {
    if (!data.value?.timeSeries) return [];

    return data.value.timeSeries.map(site => {
      const siteInfo = site.sourceInfo;
      const values = site.values[0]?.value || [];
      const latestValue = values[values.length - 1];
      
      const currentValue = latestValue ? parseFloat(latestValue.value) : 0;
      const status = this.determineFloodStatus(currentValue);

      return {
        name: siteInfo.siteName,
        siteCode: siteInfo.siteCode[0]?.value || 'Unknown',
        latitude: siteInfo.geoLocation.geogLocation.latitude,
        longitude: siteInfo.geoLocation.geogLocation.longitude,
        currentValue,
        unit: 'ft',
        status,
        lastUpdated: latestValue?.dateTime || new Date().toISOString(),
      };
    });
  }

  /**
   * Determine flood status based on gauge height
   */
  private determineFloodStatus(height: number): 'normal' | 'action' | 'minor' | 'moderate' | 'major' {
    if (height >= 20) return 'major';
    if (height >= 15) return 'moderate';
    if (height >= 12) return 'minor';
    if (height >= 10) return 'action';
    return 'normal';
  }

  /**
   * Get flood status color
   */
  getFloodStatusColor(status: string): string {
    switch (status) {
      case 'major': return '#8B00FF';     // Purple
      case 'moderate': return '#FF0000';  // Red
      case 'minor': return '#FF6600';     // Orange
      case 'action': return '#FFFF00';    // Yellow
      case 'normal': return '#00FF00';    // Green
      default: return '#808080';          // Gray
    }
  }

  /**
   * Get flood status size
   */
  getFloodStatusSize(status: string): number {
    switch (status) {
      case 'major': return 25;
      case 'moderate': return 22;
      case 'minor': return 19;
      case 'action': return 16;
      case 'normal': return 13;
      default: return 10;
    }
  }

  /**
   * Mock flood gauge data for demo
   */
  private getMockFloodGauges(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number
  ): USGSWaterSite[] {
    const mockSites: USGSWaterSite[] = [];
    const statuses: Array<'normal' | 'action' | 'minor' | 'moderate' | 'major'> = 
      ['normal', 'normal', 'normal', 'action', 'minor'];

    for (let i = 0; i < 5; i++) {
      const lat = minLat + Math.random() * (maxLat - minLat);
      const lng = minLng + Math.random() * (maxLng - minLng);
      const status = statuses[i];
      
      let height: number;
      switch (status) {
        case 'major': height = 22; break;
        case 'moderate': height = 16; break;
        case 'minor': height = 13; break;
        case 'action': height = 11; break;
        default: height = 8; break;
      }

      mockSites.push({
        name: `River Gauge ${i + 1}`,
        siteCode: `USGS${String(i + 1).padStart(8, '0')}`,
        latitude: lat,
        longitude: lng,
        currentValue: height,
        unit: 'ft',
        floodStage: 15,
        actionStage: 10,
        status,
        lastUpdated: new Date().toISOString(),
      });
    }

    return mockSites;
  }

  /**
   * Format gauge height for display
   */
  formatHeight(height: number): string {
    return `${height.toFixed(1)} ft`;
  }

  /**
   * Get status description
   */
  getStatusDescription(status: string): string {
    switch (status) {
      case 'major': return 'Major Flood';
      case 'moderate': return 'Moderate Flood';
      case 'minor': return 'Minor Flood';
      case 'action': return 'Action Stage';
      case 'normal': return 'Normal';
      default: return 'Unknown';
    }
  }
}

export const usgsWaterApi = new USGSWaterApi();
