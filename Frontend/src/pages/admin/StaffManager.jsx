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
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      outletId: outlets[0]?._id || '',
      phone: '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      outletId: u.outletId?._id || u.outletId || '',
      phone: u.phone || '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
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

    if (formData.role !== 'admin' && !formData.outletId) {
      setErrorMsg('Managers and Billing Staff must be assigned to an outlet.');
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
                      <span className="text-xs text-slate-700 font-semibold">
                        {u.outletId?.name ? `${u.outletId.name} (${u.outletId.code})` : 'All Outlets (HQ)'}
                      </span>
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

              <div className="grid grid-cols-2 gap-2">
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
                    <option value="manager">Outlet Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {formData.role !== 'admin' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Assigned Branch *
                    </label>
                    <select
                      required
                      value={formData.outletId}
                      onChange={(e) => setFormData({ ...formData, outletId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium"
                    >
                      <option value="">Select Branch</option>
                      {outlets.map((o) => (
                        <option key={o._id} value={o._id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
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
