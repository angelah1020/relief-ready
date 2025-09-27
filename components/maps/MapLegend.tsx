import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

export default function MapLegend() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Legend</Text>
      
      {/* NWS Weather Alerts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NWS Alerts</Text>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#8B00FF' }]} />
          <Text style={styles.legendText}>Extreme</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#FF0000' }]} />
          <Text style={styles.legendText}>Severe</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#FFA500' }]} />
          <Text style={styles.legendText}>Moderate</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#FFFF00' }]} />
          <Text style={styles.legendText}>Minor</Text>
        </View>
      </View>

      {/* Earthquakes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Earthquakes</Text>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#800080' }]} />
          <Text style={styles.legendText}>7.0+ Major</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#FF0000' }]} />
          <Text style={styles.legendText}>6.0+ Strong</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#FF6600' }]} />
          <Text style={styles.legendText}>5.0+ Moderate</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#FFFF00' }]} />
          <Text style={styles.legendText}>4.0+ Light</Text>
        </View>
      </View>

      {/* Hurricanes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌧️ Hurricanes</Text>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#8B00FF' }]} />
          <Text style={styles.legendText}>Category 4-5</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#FF0000' }]} />
          <Text style={styles.legendText}>Category 3</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#FFA500' }]} />
          <Text style={styles.legendText}>Category 1-2</Text>
        </View>
      </View>

      {/* Wildfires */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 Wildfires</Text>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#FF4500' }]} />
          <Text style={styles.legendText}>Active Fire</Text>
        </View>
      </View>

      {/* Floods */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌊 Floods</Text>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#8B00FF' }]} />
          <Text style={styles.legendText}>Flash Flood</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#FF0000' }]} />
          <Text style={styles.legendText}>Flood Warning</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#FFA500' }]} />
          <Text style={styles.legendText}>Flood Watch</Text>
        </View>
      </View>

      {/* Flood Gauges (USGS Sites) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💧 Flood Gauges</Text>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#8B00FF' }]} />
          <Text style={styles.legendText}>Major Flood</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#FF0000' }]} />
          <Text style={styles.legendText}>Moderate Flood</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#FF6600' }]} />
          <Text style={styles.legendText}>Minor Flood</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#FFFF00' }]} />
          <Text style={styles.legendText}>Action Stage</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#00FF00' }]} />
          <Text style={styles.legendText}>Normal</Text>
        </View>
      </View>

      {/* Shelters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shelters</Text>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#00FF00' }]} />
          <Text style={styles.legendText}>Open</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#FFFF00' }]} />
          <Text style={styles.legendText}>Limited</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.colorBox, { backgroundColor: '#FF6600' }]} />
          <Text style={styles.legendText}>Full</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 6,
    padding: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 120,
    maxWidth: 140,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
    textAlign: 'center',
  },
  section: {
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1.5,
    paddingRight: 2,
  },
  colorBox: {
    width: 7,
    height: 7,
    borderRadius: 1,
    marginRight: 4,
  },
  legendText: {
    fontSize: 8,
    color: '#6B7280',
    flex: 1,
    flexWrap: 'wrap',
  },
});
