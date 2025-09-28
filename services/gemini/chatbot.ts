import { GoogleGenAI } from "@google/genai";

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
    // Embedded knowledge base for React Native compatibility
    this.knowledgeBase = `# Relief Ready Application: Knowledge Base

## About Relief Ready

Relief Ready is a mobile application designed to help households prepare for natural disasters. Our mission is to provide a simple, intuitive, and personalized way for you to create, track, and manage your emergency preparedness plans and supplies. The app gives you a clear picture of your readiness level, provides actionable steps to improve it, and offers real-time alerts and information when a disaster strikes.

The app is built around five core features:

- **Dashboard**: Your at-a-glance home screen for readiness levels
- **Inventory**: Where you track all your emergency supplies
- **Live Map**: A real-time view of active hazards and resources near you
- **Household**: The hub for managing your family, pets, and home details
- **Chatbot**: Your helpful assistant for navigating the app and answering questions

## Account and Household Management

### Account vs. Household vs. Member

**Account**: This is your personal login. It's identified by your email or SSO ID (like Google) and includes your display name and profile photo. An Account is lightweight and not tied to any single household, allowing you to be part of multiple households if needed.

**Household**: This represents your home unit. It's defined by a location (country and postal code), a name, and information about pets. A household contains multiple members. All checklist and supply calculations are based on the household's details.

**Member**: This is each person or pet within a household. A member record includes a name, an age band (e.g., child, adult, senior), and optional medical notes for tailoring kits. A member might have a linked Account to log in, or they can be a dependent (like a child or pet) without a login.

### Getting Started: Onboarding

**Sign In/Create Account**: You can create an account using Google SSO or a passwordless email link.

**Choose Your Path**: After signing in, you'll see two big buttons: "Create a Household" or "Join a Household".

**Creating a Household**:
- You'll be prompted to set up your household by providing a country and postal code (which are required) and an optional household name
- You will automatically be added as the first member
- You can then add other members (dependents) and pets
- You can invite housemates to join using a secure, one-time invite link sent via email

**Joining a Household**:
- You must have an invite link
- When you tap the link, the app will open. If you're not signed in, you'll do that first
- The app validates the invite token and automatically links your account to the correct member profile within that household

## Dashboard

The Dashboard is your main screen, giving you a quick overview of your preparedness. It consists of three main components, arranged from top to bottom.

### Hazard Donuts

This is a 2x3 grid of "donuts," where each donut represents your overall readiness percentage for a specific type of disaster. Tapping a donut takes you to the detailed Hazard Checklist for that disaster.

The app tracks the following hazards:
- Hurricane/Storm
- Wildfire/Smoke
- Flood
- Earthquake
- Tornado
- Heat Wave

### Hazard Checklist

This is a full-screen detailed view showing the supplies you have versus what you need for a specific disaster.

**Generation**: The checklist items are based on FEMA's "Are You Ready?" guide. When you create your household, the Gemini API generates a personalized checklist based on your household's size, location, and pets, and stores it. The quantities needed for each item are automatically re-calculated if you add a new member or pet.

**Display**: Each item shows your progress in a "Have / Need" format (e.g., Water: 20/30 L) and has a status bubble:
- **Full**: You have everything you need
- **Partial**: You have some, but not all, of what's needed
- **None**: You have zero of that item

**Categories**: Items are organized into logical categories like Food, Water, Medical & First Aid, Tools & Safety, and Important Documents.

### Next Best Actions

These are 2-3 smart suggestion "chips" that highlight the easiest way to make the biggest improvement to your readiness scores. For example, a chip might say, "Add a first-aid kit (+6%)". Tapping it takes you directly to the inventory page to add that item.

### Seasonal/Alert Card

This is a dynamic card with contextual information.

- If there's an active alert (e.g., a hurricane watch) for your area, this card moves to the very top of the dashboard. It will show the event name, area affected, and when it ends
- If there are no active alerts, it will show a seasonal nudge, like "Hurricane season starts in 10 days—a great time to top up your water"

The card has two actions: "See on Map" (which opens the Live Map centered on the alert) and "Open Checklist".

## Inventory

The Inventory page is a single place where you can add, update, and delete all your emergency supplies for your household.

### How It Works

**User Input**: You add items by entering a quantity, a unit (from a dropdown menu), and a free-text description (e.g., "24 bottles of water").

**AI Categorization**: The app's AI then intelligently analyzes your input. It normalizes the data (e.g., converts "24 bottles of water" into a standard unit like Liters) and assigns it to the correct category.

**Display**: Your supplies are neatly organized into categories on the page, such as Water & Food, Medical & First Aid, Lighting & Power, etc.

### Managing Items

- **Adding**: Use the simple input fields for quantity, unit, and description
- **Updating/Deleting**: Simply tap on any item in your list. A popup will appear allowing you to edit the quantity and description, or delete the item entirely

### Inventory Categories

The app automatically categorizes your supplies into these main categories:

- **Water & Food**: Water, non-perishable food, meals, and nutrition supplies
- **Medical & First Aid**: First aid kits, medications, medical supplies, and health items
- **Lighting & Power**: Flashlights, batteries, portable power, and electrical supplies
- **Communication & Navigation**: Radios, signal devices, maps, and communication tools
- **Shelter & Warmth**: Blankets, sleeping bags, tents, candles, and comfort items
- **Sanitation & Hygiene**: Sanitizer, wipes, trash bags, toilet supplies, and cleanliness items
- **Tools & Safety**: Utility knives, duct tape, rope, fire extinguishers, masks, and safety equipment
- **Important Documents & Money**: IDs, cash, insurance, important papers, and financial items
- **Pets**: Pet food, water, carriers, leashes, and animal supplies
- **Other**: Items that don't fit into other categories

## Live Map

The Live Map provides real-time situational awareness of natural hazards and important resources around your household's location.

### Key Features

**Default View**: The map automatically centers on your household's location.

**Data Layers**: You can toggle various data overlays on and off. These layers are pulled from authoritative sources:
- **Alerts**: Storms, tornadoes, etc., from the National Weather Service (NWS)
- **Wildfires**: Hotspot data from NASA FIRMS
- **Earthquakes**: Recent quake data from USGS
- **Floods**: River gauge data from USGS
- **Resources**: Locations of shelters, clinics, and pharmacies from FEMA and other sources

**Severity & Legend**: Hazards are color-coded for severity (e.g., Yellow for Advisory, Red for Warning). A floating legend explains what the colors and icons mean.

**Interactions**: Tapping on any hazard or resource on the map brings up a detail sheet with more information and relevant actions, like "Open Checklist" for a hazard or "Navigate" for a shelter.

**Data Freshness**: The map data refreshes automatically at set intervals (e.g., alerts every 3-5 minutes) to keep you up-to-date.

## Chatbot

The Chatbot, powered by the Google Gemini API, is your friendly in-app assistant. You can ask it two main types of questions:

**App Navigation & "How-To" Questions**:
- "How do I add my dog to my household?"
- "Where can I see the checklist for a wildfire?"
- "How do I invite my partner to our household?"

The chatbot can provide clear, step-by-step instructions for using any feature in the app.

**General Disaster Preparedness Questions**:
- "What should I put in a 'go-bag'?"
- "How do you perform 'Drop, Cover, and Hold On'?"
- "What's the difference between a hurricane watch and a warning?"

The chatbot is equipped with general knowledge to help you stay safe and informed.

## Household Tab

This section is where you manage all the details about your home, the people and pets who live there, and your overall emergency plan.

### Members & Pets
View a list of all members and pets in your household. From here, you can add, edit, or remove members and pets. For each member, you can see their name, age band, an icon indicating if they have a linked account, and any short medical notes.

### Location
Manage your household's address. **Important**: Editing your address or postal code will trigger a recalculation of your checklist needs to ensure they are accurate for your new location.

### Risk Profile
The app automatically suggests hazards you should prepare for based on your location. In this section, you can manually toggle these hazards on or off to customize which donuts appear on your dashboard.

### Emergency Plan
Set and edit key parts of your family's plan, including a safe Rally Point and your In-Case-of-Emergency (ICE) contacts.

### Invites & Roles
Manage pending invitations you've sent to others to join your household. You can see who has been invited and resend or revoke invites.

## General Disaster Preparedness Information

### Hurricane/Storm
**What It Is**: A large, rotating storm with high-speed winds that forms over warm waters. It can cause storm surge, heavy rain, flooding, and tornadoes.

**Key Risks**: High winds, flooding from storm surge and rain, power outages, and infrastructure damage.

**Core Actions**: Have a "go-bag" ready. Know your evacuation zone and route. Secure your home by boarding up windows and bringing outdoor furniture inside. Have enough non-perishable food, water, and medication for several days.

### Wildfire/Smoke
**What It Is**: An uncontrolled fire that burns in a wildland area. Smoke from wildfires can travel hundreds of miles, causing poor air quality.

**Key Risks**: Direct danger from flames, property destruction, and respiratory issues from smoke inhalation.

**Core Actions**: Create a "defensible space" by clearing flammable vegetation around your home. Have an evacuation plan with multiple routes. Use an indoor air purifier with a HEPA filter. Have N95 masks ready for everyone in your household.

### Flood
**What It Is**: An overflow of water that submerges land that is usually dry. Floods can be caused by heavy rainfall, storm surge, or overflowing rivers.

**Key Risks**: Drowning, water contamination, property damage, and power outages.

**Core Actions**: Know your home's flood risk. Keep important documents in a waterproof container. Have sandbags and other waterproofing materials ready. Never walk or drive through floodwaters.

### Earthquake
**What It Is**: A sudden and violent shaking of the ground as a result of movements within the earth's crust.

**Key Risks**: Building collapse, falling objects, fires from broken gas lines, and tsunamis in coastal areas.

**Core Actions**: Practice "Drop, Cover, and Hold On!" Secure heavy furniture and appliances to walls. Keep sturdy shoes and a flashlight by your bed. Know how to shut off your gas and water mains.

### Tornado
**What It Is**: A violently rotating column of air extending from a thunderstorm to the ground.

**Key Risks**: Extremely high winds that can destroy buildings, uproot trees, and turn debris into deadly projectiles.

**Core Actions**: Identify the safest place in your home (a basement, storm cellar, or an interior room on the lowest floor with no windows). Have a weather radio for alerts. Create a family plan for where to meet after the danger has passed.

### Heat Wave
**What It Is**: A prolonged period of excessively hot weather.

**Key Risks**: Dehydration, heat exhaustion, and life-threatening heatstroke. Power grids can also be strained, leading to outages.

**Core Actions**: Stay hydrated by drinking plenty of water. Stay indoors in air-conditioned spaces as much as possible. Know the locations of public cooling centers. Never leave children or pets in a parked car. Check on elderly or vulnerable neighbors.`;
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
    } catch (error) {
      return this.getFallbackResponse(userMessage, context);
    }
  }

  private buildContextualPrompt(userMessage: string, context: AppContext): string {
    const contextInfo = this.buildContextString(context);
    
    return `You are ReadyBot, a friendly and helpful AI chatbot for the Relief Ready emergency preparedness app. You're having a natural conversation with a user.

KNOWLEDGE BASE (Your Reference):
${this.knowledgeBase}

CURRENT CONTEXT:
${contextInfo}

USER MESSAGE: "${userMessage}"

CONVERSATION GUIDELINES:
- This is a CONTINUING CONVERSATION - don't reintroduce yourself unless it's the very first message
- Respond naturally and directly to what the user just said
- Be conversational, warm, and encouraging like a knowledgeable friend
- Use natural, casual language with emojis and personality
- Ask follow-up questions to better understand their needs
- Be empathetic - emergency prep can feel overwhelming, so be supportive
- Give practical, actionable advice when helpful
- If you don't know something specific, admit it and offer to help find the answer
- Keep responses conversational and not too long unless they ask for detailed info
- If they're asking about something outside emergency prep, gently steer back but don't be pushy

TOPICS YOU CAN DISCUSS:
- Relief Ready app features and navigation
- Emergency preparedness and disaster safety
- Family safety planning
- Supply recommendations
- Weather and disaster awareness
- General safety tips
- App troubleshooting

Remember: You're ReadyBot - be genuinely helpful, conversational, and make emergency preparedness feel less scary and more manageable!`;

  }

  private buildContextString(context: AppContext): string {
    let contextStr = '';
    
    if (context.household) {
      contextStr += `Household: ${context.household.name} (${context.household.country} ${context.household.postalCode})\n`;
      contextStr += `Members: ${context.household.memberCount}, Pets: ${context.household.petCount}\n`;
      if (context.household.riskProfile && Array.isArray(context.household.riskProfile)) {
        contextStr += `Risk Profile: ${context.household.riskProfile.join(', ')}\n`;
      }
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
    // Simple fallback responses that encourage the user to try again
    const responses = [
      "I'm having trouble connecting right now, but I'd love to help! Can you try asking me again?",
      "Hmm, I'm not quite sure how to respond to that. Could you rephrase your question?",
      "I want to give you a good answer, but I'm having some technical difficulties. Mind trying again?",
      "That's an interesting question! I'm having some connectivity issues right now though. Could you ask me again?",
      "I'd love to help with that! Unfortunately I'm having some trouble at the moment. Can you try rephrasing your question?"
    ];
    
    // Return a random fallback response
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

export const emergencyChatbot = new EmergencyChatbot();
