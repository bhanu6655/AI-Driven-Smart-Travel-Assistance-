
import React from 'react';

const HotelSelection = ({ hotels, onSelect, loading }) => {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-black text-slate-900 mb-4">Choose Your Base</h2>
        <p className="text-slate-500 text-lg">
          We found {hotels.length} great stays for you. We'll build your custom itinerary starting from your selected hotel.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {hotels.map((hotel, index) => (
          <div 
            key={index} 
            className="bg-white rounded-[32px] overflow-hidden border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-400 transition-all group flex flex-col"
          >
            <div className="h-40 bg-slate-100 flex items-center justify-center relative">
              <span className="text-4xl opacity-50">🏨</span>
              <div className="absolute top-4 right-4 bg-yellow-400 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg">
                ★ {hotel.rating}
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-lg font-black text-slate-800 mb-1 leading-tight group-hover:text-blue-600 transition-colors h-12 line-clamp-2">{hotel.name}</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                {hotel.location || 'Central Area'}
              </p>
              
              <div className="flex flex-wrap gap-1.5 mb-6">
                {hotel.amenities.slice(0, 3).map((amenity, i) => (
                  <span key={i} className="text-[9px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-lg border border-slate-100 uppercase">
                    {amenity}
                  </span>
                ))}
                {hotel.amenities.length > 3 && (
                   <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-2 py-1 rounded-lg uppercase">
                    +{hotel.amenities.length - 3} more
                  </span>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-xl font-black text-slate-900">₹{hotel.pricePerNight.toLocaleString('en-IN')}</span>
                  <span className="text-slate-400 text-[10px] font-bold block">per night</span>
                </div>
                <button 
                  onClick={() => onSelect(hotel)}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? '...' : 'Select'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HotelSelection;
