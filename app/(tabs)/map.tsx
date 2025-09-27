import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useMap } from '@/contexts/MapContext';
import DisasterMap from '@/components/maps/DisasterMap';
import MapControls from '@/components/maps/MapControls';

export default function MapScreen() {
  const { 
    householdLocation, 
    locationPermission, 
    requestLocationPermission,
    loading,
    disasterData 
  } = useMap();
  
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    initializeMap();
  }, []);

  const initializeMap = async () => {
    // Request location permission on first load
    if (!locationPermission) {
      await requestLocationPermission();
    }
    setInitialLoad(false);
  };

  const getDataSummary = () => {
    const { alerts, earthquakes, wildfires, shelters, floodGauges } = disasterData;
    const total = alerts.length + earthquakes.length + wildfires.length + shelters.length + floodGauges.length;
    
    if (total === 0) return 'No active alerts in your area';
    
    const parts = [];
    if (alerts.length > 0) parts.push(`${alerts.length} alert${alerts.length > 1 ? 's' : ''}`);
    if (earthquakes.length > 0) parts.push(`${earthquakes.length} earthquake${earthquakes.length > 1 ? 's' : ''}`);
    if (wildfires.length > 0) parts.push(`${wildfires.length} wildfire${wildfires.length > 1 ? 's' : ''}`);
    if (floodGauges.length > 0) parts.push(`${floodGauges.length} gauge${floodGauges.length > 1 ? 's' : ''}`);
    if (shelters.length > 0) parts.push(`${shelters.length} shelter${shelters.length > 1 ? 's' : ''}`);
    
    return parts.join(', ');
  };

  if (initialLoad) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!householdLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyTitle}>Set Your ZIP Code</Text>
          <Text style={styles.emptyText}>
            Please set up your household ZIP code in the profile settings to view local disaster information. We only need your ZIP code, not your exact address.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Live Disaster Map</Text>
          <Text style={styles.subtitle}>{getDataSummary()}</Text>
        </View>
        
        {loading && (
          <ActivityIndicator size="small" color="#DC2626" />
        )}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <DisasterMap style={styles.map} />
        
        {/* Overlay Controls */}
        <MapControls />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
});