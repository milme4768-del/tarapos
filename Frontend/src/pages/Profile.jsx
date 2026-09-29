import React, { useState } from 'react';
import { User, Store, Shield, Phone, Lock, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { updateProfileApi } from '../api/auth';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const outlet = user?.outletId || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload = { name, phone };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await updateProfileApi(payload);
      setUser(res.data);
      setSuccessMsg('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">My Profile</h1>
        <p className="text-xs text-slate-500">Your staff account credentials and outlet assignment</p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs font-semibold flex items-center space-x-2 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Account Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Access Role</p>
            <p className="text-sm font-bold text-slate-900 uppercase">{user?.role}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Outlet</p>
            <p className="text-sm font-bold text-slate-900">
              {outlet.name ? `${outlet.name} (${outlet.code})` : 'All Outlets (HQ)'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Full Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Email Address (Read Only)
          </label>
          <input
            type="email"
            disabled
            value={user?.email || ''}
            className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9876543210"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {/* Password change */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <p className="text-xs font-bold text-slate-800">Change Password (Optional)</p>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-orange-600 hover:bg-orange-700 active:scale-95 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-orange-600/25 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
        </button>
      </form>
    </div>
  );
}
