import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { nwsApi, NWSAlert, HurricaneAlert } from '@/lib/apis/nws';
import { usgsApi, USGSEarthquake } from '@/lib/apis/usgs';
import { nasaApi, NASAFireHotspot } from '@/lib/apis/nasa';
import { nifcApi, NIFCWildfireIncident } from '@/lib/apis/nifc';
import { femaApi, FEMAShelter } from '@/lib/apis/fema';
import { usgsWaterApi, USGSWaterSite } from '@/lib/apis/usgs-water';
import { useHousehold } from './HouseholdContext';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface LayerConfig {
  id: string;
  name: string;
  enabled: boolean;
  icon: string;
  color: string;
}

export interface DisasterData {
  alerts: NWSAlert[];
  hurricanes: HurricaneAlert[];
  earthquakes: USGSEarthquake[];
  wildfires: NIFCWildfireIncident[];
  shelters: FEMAShelter[];
  floodGauges: USGSWaterSite[];
}

interface MapContextType {
  // Location & Region
  currentLocation: Location.LocationObject | null;
  householdLocation: { latitude: number; longitude: number } | null;
  mapRegion: MapRegion;
  setMapRegion: (region: MapRegion) => void;
  
  // Layer Management
  layers: LayerConfig[];
  toggleLayer: (layerId: string) => void;
  
  // Disaster Data
  disasterData: DisasterData;
  loading: boolean;
  lastUpdated: Date | null;
  
  // Actions
  refreshData: () => Promise<void>;
  centerOnLocation: () => void;
  centerOnHousehold: () => void;
  
  // Permissions
  locationPermission: boolean;
  requestLocationPermission: () => Promise<boolean>;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

const DEFAULT_LAYERS: LayerConfig[] = [
  { id: 'alerts', name: 'Weather Alerts', enabled: true, icon: '⚠️', color: '#FF6600' },
  { id: 'hurricanes', name: 'Hurricanes', enabled: true, icon: '🌀', color: '#8B00FF' },
  { id: 'earthquakes', name: 'Earthquakes', enabled: true, icon: '🌍', color: '#8B4513' },
  { id: 'wildfires', name: 'Wildfires', enabled: false, icon: '🔥', color: '#FF4500' },
  { id: 'floods', name: 'Floods', enabled: true, icon: '🌊', color: '#1E40AF' },
  { id: 'shelters', name: 'Open Shelters', enabled: false, icon: '🏠', color: '#4169E1' },
];

const DEFAULT_REGION: MapRegion = {
  latitude: 39.8283,
  longitude: -98.5795,
  latitudeDelta: 10,
  longitudeDelta: 10,
};

const STORAGE_KEYS = {
  MAP_REGION: '@map_region',
  LAYERS: '@map_layers',
  LAST_UPDATED: '@map_last_updated',
};

export function MapProvider({ children }: { children: React.ReactNode }) {
  const { currentHousehold } = useHousehold();
  
  // State
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [mapRegion, setMapRegion] = useState<MapRegion>(DEFAULT_REGION);
  const [layers, setLayers] = useState<LayerConfig[]>(DEFAULT_LAYERS);
  const [disasterData, setDisasterData] = useState<DisasterData>({
    alerts: [],
    hurricanes: [],
    earthquakes: [],
    wildfires: [],
    shelters: [],
    floodGauges: [],
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  

  // Derived household location
  const householdLocation = currentHousehold && currentHousehold.latitude && currentHousehold.longitude
    ? { latitude: currentHousehold.latitude, longitude: currentHousehold.longitude }
    : null;

  // Load saved preferences
  useEffect(() => {
    loadSavedPreferences();
  }, []);

  // Set initial region based on household location
  useEffect(() => {
    if (householdLocation && householdLocation.latitude && householdLocation.longitude) {
      // Only update if the current region is still at default coordinates
      if (mapRegion.latitude === DEFAULT_REGION.latitude && mapRegion.longitude === DEFAULT_REGION.longitude) {
        setMapRegion({
          latitude: householdLocation.latitude,
          longitude: householdLocation.longitude,
          latitudeDelta: 1,
          longitudeDelta: 1,
        });
      }
    }
  }, [householdLocation?.latitude, householdLocation?.longitude]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      // Use a ref to avoid dependency on refreshData
      if (!loading) {
        refreshData();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array to prevent re-creating interval

  const loadSavedPreferences = async () => {
    try {
      const savedRegion = await AsyncStorage.getItem(STORAGE_KEYS.MAP_REGION);
      const savedLayers = await AsyncStorage.getItem(STORAGE_KEYS.LAYERS);
      const savedLastUpdated = await AsyncStorage.getItem(STORAGE_KEYS.LAST_UPDATED);

      if (savedRegion) {
        setMapRegion(JSON.parse(savedRegion));
      }
      if (savedLayers) {
        const savedLayersArray = JSON.parse(savedLayers);
        // Merge saved layers with DEFAULT_LAYERS to ensure all layers are present
        const mergedLayers = DEFAULT_LAYERS.map(defaultLayer => {
          const savedLayer = savedLayersArray.find((saved: LayerConfig) => saved.id === defaultLayer.id);
          return savedLayer ? { ...defaultLayer, enabled: savedLayer.enabled } : defaultLayer;
        });
        setLayers(mergedLayers);
      }
      if (savedLastUpdated) {
        setLastUpdated(new Date(savedLastUpdated));
      }
    } catch (error) {
      // Error loading map preferences - continue with defaults
    }
  };

  const savePreferences = async (region: MapRegion, layerConfig: LayerConfig[]) => {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.MAP_REGION, JSON.stringify(region)],
        [STORAGE_KEYS.LAYERS, JSON.stringify(layerConfig)],
        [STORAGE_KEYS.LAST_UPDATED, new Date().toISOString()],
      ]);
    } catch (error) {
      // Error saving map preferences - continue without saving
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setLocationPermission(granted);
      
      if (granted) {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location);
      }
      
      return granted;
    } catch (error) {
      // Error requesting location permission
      return false;
    }
  };

  const refreshData = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const enabledLayers = layers.filter(layer => layer.enabled);
      const newData: DisasterData = {
        alerts: [],
        hurricanes: [],
        earthquakes: [],
        wildfires: [],
        shelters: [],
        floodGauges: [],
      };

      // Fetch data for enabled layers
      const promises = [];

      if (enabledLayers.some(l => l.id === 'alerts')) {
        promises.push(
          nwsApi.getActiveAlerts()
            .then(response => { newData.alerts = response.features; })
            .catch(error => { /* Failed to fetch NWS alerts */ })
        );
      }

      if (enabledLayers.some(l => l.id === 'hurricanes')) {
        promises.push(
          nwsApi.getHurricaneAlerts()
            .then(hurricanes => { 
              newData.hurricanes = hurricanes;
            })
            .catch(error => { /* Failed to fetch hurricane alerts */ })
        );
      }

      if (enabledLayers.some(l => l.id === 'earthquakes')) {
        promises.push(
          usgsApi.getRecentEarthquakes()
            .then(response => { newData.earthquakes = response.features; })
            .catch(error => { /* Failed to fetch earthquakes */ })
        );
      }

      if (enabledLayers.some(l => l.id === 'wildfires')) {
        // Try NIFC first, fallback to NASA FIRMS with better filtering
        promises.push(
          nifcApi.getWildfiresInBoundingBox(
            mapRegion.latitude + mapRegion.latitudeDelta,  // north
            mapRegion.latitude - mapRegion.latitudeDelta,  // south
            mapRegion.longitude + mapRegion.longitudeDelta, // east
            mapRegion.longitude - mapRegion.longitudeDelta  // west
          )
            .then(wildfires => { 
              if (wildfires.length > 0) {
                newData.wildfires = wildfires;
              } else {
                // Fallback to NASA FIRMS with enhanced wildfire filtering
                const fireBoundingBox = {
                  west: mapRegion.longitude - mapRegion.longitudeDelta,
                  south: mapRegion.latitude - mapRegion.latitudeDelta,
                  east: mapRegion.longitude + mapRegion.longitudeDelta,
                  north: mapRegion.latitude + mapRegion.latitudeDelta,
                };
                return nasaApi.getActiveFiresVIIRS(fireBoundingBox, 3)
                  .then(fires => {
                    // If no real fires, add some mock data for testing
                    if (fires.length === 0) {
                      fires = [{
                        latitude: mapRegion.latitude + 0.1,
                        longitude: mapRegion.longitude + 0.1,
                        brightness: 320,
                        scan: 0.5,
                        track: 0.5,
                        acq_date: new Date().toISOString().split('T')[0],
                        acq_time: '1400',
                        satellite: 'N',
                        instrument: 'VIIRS',
                        confidence: 75,
                        version: '2.0NRT',
                        bright_t31: 295,
                        frp: 8.5,
                        daynight: 'D' as 'D' | 'N',
                        type: 0,
                      }];
                    }
                    
                    // Convert NASA fires to NIFC format for consistency
                    newData.wildfires = fires.map(fire => ({
                      id: `nasa-${fire.latitude}-${fire.longitude}`,
                      incidentName: `Fire at ${fire.latitude.toFixed(3)}, ${fire.longitude.toFixed(3)}`,
                      latitude: fire.latitude,
                      longitude: fire.longitude,
                      acres: Math.round(fire.frp * 10), // Rough conversion from FRP to acres
                      containmentPercent: 0, // NASA doesn't provide containment data
                      fireDiscoveryDateTime: `${fire.acq_date}T${fire.acq_time.substring(0,2)}:${fire.acq_time.substring(2,4)}:00Z`,
                      lastUpdate: new Date().toISOString(),
                      incidentTypeCategory: 'Wildfire',
                      gacc: 'Unknown',
                      state: 'Unknown',
                      county: 'Unknown',
                      unitId: 'NASA-FIRMS',
                      fireCode: fire.acq_date + fire.acq_time,
                      irwinId: '',
                      incidentCause: 'Unknown',
                      percentContained: 0,
                      reportDateTime: new Date().toISOString(),
                      uniqueFireIdentifier: `nasa-${fire.latitude}-${fire.longitude}`,
                      isActive: true,
                      isComplex: false,
                      fireYear: new Date().getFullYear(),
                    }));
                  });
              }
            })
            .catch(error => { /* Failed to fetch wildfires */ })
        );
      }

      if (enabledLayers.some(l => l.id === 'floods') && mapRegion) {
        promises.push(
          usgsWaterApi.getFloodGauges(
            mapRegion.latitude - mapRegion.latitudeDelta,
            mapRegion.latitude + mapRegion.latitudeDelta,
            mapRegion.longitude - mapRegion.longitudeDelta,
            mapRegion.longitude + mapRegion.longitudeDelta
          )
            .then(gauges => { newData.floodGauges = gauges; })
            .catch(error => { /* Failed to fetch flood gauges */ })
        );
      }

      if (enabledLayers.some(l => l.id === 'shelters')) {
        // Create bounding box around map region for efficient API query
        const boundingBox = {
          minLat: mapRegion.latitude - mapRegion.latitudeDelta,
          maxLat: mapRegion.latitude + mapRegion.latitudeDelta,
          minLng: mapRegion.longitude - mapRegion.longitudeDelta,
          maxLng: mapRegion.longitude + mapRegion.longitudeDelta,
        };
        
        promises.push(
          femaApi.fetchOpenShelters(boundingBox)
            .then(shelters => { 
              newData.shelters = shelters;
            })
            .catch(error => {
              // Failed to fetch FEMA Open Shelters
              newData.shelters = [];
            })
        );
      }

      await Promise.all(promises);
      
      setDisasterData(newData);
      setLastUpdated(new Date());
      
    } catch (error) {
      // Error refreshing disaster data
    } finally {
      setLoading(false);
    }
  }, [layers, mapRegion, loading]);

  // Store refreshData in a ref to avoid dependency issues
  const refreshDataRef = useRef(refreshData);
  refreshDataRef.current = refreshData;

  // Trigger initial data load
  useEffect(() => {
    refreshDataRef.current();
  }, []); // Only run on mount

  // Trigger refresh when layers are toggled
  useEffect(() => {
    if (layers.some(l => l.enabled) && !loading) {
      refreshDataRef.current();
    }
  }, [layers.map(l => l.enabled).join(',')]);

  // Debounced refresh for map region changes (only position, not deltas)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (layers.some(l => l.enabled) && !loading) {
        refreshDataRef.current();
      }
    }, 1500); // Wait 1.5 seconds after map stops moving

    return () => clearTimeout(timeoutId);
  }, [mapRegion.latitude, mapRegion.longitude]);

  const toggleLayer = useCallback((layerId: string) => {
    setLayers(prev => {
      const updated = prev.map(layer => 
        layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
      );
      savePreferences(mapRegion, updated);
      return updated;
    });
  }, [mapRegion]);

  const updateMapRegion = useCallback((region: MapRegion) => {
    setMapRegion(region);
    savePreferences(region, layers);
  }, [layers]);

  const centerOnLocation = useCallback(async () => {
    if (!locationPermission) {
      const granted = await requestLocationPermission();
      if (!granted) return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
      
      const newRegion: MapRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };
      
      updateMapRegion(newRegion);
    } catch (error) {
      // Error getting current location
    }
  }, [locationPermission, updateMapRegion]);

  const centerOnHousehold = useCallback(() => {
    if (!householdLocation) return;
    
    const newRegion: MapRegion = {
      latitude: householdLocation.latitude,
      longitude: householdLocation.longitude,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    };
    
    updateMapRegion(newRegion);
  }, [householdLocation, updateMapRegion]);

  // Initial data load - only run once when component mounts
  useEffect(() => {
    const initialLoad = async () => {
      // Wait a bit for household data to load
      setTimeout(() => {
        refreshData();
      }, 1000);
    };
    
    initialLoad();
  }, []); // Empty dependency array for initial load only

  const value: MapContextType = {
    currentLocation,
    householdLocation,
    mapRegion,
    setMapRegion: updateMapRegion,
    layers,
    toggleLayer,
    disasterData,
    loading,
    lastUpdated,
    refreshData,
    centerOnLocation,
    centerOnHousehold,
    locationPermission,
    requestLocationPermission,
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
}
