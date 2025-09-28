import { supabase } from '@/lib/supabase';
import { inventoryCategorizer } from '@/services/gemini/categorizer';

export interface ProcessedInventoryItem {
  id?: string;
  household_id: string;
  item_key: string;
  quantity: number;
  unit: string;
  location?: string;
  expiration_date?: string;
  // AI processed fields
  canonical_key: string;
  canonical_quantity: number;
  canonical_unit: string;
  ai_confidence: number;
  category: string;
}

/**
 * Process a raw inventory item through AI and save to database
 */
export async function processAndSaveInventoryItem(
  householdId: string,
  itemKey: string,
  quantity: number,
  unit: string,
  location?: string,
  expirationDate?: string
): Promise<ProcessedInventoryItem> {
  try {
    // Process through AI using item_key as the description
    const aiResult = await inventoryCategorizer.processInventoryItem(
      itemKey,
      quantity.toString(),
      unit
    );

    // Determine category from canonical key
    const category = getCategoryFromCanonicalKey(aiResult.canonical_key);

    // Save to database
    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        household_id: householdId,
        item_key: itemKey,
        quantity: quantity,
        unit: unit,
        location: location || null,
        expiration_date: expirationDate || null,
        // AI processed fields - round to whole numbers
        canonical_key: aiResult.canonical_key,
        canonical_quantity: Math.round(aiResult.canonical_quantity),
        canonical_unit: aiResult.canonical_unit,
        ai_confidence: aiResult.confidence,
        category: category
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      household_id: data.household_id,
      item_key: data.item_key,
      quantity: data.quantity,
      unit: data.unit,
      location: data.location,
      expiration_date: data.expiration_date,
      canonical_key: data.canonical_key,
      canonical_quantity: data.canonical_quantity,
      canonical_unit: data.canonical_unit,
      ai_confidence: data.ai_confidence,
      category: data.category
    };
  } catch (error) {
    // Error processing inventory item
    throw error;
  }
}

/**
 * Update an existing inventory item with AI processing
 */
export async function updateInventoryItemWithAI(
  itemId: string,
  itemKey: string,
  quantity: number,
  unit: string,
  location?: string,
  expirationDate?: string
): Promise<ProcessedInventoryItem> {
  try {
    // Process through AI using item_key as the description
    const aiResult = await inventoryCategorizer.processInventoryItem(
      itemKey,
      quantity.toString(),
      unit
    );

    // Determine category from canonical key
    const category = getCategoryFromCanonicalKey(aiResult.canonical_key);

    // Update in database
    const { data, error } = await supabase
      .from('inventory_items')
      .update({
        item_key: itemKey,
        quantity: quantity,
        unit: unit,
        location: location || null,
        expiration_date: expirationDate || null,
        // AI processed fields - round to whole numbers
        canonical_key: aiResult.canonical_key,
        canonical_quantity: Math.round(aiResult.canonical_quantity),
        canonical_unit: aiResult.canonical_unit,
        ai_confidence: aiResult.confidence,
        category: category
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      household_id: data.household_id,
      item_key: data.item_key,
      quantity: data.quantity,
      unit: data.unit,
      location: data.location,
      expiration_date: data.expiration_date,
      canonical_key: data.canonical_key,
      canonical_quantity: data.canonical_quantity,
      canonical_unit: data.canonical_unit,
      ai_confidence: data.ai_confidence,
      category: data.category
    };
  } catch (error) {
    // Error updating inventory item
    throw error;
  }
}

/**
 * Get checklist items with fulfillment data calculated directly
 */
export async function getChecklistSummary(householdId: string, hazardType?: string) {
  try {
    // Get checklist items
    let checklistQuery = supabase
      .from('checklist_items')
      .select('*')
      .eq('household_id', householdId);

    if (hazardType) {
      checklistQuery = checklistQuery.eq('hazard_type', hazardType);
    }

    const { data: checklistItems, error: checklistError } = await checklistQuery;

    if (checklistError) throw checklistError;

    if (!checklistItems || checklistItems.length === 0) {
      return [];
    }

    // Get inventory items for fulfillment calculation
    const { data: inventoryItems, error: inventoryError } = await supabase
      .from('inventory_items')
      .select('canonical_key, canonical_quantity')
      .eq('household_id', householdId);

    if (inventoryError) throw inventoryError;

    // Calculate fulfillment for each checklist item
    const summaryItems = checklistItems.map(item => {
      // Find matching inventory items by canonical_key
      const matchingInventory = inventoryItems?.filter(inv => 
        inv.canonical_key === item.item_key
      ) || [];

      // Sum up the canonical quantities
      const quantityHave = matchingInventory.reduce((sum, inv) => 
        sum + (inv.canonical_quantity || 0), 0
      );

      // Calculate fulfillment percentage
      const fulfillmentPercentage = item.quantity_needed > 0 
        ? Math.min(100, Math.round((quantityHave / item.quantity_needed) * 100 * 10) / 10)
        : 0;

      // Determine if fulfilled
      const isFulfilled = quantityHave >= item.quantity_needed;

      return {
        household_id: item.household_id,
        hazard_type: item.hazard_type,
        item_key: item.item_key,
        quantity_needed: item.quantity_needed,
        unit: item.unit,
        quantity_have: quantityHave,
        fulfillment_percentage: fulfillmentPercentage,
        is_fulfilled: isFulfilled
      };
    });

    return summaryItems;
  } catch (error) {
    // Error fetching checklist summary
    throw error;
  }
}

/**
 * Get overall household preparedness percentage
 */
export async function getHouseholdPreparedness(householdId: string) {
  try {
    const { data, error } = await supabase
      .from('checklist_summary')
      .select('fulfillment_percentage, is_fulfilled')
      .eq('household_id', householdId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { overallPercentage: 0, totalItems: 0, fulfilledItems: 0 };
    }

    const totalItems = data.length;
    const fulfilledItems = data.filter(item => item.is_fulfilled).length;
    const overallPercentage = Math.round(
      data.reduce((sum, item) => sum + item.fulfillment_percentage, 0) / totalItems
    );

    return {
      overallPercentage,
      totalItems,
      fulfilledItems
    };
  } catch (error) {
    // Error calculating household preparedness
    throw error;
  }
}

/**
 * Map canonical keys to display categories
 */
function getCategoryFromCanonicalKey(canonicalKey: string): string {
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

  return categoryMap[canonicalKey] || 'Other';
}
