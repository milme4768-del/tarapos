import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  Plus,
  Minus,
  Trash2,
  Receipt,
  User,
  Phone,
  CreditCard,
  Banknote,
  QrCode,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Flame,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Utensils,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { getActiveCatalogApi } from '../api/products';
import { lookupCustomerApi } from '../api/customers';
import { createBillApi } from '../api/bills';
import VariantModal from '../components/VariantModal';
import BillSuccessModal from '../components/BillSuccessModal';
import EditBillModal from '../components/EditBillModal';
import AddCustomItemModal from '../components/AddCustomItemModal';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Billing() {
  const { user, settings } = useAuthStore();
  const {
    items,
    customer,
    paymentMethod,
    discountType,
    discountValue,
    notes,
    clientRequestId,
    isOnline,
    setOnlineStatus,
    addItem,
    addCustomItem,
    updateQuantity,
    removeItem,
    setCustomer,
    setPaymentMethod,
    setDiscount,
    setDiscountType,
    setNotes,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getGrandTotal,
    getTotalCount,
  } = useCartStore();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Selected product for variant modal
  const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);

  // Success modal state
  const [completedBillData, setCompletedBillData] = useState(null);
  const [billToEdit, setBillToEdit] = useState(null);

  // Manual custom item modal state
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);

  // Mobile cart drawer open state
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Phone lookup debounce
  const lookupTimeoutRef = useRef(null);

  const outlet = user?.outletId || {};
  const currency = 'Rs. ';
  const taxPercentage = Number(outlet?.taxPercentage ?? settings?.defaultTaxPercentage ?? 0);

  // Listen to online/offline network events
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  // Load Active Catalog on mount
  useEffect(() => {
    loadActiveCatalog();
  }, []);

  const loadActiveCatalog = async () => {
    setIsLoadingCatalog(true);
    try {
      const res = await getActiveCatalogApi();
      const loadedProducts = res.data || [];
      setProducts(loadedProducts);

      // Extract unique categories from active products
      const categoryMap = new Map();
      loadedProducts.forEach((p) => {
        if (p.categoryId && p.categoryId._id) {
          categoryMap.set(p.categoryId._id, p.categoryId);
        }
      });
      const uniqueCats = Array.from(categoryMap.values()).sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
      );
      setCategories(uniqueCats);
    } catch (err) {
      console.error('Failed to load active products:', err);
      setErrorMessage('Could not load products. Please check connection and refresh.');
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  // Instant local memoized search and category filtering
  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory !== 'all') {
      result = result.filter(
        (p) => p.categoryId?._id === selectedCategory || p.categoryId === selectedCategory
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesSku = p.sku && p.sku.toLowerCase().includes(query);
        const matchesDesc = p.description && p.description.toLowerCase().includes(query);
        const matchesVariant = p.variants?.some(
          (v) =>
            v.name.toLowerCase().includes(query) || (v.sku && v.sku.toLowerCase().includes(query))
        );
        return matchesName || matchesSku || matchesDesc || matchesVariant;
      });
    }

    return result;
  }, [products, selectedCategory, searchQuery]);

  // Tap product handler:
  // Section 43 UX Rule: If 1 active variant, add immediately! If multiple, open modal.
  const handleProductTap = (product) => {
    const activeVariants = (product.variants || []).filter((v) => v.isActive !== false);

    if (activeVariants.length === 0) {
      return;
    }

    if (activeVariants.length === 1) {
      // Direct fast-add with 0 extra taps
      addItem(product, activeVariants[0], 1);
    } else {
      // Multiple variants: open variant picker modal
      setSelectedProductForVariant(product);
    }
  };

  // Handle phone number change with smart customer lookup
  const handleMobileChange = (e) => {
    const val = e.target.value;
    setCustomer({ mobile: val });

    if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current);

    if (val.trim().length >= 10) {
      lookupTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await lookupCustomerApi(val);
          if (res.data && res.data.name) {
            // Auto-fill customer name if already in customer DB!
            setCustomer({ name: res.data.name });
          }
        } catch (err) {
          // Ignore lookup failure
        }
      }, 350);
    }
  };

  // Bill Generation Handler
  const handleGenerateBill = async () => {
    if (items.length === 0) {
      setErrorMessage('Your bill cart is empty. Please add items before generating a bill.');
      return;
    }

    const cleanMobile = (customer.mobile || '').trim();
    const cleanName = (customer.name || '').trim();

    if (!cleanMobile || cleanMobile.replace(/\D/g, '').length < 10) {
      setErrorMessage('Customer Mobile Number is mandatory (minimum 10 digits required).');
      if (!isMobileCartOpen && window.innerWidth < 1024) {
        setIsMobileCartOpen(true);
      }
      return;
    }

    if (!cleanName) {
      setErrorMessage('Customer Name is mandatory.');
      if (!isMobileCartOpen && window.innerWidth < 1024) {
        setIsMobileCartOpen(true);
      }
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const discountAmount = getDiscountAmount();
      const payload = {
        clientRequestId,
        outletId: outlet._id,
        customer: {
          name: cleanName,
          mobile: cleanMobile,
        },
        items: items.map((i) => ({
          productId: i.productId || null,
          variantId: i.isCustom ? null : i.variantId,
          productName: i.productName,
          variantName: i.variantName || 'Custom',
          unitPrice: i.price,
          unit: i.unit || 'unit',
          quantity: i.quantity,
          isCustom: Boolean(i.isCustom),
        })),
        discountType,
        discountValue: Number(discountValue) || 0,
        discount: discountAmount,
        paymentMethod,
        notes: notes ? notes.trim() : '',
      };

      const response = await createBillApi(payload);

      if (response.success) {
        setCompletedBillData(response.data);
        clearCart();
        setIsMobileCartOpen(false);
      }
    } catch (err) {
      console.error('Bill creation error:', err);
      setErrorMessage(err.message || 'Unable to generate bill. Your cart is preserved.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const tax = getTaxAmount(taxPercentage);
  const grandTotal = getGrandTotal(taxPercentage);
  const totalCount = getTotalCount();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-100 flex flex-col pb-20 lg:pb-6">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-red-600 text-white text-xs px-4 py-2 flex items-center justify-between font-medium">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Connection lost. Your current bill cart is safe on this device.</span>
          </div>
          <span className="text-[11px] bg-red-700 px-2 py-0.5 rounded">Offline Mode</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full p-2.5 sm:p-4 lg:p-6 flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Left Column: Products Catalog & Search */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Search Bar */}
          <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-xs border border-slate-200 mb-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food by name, variant, or SKU..."
                className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Pills Slider */}
            <div className="flex items-center space-x-1.5 mt-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none no-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Items ({products.length})
              </button>

              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryId?._id === cat._id).length;
                return (
                  <button
                    key={cat._id}
                    onClick={() => setSelectedCategory(cat._id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1 ${
                      selectedCategory === cat._id
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="opacity-75 text-[10px]">({count})</span>
                  </button>
                );
              })}

              {/* Quick Custom Item Button in category bar */}
              <button
                type="button"
                onClick={() => setIsCustomItemModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 bg-gradient-to-r from-amber-50 to-orange-50 text-orange-700 border border-orange-200 hover:border-orange-400 hover:bg-orange-100 cursor-pointer shadow-2xs"
                title="Add unlisted / manual food item"
              >
                <Plus className="w-3.5 h-3.5 text-orange-600" />
                <span>+ Custom Item</span>
              </button>
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="flex-1">
            {isLoadingCatalog ? (
              <LoadingSpinner message="Loading food menu..." />
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-200 space-y-3">
                <p className="text-slate-500 text-sm font-medium">No food items found matching your filter.</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs font-bold text-slate-600 hover:underline px-3 py-1.5 bg-slate-100 rounded-lg"
                    >
                      Clear search
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsCustomItemModalOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Manual / Custom Food</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
                {filteredProducts.map((product) => {
                  const activeVariants = (product.variants || []).filter((v) => v.isActive !== false);
                  const minPrice =
                    activeVariants.length > 0
                      ? Math.min(...activeVariants.map((v) => v.price))
                      : 0;
                  const isMultiVariant = activeVariants.length > 1;

                  // Find how many of this product are in current cart
                  const inCartCount = items
                    .filter((i) => i.productId === product._id)
                    .reduce((sum, i) => sum + i.quantity, 0);

                  return (
                    <div
                      key={product._id}
                      onClick={() => handleProductTap(product)}
                      className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 hover:border-orange-400 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between relative group select-none"
                    >
                      {/* Popular / In-cart badges */}
                      <div className="flex items-center justify-between mb-1.5">
                        {product.isPopular ? (
                          <span className="inline-flex items-center space-x-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                            <Flame className="w-2.5 h-2.5" />
                            <span>Popular</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {product.categoryId?.name || 'Food'}
                          </span>
                        )}

                        {inCartCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
                            {inCartCount}
                          </span>
                        )}
                      </div>

                      {/* Product Name & Description */}
                      <div className="my-1">
                        <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                          {product.name}
                        </h4>
                        {product.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {product.description}
                          </p>
                        )}
                      </div>

                      {/* Price & Variant Pill */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-base font-extrabold text-orange-600 leading-none">
                            {currency}{minPrice}
                            {isMultiVariant && <span className="text-[11px] font-normal text-slate-400">+</span>}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {isMultiVariant
                              ? `${activeVariants.length} options`
                              : activeVariants[0]?.name || 'Standard'}
                          </p>
                        </div>

                        <div className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white flex items-center justify-center transition-colors">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Desktop Cart Panel */}
        <div className="hidden lg:flex flex-col w-96 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden shrink-0 h-fit sticky top-20">
          {/* Cart Header */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-orange-600" />
              <h3 className="font-bold text-slate-900 text-sm">Current Bill Cart</h3>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-red-600 hover:text-red-700 font-semibold hover:underline"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="p-3.5 space-y-2.5 max-h-[320px] overflow-y-auto divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30 text-orange-600" />
                <p className="text-xs font-medium">Cart is empty</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Tap food items to add to bill</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.variantId} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <p className="font-bold text-slate-800 truncate">{item.productName}</p>
                      {item.isCustom && (
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {item.variantName} • {currency}{item.price}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button
                        onClick={() => updateQuantity(item.variantId, -1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-l-lg transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variantId, 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-r-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-bold text-slate-900 w-14 text-right">
                      {currency}{item.lineTotal.toFixed(2)}
                    </span>

                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer & Billing Form */}
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 space-y-3">
            {/* Customer Inputs (Mandatory) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                  Mobile (WhatsApp) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    value={customer.mobile}
                    onChange={handleMobileChange}
                    placeholder="9876543210"
                    maxLength={14}
                    className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(e) => setCustomer({ name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Mode Pills */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Payment Method
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'cash', label: 'Cash', icon: Banknote },
                  { id: 'upi', label: 'UPI', icon: QrCode },
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'other', label: 'Other', icon: Receipt },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = paymentMethod === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMethod(mode.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center space-y-0.5 border transition-all ${
                        isSelected
                          ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[10px]">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discount Option (Flat or %) */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  Discount Option
                </span>
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDiscountType('flat')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                      discountType === 'flat'
                        ? 'bg-orange-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Rs. Flat
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                      discountType === 'percentage'
                        ? 'bg-orange-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    % Percent
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">
                    {discountType === 'percentage' ? '%' : 'Rs.'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    max={discountType === 'percentage' ? 100 : subtotal}
                    value={discountValue || ''}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder={discountType === 'percentage' ? 'e.g. 10%' : 'e.g. 50'}
                    className="w-full pl-8 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                {discountAmount > 0 && (
                  <span className="text-emerald-700 font-bold text-xs shrink-0">
                    - {currency}{discountAmount.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Totals Summary */}
            <div className="space-y-1 pt-2 border-t border-slate-200 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{currency}{subtotal.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Flat'}):</span>
                  <span>-{currency}{discountAmount.toFixed(2)}</span>
                </div>
              )}

              {taxPercentage > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({taxPercentage}%):</span>
                  <span>{currency}{tax.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-lg text-emerald-700">
                  {currency}{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-2 bg-red-50 text-red-700 text-[11px] rounded-lg border border-red-200">
                {errorMessage}
              </div>
            )}

            {/* Submit Generate Bill Button */}
            <button
              onClick={handleGenerateBill}
              disabled={isSubmitting || items.length === 0}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-orange-600/30 transition-all cursor-pointer"
            >
              <span>{isSubmitting ? 'Validating & Printing...' : `Generate Bill (${currency}${grandTotal.toFixed(2)})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Summary Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-xl px-4 py-2.5 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium">{totalCount} item(s) selected</p>
          <p className="text-lg font-black text-slate-900 leading-tight">
            {currency}{grandTotal.toFixed(2)}
          </p>
        </div>

        <button
          onClick={() => setIsMobileCartOpen(true)}
          disabled={items.length === 0}
          className="flex items-center space-x-1.5 py-2.5 px-5 bg-orange-600 hover:bg-orange-700 active:scale-95 disabled:opacity-40 text-white rounded-xl font-bold text-sm shadow-md shadow-orange-600/25 transition-all"
        >
          <span>VIEW BILL</span>
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Cart Drawer (Slides up from bottom when "VIEW BILL" is tapped) */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-slate-900 text-base">Your Bill Cart</h3>
              </div>
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Items */}
            <div className="p-4 space-y-3 overflow-y-auto max-h-[40vh] divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.variantId} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{item.productName}</p>
                    <p className="text-slate-500">
                      {item.variantName} • {currency}{item.price}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button
                        onClick={() => updateQuantity(item.variantId, -1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-700"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variantId, 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-bold text-slate-900 w-14 text-right">
                      {currency}{item.lineTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Customer and Payment Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                    Customer Mobile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customer.mobile}
                    onChange={handleMobileChange}
                    placeholder="9876543210"
                    maxLength={14}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(e) => setCustomer({ name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Payment selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['cash', 'upi', 'card', 'other'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setPaymentMethod(mode)}
                      className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                        paymentMethod === mode
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount Section (Flat or %) */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Discount Option
                  </span>
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDiscountType('flat')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                        discountType === 'flat'
                          ? 'bg-orange-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Rs. Flat
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('percentage')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                        discountType === 'percentage'
                          ? 'bg-orange-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      % Percent
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">
                      {discountType === 'percentage' ? '%' : 'Rs.'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      max={discountType === 'percentage' ? 100 : subtotal}
                      value={discountValue || ''}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder={discountType === 'percentage' ? 'e.g. 10%' : 'e.g. 50'}
                      className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>
                  {discountAmount > 0 && (
                    <span className="text-emerald-700 font-bold text-xs shrink-0">
                      - {currency}{discountAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Totals */}
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Subtotal:</span>
                  <span>{currency}{subtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 text-xs font-semibold">
                    <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Flat'}):</span>
                    <span>-{currency}{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {taxPercentage > 0 && (
                  <div className="flex justify-between text-slate-600 text-xs">
                    <span>Tax ({taxPercentage}%):</span>
                    <span>{currency}{tax.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm font-bold pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-xl font-black text-emerald-700">
                    {currency}{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-2 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {errorMessage}
                </div>
              )}

              {/* Final Submit */}
              <button
                onClick={handleGenerateBill}
                disabled={isSubmitting || items.length === 0}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 active:scale-95 disabled:opacity-50 text-white rounded-xl font-bold text-base shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <span>{isSubmitting ? 'Generating Bill...' : `Confirm & Bill (${currency}${grandTotal.toFixed(2)})`}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (+ Manual / Custom Item) */}
      <button
        type="button"
        onClick={() => setIsCustomItemModalOpen(true)}
        className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-40 flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-95 text-white py-3 px-4 sm:px-5 rounded-full shadow-2xl shadow-orange-600/40 border border-white/30 backdrop-blur-xs font-bold text-xs sm:text-sm tracking-wide transition-all group cursor-pointer"
        title="Add unlisted / manual food item"
      >
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-200">
          <Plus className="w-4 h-4 text-white" />
        </div>
        <span className="hidden xs:inline sm:inline">+ Custom Item</span>
        <span className="xs:hidden sm:hidden">Custom</span>
      </button>

      {/* Add Custom / Manual Food Modal */}
      <AddCustomItemModal
        isOpen={isCustomItemModalOpen}
        onClose={() => setIsCustomItemModalOpen(false)}
        onAddItem={(newItem) => {
          addCustomItem(newItem);
        }}
        currency={currency}
      />

      {/* Variant Selection Modal */}
      <VariantModal
        product={selectedProductForVariant}
        isOpen={Boolean(selectedProductForVariant)}
        currency={currency}
        onClose={() => setSelectedProductForVariant(null)}
        onSelectVariant={(prod, variant) => addItem(prod, variant, 1)}
      />

      {/* Bill Generated Success Modal */}
      <BillSuccessModal
        isOpen={Boolean(completedBillData)}
        billData={completedBillData}
        outlet={outlet}
        restaurantName={settings?.restaurantName}
        onEditBill={(bill) => setBillToEdit(bill)}
        onNewBill={() => {
          setCompletedBillData(null);
          clearCart();
        }}
      />

      {/* Edit Bill Modal */}
      <EditBillModal
        isOpen={Boolean(billToEdit)}
        bill={billToEdit}
        onClose={() => setBillToEdit(null)}
        onSuccess={(updatedBill) => {
          setBillToEdit(null);
          setCompletedBillData((prev) => (prev ? { ...prev, bill: updatedBill } : null));
        }}
      />
    </div>
  );
}
