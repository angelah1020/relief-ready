import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useMap } from '@/contexts/MapContext';

const { width } = Dimensions.get('window');

export default function LayerToggle() {
  const { layers, toggleLayer, loading, lastUpdated } = useMap();
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setIsExpanded(!isExpanded);
  };

  const panelHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 400],
  });

  const contentOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return lastUpdated.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.panel, { height: panelHeight }]}>
        {/* Header */}
        <TouchableOpacity 
          style={styles.header} 
          onPress={toggleExpanded}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>🗺️</Text>
            <View>
              <Text style={styles.headerTitle}>Map Layers</Text>
              <Text style={styles.headerSubtitle}>
                Updated {formatLastUpdated()}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            {loading && (
              <View style={styles.loadingIndicator}>
                <Text style={styles.loadingText}>•</Text>
              </View>
            )}
            <Text style={[
              styles.expandIcon,
              { transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }
            ]}>
              ⌄
            </Text>
          </View>
        </TouchableOpacity>

        {/* Layer Controls */}
        <Animated.View style={[
          styles.content,
          { opacity: contentOpacity }
        ]}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
            <Text style={styles.sectionTitle}>Disaster Layers</Text>
            
            {layers.map((layer) => (
              <TouchableOpacity
                key={layer.id}
                style={styles.layerItem}
                onPress={() => toggleLayer(layer.id)}
                activeOpacity={0.7}
              >
                <View style={styles.layerLeft}>
                  <View style={[
                    styles.layerToggle,
                    { backgroundColor: layer.enabled ? layer.color : '#E5E7EB' }
                  ]}>
                    <Text style={styles.layerIcon}>{layer.icon}</Text>
                  </View>
                  <Text style={[
                    styles.layerName,
                    { color: layer.enabled ? '#1F2937' : '#9CA3AF' }
                  ]}>
                    {layer.name}
                  </Text>
                </View>
                
                <View style={[
                  styles.checkbox,
                  { backgroundColor: layer.enabled ? layer.color : 'transparent' }
                ]}>
                  {layer.enabled && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {/* Legend */}
            <View style={styles.legend}>
              <Text style={styles.sectionTitle}>Severity & Color Legend</Text>
              
              <Text style={styles.legendSubtitle}>Weather Alerts:</Text>
              <View style={styles.legendRow}>
                <View style={[styles.legendColor, { backgroundColor: '#8B00FF' }]} />
                <Text style={styles.legendText}>Extreme - Immediate danger</Text>
              </View>
              
              <View style={styles.legendRow}>
                <View style={[styles.legendColor, { backgroundColor: '#FF0000' }]} />
                <Text style={styles.legendText}>Severe - Take action now</Text>
              </View>
              
              <View style={styles.legendRow}>
                <View style={[styles.legendColor, { backgroundColor: '#FFA500' }]} />
                <Text style={styles.legendText}>Moderate - Be prepared</Text>
              </View>
              
              <View style={styles.legendRow}>
                <View style={[styles.legendColor, { backgroundColor: '#FFFF00' }]} />
                <Text style={styles.legendText}>Minor - Stay aware</Text>
              </View>

              <Text style={styles.legendSubtitle}>Earthquakes:</Text>
              <View style={styles.legendRow}>
                <View style={[styles.legendColor, { backgroundColor: '#800080' }]} />
                <Text style={styles.legendText}>7.0+ Major (Very large)</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendColor, { backgroundColor: '#FF0000' }]} />
                <Text style={styles.legendText}>6.0-6.9 Strong (Large)</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendColor, { backgroundColor: '#FF6600' }]} />
                <Text style={styles.legendText}>5.0-5.9 Moderate (Medium)</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendColor, { backgroundColor: '#FFFF00' }]} />
                <Text style={styles.legendText}>4.0-4.9 Light (Small)</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendColor, { backgroundColor: '#00FF00' }]} />
                <Text style={styles.legendText}>3.0-3.9 Minor (Very small)</Text>
              </View>

              <Text style={styles.legendSubtitle}>Shelters:</Text>
              <View style={styles.legendRow}>
                <View style={[styles.legendColor, { backgroundColor: '#00FF00' }]} />
                <Text style={styles.legendText}>Open - Accepting people</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendColor, { backgroundColor: '#FFFF00' }]} />
                <Text style={styles.legendText}>Limited - Restricted capacity</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendColor, { backgroundColor: '#FF6600' }]} />
                <Text style={styles.legendText}>Full - At capacity</Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingIndicator: {
    marginRight: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  expandIcon: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    maxHeight: 320,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  layerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  layerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  layerToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  layerIcon: {
    fontSize: 16,
  },
  layerName: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  legend: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  legendSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 6,
  },
});
