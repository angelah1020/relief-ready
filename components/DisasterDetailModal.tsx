import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native';
import { ArrowLeft, AlertTriangle, Wind, Flame, Droplets, Mountain, Tornado, Sun } from 'lucide-react-native';
import { colors } from '@/lib/theme';

const { height } = Dimensions.get('window');

interface DisasterDetailModalProps {
  visible: boolean;
  onClose: () => void;
  hazardType: string;
  readinessPercentage: number;
}

const hazardConfig: Record<string, { icon: any; label: string; color: string; description: string }> = {
  hurricane: { 
    icon: Wind, 
    label: 'Hurricane', 
    color: '#0284C7',
    description: 'Hurricanes are powerful storms that can cause devastating winds, storm surges, and flooding. Proper preparation can save lives and property.'
  },
  wildfire: { 
    icon: Flame, 
    label: 'Wildfire', 
    color: '#EA580C',
    description: 'Wildfires can spread rapidly and create dangerous conditions. Early preparation and evacuation planning are essential for safety.'
  },
  flood: { 
    icon: Droplets, 
    label: 'Flood', 
    color: '#0891B2',
    description: 'Flooding can occur with little warning and cause significant damage. Understanding your flood risk and having a plan is crucial.'
  },
  earthquake: { 
    icon: Mountain, 
    label: 'Earthquake', 
    color: '#7C2D12',
    description: 'Earthquakes can strike without warning and cause widespread damage. Being prepared with supplies and knowing what to do is vital.'
  },
  tornado: { 
    icon: Tornado, 
    label: 'Tornado', 
    color: '#6B7280',
    description: 'Tornadoes can develop quickly and cause severe damage in a small area. Having a safe room and emergency plan is essential.'
  },
  heat: { 
    icon: Sun, 
    label: 'Heat Wave', 
    color: '#354eab',
    description: 'Extreme heat can be dangerous, especially for vulnerable populations. Staying cool and hydrated is critical during heat waves.'
  },
};

export default function DisasterDetailModal({ visible, onClose, hazardType, readinessPercentage }: DisasterDetailModalProps) {
  const config = hazardConfig[hazardType] || hazardConfig.hurricane;
  const Icon = config.icon;

  const getReadinessLevel = (percentage: number) => {
    if (percentage >= 80) return { level: 'Excellent', color: '#059669' };
    if (percentage >= 60) return { level: 'Good', color: '#D97706' };
    if (percentage >= 40) return { level: 'Fair', color: '#354eab' };
    return { level: 'Poor', color: '#354eab' };
  };

  const readiness = getReadinessLevel(readinessPercentage);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Sticky Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Icon size={24} color={config.color} />
            <Text style={styles.headerTitle}>{config.label}</Text>
            <View style={[styles.percentageBadge, { backgroundColor: readiness.color }]}>
              <Text style={styles.percentageText}>{readinessPercentage}%</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Readiness Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Readiness Overview</Text>
            <View style={styles.readinessCard}>
              <View style={styles.readinessHeader}>
                <Text style={styles.readinessLabel}>Current Level</Text>
                <Text style={[styles.readinessLevel, { color: readiness.color }]}>
                  {readiness.level}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${readinessPercentage}%`,
                      backgroundColor: readiness.color 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {readinessPercentage}% prepared for {config.label.toLowerCase()} emergencies
              </Text>
            </View>
          </View>

          {/* Hazard Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About {config.label}s</Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{config.description}</Text>
            </View>
          </View>

          {/* Key Preparedness Areas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Preparedness Areas</Text>
            <View style={styles.areasList}>
              <View style={styles.areaItem}>
                <View style={[styles.areaIcon, { backgroundColor: '#EFF6FF' }]}>
                  <AlertTriangle size={20} color="#1D4ED8" />
                </View>
                <View style={styles.areaContent}>
                  <Text style={styles.areaTitle}>Emergency Plan</Text>
                  <Text style={styles.areaDescription}>
                    Create and practice evacuation routes, meeting points, and communication plans
                  </Text>
                </View>
              </View>

              <View style={styles.areaItem}>
                <View style={[styles.areaIcon, { backgroundColor: '#F0FDF4' }]}>
                  <AlertTriangle size={20} color="#059669" />
                </View>
                <View style={styles.areaContent}>
                  <Text style={styles.areaTitle}>Emergency Supplies</Text>
                  <Text style={styles.areaDescription}>
                    Stock up on water, food, first aid, and other essential items
                  </Text>
                </View>
              </View>

              <View style={styles.areaItem}>
                <View style={[styles.areaIcon, { backgroundColor: colors.buttonSecondary + '22' }]}>
                  <AlertTriangle size={20} color="#D97706" />
                </View>
                <View style={styles.areaContent}>
                  <Text style={styles.areaTitle}>Home Safety</Text>
                  <Text style={styles.areaDescription}>
                    Secure your home and identify safe areas for shelter
                  </Text>
                </View>
              </View>

              <View style={styles.areaItem}>
                <View style={[styles.areaIcon, { backgroundColor: colors.buttonSecondary + '22' }]}>
                  <AlertTriangle size={20} color="#354eab" />
                </View>
                <View style={styles.areaContent}>
                  <Text style={styles.areaTitle}>Communication</Text>
                  <Text style={styles.areaDescription}>
                    Set up emergency communication methods and stay informed
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsList}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>View Checklist</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Update Supplies</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Review Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 12,
    flex: 1,
  },
  percentageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  percentageText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  readinessCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  readinessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  readinessLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  readinessLevel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  descriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  descriptionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  areasList: {
    gap: 12,
  },
  areaItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  areaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  areaContent: {
    flex: 1,
  },
  areaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  areaDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  actionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#354eab',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
