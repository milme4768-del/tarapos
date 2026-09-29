import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  PlusCircle,
  AlertCircle,
  Flame,
} from 'lucide-react';
import {
  getProductsAdminApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  getCategoriesApi,
} from '../../api/products';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const STANDARD_UNITS = [
  'plate',
  'piece',
  'packet',
  'cup',
  'glass',
  'bottle',
  'ml',
  'litre',
  'gram',
  'kg',
  'box',
  'portion',
  'serving',
  'custom',
];

export default function ProductsManager() {
  const { settings } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    image: '',
    sku: '',
    isPopular: false,
    variants: [
      { name: 'Standard', quantity: 1, unit: 'plate', price: 100, sku: '', isActive: true },
    ],
  });

  const currency = (settings?.currency && settings?.currency !== '₹') ? settings.currency : 'Rs. ';

  useEffect(() => {
    loadCategories();
    fetchProducts();
  }, [selectedCategory, statusFilter]);

  const loadCategories = async () => {
    try {
      const res = await getCategoriesApi(true);
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await getProductsAdminApi({
        categoryId: selectedCategory || undefined,
        isActive: statusFilter || undefined,
        search: search.trim() || undefined,
        limit: 100,
      });
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      categoryId: categories[0]?._id || '',
      description: '',
      image: '',
      sku: '',
      isPopular: false,
      variants: [
        { name: 'Full Plate', quantity: 1, unit: 'plate', price: 150, sku: '', isActive: true },
      ],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      categoryId: product.categoryId?._id || product.categoryId,
      description: product.description || '',
      image: product.image || '',
      sku: product.sku || '',
      isPopular: Boolean(product.isPopular),
      variants: product.variants.map((v) => ({
        _id: v._id,
        name: v.name,
        quantity: v.quantity,
        unit: v.unit,
        price: v.price,
        sku: v.sku || '',
        isActive: v.isActive !== false,
      })),
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleAddVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: 'Half Plate',
          quantity: 0.5,
          unit: prev.variants[0]?.unit || 'plate',
          price: 90,
          sku: '',
          isActive: true,
        },
      ],
    }));
  };

  const handleRemoveVariant = (index) => {
    if (formData.variants.length <= 1) {
      setFormError('A product must contain at least one variant.');
      return;
    }
    const updated = [...formData.variants];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, variants: updated }));
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...formData.variants];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, variants: updated }));
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.categoryId) {
      setFormError('Product name and category are required.');
      return;
    }

    if (formData.variants.length === 0) {
      setFormError('At least one variant is required.');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      if (editingProduct) {
        await updateProductApi(editingProduct._id, formData);
      } else {
        await createProductApi(formData);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      setFormError(err.message || 'Failed to save product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      await deleteProductApi(product._id);
      fetchProducts();
    } catch (err) {
      alert(`Error toggling status: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">Food Menu & Products</h1>
          <p className="text-xs text-slate-500">
            Manage food catalog, flexible portion variants, prices, and availability
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-600/20 transition-all w-fit cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Food Item</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, variant, or SKU..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
          />
        </form>

        <div className="flex items-center space-x-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 font-medium"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading products list..." />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No food products found"
            description="Create your first food item or adjust your search filter."
            action={
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold"
              >
                Add Product
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Variants & Pricing</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {products.map((p) => (
                  <tr
                    key={p._id}
                    className={`hover:bg-slate-50 transition-colors ${
                      !p.isActive ? 'bg-slate-50/60 opacity-60' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          {p.description && (
                            <p className="text-[11px] text-slate-400 max-w-xs truncate">
                              {p.description}
                            </p>
                          )}
                        </div>
                        {p.isPopular && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                            <Flame className="w-2.5 h-2.5" />
                            <span>Popular</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">
                        {p.categoryId?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {p.variants?.map((v) => (
                          <span
                            key={v._id || v.name}
                            className={`px-2 py-0.5 rounded-lg border text-xs ${
                              v.isActive !== false
                                ? 'bg-orange-50 text-orange-800 border-orange-200'
                                : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                            }`}
                          >
                            <strong>{v.name}:</strong> {currency}{v.price} ({v.quantity} {v.unit})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(p)}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                          p.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {p.isActive ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Disabled</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                        title="Edit Item"
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingProduct ? 'Edit Food Item & Portions' : 'Add New Food Item'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center space-x-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Chicken Dum Biryani"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description of ingredients or preparation"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center space-x-3 pt-1">
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                  />
                  <span>Mark as Popular / Fast-Selling Item</span>
                </label>
              </div>

              {/* Flexible Variants Section */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Flexible Variants & Pricing</h4>
                    <p className="text-[11px] text-slate-500">
                      Support any unit: plate, piece, gram, kg, ml, litre, etc.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-bold transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {formData.variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                    >
                      <div className="flex-1 min-w-[120px]">
                        <input
                          type="text"
                          required
                          value={v.name}
                          onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                          placeholder="Variant (e.g. Full Plate)"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                        />
                      </div>

                      <div className="w-20">
                        <input
                          type="number"
                          step="any"
                          required
                          value={v.quantity}
                          onChange={(e) => handleVariantChange(idx, 'quantity', e.target.value)}
                          placeholder="Qty/Size"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 text-center"
                        />
                      </div>

                      <div className="w-28">
                        <select
                          value={v.unit}
                          onChange={(e) => handleVariantChange(idx, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-medium"
                        >
                          {STANDARD_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-xs text-slate-400 font-bold">
                            {currency}
                          </span>
                          <input
                            type="number"
                            required
                            min="0"
                            step="any"
                            value={v.price}
                            onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                            placeholder="Price"
                            className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        disabled={formData.variants.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded-lg transition-colors self-center"
                        title="Remove Variant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
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
                  {isSaving ? 'Saving Product...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
