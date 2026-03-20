export const getAmadeusToken = async () => {
  const clientId = import.meta.env.VITE_AMADEUS_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Amadeus credentials not found in environment variables.");
  }

  const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Amadeus Token Error:", errorData);
    throw new Error("Failed to get Amadeus access token");
  }

  const data = await response.json();
  return data.access_token;
};

// Search for hotels by latitude and longitude to get hotel IDs
export const searchHotelsByGeocode = async (token, lat, lng) => {
  // Amadeus returns reference data for hotels in radius
  const url = `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-geocode?latitude=${lat}&longitude=${lng}&radius=50&radiusUnit=KM`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    console.warn("Amadeus Geocode Hotel Search returned warning/error.");
    return [];
  }

  const data = await response.json();
  return data.data || [];
};

// Search for hotel offers (pricing) using hotel IDs
export const getHotelOffers = async (token, hotelIds, adultCount, checkInDate, checkOutDate) => {
  // Amadeus v3 shopping endpoint, allows up to 100 hotel IDs max per request
  const slicedIds = hotelIds.slice(0, 50).map(h => h.hotelId).join(',');
  if (!slicedIds) return [];

  const url = `https://test.api.amadeus.com/v3/shopping/hotel-offers?hotelIds=${slicedIds}&adults=${adultCount || 1}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&currency=INR`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    console.warn("Amadeus Hotel Offers returned warning/error.");
    return [];
  }

  const data = await response.json();
  return data.data || [];
};

export const bookHotelRoom = async (token, offerId, guests, payments) => {
  const url = `https://test.api.amadeus.com/v1/booking/hotel-orders`;

  const requestBody = {
    data: {
      type: "hotel-order",
      guests: guests, // Array of guest details (names, contact info)
      travelAgent: {
        contact: {
          email: "agent@smarttravel.com" // You can change this to your email
        }
      },
      roomAssociations: [
        {
          guestReferences: [{ guestReference: "1" }],
          hotelOfferId: offerId
        }
      ],
      payment: payments // Payment method details (using Amadeus test credit cards for sandbox)
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Amadeus Booking Error:", errorData);
    throw new Error("Failed to book the hotel via Amadeus: " + JSON.stringify(errorData));
  }

  const data = await response.json();
  return data.data;
};
