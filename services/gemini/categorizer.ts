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

interface CategorizationResult {
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
    } catch (error: any) {
      console.error('Error categorizing item:', error);
      
      // Return a default categorization for any error
      return {
        category: 'Other',
        confidence: 0.1,
        reasoning: 'AI categorization failed'
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
      console.error('Error parsing categorization response:', error);
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
}

// Export a singleton instance
export const inventoryCategorizer = new InventoryCategorizer();
