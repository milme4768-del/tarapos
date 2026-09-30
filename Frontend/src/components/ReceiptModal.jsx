import React, { useState, useEffect } from 'react';
import { X, Download, Share2, Printer, AlertTriangle, Edit2, Phone, Trash2, Image as ImageIcon } from 'lucide-react';
import { generateReceiptPDF, shareBillOnWhatsApp } from '../utils/receiptGenerator';

export default function ReceiptModal({
  bill,
  isOpen,
  onClose,
  onCancelBill,
  onEditBill,
  canCancel,
  canDelete = false,
  onDeleteBill,
  canEdit = true,
  restaurantName,
}) {
  if (!isOpen || !bill) return null;

  const outlet = bill.outletId || {};
  const currency = outlet.currency && outlet.currency !== '₹' ? outlet.currency : 'Rs. ';

  const [customPhone, setCustomPhone] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  useEffect(() => {
    if (bill?.customerSnapshot?.mobile) {
      setCustomPhone(bill.customerSnapshot.mobile);
    } else {
      setCustomPhone('');
    }
    setShowPhoneInput(false);
  }, [bill]);

  const handleWhatsApp = (format = 'pdf') => {
    shareBillOnWhatsApp(bill, outlet, null, restaurantName, customPhone.trim(), format);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Receipt Preview</h3>
            <p className="text-xs text-slate-500 font-mono">{bill.billNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Body styled like a thermal paper receipt */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 space-y-3 bg-slate-50/50" id="printable-receipt">
          <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide font-sans text-slate-900 leading-tight">
              {restaurantName || 'Taraaang Organic Food PVT LTD'}
            </h2>
            {outlet?.name && <p className="text-slate-600 font-sans">{outlet.name}</p>}
            {outlet?.address && <p className="text-[11px] text-slate-500 font-sans">{outlet.address}</p>}
            {outlet?.phone && <p className="text-[11px] text-slate-500">Ph: {outlet.phone}</p>}
          </div>

          <div className="space-y-1 py-1 border-b border-dashed border-slate-300">
            <div className="flex justify-between">
              <span>Bill No:</span>
              <span className="font-bold">{bill.billNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(bill.createdAt).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Billed By:</span>
              <span>{bill.createdBy?.name || 'Staff'}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{bill.customerSnapshot?.name || 'Guest'}</span>
            </div>
            {bill.customerSnapshot?.mobile && (
              <div className="flex justify-between">
                <span>Phone:</span>
                <span>{bill.customerSnapshot.mobile}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Status:</span>
              <span
                className={`font-bold uppercase ${
                  bill.status === 'completed' ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {bill.status}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="py-1 border-b border-dashed border-slate-300 space-y-1.5">
            <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-1">
              <span className="w-1/2">Item</span>
              <span className="w-1/6 text-center">Qty</span>
              <span className="w-1/6 text-right">Rate</span>
              <span className="w-1/6 text-right">Amt</span>
            </div>
            {bill.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-[11px]">
                <span className="w-1/2 font-sans font-medium text-slate-800">
                  {item.productName} <span className="text-slate-500 text-[10px]">({item.variantName})</span>
                </span>
                <span className="w-1/6 text-center">{item.quantity}</span>
                <span className="w-1/6 text-right">{item.unitPrice}</span>
                <span className="w-1/6 text-right font-semibold">{item.lineTotal}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 pt-1 border-b border-dashed border-slate-300 pb-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{currency}{bill.subtotal?.toFixed(2)}</span>
            </div>
            {bill.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount ({bill.discountType === 'percentage' ? `${bill.discountValue || ''}%` : 'Flat'}):</span>
                <span>-{currency}{bill.discount?.toFixed(2)}</span>
              </div>
            )}
            {bill.tax > 0 && (
              <div className="flex justify-between">
                <span>Tax ({bill.taxPercentage}%):</span>
                <span>{currency}{bill.tax?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-300">
              <span>GRAND TOTAL:</span>
              <span>{currency}{bill.grandTotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Payment Mode:</span>
              <span className="uppercase font-semibold">{bill.paymentMethod}</span>
            </div>
          </div>

          {bill.cancellationReason && (
            <div className="p-2 bg-red-50 text-red-700 rounded text-[11px] border border-red-200">
              <p className="font-bold">Cancellation Reason:</p>
              <p>{bill.cancellationReason}</p>
            </div>
          )}

          <div className="text-center pt-2 font-sans text-[11px] text-slate-500">
            <p>Thank you for visiting {restaurantName || 'Taraaang Organic Food PVT LTD'}!</p>
            <p className="text-[10px]">Please visit again</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-2.5">
          {/* WhatsApp Phone confirmation / quick-edit row */}
          {showPhoneInput ? (
            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[11px] text-emerald-800 font-medium">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Enter WhatsApp Number:
                </span>
                <button
                  type="button"
                  onClick={() => setShowPhoneInput(false)}
                  className="text-slate-400 hover:text-slate-600 text-[10px]"
                >
                  Cancel
                </button>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono focus:outline-emerald-600"
                />
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="truncate">
                Customer: <strong className="text-slate-800 font-sans">{bill.customerSnapshot?.name || 'Walk-in'}</strong>
                {bill.customerSnapshot?.mobile && (
                  <span className="font-mono text-slate-600 ml-1">({bill.customerSnapshot.mobile})</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setShowPhoneInput(true)}
                className="text-[11px] text-emerald-700 hover:underline font-medium cursor-pointer"
              >
                Change #
              </button>
            </div>
          )}

          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => generateReceiptPDF(bill, outlet, restaurantName)}
              className="flex items-center justify-center space-x-1 py-2 px-1 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs active:scale-[0.98] transition-all"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={() => handleWhatsApp('pdf')}
              className="flex items-center justify-center space-x-1 py-2 px-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs active:scale-[0.98] transition-all"
              title="Send Bill PDF on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WA (PDF)</span>
            </button>
            <button
              type="button"
              onClick={() => handleWhatsApp('image')}
              className="flex items-center justify-center space-x-1 py-2 px-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs active:scale-[0.98] transition-all"
              title="Send Bill JPG Image on WhatsApp"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>WA (JPG)</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center justify-center space-x-1 py-2 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-300 cursor-pointer active:scale-[0.98] transition-all"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>

          {/* Edit Bill Button */}
          {canEdit && bill.status === 'completed' && onEditBill && (
            <button
              onClick={() => {
                onClose();
                onEditBill(bill);
              }}
              className="w-full flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-orange-600" />
              <span>Edit / Modify Bill</span>
            </button>
          )}

          {canCancel && bill.status === 'completed' && (
            <button
              onClick={() => onCancelBill && onCancelBill(bill)}
              className="w-full flex items-center justify-center space-x-1.5 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl border border-red-200 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Cancel / Void Bill</span>
            </button>
          )}

          {canDelete && (
            <button
              onClick={() => onDeleteBill && onDeleteBill(bill)}
              className="w-full flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 rounded-xl border border-rose-200 hover:border-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Bill Permanently</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
