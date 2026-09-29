import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Percent,
  Banknote,
  Save,
  AlertCircle,
  ShoppingBag,
  User,
  Phone,
} from 'lucide-react';
import { updateBillApi } from '../api/bills';
import { getActiveCatalogApi } from '../api/products';

export default function EditBillModal({ isOpen, bill, onClose, onBillUpdated, onSuccess, currency = 'Rs. ' }) {
  if (!isOpen || !bill) return null;

  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState({ name: '', mobile: '' });
  const [discountType, setDiscountType] = useState('flat');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Catalog for adding new items to bill
  const [catalog, setCatalog] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');

  // Manual custom item mode
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualQty, setManualQty] = useState(1);
  const [manualUnit, setManualUnit] = useState('plate');

  // Initialize from existing bill
  useEffect(() => {
    if (bill) {
      setItems(
        (bill.items || []).map((i) => ({
          productId: i.productId?._id || i.productId || null,
          productName: i.productName,
          variantId: i.variantId?._id || i.variantId || ('custom_' + Math.random().toString(36).substring(2, 6)),
          variantName: i.variantName || 'Standard',
          unit: i.unit || 'unit',
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.lineTotal,
          isCustom: Boolean(i.isCustom || !i.productId),
        }))
      );
      setCustomer({
        name: bill.customerSnapshot?.name || '',
        mobile: bill.customerSnapshot?.mobile || '',
      });
      setDiscountType(bill.discountType || 'flat');
      setDiscountValue(bill.discountValue || bill.discount || 0);
      setPaymentMethod(bill.paymentMethod || 'cash');
      setNotes(bill.notes || '');
      setErrorMsg('');
    }
  }, [bill]);

  // Load catalog for adding extra items
  useEffect(() => {
    getActiveCatalogApi()
      .then((res) => setCatalog(res.data || []))
      .catch((err) => console.error('Failed to load menu catalog in edit modal:', err));
  }, []);

  // Update item quantity
  const handleUpdateQty = (index, delta) => {
    const updated = [...items];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
      updated[index].lineTotal = Number((newQty * updated[index].unitPrice).toFixed(2));
    }
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  // Add new item from catalog
  const handleAddCatalogItem = () => {
    if (!selectedProductId || !selectedVariantId) return;

    const prod = catalog.find((p) => p._id === selectedProductId);
    if (!prod) return;
    const variant = (prod.variants || []).find((v) => v._id === selectedVariantId);
    if (!variant) return;

    const existingIndex = items.findIndex((i) => i.variantId === variant._id);
    if (existingIndex > -1) {
      handleUpdateQty(existingIndex, 1);
    } else {
      setItems([
        ...items,
        {
          productId: prod._id,
          productName: prod.name,
          variantId: variant._id,
          variantName: variant.name,
          unit: variant.unit || 'plate',
          quantity: 1,
          unitPrice: variant.price,
          lineTotal: variant.price,
        },
      ]);
    }

    setSelectedVariantId('');
  };

  // Add manual custom item
  const handleAddManualItem = () => {
    const cleanName = manualName.trim();
    if (!cleanName) return;
    const rate = Math.max(0, parseFloat(manualPrice) || 0);
    const qty = Math.max(1, parseInt(manualQty, 10) || 1);
    const customId = 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    setItems([
      ...items,
      {
        productId: null,
        variantId: customId,
        productName: cleanName,
        variantName: 'Custom',
        unit: manualUnit || 'unit',
        quantity: qty,
        unitPrice: rate,
        lineTotal: Number((qty * rate).toFixed(2)),
        isCustom: true,
      },
    ]);

    setManualName('');
    setManualPrice('');
    setManualQty(1);
    setIsAddingManual(false);
  };

  // Calculations
  const subtotal = Number(
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2)
  );

  let discountAmt = 0;
  if (discountType === 'percentage') {
    const pct = Math.max(0, Math.min(100, Number(discountValue) || 0));
    discountAmt = Number(((subtotal * pct) / 100).toFixed(2));
  } else {
    discountAmt = Number(Math.min(subtotal, Math.max(0, Number(discountValue) || 0)).toFixed(2));
  }

  const taxable = Math.max(0, subtotal - discountAmt);
  const taxRate = Number(bill.taxPercentage || 0);
  const taxAmt = Number(((taxable * taxRate) / 100).toFixed(2));
  const grandTotal = Number((taxable + taxAmt).toFixed(2));

  // Save changes
  const handleSave = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      setErrorMsg('The bill must contain at least one item.');
      return;
    }

    const cleanMobile = (customer.mobile || '').trim();
    const cleanName = (customer.name || '').trim();

    if (!cleanMobile || cleanMobile.replace(/\D/g, '').length < 10) {
      setErrorMsg('Customer Mobile Number is mandatory (minimum 10 digits required).');
      return;
    }

    if (!cleanName) {
      setErrorMsg('Customer Name is mandatory.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        customer: {
          name: cleanName,
          mobile: cleanMobile,
        },
        items: items.map((i) => ({
          productId: i.productId || null,
          variantId: i.isCustom ? null : i.variantId,
          productName: i.productName,
          variantName: i.variantName || 'Custom',
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          unit: i.unit || 'unit',
          lineTotal: i.lineTotal,
          isCustom: Boolean(i.isCustom),
        })),
        discountType,
        discountValue: Number(discountValue) || 0,
        discount: discountAmt,
        paymentMethod,
        notes,
      };

      const res = await updateBillApi(bill._id, payload);
      if (res.success) {
        if (onSuccess) onSuccess(res.data.bill, res.data.whatsappLink);
        if (onBillUpdated) onBillUpdated(res.data.bill, res.data.whatsappLink);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update bill.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedProduct = catalog.find((p) => p._id === selectedProductId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Edit Bill</h3>
            <p className="text-xs text-slate-500 font-mono font-semibold">{bill.billNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-center space-x-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Customer Inputs (Mandatory) */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer Mobile <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  value={customer.mobile}
                  onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })}
                  placeholder="9876543210"
                  maxLength={14}
                  className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Items in Bill */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Bill Items ({items.length})
            </label>
            <div className="space-y-2 border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 max-h-48 overflow-y-auto divide-y divide-slate-100">
              {items.map((item, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <p className="font-bold text-slate-800 text-xs truncate">{item.productName}</p>
                      {item.isCustom && (
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {item.variantName} • {currency}{item.unitPrice}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, -1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-l-lg"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-slate-900">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-r-lg"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-bold text-slate-900 w-14 text-right">
                      {currency}{item.lineTotal.toFixed(2)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add extra item section (Catalog or Manual Custom) */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                <Plus className="w-3 h-3 text-orange-600" />
                <span>Add Item to Bill</span>
              </span>
              <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setIsAddingManual(false)}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    !isAddingManual ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  From Menu
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingManual(true)}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    isAddingManual ? 'bg-orange-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  + Custom Food
                </button>
              </div>
            </div>

            {!isAddingManual ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    setSelectedVariantId('');
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                >
                  <option value="">Choose Food Item</option>
                  {catalog.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <div className="flex space-x-1.5">
                  <select
                    disabled={!selectedProductId}
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs disabled:opacity-40"
                  >
                    <option value="">Portion / Variant</option>
                    {(selectedProduct?.variants || [])
                      .filter((v) => v.isActive !== false)
                      .map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.name} ({currency}{v.price})
                        </option>
                      ))}
                  </select>

                  <button
                    type="button"
                    disabled={!selectedVariantId}
                    onClick={handleAddCatalogItem}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-lg font-bold text-xs cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 bg-white p-2.5 rounded-lg border border-orange-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Custom Item Name"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="sm:col-span-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                  />
                  <div className="flex space-x-1.5">
                    <input
                      type="number"
                      placeholder="Rate (Rs.)"
                      min="0"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      className="w-20 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={manualQty}
                      onChange={(e) => setManualQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-14 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center font-bold"
                    />
                    <button
                      type="button"
                      disabled={!manualName.trim()}
                      onClick={handleAddManualItem}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-lg font-bold text-xs cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Discount Section (Flat or %) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Discount Option
              </span>

              {/* Flat / % Toggle */}
              <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDiscountType('flat')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors ${
                    discountType === 'flat'
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Rs. Flat
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors ${
                    discountType === 'percentage'
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  % Percentage
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-2 text-slate-400 font-bold">
                  {discountType === 'percentage' ? '%' : 'Rs.'}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  max={discountType === 'percentage' ? 100 : subtotal}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percentage' ? 'e.g. 10%' : 'e.g. 50'}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                />
              </div>

              {discountAmt > 0 && (
                <span className="text-emerald-700 font-bold text-xs">
                  - {currency}{discountAmt.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Payment Mode
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {['cash', 'upi', 'card', 'other'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMethod(mode)}
                  className={`py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                    paymentMethod === mode
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Totals Preview */}
          <div className="pt-2 border-t border-slate-200 space-y-1">
            <div className="flex justify-between text-slate-600 text-xs">
              <span>Subtotal:</span>
              <span>{currency}{subtotal.toFixed(2)}</span>
            </div>

            {discountAmt > 0 && (
              <div className="flex justify-between text-emerald-700 text-xs font-semibold">
                <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Flat'}):</span>
                <span>-{currency}{discountAmt.toFixed(2)}</span>
              </div>
            )}

            {taxAmt > 0 && (
              <div className="flex justify-between text-slate-600 text-xs">
                <span>Tax ({taxRate}%):</span>
                <span>{currency}{taxAmt.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm font-bold pt-1 border-t border-slate-200">
              <span>New Grand Total:</span>
              <span className="text-base text-emerald-700 font-extrabold">
                {currency}{grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || items.length === 0}
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-orange-600/25 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Updating...' : `Save & Update (${currency}${grandTotal.toFixed(2)})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
