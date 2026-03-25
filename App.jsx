
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
    <div className="w-full px-8 mx-auto mt-12 mb-20 animate-in fade-in duration-500">
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

const ProgressStepper = ({ step }) => {
  const steps = [
    { label: 'Analyzing Preferences', icon: '🧠' },
    { label: 'Scouting Destinations', icon: '🌍' },
    { label: 'Verifying Costs', icon: '💰' },
    { label: 'Generating Itinerary', icon: '📋' }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full"></div>
        <div 
          className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 rounded-full transition-all duration-700"
          style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
        ></div>
        
        <div className="relative flex justify-between">
          {steps.map((s, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className={`w-14 h-14 rounded-2xl border-4 flex items-center justify-center text-xl transition-all duration-500 z-10 ${
                idx <= step ? 'bg-blue-600 border-blue-50 shadow-xl ring-4 ring-blue-50 text-white' : 'bg-white border-slate-100 text-slate-300'
              }`}>
                {idx < step ? '✅' : s.icon}
              </div>
              <div className={`mt-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                idx <= step ? 'text-blue-600' : 'text-slate-300'
              }`}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-20 text-center animate-pulse">
        <h2 className="text-2xl font-black text-slate-800 mb-2">{steps[step]?.label}...</h2>
        <p className="text-slate-400 font-bold text-sm">Our AI is architecting your perfect journey. Please wait.</p>
      </div>
    </div>
  );
};

const HistorySkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl"></div>
          <div>
            <div className="h-6 bg-slate-100 w-32 rounded-lg mb-2"></div>
            <div className="h-4 bg-slate-50 w-48 rounded-md"></div>
          </div>
        </div>
        <div className="h-8 bg-slate-100 w-24 rounded-xl"></div>
      </div>
    ))}
  </div>
);

const ToastContainer = ({ toasts }) => (
  <div className="fixed bottom-8 right-8 z-[200] space-y-4">
    {toasts.map(t => (
      <div key={t.id} className={`p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 text-white animate-in slide-in-from-right duration-300 ${
        t.type === 'error' ? 'bg-red-500' : 'bg-slate-900'
      }`}>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          {t.type === 'error' ? '❌' : '✅'}
        </div>
        <p className="font-black text-sm pr-4">{t.message}</p>
      </div>
    ))}
  </div>
);

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

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', confirmPassword: '', rememberMe: false, resetToken: '', newPassword: '', confirmNewPassword: '' });
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [authSuccess, setAuthSuccess] = useState(null);

  const [toasts, setToasts] = useState([]);
  const [loadingStep, setLoadingStep] = useState(0); // 0-4 for progress

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

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

  const validateField = (name, value) => {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (name === 'email' && value && !emailRe.test(value)) return 'Please enter a valid email address';
    if (name === 'name' && value && value.trim().length < 2) return 'Name must be at least 2 characters';
    if (name === 'password' && value) {
      if (value.length < 7) return 'At least 7 characters required';
      if (!/[A-Z]/.test(value)) return 'Must contain an uppercase letter';
      if (!/[0-9]/.test(value)) return 'Must contain a number';
    }
    if (name === 'confirmPassword' && value && value !== authForm.password) return 'Passwords do not match';
    if (name === 'confirmNewPassword' && value && value !== authForm.newPassword) return 'Passwords do not match';
    return null;
  };

  const handleFieldChange = (name, value) => {
    setAuthForm(prev => ({ ...prev, [name]: value }));
    const err = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      if (authMode === 'login') {
        const loggedUser = await backendService.login(authForm.email, authForm.password, authForm.rememberMe);
        setUser(loggedUser);
        setPage('home');
      } else if (authMode === 'register') {
        if (authForm.password !== authForm.confirmPassword) {
          setFieldErrors({ confirmPassword: 'Passwords do not match' });
          return;
        }
        if (authForm.password.length < 7) {
          throw new Error('Password must be at least 7 characters long');
        }
        await backendService.register(authForm.name, authForm.email, authForm.password);
        const loggedUser = await backendService.login(authForm.email, authForm.password, false);
        setUser(loggedUser);
        setPage('home');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setAuthSuccess(null);
    setLoading(true);
    try {
      const result = await backendService.forgotPassword(authForm.email);
      setAuthSuccess('If this email is registered, a reset link has been sent. Check your console for the dev token.');
      // In dev mode, auto-fill the token from the response
      if (result.devToken) {
        setAuthForm(prev => ({ ...prev, resetToken: result.devToken }));
        setTimeout(() => setAuthMode('reset'), 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    if (authForm.newPassword !== authForm.confirmNewPassword) {
      setFieldErrors({ confirmNewPassword: 'Passwords do not match' });
      return;
    }
    setLoading(true);
    try {
      await backendService.resetPassword(authForm.resetToken, authForm.newPassword);
      setAuthSuccess('Password reset successfully! You can now sign in.');
      setTimeout(() => { setAuthMode('login'); setAuthSuccess(null); }, 2000);
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
    setLoadingStep(0);
    setError(null);
    try {
      const profile = await backendService.getProfile();
      setLoadingStep(1);
      
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

      setLoadingStep(2);
      const options = await searchInitialOptions(finalParams);
      setLoadingStep(3);
      setInitialOptions(options);
      setLastSearchParams(finalParams);
      setStep('selection');
      addToast('Great! We found some amazing hotel options for you.');
    } catch (err) {
      setError(err.message || 'Something went wrong during trip architecting.');
      addToast(err.message || 'Architecting failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHotel = async (hotel) => {
    if (!lastSearchParams || !initialOptions || !user) return;

    setLoading(true);
    setLoadingStep(0);
    setSaving(true);
    setError(null);
    try {
      setLoadingStep(1);
      const finalizedData = await finalizeTravelPlan(lastSearchParams, hotel, initialOptions.transports);

      setLoadingStep(2);
      const savedPlan = await backendService.saveFullTripPlan(
        user.id,
        lastSearchParams,
        hotel,
        finalizedData,
        initialOptions.transports,
        initialOptions.hotels
      );

      setLoadingStep(3);
      setCurrentPlan(savedPlan);
      setHistory(prev => [savedPlan, ...prev]);
      setStep('result');
      addToast('Adventure saved! Your personal itinerary is ready.');
    } catch (err) {
      setError(err.message || 'Failed to finalize and save your plan. Please try selecting the hotel again.');
      addToast('Failed to save trip', 'error');
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
      // --- FORGOT PASSWORD ---
      if (authMode === 'forgot') return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl p-10 border border-slate-100">
            <button onClick={() => { setAuthMode('login'); setError(null); setAuthSuccess(null); }} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 text-sm font-bold mb-8 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back to Sign In
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900">Reset Password</h2>
              <p className="text-slate-500 text-sm mt-2">Enter your email and we'll send you a reset link.</p>
            </div>
            {authSuccess && <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded-2xl text-sm font-bold mb-6">{authSuccess}</div>}
            {error && <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl text-xs font-bold mb-6">{error}</div>}
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Email</label>
                <input required type="email" className="w-full mt-1.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-400 transition-all font-medium"
                  placeholder="name@company.com" value={authForm.email}
                  onChange={e => handleFieldChange('email', e.target.value)} />
                {fieldErrors.email && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{fieldErrors.email}</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-100 transition-all">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        </div>
      );

      // --- RESET PASSWORD ---
      if (authMode === 'reset') return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl p-10 border border-slate-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900">Set New Password</h2>
              <p className="text-slate-500 text-sm mt-2">Choose a strong new password.</p>
            </div>
            {authSuccess && <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded-2xl text-sm font-bold mb-6 flex items-center gap-2"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>{authSuccess}</div>}
            {error && <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl text-xs font-bold mb-6">{error}</div>}
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reset Token</label>
                <input required type="text" className="w-full mt-1.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-400 transition-all font-medium font-mono text-sm"
                  placeholder="Paste your reset token" value={authForm.resetToken}
                  onChange={e => setAuthForm(prev => ({...prev, resetToken: e.target.value}))} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                <input required type="password" className={`w-full mt-1.5 p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-green-400 transition-all font-medium ${fieldErrors.newPassword ? 'border-red-300' : 'border-slate-200'}`}
                  placeholder="Min 7 chars, 1 uppercase, 1 number" value={authForm.newPassword}
                  onChange={e => handleFieldChange('newPassword', e.target.value)} />
                {fieldErrors.newPassword && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{fieldErrors.newPassword}</p>}
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                <input required type="password" className={`w-full mt-1.5 p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-green-400 transition-all font-medium ${fieldErrors.confirmNewPassword ? 'border-red-300' : 'border-slate-200'}`}
                  placeholder="Re-enter new password" value={authForm.confirmNewPassword}
                  onChange={e => handleFieldChange('confirmNewPassword', e.target.value)} />
                {fieldErrors.confirmNewPassword && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{fieldErrors.confirmNewPassword}</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl shadow-xl shadow-green-100 transition-all">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      );

      // --- LOGIN / REGISTER ---
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
            <h2 className="text-3xl font-black text-center mb-2 text-slate-900">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-slate-500 text-center mb-10 text-sm">Experience the future of travel planning.</p>

            <form onSubmit={handleAuth} className="space-y-5">
              {authMode === 'register' && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input required type="text" className={`w-full mt-1.5 p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium ${fieldErrors.name ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                    placeholder="John Doe" value={authForm.name}
                    onChange={e => handleFieldChange('name', e.target.value)} />
                  {fieldErrors.name && <p className="text-red-500 text-xs font-bold mt-1.5 ml-1 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{fieldErrors.name}</p>}
                </div>
              )}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input required type="email" className={`w-full mt-1.5 p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium ${fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                  placeholder="name@company.com" value={authForm.email}
                  onChange={e => handleFieldChange('email', e.target.value)} />
                {fieldErrors.email && <p className="text-red-500 text-xs font-bold mt-1.5 ml-1 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{fieldErrors.email}</p>}
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <input required type="password" className={`w-full mt-1.5 p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium ${fieldErrors.password ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                  placeholder="••••••••" value={authForm.password}
                  onChange={e => handleFieldChange('password', e.target.value)} />
                {fieldErrors.password
                  ? <p className="text-red-500 text-xs font-bold mt-1.5 ml-1 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{fieldErrors.password}</p>
                  : authMode === 'register' && authForm.password && <p className="text-slate-400 text-xs mt-1.5 ml-1">Min 7 chars • 1 uppercase • 1 number</p>
                }
              </div>
              {authMode === 'register' && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                  <input required type="password" className={`w-full mt-1.5 p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium ${fieldErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                    placeholder="••••••••" value={authForm.confirmPassword}
                    onChange={e => handleFieldChange('confirmPassword', e.target.value)} />
                  {fieldErrors.confirmPassword && <p className="text-red-500 text-xs font-bold mt-1.5 ml-1 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{fieldErrors.confirmPassword}</p>}
                </div>
              )}

              {authMode === 'login' && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={authForm.rememberMe}
                        onChange={e => setAuthForm(prev => ({...prev, rememberMe: e.target.checked}))} />
                      <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${authForm.rememberMe ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                        {authForm.rememberMe && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Remember me for 7 days</span>
                  </label>
                  <button type="button" onClick={() => { setAuthMode('forgot'); setError(null); }}
                    className="text-sm font-bold text-blue-600 hover:underline transition-all">
                    Forgot password?
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98] flex justify-center">
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (authMode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="mt-8 text-center text-sm">
              <span className="text-slate-400 font-medium">{authMode === 'login' ? "New to Our site?" : "Already have an account?"}</span>
              <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(null); setFieldErrors({}); }}
                className="ml-2 text-blue-600 font-black hover:underline transition-all">
                {authMode === 'login' ? 'Register Now' : 'Sign In'}
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
        <div className="w-full mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Your Adventures</h2>
              <p className="text-slate-500 font-bold mt-2">Every journey you've architected with us.</p>
            </div>
            <button
              onClick={() => { setPage('planner'); setStep('input'); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2"
            >
              <span>+</span> New Journey
            </button>
          </div>

          <div className="space-y-6">
            {loading ? (
              <HistorySkeleton />
            ) : history.length > 0 ? history.map((trip, idx) => (
              <div 
                key={idx} 
                className="group bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-between"
                onClick={() => {
                  setCurrentPlan(trip);
                  setPage('planner');
                  setStep('result');
                }}
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500 shadow-inner">
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
                  <span className="text-xl font-black text-blue-600">₹{trip?.data?.budgetAnalysis?.totalEstimated?.toLocaleString('en-IN') || 0}</span>
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

              <div className="w-full px-8 mx-auto text-center relative z-10">
                <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
                  Where to <span className="text-blue-300">Next</span>?
                </h1>
                <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed font-medium">
                  AI-driven itineraries. Choose your vibe, pick your stay, and explore.
                </p>
              </div>
            </div>

            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
              <TravelForm onSubmit={handleSearch} loading={loading} />

            {loading && !error && <ProgressStepper step={loadingStep} />}

              {error && (
                <div className="w-full px-8 mx-auto mt-6 bg-red-50 border border-red-100 text-red-600 py-4 rounded-2xl flex items-center shadow-sm">
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  <span className="font-bold text-sm">{error}</span>
                </div>
              )}
            </div>
          </>
        )}

        {step === 'selection' && initialOptions && (
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            {saving && (
              <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-500">
                <ProgressStepper step={loadingStep} />
              </div>
            )}
            <HotelSelection
              hotels={initialOptions.hotels}
              onSelect={handleSelectHotel}
              loading={loading}
            />
            {error && (
              <div className="w-full px-8 mx-auto mt-6 bg-red-50 border border-red-100 text-red-600 py-4 rounded-2xl flex items-center shadow-sm">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-10a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <span className="font-bold text-sm">{error}</span>
              </div>
            )}
          </div>
        )}

        {step === 'result' && currentPlan && (
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
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
      <ToastContainer toasts={toasts} />
    </div>
  );
};

export default App;
