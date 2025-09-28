import { supabase } from './supabase'
import { checklistGenerator, type ChecklistItem as GeneratedChecklistItem } from '@/services/gemini/checklist-generator'



export interface ChecklistItem {
  id?: string
  household_id: string
  item_key: string
  quantity_needed: number
  unit: string
  hazard_type: string
}

export interface GenerateChecklistRequest {
  household_id: string
  hazard_type: string
}

export interface GenerateChecklistResponse {
  success: boolean
  items: ChecklistItem[]
  item_count: number
}

/**
 * Generate a personalized checklist for a specific hazard type
 */
export async function generateChecklist(
  request: GenerateChecklistRequest
): Promise<GenerateChecklistResponse> {
  console.log('Generating checklist:', request)
  
  try {
    // Get household and members data (no pet filtering needed since members table has no pets)
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .eq('household_id', request.household_id)

    if (membersError) {
      throw new Error(`Failed to fetch household members: ${membersError.message}`)
    }

    // Get pets data separately
    const { data: pets, error: petsError } = await supabase
      .from('pets')
      .select('*')
      .eq('household_id', request.household_id)

    if (petsError) {
      throw new Error(`Failed to fetch household pets: ${petsError.message}`)
    }

    // Calculate demographics from members
    const adults = members.filter(m => m.age_group === 'adult').length
    const children = members.filter(m => m.age_group === 'child').length
    const seniors = members.filter(m => m.age_group === 'senior').length
    const infants = members.filter(m => m.age_group === 'infant').length
    const petCount = pets?.length || 0

    // Get medical needs information
    const membersWithMedicalNeeds = members.filter(m => m.medical_notes && m.medical_notes.trim() !== '')
    const medicalNeeds = membersWithMedicalNeeds.map(m => ({
      age_group: m.age_group,
      medical_notes: m.medical_notes
    }))

    const householdProfile = {
      adults,
      children,
      seniors,
      infants,
      pets: petCount > 0 ? { total: petCount } : { total: 0 },
      duration_days: 3,
      medical_needs: medicalNeeds,
      total_people: adults + children + seniors + infants
    }

    console.log('Household profile:', householdProfile)

    // Generate checklist using Gemini with retry logic
    console.log('Generating checklist with Gemini...')
    const generatedItems = await checklistGenerator.generateChecklist(
      request.hazard_type,
      householdProfile
    )

    console.log('Generated items:', generatedItems)

    // Delete existing checklist items for this hazard type
    const { error: deleteError } = await supabase
      .from('checklist_items')
      .delete()
      .eq('household_id', request.household_id)
      .eq('hazard_type', request.hazard_type)

    if (deleteError) {
      console.error('Error deleting existing checklist:', deleteError)
      // Continue anyway, might be first time
    }

    // Insert new checklist items
    const checklistRows = generatedItems.map(item => ({
      household_id: request.household_id,
      item_key: item.item_key,
      quantity_needed: item.quantity_needed,
      unit: item.unit,
      hazard_type: item.hazard_type
    }))

    console.log('Inserting checklist rows:', checklistRows)

    const { data: insertedItems, error: insertError } = await supabase
      .from('checklist_items')
      .insert(checklistRows)
      .select()

    if (insertError) {
      console.error('Error inserting checklist items:', insertError)
      throw insertError
    }

    console.log('Successfully inserted items:', insertedItems)

    return {
      success: true,
      items: insertedItems || [],
      item_count: generatedItems.length
    }

  } catch (error: any) {
    console.error('Error in generateChecklist:', error)
    throw new Error(`Failed to generate checklist: ${error.message}`)
  }
}

/**
 * Get all checklist items for a household and hazard type
 */
export async function getChecklistItems(
  householdId: string, 
  hazardType: string
): Promise<ChecklistItem[]> {
  console.log('Fetching checklist items:', { householdId, hazardType })
  
  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('household_id', householdId)
    .eq('hazard_type', hazardType)
    .order('item_key')

  console.log('Checklist items query result:', { data, error })

  if (error) {
    console.error('Database error:', error)
    throw new Error(`Failed to fetch checklist items: ${error.message}`)
  }

  return data || []
}

/**
 * Get all checklists for a household (grouped by hazard type)
 */
export async function getAllChecklists(householdId: string): Promise<Record<string, ChecklistItem[]>> {
  console.log('Fetching all checklists for household:', householdId)
  
  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('household_id', householdId)
    .order('hazard_type, item_key')

  if (error) {
    console.error('Database error:', error)
    throw new Error(`Failed to fetch checklists: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return {}
  }

  // Group items by hazard type
  const groupedData = data.reduce((acc, item) => {
    const hazardType = item.hazard_type
    if (!acc[hazardType]) {
      acc[hazardType] = []
    }
    acc[hazardType].push(item)
    return acc
  }, {} as Record<string, ChecklistItem[]>)

  return groupedData
}


/**
 * Get available hazard types
 */
export function getAvailableHazardTypes(): string[] {
  return [
    'hurricane',
    'wildfire',
    'flood',
    'earthquake',
    'tornado',
    'heat'
  ]
}

/**
 * Get hazard type display name
 */
export function getHazardDisplayName(hazardType: string): string {
  const displayNames: Record<string, string> = {
    'hurricane': 'Hurricane',
    'wildfire': 'Wildfire',
    'flood': 'Flood',
    'earthquake': 'Earthquake',
    'tornado': 'Tornado',
    'heat': 'Heat Wave'
  }
  
  return displayNames[hazardType] || hazardType
}

/**
 * Get available checklist categories
 */
export function getAvailableCategories(): string[] {
  return [
    'Food',
    'Water',
    'Medical & First Aid',
    'Lighting & Power',
    'Communication & Navigation',
    'Shelter & Warmth',
    'Sanitation & Hygiene',
    'Tools & Safety',
    'Important Documents & Money',
    'Pets'
  ]
}

/**
 * Generate all checklists for a household in a single batch API call (much faster!)
 */
export async function generateAllChecklists(householdId: string) {
  console.log('Generating all checklists in batch for household:', householdId)
  
  try {
    // Get household and members data (no pet filtering needed since members table has no pets)
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .eq('household_id', householdId)

    if (membersError) {
      throw new Error(`Failed to fetch household members: ${membersError.message}`)
    }

    // Get pets data separately
    const { data: pets, error: petsError } = await supabase
      .from('pets')
      .select('*')
      .eq('household_id', householdId)

    if (petsError) {
      throw new Error(`Failed to fetch household pets: ${petsError.message}`)
    }

    // Calculate demographics from members
    const adults = members.filter(m => m.age_group === 'adult').length
    const children = members.filter(m => m.age_group === 'child').length
    const seniors = members.filter(m => m.age_group === 'senior').length
    const infants = members.filter(m => m.age_group === 'infant').length
    const petCount = pets?.length || 0

    // Get medical needs information
    const membersWithMedicalNeeds = members.filter(m => m.medical_notes && m.medical_notes.trim() !== '')
    const medicalNeeds = membersWithMedicalNeeds.map(m => ({
      age_group: m.age_group,
      medical_notes: m.medical_notes
    }))

    const householdProfile = {
      adults,
      children,
      seniors,
      infants,
      pets: petCount > 0 ? { total: petCount } : { total: 0 },
      duration_days: 3,
      medical_needs: medicalNeeds,
      total_people: adults + children + seniors + infants
    }

    console.log('Household profile for batch generation:', householdProfile)

    const hazardTypes = getAvailableHazardTypes()

    // Generate all checklists in a single API call
    console.log('Generating all checklists with Gemini in batch...')
    const allGeneratedChecklists = await checklistGenerator.generateAllChecklists(
      householdProfile,
      hazardTypes
    )

    console.log('Generated all checklists:', allGeneratedChecklists)

    // Delete all existing checklist items for this household
    const { error: deleteError } = await supabase
      .from('checklist_items')
      .delete()
      .eq('household_id', householdId)

    if (deleteError) {
      console.error('Error deleting existing checklists:', deleteError)
      // Continue anyway
    }

    // Prepare all checklist rows for batch insert
    const allChecklistRows = []
    for (const hazardType in allGeneratedChecklists) {
      const items = allGeneratedChecklists[hazardType]
      for (const item of items) {
        allChecklistRows.push({
          household_id: householdId,
          item_key: item.item_key,
          quantity_needed: item.quantity_needed,
          unit: item.unit,
          hazard_type: item.hazard_type
        })
      }
    }

    console.log('Inserting all checklist rows:', allChecklistRows.length, 'items')

    // Insert all new checklists at once
    const { data: insertedItems, error: insertError } = await supabase
      .from('checklist_items')
      .insert(allChecklistRows)
      .select()

    if (insertError) {
      console.error('Error inserting batch checklist items:', insertError)
      throw insertError
    }

    console.log('Successfully inserted all checklist items:', insertedItems?.length)

    return {
      success: true,
      items: insertedItems || [],
      total_items: allChecklistRows.length
    }

  } catch (error: any) {
    console.error('Error in generateAllChecklists:', error)
    throw new Error(`Failed to generate all checklists: ${error.message}`)
  }
}
