import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useHousehold } from '@/contexts/HouseholdContext'
import { 
  getChecklistItems,
  getHazardDisplayName,
  generateChecklist,
  type ChecklistItem
} from '@/lib/checklist'
import { 
  ArrowLeft, 
  Package, 
  Droplets, 
  Heart, 
  Zap, 
  Radio, 
  Home, 
  Shower, 
  Wrench, 
  FileText, 
  Dog,
  Info
} from 'lucide-react-native'

const categoryIcons: Record<string, any> = {
  'Food': Package,
  'Water': Droplets,
  'Medical & First Aid': Heart,
  'Lighting & Power': Zap,
  'Communication & Navigation': Radio,
  'Shelter & Warmth': Home,
  'Sanitation & Hygiene': Shower,
  'Tools & Safety': Wrench,
  'Important Documents & Money': FileText,
  'Pets': Dog,
}

// Map item keys to categories for display
const itemCategoryMap: Record<string, string> = {
  // Water items
  'drinking_water': 'Water',
  'water_storage': 'Water',
  'water_purification': 'Water',
  
  // Food items
  'non_perishable_food': 'Food',
  'canned_food': 'Food',
  'energy_bars': 'Food',
  'baby_food': 'Food',
  'pet_food': 'Pets',
  
  // Medical & First Aid
  'first_aid_kit': 'Medical & First Aid',
  'prescription_medications': 'Medical & First Aid',
  'bandages': 'Medical & First Aid',
  'antiseptic': 'Medical & First Aid',
  'pain_relievers': 'Medical & First Aid',
  
  // Lighting & Power
  'flashlight': 'Lighting & Power',
  'batteries': 'Lighting & Power',
  'battery_radio': 'Communication & Navigation',
  'solar_charger': 'Lighting & Power',
  'candles': 'Lighting & Power',
  
  // Communication & Navigation
  'noaa_weather_radio': 'Communication & Navigation',
  'maps': 'Communication & Navigation',
  'whistle': 'Tools & Safety',
  
  // Shelter & Warmth
  'blankets': 'Shelter & Warmth',
  'sleeping_bags': 'Shelter & Warmth',
  'warm_clothing': 'Shelter & Warmth',
  'tent': 'Shelter & Warmth',
  
  // Sanitation & Hygiene
  'toilet_paper': 'Sanitation & Hygiene',
  'hygiene_supplies': 'Sanitation & Hygiene',
  'bleach': 'Sanitation & Hygiene',
  'plastic_bags': 'Sanitation & Hygiene',
  'bucket': 'Sanitation & Hygiene',
  
  // Tools & Safety
  'multi_tool': 'Tools & Safety',
  'duct_tape': 'Tools & Safety',
  'fire_extinguisher': 'Tools & Safety',
  'work_gloves': 'Tools & Safety',
  'can_opener': 'Tools & Safety',
  
  // Important Documents & Money
  'important_documents': 'Important Documents & Money',
  'cash': 'Important Documents & Money',
  'insurance_papers': 'Important Documents & Money',
  'identification': 'Important Documents & Money',
  
  // Pets
  'pet_carrier': 'Pets',
  'pet_leash': 'Pets',
  'pet_medications': 'Pets',
}

export default function ChecklistDetailScreen() {
  const router = useRouter()
  const { hazardType } = useLocalSearchParams<{ hazardType: string }>()
  const { currentHousehold } = useHousehold()
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    if (hazardType && currentHousehold) {
      loadChecklist()
    }
  }, [hazardType, currentHousehold])

  const loadChecklist = async () => {
    if (!currentHousehold || !hazardType) return

    try {
      setLoading(true)
      
      console.log('Loading checklist for:', { householdId: currentHousehold.id, hazardType })
      
      const items = await getChecklistItems(currentHousehold.id, hazardType)
      console.log('Checklist items loaded:', items)
      
      setChecklistItems(items)
      
    } catch (error) {
      console.error('Failed to load checklist:', error)
      Alert.alert('Error', `Failed to load checklist: ${error.message}`)
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateChecklist = async () => {
    if (!currentHousehold || !hazardType) return

    try {
      setGenerating(true)
      
      console.log('Starting checklist generation...')
      await generateChecklist({
        household_id: currentHousehold.id,
        hazard_type: hazardType
      })
      
      console.log('Checklist generation completed, reloading...')
      // Reload the checklist after generation
      await loadChecklist()
      
    } catch (error) {
      console.error('Failed to generate checklist:', error)
      
      // Check if it's a quota error and show helpful message
      const errorMessage = error?.message?.toLowerCase() || '';
      if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        Alert.alert(
          'API Quota Exceeded', 
          'You\'ve reached your API quota limit. Please wait a moment and try again, or check your API usage limits.',
          [{ text: 'OK' }]
        )
      } else {
        Alert.alert('Error', `Failed to generate checklist: ${error.message}`)
      }
    } finally {
      setGenerating(false)
    }
  }

  const getCategoryItems = (category: string) => {
    return checklistItems.filter(item => {
      const itemCategory = itemCategoryMap[item.item_key] || 'Tools & Safety'
      return itemCategory === category
    })
  }

  const getCategories = () => {
    const categories = new Set<string>()
    checklistItems.forEach(item => {
      const category = itemCategoryMap[item.item_key] || 'Tools & Safety'
      categories.add(category)
    })
    return Array.from(categories).sort()
  }

  const getItemDisplayName = (itemKey: string) => {
    return itemKey
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const renderItem = (item: ChecklistItem) => {
    return (
      <View key={item.id || item.item_key} style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>
            {getItemDisplayName(item.item_key)}
          </Text>
          <Text style={styles.itemQuantity}>
            {item.quantity_needed} {item.unit}
          </Text>
        </View>
      </View>
    )
  }

  const renderCategory = (category: string) => {
    const items = getCategoryItems(category)
    const IconComponent = categoryIcons[category] || Package

    if (items.length === 0) return null

    return (
      <View key={category} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryIcon}>
            <IconComponent size={20} color="#DC2626" />
          </View>
          <Text style={styles.categoryTitle}>{category}</Text>
          <Text style={styles.categoryCount}>{items.length} items</Text>
        </View>
        
        <View style={styles.itemsList}>
          {items.map(renderItem)}
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading checklist...</Text>
      </View>
    )
  }

  if (checklistItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              {getHazardDisplayName(hazardType)} Checklist
            </Text>
            <Text style={styles.headerSubtitle}>
              Generate your personalized checklist
            </Text>
          </View>
        </View>

        <View style={styles.generateContainer}>
          <Text style={styles.generateTitle}>Generate Your Checklist</Text>
          <Text style={styles.generateDescription}>
            Create a personalized emergency preparedness checklist for {getHazardDisplayName(hazardType)} based on your household composition and FEMA guidelines.
          </Text>
          
          <TouchableOpacity
            style={[styles.generateButton, generating && styles.generateButtonDisabled]}
            onPress={handleGenerateChecklist}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.generateButtonText}>Generate Checklist</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {getHazardDisplayName(hazardType)} Checklist
          </Text>
          <Text style={styles.headerSubtitle}>
            {checklistItems.length} items • Based on FEMA guidelines
          </Text>
        </View>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setShowInfo(!showInfo)}
        >
          <Info size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Info Panel */}
      {showInfo && (
        <View style={styles.infoPanel}>
          <Text style={styles.infoTitle}>About This Checklist</Text>
          <Text style={styles.infoText}>
            This checklist is generated based on FEMA's "Are You Ready?" Appendix B supply checklists. 
            Quantities are calculated specifically for your household composition and a 3-day supply period.
          </Text>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {getCategories().map(renderCategory)}
      </ScrollView>
    </View>
  )
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
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
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  infoButton: {
    padding: 8,
  },
  infoPanel: {
    backgroundColor: '#f0f9ff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  categorySection: {
    marginBottom: 24,
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
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  categoryCount: {
    fontSize: 14,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemsList: {
    gap: 8,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  backButtonText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '500',
  },
  generateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  generateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  generateDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  generateButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
})
