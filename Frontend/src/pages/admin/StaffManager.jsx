import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, CheckCircle, XCircle, X, AlertCircle, Shield, Store } from 'lucide-react';
import { getUsersApi, createUserApi, updateUserApi, toggleUserStatusApi } from '../../api/users';
import { getOutletsApi } from '../../api/outlets';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function StaffManager() {
  const [users, setUsers] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    outletId: '',
    outlets: [],
    phone: '',
  });

  useEffect(() => {
    getOutletsApi().then((res) => setOutlets(res.data || []));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [selectedOutlet, selectedRole]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await getUsersApi({
        outletId: selectedOutlet || undefined,
        role: selectedRole || undefined,
      });
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    const initialOutletId = outlets[0]?._id || '';
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      outletId: initialOutletId,
      outlets: initialOutletId ? [initialOutletId] : [],
      phone: '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    const assigned = (u.outlets && u.outlets.length > 0)
      ? u.outlets.map((o) => o._id || o)
      : (u.outletId ? [u.outletId._id || u.outletId] : []);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      outletId: assigned[0] || '',
      outlets: assigned,
      phone: u.phone || '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const toggleOutlet = (outletId) => {
    setFormData((prev) => {
      const current = prev.outlets || [];
      const exists = current.includes(outletId);
      const updated = exists
        ? current.filter((id) => id !== outletId)
        : [...current, outletId];
      return {
        ...prev,
        outlets: updated,
        outletId: updated[0] || '',
      };
    });
  };

  const selectAllOutlets = () => {
    const allIds = outlets.map((o) => o._id);
    setFormData((prev) => ({
      ...prev,
      outlets: allIds,
      outletId: allIds[0] || '',
    }));
  };

  const clearAllOutlets = () => {
    setFormData((prev) => ({
      ...prev,
      outlets: [],
      outletId: '',
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.role) {
      setErrorMsg('Name, email, and role are required.');
      return;
    }

    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (formData.role !== 'admin' && (!formData.outlets || formData.outlets.length === 0)) {
      setErrorMsg('Managers and Billing Staff must be assigned to at least one outlet.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      if (editingUser) {
        await updateUserApi(editingUser._id, formData);
      } else {
        await createUserApi(formData);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save staff account.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (u) => {
    try {
      await toggleUserStatusApi(u._id);
      fetchUsers();
    } catch (err) {
      alert(`Error updating staff status: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">Staff & Roles</h1>
          <p className="text-xs text-slate-500">
            Manage staff members, roles, and branch data isolation assignments
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-600/20 transition-all w-fit cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center space-x-2 text-xs">
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="staff">Billing Staff</option>
        </select>

        <select
          value={selectedOutlet}
          onChange={(e) => setSelectedOutlet(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium"
        >
          <option value="">All Outlets</option>
          {outlets.map((o) => (
            <option key={o._id} value={o._id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading staff directory..." />
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No staff found"
            description="Create staff accounts to assign them to outlets."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Assigned Outlet</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">{u.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'manager'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.role === 'admin' ? (
                        <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-semibold">
                          All Outlets (HQ)
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-[280px]">
                          {u.outlets && u.outlets.length > 0 ? (
                            u.outlets.map((o) => (
                              <span
                                key={o._id || o}
                                className="text-[11px] font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1"
                              >
                                <Store className="w-3 h-3 text-orange-600" />
                                {o.name || o.code || 'Branch'}
                              </span>
                            ))
                          ) : u.outletId ? (
                            <span className="text-[11px] font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                              <Store className="w-3 h-3 text-orange-600" />
                              {u.outletId.name} ({u.outletId.code})
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">None</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingUser ? 'Edit Staff Account' : 'Create Staff Account'}
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
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sunil Kumar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="staff@restaurant.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password {editingUser ? '(Leave blank to keep unchanged)' : '*'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    System Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium"
                  >
                    <option value="staff">Billing Staff</option>
                    <option value="manager">Outlet Manager (Can manage multiple branches)</option>
                    <option value="admin">Administrator (Full HQ Access)</option>
                  </select>
                </div>

                {formData.role !== 'admin' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Assigned Branch(es) *
                        <span className="text-slate-400 font-normal lowercase ml-1">
                          ({formData.outlets?.length || 0} selected)
                        </span>
                      </label>
                      <div className="flex gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={selectAllOutlets}
                          className="text-orange-600 font-semibold hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={clearAllOutlets}
                          className="text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="max-h-44 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      {outlets.map((o) => {
                        const isChecked = formData.outlets?.includes(o._id);
                        return (
                          <label
                            key={o._id}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-orange-50/80 border-orange-300 text-orange-900 font-bold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleOutlet(o._id)}
                                className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500 cursor-pointer"
                              />
                              <span>{o.name}</span>
                            </div>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                              {o.code}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      💡 Managers & staff can be assigned to multiple branches. During billing, they can choose which branch to bill for.
                    </p>
                  </div>
                )}
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
                  {isSaving ? 'Saving...' : editingUser ? 'Update Staff' : 'Create Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
