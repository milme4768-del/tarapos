import React from 'react';
import { X, Plus, Check } from 'lucide-react';

export default function VariantModal({ product, isOpen, onClose, onSelectVariant, currency = 'Rs. ' }) {
  if (!isOpen || !product) return null;

  const displayCurrency = currency && currency !== '₹' ? currency : 'Rs. ';
  const activeVariants = (product.variants || []).filter((v) => v.isActive !== false);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-lg leading-tight">{product.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Select your preferred portion / variant</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Variants List */}
        <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {activeVariants.map((variant) => (
            <button
              key={variant._id}
              onClick={() => {
                onSelectVariant(product, variant);
                onClose();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 active:scale-[0.99] transition-all text-left group"
            >
              <div>
                <p className="font-semibold text-slate-900 text-base group-hover:text-orange-950">
                  {variant.name}
                </p>
                <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                  <span className="capitalize bg-slate-100 px-2 py-0.5 rounded font-medium">
                    {variant.quantity} {variant.unit}
                  </span>
                  {variant.sku && <span className="text-[11px] text-slate-400 font-mono">SKU: {variant.sku}</span>}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-orange-600 group-hover:scale-105 transition-transform">
                  {displayCurrency}{variant.price}
                </span>
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">Tap any variant to instantly add to bill</p>
        </div>
      </div>
    </div>
  );
}
