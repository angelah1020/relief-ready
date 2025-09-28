import { GoogleGenerativeAI } from '@google/generative-ai';

export interface HouseholdMember {
  firstName: string;
  lastName: string;
  ageBand: 'infant' | 'child' | 'teen' | 'adult' | 'senior';
  medicalNotes?: string;
}

export interface Pet {
  type: string;
  count: number;
  note?: string;
}

export interface InventoryItem {
  description: string;
  quantity: number;
  unit: string;
  category: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  estimatedImpact: string;
  actionItems: string[];
}

export interface RecommendationContext {
  household: {
    name: string;
    country: string;
    postalCode: string;
    memberCount: number;
    petCount: number;
    riskProfile: string[];
  };
  members: HouseholdMember[];
  pets: Pet[];
  currentInventory: InventoryItem[];
  recentDisasters: string[];
  currentSeason: string;
}

export class RecommendationEngine {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');
  }

  async getQuickActions(context: RecommendationContext): Promise<Recommendation[]> {
    try {
      const prompt = this.buildRecommendationsPrompt(context);
      
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text() || '';
      
      return this.parseRecommendationsResponse(text);
    } catch (error) {
      // Error generating recommendations
      return this.getFallbackRecommendations(context);
    }
  }

  private buildRecommendationsPrompt(context: RecommendationContext): string {
    return `You are an emergency preparedness expert analyzing a household's readiness. Generate 3-5 specific, actionable recommendations to improve their disaster preparedness.

Household Context:
- Name: ${context.household.name}
- Location: ${context.household.postalCode}, ${context.household.country}
- Members: ${context.household.memberCount} (${context.members.map(m => `${m.firstName} (${m.ageBand})`).join(', ')})
- Pets: ${context.household.petCount} (${context.pets.map(p => `${p.type}`).join(', ')})
- Risk Profile: ${context.household.riskProfile.join(', ')}
- Current Season: ${context.currentSeason}
- Recent Disasters: ${context.recentDisasters.join(', ') || 'None'}

Current Inventory:
${context.currentInventory.map(item => `- ${item.description} (${item.quantity} ${item.unit}) - ${item.category}`).join('\n')}

Generate recommendations that:
1. Address the biggest gaps in their preparedness
2. Are specific and actionable
3. Consider their household composition and location
4. Prioritize high-impact, low-effort actions
5. Include seasonal considerations
6. Account for any medical needs or special requirements

Return as JSON array with this structure:
[
  {
    "id": "unique-id",
    "title": "Clear, actionable title",
    "description": "Detailed explanation of why this matters",
    "priority": "high|medium|low",
    "category": "Water & Food|Medical|Lighting|Communication|Shelter|Sanitation|Tools|Documents|Pets",
    "estimatedImpact": "Expected improvement in preparedness",
    "actionItems": ["Specific step 1", "Specific step 2", "Specific step 3"]
  }
]

Focus on practical, immediately actionable items that will make the biggest difference in their emergency readiness.`;
  }

  private parseRecommendationsResponse(response: string): Recommendation[] {
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      
      const recommendations = JSON.parse(jsonMatch[0]);
      
      // Validate and format recommendations
      return recommendations.map((rec: any, index: number) => ({
        id: rec.id || `rec-${index}`,
        title: rec.title || 'Improve Preparedness',
        description: rec.description || 'Take action to improve your emergency readiness',
        priority: rec.priority || 'medium',
        category: rec.category || 'General',
        estimatedImpact: rec.estimatedImpact || 'Better preparedness',
        actionItems: Array.isArray(rec.actionItems) ? rec.actionItems : ['Review your emergency supplies']
      }));
    } catch (error) {
      // Error parsing recommendations response
      return this.getFallbackRecommendations({} as RecommendationContext);
    }
  }

  private getFallbackRecommendations(context: RecommendationContext): Recommendation[] {
    const fallbacks: Recommendation[] = [
      {
        id: 'water-supply',
        title: 'Build Water Supply',
        description: 'Store at least 1 gallon of water per person per day for 3 days minimum',
        priority: 'high',
        category: 'Water & Food',
        estimatedImpact: 'Essential for survival during emergencies',
        actionItems: [
          'Store 3+ gallons of water per household member',
          'Rotate water every 6 months',
          'Consider water purification tablets as backup'
        ]
      },
      {
        id: 'emergency-kit',
        title: 'Create Emergency Kit',
        description: 'Assemble a basic emergency supply kit with essential items',
        priority: 'high',
        category: 'Tools',
        estimatedImpact: 'Immediate access to critical supplies',
        actionItems: [
          'Gather first aid supplies',
          'Include flashlights and batteries',
          'Add non-perishable food items',
          'Include important documents'
        ]
      },
      {
        id: 'communication-plan',
        title: 'Establish Communication Plan',
        description: 'Create a family communication plan for emergencies',
        priority: 'medium',
        category: 'Communication',
        estimatedImpact: 'Stay connected during disasters',
        actionItems: [
          'Choose an out-of-area contact person',
          'Share contact information with family',
          'Practice your communication plan',
          'Consider emergency communication devices'
        ]
      }
    ];

    // Customize based on context if available
    if (context.household?.memberCount > 0) {
      fallbacks[0].actionItems[0] = `Store ${context.household.memberCount * 3}+ gallons of water`;
    }

    if (context.household?.petCount > 0) {
      fallbacks.push({
        id: 'pet-preparedness',
        title: 'Prepare for Pets',
        description: 'Ensure your pets are included in emergency planning',
        priority: 'medium',
        category: 'Pets',
        estimatedImpact: 'Keep pets safe during emergencies',
        actionItems: [
          'Store pet food and water',
          'Prepare pet carriers or leashes',
          'Include pet medications in emergency kit',
          'Identify pet-friendly shelters'
        ]
      });
    }

    return fallbacks;
  }
}

export const recommendationEngine = new RecommendationEngine();
