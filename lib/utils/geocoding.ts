/**
 * ZIP Code Geocoding Utilities
 * Converts ZIP codes to approximate latitude/longitude coordinates
 */

interface ZipCodeCoordinates {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
}

/**
 * Get coordinates for a ZIP code using a free geocoding service
 */
export async function geocodeZipCode(zipCode: string, country: string = 'US'): Promise<ZipCodeCoordinates | null> {
  try {
    // Clean the ZIP code
    const cleanZip = zipCode.replace(/\D/g, '').substring(0, 5);
    
    if (cleanZip.length !== 5) {
      throw new Error('Invalid ZIP code format');
    }

    // Use OpenStreetMap Nominatim API (free, no API key required)
    const url = `https://nominatim.openstreetmap.org/search?format=json&country=${country}&postalcode=${cleanZip}&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Relief Ready/1.0 (emergency-prep-app@example.com)',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      // Fallback to approximate coordinates based on ZIP code ranges
      return getApproximateCoordinates(cleanZip);
    }

    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      city: result.display_name?.split(',')[0]?.trim(),
      state: extractState(result.display_name),
    };

  } catch (error) {
    // Geocoding failed, using approximate coordinates
    return getApproximateCoordinates(zipCode);
  }
}

/**
 * Extract state from display name
 */
function extractState(displayName: string): string | undefined {
  const parts = displayName?.split(',');
  if (parts && parts.length > 2) {
    const statePart = parts[parts.length - 2]?.trim();
    return statePart;
  }
  return undefined;
}

/**
 * Fallback: Get approximate coordinates based on ZIP code ranges
 * This provides rough geographic areas when API fails
 */
function getApproximateCoordinates(zipCode: string): ZipCodeCoordinates | null {
  const zip = parseInt(zipCode.substring(0, 3));
  
  // Approximate coordinates for major ZIP code regions in the US
  const zipRanges: { [key: string]: ZipCodeCoordinates } = {
    // Northeast
    '010-027': { latitude: 42.3601, longitude: -71.0589, city: 'Boston', state: 'MA' }, // MA, RI, NH, VT, ME
    '030-069': { latitude: 40.7128, longitude: -74.0060, city: 'New York', state: 'NY' }, // NY, NJ, CT
    '100-149': { latitude: 40.7128, longitude: -74.0060, city: 'New York', state: 'NY' }, // NY
    '150-199': { latitude: 39.9526, longitude: -75.1652, city: 'Philadelphia', state: 'PA' }, // PA, DE
    
    // Southeast
    '200-269': { latitude: 38.9072, longitude: -77.0369, city: 'Washington', state: 'DC' }, // DC, MD, VA, WV
    '270-289': { latitude: 38.2904, longitude: -92.6390, city: 'Columbia', state: 'MO' }, // MO
    '290-299': { latitude: 35.7796, longitude: -78.6382, city: 'Raleigh', state: 'NC' }, // NC
    '300-319': { latitude: 33.7490, longitude: -84.3880, city: 'Atlanta', state: 'GA' }, // GA
    '320-349': { latitude: 30.4383, longitude: -84.2807, city: 'Tallahassee', state: 'FL' }, // FL
    '350-369': { latitude: 33.5186, longitude: -86.8104, city: 'Birmingham', state: 'AL' }, // AL
    '370-385': { latitude: 35.2271, longitude: -80.8431, city: 'Charlotte', state: 'NC' }, // NC, SC, TN
    '386-397': { latitude: 36.1627, longitude: -86.7816, city: 'Nashville', state: 'TN' }, // TN, MS, GA
    '398-399': { latitude: 33.7490, longitude: -84.3880, city: 'Atlanta', state: 'GA' }, // GA
    
    // Midwest
    '400-419': { latitude: 38.6270, longitude: -90.1994, city: 'St. Louis', state: 'MO' }, // KY, IN, MO
    '420-449': { latitude: 39.7684, longitude: -86.1581, city: 'Indianapolis', state: 'IN' }, // IN
    '450-479': { latitude: 41.8781, longitude: -87.6298, city: 'Chicago', state: 'IL' }, // IL, IA
    '480-499': { latitude: 42.3314, longitude: -84.5951, city: 'Detroit', state: 'MI' }, // MI
    '500-519': { latitude: 41.5868, longitude: -93.6250, city: 'Des Moines', state: 'IA' }, // IA
    '520-549': { latitude: 44.9537, longitude: -93.0900, city: 'Minneapolis', state: 'MN' }, // MN, WI, ND, SD
    '550-567': { latitude: 44.9537, longitude: -93.0900, city: 'Minneapolis', state: 'MN' }, // MN, WI
    '570-577': { latitude: 44.2619, longitude: -89.6179, city: 'Wisconsin Rapids', state: 'WI' }, // WI
    '580-588': { latitude: 41.2033, longitude: -95.9920, city: 'Omaha', state: 'NE' }, // NE
    '590-599': { latitude: 39.0458, longitude: -76.6413, city: 'Baltimore', state: 'MD' }, // MD, DC
    
    // South
    '600-629': { latitude: 41.8781, longitude: -87.6298, city: 'Chicago', state: 'IL' }, // IL
    '630-639': { latitude: 38.6270, longitude: -90.1994, city: 'St. Louis', state: 'MO' }, // MO, KS
    '640-658': { latitude: 39.0458, longitude: -94.5786, city: 'Kansas City', state: 'MO' }, // MO, KS
    '660-679': { latitude: 39.0458, longitude: -94.5786, city: 'Kansas City', state: 'KS' }, // KS
    '680-693': { latitude: 41.2565, longitude: -95.9345, city: 'Omaha', state: 'NE' }, // NE
    '700-714': { latitude: 29.7604, longitude: -95.3698, city: 'Houston', state: 'TX' }, // TX
    '715-729': { latitude: 29.7604, longitude: -95.3698, city: 'Houston', state: 'TX' }, // TX
    '730-749': { latitude: 32.7767, longitude: -96.7970, city: 'Dallas', state: 'TX' }, // TX, OK
    '750-799': { latitude: 32.7767, longitude: -96.7970, city: 'Dallas', state: 'TX' }, // TX
    
    // Mountain/West
    '800-816': { latitude: 39.7392, longitude: -104.9903, city: 'Denver', state: 'CO' }, // CO
    '820-831': { latitude: 41.1450, longitude: -104.8197, city: 'Cheyenne', state: 'WY' }, // WY
    '832-838': { latitude: 43.0759, longitude: -107.2903, city: 'Casper', state: 'WY' }, // WY
    '840-847': { latitude: 40.7608, longitude: -111.8910, city: 'Salt Lake City', state: 'UT' }, // UT
    '850-860': { latitude: 33.4484, longitude: -112.0740, city: 'Phoenix', state: 'AZ' }, // AZ
    '870-884': { latitude: 35.6870, longitude: -105.9378, city: 'Santa Fe', state: 'NM' }, // NM
    '890-898': { latitude: 36.1699, longitude: -115.1398, city: 'Las Vegas', state: 'NV' }, // NV
    
    // Pacific
    '900-961': { latitude: 34.0522, longitude: -118.2437, city: 'Los Angeles', state: 'CA' }, // CA
    '970-979': { latitude: 44.9778, longitude: -93.2650, city: 'Minneapolis', state: 'MN' }, // MN (PO Boxes)
    '980-994': { latitude: 47.6062, longitude: -122.3321, city: 'Seattle', state: 'WA' }, // WA
    '995-999': { latitude: 61.2181, longitude: -149.9003, city: 'Anchorage', state: 'AK' }, // AK
  };

  // Find the matching range
  for (const [range, coords] of Object.entries(zipRanges)) {
    const [start, end] = range.split('-').map(s => parseInt(s));
    if (zip >= start && zip <= end) {
      return coords;
    }
  }

  // Default to center of US if no match found
  return {
    latitude: 39.8283,
    longitude: -98.5795,
    city: 'Geographic Center',
    state: 'US',
  };
}

/**
 * Validate ZIP code format
 */
export function isValidZipCode(zipCode: string): boolean {
  const cleanZip = zipCode.replace(/\D/g, '');
  return cleanZip.length === 5 && !isNaN(parseInt(cleanZip));
}

/**
 * Format ZIP code for display
 */
export function formatZipCode(zipCode: string): string {
  const cleanZip = zipCode.replace(/\D/g, '').substring(0, 5);
  return cleanZip;
}
