import React, { useState, useEffect } from 'react';
import {
  ReceiptText,
  Search,
  Filter,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  Edit2,
} from 'lucide-react';
import { getBillsApi, cancelBillApi } from '../api/bills';
import { getOutletsApi } from '../api/outlets';
import { useAuthStore } from '../store/authStore';
import ReceiptModal from '../components/ReceiptModal';
import EditBillModal from '../components/EditBillModal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Bills() {
  const { user, settings } = useAuthStore();
  const [bills, setBills] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, total: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('today');
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [status, setStatus] = useState('');

  // Selected bill for receipt modal
  const [activeBill, setActiveBill] = useState(null);
  // Selected bill for edit modal
  const [editingBill, setEditingBill] = useState(null);

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  useEffect(() => {
    if (isAdmin) {
      getOutletsApi().then((res) => setOutlets(res.data || []));
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchBills();
  }, [pagination.page, dateRange, selectedOutlet, paymentMethod, status]);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        dateRange: dateRange !== 'all' ? dateRange : undefined,
        outletId: selectedOutlet || undefined,
        paymentMethod: paymentMethod || undefined,
        status: status || undefined,
        search: search.trim() || undefined,
      };

      const res = await getBillsApi(params);
      setBills(res.data || []);
      if (res.pagination) {
        setPagination((prev) => ({
          ...prev,
          totalPages: res.pagination.totalPages,
          total: res.pagination.total,
        }));
      }
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchBills();
  };

  const handleCancelBill = async (bill) => {
    const reason = window.prompt(
      `Are you sure you want to cancel bill ${bill.billNumber}?\nPlease enter a reason:`,
      'Customer requested cancellation'
    );
    if (!reason) return;

    try {
      await cancelBillApi(bill._id, reason);
      setActiveBill(null);
      fetchBills();
    } catch (err) {
      alert(`Failed to cancel bill: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">Bill History</h1>
          <p className="text-xs text-slate-500">
            {isAdmin ? 'View and search bills across all branches' : 'View bills generated for your outlet'}
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 w-fit">
          Total Bills: <span className="text-orange-600 font-bold">{pagination.total}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xs border border-slate-200 space-y-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Bill No (OUT1-2026-000001), Customer Phone, or Name..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {/* Date Filters & Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 max-w-full">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'thisWeek', label: 'This Week' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'all', label: 'All Time' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setDateRange(tab.id);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  dateRange === tab.id
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 ml-auto">
            {isAdmin && (
              <select
                value={selectedOutlet}
                onChange={(e) => {
                  setSelectedOutlet(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium"
              >
                <option value="">All Outlets</option>
                {outlets.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.name} ({o.code})
                  </option>
                ))}
              </select>
            )}

            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium"
            >
              <option value="">All Modes</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bills Table / List */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading bills history..." />
        ) : bills.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No bills found"
            description="No completed bills match your current filters or date range."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-3 sm:px-4">Bill No</th>
                  <th className="py-3 px-3 sm:px-4">Date & Time</th>
                  {isAdmin && <th className="py-3 px-3 sm:px-4">Outlet</th>}
                  <th className="py-3 px-3 sm:px-4">Customer</th>
                  <th className="py-3 px-3 sm:px-4">Items</th>
                  <th className="py-3 px-3 sm:px-4">Payment</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Grand Total</th>
                  <th className="py-3 px-3 sm:px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {bills.map((bill) => {
                  const isCancelled = bill.status === 'cancelled';
                  return (
                    <tr
                      key={bill._id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCancelled ? 'bg-red-50/40 text-slate-400' : ''
                      }`}
                    >
                      <td className="py-3 px-3 sm:px-4 font-mono font-bold text-slate-900">
                        {bill.billNumber}
                        {isCancelled && (
                          <span className="block text-[10px] text-red-600 font-sans font-bold uppercase">
                            VOID / CANCELLED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-600 text-xs">
                        {new Date(bill.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })}
                        ,{' '}
                        {new Date(bill.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-3 sm:px-4">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                            {bill.outletId?.name || 'Branch'}
                          </span>
                        </td>
                      )}
                      <td className="py-3 px-3 sm:px-4">
                        <p className="font-semibold text-slate-900">
                          {bill.customerSnapshot?.name || 'Guest'}
                        </p>
                        {bill.customerSnapshot?.mobile && (
                          <p className="text-[11px] text-slate-500 font-mono">
                            {bill.customerSnapshot.mobile}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-600">
                        {bill.items?.length || 0} item(s)
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold uppercase">
                          {bill.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right font-extrabold text-slate-900 text-sm">
                        {bill.outletId?.currency && bill.outletId?.currency !== '₹' ? bill.outletId.currency : 'Rs. '}
                        {bill.grandTotal?.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setActiveBill(bill)}
                            className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                            title="View Receipt"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          {!isCancelled && (
                            <button
                              onClick={() => setEditingBill(bill)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                              title="Edit / Modify Bill"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-orange-600" />
                              <span>Edit</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} bills)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bill Receipt Viewer & Print Modal */}
      <ReceiptModal
        bill={activeBill}
        isOpen={Boolean(activeBill)}
        canCancel={isAdmin || isManager}
        canEdit={true}
        restaurantName={settings?.restaurantName}
        onClose={() => setActiveBill(null)}
        onCancelBill={handleCancelBill}
        onEditBill={(b) => setEditingBill(b)}
      />

      {/* Edit Bill Modal */}
      <EditBillModal
        isOpen={Boolean(editingBill)}
        bill={editingBill}
        onClose={() => setEditingBill(null)}
        onSuccess={(updatedBill) => {
          setEditingBill(null);
          fetchBills();
          if (activeBill && activeBill._id === updatedBill._id) {
            setActiveBill(updatedBill);
          }
        }}
      />
    </div>
  );
}
