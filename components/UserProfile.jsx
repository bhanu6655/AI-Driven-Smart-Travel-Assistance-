import React, { useState, useEffect } from 'react';
import { backendService } from '../services/backendService';

const UserProfile = ({ user, onCancel }) => {
  const [profile, setProfile] = useState({ dietary: '', travelStyle: '', passport: '' });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Password change state
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [pwChanging, setPwChanging] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, statsData] = await Promise.all([
          backendService.getProfile(),
          backendService.getAnalytics()
        ]);
        setProfile(profileData);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to fetch user data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await backendService.updateProfile(profile);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new !== pwForm.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setPwChanging(true);
    try {
      await backendService.updatePassword(pwForm.current, pwForm.new);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPwForm({ current: '', new: '', confirm: '' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setPwChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto my-12 p-8 text-center bg-white rounded-[40px] border border-slate-100 shadow-2xl space-y-6">
        <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto animate-pulse"></div>
        <div className="h-8 w-1/3 bg-slate-100 rounded mx-auto animate-pulse"></div>
        <div className="h-4 w-1/4 bg-slate-100 rounded mx-auto animate-pulse"></div>
        <div className="grid grid-cols-3 gap-4 mt-8">
           {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-50 rounded-3xl animate-pulse"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 my-12 antialiased animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-white rounded-[48px] shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header with Glass Gradient */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-900 p-10 text-white relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10 text-center md:text-left">
            <div className="w-32 h-32 bg-white/20 backdrop-blur-xl rounded-[40px] border-2 border-white/30 flex items-center justify-center text-5xl font-black shadow-2xl transform hover:rotate-3 transition-transform duration-500">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <span className="bg-blue-400/30 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-white/10">Global Explorer</span>
                <span className="bg-white/10 text-white/60 text-[10px] font-black tracking-widest px-3 py-1.5 rounded-xl">ID: {user.id}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">{user.name}</h2>
              <p className="text-blue-100 font-bold opacity-80 text-lg flex items-center justify-center md:justify-start gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {user.email}
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 relative z-10">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/10 text-center">
              <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Total Trips</p>
              <p className="text-3xl font-black">{stats?.totalTrips || 0}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/10 text-center">
              <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Total Spent</p>
              <p className="text-3xl font-black">₹{stats?.totalSpent?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/10 text-center">
              <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Level</p>
              <p className="text-3xl font-black">Pro</p>
            </div>
             <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/10 text-center">
              <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Impact</p>
              <p className="text-3xl font-black">🌍</p>
            </div>
          </div>
        </div>

        <div className="p-10 text-slate-800">
          {message && (
            <div className={`p-4 rounded-2xl mb-8 font-bold text-sm flex items-center gap-3 animate-in zoom-in-95 duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              <span className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></span>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Preferences Column */}
            <div className="space-y-10">
              <form onSubmit={handleSave} className="space-y-8 bg-slate-50/50 p-8 rounded-[40px] border border-slate-100">
                <div className="flex items-center gap-4 mb-2">
                  <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">AI Settings</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">Global Dietary Preferences</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Vegetarian, Gluten-Free" 
                      className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold placeholder:text-slate-300 shadow-sm"
                      value={profile.dietary || ''} 
                      onChange={(e) => setProfile({...profile, dietary: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">AI Travel Persona</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Fast-paced explorer, Relaxed traveler" 
                      className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold placeholder:text-slate-300 shadow-sm"
                      value={profile.travelStyle || ''} 
                      onChange={(e) => setProfile({...profile, travelStyle: e.target.value})} 
                    />
                    <p className="text-[10px] text-slate-400 mt-3 font-semibold italic">Our AI brain will use these settings for every journey you architect.</p>
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">Secure Document ID</label>
                    <input 
                      type="text" 
                      placeholder="Passport or Govt. ID" 
                      className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold placeholder:text-slate-300 shadow-sm"
                      value={profile.passport || ''} 
                      onChange={(e) => setProfile({...profile, passport: e.target.value})} 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-slate-900 border-2 border-slate-900 hover:bg-white hover:text-slate-900 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98]"
                >
                  {saving ? 'Processing...' : 'Sync Preferences'}
                </button>
              </form>
            </div>

            {/* Security Column */}
            <div className="space-y-10">
               <form onSubmit={handlePasswordChange} className="space-y-8 bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl shadow-blue-100">
                <div className="flex items-center gap-4 mb-2">
                  <div className="bg-blue-500 p-2.5 rounded-xl shadow-lg shadow-blue-400/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">Security & Privacy</h3>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Current Password</label>
                    <input 
                      type="password" 
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-white placeholder:text-white/20"
                      value={pwForm.current}
                      onChange={(e) => setPwForm({...pwForm, current: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">New Password</label>
                    <input 
                      type="password" 
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-white placeholder:text-white/20"
                      value={pwForm.new}
                      onChange={(e) => setPwForm({...pwForm, new: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Confirm New Password</label>
                    <input 
                      type="password" 
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-white placeholder:text-white/20"
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm({...pwForm, confirm: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={pwChanging}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/40 transition-all active:scale-[0.98]"
                >
                  {pwChanging ? 'Updating Vault...' : 'Update Password'}
                </button>
              </form>

              <div className="flex gap-4">
                 <button 
                  type="button" 
                  onClick={onCancel}
                  className="flex-1 bg-white border-2 border-slate-100 hover:border-slate-300 text-slate-600 font-black py-5 rounded-[28px] transition-all active:scale-[0.95] flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Exit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">SkyWise AI Travel Engine • v2.1.0 • Privacy Encrypted</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
