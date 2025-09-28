import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useHousehold } from '@/contexts/HouseholdContext';
import { getChecklistSummary, getHouseholdPreparedness } from '@/lib/inventory-processing';
import { 
  Package, 
  Droplets, 
  Heart, 
  Zap, 
  Radio, 
  Home, 
  Wrench, 
  FileText, 
  Dog,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react-native';

const categoryIcons: Record<string, any> = {
  'Water & Food': Droplets,
  'Medical & First Aid': Heart,
  'Lighting & Power': Zap,
  'Communication & Navigation': Radio,
  'Shelter & Warmth': Home,
  'Sanitation & Hygiene': Wrench,
  'Tools & Safety': Wrench,
  'Important Documents & Money': FileText,
  'Pets': Dog,
}

interface ChecklistSummaryItem {
  household_id: string;
  hazard_type: string;
  item_key: string;
  description: string;
  quantity_needed: number;
  quantity_have: number;
  unit: string;
  priority: string;
  fulfillment_percentage: number;
  is_fulfilled: boolean;
}

interface ChecklistWithFulfillmentProps {
  hazardType: string;
  onItemPress?: (item: ChecklistSummaryItem) => void;
}

export default function ChecklistWithFulfillment({ 
  hazardType, 
  onItemPress 
}: ChecklistWithFulfillmentProps) {
  const { currentHousehold } = useHousehold();
  const [checklistItems, setChecklistItems] = useState<ChecklistSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [preparedness, setPreparedness] = useState({ 
    overallPercentage: 0, 
    totalItems: 0, 
    fulfilledItems: 0 
  });

  useEffect(() => {
    if (currentHousehold) {
      loadChecklistData();
    }
  }, [currentHousehold, hazardType]);

  const loadChecklistData = async () => {
    if (!currentHousehold) return;

    try {
      setLoading(true);
      
      const [checklistData, preparednessData] = await Promise.all([
        getChecklistSummary(currentHousehold.id, hazardType),
        getHouseholdPreparedness(currentHousehold.id)
      ]);

      setChecklistItems(checklistData);
      setPreparedness(preparednessData);
    } catch (error) {
      console.error('Error loading checklist data:', error);
      Alert.alert('Error', 'Failed to load checklist data');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryItems = (category: string) => {
    return checklistItems.filter(item => {
      // Map item_key to category (you might need to adjust this mapping)
      const itemCategory = getCategoryFromItemKey(item.item_key);
      return itemCategory === category;
    });
  };

  const getCategories = () => {
    const categories = new Set<string>();
    checklistItems.forEach(item => {
      const category = getCategoryFromItemKey(item.item_key);
      categories.add(category);
    });
    return Array.from(categories).sort();
  };

  const getCategoryFromItemKey = (itemKey: string): string => {
    // This should match your existing category mapping logic
    const categoryMap: Record<string, string> = {
      'drinking_water': 'Water & Food',
      'non_perishable_food': 'Water & Food',
      'first_aid_kit': 'Medical & First Aid',
      'prescription_medications': 'Medical & First Aid',
      'bandages': 'Medical & First Aid',
      'antiseptic': 'Medical & First Aid',
      'pain_relievers': 'Medical & First Aid',
      'flashlight': 'Lighting & Power',
      'batteries': 'Lighting & Power',
      'solar_charger': 'Lighting & Power',
      'candles': 'Lighting & Power',
      'noaa_weather_radio': 'Communication & Navigation',
      'maps': 'Communication & Navigation',
      'whistle': 'Tools & Safety',
      'blankets': 'Shelter & Warmth',
      'sleeping_bags': 'Shelter & Warmth',
      'warm_clothing': 'Shelter & Warmth',
      'tent': 'Shelter & Warmth',
      'toilet_paper': 'Sanitation & Hygiene',
      'hygiene_supplies': 'Sanitation & Hygiene',
      'bleach': 'Sanitation & Hygiene',
      'plastic_bags': 'Sanitation & Hygiene',
      'bucket': 'Sanitation & Hygiene',
      'multi_tool': 'Tools & Safety',
      'duct_tape': 'Tools & Safety',
      'fire_extinguisher': 'Tools & Safety',
      'work_gloves': 'Tools & Safety',
      'can_opener': 'Tools & Safety',
      'important_documents': 'Important Documents & Money',
      'cash': 'Important Documents & Money',
      'insurance_papers': 'Important Documents & Money',
      'identification': 'Important Documents & Money',
      'pet_carrier': 'Pets',
      'pet_leash': 'Pets',
      'pet_medications': 'Pets',
      'pet_food': 'Pets'
    };

    return categoryMap[itemKey] || 'Tools & Safety';
  };

  const getFulfillmentIcon = (isFulfilled: boolean, percentage: number) => {
    if (isFulfilled) {
      return <CheckCircle size={16} color="#059669" />;
    } else if (percentage >= 50) {
      return <AlertCircle size={16} color="#F59E0B" />;
    } else {
      return <XCircle size={16} color="#EF4444" />;
    }
  };

  const getFulfillmentColor = (isFulfilled: boolean, percentage: number) => {
    if (isFulfilled) return '#059669';
    if (percentage >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const renderItem = (item: ChecklistSummaryItem) => {
    const fulfillmentColor = getFulfillmentColor(item.is_fulfilled, item.fulfillment_percentage);
    
    return (
      <TouchableOpacity
        key={item.item_key}
        style={[styles.itemCard, { borderLeftColor: fulfillmentColor }]}
        onPress={() => onItemPress?.(item)}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.description}</Text>
            <View style={styles.itemQuantityRow}>
              <Text style={styles.itemQuantity}>
                {item.quantity_have}/{item.quantity_needed} {item.unit}
              </Text>
              {getFulfillmentIcon(item.is_fulfilled, item.fulfillment_percentage)}
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(item.fulfillment_percentage, 100)}%`,
                    backgroundColor: fulfillmentColor
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: fulfillmentColor }]}>
              {Math.round(item.fulfillment_percentage)}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategory = (category: string) => {
    const items = getCategoryItems(category);
    const IconComponent = categoryIcons[category] || Package;

    if (items.length === 0) return null;

    const categoryFulfilled = items.filter(item => item.is_fulfilled).length;
    const categoryTotal = items.length;

    return (
      <View key={category} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryIcon}>
            <IconComponent size={20} color="#354eab" />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <Text style={styles.categoryCount}>
              {categoryFulfilled}/{categoryTotal} items
            </Text>
          </View>
        </View>
        
        <View style={styles.itemsList}>
          {items.map(renderItem)}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#354eab" />
        <Text style={styles.loadingText}>Loading checklist...</Text>
      </View>
    );
  }

  if (checklistItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No checklist items found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Preparedness Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Overall Preparedness</Text>
        <Text style={styles.summaryPercentage}>{preparedness.overallPercentage}%</Text>
        <Text style={styles.summaryDetails}>
          {preparedness.fulfilledItems} of {preparedness.totalItems} items fulfilled
        </Text>
      </View>

      {/* Checklist Categories */}
      {getCategories().map(renderCategory)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  summaryPercentage: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#354eab',
    marginBottom: 4,
  },
  summaryDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  categorySection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#a8bafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemsList: {
    gap: 8,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  progressBar: {
    width: 60,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
