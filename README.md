# AI Driven Smart Travel Assistance

Welcome to the **AI Driven Smart Travel Assistance**, an intelligent travel planning platform that leverages modern web technologies and AI to generate personalized itineraries, book hotels, and map your journey.

## 🌟 Features

- **AI-Driven Itineraries:** Generates interactive and highly customized day-by-day travel plans using the **Google Gemini API**.
- **Real-Time Hotel Booking:** Integrates with the **Amadeus API** to search for and book real hotel offers securely.
- **Secure Payments:** Uses **Stripe** to process secure, simulated booking transactions.
- **User Authentication:** Robust email/password registration and login system backed by HttpOnly cookies and **SQLite**.
- **Travel Dashboard & Analytics:** View your past trips and spending habits with interactive charts built with **Recharts**.
- **Interactive Maps:** Visualizes destinations, hotels, and attractions using **React-Leaflet**.
- **Context-Aware AI Chatbot:** An integrated AI assistant to answer questions about your currently active travel plan.

## 🛠 Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS
- **Maps:** React-Leaflet + Leaflet
- **Charts:** Recharts
- **Payments:** Stripe React JS
- **Exporting:** html2canvas, jsPDF

### Backend
- **Server:** Node.js + Express.js
- **Database:** SQLite (sqlite3 module)
- **External Services:** 
  - Google GenAI (Gemini)
  - Stripe Node API
  - Amadeus API (via node-fetch and client UI)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- API Keys for Google Gemini, Stripe, and Amadeus.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd "AI Driven Smart Travel Assistance"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and update it with your credentials:
   ```env
   # Google Gemini API Key
   API_KEY=your_gemini_api_key_here

   # Stripe Secret Key (Test Mode)
   STRIPE_SECRET_KEY=sk_test_your_key_here

   # Amadeus API Credentials (Test Environment)
   VITE_AMADEUS_CLIENT_ID=your_amadeus_client_id
   VITE_AMADEUS_CLIENT_SECRET=your_amadeus_client_secret

   # Environment
   NODE_ENV=development
   ```

4. **Start the Development Servers:**
   This project uses `concurrently` to run both the Vite frontend and Express backend simultaneously.
   ```bash
   npm run dev
   ```

5. **Open in Browser:**
   The frontend runs on `http://localhost:5173` (or the port specified by Vite), while the backend API runs on `http://localhost:3001`.

## 📂 Project Structure

- `/components`: Reusable React components (Navbar, TravelForm, ResultsDisplay, etc.)
- `/services`: Abstractions for external communication (`geminiService.js`, `backendService.js`, etc.)
- `server.js`: The central Express backend handling Auth, Database operations, and Stripe intents.
- `database.sqlite`: The local SQLite file storing User, Session, and Trip data.
- `App.jsx`: The main React Router and Orchestrator.

## 📄 License
This project is for educational or non-commercial use.

Live Link :  https://ai-driven-smart-travel-assistance.onrender.com/
