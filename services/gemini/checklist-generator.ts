import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY
});

export interface ChecklistItem {
  item_key: string;
  quantity_needed: number;
  unit: string;
  hazard_type: string;
}

export interface HouseholdProfile {
  adults: number;
  children: number;
  seniors: number;
  infants: number;
  pets: Record<string, number>;
  duration_days: number;
  medical_needs?: Array<{
    age_group: string;
    medical_notes: string;
  }>;
  total_people?: number;
}

export class ChecklistGenerator {
  async generateChecklist(hazardType: string, householdProfile: HouseholdProfile): Promise<ChecklistItem[]> {
    try {
      // Check if API key is available
      if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
        throw new Error('Gemini API key not found');
      }

      const prompt = this.buildChecklistPrompt(hazardType, householdProfile);
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
      });
      
      const text = response.text || '';
      return this.parseChecklistResponse(text, hazardType);
    } catch (error: any) {
      console.error('Checklist generation failed:', error);
      throw error; // Re-throw the error instead of using fallback
    }
  }

  async generateAllChecklists(householdProfile: HouseholdProfile, hazardTypes: string[]): Promise<Record<string, ChecklistItem[]>> {
    try {
      // Check if API key is available
      if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
        throw new Error('Gemini API key not found');
      }

      const prompt = this.buildBatchPrompt(householdProfile, hazardTypes);
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
      });
      
      const text = response.text || '';
      return this.parseBatchResponse(text, hazardTypes);
    } catch (error: any) {
      console.error('Batch checklist generation failed:', error);
      throw error;
    }
  }


  private buildChecklistPrompt(hazardType: string, householdProfile: HouseholdProfile): string {
    const totalPeople = householdProfile.adults + householdProfile.children + householdProfile.seniors + householdProfile.infants;
    const totalPets = Object.values(householdProfile.pets).reduce((sum, count) => sum + count, 0);
    
    // Simplified calculations - all whole numbers
    const waterPerPerson = 4; // 4 liters per person per day (simplified from 3.785)
    const days = 3;
    const waterTotal = totalPeople * waterPerPerson * days;
    const foodTotal = totalPeople * 3 * days; // 3 meals per person per day
    const flashlights = totalPeople >= 2 ? Math.floor(totalPeople / 2) : 1; // 1 flashlight per 2 people, minimum 1
    const batteries = totalPeople * 2; // 2 battery packs per person
    const toiletPaper = totalPeople * 2; // 2 rolls per person
    
    // Check if there are medical needs
    const hasMedicalNeeds = householdProfile.medical_needs && householdProfile.medical_needs.length > 0;
    const medicalNeedsText = hasMedicalNeeds ? 
      `\n\nIMPORTANT: This household has medical conditions that require special supplies for 3 days:
${householdProfile.medical_needs?.map(need => `- ${need.age_group}: ${need.medical_notes}`).join('\n') || ''}

For each medical condition, infer and include the necessary medical supplies, medications, and equipment needed for 3 days, even if not in standard FEMA checklists. Consider:
- Prescription medications (3-day supply)
- Medical equipment (oxygen tanks, CPAP machines, etc.)
- Special dietary needs
- Mobility aids
- Medical monitoring devices
- Emergency medical supplies specific to their condition` : '';

    return `Generate emergency checklist for ${hazardType}.

Household: ${totalPeople} people, ${totalPets} pets, 3 days.${medicalNeedsText}

Calculate quantities (whole numbers only):
- Water: ${totalPeople} × ${waterPerPerson} × ${days} = ${waterTotal} liters
- Food: ${totalPeople} × 3 × ${days} = ${foodTotal} meals
- Personal items: ${totalPeople} each
- Shared items: 1 per household

Return JSON:
[{"item_key":"drinking_water","quantity_needed":${waterTotal},"unit":"liters","hazard_type":"${hazardType}"},{"item_key":"non_perishable_food","quantity_needed":${foodTotal},"unit":"meals","hazard_type":"${hazardType}"},{"item_key":"first_aid_kit","quantity_needed":1,"unit":"kits","hazard_type":"${hazardType}"},{"item_key":"flashlight","quantity_needed":${flashlights},"unit":"items","hazard_type":"${hazardType}"},{"item_key":"batteries","quantity_needed":${batteries},"unit":"packs","hazard_type":"${hazardType}"},{"item_key":"radio","quantity_needed":1,"unit":"items","hazard_type":"${hazardType}"},{"item_key":"blankets","quantity_needed":${totalPeople},"unit":"items","hazard_type":"${hazardType}"},{"item_key":"toilet_paper","quantity_needed":${toiletPaper},"unit":"rolls","hazard_type":"${hazardType}"},{"item_key":"whistle","quantity_needed":${totalPeople},"unit":"items","hazard_type":"${hazardType}"},{"item_key":"cash","quantity_needed":1,"unit":"sets","hazard_type":"${hazardType}"}${totalPets > 0 ? `,{"item_key":"pet_food","quantity_needed":${totalPets * 3},"unit":"meals","hazard_type":"${hazardType}"}` : ''}]`;
  }

  private buildBatchPrompt(householdProfile: HouseholdProfile, hazardTypes: string[]): string {
    const totalPeople = householdProfile.adults + householdProfile.children + householdProfile.seniors + householdProfile.infants;
    const totalPets = Object.values(householdProfile.pets).reduce((sum, count) => sum + count, 0);
    
    // Simplified calculations - all whole numbers
    const waterPerPerson = 4; // 4 liters per person per day (simplified from 3.785)
    const days = 3;
    const waterTotal = totalPeople * waterPerPerson * days;
    const foodTotal = totalPeople * 3 * days; // 3 meals per person per day
    const flashlights = totalPeople >= 2 ? Math.floor(totalPeople / 2) : 1; // 1 flashlight per 2 people, minimum 1
    const batteries = totalPeople * 2; // 2 battery packs per person
    const toiletPaper = totalPeople * 2; // 2 rolls per person
    
    // Check if there are medical needs
    const hasMedicalNeeds = householdProfile.medical_needs && householdProfile.medical_needs.length > 0;
    const medicalNeedsText = hasMedicalNeeds ? 
      `\n\nIMPORTANT: This household has medical conditions that require special supplies for 3 days:
${householdProfile.medical_needs?.map(need => `- ${need.age_group}: ${need.medical_notes}`).join('\n') || ''}

For each medical condition, infer and include the necessary medical supplies, medications, and equipment needed for 3 days, even if not in standard FEMA checklists. Consider:
- Prescription medications (3-day supply)
- Medical equipment (oxygen tanks, CPAP machines, etc.)
- Special dietary needs
- Mobility aids
- Medical monitoring devices
- Emergency medical supplies specific to their condition` : '';

    return `Generate emergency checklists for: ${hazardTypes.join(', ')}.

Household: ${totalPeople} people, ${totalPets} pets, 3 days.${medicalNeedsText}

Standard items for all hazards (whole numbers only):
- Water: ${waterTotal} liters
- Food: ${foodTotal} meals  
- Personal: ${totalPeople} each
- Shared: 1 per household

Return JSON:
{
  "hurricane": [{"item_key":"drinking_water","quantity_needed":${waterTotal},"unit":"liters"},{"item_key":"non_perishable_food","quantity_needed":${foodTotal},"unit":"meals"},{"item_key":"first_aid_kit","quantity_needed":1,"unit":"kits"},{"item_key":"flashlight","quantity_needed":${flashlights},"unit":"items"},{"item_key":"batteries","quantity_needed":${batteries},"unit":"packs"},{"item_key":"radio","quantity_needed":1,"unit":"items"},{"item_key":"blankets","quantity_needed":${totalPeople},"unit":"items"},{"item_key":"toilet_paper","quantity_needed":${toiletPaper},"unit":"rolls"},{"item_key":"whistle","quantity_needed":${totalPeople},"unit":"items"},{"item_key":"cash","quantity_needed":1,"unit":"sets"}${totalPets > 0 ? `,{"item_key":"pet_food","quantity_needed":${totalPets * 3},"unit":"meals"}` : ''}],
  "wildfire": [{"item_key":"drinking_water","quantity_needed":${waterTotal},"unit":"liters"},{"item_key":"non_perishable_food","quantity_needed":${foodTotal},"unit":"meals"},{"item_key":"first_aid_kit","quantity_needed":1,"unit":"kits"},{"item_key":"flashlight","quantity_needed":${flashlights},"unit":"items"},{"item_key":"batteries","quantity_needed":${batteries},"unit":"packs"},{"item_key":"radio","quantity_needed":1,"unit":"items"},{"item_key":"blankets","quantity_needed":${totalPeople},"unit":"items"},{"item_key":"toilet_paper","quantity_needed":${toiletPaper},"unit":"rolls"},{"item_key":"whistle","quantity_needed":${totalPeople},"unit":"items"},{"item_key":"cash","quantity_needed":1,"unit":"sets"}${totalPets > 0 ? `,{"item_key":"pet_food","quantity_needed":${totalPets * 3},"unit":"meals"}` : ''}],
  "flood": [{"item_key":"drinking_water","quantity_needed":${waterTotal},"unit":"liters"},{"item_key":"non_perishable_food","quantity_needed":${foodTotal},"unit":"meals"},{"item_key":"first_aid_kit","quantity_needed":1,"unit":"kits"},{"item_key":"flashlight","quantity_needed":${flashlights},"unit":"items"},{"item_key":"batteries","quantity_needed":${batteries},"unit":"packs"},{"item_key":"radio","quantity_needed":1,"unit":"items"},{"item_key":"blankets","quantity_needed":${totalPeople},"unit":"items"},{"item_key":"toilet_paper","quantity_needed":${toiletPaper},"unit":"rolls"},{"item_key":"whistle","quantity_needed":${totalPeople},"unit":"items"},{"item_key":"cash","quantity_needed":1,"unit":"sets"}${totalPets > 0 ? `,{"item_key":"pet_food","quantity_needed":${totalPets * 3},"unit":"meals"}` : ''}],
  "earthquake": [{"item_key":"drinking_water","quantity_needed":${waterTotal},"unit":"liters"},{"item_key":"non_perishable_food","quantity_needed":${foodTotal},"unit":"meals"},{"item_key":"first_aid_kit","quantity_needed":1,"unit":"kits"},{"item_key":"flashlight","quantity_needed":${flashlights},"unit":"items"},{"item_key":"batteries","quantity_needed":${batteries},"unit":"packs"},{"item_key":"radio","quantity_needed":1,"unit":"items"},{"item_key":"blankets","quantity_needed":${totalPeople},"unit":"items"},{"item_key":"toilet_paper","quantity_needed":${toiletPaper},"unit":"rolls"},{"item_key":"whistle","quantity_needed":${totalPeople},"unit":"items"},{"item_key":"cash","quantity_needed":1,"unit":"sets"}${totalPets > 0 ? `,{"item_key":"pet_food","quantity_needed":${totalPets * 3},"unit":"meals"}` : ''}],
  "tornado": [{"item_key":"drinking_water","quantity_needed":${waterTotal},"unit":"liters"},{"item_key":"non_perishable_food","quantity_needed":${foodTotal},"unit":"meals"},{"item_key":"first_aid_kit","quantity_needed":1,"unit":"kits"},{"item_key":"flashlight","quantity_needed":${flashlights},"unit":"items"},{"item_key":"batteries","quantity_needed":${batteries},"unit":"packs"},{"item_key":"radio","quantity_needed":1,"unit":"items"},{"item_key":"blankets","quantity_needed":${totalPeople},"unit":"items"},{"item_key":"toilet_paper","quantity_needed":${toiletPaper},"unit":"rolls"},{"item_key":"whistle","quantity_needed":${totalPeople},"unit":"items"},{"item_key":"cash","quantity_needed":1,"unit":"sets"}${totalPets > 0 ? `,{"item_key":"pet_food","quantity_needed":${totalPets * 3},"unit":"meals"}` : ''}],
  "heat": [{"item_key":"drinking_water","quantity_needed":${waterTotal},"unit":"liters"},{"item_key":"non_perishable_food","quantity_needed":${foodTotal},"unit":"meals"},{"item_key":"first_aid_kit","quantity_needed":1,"unit":"kits"},{"item_key":"flashlight","quantity_needed":${flashlights},"unit":"items"},{"item_key":"batteries","quantity_needed":${batteries},"unit":"packs"},{"item_key":"radio","quantity_needed":1,"unit":"items"},{"item_key":"blankets","quantity_needed":${totalPeople},"unit":"items"},{"item_key":"toilet_paper","quantity_needed":${toiletPaper},"unit":"rolls"},{"item_key":"whistle","quantity_needed":${totalPeople},"unit":"items"},{"item_key":"cash","quantity_needed":1,"unit":"sets"}${totalPets > 0 ? `,{"item_key":"pet_food","quantity_needed":${totalPets * 3},"unit":"meals"}` : ''}]
}`;
  }

  private parseChecklistResponse(response: string, hazardType: string): ChecklistItem[] {
    try {
      // Clean the response text to extract JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      
      const checklistItems = JSON.parse(jsonString);
      
      if (!Array.isArray(checklistItems)) {
        throw new Error('Response is not an array');
      }
      
      return checklistItems;
    } catch (error) {
      console.error('Error parsing checklist response:', error);
      console.error('Raw response:', response);
      throw error; // Re-throw instead of using fallback
    }
  }

  private parseBatchResponse(response: string, hazardTypes: string[]): Record<string, ChecklistItem[]> {
    try {
      // Clean the response text to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      
      const batchData = JSON.parse(jsonString);
      
      // Convert to our expected format with hazard_type in each item
      const result: Record<string, ChecklistItem[]> = {};
      
      for (const hazardType of hazardTypes) {
        if (batchData[hazardType] && Array.isArray(batchData[hazardType])) {
          result[hazardType] = batchData[hazardType].map((item: any) => ({
            ...item,
            hazard_type: hazardType
          }));
        }
      }
      
      return result;
    } catch (error) {
      console.error('Failed to parse batch response:', error);
      throw new Error('Failed to parse AI batch response');
    }
  }

}

// Export a singleton instance
export const checklistGenerator = new ChecklistGenerator();
