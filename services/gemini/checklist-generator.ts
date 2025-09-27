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
    
    return `Generate FEMA-based emergency checklist for ${hazardType}.

Household: ${totalPeople} people (${householdProfile.adults}A, ${householdProfile.children}C, ${householdProfile.seniors}S, ${householdProfile.infants}I), ${totalPets} pets, 3 days.

Return JSON array:
[{"item_key":"drinking_water","quantity_needed":${totalPeople * 9},"unit":"liters","hazard_type":"${hazardType}"},{"item_key":"non_perishable_food","quantity_needed":${totalPeople * 9},"unit":"meals","hazard_type":"${hazardType}"},{"item_key":"first_aid_kit","quantity_needed":1,"unit":"kits","hazard_type":"${hazardType}"},{"item_key":"flashlight","quantity_needed":${Math.max(1, Math.ceil(totalPeople / 2))},"unit":"items","hazard_type":"${hazardType}"},{"item_key":"batteries","quantity_needed":${Math.max(4, totalPeople * 2)},"unit":"packs","hazard_type":"${hazardType}"},{"item_key":"radio","quantity_needed":1,"unit":"items","hazard_type":"${hazardType}"},{"item_key":"blankets","quantity_needed":${totalPeople},"unit":"items","hazard_type":"${hazardType}"},{"item_key":"toilet_paper","quantity_needed":${Math.max(4, totalPeople * 2)},"unit":"rolls","hazard_type":"${hazardType}"},{"item_key":"whistle","quantity_needed":${totalPeople},"unit":"items","hazard_type":"${hazardType}"},{"item_key":"cash","quantity_needed":1,"unit":"sets","hazard_type":"${hazardType}"}${totalPets > 0 ? `,{"item_key":"pet_food","quantity_needed":${totalPets * 9},"unit":"meals","hazard_type":"${hazardType}"}` : ''}]`;
  }

  private buildBatchPrompt(householdProfile: HouseholdProfile, hazardTypes: string[]): string {
    const totalPeople = householdProfile.adults + householdProfile.children + householdProfile.seniors + householdProfile.infants;
    const totalPets = Object.values(householdProfile.pets).reduce((sum, count) => sum + count, 0);
    
    return `Generate FEMA-based emergency checklists for ALL these hazards: ${hazardTypes.join(', ')}.

Household: ${totalPeople} people (${householdProfile.adults}A, ${householdProfile.children}C, ${householdProfile.seniors}S, ${householdProfile.infants}I), ${totalPets} pets, 3 days.

Return JSON object with hazard types as keys:
{
  "hurricane": [{"item_key":"drinking_water","quantity_needed":${totalPeople * 9},"unit":"liters"},{"item_key":"non_perishable_food","quantity_needed":${totalPeople * 9},"unit":"meals"},{"item_key":"first_aid_kit","quantity_needed":1,"unit":"kits"},{"item_key":"flashlight","quantity_needed":${Math.max(1, Math.ceil(totalPeople / 2))},"unit":"items"},{"item_key":"batteries","quantity_needed":${Math.max(4, totalPeople * 2)},"unit":"packs"},{"item_key":"radio","quantity_needed":1,"unit":"items"},{"item_key":"blankets","quantity_needed":${totalPeople},"unit":"items"},{"item_key":"toilet_paper","quantity_needed":${Math.max(4, totalPeople * 2)},"unit":"rolls"},{"item_key":"whistle","quantity_needed":${totalPeople},"unit":"items"},{"item_key":"cash","quantity_needed":1,"unit":"sets"}${totalPets > 0 ? `,{"item_key":"pet_food","quantity_needed":${totalPets * 9},"unit":"meals"}` : ''}],
  "wildfire": [/* similar items */],
  "flood": [/* similar items */],
  "earthquake": [/* similar items */],
  "tornado": [/* similar items */],
  "heat": [/* similar items */]
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
