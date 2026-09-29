import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Download,
  Share2,
  Printer,
  PlusCircle,
  ArrowRight,
  Phone,
  Edit2,
  Image as ImageIcon,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateReceiptPDF, shareBillOnWhatsApp } from '../utils/receiptGenerator';

export default function BillSuccessModal({
  isOpen,
  billData,
  outlet,
  restaurantName,
  onNewBill,
  onEditBill,
}) {
  if (!isOpen || !billData) return null;

  const { bill, whatsappLink } = billData;
  const currency = 'Rs. ';

  const [sharePhone, setSharePhone] = useState(bill.customerSnapshot?.mobile || '');

  // Fire celebratory confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // Ignore if confetti not supported
    }
  }, []);

  const handleDownloadPDF = () => {
    generateReceiptPDF(bill, outlet, restaurantName);
  };

  const handleWhatsApp = (format = 'pdf') => {
    shareBillOnWhatsApp(bill, outlet, whatsappLink, restaurantName, sharePhone.trim(), format);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 text-center animate-in zoom-in-95 duration-200">
        {/* Top Celebration Banner */}
        <div className="bg-emerald-600 text-white p-5 pt-6 relative overflow-hidden">
          <div className="w-14 h-14 rounded-full bg-emerald-500/50 flex items-center justify-center mx-auto mb-2 border-2 border-white/60 shadow-inner">
            <CheckCircle2 className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Bill Generated!</h2>
          <p className="text-xs text-emerald-100">Saved securely to restaurant database</p>
        </div>

        {/* Bill Summary Details */}
        <div className="p-4 space-y-3">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Bill Number</p>
            <p className="text-base font-mono font-bold text-slate-900 mt-0.5">{bill.billNumber}</p>

            <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Grand Total</span>
              <span className="text-xl font-black text-emerald-700">
                {currency}{bill.grandTotal.toFixed(2)}
              </span>
            </div>

            {bill.discount > 0 && (
              <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
                <span>Discount Applied:</span>
                <span>-{currency}{bill.discount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Customer info & WhatsApp Destination Phone Input */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-left space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-700">
              <span>Customer:</span>
              <strong className="text-slate-900">{bill.customerSnapshot?.name || 'Guest'}</strong>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                WhatsApp Phone Number
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  value={sharePhone}
                  onChange={(e) => setSharePhone(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Will open WhatsApp directly with this phone number
              </p>
            </div>
          </div>

          {/* Main Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* Share on WhatsApp Buttons (PDF or JPG Image) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleWhatsApp('pdf')}
                className="flex items-center justify-center space-x-1.5 py-3 px-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                title="Send Bill PDF to customer on WhatsApp"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp (PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => handleWhatsApp('image')}
                className="flex items-center justify-center space-x-1.5 py-3 px-2 bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                title="Send Bill JPG Image to customer on WhatsApp"
              >
                <ImageIcon className="w-4 h-4" />
                <span>WhatsApp (JPG)</span>
              </button>
            </div>

            {/* Download Bill PDF & Print */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white rounded-xl font-medium text-xs shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-medium text-xs transition-all border border-slate-200 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>

            {/* Edit Bill Immediately if needed */}
            {onEditBill && (
              <button
                onClick={() => onEditBill(bill)}
                className="w-full flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-orange-600" />
                <span>Edit / Modify This Bill</span>
              </button>
            )}

            {/* New Bill Button */}
            <button
              onClick={onNewBill}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white rounded-xl font-bold text-sm shadow-md shadow-orange-600/25 transition-all mt-1 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Bill</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
