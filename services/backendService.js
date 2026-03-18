
export const backendService = {
  register: async (name, email, password) => {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }
    return response.json();
  },

  login: async (email, password) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    return response.json();
  },

  logout: async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
  },

  getCurrentUser: async () => {
    const response = await fetch('/api/me', { credentials: 'include' });
    if (!response.ok) return null;
    return response.json();
  },

  saveFullTripPlan: async (
    userId,
    params,
    hotel,
    finalizedData,
    initialTransports,
    initialHotels
  ) => {
    const tripData = {
      sourceCity: params.source,
      destinationCity: params.destination,
      duration: params.days,
      people: params.people,
      budgetType: params.budgetType,
      budgetLimit: params.budgetAmount,
      selectedHotel: hotel,
      data: {
        ...finalizedData,
        transports: initialTransports,
        hotels: initialHotels
      }
    };

    const response = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(tripData)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Backend returned an error on saveFullTripPlan:", response.status, errText);
      throw new Error(`Failed to save trip plan (Status ${response.status}): ${errText}`);
    }

    return response.json();
  },

  getUserTripHistory: async (userId) => {
    const response = await fetch('/api/trips', { credentials: 'include' });
    if (!response.ok) return [];
    return response.json();
  },

  getAnalytics: async () => {
    const response = await fetch('/api/analytics', { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
  },

  bookHotel: async (offerId, guests, payments) => {
    const response = await fetch('/api/book-hotel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ offerId, guests, payments })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Hotel booking failed');
    }
    return data;
  }
};
