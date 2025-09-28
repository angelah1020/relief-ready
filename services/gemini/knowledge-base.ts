import { GoogleGenerativeAI } from '@google/generative-ai';

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
    email: string;
  };
  currentScreen?: string;
}

export class ReliefReadyKnowledgeBase {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');
  }

  private getAppKnowledge(): string {
    return `
# Relief Ready - Emergency Preparedness App

## App Overview
Relief Ready is a comprehensive emergency preparedness mobile application built with React Native, Expo, and TypeScript. The app helps households prepare for natural disasters and emergencies through AI-powered recommendations, inventory management, and real-time disaster monitoring.

## Main Screens & Features

### 1. Dashboard/Home Page
- **Disaster Donuts**: Visual readiness indicators for different hazard types (Hurricane, Wildfire, Flood, Earthquake, Tornado, Heat Wave)
- **Next Best Actions**: AI-generated recommendations to improve preparedness
- **Seasonal/Alert Card**: Contextual alerts and seasonal preparedness reminders
- **Household Overview**: Current household information and member count

### 2. Inventory Management
- **AI-Powered Categorization**: Automatically categorizes items into predefined categories
- **Categories**: Water & Food, Medical & First Aid, Lighting & Power, Communication & Navigation, Shelter & Warmth, Sanitation & Hygiene, Tools & Safety, Important Documents & Money, Pets
- **Quantity Tracking**: Track what you have vs. what you need
- **Smart Recommendations**: AI suggests items based on household composition and risk profile

### 3. Live Map/Disaster Monitoring
- **Real-time Alerts**: National Weather Service alerts with severity levels
- **Hazard Overlays**: Wildfires, earthquakes, flood gauges, emergency resources
- **Interactive Map**: Zoom, pan, and tap for detailed information
- **Location-based**: Centered on household location with nearby resource markers

### 4. ReadyBot - AI Chatbot
- **Navigation Help**: Guides users through app features and screens
- **Disaster Preparedness**: Answers questions about emergency preparedness
- **Contextual Responses**: Understands current household and screen context
- **Flexible Conversations**: Natural, helpful responses with personality

### 5. Household Management
- **Member Profiles**: Add family members with age bands, medical notes, contact info
- **Pet Management**: Track pets with special needs and requirements
- **Location Setup**: ZIP code and country for location-based recommendations
- **Risk Profile**: Toggle hazards based on geographic risk
- **Emergency Contacts**: Rally points and out-of-area contacts

### 6. Profile/Account
- **User Settings**: Display name, profile photo, account management
- **Household Switching**: Manage multiple households
- **PDF Export**: Generate comprehensive preparedness reports
- **Data Management**: Export household, inventory, and checklist data

## Technical Architecture

### Frontend
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and build tools
- **TypeScript**: Type-safe development
- **Expo Router**: File-based navigation
- **Lucide Icons**: Consistent iconography
- **Custom Theme**: Blue color scheme (#354eab primary, #a8bafe secondary)

### Backend & Data
- **Supabase**: PostgreSQL database with real-time capabilities
- **Authentication**: Email/password with account management
- **Real-time Sync**: Live updates across devices
- **File Storage**: Profile photos and document storage

### AI Integration
- **Google Gemini**: AI-powered categorization and chatbot
- **Smart Categorization**: Inventory items automatically sorted
- **Contextual Chat**: Understanding of app state and household data
- **Recommendations**: Personalized preparedness suggestions

### External APIs
- **National Weather Service**: Real-time weather alerts and warnings
- **USGS**: Earthquake and flood data
- **NASA FIRMS**: Wildfire hotspot data
- **Geocoding**: Address to coordinates conversion

## Database Schema

### Core Tables
- **accounts**: User account information
- **households**: Household data with location and settings
- **members**: Family members with age bands and medical notes
- **pets**: Pet information and special needs
- **memberships**: Links accounts to households with roles
- **inventory_items**: Supplies with AI categorization
- **checklist_items**: Disaster-specific preparedness items
- **chat_messages**: AI chatbot conversation history

### Key Features
- **AI Confidence**: Track AI categorization accuracy
- **Canonical Keys**: Standardized item identifiers
- **Real-time Updates**: Live data synchronization
- **Offline Support**: Core functionality works without internet

## User Flows

### Onboarding
1. Create account or sign in
2. Create or join household
3. Add household members and pets
4. Set location (ZIP code)
5. Configure risk profile
6. Start adding inventory items

### Daily Usage
1. Check dashboard for readiness status
2. Review next best actions
3. Add/update inventory items
4. Check live map for current threats
5. Chat with ReadyBot for guidance

### Emergency Situations
1. View real-time alerts on map
2. Access emergency checklists
3. Review household emergency plan
4. Check inventory for needed supplies
5. Contact emergency contacts

## AI Capabilities

### Inventory Categorization
- Automatically sorts items into appropriate categories
- Provides confidence scores for categorization
- Handles ambiguous items with fallback logic
- Learns from user corrections

### Chatbot Intelligence
- Understands app navigation and features
- Provides disaster preparedness guidance
- Maintains conversation context
- Offers personalized recommendations

### Smart Recommendations
- Analyzes household composition and risk profile
- Suggests specific items to improve readiness
- Prioritizes actions based on current gaps
- Considers seasonal and geographic factors

## Emergency Preparedness Focus

### Disaster Types Covered
- **Hurricanes/Storms**: Water, food, evacuation planning
- **Wildfires**: Air quality, evacuation routes, go-bags
- **Floods**: Waterproofing, elevation, flood insurance
- **Earthquakes**: Drop-cover-hold, structural safety
- **Tornadoes**: Safe rooms, weather monitoring
- **Heat Waves**: Cooling, hydration, vulnerable populations

### Preparedness Principles
- **3-Day Minimum**: Basic supplies for 72 hours
- **Household-Specific**: Tailored to family size and needs
- **Accessibility**: Considers medical needs and disabilities
- **Pet-Inclusive**: Special considerations for animals
- **Document Security**: Important papers and digital backups

## App Philosophy
Relief Ready makes emergency preparedness accessible, personalized, and actionable. By combining AI intelligence with real-time data and user-friendly design, the app empowers families to be truly prepared for whatever comes their way.

The app emphasizes preparation over panic, providing clear guidance and practical tools to build confidence and readiness in emergency situations.
`;
  }

  async generateResponse(userMessage: string, context: AppContext): Promise<string> {
    try {
      const prompt = this.buildContextualPrompt(userMessage, context);
      
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text() || '';
      
      return text;
    } catch (error) {
      // Error generating AI response
      return this.getFallbackResponse(userMessage);
    }
  }

  private buildContextualPrompt(userMessage: string, context: AppContext): string {
    const appKnowledge = this.getAppKnowledge();
    const contextString = this.buildContextString(context);
    
    return `You are ReadyBot, the AI assistant for Relief Ready, an emergency preparedness mobile app. You help users navigate the app and answer disaster preparedness questions.

${appKnowledge}

Current Context:
${contextString}

User Message: "${userMessage}"

Instructions:
- Be helpful, friendly, and encouraging
- Use the app knowledge as inspiration for comprehensive, accurate responses
- Draw from your broad knowledge of emergency preparedness when relevant
- Keep responses conversational and engaging
- Use emojis appropriately to add personality
- If asked about app features, reference the specific screens and functionality
- For disaster preparedness questions, provide practical, actionable advice
- Stay focused on emergency preparedness and app navigation topics
- Be flexible and natural in your responses - you're a CHAT bot, not a rigid FAQ system

Respond naturally and helpfully:`;
  }

  private buildContextString(context: AppContext): string {
    let contextStr = '';
    
    if (context.household) {
      contextStr += `Household: ${context.household.name} (${context.household.country}, ${context.household.postalCode})\n`;
      contextStr += `Members: ${context.household.memberCount}, Pets: ${context.household.petCount}\n`;
      if (context.household.riskProfile.length > 0) {
        contextStr += `Risk Profile: ${context.household.riskProfile.join(', ')}\n`;
      }
    }
    
    if (context.user) {
      contextStr += `User: ${context.user.displayName} (${context.user.email})\n`;
    }
    
    if (context.currentScreen) {
      contextStr += `Current Screen: ${context.currentScreen}\n`;
    }
    
    return contextStr || 'No specific context available';
  }

  getFallbackResponse(userMessage: string): string {
    const fallbacks = [
      "I'm having trouble connecting right now, but I'm here to help with emergency preparedness! What would you like to know about staying safe during disasters? 🚨",
      "Oops! I'm experiencing some technical difficulties. While I get that sorted, feel free to ask me about disaster preparedness or how to navigate the Relief Ready app! 💪",
      "I'm having a small hiccup with my systems, but I'm still ready to help! What questions do you have about emergency preparedness? 🌟",
      "Something's not quite right on my end, but I'm here for you! Ask me anything about disaster readiness or using the app! 🛡️",
      "I'm having trouble processing that right now, but I'm ready to help! What would you like to know about emergency preparedness? ⚡"
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

export const reliefReadyAI = new ReliefReadyKnowledgeBase();
