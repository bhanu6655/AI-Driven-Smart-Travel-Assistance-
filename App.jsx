
import React, { useState, useEffect } from 'react';
import { backendService } from './services/backendService';
import { searchInitialOptions, finalizeTravelPlan } from './services/geminiService';
import Navbar from './components/Navbar';
import TravelForm from './components/TravelForm';
import HotelSelection from './components/HotelSelection';
import ResultsDisplay from './components/ResultsDisplay';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AIChatbot from './components/AIChatbot';
import UserProfile from './components/UserProfile';

const LoadingSkeleton = () => {
  const [textIndex, setTextIndex] = useState(0);
  const phrases = [
    'Consulting local experts...', 'Calculating travel logistics...',
    'Mapping attractions...', 'Finalizing your journey budget...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex(prev => (prev + 1) % phrases.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-12 mb-20 animate-in fade-in duration-500">
      <div className="text-center mb-10">
        <div className="inline-flex w-16 h-16 items-center justify-center bg-blue-100 rounded-full mb-4 animate-bounce">
          <span className="text-2xl">🤖</span>
        </div>
        <h3 className="text-2xl font-black text-blue-900 transition-all duration-300">{phrases[textIndex]}</h3>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 animate-pulse">Running AI Inference Engine</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between h-52 group">
            <div className="animate-pulse">
              <div className="flex justify-between items-start mb-6">
                <div className="w-1/2 h-6 bg-slate-200 rounded-lg"></div>
                <div className="w-16 h-6 bg-blue-50 rounded-md border border-blue-100"></div>
              </div>
              <div className="space-y-3">
                <div className="w-3/4 h-3 bg-slate-100 rounded-full"></div>
                <div className="w-full h-3 bg-slate-100 rounded-full"></div>
                <div className="w-5/6 h-3 bg-slate-100 rounded-full"></div>
              </div>
            </div>
            <div className="h-12 bg-slate-50 border border-slate-100 rounded-2xl w-full mt-4 flex items-center justify-center animate-pulse">
              <div className="w-1/4 h-2.5 bg-slate-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('auth');
  const [initializing, setInitializing] = useState(true);

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);

  const [step, setStep] = useState('input');
  const [initialOptions, setInitialOptions] = useState(null);
  const [lastSearchParams, setLastSearchParams] = useState(null);

  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const currentUser = await backendService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setPage('home');
      }
    } catch (err) {
      console.error("Session check failed", err);
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    try {
      const data = await backendService.getUserTripHistory(user.id);
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        const loggedUser = await backendService.login(authForm.email, authForm.password);
        setUser(loggedUser);
        setPage('home');
      } else {
        if (authForm.password.length < 7) {
          throw new Error('Password must be at least 7 characters long');
        }
        await backendService.register(authForm.name, authForm.email, authForm.password);
        const loggedUser = await backendService.login(authForm.email, authForm.password);
        setUser(loggedUser);
        setPage('home');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (params) => {
    if (!user) {
      setPage('auth');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const profile = await backendService.getProfile();
      let extraPrefs = [];
      if (profile.dietary) extraPrefs.push(`Dietary Needs: ${profile.dietary}`);
      if (profile.travelStyle) extraPrefs.push(`Travel Style/Vibe: ${profile.travelStyle}`);
      
      let finalParams = { ...params };
      if (extraPrefs.length > 0) {
        const addedContext = `\nUSER PROFILE PREFERENCES TO APPLY GLOBALLY: ${extraPrefs.join(', ')}`;
        finalParams.additionalPreferences = finalParams.additionalPreferences 
          ? finalParams.additionalPreferences + addedContext 
          : addedContext;
      }

      const options = await searchInitialOptions(finalParams);
      setInitialOptions(options);
      setLastSearchParams(finalParams);
      setStep('selection');
    } catch (err) {
      setError(err.message || 'Something went wrong during trip architecting.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHotel = async (hotel) => {
    if (!lastSearchParams || !initialOptions || !user) return;

    setLoading(true);
    setSaving(true);
    setError(null);
    try {
      const finalizedData = await finalizeTravelPlan(lastSearchParams, hotel, initialOptions.transports);

      const savedPlan = await backendService.saveFullTripPlan(
        user.id,
        lastSearchParams,
        hotel,
        finalizedData,
        initialOptions.transports,
        initialOptions.hotels
      );

      setCurrentPlan(savedPlan);
      setHistory(prev => [savedPlan, ...prev]);
      setStep('result');
    } catch (err) {
      setError(err.message || 'Failed to finalize and save your plan. Please try selecting the hotel again.');
    } finally {
      setLoading(false);
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await backendService.logout();
    setUser(null);
    setPage('auth');
    setCurrentPlan(null);
    setStep('input');
    setAuthForm({ email: '', password: '', name: '' });
  };

  const renderPage = () => {
    if (initializing) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      );
    }

    if (page === 'auth') {
      return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl p-10 border border-slate-100">
            <div className="flex justify-center mb-8">
              <div className="bg-blue-600 p-3 rounded-2xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-black text-center mb-2 text-slate-900">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-slate-500 text-center mb-10 text-sm">Experience the future of travel planning.</p>

            <form onSubmit={handleAuth} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input required type="text" className="w-full mt-1.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" placeholder="John Doe" value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} />
                </div>
              )}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input required type="email" className="w-full mt-1.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" placeholder="name@company.com" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <input required type="password" placeholder="••••••••" className="w-full mt-1.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98] flex justify-center"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="mt-8 text-center text-sm">
              <span className="text-slate-400 font-medium">{isLogin ? "New to Our site?" : "Already have an account?"}</span>
              <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="ml-2 text-blue-600 font-black hover:underline transition-all">
                {isLogin ? 'Register Now' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (page === 'dashboard') {
      return user ? <AnalyticsDashboard user={user} /> : null;
    }

    if (page === 'profile') {
      return user ? <UserProfile user={user} onCancel={() => setPage('dashboard')} /> : null;
    }

    if (page === 'history') {
      return (
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">My Archive</h2>
            <div className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
              {history.length} Saved Plans
            </div>
          </div>

          <div className="grid gap-6">
            {history.length > 0 ? history.map(trip => (
              <div
                key={trip.id}
                onClick={() => { setCurrentPlan(trip); setPage('planner'); setStep('result'); }}
                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-2xl cursor-pointer transition-all flex justify-between items-center group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-50 transition-colors shadow-inner">
                    🌍
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 leading-tight">{trip.destinationCity}</h3>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                      {trip.duration} Days • {trip.people} Travelers • {new Date(trip.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-blue-600">₹{trip.data.budgetAnalysis.totalEstimated.toLocaleString('en-IN')}</span>
                  <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-all font-black text-[10px] uppercase tracking-widest mt-1">
                    Open Plan →
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                <div className="text-6xl mb-6">🏜️</div>
                <h3 className="text-xl font-black text-slate-400 mb-2">No Saved Adventures</h3>
                <p className="text-slate-300 text-sm max-w-xs mx-auto mb-8 font-medium">Your travel history is currently a blank canvas.</p>
                <button
                  onClick={() => { setPage('planner'); setStep('input'); }}
                  className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-xl shadow-blue-100 hover:scale-105 transition-all"
                >
                  Start First Plan
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="pb-20">
        {step === 'input' && (
          <>
            <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 text-white py-24 px-4 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="url(#grid)" />
                  <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                </svg>
              </div>

              <div className="max-w-4xl mx-auto text-center relative z-10">
                <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
                  Where to <span className="text-blue-300">Next</span>?
                </h1>
                <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed font-medium">
                  AI-driven itineraries. Choose your vibe, pick your stay, and explore.
                </p>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <TravelForm onSubmit={handleSearch} loading={loading} />

              {loading && !error && <LoadingSkeleton />}

              {error && (
                <div className="max-w-4xl mx-auto mt-6 bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl flex items-center shadow-sm">
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  <span className="font-bold text-sm">{error}</span>
                </div>
              )}
            </div>
          </>
        )}

        {step === 'selection' && initialOptions && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {saving && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 border-8 border-white border-t-blue-500 rounded-full animate-spin mb-6"></div>
                <h2 className="text-white text-3xl font-black mb-3 drop-shadow-lg">Optimizing Logistics...</h2>
                <p className="text-blue-100 font-bold uppercase tracking-widest text-sm mb-2 max-w-sm">
                  We're mapping attractions and calculating logistics around your selected hotel.
                </p>
              </div>
            )}
            <HotelSelection
              hotels={initialOptions.hotels}
              onSelect={handleSelectHotel}
              loading={loading}
            />
            {error && (
              <div className="max-w-4xl mx-auto mt-6 bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl flex items-center shadow-sm">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-10a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <span className="font-bold text-sm">{error}</span>
              </div>
            )}
          </div>
        )}

        {step === 'result' && currentPlan && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ResultsDisplay plan={currentPlan} />
            <div className="text-center mt-12">
              <button
                onClick={() => { setStep('input'); setError(null); }}
                className="bg-slate-900 hover:bg-black text-white font-black px-10 py-4 rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95"
              >
                Architect New Journey
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onNavigate={(p) => {
          if (!user && p !== 'home') {
            setPage('auth');
          } else {
            setPage(p);
            setError(null);
            if (p === 'planner') {
              setCurrentPlan(null);
              setStep('input');
            }
          }
        }}
      />
      {renderPage()}
      {currentPlan && <AIChatbot currentPlan={currentPlan} />}
    </div>
  );
};

export default App;
