import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useMap } from '@/contexts/MapContext';

const { width } = Dimensions.get('window');

export default function LayerButton() {
  const { layers, toggleLayer, loading, lastUpdated } = useMap();
  const [isVisible, setIsVisible] = useState(false);


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

  const enabledCount = layers.filter(layer => layer.enabled).length;

  return (
    <>
      {/* Layer Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.layerButton}
          onPress={() => setIsVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.layerIcon}>🗺️</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{enabledCount}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Layer Modal */}
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <Text style={styles.modalTitle}>Map Layers</Text>
                <Text style={styles.modalSubtitle}>
                  Updated {formatLastUpdated()}
                </Text>
              </View>
              
              <TouchableOpacity 
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Layer List */}
            <ScrollView style={styles.layerList} showsVerticalScrollIndicator={false}>
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
                      <Text style={styles.layerToggleIcon}>{layer.icon}</Text>
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
                    { 
                      backgroundColor: layer.enabled ? layer.color : 'transparent',
                      borderColor: layer.enabled ? layer.color : '#D1D5DB'
                    }
                  ]}>
                    {layer.enabled && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <Text style={styles.footerText}>
                Tap layers to toggle visibility
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginBottom: 8,
  },
  layerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  layerIcon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: Math.min(320, width - 40),
    maxHeight: 400,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  layerList: {
    maxHeight: 250,
    padding: 16,
  },
  layerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  layerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  layerToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  layerToggleIcon: {
    fontSize: 18,
  },
  layerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
  },
  debugText: {
    fontSize: 10,
    color: '#FF0000',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
});
