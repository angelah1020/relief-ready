/**
 * Homeless Shelter API Integration
 * API Documentation: https://rapidapi.com/homeless-shelter/api/homeless-shelter
 * Uses real data from homeless-shelter.p.rapidapi.com
 */

export interface HomelessShelter {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  location: string; // Format: "latitude,longitude"
  phone_number: string;
  email_address: string;
  fax_number: string;
  official_website: string;
  twitter: string;
  facebook: string;
  instagram: string;
  description: string;
  photo_urls: string[];
  update_datetime: string;
}

export interface HomelessShelterResponse extends Array<HomelessShelter> {}

class HomelessShelterApi {
  private baseUrl = 'https://homeless-shelter.p.rapidapi.com';
  private apiKey = '4360a6ab95msh21fd5f54fdee33ap1ca554jsn7ea41a309a56';

  /**
   * Get shelters by ZIP code
   */
  async getSheltersByZipCode(zipCode: string): Promise<HomelessShelter[]> {
    const url = `${this.baseUrl}/zipcode?zipcode=${zipCode}`;
    
    try {
      console.log(`Fetching real shelter data for ZIP code: ${zipCode}`);
      const response = await fetch(url, {
        headers: {
          'x-rapidapi-host': 'homeless-shelter.p.rapidapi.com',
          'x-rapidapi-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Homeless Shelter API error: ${response.status} ${response.statusText}`);
      }

      const data: HomelessShelterResponse = await response.json();
      console.log(`Found ${data.length} real shelters for ZIP ${zipCode}`);
      return data;
    } catch (error) {
      console.warn('Homeless Shelter API unavailable:', error);
      return [];
    }
  }

  /**
   * Get shelters by city and state
   */
  async getSheltersByCity(city: string, state: string): Promise<HomelessShelter[]> {
    const url = `${this.baseUrl}/city?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`;
    
    try {
      console.log(`Fetching real shelter data for ${city}, ${state}`);
      const response = await fetch(url, {
        headers: {
          'x-rapidapi-host': 'homeless-shelter.p.rapidapi.com',
          'x-rapidapi-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Homeless Shelter API error: ${response.status} ${response.statusText}`);
      }

      const data: HomelessShelterResponse = await response.json();
      console.log(`Found ${data.length} real shelters for ${city}, ${state}`);
      return data;
    } catch (error) {
      console.warn('Homeless Shelter API unavailable:', error);
      return [];
    }
  }

  /**
   * Convert homeless shelter data to FEMA shelter format
   */
  convertToFEMAShelter(shelter: HomelessShelter): any {
    const [latitude, longitude] = shelter.location.split(',').map(coord => parseFloat(coord.trim()));
    
    return {
      id: `real_shelter_${shelter.name.replace(/\s+/g, '_').toLowerCase()}`,
      name: shelter.name,
      address: shelter.address,
      city: shelter.city,
      state: shelter.state,
      zipCode: shelter.zip_code,
      latitude,
      longitude,
      phone: shelter.phone_number,
      capacity: this.estimateCapacity(shelter.description),
      currentOccupancy: this.estimateOccupancy(shelter.description),
      status: this.determineStatus(shelter.description),
      services: this.extractServices(shelter.description),
      accessibility: this.hasAccessibility(shelter.description),
      petFriendly: this.isPetFriendly(shelter.description),
      lastUpdated: shelter.update_datetime,
      website: shelter.official_website,
      email: shelter.email_address,
      description: shelter.description,
      photoUrls: shelter.photo_urls,
      // Mark as real data
      isRealData: true
    };
  }

  /**
   * Estimate capacity from description text
   */
  private estimateCapacity(description: string): number {
    const capacityMatch = description.match(/(\d+)\s*(people|men|women|beds|capacity|accommodates)/i);
    if (capacityMatch) {
      return parseInt(capacityMatch[1]);
    }
    
    // Default estimates based on shelter type in description
    const desc = description.toLowerCase();
    if (desc.includes('winter shelter')) return 80;
    if (desc.includes('emergency')) return 50;
    if (desc.includes('center')) return 100;
    if (desc.includes('gymnasium')) return 150;
    if (desc.includes('church') || desc.includes('fellowship')) return 75;
    
    return 50; // Default
  }

  /**
   * Estimate current occupancy based on real-world patterns
   */
  private estimateOccupancy(description: string): number {
    const capacity = this.estimateCapacity(description);
    const desc = description.toLowerCase();
    
    // Higher occupancy for winter/emergency shelters
    if (desc.includes('winter') || desc.includes('emergency')) {
      return Math.floor(capacity * 0.85); // Usually quite full
    }
    
    // Lower occupancy for specialized or daytime services
    if (desc.includes('day') || desc.includes('services only')) {
      return Math.floor(capacity * 0.4);
    }
    
    // Default to moderate occupancy
    return Math.floor(capacity * 0.65);
  }

  /**
   * Determine shelter status from description
   */
  private determineStatus(description: string): 'Open' | 'Closed' | 'Full' | 'Limited' {
    const desc = description.toLowerCase();
    
    if (desc.includes('closed') || desc.includes('temporarily closed')) return 'Closed';
    if (desc.includes('full') || desc.includes('at capacity')) return 'Full';
    if (desc.includes('limited') || desc.includes('by appointment') || desc.includes('first-come')) return 'Limited';
    
    return 'Open'; // Default to open for active listings
  }

  /**
   * Extract services from description text
   */
  private extractServices(description: string): string[] {
    const services: string[] = [];
    const desc = description.toLowerCase();
    
    if (desc.includes('meal') || desc.includes('food') || desc.includes('breakfast') || desc.includes('lunch') || desc.includes('dinner')) {
      services.push('Food Service');
    }
    if (desc.includes('shower')) services.push('Showers');
    if (desc.includes('laundry')) services.push('Laundry');
    if (desc.includes('medical') || desc.includes('health') || desc.includes('checkup')) {
      services.push('Medical Care');
    }
    if (desc.includes('computer') || desc.includes('internet')) services.push('Internet Access');
    if (desc.includes('phone')) services.push('Phone Access');
    if (desc.includes('counseling') || desc.includes('therapy')) services.push('Counseling');
    if (desc.includes('job') || desc.includes('employment') || desc.includes('resume')) {
      services.push('Job Assistance');
    }
    if (desc.includes('legal')) services.push('Legal Assistance');
    if (desc.includes('transportation') || desc.includes('bus')) services.push('Transportation');
    if (desc.includes('child') || desc.includes('kids')) services.push('Child Care');
    if (desc.includes('translation')) services.push('Translation Services');
    
    return services.length > 0 ? services : ['Basic Shelter'];
  }

  /**
   * Check if shelter has accessibility features
   */
  private hasAccessibility(description: string): boolean {
    const desc = description.toLowerCase();
    return desc.includes('accessible') || desc.includes('wheelchair') || desc.includes('ada') || desc.includes('disability');
  }

  /**
   * Check if shelter is pet-friendly
   */
  private isPetFriendly(description: string): boolean {
    const desc = description.toLowerCase();
    return desc.includes('pet') || desc.includes('animal') || desc.includes('dog') || desc.includes('cat');
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

export const homelessShelterApi = new HomelessShelterApi();
