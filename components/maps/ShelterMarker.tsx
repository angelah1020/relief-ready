import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { FEMAShelter, femaApi } from '@/lib/apis/fema';

interface ShelterMarkerProps {
  shelter: FEMAShelter;
  onPress?: () => void;
}

export default function ShelterMarker({ shelter, onPress }: ShelterMarkerProps) {
  const statusColor = femaApi.getShelterStatusColor(shelter.status);
  const occupancyPercentage = femaApi.getOccupancyPercentage(
    shelter.currentOccupancy,
    shelter.capacity
  );

  const getStatusIcon = () => {
    switch (shelter.status.toLowerCase()) {
      case 'open': return '🏠';     // Open and accepting people
      case 'alert': return '🚨';    // Alert - ready for activation
      case 'standby': return '⏸️';   // Standby - on hold
      case 'full': return '🏢';     // Full - at capacity
      case 'limited': return '🏘️';  // Limited availability
      case 'closed': return '🚫';   // Closed
      default: return '🏠';
    }
  };

  return (
    <Marker
      coordinate={{
        latitude: shelter.latitude,
        longitude: shelter.longitude,
      }}
      title={shelter.name}
      description={`${shelter.status} • ${occupancyPercentage}% occupied`}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={[
        styles.markerContainer,
        { backgroundColor: statusColor }
      ]}>
        <Text style={styles.markerIcon}>
          {getStatusIcon()}
        </Text>
        
        {/* Occupancy indicator */}
        <View style={[
          styles.occupancyIndicator,
          {
            backgroundColor: occupancyPercentage >= 90 ? '#FF0000' : 
                           occupancyPercentage >= 70 ? '#FFA500' : '#00FF00'
          }
        ]}>
          <Text style={styles.occupancyText}>
            {occupancyPercentage}%
          </Text>
        </View>
        
        {/* Accessibility indicator */}
        {shelter.accessibility && (
          <View style={styles.accessibilityBadge}>
            <Text style={styles.accessibilityText}>♿</Text>
          </View>
        )}
        
        {/* Pet-friendly indicator */}
        {shelter.petFriendly && (
          <View style={styles.petBadge}>
            <Text style={styles.petText}>🐕</Text>
          </View>
        )}
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 20,
    textAlign: 'center',
  },
  occupancyIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  occupancyText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  accessibilityBadge: {
    position: 'absolute',
    bottom: -6,
    left: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4169E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessibilityText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  petBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#32CD32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petText: {
    fontSize: 10,
  },
});
