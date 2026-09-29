import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UtensilsCrossed, Lock, Mail, ArrowRight, AlertCircle, Store, MapPin, Phone } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getPublicOutletsApi } from '../api/outlets';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [outlets, setOutlets] = useState([]);
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('expired') === 'true';

  useEffect(() => {
    fetchOutlets();
  }, []);

  const fetchOutlets = async () => {
    try {
      const res = await getPublicOutletsApi();
      if (res.data) {
        setOutlets(res.data);
      }
    } catch {
      // Non-critical; fallback if network is delayed
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    const res = await login(email.trim(), password);
    if (res.success) {
      navigate('/billing');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon */}
        <div className="w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 mx-auto">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h2 className="mt-4 text-center text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Taraaang Organic Food PVT LTD
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Fast Multi-Outlet Food & Billing POS
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-7 px-5 sm:px-8 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          {sessionExpired && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Your session expired. Please log in again to continue.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Staff / Admin Email or ID
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@restaurant.com"
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-md shadow-orange-600/25 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-[0.99] focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-60 transition-all cursor-pointer"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In to Billing'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Operating Outlets / Branches in Database */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
                <Store className="w-3.5 h-3.5 text-orange-600" />
                <span>Operating Branches</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Cloud Database Connected</span>
            </div>

            {outlets.length > 0 ? (
              <div className="space-y-1.5">
                {outlets.map((outlet) => (
                  <div
                    key={outlet._id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800">
                          {outlet.code}
                        </span>
                        {outlet.name}
                      </p>
                      {outlet.address && (
                        <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[240px]">{outlet.address}</span>
                        </p>
                      )}
                    </div>
                    {outlet.phone && (
                      <span className="text-[10px] text-slate-500 hidden sm:flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {outlet.phone}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                <p className="text-xs text-slate-500">Sign in with your branch credentials to access billing.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

