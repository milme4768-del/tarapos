import React, { useState, useEffect } from 'react';
import { Store, Plus, Edit2, CheckCircle, XCircle, X, AlertCircle } from 'lucide-react';
import {
  getOutletsApi,
  createOutletApi,
  updateOutletApi,
  toggleOutletStatusApi,
} from '../../api/outlets';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function OutletsManager() {
  const [outlets, setOutlets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    taxPercentage: 0,
    currency: 'Rs.',
  });

  useEffect(() => {
    fetchOutlets();
  }, []);

  const fetchOutlets = async () => {
    setIsLoading(true);
    try {
      const res = await getOutletsApi();
      setOutlets(res.data || []);
    } catch (err) {
      console.error('Failed to load outlets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingOutlet(null);
    setFormData({
      name: '',
      code: '',
      address: '',
      phone: '',
      email: '',
      taxPercentage: 0,
      currency: 'Rs.',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (outlet) => {
    setEditingOutlet(outlet);
    setFormData({
      name: outlet.name,
      code: outlet.code,
      address: outlet.address || '',
      phone: outlet.phone || '',
      email: outlet.email || '',
      taxPercentage: outlet.taxPercentage ?? 0,
      currency: outlet.currency && outlet.currency !== '₹' ? outlet.currency : 'Rs.',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setErrorMsg('Outlet name and unique code are required.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      if (editingOutlet) {
        await updateOutletApi(editingOutlet._id, formData);
      } else {
        await createOutletApi(formData);
      }
      setIsModalOpen(false);
      fetchOutlets();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save outlet.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (outlet) => {
    try {
      await toggleOutletStatusApi(outlet._id);
      fetchOutlets();
    } catch (err) {
      alert(`Error updating outlet: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">Branches & Outlets</h1>
          <p className="text-xs text-slate-500">
            Manage multi-outlet locations, unique bill numbering codes, and branch tax configurations
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-600/20 transition-all w-fit cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Outlet</span>
        </button>
      </div>

      {/* Outlets Grid */}
      {isLoading ? (
        <LoadingSpinner message="Loading branches..." />
      ) : outlets.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No outlets found"
          description="Create your first outlet branch to begin billing."
          action={
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold"
            >
              Add Outlet
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {outlets.map((outlet) => (
            <div
              key={outlet._id}
              className={`bg-white rounded-2xl p-5 border shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                outlet.isActive ? 'border-slate-200 hover:border-orange-300' : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                    CODE: {outlet.code}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(outlet)}
                    className={`text-xs font-bold flex items-center space-x-1 px-2.5 py-0.5 rounded-full ${
                      outlet.isActive
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {outlet.isActive ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        <span>Disabled</span>
                      </>
                    )}
                  </button>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{outlet.name}</h3>

                <div className="text-xs text-slate-600 space-y-1 pt-1">
                  {outlet.address && <p>{outlet.address}</p>}
                  {outlet.phone && <p>Phone: {outlet.phone}</p>}
                  <p className="font-semibold text-slate-700">
                    Tax Rate: {outlet.taxPercentage}% • Currency: {outlet.currency}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Created {new Date(outlet.createdAt).toLocaleDateString('en-IN')}
                </span>
                <button
                  onClick={() => openEditModal(outlet)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Branch</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Outlet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingOutlet ? 'Edit Branch' : 'Add New Branch'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center space-x-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Outlet Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Taraaang Express (Airport)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Outlet Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. OUT1"
                    maxLength={8}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 uppercase focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                  />
                  <span className="text-[10px] text-slate-400">Prefix on all bills</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tax (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.taxPercentage}
                    onChange={(e) => setFormData({ ...formData, taxPercentage: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Branch Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, City, Landmark"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 00000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/25 transition-all cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingOutlet ? 'Update Branch' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
