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
import DisasterDetailModal from '@/components/DisasterDetailModal';
import { colors } from '@/lib/theme';
import { 
  AlertTriangle,
  Wind,
  Flame,
  Droplets,
  Mountain,
  Tornado,
  Sun
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
  const { currentHousehold } = useHousehold();
  const [donutData, setDonutData] = useState<DonutData[]>([]);
  const [nextBestActions, setNextBestActions] = useState<Tables<'nba_actions'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisaster, setSelectedDisaster] = useState<{ type: string; percentage: number } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (currentHousehold) {
      fetchDashboardData();
    }
  }, [currentHousehold]);

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

  const renderDonut = (data: DonutData) => {
    const { icon: Icon, label, color, readiness_percentage } = data;
    
    return (
      <TouchableOpacity
        key={data.hazard_type}
        style={[styles.donutCard, { width: DONUT_SIZE }]}
        onPress={() => handleDisasterPress(data)}
      >
        <View style={styles.donutContainer}>
          <View style={[styles.donutOuter, { borderColor: color }]}>
            <View style={styles.donutInner}>
              <Icon size={24} color={color} />
              <Text style={[styles.donutPercentage, { color }]}>
                {readiness_percentage}%
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.donutLabel}>{label}</Text>
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

      {/* Seasonal/Alert Card */}
      <View style={styles.alertCard}>
        <View style={styles.alertHeader}>
          <AlertTriangle size={20} color="#354eab" />
          <Text style={styles.alertTitle}>Seasonal Preparedness</Text>
        </View>
        <Text style={styles.alertDescription}>
          Winter is approaching. Review your emergency heating plans and ensure you have adequate supplies for power outages.
        </Text>
      </View>

      {/* Disaster Readiness Donuts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Disaster Readiness</Text>
        <View style={styles.donutGrid}>
          {donutData.map(renderDonut)}
        </View>
      </View>

      {/* Next Best Actions */}
      {nextBestActions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Best Actions</Text>
          <View style={styles.actionChips}>
            {nextBestActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionChip}
                onPress={() => router.push('/inventory')}
              >
                <Text style={styles.actionChipText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Disaster Detail Modal */}
      {selectedDisaster && (
        <DisasterDetailModal
          visible={modalVisible}
          onClose={handleCloseModal}
          hazardType={selectedDisaster.type}
          readinessPercentage={selectedDisaster.percentage}
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
  alertCard: {
    // use theme secondary tint instead of hard-coded red background
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
  donutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  donutCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  donutContainer: {
    marginBottom: 12,
  },
  donutOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutInner: {
    alignItems: 'center',
  },
  donutPercentage: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  donutLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
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