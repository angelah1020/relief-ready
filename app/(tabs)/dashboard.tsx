import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, Tables } from '@/lib/supabase';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMap } from '@/contexts/MapContext';
import DisasterDetailModal from '@/components/DisasterDetailModal';
import { colors } from '@/lib/theme';
import { 
  AlertTriangle,
  Wind,
  Flame,
  Droplets,
  Mountain,
  Tornado,
  Sun,
  Home,
  MapPin,
  Clock
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const DONUT_SIZE = (width - 80) / 3;

interface DonutData {
  hazard_type: string;
  readiness_percentage: number;
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  color: string;
}

const hazardConfig: Record<string, { icon: any; label: string; color: string }> = {
  hurricane: { icon: Wind, label: 'Hurricane', color: '#0284C7' },
  wildfire: { icon: Flame, label: 'Wildfire', color: '#EA580C' },
  flood: { icon: Droplets, label: 'Flood', color: '#0891B2' },
  earthquake: { icon: Mountain, label: 'Earthquake', color: '#7C2D12' },
  tornado: { icon: Tornado, label: 'Tornado', color: '#6B7280' },
  heat: { icon: Sun, label: 'Heat Wave', color: '#354eab' },
};

export default function DashboardScreen() {
  const router = useRouter();
  const { currentHousehold, households, loading: householdLoading } = useHousehold();
  const { user, isNewUser, clearNewUserFlag } = useAuth();
  const { disasterData, loading: mapLoading } = useMap();
  const [donutData, setDonutData] = useState<DonutData[]>([]);
  const [nextBestActions, setNextBestActions] = useState<Tables<'nba_actions'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisaster, setSelectedDisaster] = useState<{ type: string; percentage: number } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeAlert, setActiveAlert] = useState<any>(null);

  // Handle new user routing
  useEffect(() => {
    if (!householdLoading && user) {
      if (isNewUser) {
        // New user should go to household setup index to choose
        clearNewUserFlag();
        router.replace('/household-setup');
        return;
      }
      
      if (households.length === 0) {
        // Existing user with no households should choose to create or join
        router.replace('/household-setup');
        return;
      }
    }
  }, [user, isNewUser, households, householdLoading]);

  useEffect(() => {
    if (currentHousehold) {
      fetchDashboardData();
    }
  }, [currentHousehold]);

  useEffect(() => {
    // Check for active alerts affecting the household area
    if (disasterData?.alerts && disasterData.alerts.length > 0) {
      // Get the most severe recent alert
      const sortedAlerts = [...disasterData.alerts].sort((a, b) => {
        const severityOrder = { 'Extreme': 4, 'Severe': 3, 'Moderate': 2, 'Minor': 1, 'Unknown': 0 };
        const aSeverity = severityOrder[a.properties?.severity || 'Unknown'] || 0;
        const bSeverity = severityOrder[b.properties?.severity || 'Unknown'] || 0;
        return bSeverity - aSeverity;
      });
      setActiveAlert(sortedAlerts[0] || null);
    } else {
      setActiveAlert(null);
    }
  }, [disasterData]);

  const fetchDashboardData = async () => {
    if (!currentHousehold) return;

    try {
      // Fetch donut status
      const { data: donutStatus } = await supabase
        .from('donut_status')
        .select('*')
        .eq('household_id', currentHousehold.id);

      if (donutStatus) {
        const formattedDonutData = donutStatus.map(item => ({
          hazard_type: item.hazard_type,
          readiness_percentage: item.readiness_percentage,
          ...hazardConfig[item.hazard_type],
        }));
        setDonutData(formattedDonutData);
      }

      // Fetch next best actions
      const { data: nbaActions } = await supabase
        .from('nba_actions')
        .select('*')
        .eq('household_id', currentHousehold.id)
        .order('priority', { ascending: true })
        .limit(3);

      if (nbaActions) {
        setNextBestActions(nbaActions);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisasterPress = (data: DonutData) => {
    setSelectedDisaster({
      type: data.hazard_type,
      percentage: data.readiness_percentage,
    });
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedDisaster(null);
  };

  const handleViewOnMap = () => {
    router.push('/map');
  };

  const getSeasonalMessage = () => {
    const month = new Date().getMonth();
    if (month >= 5 && month <= 10) { // June to November
      return 'Hurricane season is active—review your emergency plans and supplies.';
    } else if (month >= 11 || month <= 2) { // December to March  
      return 'Winter weather can bring power outages—check your heating plans and emergency supplies.';
    } else if (month >= 3 && month <= 5) { // April to June
      return 'Spring storms are common—verify your severe weather plans and supplies.';
    }
    return 'Stay prepared year-round with updated emergency supplies and plans.';
  };

  const formatAlertTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Time unavailable';
    }
  };

  const handleViewChecklist = (hazardType: string) => {
    setModalVisible(false);
    router.push({
      pathname: '/checklist-detail',
      params: { 
        hazardType
      }
    });
  };

  const renderDonut = (data: DonutData) => {
    const { icon: Icon, label, color, readiness_percentage } = data;
    
    // Calculate progress for visual ring
    const progress = readiness_percentage / 100;
    const circumference = 2 * Math.PI * 26; // radius of 26
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - progress);
    
    return (
      <TouchableOpacity
        key={data.hazard_type}
        style={[styles.donutCard, { width: DONUT_SIZE }]}
        onPress={() => handleDisasterPress(data)}
      >
        <View style={styles.donutContainer}>
          <View style={styles.donutOuter}>
            {/* Background circle */}
            <View style={[styles.donutBackground, { borderColor: color + '20' }]} />
            {/* Progress indicator - only show if progress > 0 */}
            {progress > 0 && (
              <View style={[styles.donutProgress, { 
                borderColor: 'transparent',
                borderLeftColor: color,
                transform: [{ rotate: `${-90 + (progress * 360)}deg` }]
              }]} />
            )}
            <View style={styles.donutInner}>
              <Icon size={22} color={color} />
              <Text style={[styles.donutPercentage, { color }]}>
                {readiness_percentage}%
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.donutLabel}>{label}</Text>
        <View style={[styles.readinessIndicator, { 
          backgroundColor: readiness_percentage >= 80 ? '#8B5CF6' : 
                           readiness_percentage >= 50 ? '#6366F1' : colors.primary
        }]}>
          <Text style={styles.readinessText}>
            {readiness_percentage >= 80 ? 'Ready' : 
             readiness_percentage >= 50 ? 'Partial' : 'Needs Work'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        {currentHousehold && (
          <Text style={styles.householdName}>{currentHousehold.name}</Text>
        )}
      </View>

      {/* Disaster Readiness Overview */}
      <View style={styles.readinessSection}>
        <View style={styles.readinessHeader}>
          <Text style={styles.readinessTitle}>Readiness Overview</Text>
          <View style={styles.readinessAccent} />
        </View>
        <Text style={styles.readinessSubtitle}>Track your emergency preparedness progress</Text>
        <View style={styles.donutGrid}>
          {donutData.map(renderDonut)}
        </View>
      </View>

      {/* Disaster Radar Box (if there's an active alert) */}
      {activeAlert ? (
        <View style={styles.activeAlertBox}>
          <View style={styles.alertBoxTopSection}>
            <View style={styles.alertIconContainer}>
              <AlertTriangle size={24} color={colors.primary} />
            </View>
            <View style={styles.alertHeaderContent}>
              <Text style={styles.activeAlertTitle}>DISASTER RADAR</Text>
              <Text style={styles.activeAlertEvent}>{activeAlert.properties?.event || 'Weather Alert'}</Text>
            </View>
          </View>
          
          <View style={styles.alertDetailsContainer}>
            <View style={styles.alertDetailRow}>
              <MapPin size={16} color={colors.primary} />
              <Text style={styles.alertDetailText}>
                {activeAlert.properties?.areaDesc || 'Local area'}
              </Text>
            </View>
            {activeAlert.properties?.ends && (
              <View style={styles.alertDetailRow}>
                <Clock size={16} color={colors.primary} />
                <Text style={styles.alertDetailText}>
                  Ends: {formatAlertTime(activeAlert.properties.ends)}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.alertGuidanceContainer}>
            <Text style={styles.alertGuidance}>
              {activeAlert.properties?.instruction || 'Stay informed and follow local emergency guidance.'}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.viewOnMapButton} onPress={handleViewOnMap}>
            <Text style={styles.viewOnMapText}>🗺️ View on Map</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Seasonal/Alert Card */
        <View style={styles.seasonalCard}>
          <View style={styles.alertHeader}>
            <AlertTriangle size={20} color={colors.primary} />
            <Text style={styles.alertTitle}>Seasonal Preparedness</Text>
          </View>
          <Text style={styles.alertDescription}>
            {getSeasonalMessage()}
          </Text>
        </View>
      )}

      {/* Disaster Detail Modal */}
      {selectedDisaster && (
        <DisasterDetailModal
          visible={modalVisible}
          onClose={handleCloseModal}
          hazardType={selectedDisaster.type}
          readinessPercentage={selectedDisaster.percentage}
          onViewChecklist={handleViewChecklist}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  householdName: {
    fontSize: 16,
    color: colors.lightBlue,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.lightBlue,
  },
  activeAlertBox: {
    backgroundColor: '#EEF2FF',
    borderColor: colors.primary,
    borderWidth: 2,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  alertBoxTopSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertIconContainer: {
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    padding: 12,
    marginRight: 16,
  },
  alertHeaderContent: {
    flex: 1,
  },
  activeAlertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  activeAlertEvent: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  alertDetailsContainer: {
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  alertDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertDetailText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 6,
    flex: 1,
  },
  alertGuidanceContainer: {
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  alertGuidance: {
    fontSize: 14,
    color: colors.primary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  viewOnMapButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: 'center',
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  viewOnMapText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  seasonalCard: {
    backgroundColor: colors.buttonSecondary + '22',
    borderColor: colors.buttonSecondary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 8,
  },
  alertDescription: {
    fontSize: 14,
    // replace dark red copy with theme primary color
    color: colors.primary,
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  readinessSection: {
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  readinessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  readinessTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    flex: 1,
  },
  readinessAccent: {
    width: 40,
    height: 3,
    backgroundColor: colors.secondary,
    borderRadius: 2,
  },
  readinessSubtitle: {
    fontSize: 16,
    color: colors.secondary,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  donutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  donutCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    opacity: 0.85,
  },
  donutContainer: {
    marginBottom: 12,
  },
  donutOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  donutBackground: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 6,
  },
  donutProgress: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 6,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
  },
  donutInner: {
    alignItems: 'center',
  },
  donutPercentage: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  donutLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  readinessIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  readinessText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
  actionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionChip: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionChipText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});