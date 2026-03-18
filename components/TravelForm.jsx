
import React, { useState, useEffect } from 'react';
import { BudgetType } from '../types';

const TravelForm = ({ onSubmit, loading }) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 4);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const [params, setParams] = useState({
    source: '',
    destination: '',
    startDate: tomorrowStr,
    endDate: nextWeekStr,
    people: 1,
    budgetType: BudgetType.MID,
    budgetAmount: 100000,
    additionalPreferences: ''
  });

  // Calculate days automatically when dates change
  useEffect(() => {
    if (params.startDate && params.endDate) {
      const start = new Date(params.startDate);
      const end = new Date(params.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      setParams(prev => ({ ...prev, days: diffDays }));
    }
  }, [params.startDate, params.endDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(params);
  };

  return (
    <div className="bg-white p-8 rounded-[32px] shadow-2xl border border-slate-100 max-w-5xl mx-auto -mt-16 relative z-10">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">From</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🛫</span>
            <input
              required
              type="text"
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold"
              placeholder="Source City"
              value={params.source}
              onChange={(e) => setParams({ ...params, source: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">To</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">📍</span>
            <input
              required
              type="text"
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold"
              placeholder="Destination"
              value={params.destination}
              onChange={(e) => setParams({ ...params, destination: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Departure Date</label>
          <div className="relative">
            <input
              required
              type="date"
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold appearance-none"
              value={params.startDate}
              onChange={(e) => setParams({ ...params, startDate: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Return Date</label>
          <div className="relative">
            <input
              required
              type="date"
              min={params.startDate}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold appearance-none"
              value={params.endDate}
              onChange={(e) => setParams({ ...params, endDate: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration</label>
          <div className="w-full px-4 py-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl text-blue-700 font-black text-sm flex items-center justify-center">
            {params.days} Days / {params.days > 1 ? params.days - 1 : 0} Nights
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Travelers</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">👥</span>
            <input
              required
              type="number"
              min="1"
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold"
              value={params.people}
              onChange={(e) => setParams({ ...params, people: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Class</label>
          <select
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold appearance-none"
            value={params.budgetType}
            onChange={(e) => setParams({ ...params, budgetType: e.target.value })}
          >
            <option value={BudgetType.LOW}>{BudgetType.LOW}</option>
            <option value={BudgetType.MID}>{BudgetType.MID}</option>
            <option value={BudgetType.LUXURY}>{BudgetType.LUXURY}</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Max Budget (₹)</label>
          <input
            required
            type="number"
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold"
            value={params.budgetAmount}
            onChange={(e) => setParams({ ...params, budgetAmount: parseInt(e.target.value) })}
          />
        </div>

        <div className="lg:col-span-4 space-y-1.5 mt-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <span className="text-sm">✨</span> AI Special Requirements
          </label>
          <textarea
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium resize-none"
            rows="2"
            placeholder="E.g., I'm a vegetarian, I need wheelchair accessibility, I prefer a relaxing vibe near the beach..."
            value={params.additionalPreferences}
            onChange={(e) => setParams({ ...params, additionalPreferences: e.target.value })}
          ></textarea>
        </div>

        <div className="lg:col-span-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4.5 rounded-[22px] text-white font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 ${loading
                ? 'bg-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:shadow-blue-200 hover:-translate-y-1 active:translate-y-0'
              }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Architecting Your Journey...
              </>
            ) : (
              <>
                <span>Generate Smart Plan</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TravelForm;
