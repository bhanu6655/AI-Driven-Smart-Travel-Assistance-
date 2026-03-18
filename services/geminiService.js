
import { GoogleGenAI, Type } from "@google/genai";
import { getAmadeusToken, searchHotelsByGeocode, getHotelOffers } from './amadeusService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLatLng = async () => {
  return new Promise((resolve) => {
    if ("geolocation" in navigator) {
      // Reduced timeout to 1.5s for faster fallback
      const timeoutId = setTimeout(() => {
        resolve({ latitude: 28.6139, longitude: 77.2090 });
      }, 1500);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          clearTimeout(timeoutId);
          resolve({ latitude: 28.6139, longitude: 77.2090 });
        },
        { timeout: 1500 }
      );
    } else {
      resolve({ latitude: 28.6139, longitude: 77.2090 });
    }
  });
};

export const searchInitialOptions = async (params) => {
  let amadeusHotelsContext = "";
  try {
    // 1. Get Lat/Lng of destination
    const geoPrompt = `Return strictly a JSON array with the latitude and longitude for the location: ${params.destination}. Do not include markdown or text. Example: [48.8566, 2.3522]`;
    const geoResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: geoPrompt
    });
    let latlngText = geoResponse.text || "[]";
    latlngText = latlngText.replace(/```json/g, '').replace(/```/g, '').trim();
    const latlng = JSON.parse(latlngText);
    
    if (Array.isArray(latlng) && latlng.length === 2) {
      const token = await getAmadeusToken();
      const hotelsSearch = await searchHotelsByGeocode(token, latlng[0], latlng[1]);
      
      if (hotelsSearch && hotelsSearch.length > 0) {
         const offers = await getHotelOffers(token, hotelsSearch, params.people, params.startDate, params.endDate);
         if (offers && offers.length > 0) {
            amadeusHotelsContext = `REAL HOTEL DATA FROM AMADEUS API:\n` + offers.map((o, index) => {
               const h = o.hotel;
               const price = o.offers?.[0]?.price?.total || "Unknown";
               const offerId = o.offers?.[0]?.id || "";
               return `${index+1}. ${h.name} - Price: ₹${price} (Total for stay) - OfferID: ${offerId}`;
            }).join('\n');
         }
      }
    }
  } catch (err) {
    console.warn("Could not fetch real Amadeus hotels.", err);
  }

  const prompt = `
    Find travel options from ${params.source} to ${params.destination} for the period ${params.startDate} to ${params.endDate} (${params.days} days) for ${params.people} travelers with a ${params.budgetType} preference and a total budget cap of ₹${params.budgetAmount}.
    All prices MUST be in Indian Rupees (INR).
    
    REQUIREMENT: Provide a diverse range of transport modes from ${params.source} to ${params.destination}. 
    MANDATORY: For Flights, include a comprehensive list of at least 4-6 real flight options specifically for the departure date: ${params.startDate}. 
    
    ${amadeusHotelsContext 
      ? `MANDATORY: You MUST build your hotel recommendations using the following real hotel data fetched from Amadeus API, if it fits the budget. Filter and enrich these real options by filling in the required hotel amenities, layout, and ratings:\n${amadeusHotelsContext}`
      : `MANDATORY: Provide at least 30 diverse hotel options in ${params.destination}. VERY IMPORTANT: You MUST generate a significant portion of LOW BUDGET options (such as backpacker hostels, cheap guesthouses, budget lodges, and stays under ₹1000 - ₹2000 per night). Do not only generate mid-range or luxury hotels. Ensure a massive distribution from extremely cheap options to comfortable stays.`}
    
    ${params.additionalPreferences ? `\n    SPECIAL AI DIRECTIVE: The user has provided these explicit requirements: "${params.additionalPreferences}". YOU MUST prioritize accommodations and options that reflect these requirements.` : ''}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0, // Enforce deterministic output to prevent wildly different fallback hotels
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["isBudgetSufficient", "transports", "hotels"],
          properties: {
            isBudgetSufficient: { type: Type.BOOLEAN },
            transports: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["type", "provider", "price", "duration", "departureTime", "stops"],
                properties: {
                  type: { type: Type.STRING },
                  provider: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  duration: { type: Type.STRING },
                  departureTime: { type: Type.STRING },
                  stops: { type: Type.NUMBER },
                  description: { type: Type.STRING }
                }
              }
            },
            hotels: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["name", "rating", "pricePerNight", "amenities", "location"],
                properties: {
                  name: { type: Type.STRING },
                  rating: { type: Type.NUMBER },
                  pricePerNight: { type: Type.NUMBER },
                  location: { type: Type.STRING },
                  amenities: { type: Type.ARRAY, items: { type: Type.STRING } },
                  offerId: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    if (data.isBudgetSufficient === false) {
      throw new Error("Insufficient budget for this destination.");
    }
    return data;
  } catch (error) {
    console.error("Initial Search Error:", error);
    throw new Error(error.message || "Failed to find travel options.");
  }
};

export const finalizeTravelPlan = async (params, selectedHotel, transports) => {
  const prompt = `
    As a travel architect, build a DETAILED itinerary for ${params.destination} (${params.startDate} to ${params.endDate}).
    Base Hotel: ${selectedHotel.name}
    Budget: ₹${params.budgetAmount} for ${params.people} people.
    
    ${params.additionalPreferences ? `\n    CRITICAL AI DIRECTIVE: The user has explicitly stated: "${params.additionalPreferences}". You MUST design the ENTIRE daily schedule, restaurants, and attractions to rigidly match this mandate.` : ''}
    
    Include specific transit routes, travel times, and geographically optimized daily routes.
    
    CRITICAL INSTRUCTION: You MUST return strictly a valid JSON object starting with '{' and ending with '}'. DO NOT wrap it in markdown block quotes. The JSON structure MUST exactly match this schema:
    {
      "weather": "string",
      "attractions": [
        { "name": "string", "description": "string", "estimatedTime": "string", "cost": number, "distanceFromHotel": "string" }
      ],
      "itinerary": [
        { "day": number, "activities": [ { "description": "string", "transport": "string", "distance": "string", "travelTime": "string" } ], "meals": ["string"] }
      ],
      "budgetAnalysis": {
        "totalEstimated": number, "isOverBudget": boolean, "breakdown": [ { "category": "string", "amount": number, "percentage": number } ]
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    let rawText = response.text || "{}";
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonMatch) {
      rawText = jsonMatch[1];
    } else {
      rawText = rawText.trim();
    }
    const result = JSON.parse(rawText);
    const groundingLinks = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk) => {
        if (chunk.web) {
          groundingLinks.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    return { ...result, groundingLinks };
  } catch (error) {
    console.error("Finalization Error:", error);
    throw new Error("Failed to finalize travel plan: " + (error.message || error));
  }
};

export const chatWithAI = async (message, contextData, previousMessages = []) => {
  try {
    const systemPrompt = `You are a helpful and expert AI Travel Assistant persona for 'TravelMate' application. You are speaking directly to the user.
    Answer concisely. Tone: friendly, energetic, expert.
    
    Here is the detailed context of the user's current travel plan:
    Dest: ${contextData?.destinationCity} from ${contextData?.sourceCity}
    Dates: ${contextData?.startDate} to ${contextData?.endDate}
    Hotel: ${contextData?.selectedHotel?.name}
    Budget: ${contextData?.budgetAmount} ${contextData?.budgetType}
    
    User Query: ${message}`;

    // Convert previous messages to Gemini format if needed, but for a simple stateless completion we can just send the transcript:
    const transcript = previousMessages.map(m => `${m.sender}: ${m.text}`).join('\n');
    const fullPrompt = `${systemPrompt}\n\nPast Conversation:\n${transcript}\n\nUser: ${message}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });

    return response.text;
  } catch (err) {
    console.error("Chat with AI Error:", err);
    return "I'm having a little trouble connecting to my travel servers right now. Can you try asking me again in a moment?";
  }
};
