import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { supabase, Tables } from '@/lib/supabase';
import { useHousehold } from '@/contexts/HouseholdContext';
import { Plus, Edit, Trash2, X, Sparkles } from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { inventoryCategorizer, CategoryKey, INVENTORY_CATEGORIES } from '@/services/gemini/categorizer';

interface InventoryItemForm {
  description: string;
  quantity: string;
  unit: string;
  location: string;
  expiration_date: string;
  category?: CategoryKey;
  ai_confidence?: number;
}

export default function InventoryScreen() {
  const { currentHousehold } = useHousehold();
  const [inventoryItems, setInventoryItems] = useState<Tables<'inventory_items'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Tables<'inventory_items'> | null>(null);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categorizedItems, setCategorizedItems] = useState<{[key: string]: Tables<'inventory_items'>[]}>({});
  const [formData, setFormData] = useState<InventoryItemForm>({
    description: '',
    quantity: '',
    unit: 'item',
    location: '',
    expiration_date: '',
  });

  useEffect(() => {
    if (currentHousehold) {
      fetchInventoryItems();
    }
  }, [currentHousehold]);

  const fetchInventoryItems = async () => {
    if (!currentHousehold) return;

    try {
      const { data } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('household_id', currentHousehold.id)
        .order('created_at', { ascending: false });

      if (data) {
        setInventoryItems(data);
        organizeItemsByCategory(data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizeItemsByCategory = (items: Tables<'inventory_items'>[]) => {
    const categorized: {[key: string]: Tables<'inventory_items'>[]} = {};
    
    // Initialize all categories
    Object.keys(INVENTORY_CATEGORIES).forEach(category => {
      categorized[category] = [];
    });
    
    // Add uncategorized section
    categorized['Uncategorized'] = [];

    // Group items by category
    items.forEach(item => {
      const category = (item as any).canonical_key;
      if (category && categorized[category]) {
        categorized[category].push(item);
      } else {
        categorized['Uncategorized'].push(item);
      }
    });

    setCategorizedItems(categorized);
  };

  const categorizeItem = async (description: string, quantity: string, unit: string) => {
    if (!description.trim()) return;

    setIsCategorizing(true);
    try {
      const result = await inventoryCategorizer.categorizeItem(description, quantity, unit);
      
      setFormData(prev => ({
        ...prev,
        category: result.category,
        ai_confidence: result.confidence
      }));

      Alert.alert(
        'AI Categorization',
        `Item categorized as: ${result.category}\nConfidence: ${Math.round(result.confidence * 100)}%\n\nReasoning: ${result.reasoning}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error categorizing item:', error);
      Alert.alert('Error', 'Failed to categorize item. Please try again.');
    } finally {
      setIsCategorizing(false);
    }
  };


  const resetForm = () => {
    setFormData({
      description: '',
      quantity: '',
      unit: 'item',
      location: '',
      expiration_date: '',
      category: undefined,
      ai_confidence: undefined,
    });
    setEditingItem(null);
  };

  const openModal = (item?: Tables<'inventory_items'>) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        description: item.description,
        quantity: item.quantity.toString(),
        unit: item.unit,
        location: item.location || '',
        expiration_date: item.expiration_date || '',
        category: (item as any).canonical_key as CategoryKey,
        ai_confidence: (item as any).ai_confidence,
      });
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!currentHousehold || !formData.description || !formData.quantity) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    setIsSaving(true);
    try {
      // Auto-categorize if not already categorized
      let category = formData.category;
      let ai_confidence = formData.ai_confidence;
      
      if (!category) {
        try {
          const result = await inventoryCategorizer.categorizeItem(
            formData.description, 
            formData.quantity, 
            formData.unit
          );
          category = result.category;
          ai_confidence = result.confidence;
        } catch (error) {
          console.error('Auto-categorization failed:', error);
          // Continue without categorization if AI fails
        }
      }

      const itemData = {
        household_id: currentHousehold.id,
        description: formData.description,
        quantity,
        unit: formData.unit,
        location: formData.location || null,
        expiration_date: formData.expiration_date || null,
        // AI categorization data
        canonical_key: category || null,
        ai_confidence: ai_confidence || null,
        category: category || 'General',
        item_key: formData.description.toLowerCase().replace(/\s+/g, '_'),
        updated_at: new Date().toISOString(),
      };

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('inventory_items')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        // Create new item
        const { error } = await supabase
          .from('inventory_items')
          .insert(itemData);

        if (error) throw error;
      }

      closeModal();
      fetchInventoryItems();
      Alert.alert('Success', editingItem ? 'Item updated!' : 'Item added!');
    } catch (error: any) {
      console.error('Error saving item:', error);
      Alert.alert('Error', error.message || 'Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (item: Tables<'inventory_items'>) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('inventory_items')
                .delete()
                .eq('id', item.id);

              if (error) throw error;

              fetchInventoryItems();
              Alert.alert('Success', 'Item deleted!');
            } catch (error: any) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', error.message || 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Inventory</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Plus size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {inventoryItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Items Yet</Text>
            <Text style={styles.emptyDescription}>
              Start building your emergency inventory by adding supplies you have on hand.
            </Text>
          </View>
        ) : (
          <View style={styles.categorizedItems}>
            {Object.entries(categorizedItems).map(([category, items]) => {
              if (items.length === 0) return null;
              
              return (
                <View key={category} style={styles.categorySection}>
                  <Text style={[
                    styles.categoryTitle,
                    category === 'Uncategorized' && styles.uncategorizedTitle
                  ]}>
                    {category}
                  </Text>
                  <View style={styles.itemsList}>
                    {items.map((item) => (
                      <View key={item.id} style={styles.inventoryItem}>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemDescription}>{item.description}</Text>
                          <Text style={styles.itemDetails}>
                            {item.quantity} {item.unit}
                            {item.location && ` • ${item.location}`}
                            {item.expiration_date && ` • Expires: ${item.expiration_date}`}
                            {(item as any).ai_confidence && (
                              <Text style={styles.aiConfidence}>
                                {' '}• AI: {Math.round((item as any).ai_confidence * 100)}%
                              </Text>
                            )}
                          </Text>
                        </View>
                        <View style={styles.itemActions}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => openModal(item)}
                          >
                            <Edit size={16} color="#6B7280" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => handleDelete(item)}
                          >
                            <Trash2 size={16} color="#354eab" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit Item' : 'Add Item'}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description *</Text>
              <View style={styles.inputWithButton}>
                <TextInput
                  style={[styles.input, styles.inputWithButtonInput]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="What is this item?"
                  autoCapitalize="sentences"
                />
                <TouchableOpacity
                  style={[styles.aiButton, isCategorizing && styles.aiButtonDisabled]}
                  onPress={() => categorizeItem(formData.description, formData.quantity, formData.unit)}
                  disabled={isCategorizing || !formData.description.trim()}
                >
                  {isCategorizing ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Sparkles size={16} color="#ffffff" />
                  )}
                </TouchableOpacity>
              </View>
              {formData.category && (
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryLabel}>
                    AI Category: {formData.category}
                    {formData.ai_confidence && (
                      <Text style={styles.confidenceText}>
                        {' '}({Math.round(formData.ai_confidence * 100)}% confidence)
                      </Text>
                    )}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>Unit</Text>
                <TextInput
                  style={styles.input}
                  value={formData.unit}
                  onChangeText={(text) => setFormData({ ...formData, unit: text })}
                  placeholder="item"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                placeholder="Where is this stored?"
                autoCapitalize="sentences"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Expiration Date</Text>
              <TextInput
                style={styles.input}
                value={formData.expiration_date}
                onChangeText={(text) => setFormData({ ...formData, expiration_date: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#354eab',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
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
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 100,
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
  itemsList: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  inventoryItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
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
  itemInfo: {
    flex: 1,
  },
  itemDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  deleteButton: {
    backgroundColor: colors.buttonSecondary + '22',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
  },
  saveButton: {
    backgroundColor: '#354eab',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // AI Categorization Styles
  categorizedItems: {
    paddingBottom: 20,
  },
  categorySection: {
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  uncategorizedTitle: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
  aiConfidence: {
    fontSize: 12,
    color: colors.lightBlue,
    fontStyle: 'italic',
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWithButtonInput: {
    flex: 1,
  },
  aiButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  aiButtonDisabled: {
    opacity: 0.6,
  },
  categoryInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  categoryLabel: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  confidenceText: {
    fontSize: 12,
    color: colors.lightBlue,
  },
});