import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { supabase, Tables } from '@/lib/supabase';
import { useHousehold } from '@/contexts/HouseholdContext';
import { CheckCircle, Circle, AlertTriangle } from 'lucide-react-native';

interface ChecklistItemWithInventory extends Tables<'checklist_items'> {
  have_quantity: number;
  status: 'empty' | 'partial' | 'full';
}

export default function ChecklistScreen() {
  const { currentHousehold } = useHousehold();
  const [checklistItems, setChecklistItems] = useState<ChecklistItemWithInventory[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentHousehold) {
      fetchChecklistData();
    }
  }, [currentHousehold]);

  const fetchChecklistData = async () => {
    if (!currentHousehold) return;

    try {
      // Fetch checklist items
      const { data: checklistData } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('household_id', currentHousehold.id)
        .order('category', { ascending: true })
        .order('priority', { ascending: false });

      if (checklistData) {
        // Calculate have quantities from inventory
        const itemsWithQuantity = await Promise.all(
          checklistData.map(async (item) => {
            const { data: inventoryData } = await supabase
              .from('inventory_items')
              .select('quantity')
              .eq('household_id', currentHousehold.id)
              .eq('item_key', item.item_key);

            const haveQuantity = inventoryData?.reduce((sum, inv) => sum + inv.quantity, 0) || 0;
            
            let status: 'empty' | 'partial' | 'full' = 'empty';
            if (haveQuantity >= item.quantity_needed) {
              status = 'full';
            } else if (haveQuantity > 0) {
              status = 'partial';
            }

            return {
              ...item,
              have_quantity: haveQuantity,
              status,
            };
          })
        );

        setChecklistItems(itemsWithQuantity);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(itemsWithQuantity.map(item => item.category))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error fetching checklist data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: 'empty' | 'partial' | 'full') => {
    switch (status) {
      case 'full':
        return <CheckCircle size={20} color="#059669" />;
      case 'partial':
        return <AlertTriangle size={20} color="#D97706" />;
      case 'empty':
        return <Circle size={20} color="#DC2626" />;
    }
  };

  const getStatusColor = (status: 'empty' | 'partial' | 'full') => {
    switch (status) {
      case 'full':
        return '#D1FAE5';
      case 'partial':
        return '#FEF3C7';
      case 'empty':
        return '#FEE2E2';
    }
  };

  const renderCategorySection = (category: string) => {
    const categoryItems = checklistItems.filter(item => item.category === category);
    
    return (
      <View key={category} style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{category}</Text>
        {categoryItems.map((item) => (
          <View key={item.id} style={[styles.checklistItem, { backgroundColor: getStatusColor(item.status) }]}>
            <View style={styles.itemHeader}>
              {getStatusIcon(item.status)}
              <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
            <View style={styles.itemFooter}>
              <Text style={styles.quantityText}>
                Have: {item.have_quantity} / Need: {item.quantity_needed} {item.unit}
              </Text>
              <Text style={[styles.priorityText, item.priority === 'high' && styles.highPriority]}>
                {item.priority.toUpperCase()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Emergency Checklist</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading checklist...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Checklist</Text>
        {currentHousehold && (
          <Text style={styles.householdName}>{currentHousehold.name}</Text>
        )}
      </View>

      {checklistItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Checklist Items</Text>
          <Text style={styles.emptyDescription}>
            Your emergency checklist will be generated automatically. If you don't see items here, 
            try refreshing or contact support.
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          {categories.map(renderCategorySection)}
        </View>
      )}
    </ScrollView>
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
    marginBottom: 4,
  },
  householdName: {
    fontSize: 16,
    color: '#6b7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  checklistItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    color: '#6b7280',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  highPriority: {
    color: '#DC2626',
  },
});