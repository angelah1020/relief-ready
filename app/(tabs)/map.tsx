import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hazard Map</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.placeholderText}>
          Interactive hazard map will be implemented here with:
        </Text>
        <Text style={styles.listItem}>• Real-time weather alerts (NWS)</Text>
        <Text style={styles.listItem}>• Wildfire data (FIRMS)</Text>
        <Text style={styles.listItem}>• Earthquake data (USGS)</Text>
        <Text style={styles.listItem}>• Flood gauge data (USGS)</Text>
        <Text style={styles.listItem}>• Emergency shelters (FEMA)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  listItem: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    paddingLeft: 16,
  },
});