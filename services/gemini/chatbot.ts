import { GoogleGenAI } from "@google/genai";
import { readFileSync } from 'fs';
import { join } from 'path';

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY
});

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface AppContext {
  household?: {
    name: string;
    country: string;
    postalCode: string;
    memberCount: number;
    petCount: number;
    riskProfile: string[];
  };
  user?: {
    displayName: string;
    role: string;
  };
  currentScreen?: string;
  inventoryItems?: Array<{
    description: string;
    category: string;
  }>;
}

export class EmergencyChatbot {
  private knowledgeBase: string;

  constructor() {
    // Load the knowledge base from the markdown file
    try {
      this.knowledgeBase = readFileSync(join(process.cwd(), 'knowledge_base.md'), 'utf-8');
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      this.knowledgeBase = 'Knowledge base not available.';
    }
  }

  async generateResponse(userMessage: string, context: AppContext = {}): Promise<string> {
    try {
      if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
        return this.getFallbackResponse(userMessage, context);
      }

      const prompt = this.buildContextualPrompt(userMessage, context);
      
      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
      
      return result.text || '';
    } catch (error: any) {
      console.error('Error generating AI response:', error);
      return this.getFallbackResponse(userMessage, context);
    }
  }

  private buildContextualPrompt(userMessage: string, context: AppContext): string {
    const contextInfo = this.buildContextString(context);
    
    return `You are ReadyBot, an intelligent AI assistant for the ReliefReady emergency preparedness app. You have access to comprehensive knowledge about the app and disaster preparedness.

KNOWLEDGE BASE (Your Source of Truth):
${this.knowledgeBase}

CURRENT CONTEXT:
${contextInfo}

USER MESSAGE: "${userMessage}"

INSTRUCTIONS:
- Be conversational, helpful, and engaging like a knowledgeable friend
- Use the knowledge base as your primary source for ReliefReady app questions
- For general disaster preparedness questions, draw from your broad knowledge while staying relevant
- Be flexible and natural in your responses - don't be rigid or overly formal
- Use emojis occasionally to make responses more engaging
- If asked about app navigation, provide clear, step-by-step instructions
- For disaster preparedness questions, provide practical, actionable advice
- Stay focused on emergency preparedness and app-related topics
- If asked about irrelevant topics, politely redirect to emergency preparedness or app features
- Always be encouraging and supportive about emergency preparedness

Remember: You're ReadyBot, the friendly AI assistant for ReliefReady. Help users navigate the app and stay prepared for emergencies!`;

  }

  private buildContextString(context: AppContext): string {
    let contextStr = '';
    
    if (context.household) {
      contextStr += `Household: ${context.household.name} (${context.household.country} ${context.household.postalCode})\n`;
      contextStr += `Members: ${context.household.memberCount}, Pets: ${context.household.petCount}\n`;
      contextStr += `Risk Profile: ${context.household.riskProfile.join(', ')}\n`;
    }
    
    if (context.user) {
      contextStr += `User: ${context.user.displayName} (${context.user.role})\n`;
    }
    
    if (context.currentScreen) {
      contextStr += `Current Screen: ${context.currentScreen}\n`;
    }
    
    if (context.inventoryItems && context.inventoryItems.length > 0) {
      contextStr += `Recent Inventory: ${context.inventoryItems.slice(0, 3).map(item => `${item.description} (${item.category})`).join(', ')}\n`;
    }
    
    return contextStr || 'No specific context available.';
  }

  private getFallbackResponse(userMessage: string, context: AppContext): string {
    const input = userMessage.toLowerCase();
    
    // App navigation responses
    if (input.includes('navigate') || input.includes('screen') || input.includes('tab')) {
      return 'Sure! The ReliefReady app has 5 main screens accessible via bottom tabs: 📊 Dashboard (your disaster readiness overview), 📦 Inventory (manage supplies with AI), 💬 ReadyBot (that\'s me!), 🗺️ Map (live disaster feed), and 👤 Profile (household settings). Each screen is designed to work together for comprehensive emergency preparedness!';
    }
    
    if (input.includes('dashboard')) {
      return 'The Dashboard is your command center! It features colorful readiness donuts for different disaster types, "Next Best Actions" that adapt to your situation, and seasonal alerts. The donuts show your preparedness percentage - tap any to dive into detailed, personalized checklists! 🍩';
    }
    
    if (input.includes('inventory')) {
      return 'The Inventory screen is pretty smart! You can add any emergency supply and our AI automatically categorizes it and normalizes quantities. Just type something like "24 bottles of water" and it\'ll figure out the right category. There\'s also a sparkles ✨ button for manual AI assistance!';
    }
    
    if (input.includes('map')) {
      return 'The Map provides real-time disaster intelligence! You can toggle layers for wildfires, earthquakes, flood gauges, emergency shelters, and more. It\'s like having a live feed of what\'s happening around you, with the ability to get directions to resources and view detailed hazard information! 🗺️';
    }
    
    if (input.includes('profile') || input.includes('household')) {
      return 'Profile is where you build your household foundation! Add family members with age groups and medical notes, manage pets, set your location and risk profile, and organize emergency contacts. This personalization makes everything else in the app tailored to your specific situation! 👨‍👩‍👧‍👦';
    }
    
    // Disaster preparedness responses
    if (input.includes('hurricane') || input.includes('storm')) {
      return 'Hurricanes are powerful and unpredictable! 💨 Beyond basic supplies, consider your home\'s structural vulnerabilities, evacuation timing, and post-storm recovery needs. The ReliefReady app helps track your hurricane readiness with personalized checklists based on your location and household size. Remember, preparation is about more than supplies - it\'s about having a plan!';
    }
    
    if (input.includes('earthquake')) {
      return 'Earthquakes strike without warning! 🏠 Beyond "Drop, Cover, and Hold On," consider structural retrofitting, securing heavy items, and having supplies in multiple locations. The psychological impact is real too - practice drills help reduce panic. The app\'s earthquake donut tracks your readiness and provides location-specific advice!';
    }
    
    if (input.includes('fire') || input.includes('wildfire')) {
      return 'Wildfires are increasingly common and dangerous! 🔥 Create defensible space, have an evacuation plan ready, and keep important documents safe. Air quality can be a major concern even miles away. The ReliefReady app helps you prepare for wildfire season with location-specific guidance and real-time fire monitoring!';
    }
    
    if (input.includes('flood')) {
      return 'Flooding can happen anywhere, not just near water! 🌊 Know your risk, have sandbags ready, and never underestimate moving water. The ReliefReady app provides flood monitoring and helps you prepare with location-specific checklists. Remember: Turn around, don\'t drown!';
    }
    
    if (input.includes('tornado')) {
      return 'Tornadoes can form quickly and cause devastating damage! 🌪️ Identify your safest room (basement or interior room), practice tornado drills, and keep a weather radio handy. The ReliefReady app helps you prepare with tornado-specific checklists and real-time weather monitoring!';
    }
    
    if (input.includes('heat') || input.includes('temperature')) {
      return 'Heat waves are becoming more frequent and dangerous! ☀️ Stay hydrated, avoid strenuous activities during peak heat, and check on vulnerable neighbors. The ReliefReady app helps you prepare for extreme heat with cooling strategies and heat safety checklists!';
    }
    
    if (input.includes('checklist') || input.includes('supplies') || input.includes('kit')) {
      return 'A good emergency kit is your foundation! 🎒 Start with the basics: water (1 gallon per person per day), non-perishable food, first aid supplies, flashlight, radio, and important documents. The ReliefReady app personalizes your checklist based on your household size, location, and specific risks!';
    }
    
    if (input.includes('plan') || input.includes('planning')) {
      return 'Emergency planning is crucial for peace of mind! 📋 Create a family communication plan, identify meeting places, and practice your plan regularly. The ReliefReady app helps you build a comprehensive emergency plan tailored to your household\'s specific needs and risks!';
    }
    
    if (input.includes('help') || input.includes('what can you do') || input.includes('assist')) {
      return 'I\'m here to help with all things emergency preparedness! 🚨 I can guide you through the ReliefReady app, answer disaster preparedness questions, help with emergency planning, and provide location-specific advice. What would you like to know more about?';
    }
    
    // Default encouraging response
    return 'I\'m here to help with emergency preparedness! 🛡️ Whether you need guidance on the ReliefReady app, disaster preparedness advice, or emergency planning tips, I\'m ready to assist. What specific aspect of emergency preparedness would you like to explore?';
  }
}

export const emergencyChatbot = new EmergencyChatbot();
