import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

interface DisasterMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description?: string;
  color: string;
  size?: number;
  opacity?: number;
  icon: string;
  onPress?: () => void;
}

export default function DisasterMarker({
  coordinate,
  title,
  description,
  color,
  size = 20,
  opacity = 1,
  icon,
  onPress,
}: DisasterMarkerProps) {
  const markerSize = Math.max(20, Math.min(60, size));
  
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={[
        styles.markerContainer,
        {
          width: markerSize,
          height: markerSize,
          backgroundColor: color,
          opacity: opacity,
          borderRadius: markerSize / 2,
        }
      ]}>
        <Text style={[
          styles.markerIcon,
          { fontSize: markerSize * 0.6 }
        ]}>
          {icon}
        </Text>
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
});
