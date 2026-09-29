import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, CheckCircle, XCircle, X, AlertCircle } from 'lucide-react';
import {
  getCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
} from '../../api/products';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function CategoriesManager() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await getCategoriesApi(true);
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', sortOrder: categories.length + 1, isActive: true });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      sortOrder: cat.sortOrder || 0,
      isActive: cat.isActive !== false,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      if (editingCategory) {
        await updateCategoryApi(editingCategory._id, formData);
      } else {
        await createCategoryApi(formData);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save category.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    try {
      await deleteCategoryApi(cat._id);
      fetchCategories();
    } catch (err) {
      alert(`Cannot delete: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">Food Categories</h1>
          <p className="text-xs text-slate-500">
            Organize menu tabs on the POS billing screen
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-600/20 transition-all w-fit cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading categories..." />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No categories"
            description="Add food categories to organize your food catalog."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {categories.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">{c.sortOrder}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          c.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingCategory ? 'Edit Category' : 'Create Category'}
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
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Biryani"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Display Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="cat-active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded border-slate-300"
                />
                <label htmlFor="cat-active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Show on POS Billing Screen
                </label>
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
                  {isSaving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
