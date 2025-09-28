import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { USGSWaterSite, usgsWaterApi } from '@/lib/apis/usgs-water';

interface FloodGaugeMarkerProps {
  gauge: USGSWaterSite;
  onPress?: () => void;
}

export default function FloodGaugeMarker({ gauge, onPress }: FloodGaugeMarkerProps) {
  const statusColor = usgsWaterApi.getFloodStatusColor(gauge.status);
  const markerSize = usgsWaterApi.getFloodStatusSize(gauge.status);
  
  // Don't render if gauge data is invalid
  if (!gauge.latitude || !gauge.longitude || !gauge.name) {
    return null;
  }

  const getStatusIcon = () => {
    switch (gauge.status) {
      case 'major':
      case 'moderate':
      case 'minor':
        return '🌊';
      case 'action':
        return '⚠️';
      default:
        return '💧';
    }
  };

  return (
    <Marker
      coordinate={{
        latitude: gauge.latitude,
        longitude: gauge.longitude,
      }}
      title={gauge.name}
      description={`${usgsWaterApi.getStatusDescription(gauge.status)} - ${usgsWaterApi.formatHeight(gauge.currentValue)}`}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={[
        styles.markerContainer,
        {
          width: markerSize,
          height: markerSize,
          backgroundColor: statusColor,
          borderRadius: markerSize / 2,
        }
      ]}>
        <Text style={[
          styles.markerIcon,
          { fontSize: markerSize * 0.6 }
        ]}>
          {getStatusIcon()}
        </Text>
        
        {/* Height indicator */}
        {gauge.currentValue > 0 && (
          <View style={[
            styles.heightIndicator,
            { backgroundColor: statusColor }
          ]}>
            <Text style={styles.heightText}>
              {gauge.currentValue.toFixed(0)}'
            </Text>
          </View>
        )}
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerIcon: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  heightIndicator: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  heightText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
