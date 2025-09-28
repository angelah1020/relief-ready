# ReliefReady - Technical Documentation

## 📋 Overview

**ReliefReady** is an enterprise-grade emergency preparedness mobile application built with React Native and Expo. The platform combines AI-powered inventory management, real-time disaster monitoring, and personalized preparedness recommendations to help households prepare for natural disasters.

## 🏗️ System Architecture

### **Technology Stack**
- **Frontend**: React Native 0.81.4 with Expo 54.0
- **Language**: TypeScript 5.9.2
- **Navigation**: Expo Router (file-based routing)
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **AI Services**: Google Gemini API
- **Maps**: React Native Maps
- **Authentication**: Supabase Auth with email/password and OAuth

### **Core Dependencies**
```json
{
  "react": "19.1.0",
  "react-native": "0.81.4",
  "expo": "^54.0.10",
  "@supabase/supabase-js": "^2.58.0",
  "@google/generative-ai": "^0.24.1",
  "react-native-maps": "^1.20.1"
}
```

## 📊 Database Schema

### **Core Tables**

#### **accounts**
User account information and authentication
```sql
- id (uuid, primary key)
- email (text, unique)
- display_name (text)
- profile_photo_url (text)
- created_at (timestamptz)
```

#### **households**
Household data with location and settings
```sql
- id (uuid, primary key)
- name (text)
- country (text)
- zip_code (text)
- latitude (decimal)
- longitude (decimal)
- join_code (text, unique)
- created_by (uuid, references accounts)
```

#### **members**
Family members with demographics and medical information
```sql
- id (uuid, primary key)
- household_id (uuid, references households)
- name (text)
- age_group (enum: infant, child, adult, senior)
- medical_notes (text)
- contact_info (text)
```

#### **inventory_items**
Emergency supplies with AI categorization
```sql
- id (uuid, primary key)
- household_id (uuid, references households)
- description (text)
- quantity (decimal)
- unit (text)
- category (text)
- canonical_key (text)
- ai_confidence (decimal)
```

#### **checklist_items**
Disaster-specific preparedness items
```sql
- id (uuid, primary key)
- household_id (uuid, references households)
- hazard_type (enum: hurricane, wildfire, flood, earthquake, tornado, heat)
- item_name (text)
- needed_quantity (decimal)
- unit (text)
- category (text)
- is_completed (boolean)
```

## 🔌 External API Integrations

### **Disaster Data APIs**

#### **National Weather Service (NWS)**
- **Endpoint**: `https://api.weather.gov`
- **Purpose**: Real-time weather alerts and warnings
- **Data**: Storm alerts, hurricane tracking, severe weather warnings
- **Rate Limiting**: User-Agent required, respectful polling

#### **NASA FIRMS (Fire Information)**
- **Endpoint**: `https://firms.modaps.eosdis.nasa.gov/api`
- **Purpose**: Active wildfire hotspot detection
- **Data**: Fire location, intensity (FRP), confidence levels
- **Filtering**: Advanced algorithms to distinguish wildfires from controlled burns

#### **USGS Earthquake Data**
- **Endpoint**: `https://earthquake.usgs.gov/fdsnws`
- **Purpose**: Recent earthquake activity
- **Data**: Magnitude, location, depth, timing

#### **USGS Water Services**
- **Endpoint**: `https://waterservices.usgs.gov`
- **Purpose**: Flood gauge monitoring
- **Data**: River levels, flood stage information

#### **FEMA Emergency Shelters**
- **Endpoint**: `https://gis.fema.gov/arcgis/rest/services`
- **Purpose**: Open emergency shelter locations
- **Data**: Shelter capacity, services, accessibility information

### **AI Services**

#### **Google Gemini API**
- **Models**: gemini-1.5-flash, gemini-1.5-pro
- **Use Cases**:
  - Inventory item categorization
  - Chatbot conversations
  - Preparedness recommendations
  - Checklist generation

## 🚀 Core Features

### **1. Dashboard & Preparedness Scoring**
- **Hazard Donuts**: Visual readiness indicators (0-100%) for 6 disaster types
- **Next Best Actions**: AI-generated improvement recommendations
- **Seasonal Alerts**: Contextual preparedness reminders
- **Real-time Updates**: Dynamic scoring based on inventory and checklists

### **2. AI-Powered Inventory Management**
- **Smart Categorization**: Automatic item classification into 9 categories
- **Quantity Normalization**: Unit conversion and standardization
- **Confidence Scoring**: AI accuracy tracking for categorization
- **Canonical Keys**: Standardized item identifiers for consistency

### **3. Real-Time Disaster Monitoring**
- **Live Map**: Interactive disaster visualization
- **Multi-Source Data**: Integration of 5+ authoritative APIs
- **Layer Controls**: Toggleable hazard overlays
- **Spatial Filtering**: Location-based data retrieval
- **Auto-Refresh**: Periodic data updates (3-5 minute intervals)

### **4. Intelligent Chatbot (ReadyBot)**
- **Context Awareness**: Understanding of app state and household data
- **Navigation Assistance**: Step-by-step feature guidance
- **Preparedness Knowledge**: FEMA-based emergency guidance
- **Conversation Memory**: Persistent chat history

### **5. Household Management**
- **Multi-Member Support**: Family and pet profiles
- **Role-Based Access**: Creator/member permissions
- **Invite System**: Secure household joining via unique codes
- **Location Services**: ZIP code-based geocoding with privacy protection

## 🔐 Security & Privacy

### **Authentication**
- **Supabase Auth**: Email/password with optional OAuth
- **Session Management**: Automatic token refresh
- **Account Linking**: Multiple households per user account

### **Data Privacy**
- **Location Handling**: ZIP code only, no exact addresses stored
- **Geocoding**: Approximate coordinates with 5-mile radius visualization
- **Data Encryption**: All data encrypted in transit and at rest
- **User Control**: Full data export and deletion capabilities

### **API Security**
- **Rate Limiting**: Respectful API usage with proper intervals
- **Error Handling**: Graceful degradation when services unavailable
- **Fallback Systems**: Local data when external APIs fail

## 📱 Application Structure

### **Navigation Architecture**
```
app/
├── _layout.tsx              # Root layout with auth provider
├── index.tsx               # Landing/redirect page
├── (tabs)/                 # Main application tabs
│   ├── dashboard.tsx       # Home screen with readiness scores
│   ├── inventory.tsx       # Supply management
│   ├── map.tsx            # Real-time disaster map
│   ├── checklist.tsx      # Preparedness checklists
│   └── profile.tsx        # Account and household management
├── auth/                  # Authentication flows
│   ├── login.tsx
│   └── signup.tsx
├── household-setup/       # Onboarding flows
│   ├── create.tsx
│   ├── join.tsx
│   └── index.tsx
└── checklist-detail.tsx   # Detailed hazard checklists
```

### **Component Architecture**
```
components/
├── maps/                  # Map visualization components
│   ├── DisasterMap.tsx    # Main map component
│   ├── DisasterMarker.tsx # Hazard markers
│   ├── MapLegend.tsx     # Layer legend
│   └── LayerButton.tsx   # Layer controls
├── ChecklistWithFulfillment.tsx
└── SplashScreen.tsx
```

### **Business Logic**
```
lib/
├── apis/                  # External API integrations
│   ├── nws.ts            # National Weather Service
│   ├── nasa.ts           # NASA FIRMS wildfire data
│   ├── usgs.ts           # USGS earthquake data
│   ├── fema.ts           # FEMA shelter data
│   └── nifc.ts           # NIFC wildfire incidents
├── checklist.ts          # Checklist generation logic
├── inventory-processing.ts # AI categorization
└── supabase.ts           # Database client and types
```

### **AI Services**
```
services/
├── gemini/
│   ├── categorizer.ts    # Inventory AI categorization
│   ├── chatbot.ts        # Conversational AI
│   ├── checklist-generator.ts # Dynamic checklist creation
│   ├── recommendations.ts # Preparedness suggestions
│   └── knowledge-base.ts  # Embedded knowledge system
└── pdf-export.ts         # Report generation
```

## 🔄 Data Flow

### **Inventory Processing Pipeline**
1. **User Input**: Quantity, unit, description
2. **AI Processing**: Gemini API categorization
3. **Normalization**: Unit standardization and quantity conversion
4. **Storage**: Database persistence with confidence scores
5. **Real-time Updates**: Live UI updates via Supabase subscriptions

### **Disaster Data Pipeline**
1. **Scheduled Fetching**: 3-5 minute intervals for critical data
2. **Spatial Filtering**: Location-based API queries
3. **Data Transformation**: Standardization across multiple APIs
4. **Caching**: Local storage for offline capability
5. **Real-time Display**: Live map updates with layer controls

### **Preparedness Scoring Algorithm**
1. **Inventory Analysis**: Compare have vs. need quantities
2. **Checklist Completion**: Track completed preparedness tasks
3. **Household Factors**: Consider members, pets, location risks
4. **Weighted Scoring**: Category-based importance weighting
5. **Real-time Updates**: Dynamic score recalculation

## 🚀 Deployment & DevOps

### **Environment Configuration**
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### **Build Commands**
```bash
# Development
npm run dev

# Production Web Build
npm run build:web

# Type Checking
npm run typecheck

# Linting
npm run lint
```

### **Database Migrations**
- **Supabase CLI**: Managed migrations in `/supabase/migrations/`
- **Schema Evolution**: Versioned database changes
- **Data Integrity**: Foreign key constraints and data validation

## 📊 Performance Considerations

### **API Optimization**
- **Spatial Queries**: Bounding box filtering for map data
- **Caching Strategy**: Local storage for frequently accessed data
- **Rate Limiting**: Respectful API usage patterns
- **Fallback Systems**: Graceful degradation when services unavailable

### **Mobile Optimization**
- **Lazy Loading**: Component-based code splitting
- **Image Optimization**: Compressed assets and responsive images
- **Memory Management**: Efficient map rendering and data handling
- **Offline Capability**: Core features work without internet

### **Real-time Features**
- **Supabase Subscriptions**: Live data updates
- **Debounced Updates**: Efficient map region changes
- **Background Sync**: Automatic data refresh when app becomes active

## 🔧 Development Guidelines

### **Code Organization**
- **TypeScript**: Strict type checking enabled
- **Component Structure**: Functional components with hooks
- **State Management**: React Context for global state
- **Error Handling**: Comprehensive try-catch blocks with user feedback

### **API Integration Patterns**
- **Consistent Error Handling**: Standardized error responses
- **Retry Logic**: Automatic retries for transient failures
- **Data Validation**: Input sanitization and type checking
- **Logging**: Structured logging for debugging (removed in production)

### **Testing Strategy**
- **Type Safety**: TypeScript compilation as first-line testing
- **Linting**: ESLint configuration for code quality
- **Manual Testing**: Comprehensive feature testing on multiple devices

## 📈 Scalability & Future Considerations

### **Horizontal Scaling**
- **Stateless Architecture**: API services designed for horizontal scaling
- **Database Optimization**: Indexed queries and efficient schema design
- **CDN Integration**: Asset delivery optimization
- **Caching Layers**: Redis integration for high-traffic scenarios

### **Feature Extensibility**
- **Plugin Architecture**: Modular API integrations
- **AI Model Flexibility**: Swappable AI providers
- **Localization Ready**: Text externalization for multi-language support
- **Platform Expansion**: Web and desktop deployment capability

---

## 📞 Technical Support

For technical issues, architecture questions, or feature requests, refer to the development team or create an issue in the project repository.

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Documentation Maintained By**: Development Team
