import React, { useRef, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, Polygon, Circle, Region } from 'react-native-maps';
import { useMap } from '@/contexts/MapContext';
import { nwsApi, HurricaneAlert } from '@/lib/apis/nws';
import { usgsApi } from '@/lib/apis/usgs';
import { nasaApi } from '@/lib/apis/nasa';
import { nifcApi } from '@/lib/apis/nifc';
import { femaApi } from '@/lib/apis/fema';
import DisasterMarker from './DisasterMarker';
import AlertPolygon from './AlertPolygon';
import ShelterMarker from './ShelterMarker';
import FloodGaugeMarker from './FloodGaugeMarker';
import MapLegend from './MapLegend';

interface DisasterMapProps {
  style?: any;
  miniMap?: boolean;
  zipCode?: string;
}

export default function DisasterMap({ style, miniMap = false, zipCode }: DisasterMapProps) {
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
        const category = nwsApi.getEventCategory(feature.properties.event);
        const icon = nwsApi.getEventIcon(feature.properties.event);
        title = `${icon} ${feature.properties.event}`;
        message = `Category: ${category}\n${feature.properties.headline}\n\nArea: ${feature.properties.areaDesc}\nSeverity: ${feature.properties.severity}\nUrgency: ${feature.properties.urgency}\nExpires: ${new Date(feature.properties.expires).toLocaleString()}`;
        break;
        
      case 'earthquake':
        title = `M${feature.properties.mag} Earthquake`;
        message = `${feature.properties.place}\n${usgsApi.formatEarthquakeTime(feature.properties.time)}\n\nDepth: ${feature.geometry.coordinates[2]} km`;
        break;
        
      case 'wildfire':
        title = `🔥 ${feature.incidentName}`;
        message = `Size: ${nifcApi.formatAcres(feature.acres)}\nContainment: ${nifcApi.formatContainment(feature.percentContained)}\nLocation: ${feature.county}, ${feature.state}\nStarted: ${nifcApi.getTimeSinceDiscovery(feature.fireDiscoveryDateTime)}\nCause: ${feature.incidentCause}`;
        break;
        
      case 'hurricane':
        const hurricane = feature as HurricaneAlert;
        const categoryName = nwsApi.getHurricaneCategoryName(hurricane.properties.stormCategory || 0);
        title = `🌀 ${hurricane.properties.stormName || 'Storm'} - ${categoryName}`;
        message = `Event: ${hurricane.properties.event}\nArea: ${hurricane.properties.areaDesc}`;
        if (hurricane.properties.maxWinds) message += `\nMax Winds: ${hurricane.properties.maxWinds} mph`;
        if (hurricane.properties.movement) message += `\nMovement: ${hurricane.properties.movement}`;
        if (hurricane.properties.stormSurge) message += `\nStorm Surge: ${hurricane.properties.stormSurge}`;
        message += `\nSeverity: ${hurricane.properties.severity}\nExpires: ${new Date(hurricane.properties.expires).toLocaleString()}`;
        break;
        
      case 'shelter':
        title = feature.name;
        message = `${feature.address}, ${feature.city}\nStatus: ${feature.status}\nCapacity: ${feature.currentOccupancy}/${feature.capacity}\nServices: ${femaApi.formatServices(feature.services)}`;
        break;
        
      case 'floodGauge':
        title = feature.name;
        message = `${feature.siteCode}\nStatus: ${feature.status}\nHeight: ${feature.currentValue.toFixed(1)} ft\nUpdated: ${new Date(feature.lastUpdated).toLocaleString()}`;
        break;
    }
    
    Alert.alert(title, message, [
      { text: 'Close', style: 'cancel' },
      { text: 'Get Directions', onPress: () => handleGetDirections(feature, type) },
    ]);
  };

  const handleGetDirections = (feature: any, type: string) => {
    // Implementation for opening directions in maps app
  };

  const renderAlerts = () => {
    const enabledAlertLayers = layers.filter(l => ['alerts', 'hurricanes'].includes(l.id) && l.enabled);
    if (enabledAlertLayers.length === 0) return null;
    
    return disasterData.alerts
      .filter(alert => {
        const category = nwsApi.getEventCategory(alert.properties.event);
        
        // Show alert based on which layers are enabled
        if (category === 'Hurricane' && !layers.find(l => l.id === 'hurricanes')?.enabled) return false;
        if (!['Hurricane'].includes(category) && !layers.find(l => l.id === 'alerts')?.enabled) return false;
        
        return true;
      })
      .map((alert, index) => {
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
                latitude: typeof coords[1] === 'number' ? coords[1] : (Array.isArray(coords[1]) ? (coords[1][0] as unknown as number) : 0),
                longitude: typeof coords[0] === 'number' ? coords[0] : (Array.isArray(coords[0]) ? (coords[0][0] as unknown as number) : 0),
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
    
    return disasterData.wildfires.map((fire, index) => {
      return (
        <DisasterMarker
          key={`fire-${fire.uniqueFireIdentifier}-${index}`}
          coordinate={{
            latitude: fire.latitude,
            longitude: fire.longitude,
          }}
          title={fire.incidentName}
          description={`${nifcApi.formatAcres(fire.acres)} - ${nifcApi.formatContainment(fire.percentContained)}`}
          color={nifcApi.getWildfireStatusColor(fire)}
          size={nifcApi.getWildfireMarkerSize(fire)}
          icon="🔥"
          onPress={() => handleMarkerPress(fire, 'wildfire')}
        />
      );
    });
  };

  const renderHurricanes = () => {
    if (!layers.find(l => l.id === 'hurricanes')?.enabled) return null;
    
    return disasterData.hurricanes.map((hurricane, index) => {
      const category = hurricane.properties.stormCategory || 0;
      const categoryName = nwsApi.getHurricaneCategoryName(category);
      
      // Get center point of the alert area for marker placement
      const centerLat = hurricane.geometry?.coordinates?.[0]?.reduce((sum, coord) => sum + coord[1], 0) / (hurricane.geometry?.coordinates?.[0]?.length || 1) || 0;
      const centerLng = hurricane.geometry?.coordinates?.[0]?.reduce((sum, coord) => sum + coord[0], 0) / (hurricane.geometry?.coordinates?.[0]?.length || 1) || 0;
      
      return (
        <React.Fragment key={`hurricane-${hurricane.id}-${index}`}>
          {/* Hurricane alert polygon */}
          <AlertPolygon 
            alert={hurricane}
            onPress={() => handleMarkerPress(hurricane, 'hurricane')}
          />
          
          {/* Hurricane center marker */}
          <DisasterMarker
            coordinate={{
              latitude: centerLat,
              longitude: centerLng,
            }}
            title={`${hurricane.properties.stormName || 'Storm'} - ${categoryName}`}
            description={`${hurricane.properties.maxWinds || 'Unknown'} mph winds`}
            color={nwsApi.getHurricaneCategoryColor(category)}
            size={nwsApi.getHurricaneCategorySize(category)}
            icon="🌀"
            onPress={() => handleMarkerPress(hurricane, 'hurricane')}
          />
        </React.Fragment>
      );
    });
  };

  const renderFloodGauges = () => {
    if (!layers.find(l => l.id === 'floods')?.enabled) return null;
    
    return disasterData.floodGauges.map((gauge, index) => (
      <FloodGaugeMarker
        key={`gauge-${gauge.siteCode}-${index}`}
        gauge={gauge}
        onPress={() => handleMarkerPress(gauge, 'floodGauge')}
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
        region={miniMap && householdLocation ? {
          latitude: householdLocation.latitude,
          longitude: householdLocation.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        } : mapRegion}
        onRegionChangeComplete={miniMap ? undefined : handleRegionChangeComplete}
        showsUserLocation={false} // We'll handle this manually
        showsMyLocationButton={!miniMap}
        showsCompass={!miniMap}
        showsScale={!miniMap}
        mapType="standard"
        scrollEnabled={!miniMap}
        zoomEnabled={!miniMap}
        pitchEnabled={!miniMap}
        rotateEnabled={!miniMap}
      >
        {renderCurrentLocation()}
        {renderHouseholdLocation()}
        {!miniMap && (
          <>
            {renderAlerts()}
            {renderHurricanes()}
            {renderEarthquakes()}
            {renderWildfires()}
            {renderFloodGauges()}
            {renderShelters()}
          </>
        )}
      </MapView>
      
      {/* Map Legend - only show in full map */}
      {!miniMap && <MapLegend />}
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
