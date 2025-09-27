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
import { ArrowLeft, AlertTriangle, Wind, Flame, Droplets, Mountain, Tornado, Sun, Plus } from 'lucide-react-native';
import { colors } from '@/lib/theme';

const { height } = Dimensions.get('window');

interface DisasterDetailModalProps {
  visible: boolean;
  onClose: () => void;
  hazardType: string;
  readinessPercentage: number;
  onViewChecklist?: (hazardType: string) => void;
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


// Hazard-specific preparation tips
const preparationTips: Record<string, Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low' }>> = {
  hurricane: [
    { title: 'Create an Evacuation Plan', description: 'Know your evacuation zone and routes. Practice with your family and identify multiple ways to leave your area.', priority: 'high' },
    { title: 'Secure Your Home', description: 'Install storm shutters or board up windows. Bring outdoor furniture inside. Trim trees and shrubs.', priority: 'high' },
    { title: 'Stock Emergency Supplies', description: 'Have 3-7 days of water (1 gallon per person per day), non-perishable food, medications, and cash.', priority: 'high' },
    { title: 'Protect Important Documents', description: 'Keep insurance papers, IDs, and medical records in waterproof containers.', priority: 'medium' },
    { title: 'Have Battery-Powered Radio', description: 'Stay informed with weather updates when power goes out. Include extra batteries.', priority: 'medium' },
    { title: 'Fill Vehicles with Gas', description: 'Gas stations may not operate after the storm. Fill all vehicles and keep spare fuel for generators.', priority: 'low' }
  ],
  wildfire: [
    { title: 'Create Defensible Space', description: 'Clear vegetation within 30-100 feet of your home. Remove dead plants, leaves, and flammable materials.', priority: 'high' },
    { title: 'Prepare Go-Bags', description: 'Pack essential items you can grab quickly: medications, documents, clothing, and valuables.', priority: 'high' },
    { title: 'Have Multiple Evacuation Routes', description: 'Know at least 2 ways out of your neighborhood. Practice driving routes during different times.', priority: 'high' },
    { title: 'Install Air Filtration', description: 'Use HEPA air purifiers indoors. Seal gaps around doors and windows during smoke events.', priority: 'medium' },
    { title: 'Keep N95 Masks Ready', description: 'Protect lungs from smoke. Have enough masks for all family members.', priority: 'medium' },
    { title: 'Use Fire-Resistant Landscaping', description: 'Plant fire-resistant plants and maintain proper spacing between vegetation.', priority: 'low' }
  ],
  flood: [
    { title: 'Know Your Flood Risk', description: 'Understand if you\'re in a flood zone. Even low-risk areas can flood. Have flood insurance.', priority: 'high' },
    { title: 'Move to Higher Ground', description: 'Identify higher ground routes and safe locations. Never drive or walk through flood water.', priority: 'high' },
    { title: 'Waterproof Important Items', description: 'Store documents, electronics, and valuables in waterproof containers on upper floors.', priority: 'high' },
    { title: 'Have Sandbags Ready', description: 'Know how to properly deploy sandbags to redirect water away from your home.', priority: 'medium' },
    { title: 'Turn Off Utilities Safely', description: 'Know how to shut off gas, electricity, and water to prevent additional hazards.', priority: 'medium' },
    { title: 'Stay Informed', description: 'Monitor weather alerts and have a battery-powered or hand-crank radio for updates.', priority: 'low' }
  ],
  earthquake: [
    { title: 'Practice Drop, Cover, Hold On', description: 'Drop to hands and knees, take cover under sturdy furniture, hold on and protect your head.', priority: 'high' },
    { title: 'Secure Heavy Items', description: 'Anchor bookcases, water heaters, and heavy appliances to walls. Secure items that could fall.', priority: 'high' },
    { title: 'Identify Safe Spots', description: 'Know safe places in each room: under sturdy tables, against interior walls, away from windows.', priority: 'high' },
    { title: 'Keep Emergency Kit Accessible', description: 'Store supplies in multiple locations. Include sturdy shoes, flashlight, and first aid kit by your bed.', priority: 'medium' },
    { title: 'Know Utility Shut-offs', description: 'Learn how to turn off gas, water, and electricity. Keep necessary tools nearby.', priority: 'medium' },
    { title: 'Plan for Aftershocks', description: 'Expect aftershocks after the main quake. Be ready to drop, cover, and hold on again.', priority: 'low' }
  ],
  tornado: [
    { title: 'Identify Safe Room', description: 'Choose a small interior room on the lowest floor, away from windows. Avoid large roof spans.', priority: 'high' },
    { title: 'Have Weather Radio', description: 'Use NOAA Weather Radio with battery backup and tone alert for tornado warnings.', priority: 'high' },
    { title: 'Practice Tornado Drills', description: 'Practice getting to your safe room quickly. Teach children the tornado position: crouch low, cover head.', priority: 'high' },
    { title: 'Keep Safety Supplies in Safe Room', description: 'Store flashlight, battery radio, first aid kit, helmet, and sturdy shoes in your safe area.', priority: 'medium' },
    { title: 'Know the Signs', description: 'Watch for rotating funnel cloud, loud roar, or large hail. Don\'t wait to take cover.', priority: 'medium' },
    { title: 'Avoid Mobile Homes', description: 'Mobile homes are unsafe during tornadoes. Know where to go for sturdy shelter nearby.', priority: 'low' }
  ],
  heat: [
    { title: 'Stay Hydrated', description: 'Drink water regularly, even if not thirsty. Avoid alcohol and caffeine which can dehydrate you.', priority: 'high' },
    { title: 'Find Air Conditioning', description: 'Stay in air-conditioned spaces. Know locations of public cooling centers in your area.', priority: 'high' },
    { title: 'Avoid Outdoor Activities', description: 'Stay indoors during hottest part of day (10am-6pm). If outside, take frequent breaks in shade.', priority: 'high' },
    { title: 'Dress Appropriately', description: 'Wear lightweight, light-colored, loose-fitting clothing. Use wide-brimmed hats and sunscreen.', priority: 'medium' },
    { title: 'Check on Vulnerable People', description: 'Visit elderly neighbors, those with medical conditions, and anyone without air conditioning.', priority: 'medium' },
    { title: 'Never Leave Anyone in Vehicles', description: 'Cars can reach deadly temperatures quickly. Never leave children, elderly, or pets in parked cars.', priority: 'low' }
  ]
};

// Hazard-specific preparedness areas
const hazardSpecificAreas: Record<string, Array<{ title: string; description: string; icon: string; color: string }>> = {
  hurricane: [
    { title: 'Evacuation Planning', description: 'Know your evacuation zone, routes, and shelter locations. Practice your evacuation plan with family.', icon: '🚗', color: '#8B5CF6' },
    { title: 'Storm Shutters & Securing', description: 'Install storm shutters or board windows. Secure outdoor furniture and trim trees around your home.', icon: '🏠', color: '#6366F1' },
    { title: 'Emergency Supplies', description: 'Stock 3-7 days of water, non-perishable food, medications, and cash for hurricane season.', icon: '📦', color: '#A855F7' },
    { title: 'Communication Plan', description: 'Have battery/hand-crank radio for weather updates. Establish out-of-state contact person.', icon: '📻', color: '#7C3AED' }
  ],
  wildfire: [
    { title: 'Defensible Space', description: 'Create and maintain 30-100 feet of defensible space around your home by clearing vegetation.', icon: '🌲', color: '#8B5CF6' },
    { title: 'Evacuation Readiness', description: 'Keep go-bags packed and vehicles fueled. Know multiple evacuation routes from your area.', icon: '🎒', color: '#6366F1' },
    { title: 'Air Quality Protection', description: 'Install HEPA air purifiers and have N95 masks ready for smoke protection.', icon: '😷', color: '#A855F7' },
    { title: 'Fire-Resistant Landscaping', description: 'Use fire-resistant plants and materials. Remove flammable debris from gutters and roof.', icon: '🏡', color: '#7C3AED' }
  ],
  flood: [
    { title: 'Flood Risk Assessment', description: 'Know your flood zone and evacuation routes to higher ground. Consider flood insurance.', icon: '🗺️', color: '#8B5CF6' },
    { title: 'Waterproofing', description: 'Store important documents and valuables in waterproof containers on upper floors.', icon: '💼', color: '#6366F1' },
    { title: 'Sandbag Preparation', description: 'Know how to properly deploy sandbags and have materials ready for flood barriers.', icon: '🏗️', color: '#A855F7' },
    { title: 'Utility Safety', description: 'Know how to safely shut off gas, electricity, and water to prevent additional hazards.', icon: '⚡', color: '#7C3AED' }
  ],
  earthquake: [
    { title: 'Home Securing', description: 'Anchor heavy furniture, appliances, and water heaters to walls. Secure items that could fall.', icon: '🔧', color: '#8B5CF6' },
    { title: 'Safe Spots Identification', description: 'Identify safe places in each room: under sturdy tables, away from windows and tall furniture.', icon: '🛡️', color: '#6366F1' },
    { title: 'Emergency Kits', description: 'Keep emergency supplies in multiple locations. Store sturdy shoes and flashlight by bed.', icon: '🔦', color: '#A855F7' },
    { title: 'Utility Controls', description: 'Learn how to turn off gas, water, and electricity. Keep necessary tools nearby.', icon: '🔧', color: '#7C3AED' }
  ],
  tornado: [
    { title: 'Safe Room Setup', description: 'Identify and prepare a small interior room on lowest floor with no windows as your safe room.', icon: '🏠', color: '#8B5CF6' },
    { title: 'Weather Monitoring', description: 'Have NOAA Weather Radio with battery backup and tone alert for tornado warnings.', icon: '📡', color: '#6366F1' },
    { title: 'Emergency Supplies', description: 'Keep flashlight, radio, first aid kit, helmet, and sturdy shoes in your safe room.', icon: '⛑️', color: '#A855F7' },
    { title: 'Drill Practice', description: 'Practice tornado drills regularly. Teach family the tornado position: crouch low, cover head.', icon: '🏃', color: '#7C3AED' }
  ],
  heat: [
    { title: 'Cooling Strategies', description: 'Identify air-conditioned spaces and public cooling centers. Prepare backup cooling methods.', icon: '❄️', color: '#8B5CF6' },
    { title: 'Hydration Planning', description: 'Stock extra water and electrolytes. Avoid alcohol and caffeine during extreme heat.', icon: '💧', color: '#6366F1' },
    { title: 'Activity Modification', description: 'Plan to stay indoors 10am-6pm during heat waves. Modify outdoor activities and work schedules.', icon: '🌞', color: '#A855F7' },
    { title: 'Vulnerable Population Care', description: 'Check on elderly neighbors and those without A/C. Never leave anyone in parked vehicles.', icon: '👥', color: '#7C3AED' }
  ]
};

export default function DisasterDetailModal({ visible, onClose, hazardType, readinessPercentage, onViewChecklist }: DisasterDetailModalProps) {
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

          {/* Preparation Tips - Hazard Specific */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Essential Preparation Tips</Text>
            <View style={styles.tipsList}>
              {(preparationTips[hazardType] || preparationTips.hurricane).map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <View style={[
                    styles.tipPriorityIndicator, 
                    { 
                      backgroundColor: tip.priority === 'high' ? '#8B5CF6' : 
                                     tip.priority === 'medium' ? '#6366F1' : '#A855F7'
                    }
                  ]} />
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                    <Text style={styles.tipDescription}>{tip.description}</Text>
                    <View style={[
                      styles.priorityBadge,
                      {
                        backgroundColor: tip.priority === 'high' ? '#EDE9FE' : 
                                       tip.priority === 'medium' ? '#E0E7FF' : '#F3E8FF'
                      }
                    ]}>
                      <Text style={[
                        styles.priorityText,
                        {
                          color: tip.priority === 'high' ? '#6B46C1' : 
                               tip.priority === 'medium' ? '#4F46E5' : '#7C3AED'
                        }
                      ]}>
                        {tip.priority.toUpperCase()} PRIORITY
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Key Preparedness Areas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{config.label} Preparedness Areas</Text>
            <View style={styles.areasList}>
              {(hazardSpecificAreas[hazardType] || hazardSpecificAreas.hurricane).map((area, index) => (
                <View key={index} style={styles.areaItem}>
                  <View style={[styles.areaIcon, { backgroundColor: area.color + '20' }]}>
                    <Text style={styles.areaEmoji}>{area.icon}</Text>
                  </View>
                  <View style={styles.areaContent}>
                    <Text style={styles.areaTitle}>{area.title}</Text>
                    <Text style={styles.areaDescription}>{area.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.improvedActionsList}>
              <TouchableOpacity 
                style={styles.primaryActionButton}
                onPress={() => {
                  onClose();
                  if (onViewChecklist) {
                    onViewChecklist(hazardType);
                  }
                }}
              >
                <Text style={styles.primaryActionText}>📋 View Checklist</Text>
                <Text style={[styles.actionSubtext, { color: '#C7D2FE' }]}>See what supplies you need</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryActionButton}>
                <Text style={styles.secondaryActionText}>📦 Update Supplies</Text>
                <Text style={[styles.actionSubtext, { color: '#6B46C1' }]}>Add items to inventory</Text>
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
  areaEmoji: {
    fontSize: 20,
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
  improvedActionsList: {
    gap: 16,
  },
  primaryActionButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryActionButton: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  secondaryActionText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  actionSubtext: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  actionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionChip: {
    backgroundColor: '#EFF6FF',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionChipText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  tipsList: {
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tipPriorityIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  tipDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
