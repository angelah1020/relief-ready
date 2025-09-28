import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY
});

// Define the categories as specified
export const INVENTORY_CATEGORIES = {
  'Water & Food': {
    description: 'Water, non-perishable food, canned goods, dry goods, protein sources, snacks, beverages'
  },
  'Medical & First Aid': {
    description: 'First aid supplies, medications, medical equipment'
  },
  'Lighting & Power': {
    description: 'Flashlights, batteries, portable power sources'
  },
  'Communication & Navigation': {
    description: 'Radios, maps, communication devices'
  },
  'Shelter & Warmth': {
    description: 'Blankets, sleeping bags, tents, warm clothing'
  },
  'Sanitation & Hygiene': {
    description: 'Sanitizer, wipes, toilet paper, hygiene supplies'
  },
  'Tools & Safety': {
    description: 'Utility tools, safety equipment, protective gear'
  },
  'Important Documents & Money': {
    description: 'IDs, cash, insurance documents, keys'
  },
  'Pets': {
    description: 'Pet food, water, supplies, carriers'
  },
  'Other': {
    description: 'Items that don\'t fit into other categories'
  }
} as const;

export type CategoryKey = keyof typeof INVENTORY_CATEGORIES;

export interface CategorizationResult {
  category: CategoryKey;
  confidence: number;
  reasoning: string;
}

export class InventoryCategorizer {
  async categorizeItem(description: string, quantity?: string, unit?: string): Promise<CategorizationResult> {
    try {
      // Check if API key is available
      if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
        throw new Error('Gemini API key not found');
      }

      const prompt = this.buildCategorizationPrompt(description, quantity, unit);
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
      });
      
      const text = response.text || '';
      return this.parseCategorizationResponse(text);
    } catch (error) {
      return {
        category: 'Other',
        confidence: 0.1,
        reasoning: 'Categorization service unavailable'
      };
    }
  }

  async processInventoryItem(
    description: string, 
    quantity?: string, 
    unit?: string
  ): Promise<{canonical_key: string, canonical_quantity: number, canonical_unit: string, confidence: number, reasoning: string}> {
    try {
      // Check if API key is available
      if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
        throw new Error('Gemini API key not found');
      }

      const prompt = this.buildInventoryProcessingPrompt(description, quantity, unit);
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
      });
      
      const text = response.text || '';
      return this.parseInventoryProcessingResponse(text);
    } catch (error) {
      return {
        canonical_key: 'non_perishable_food',
        canonical_quantity: 1,
        canonical_unit: 'meals',
        confidence: 0.1,
        reasoning: 'Processing service unavailable'
      };
    }
  }


  private buildCategorizationPrompt(description: string, quantity?: string, unit?: string): string {
    const categoriesList = Object.entries(INVENTORY_CATEGORIES)
      .map(([key, value]) => `- ${key}: ${value.description}`)
      .join('\n');

    return `Categorize this emergency preparedness item into ONE of these categories:

${categoriesList}

Item: "${description}"${quantity ? ` (${quantity} ${unit || 'units'})` : ''}

Rules:
- Food/water items → Water & Food
- Medical supplies → Medical & First Aid
- Choose the most appropriate category for emergency use
- Use "Other" for items that don't clearly fit any specific category

Respond in JSON format:
{
  "category": "exact category name",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}`;
  }

  private parseCategorizationResponse(response: string): CategorizationResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!Object.keys(INVENTORY_CATEGORIES).includes(parsed.category)) {
        throw new Error('Invalid category returned');
      }

      return {
        category: parsed.category as CategoryKey,
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
        reasoning: parsed.reasoning || 'No reasoning provided'
      };
    } catch (error) {
      // Error parsing categorization response
      return {
        category: 'Other',
        confidence: 0.1,
        reasoning: 'Failed to parse AI response'
      };
    }
  }

  getCategories(): typeof INVENTORY_CATEGORIES {
    return INVENTORY_CATEGORIES;
  }

  getCategory(key: CategoryKey) {
    return INVENTORY_CATEGORIES[key];
  }

  private buildInventoryProcessingPrompt(description: string, quantity?: string, unit?: string): string {
    const canonicalKeys = [
      'drinking_water', 'non_perishable_food', 'first_aid_kit', 'prescription_medications',
      'bandages', 'antiseptic', 'pain_relievers', 'flashlight', 'batteries', 'solar_charger',
      'candles', 'noaa_weather_radio', 'maps', 'whistle', 'blankets', 'sleeping_bags',
      'warm_clothing', 'tent', 'toilet_paper', 'hygiene_supplies', 'bleach', 'plastic_bags',
      'bucket', 'multi_tool', 'duct_tape', 'fire_extinguisher', 'work_gloves', 'can_opener',
      'important_documents', 'cash', 'insurance_papers', 'identification', 'pet_carrier',
      'pet_leash', 'pet_medications', 'pet_food'
    ].join(', ');

    return `Analyze this user-submitted inventory item and return a single, structured JSON object with its canonical key and standardized quantity/unit.

CANONICAL KEYS: ${canonicalKeys}

STANDARDIZATION RULES:
- Food items (canned goods, dry goods, protein sources) → "non_perishable_food" with unit "meals"
- Water items → "drinking_water" with unit "liters" 
- Medical supplies → appropriate medical canonical key with unit "items"
- Tools → appropriate tool canonical key with unit "items"
- Other items → most appropriate canonical key with unit "items"

User Input: "${description}"${quantity ? ` (${quantity} ${unit || 'units'})` : ''}

CRITICAL: Respond ONLY with the raw JSON object, no other text. The JSON must have this exact structure:
{
  "canonical_key": "string",
  "canonical_quantity": number,
  "canonical_unit": "string",
  "confidence": number,
  "reasoning": "string"
}

Examples:
- "2 cans of beans" → {"canonical_key": "non_perishable_food", "canonical_quantity": 2, "canonical_unit": "meals", "confidence": 0.9, "reasoning": "Canned beans are non-perishable food, 1 can = 1 meal"}
- "3 gallons of water" → {"canonical_key": "drinking_water", "canonical_quantity": 11.36, "canonical_unit": "liters", "confidence": 0.95, "reasoning": "Water for drinking, converted gallons to liters"}
- "1 first aid kit" → {"canonical_key": "first_aid_kit", "canonical_quantity": 1, "canonical_unit": "items", "confidence": 0.98, "reasoning": "Direct match to first aid kit"}`;
  }

  private parseInventoryProcessingResponse(response: string): {canonical_key: string, canonical_quantity: number, canonical_unit: string, confidence: number, reasoning: string} {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        canonical_key: parsed.canonical_key || 'non_perishable_food',
        canonical_quantity: Math.max(parsed.canonical_quantity || 1, 0),
        canonical_unit: parsed.canonical_unit || 'items',
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
        reasoning: parsed.reasoning || 'No reasoning provided'
      };
    } catch (error) {
      // Error parsing inventory processing response
      return {
        canonical_key: 'non_perishable_food',
        canonical_quantity: 1,
        canonical_unit: 'meals',
        confidence: 0.1,
        reasoning: 'Failed to parse AI response'
      };
    }
  }
}

// Export a singleton instance
export const inventoryCategorizer = new InventoryCategorizer();
