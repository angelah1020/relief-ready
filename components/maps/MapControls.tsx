import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useMap } from '@/contexts/MapContext';
import LayerButton from './LayerButton';

export default function MapControls() {
  const {
    centerOnLocation,
    centerOnHousehold,
    refreshData,
    locationPermission,
    requestLocationPermission,
    loading,
    householdLocation,
  } = useMap();

  const handleCenterOnLocation = async () => {
    if (!locationPermission) {
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions to center the map on your current location.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    centerOnLocation();
  };

  const handleCenterOnHousehold = () => {
    if (!householdLocation || !householdLocation.latitude || !householdLocation.longitude) {
      Alert.alert(
        'No Household ZIP Code Set',
        'Please set up your household ZIP code in the profile settings first. The map will center on your ZIP code area, not your exact address.',
        [{ text: 'OK' }]
      );
      return;
    }
    centerOnHousehold();
  };

  const handleRefresh = () => {
    if (loading) return;
    refreshData();
  };

  return (
    <View style={styles.container}>
      {/* Location Controls */}
      <TouchableOpacity
        style={styles.controlButton}
        onPress={handleCenterOnLocation}
        activeOpacity={0.7}
        onLongPress={() => Alert.alert('Current Location', 'Center map on your GPS location')}
      >
        <Text style={styles.controlIcon}>📍</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.controlButton,
          !householdLocation && styles.controlButtonDisabled
        ]}
        onPress={handleCenterOnHousehold}
        activeOpacity={0.7}
        onLongPress={() => Alert.alert('Home ZIP Area', 'Center map on your household ZIP code area')}
      >
        <Text style={[
          styles.controlIcon,
          !householdLocation && styles.controlIconDisabled
        ]}>🏠</Text>
      </TouchableOpacity>

      {/* Layer Toggle Button */}
      <LayerButton />

      {/* Refresh Control */}
      <TouchableOpacity
        style={[
          styles.controlButton,
          loading && styles.controlButtonDisabled
        ]}
        onPress={handleRefresh}
        activeOpacity={0.7}
        disabled={loading}
      >
        <Text style={[
          styles.controlIcon,
          loading && styles.controlIconDisabled,
          loading && styles.spinning
        ]}>
          🔄
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 1000,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  controlButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  controlIcon: {
    fontSize: 20,
  },
  controlIconDisabled: {
    opacity: 0.5,
  },
  spinning: {
    // Add rotation animation if needed
  },
});
