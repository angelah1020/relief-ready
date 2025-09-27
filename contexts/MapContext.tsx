import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { nwsApi, NWSAlert } from '@/lib/apis/nws';
import { usgsApi, USGSEarthquake } from '@/lib/apis/usgs';
import { nasaApi, NASAFireHotspot } from '@/lib/apis/nasa';
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
  earthquakes: USGSEarthquake[];
  wildfires: NASAFireHotspot[];
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
  { id: 'hurricanes', name: 'Hurricanes', enabled: true, icon: '🌧️', color: '#8B00FF' },
  { id: 'earthquakes', name: 'Earthquakes', enabled: true, icon: '🌍', color: '#8B4513' },
  { id: 'wildfires', name: 'Wildfires', enabled: true, icon: '🔥', color: '#FF4500' },
  { id: 'floods', name: 'Floods', enabled: true, icon: '🌊', color: '#1E40AF' },
  { id: 'shelters', name: 'Shelters', enabled: true, icon: '🏠', color: '#4169E1' },
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
    earthquakes: [],
    wildfires: [],
    shelters: [],
    floodGauges: [],
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  
  // Ref to track if shelters have been generated for current location
  const sheltersGeneratedRef = useRef<string | null>(null);

  // Derived household location
  const householdLocation = currentHousehold && currentHousehold.latitude && currentHousehold.longitude
    ? { latitude: currentHousehold.latitude, longitude: currentHousehold.longitude }
    : null;
    
  console.log('Current household:', currentHousehold);
  console.log('Household location:', householdLocation);

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
      console.error('Error loading map preferences:', error);
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
      console.error('Error saving map preferences:', error);
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
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const refreshData = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const enabledLayers = layers.filter(layer => layer.enabled);
      console.log('Enabled layers:', enabledLayers.map(l => l.id));
      const newData: DisasterData = {
        alerts: [],
        earthquakes: [],
        wildfires: [],
        shelters: [],
        floodGauges: [],
      };

      // Fetch data for enabled layers
      const promises = [];

      if (enabledLayers.some(l => ['alerts', 'hurricanes'].includes(l.id))) {
        promises.push(
          nwsApi.getActiveAlerts()
            .then(response => { newData.alerts = response.features; })
            .catch(error => console.warn('Failed to fetch NWS alerts:', error))
        );
      }

      if (enabledLayers.some(l => l.id === 'earthquakes')) {
        promises.push(
          usgsApi.getRecentEarthquakes()
            .then(response => { newData.earthquakes = response.features; })
            .catch(error => console.warn('Failed to fetch earthquakes:', error))
        );
      }

      if (enabledLayers.some(l => l.id === 'wildfires')) {
        promises.push(
          nasaApi.getActiveFiresVIIRS()
            .then(fires => { 
              newData.wildfires = fires;
            })
            .catch(error => console.warn('Failed to fetch wildfires:', error))
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
            .catch(error => console.warn('Failed to fetch flood gauges:', error))
        );
      }

      if (enabledLayers.some(l => l.id === 'shelters') && householdLocation) {
        console.log('Shelters layer enabled, household location:', householdLocation);
        // Only regenerate shelters if location changed
        const locationKey = `${householdLocation.latitude},${householdLocation.longitude}`;
        if (sheltersGeneratedRef.current !== locationKey) {
          console.log('Generating new shelters for location:', locationKey);
          newData.shelters = femaApi.getMockShelters(
            householdLocation.latitude,
            householdLocation.longitude
          );
          console.log('Generated shelters:', newData.shelters);
          sheltersGeneratedRef.current = locationKey;
        } else {
          console.log('Reusing existing shelters:', disasterData.shelters);
          newData.shelters = disasterData.shelters; // Reuse existing shelters
        }
      } else {
        console.log('Shelters not enabled or no household location. Enabled:', enabledLayers.some(l => l.id === 'shelters'), 'Location:', householdLocation);
      }

      await Promise.all(promises);
      
      setDisasterData(newData);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error refreshing disaster data:', error);
    } finally {
      setLoading(false);
    }
  }, [layers, householdLocation?.latitude, householdLocation?.longitude, loading]);

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
      console.error('Error getting current location:', error);
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
