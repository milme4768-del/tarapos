import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, CheckCircle2, MessageSquare, Building2, Percent, HelpCircle } from 'lucide-react';
import { getSettingsApi, updateSettingsApi } from '../../api/settings';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Settings() {
  const { setSettings: setGlobalSettings } = useAuthStore();
  const [formData, setFormData] = useState({
    restaurantName: 'Taraaang Organic Food PVT LTD',
    tagline: 'Delicious Food, Served Fast',
    address: '',
    phone: '',
    email: '',
    defaultTaxPercentage: 0,
    currency: 'Rs.',
    defaultWhatsAppMessage: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await getSettingsApi();
      if (res.data) {
        setFormData(res.data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');

    try {
      const res = await updateSettingsApi(formData);
      setGlobalSettings(res.data);
      setSuccessMsg('Settings updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(`Error saving settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading configuration..." />;
  }

  // Simulated WhatsApp message preview
  const previewMessage = (formData.defaultWhatsAppMessage || '')
    .replace(/{{customerName}}/g, 'Rahul Das')
    .replace(/{{restaurantName}}/g, formData.restaurantName || 'Taraaang Organic Food PVT LTD')
    .replace(/{{outletName}}/g, 'Central Branch')
    .replace(/{{billNumber}}/g, 'OUT1-2026-000123')
    .replace(/{{grandTotal}}/g, `${formData.currency || 'Rs.'} 540.00`)
    .replace(/{{date}}/g, '29 Sep 2026');

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">System & Bill Settings</h1>
        <p className="text-xs text-slate-500">
          Configure restaurant branding, default tax percentage, and automated WhatsApp message templates
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Restaurant Identity */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-slate-900 text-sm">Restaurant Identity</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Restaurant Name
              </label>
              <input
                type="text"
                required
                value={formData.restaurantName}
                onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tagline / Slogan
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* WhatsApp Message Template */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">WhatsApp Share Template</h3>
              <p className="text-xs text-slate-500">
                Variables: {'{{customerName}}'}, {'{{billNumber}}'}, {'{{grandTotal}}'}, {'{{restaurantName}}'}, {'{{outletName}}'}, {'{{date}}'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Template Message Content
              </label>
              <textarea
                rows={7}
                value={formData.defaultWhatsAppMessage}
                onChange={(e) => setFormData({ ...formData, defaultWhatsAppMessage: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500 leading-relaxed"
              />
            </div>

            {/* Live WhatsApp chat preview card */}
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Live Customer WhatsApp Preview
                </span>
                <div className="bg-emerald-100/70 p-3.5 rounded-xl rounded-tl-none text-xs font-sans text-slate-800 whitespace-pre-wrap shadow-xs leading-relaxed">
                  {previewMessage}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-3 text-right">Preview rendered with sample bill values</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 active:scale-95 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-orange-600/25 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Configurations...' : 'Save All Settings'}</span>
        </button>
      </form>
    </div>
  );
}
