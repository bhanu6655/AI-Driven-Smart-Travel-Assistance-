import React, { useState, useEffect } from 'react';
import { backendService } from '../services/backendService';

const UserProfile = ({ user, onCancel }) => {
  const [profile, setProfile] = useState({ dietary: '', travelStyle: '', passport: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await backendService.getProfile();
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await backendService.updateProfile(profile);
      setMessage({ type: 'success', text: 'Profile updated successfully! AI will now use these preferences.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 text-center animate-pulse bg-white rounded-3xl border border-slate-100 shadow-xl">
        <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4"></div>
        <div className="h-6 w-1/3 bg-slate-200 rounded mx-auto mb-2"></div>
        <div className="h-4 w-1/4 bg-slate-200 rounded mx-auto border-b"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-12 antialiased">
      <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-10 text-white text-center relative">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full mx-auto mb-4 border border-white/30 flex items-center justify-center text-4xl shadow-inner">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-3xl font-black">{user.name}</h2>
          <p className="opacity-80 font-medium">{user.email}</p>
        </div>

        <div className="p-10 text-slate-800">
          {message && (
            <div className={`p-4 rounded-2xl mb-8 font-bold text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-xl font-black border-b border-slate-100 pb-2">AI Travel Persona</h3>
              <p className="text-xs text-slate-500 font-medium mb-4">The AI will use these preferences globally whenever you architect a new trip.</p>
              
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Dietary Preferences</label>
                <input 
                  type="text" 
                  placeholder="e.g. Vegetarian, Gluten-Free, Halal" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                  value={profile.dietary || ''} 
                  onChange={(e) => setProfile({...profile, dietary: e.target.value})} 
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Travel Style</label>
                <input 
                  type="text" 
                  placeholder="e.g. Fast-paced explorer, Relaxed and luxurious resort lover" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                  value={profile.travelStyle || ''} 
                  onChange={(e) => setProfile({...profile, travelStyle: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-100">
              <h3 className="text-xl font-black border-b border-slate-100 pb-2">Booking & Documents</h3>
              
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Passport/ID Number</label>
                <input 
                  type="password" 
                  placeholder="Securely stored for faster hotel bookings" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                  value={profile.passport || ''} 
                  onChange={(e) => setProfile({...profile, passport: e.target.value})} 
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button 
                type="submit" 
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98] flex justify-center"
              >
                {saving ? 'Saving...' : 'Save Profile Settings'}
              </button>
              <button 
                type="button" 
                onClick={onCancel}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 rounded-2xl transition-all active:scale-[0.98]"
              >
                Back to Dashboard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
