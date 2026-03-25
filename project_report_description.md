# 🚁 AI Driven Smart Travel Assistance


---

## 1. Project Overview & Objective
SkyWise AI is an advanced, full-stack travel orchestration platform designed to simplify the complexities of modern journey planning. By integrating Generative AI (Google Gemini) with real-time logistics APIs (Amadeus, WeatherAPI), the system acts as a personalized travel architect. 

**Core Objective:** To create a unified, data-driven ecosystem where users can generate a complete, optimized itinerary—including housing, transit, daily activities, and budgeting—in under 60 seconds.

---

## 2. Key Features

### 🧠 **AI Itinerary Orchestration**
*   **Contextual Planning:** Generates a day-by-day schedule using Google Gemini Pro, factoring in user preferences, budget constraints, and group size.
*   **Dynamic Logistics:** Automatically calculates travel times between attractions and suggests optimal transit modes (Metro, Bus, Walk).
*   **Gastronomy Integration:** Provides specific local meal recommendations for breakfast, lunch, and dinner each day.

### 🏨 **Real-time Logistics & Search**
*   **Hotel Connectivity:** Integrated via the **Amadeus Travel API**, providing live hotel availability, star ratings, and pricing.
*   **Flight/Transport Scouting:** Parallel scanning for transport options that match the user's specific departure dates.

### 💼 **Smart Utility Suite**
*   **PackMate AI:** A weather-aware packing assistant that analyzes the destination's climate and user profile to generate a essential checklist.
*   **Live Finance Tracker:** A real-time budgeting engine that compares estimated costs vs. actual logged expenses during the trip.
*   **PDF Dossier Export:** Allows users to download their complete journey architecting as a professional, multi-page PDF brochure.

### 🔐 **Advanced Security & UX**
*   **JWT Authentication:** Secure login/register flow with session persistence and "Remember Me" functionality.
*   **Progressive Loading:** Implements ghost-loading (Skeleton screens) and a 4-step progress stepper to maintain high perceived performance during heavy AI computation.

---

## 3. Technology Stack

### **Frontend (Vite + React)**
*   **Framework:** React 18+ for building a reactive, component-based single-page application (SPA).
*   **Styling:** Tailwind CSS for a modern, mobile-responsive "Glassmorphism" UI design.
*   **State Management:** Component-level state with context-like flows for global auth and trip history.
*   **Maps & Charts:** Leaflet.js for interactive route mapping and Recharts for budget visualization.

### **Backend (Node.js + Express)**
*   **Server:** Express.js handling secure API routing and middleware.
*   **Auth Middleware:** Cookie-parser for persistent session management.
*   **Database:** SQLite for lightweight, high-performance relational storage of user data and trip history.

### **APIs & AI (The "Brain")**
*   **Google Gemini AI:** Powering all natural language generation and decision-making logic.
*   **Amadeus API:** Providing live global travel and hotel industry data.
*   **WeatherAPI:** Supplying real-time temperature and condition forecasts.

---

## 4. System Architecture
The project follows a **Service-Oriented Architecture (SOA)**:
1.  **Frontend Layer:** Captures user intent and renders complex visualizations.
2.  **Proxy Server Layer:** Protects sensitive API keys by making server-to-server requests and handling data sanitization.
3.  **Persistence Layer:** Stores serialized JSON trip objects, allowing users to revisit "Archived Missions" from any device.

---

## 5. Major Project Highlights (U.S.P)
*   **Zero-Placeholders:** The app uses zero hardcoded data; every plan is generated uniquely for the user.
*   **Immersive Design:** The UI is crafted with a "Premium-First" mindset, utilizing vibrant gradients, micro-animations, and centered tab navigation.
*   **Production Readiness:** Features like input validation, toast notifications, and auto-refresh tokens make it more than a project—it’s a production-ready application.
