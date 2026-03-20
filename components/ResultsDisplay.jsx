import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx'); // This is Stripe's official generic public test key, it never expires.

// Fix leaflet default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapViewComponent = ({ plan }) => {
  const [center, setCenter] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);

  useEffect(() => {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(plan.destinationCity)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const baseLat = parseFloat(data[0].lat);
          const baseLon = parseFloat(data[0].lon);
          setCenter([baseLat, baseLon]);

          // Generate simulated route points to avoid API rate limits for demo
          const points = [
            { id: 'hotel', name: plan.selectedHotel?.name, pos: [baseLat, baseLon], type: 'Hotel 🏨', color: 'blue' }
          ];

          let currentLat = baseLat;
          let currentLon = baseLon;

          // Add maximum 10 activities to avoid map clutter
          let ptsAdded = 0;
          plan.data?.itinerary?.forEach(day => {
            day.activities?.forEach(act => {
              if (ptsAdded < 10) {
                // offset roughly 0.5km to 2km away
                const angle = Math.random() * Math.PI * 2;
                const dist = (Math.random() * 0.02) + 0.005; // 0.015 is ~1.5km
                currentLat = currentLat + (Math.cos(angle) * dist);
                currentLon = currentLon + (Math.sin(angle) * dist);

                points.push({
                  id: `act-${ptsAdded}`,
                  name: act.description.split('.')[0] || act.description,
                  pos: [currentLat, currentLon],
                  type: `Day ${day.day} Activity 🏃‍♂️`,
                  color: 'orange'
                });
                ptsAdded++;
              }
            })
          });

          setRoutePoints(points);
        }
      }).catch(err => console.error("Map fetch error:", err));
  }, [plan]);

  if (!center) return <div className="p-10 text-center font-bold text-slate-500 animate-pulse">Locating {plan.destinationCity} & Plotting Smart Route...</div>;

  const polylinePositions = routePoints.map(p => p.pos);

  return (
    <div className="h-[500px] w-full rounded-3xl overflow-hidden shadow-inner border-[6px] border-slate-50 relative z-0">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Draw the connected route line! */}
        {polylinePositions.length > 1 && (
          <Polyline positions={polylinePositions} color="#3B82F6" weight={4} dashArray="8 8" opacity={0.6} className="animate-pulse" />
        )}

        {routePoints.map((pt, i) => (
          <Marker key={pt.id} position={pt.pos}>
            <Popup className="font-bold text-lg text-slate-800 text-center rounded-2xl">
              <span className="block mb-1 p-1 bg-slate-100 rounded-lg text-xs font-black uppercase tracking-widest text-blue-600">{pt.type}</span>
              <p className="text-sm leading-tight mt-2">{pt.name}</p>
              {i > 0 && <p className="text-[10px] text-slate-400 mt-2">Stop #{i}</p>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-5 py-2.5 rounded-2xl shadow-xl border border-slate-100 z-[1000] flex flex-col items-end">
        <span className="text-sm font-black text-slate-700 block text-right w-full">🗺️ Interactive AI Route</span>
        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{routePoints.length} Generated Waypoints</span>
      </div>
    </div>
  );
};

const ResultsDisplay = ({ plan }) => {
  const [activeTab, setActiveTab] = useState('itinerary');
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [bookingState, setBookingState] = useState({ isOpen: false, item: null, processing: false, success: false, referenceId: '' });
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [bookingForm, setBookingForm] = useState({ name: '', passport: '', card: '' });
  const [loggedExpenses, setLoggedExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '' });
  const [liveWeather, setLiveWeather] = useState(null);
  const pdfRef = useRef(null);
  const { data } = plan;

  useEffect(() => {
    if (plan?.destinationCity) {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

      if (apiKey) {
        fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(plan.destinationCity)}&days=${Math.min(plan.duration || 7, 10)}`)
          .then(res => res.json())
          .then(json => {
            if (json && json.current && json.forecast) {
              setLiveWeather({
                temp: json.current.temp_c,
                condition: json.current.condition.text,
                icon: json.current.condition.icon,
                forecast: json.forecast.forecastday
              });
            }
          })
          .catch(err => console.error("WeatherAPI fetch error:", err));
      } else {
        fetch(`https://wttr.in/${encodeURIComponent(plan.destinationCity)}?format=j1`)
          .then(res => res.json())
          .then(json => {
            if (json && json.current_condition && json.current_condition[0]) {
              const weather = json.current_condition[0];
              setLiveWeather({
                temp: weather.temp_C,
                condition: weather.weatherDesc[0].value
              });
            }
          })
          .catch(err => console.error("Weather fetch error:", err));
      }
    }
  }, [plan?.destinationCity, plan?.duration]);

  const COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444'];

  const EmptyState = ({ message }) => (
    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
      <p className="text-slate-400 font-medium">{message}</p>
    </div>
  );

  const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleShare = async () => {
    const shareData = {
      title: `My Trip to ${plan.destinationCity} | SkyWise AI`,
      text: `I just architected an amazing ${plan.duration}-day trip to ${plan.destinationCity} using SkyWise AI! Total estimated budget: ${formatPrice(data.budgetAnalysis.totalEstimated)}.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text} Check it out here: ${shareData.url}`);
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2000);
      } catch (err) {
        console.error('Failed to copy!', err);
      }
    }
  };

  const getTransportIcon = (type) => {
    switch (type) {
      case 'Flight': return '✈️';
      case 'Train': return '🚂';
      case 'Bus': return '🚌';
      case 'Rental Car': return '🚗';
      default: return '🚗';
    }
  };

  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    setIsExporting(true);

    try {
      const element = pdfRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${plan.destinationCity}_Travel_Plan.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const openBookingTerminal = async (item) => {
    setBookingState({ isOpen: true, item, processing: true, success: false, referenceId: '', clientSecret: '' });
    setBookingForm({ name: '', passport: '' });
    
    try {
      const amount = item.price || item.pricePerNight || 10000;
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      if (!res.ok) {
        throw new Error(`The server returned an error (${res.status}). Did you restart the server?`);
      }
      const data = await res.json();
      setBookingState(prev => ({ ...prev, processing: false, clientSecret: data.clientSecret, fetchError: null }));
    } catch (err) {
      console.error('Failed to init stripe:', err);
      setBookingState(prev => ({ ...prev, processing: false, fetchError: err.message }));
    }
  };

  const handleBookingSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setBookingState(prev => ({ ...prev, processing: true }));

    try {
      if (!bookingState.item?.provider) {
        // It's a hotel
        const guests = [{
          name: { firstName: bookingForm.name.split(' ')[0], lastName: bookingForm.name.split(' ').slice(1).join(' ') || 'Doe' },
          contact: { phone: "+1234567890", email: "guest@example.com" }
        }];

        const payments = [{
          method: "CREDIT_CARD",
          card: {
            vendorCode: "VI",
            cardNumber: "1234567891011121", // Amadeus still needs test credentials in sandbox
            expiryDate: "2026-12"
          }
        }];

        // Assuming item has an offerId when it's returned from Amadeus, let's just make sure we capture it or mock it if missing
        const offerId = bookingState.item.offerId || "MOCK_OFFER_ID_EXPECTED_FROM_HOTEL_SEARCH";
        
        const { backendService } = await import('../services/backendService.js');
        const bookingResult = await backendService.bookHotel(offerId, guests, payments);

        setBookingState(prev => ({
          ...prev,
          processing: false,
          success: true,
          referenceId: bookingResult?.[0]?.id || 'REF-' + Math.random().toString(36).substr(2, 6).toUpperCase()
        }));

      } else {
        // Mock success for transport
        setTimeout(() => {
          setBookingState(prev => ({
            ...prev,
            processing: false,
            success: true,
            referenceId: 'REF-' + Math.random().toString(36).substr(2, 6).toUpperCase()
          }));
        }, 2500);
      }
    } catch (error) {
      console.error(error);
      alert("Booking failed: " + error.message);
      setBookingState(prev => ({ ...prev, processing: false }));
    }
  };

  const closeBookingTerminal = () => {
    if (!bookingState.processing) {
      setBookingState(prev => ({ ...prev, isOpen: false }));
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'transports':
        if (!data.transports?.length) return <EmptyState message="No transport options were generated. Try adjusting your budget." />;
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-slate-800">Available Options for {formatDate(plan.startDate)}</h3>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{data.transports.length} Options Found</span>
            </div>
            <div className="grid gap-4">
              {data.transports.map((t, i) => (
                <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-lg hover:bg-white transition-all group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform shrink-0">
                      {getTransportIcon(t.type)}
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-slate-900 flex items-center gap-3">
                        {t.provider}
                        <span className="text-[10px] bg-blue-600 text-white px-2.5 py-1 rounded-lg uppercase tracking-widest font-black">{t.type}</span>
                      </h4>
                      <div className="flex flex-wrap gap-4 mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">🕒</span>
                          <span className="text-sm font-bold text-slate-600">Dep: <span className="text-blue-600">{t.departureTime || 'TBD'}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">⏳</span>
                          <span className="text-sm font-medium text-slate-500">{t.duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">🛑</span>
                          <span className="text-sm font-medium text-slate-500">{t.stops === 0 ? 'Non-stop' : `${t.stops} stop(s)`}</span>
                        </div>
                      </div>
                      {t.description && <p className="text-[11px] text-slate-400 mt-2 font-medium bg-slate-100/50 px-2 py-0.5 rounded-md inline-block">Note: {t.description}</p>}
                    </div>
                  </div>
                  <div className="text-right mt-4 sm:mt-0 w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0">
                    <div className="sm:mb-1">
                      <span className="text-3xl font-black text-blue-600">{formatPrice(t.price)}</span>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Per Person</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedTransport(t)}
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 ${selectedTransport === t ? 'bg-green-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
                      >
                        {selectedTransport === t ? 'Selected' : 'Set Budget'}
                      </button>
                      <button onClick={() => openBookingTerminal(t)} className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-md active:scale-95">
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'hotels':
        if (!data.hotels?.length) return <EmptyState message="No hotel recommendations available for this budget level." />;
        return (
          <div className="grid md:grid-cols-2 gap-4">
            {data.hotels.map((h, i) => (
              <div key={i} className={`p-5 bg-slate-50 rounded-xl border flex flex-col justify-between transition-all ${plan.selectedHotel?.name === h.name ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100'}`}>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg text-slate-800 leading-tight">
                      {h.name}
                      {plan.selectedHotel?.name === h.name && <span className="ml-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full align-middle uppercase tracking-widest">Selected</span>}
                    </h4>
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold shrink-0">★ {h.rating}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {h.amenities?.map((a, j) => (
                      <span key={j} className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase font-semibold">{a}</span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
                  <span className="text-slate-500 text-sm italic">Est. per night</span>
                  <span className="text-xl font-bold text-indigo-600">{formatPrice(h.pricePerNight)}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100/50">
                  <button onClick={() => openBookingTerminal(h)} className="w-full bg-slate-900 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl transition-all shadow-md active:scale-95">
                    Book Room Simulation
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      case 'attractions':
        if (!data.attractions?.length) return <EmptyState message="No top attractions found for this destination." />;
        return (
          <div className="space-y-6">
            {data.attractions.map((a, i) => (
              <div key={i} className="flex gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 items-start hover:bg-white transition-all hover:shadow-md">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold shrink-0 shadow-sm mt-1">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                    <h4 className="font-bold text-slate-800 text-lg leading-tight">{a.name}</h4>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded uppercase tracking-tight">
                        📍 {a.distanceFromHotel} from hotel
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded uppercase tracking-tight">
                        🕒 {a.estimatedTime}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{a.description}</p>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.name + ' ' + plan.destinationCity)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-black text-blue-600 bg-blue-100/50 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-xl transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                    Explore on Maps
                  </a>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="font-bold text-green-600 text-xl block">{a.cost === 0 ? 'Free' : formatPrice(a.cost)}</span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Ticket</p>
                </div>
              </div>
            ))}
          </div>
        );
      case 'itinerary':
        if (!data.itinerary?.length) return <EmptyState message="Failed to generate the day-by-day plan. Please try again." />;
        return (
          <div className="space-y-8">
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6 flex items-start gap-4">
              <div className="bg-blue-600 text-white p-2 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-sm text-blue-800 font-medium leading-relaxed">
                All daily plans start from <span className="font-bold">"{plan.selectedHotel?.name}"</span>.
                Transit details include specific lines and estimated travel times.
              </p>
            </div>

            {data.itinerary.map((day) => (
              <div key={day.day} className="relative pl-10">
                <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-sm font-black z-10 shadow-lg border-2 border-white">
                  {day.day}
                </div>
                {day.day < data.itinerary.length && (
                  <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gradient-to-b from-blue-600/30 to-slate-100"></div>
                )}

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all mb-4">
                  <h4 className="font-black text-slate-900 mb-6 text-xl tracking-tight flex items-center gap-3">
                    Day {day.day} Schedule
                    <span className="h-px bg-slate-100 flex-1"></span>

                    {liveWeather?.forecast?.[day.day - 1] && (
                      <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-white pl-1.5 pr-4 py-1.5 rounded-2xl border border-blue-100 shadow-[0_2px_8px_rgba(59,130,246,0.08)] ml-auto hover:shadow-[0_4px_12px_rgba(59,130,246,0.15)] transition-all transform hover:-translate-y-0.5">
                        <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center p-0.5 border border-blue-50 shrink-0">
                          <img src={`https:${liveWeather.forecast[day.day - 1].day.condition.icon}`} alt="weather icon" className="w-full h-full object-contain drop-shadow-sm" />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="text-sm font-black text-slate-800 leading-none">
                            {Math.round(liveWeather.forecast[day.day - 1].day.avgtemp_c)}°C
                          </span>
                          <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest leading-none mt-1 line-clamp-1">
                            {liveWeather.forecast[day.day - 1].day.condition.text}
                          </span>
                        </div>
                      </div>
                    )}
                  </h4>

                  <div className="space-y-8">
                    {day.activities?.map((act, j) => (
                      <div key={j} className="relative pl-6">
                        <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-50"></div>
                        <div className="flex flex-col gap-3">
                          <p className="text-slate-800 font-bold leading-tight">{act.description}</p>

                          <div className="flex flex-wrap gap-3 items-center">
                            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200" title="Transit Route">
                              <span className="text-xs">🚇</span>
                              <span className="text-[11px] font-black text-slate-600 uppercase">{act.transport}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100" title="Distance">
                              <span className="text-xs">📏</span>
                              <span className="text-[11px] font-black text-blue-600 uppercase">{act.distance}</span>
                            </div>
                            {act.travelTime && (
                              <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100" title="Travel Duration">
                                <span className="text-xs">⏳</span>
                                <span className="text-[11px] font-black text-orange-600 uppercase">{act.travelTime}</span>
                              </div>
                            )}

                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.description.split('.')[0] + ' ' + plan.destinationCity)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-slate-100 hover:border-blue-200 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl transition-all text-[11px] font-black uppercase tracking-tight shadow-sm active:scale-95"
                              title="Open in Google Maps"
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                              Explore Maps
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Gastronomy Picks</span>
                    <div className="flex flex-wrap gap-3">
                      {day.meals?.map((meal, j) => (
                        <div key={j} className="flex items-center gap-2 bg-orange-50/50 border border-orange-100 px-4 py-2.5 rounded-2xl">
                          <span className="text-lg">🍽️</span>
                          <span className="text-xs font-bold text-orange-700">{meal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'budget':
        if (!data.budgetAnalysis?.breakdown?.length) return <EmptyState message="Budget analysis data is unavailable." />;

        let totalEstimated = data.budgetAnalysis.totalEstimated || 0;
        let chartData = [...data.budgetAnalysis.breakdown];

        if (selectedTransport) {
          const transportIndex = chartData.findIndex(b => b.category.toLowerCase().includes('flight') || b.category.toLowerCase().includes('transport') || b.category.toLowerCase().includes('travel') || b.category.toLowerCase().includes('transit'));
          if (transportIndex !== -1) {
            totalEstimated = totalEstimated - chartData[transportIndex].amount + selectedTransport.price;
            chartData[transportIndex] = { ...chartData[transportIndex], amount: selectedTransport.price, category: selectedTransport.provider + ' ' + selectedTransport.type };
          } else {
            totalEstimated += selectedTransport.price;
            chartData.push({ category: selectedTransport.provider + ' ' + selectedTransport.type, amount: selectedTransport.price });
          }
        }

        const isOverBudget = totalEstimated > plan.budgetLimit;
        const totalSpent = loggedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const spendPercentage = Math.min(((totalEstimated + totalSpent) / plan.budgetLimit) * 100, 100);

        const handleLogExpense = (e) => {
          e.preventDefault();
          if (!expenseForm.description || !expenseForm.amount) return;
          setLoggedExpenses(prev => [...prev, {
            id: Date.now(),
            description: expenseForm.description,
            amount: Number(expenseForm.amount),
            date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          }]);
          setExpenseForm({ description: '', amount: '' });
        };

        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-5 rounded-2xl text-center border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plan Limit</span>
                <p className="text-3xl font-black text-slate-700 mt-1">{formatPrice(plan.budgetLimit)}</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl text-center border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estimated Total</span>
                <p className={`text-3xl font-black mt-1 ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                  {formatPrice(totalEstimated)}
                </p>
              </div>
              <div className={`p-5 rounded-2xl text-center border flex flex-col justify-center items-center ${isOverBudget ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                <span className={`text-xs font-bold uppercase tracking-widest ${isOverBudget ? 'text-red-400' : 'text-green-400'}`}>Status</span>
                <p className={`text-lg font-bold mt-1 ${isOverBudget ? 'text-red-700' : 'text-green-700'}`}>
                  {isOverBudget ? '⚠ Over Budget' : '✓ Good to Go'}
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h5 className="font-black text-slate-800 text-lg mb-8 flex items-center gap-2">
                <span className="text-xl">📊</span> Spending Distribution
              </h5>
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="h-72 flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="amount"
                        nameKey="category"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => formatPrice(value)}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 'bold' }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex-1 w-full flex flex-col gap-3">
                  {chartData.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md hover:border-slate-300 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        <span className="text-sm font-bold text-slate-700 capitalize pr-2">{item.category}</span>
                      </div>
                      <span className="text-base font-black text-slate-900 shrink-0">{formatPrice(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mt-8">
              <div className="flex justify-between items-end mb-4">
                <h5 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <span className="text-xl">📊</span> Live Expense Tracker
                </h5>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Remaining Limit</p>
                  <p className="text-xl font-black text-blue-600">
                    {formatPrice(Math.max(plan.budgetLimit - totalEstimated - totalSpent, 0))}
                  </p>
                </div>
              </div>

              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-8 relative">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${spendPercentage > 90 ? 'bg-red-500' : spendPercentage > 75 ? 'bg-orange-500' : 'bg-blue-500'}`}
                  style={{ width: `${spendPercentage}%` }}
                ></div>
                <div className="absolute inset-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_25%,rgba(255,255,255,0.2)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.2)_75%,rgba(255,255,255,0.2)_100%)] bg-[length:20px_20px] animate-[slide_2s_linear_infinite] opacity-30"></div>
              </div>

              <form onSubmit={handleLogExpense} className="flex flex-col sm:flex-row gap-3 mb-8">
                <input required type="text" placeholder="What did you buy? (e.g. Coffee)" className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} />
                <div className="relative w-full sm:w-48">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                  <input required type="number" placeholder="Amount" className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
                </div>
                <button type="submit" className="bg-slate-900 hover:bg-blue-600 text-white font-black px-6 py-3 rounded-xl transition-colors shadow-md active:scale-95 text-sm uppercase tracking-widest whitespace-nowrap">
                  Log Spent
                </button>
              </form>

              {loggedExpenses.length > 0 ? (
                <div className="space-y-3">
                  {loggedExpenses.slice().reverse().map((exp) => (
                    <div key={exp.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-4 duration-300">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{exp.description}</span>
                        <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">{exp.date}</span>
                      </div>
                      <span className="font-black text-red-500">- {formatPrice(exp.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No expenses logged yet.</p>
                </div>
              )}
            </div>
          </div >
        );
      case 'map':
        return <MapViewComponent plan={plan} />;
      default:
        return null;
    }
  };

  return (
    <div ref={pdfRef} className="bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden mt-12 mb-20 max-w-5xl mx-auto transform transition-all animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-900 p-10 text-white relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10">AI Architected</span>
              <span className="bg-blue-400/30 text-blue-100 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10">{plan.budgetType}</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-3 tracking-tighter">{plan.destinationCity}</h2>
            <p className="opacity-80 flex items-center gap-2 font-bold text-lg">
              <svg className="w-5 h-5 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {plan.sourceCity} → {plan.destinationCity} • {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-[32px] p-6 border border-white/20 shadow-2xl min-w-[220px] flex items-center gap-5 relative overflow-hidden group transition-all hover:bg-white/20 hover:border-white/40 cursor-default">

            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-400/30 rounded-full blur-2xl group-hover:bg-blue-300/40 transition-colors duration-500"></div>

            {liveWeather?.icon ? (
              <div className="w-16 h-16 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-[0_8px_16px_rgba(0,0,0,0.1)] p-2 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <img src={`https:${liveWeather.icon}`} alt="weather" className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
              </div>
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-blue-300/30 to-purple-400/30 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shrink-0 text-3xl group-hover:scale-110 transition-transform duration-500 shadow-inner">
                🌤️
              </div>
            )}

            <div className="text-right flex-1 z-10">
              <span className="text-[10px] font-black uppercase tracking-widest flex items-center justify-end gap-1.5 opacity-90 mb-1.5 text-blue-50">
                {liveWeather ? <><span className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)] animate-pulse"></span> LIVE NOW</> : 'AI FORECAST'}
              </span>

              {liveWeather ? (
                <>
                  <div className="text-4xl font-black text-white leading-none tracking-tighter drop-shadow-sm mb-0.5">
                    {Math.round(liveWeather.temp)}<span className="text-xl text-blue-200">°c</span>
                  </div>
                  <div className="text-sm font-bold text-blue-200 capitalize truncate drop-shadow-sm">
                    {liveWeather.condition}
                  </div>
                </>
              ) : (
                <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 drop-shadow-sm">
                  {data.weather || 'Perfect'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex mt-14 space-x-3 overflow-x-auto pb-4 no-scrollbar">
          {[
            { id: 'itinerary', label: 'Itinerary', icon: '📅' },
            { id: 'attractions', label: 'Places', icon: '📍' },
            { id: 'transports', label: 'Transport', icon: '🚌' },
            { id: 'hotels', label: 'Stays', icon: '🏨' },
            { id: 'budget', label: 'Finance', icon: '💰' },
            { id: 'map', label: 'Map View', icon: '🗺️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-10 py-4 rounded-[20px] text-sm font-black transition-all shrink-0 flex items-center gap-3 border-2 ${activeTab === tab.id
                ? 'bg-white text-blue-700 shadow-2xl border-white scale-105'
                : 'bg-white/5 hover:bg-white/10 text-white border-white/5'
                }`}
            >
              <span className="text-xl">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-10 min-h-[500px] bg-white">
        {renderContent()}
      </div>

      <div className="bg-slate-50 px-10 py-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-[18px] shadow-lg shadow-blue-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Engine Version</p>
            <p className="text-xs text-slate-600 font-bold leading-tight">
              Ai Travel Planner <br />
              Logistics Calculated for "{plan.selectedHotel?.name?.split(' ')[0]}..."
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative">
            <button
              onClick={handleShare}
              className="flex items-center gap-3 bg-white border-2 border-slate-100 px-8 py-4 rounded-2xl text-sm font-black text-slate-800 hover:bg-slate-50 hover:border-blue-100 hover:text-blue-600 transition-all shadow-sm active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Trip
            </button>
            {showShareTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg shadow-xl whitespace-nowrap animate-bounce">
                Copied to clipboard!
              </div>
            )}
          </div>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`flex items-center gap-3 bg-white border-2 border-slate-100 px-8 py-4 rounded-2xl text-sm font-black text-slate-800 transition-all shadow-sm active:scale-95 ${isExporting ? 'opacity-70 cursor-wait' : 'hover:bg-slate-50 hover:border-blue-100 hover:text-blue-600'}`}
          >
            {isExporting ? (
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            )}
            {isExporting ? 'Generating...' : 'Export Travel Dossier'}
          </button>
        </div>
      </div>
      <BookingDrawer
        bookingState={bookingState}
        setBookingState={setBookingState}
        bookingForm={bookingForm}
        setBookingForm={setBookingForm}
        handleBookingSubmit={handleBookingSubmit}
        getTransportIcon={getTransportIcon}
        formatPrice={formatPrice}
        plan={plan}
      />
    </div>
  );
};

const StripeBookingForm = ({ bookingForm, setBookingForm, handleBookingSubmit, bookingState, setBookingState, plan }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleStripeSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setBookingState(prev => ({ ...prev, processing: true }));

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        alert("Please complete the payment details.");
        setBookingState(prev => ({ ...prev, processing: false }));
        return;
      }

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: window.location.href || "http://localhost:3000",
        },
        redirect: "if_required",
      });

      if (result.error) {
        alert("Payment failed: " + result.error.message);
        setBookingState(prev => ({ ...prev, processing: false }));
      } else {
        await handleBookingSubmit();
      }
    } catch (err) {
      console.error("Stripe caught error:", err);
      alert("Payment processing error: " + (err.message || "Unknown error"));
      setBookingState(prev => ({ ...prev, processing: false }));
    }
  };

  return (
    <form onSubmit={handleStripeSubmit} className="space-y-5 relative">
      {bookingState.processing && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
          <p className="font-black text-blue-900 text-sm">Processing Payment...</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Securing inventory & Payment via Stripe</p>
        </div>
      )}

      <div>
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lead Traveler Name</label>
        <input required type="text" className="w-full mt-1.5 p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="E.g. James Bond" value={bookingForm.name} onChange={e => setBookingForm({ ...bookingForm, name: e.target.value })} />
      </div>
      <div>
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Passport / ID Number</label>
        <input required type="text" className="w-full mt-1.5 p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="A12345678" value={bookingForm.passport} onChange={e => setBookingForm(prev => ({ ...prev, passport: e.target.value }))} />
      </div>

      <div className="pt-4 border-t border-slate-200 mt-6">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2 mb-2">
          Secure Payment Details
          <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase font-bold">Powered by Stripe</span>
        </label>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl">
           <PaymentElement />
        </div>
      </div>

      <button disabled={!stripe} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98] mt-8 uppercase tracking-widest text-sm disabled:opacity-50">
        Pay & Confirm Booking
      </button>
    </form>
  );
};

// Extracted BookingDrawer to prevent re-renders on every keystroke
const BookingDrawer = ({ bookingState, setBookingState, bookingForm, setBookingForm, handleBookingSubmit, getTransportIcon, formatPrice, plan }) => {
  if (!bookingState.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !bookingState.processing && setBookingState(prev => ({ ...prev, isOpen: false }))}></div>
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="font-black text-xl text-slate-800">Complete Reservation</h3>
          <button onClick={() => !bookingState.processing && setBookingState(prev => ({ ...prev, isOpen: false }))} className="text-slate-400 hover:text-red-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {bookingState.success ? (
            <div className="text-center py-20 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-2">Booking Confirmed!</h2>
              <p className="text-slate-500 mb-8 items-center">Your demo reservation is successfully processed.</p>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 inline-block shadow-sm">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Booking Reference</p>
                <p className="text-3xl font-black tracking-widest text-blue-600">{bookingState.referenceId}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white border border-slate-200 rounded-3xl p-5 mb-8 shadow-sm">
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl shrink-0">
                    {bookingState.item?.provider ? getTransportIcon(bookingState.item.type) : '🏨'}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg leading-tight">{bookingState.item?.provider || bookingState.item?.name}</h4>
                    <p className="text-xs font-bold text-slate-400">{bookingState.item?.type || 'Stay'} • {plan.destinationCity}</p>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Amount</span>
                  <span className="text-2xl font-black text-blue-600">{bookingState.item && formatPrice(bookingState.item.price || bookingState.item.pricePerNight)}</span>
                </div>
              </div>

              {bookingState.processing && !bookingState.clientSecret && (
                <div className="flex flex-col items-center justify-center p-10 bg-white border border-slate-200 rounded-3xl shadow-sm">
                  <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mb-3"></div>
                  <p className="font-black text-blue-900 text-sm">Initializing Secure Payment...</p>
                </div>
              )}

              {bookingState.fetchError && (
                <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-center">
                  <p className="text-red-500 font-bold mb-2">Failed to load payment system</p>
                  <p className="text-xs text-red-400 mb-4">{bookingState.fetchError}</p>
                  <p className="text-xs font-black text-red-600 uppercase tracking-widest">Action Required: You must restart your local dev server (npm run dev) so it can register the new Stripe endpoints!</p>
                </div>
              )}

              {bookingState.clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret: bookingState.clientSecret }}>
                  <StripeBookingForm
                    bookingForm={bookingForm} setBookingForm={setBookingForm}
                    handleBookingSubmit={handleBookingSubmit}
                    bookingState={bookingState} setBookingState={setBookingState}
                    plan={plan}
                  />
                </Elements>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
