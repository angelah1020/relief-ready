# Disaster Preparedness Assistant: **Relief Ready**

_Created by **Selina Wu, Angela Huang, Alyn Kosasi, Lilian Qu**_

## Inspiration

In an era of increasing climate uncertainty and unpredictable natural events, preparing for disasters can feel overwhelming, complex, and fragmented. Families often struggle to know where to start, what supplies they truly need, and how to stay informed when an emergency strikes.

**Relief Ready** is a comprehensive, AI-powered mobile application designed to transform this anxiety into confidence. It serves as a centralized hub for household emergency preparedness, simplifying every step from planning and inventory management to real-time situational awareness.

By creating a personalized profile for your household—including members, pets, and location-specific risks— **Relief Ready** generates dynamic, actionable checklists tailored to hazards like hurricanes, wildfires, and earthquakes. Our intelligent inventory system uses AI to automatically categorize and quantify your supplies, showing you exactly what you have and what you need at a glance. When a threat is imminent, the live disaster map provides a holistic, real-time view of multiple hazards, overlaying data from national agencies like FEMA, NWS, and USGS.

**Relief Ready** is more than just a checklist app; it's a complete preparedness ecosystem that empowers households to build resilience, stay connected, and confidently navigate any emergency.

## What Relief Ready does
**Relief Ready** is an AI-powered, real-time disaster preparedness hub that offers:

* _Readiness Dashboard:_ At-a-glance readiness scores for various hazards/disasters, with dynamic, AI-powered checklists.
* _AI Companion:_ Ask about disasters and how to prepare for them, enjoy 24/7 in-app support.
* _Live Hazard Map:_ Track live storms, fires, floods, and more with real-time data from NWS and USGS.
* _Intelligent Inventory:_ Easily log your supplies and let AI automatically categorize and update your readiness.
* _Household Hub_: Your command center to personalize plans, manage members, and collaborate with family.

## How we built it

* _React Native & Expo.io_ – For cross-platform mobile development and streamlined deployment.
* _Supabase_ – For secure authentication, Postgres database storage, and Edge Functions to handle all server-side logic.
* _Google Gemini API_ – To power the personalized checklist generation, dynamic inventory categorization, and AI chatbot.
* _USGS Water Data API National Weather Service (NWS) API, USGS Earthquake API, NASA FIRMS Wildfire API, FEMA Disaster API, USGS Water Data API_ – For live hazard and disaster information on location and severity, allowing real-time map updates and alerts.
* _Visual Studio Code_ – For collaborative coding and development.
* _JavaScript & TypeScript_ – Programming Languages.
* _Figma_ – For UI/UX design.

## What's next for Relief Ready

* **Community & Social Features:** We plan to introduce features that allow users to create community networks, enabling them to check in on neighbors and share resources during an emergency.
* **Enhanced AI Chatbot:** We will expand the AI chatbot's capabilities to provide personalized, step-by-step guidance during an active disaster, using real-time data to offer the safest, most relevant advice.
* **Smart Home & IoT Integration:** In the long term, we envision integrating with smart home devices to provide automated alerts, such as smoke detector warnings or reminders to charge power banks before a storm.
* **Gamification & Education:** To encourage proactive engagement, we will introduce gamified elements and educational modules to make preparedness an ongoing, rewarding habit rather than a one-time task.
