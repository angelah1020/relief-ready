import React from 'react';
import { Polygon } from 'react-native-maps';
import { NWSAlert, nwsApi } from '@/lib/apis/nws';

interface AlertPolygonProps {
  alert: NWSAlert;
  onPress?: () => void;
}

export default function AlertPolygon({ alert, onPress }: AlertPolygonProps) {
  // Convert GeoJSON coordinates to react-native-maps format
  const getCoordinates = () => {
    if (!alert.geometry || alert.geometry.type !== 'Polygon') {
      return [];
    }

    try {
      // GeoJSON Polygon coordinates are [longitude, latitude]
      // react-native-maps expects [latitude, longitude]
      const coords = alert.geometry.coordinates[0]; // First ring of the polygon
      
      // Validate coordinates
      if (!Array.isArray(coords) || coords.length < 3) {
        return [];
      }
      
      return coords
        .filter(coord => Array.isArray(coord) && coord.length >= 2)
        .map(coord => ({
          latitude: coord[1],
          longitude: coord[0],
        }))
        .filter(coord => 
          !isNaN(coord.latitude) && 
          !isNaN(coord.longitude) &&
          coord.latitude >= -90 && coord.latitude <= 90 &&
          coord.longitude >= -180 && coord.longitude <= 180
        );
    } catch (error) {
      return [];
    }
  };

  const coordinates = getCoordinates();
  if (coordinates.length === 0) {
    return null;
  }

  const severity = alert.properties.severity;
  const fillColor = nwsApi.getSeverityColor(severity);
  const strokeColor = fillColor;

  return (
    <Polygon
      coordinates={coordinates}
      fillColor={`${fillColor}40`} // Add transparency
      strokeColor={strokeColor}
      strokeWidth={2}
      onPress={onPress}
      tappable={true}
    />
  );
}
