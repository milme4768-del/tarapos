import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Minus, Utensils, CheckCircle2, AlertCircle } from 'lucide-react';

const COMMON_QUICK_ITEMS = [
  'Special Dish',
  'Extra Gravy',
  'Extra Raita',
  'Mineral Water',
  'Cold Drink',
  'Sweet / Dessert',
  'Special Thali',
  'Tandoori Roti (Special)',
];

const COMMON_UNITS = ['plate', 'portion', 'pcs', 'glass', 'bowl', 'bottle', 'cup', 'pack'];

export default function AddCustomItemModal({
  isOpen,
  onClose,
  onAddItem,
  currency = 'Rs. ',
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('plate');
  const [errorMsg, setErrorMsg] = useState('');

  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setPrice('');
      setQuantity(1);
      setUnit('plate');
      setErrorMsg('');
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const numPrice = Math.max(0, parseFloat(price) || 0);
  const numQty = Math.max(1, parseInt(quantity, 10) || 1);
  const calculatedTotal = (numPrice * numQty).toFixed(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('Please enter a food item name.');
      nameInputRef.current?.focus();
      return;
    }

    if (numPrice <= 0 && price === '') {
      setErrorMsg('Please enter a valid rate/price for the item.');
      return;
    }

    onAddItem({
      name: cleanName,
      price: numPrice,
      quantity: numQty,
      unit: unit || 'unit',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/30">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Add Custom / Manual Food</h3>
              <p className="text-xs text-orange-100">Add an unlisted dish or special item directly to bill</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center space-x-2 border border-red-200 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Food Item Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              placeholder="e.g. Special Chicken Curry, Mineral Water 1L"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-400 placeholder:font-normal"
              required
            />

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_QUICK_ITEMS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setName(item)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-600 rounded-md text-[11px] font-medium transition-colors border border-slate-200 cursor-pointer"
                >
                  +{item}
                </button>
              ))}
            </div>
          </div>

          {/* Rate and Quantity */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Rate / Price */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Rate / Price ({currency.trim()}) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {currency.trim()}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono transition-all"
                  required
                />
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Quantity
              </label>
              <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, numQty - 1))}
                  className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full text-center text-sm font-bold text-slate-900 bg-transparent focus:outline-hidden font-mono"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(numQty + 1)}
                  className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Unit / Portion Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Unit / Serving
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-2.5 py-1 rounded-lg text-xs capitalize font-semibold transition-all cursor-pointer border ${
                    unit === u
                      ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Live Calculated Total Banner */}
          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 flex items-center justify-between">
            <span className="text-xs font-medium text-amber-900">Calculated Line Total:</span>
            <span className="text-base font-extrabold text-amber-950 font-mono">
              {currency}{calculatedTotal}
            </span>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-[0.98] transition-all shadow-md shadow-orange-600/20 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Current Bill</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
