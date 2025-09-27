import React, { useRef, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, Polygon, Circle, Region } from 'react-native-maps';
import { useMap } from '@/contexts/MapContext';
import { nwsApi } from '@/lib/apis/nws';
import { usgsApi } from '@/lib/apis/usgs';
import { nasaApi } from '@/lib/apis/nasa';
import { femaApi } from '@/lib/apis/fema';
import DisasterMarker from './DisasterMarker';
import AlertPolygon from './AlertPolygon';
import ShelterMarker from './ShelterMarker';

interface DisasterMapProps {
  style?: any;
}

export default function DisasterMap({ style }: DisasterMapProps) {
  const mapRef = useRef<MapView>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  
  const {
    mapRegion,
    setMapRegion,
    currentLocation,
    householdLocation,
    disasterData,
    layers,
  } = useMap();

  const handleRegionChangeComplete = (region: Region) => {
    setMapRegion({
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    });
  };

  const handleMarkerPress = (feature: any, type: string) => {
    setSelectedFeature({ ...feature, type });
    
    let title = '';
    let message = '';
    
    switch (type) {
      case 'alert':
        title = feature.properties.headline || feature.properties.event;
        message = `${feature.properties.description}\n\nExpires: ${new Date(feature.properties.expires).toLocaleString()}`;
        break;
        
      case 'earthquake':
        title = `M${feature.properties.mag} Earthquake`;
        message = `${feature.properties.place}\n${usgsApi.formatEarthquakeTime(feature.properties.time)}\n\nDepth: ${feature.geometry.coordinates[2]} km`;
        break;
        
      case 'wildfire':
        title = 'Wildfire Hotspot';
        message = `Confidence: ${feature.confidence}%\nBrightness: ${feature.brightness}\nDetected: ${nasaApi.formatFireTime(feature.acq_date, feature.acq_time)}`;
        break;
        
      case 'shelter':
        title = feature.name;
        message = `${feature.address}, ${feature.city}\nStatus: ${feature.status}\nCapacity: ${feature.currentOccupancy}/${feature.capacity}\nServices: ${femaApi.formatServices(feature.services)}`;
        break;
    }
    
    Alert.alert(title, message, [
      { text: 'Close', style: 'cancel' },
      { text: 'Get Directions', onPress: () => handleGetDirections(feature, type) },
    ]);
  };

  const handleGetDirections = (feature: any, type: string) => {
    // Implementation for opening directions in maps app
    console.log('Get directions to:', feature, type);
  };

  const renderAlerts = () => {
    if (!layers.find(l => l.id === 'alerts')?.enabled) return null;
    
    return disasterData.alerts.map((alert, index) => {
      if (alert.geometry?.type === 'Polygon') {
        return (
          <AlertPolygon
            key={`alert-${alert.id}-${index}`}
            alert={alert}
            onPress={() => handleMarkerPress(alert, 'alert')}
          />
        );
      } else {
        // For point-based alerts, show as markers
        const coords = alert.geometry?.coordinates;
        if (!coords || coords.length < 2) return null;
        
        return (
          <DisasterMarker
            key={`alert-marker-${alert.id}-${index}`}
            coordinate={{
              latitude: coords[1],
              longitude: coords[0],
            }}
            title={alert.properties.event}
            description={alert.properties.areaDesc}
            color={nwsApi.getSeverityColor(alert.properties.severity)}
            icon={nwsApi.getHazardIcon(alert.properties.event)}
            onPress={() => handleMarkerPress(alert, 'alert')}
          />
        );
      }
    });
  };

  const renderEarthquakes = () => {
    if (!layers.find(l => l.id === 'earthquakes')?.enabled) return null;
    
    return disasterData.earthquakes.map((quake, index) => (
      <DisasterMarker
        key={`quake-${quake.id}-${index}`}
        coordinate={{
          latitude: quake.geometry.coordinates[1],
          longitude: quake.geometry.coordinates[0],
        }}
        title={`M${quake.properties.mag} Earthquake`}
        description={quake.properties.place}
        color={usgsApi.getMagnitudeColor(quake.properties.mag)}
        size={usgsApi.getMagnitudeSize(quake.properties.mag)}
        opacity={usgsApi.getAgeOpacity(quake.properties.time)}
        icon="🌍"
        onPress={() => handleMarkerPress(quake, 'earthquake')}
      />
    ));
  };

  const renderWildfires = () => {
    if (!layers.find(l => l.id === 'wildfires')?.enabled) return null;
    
    return disasterData.wildfires.map((fire, index) => (
      <DisasterMarker
        key={`fire-${index}`}
        coordinate={{
          latitude: fire.latitude,
          longitude: fire.longitude,
        }}
        title="Wildfire Hotspot"
        description={`Confidence: ${fire.confidence}%`}
        color={nasaApi.getConfidenceColor(fire.confidence)}
        size={nasaApi.getFireSize(fire.brightness, fire.frp)}
        icon="🔥"
        onPress={() => handleMarkerPress(fire, 'wildfire')}
      />
    ));
  };

  const renderShelters = () => {
    if (!layers.find(l => l.id === 'shelters')?.enabled) return null;
    
    return disasterData.shelters.map((shelter, index) => (
      <ShelterMarker
        key={`shelter-${shelter.id}-${index}`}
        shelter={shelter}
        onPress={() => handleMarkerPress(shelter, 'shelter')}
      />
    ));
  };

  const renderCurrentLocation = () => {
    if (!currentLocation) return null;
    
    return (
      <Marker
        coordinate={{
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        }}
        title="Current Location"
        pinColor="blue"
      />
    );
  };

  const renderHouseholdLocation = () => {
    if (!householdLocation || !householdLocation.latitude) return null;
    
    return (
      <>
        {/* ZIP Code Area Marker */}
        <Marker
          coordinate={householdLocation}
          title="Your ZIP Code Area"
          description="Approximate center of your ZIP code"
          pinColor="green"
        />
        
        {/* ZIP Code Area Circle */}
        <Circle
          center={householdLocation}
          radius={8000} // ~5 mile radius to represent ZIP code area
          fillColor="rgba(0, 255, 0, 0.1)"
          strokeColor="rgba(0, 255, 0, 0.3)"
          strokeWidth={2}
        />
      </>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={false} // We'll handle this manually
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
      >
        {renderCurrentLocation()}
        {renderHouseholdLocation()}
        {renderAlerts()}
        {renderEarthquakes()}
        {renderWildfires()}
        {renderShelters()}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
