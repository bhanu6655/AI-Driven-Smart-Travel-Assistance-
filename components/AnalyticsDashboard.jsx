
import React, { useEffect, useState } from 'react';
import { backendService } from '../services/backendService';

const AnalyticsDashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await backendService.getAnalytics();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatPrice = (price) => `₹${price.toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-extrabold text-slate-900 mb-8">Adventure Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Total Trips</p>
          <p className="text-4xl font-extrabold text-blue-600">{stats.totalTrips}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Estimated Spending</p>
          <p className="text-4xl font-extrabold text-indigo-600">{formatPrice(stats.totalSpent)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Avg per Trip</p>
          <p className="text-4xl font-extrabold text-orange-500">
            {stats.totalTrips > 0 ? formatPrice(Math.round(stats.totalSpent / stats.totalTrips)) : '₹0'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Bucket List Rank</p>
          <p className="text-4xl font-extrabold text-green-500">Gold</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 mb-6">Top Destinations</h3>
          {stats.mostVisited.length > 0 ? (
            <div className="space-y-4">
              {stats.mostVisited.map(([dest, count], i) => (
                <div key={i} className="flex items-center">
                  <span className="w-8 text-slate-400 font-bold">#{i + 1}</span>
                  <div className="flex-1 bg-slate-50 rounded-full h-8 overflow-hidden flex items-center justify-between px-4">
                    <span className="text-sm font-bold text-slate-700">{dest}</span>
                    <span className="text-xs text-slate-400">{count} visits</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400">No trips planned yet. Start your journey!</p>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-8 rounded-2xl shadow-xl text-white">
          <h3 className="text-xl font-bold mb-4">Pro Tip for Next Journey</h3>
          <p className="opacity-80 leading-relaxed mb-6">
            Based on your history, you enjoy {stats.mostVisited[0]?.[0] || 'diverse'} locations. 
            SkyWise AI recommends exploring emerging tech hubs like Singapore or Seoul for your next adventure.
          </p>
          <div className="bg-white/10 rounded-xl p-4">
            <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.243a1 1 0 011.414 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707zM16 18a1 1 0 100-2 1 1 0 000 2z"></path></svg>
              Smart Suggestion
            </h4>
            <p className="text-sm opacity-90">Plan during the shoulder season to save up to 25% on mid-range accommodations in popular cities.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
