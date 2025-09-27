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
    this.knowledgeBase = `# Relief Ready Application: AI Knowledge Base

## 🚀 About Relief Ready

Relief Ready is a mobile application designed to help households prepare for natural disasters. Our mission is to provide a simple, intuitive, and personalized way for you to create, track, and manage your emergency preparedness plans and supplies. The app gives you a clear picture of your readiness level, provides actionable steps to improve it, and offers real-time alerts and information when a disaster strikes.

The app is built around five core features:

- **Dashboard**: Your at-a-glance home screen for readiness levels
- **Inventory**: Where you track all your emergency supplies
- **Live Map**: A real-time view of active hazards and resources near you
- **Household**: The hub for managing your family, pets, and home details
- **AI Chatbot**: Your helpful assistant for navigating the app and answering questions

## 🔑 Account and Household Management

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

## 📊 Dashboard

The Dashboard is your main screen, giving you a quick overview of your preparedness. It consists of three main components, arranged from top to bottom.

### Hazard Donuts 🍩

This is a 2x3 grid of "donuts," where each donut represents your overall readiness percentage for a specific type of disaster. Tapping a donut takes you to the detailed Hazard Checklist for that disaster.

The app tracks the following hazards:
- Hurricane/Storm
- Wildfire/Smoke
- Flood
- Earthquake
- Tornado
- Heat Wave

### Hazard Checklist ✅

This is a full-screen detailed view showing the supplies you have versus what you need for a specific disaster.

**Generation**: The checklist items are based on FEMA's "Are You Ready?" guide. When you create your household, the Gemini API generates a personalized checklist based on your household's size, location, and pets, and stores it. The quantities needed for each item are automatically re-calculated if you add a new member or pet.

**Display**: Each item shows your progress in a "Have / Need" format (e.g., Water: 20/30 L) and has a status bubble:
- **Full**: You have everything you need
- **Partial**: You have some, but not all, of what's needed
- **None**: You have zero of that item

**Categories**: Items are organized into logical categories like Food, Water, Medical & First Aid, Tools & Safety, and Important Documents.

### Next Best Actions 👍

These are 2-3 smart suggestion "chips" that highlight the easiest way to make the biggest improvement to your readiness scores. For example, a chip might say, "Add a first-aid kit (+6%)". Tapping it takes you directly to the inventory page to add that item.

### Seasonal/Alert Card ⚠️

This is a dynamic card with contextual information.

- If there's an active alert (e.g., a hurricane watch) for your area, this card moves to the very top of the dashboard. It will show the event name, area affected, and when it ends
- If there are no active alerts, it will show a seasonal nudge, like "Hurricane season starts in 10 days—a great time to top up your water"

The card has two actions: "See on Map" (which opens the Live Map centered on the alert) and "Open Checklist".

## 📦 Inventory

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

## 🗺️ Live Map

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

## 🤖 AI Chatbot

The AI Chatbot, powered by the Google Gemini API, is your friendly in-app assistant. You can ask it two main types of questions:

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

## 🏡 Household Tab

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

## 🔥 General Disaster Preparedness Information

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
    } catch (error: any) {
      console.error('Error generating AI response:', error);
      return this.getFallbackResponse(userMessage, context);
    }
  }

  private buildContextualPrompt(userMessage: string, context: AppContext): string {
    const contextInfo = this.buildContextString(context);
    
    return `You are ReadyBot, an intelligent AI assistant for the Relief Ready emergency preparedness app. You have access to comprehensive knowledge about the app and disaster preparedness.

KNOWLEDGE BASE (Your Source of Truth):
${this.knowledgeBase}

CURRENT CONTEXT:
${contextInfo}

USER MESSAGE: "${userMessage}"

INSTRUCTIONS:
- Be conversational, helpful, and engaging like a knowledgeable friend
- Use the knowledge base as your primary source for Relief Ready app questions
- For general disaster preparedness questions, draw from your broad knowledge while staying relevant
- Be flexible and natural in your responses - don't be rigid or overly formal
- Use emojis occasionally to make responses more engaging
- If asked about app navigation, provide clear, step-by-step instructions
- For disaster preparedness questions, provide practical, actionable advice
- Stay focused on emergency preparedness and app-related topics
- If asked about irrelevant topics, politely redirect to emergency preparedness or app features
- Always be encouraging and supportive about emergency preparedness

Remember: You're ReadyBot, the friendly AI assistant for Relief Ready. Help users navigate the app and stay prepared for emergencies!`;

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
      return 'Sure! The Relief Ready app has 5 main screens accessible via bottom tabs: 📊 Dashboard (your disaster readiness overview), 📦 Inventory (manage supplies with AI), 💬 ReadyBot (that\'s me!), 🗺️ Map (live disaster feed), and 👤 Profile (household settings). Each screen is designed to work together for comprehensive emergency preparedness!';
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
      return 'Hurricanes are powerful and unpredictable! 💨 Beyond basic supplies, consider your home\'s structural vulnerabilities, evacuation timing, and post-storm recovery needs. The Relief Ready app helps track your hurricane readiness with personalized checklists based on your location and household size. Remember, preparation is about more than supplies - it\'s about having a plan!';
    }
    
    if (input.includes('earthquake')) {
      return 'Earthquakes strike without warning! 🏠 Beyond "Drop, Cover, and Hold On," consider structural retrofitting, securing heavy items, and having supplies in multiple locations. The psychological impact is real too - practice drills help reduce panic. The app\'s earthquake donut tracks your readiness and provides location-specific advice!';
    }
    
    if (input.includes('fire') || input.includes('wildfire')) {
      return 'Wildfires are increasingly common and dangerous! 🔥 Create defensible space, have an evacuation plan ready, and keep important documents safe. Air quality can be a major concern even miles away. The Relief Ready app helps you prepare for wildfire season with location-specific guidance and real-time fire monitoring!';
    }
    
    if (input.includes('flood')) {
      return 'Flooding can happen anywhere, not just near water! 🌊 Know your risk, have sandbags ready, and never underestimate moving water. The Relief Ready app provides flood monitoring and helps you prepare with location-specific checklists. Remember: Turn around, don\'t drown!';
    }
    
    if (input.includes('tornado')) {
      return 'Tornadoes can form quickly and cause devastating damage! 🌪️ Identify your safest room (basement or interior room), practice tornado drills, and keep a weather radio handy. The Relief Ready app helps you prepare with tornado-specific checklists and real-time weather monitoring!';
    }
    
    if (input.includes('heat') || input.includes('temperature')) {
      return 'Heat waves are becoming more frequent and dangerous! ☀️ Stay hydrated, avoid strenuous activities during peak heat, and check on vulnerable neighbors. The Relief Ready app helps you prepare for extreme heat with cooling strategies and heat safety checklists!';
    }
    
    if (input.includes('checklist') || input.includes('supplies') || input.includes('kit')) {
      return 'A good emergency kit is your foundation! 🎒 Start with the basics: water (1 gallon per person per day), non-perishable food, first aid supplies, flashlight, radio, and important documents. The Relief Ready app personalizes your checklist based on your household size, location, and specific risks!';
    }
    
    if (input.includes('plan') || input.includes('planning')) {
      return 'Emergency planning is crucial for peace of mind! 📋 Create a family communication plan, identify meeting places, and practice your plan regularly. The Relief Ready app helps you build a comprehensive emergency plan tailored to your household\'s specific needs and risks!';
    }
    
    if (input.includes('help') || input.includes('what can you do') || input.includes('assist')) {
      return 'I\'m here to help with all things emergency preparedness! 🚨 I can guide you through the Relief Ready app, answer disaster preparedness questions, help with emergency planning, and provide location-specific advice. What would you like to know more about?';
    }
    
    // Default encouraging response
    return 'I\'m here to help with emergency preparedness! 🛡️ Whether you need guidance on the Relief Ready app, disaster preparedness advice, or emergency planning tips, I\'m ready to assist. What specific aspect of emergency preparedness would you like to explore?';
  }
}

export const emergencyChatbot = new EmergencyChatbot();
