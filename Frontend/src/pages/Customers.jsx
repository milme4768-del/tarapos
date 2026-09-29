import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, ChevronLeft, ChevronRight, Eye, Calendar, ArrowRight, X } from 'lucide-react';
import { getCustomersApi, getCustomerByIdApi } from '../api/customers';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Customers() {
  const { settings } = useAuthStore();
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, total: 0 });

  // Selected customer for history details drawer
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const currency = (settings?.currency && settings?.currency !== '₹') ? settings.currency : 'Rs. ';

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await getCustomersApi({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
      });
      setCustomers(res.data || []);
      if (res.pagination) {
        setPagination((prev) => ({
          ...prev,
          totalPages: res.pagination.totalPages,
          total: res.pagination.total,
        }));
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchCustomers();
  };

  const handleOpenCustomer = async (id) => {
    setSelectedCustomerId(id);
    setIsLoadingDetail(true);
    try {
      const res = await getCustomerByIdApi(id);
      setCustomerDetail(res.data);
    } catch (err) {
      console.error('Failed to load customer detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">Customer Database</h1>
          <p className="text-xs text-slate-500">
            Automatically maintained customer records and dining frequency
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 w-fit">
          Total Customers: <span className="text-orange-600 font-bold">{pagination.total}</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xs border border-slate-200">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name or phone number..."
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
      </div>

      {/* Customers List Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading customer directory..." />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers recorded"
            description="Customers are automatically registered when their mobile number is entered during billing."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4 text-center">Total Bills</th>
                  <th className="py-3 px-4 text-right">Total Spent</th>
                  <th className="py-3 px-4">Last Visit</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.mobile}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold">
                        {c.totalBills} bill(s)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      {currency}{c.totalSpent?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {new Date(c.lastVisitAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenCustomer(c._id)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 mx-auto transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>History</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} customers)
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

      {/* Customer Purchase History Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Customer Dining Profile</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {customerDetail?.customer?.mobile || 'Customer'}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedCustomerId(null);
                  setCustomerDetail(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {isLoadingDetail || !customerDetail ? (
                <LoadingSpinner message="Loading customer records..." />
              ) : (
                <>
                  {/* Top Stats Cards */}
                  <div className="bg-orange-50/60 p-4 rounded-xl border border-orange-100">
                    <h2 className="text-lg font-bold text-slate-900">
                      {customerDetail.customer.name}
                    </h2>
                    <p className="text-xs text-slate-600 font-mono mt-0.5">
                      {customerDetail.customer.mobile}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-orange-200/50 text-xs">
                      <div>
                        <span className="text-slate-500">Total Visits/Bills:</span>
                        <p className="font-bold text-slate-900 text-base">
                          {customerDetail.customer.totalBills}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Total Lifetime Spent:</span>
                        <p className="font-bold text-emerald-700 text-base">
                          {currency}{customerDetail.customer.totalSpent?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Bills History */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Recent Visits & Bills
                    </h4>

                    {customerDetail.recentBills?.length === 0 ? (
                      <p className="text-xs text-slate-400">No past bills on record.</p>
                    ) : (
                      <div className="space-y-2">
                        {customerDetail.recentBills.map((b) => (
                          <div
                            key={b._id}
                            className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-mono font-bold text-slate-900">{b.billNumber}</p>
                              <p className="text-slate-500 text-[11px]">
                                {new Date(b.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}{' '}
                                • {b.outletId?.name || 'Central'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-extrabold text-slate-900 text-sm">
                                {currency}{b.grandTotal?.toFixed(2)}
                              </p>
                              <span className="text-[10px] uppercase font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {b.paymentMethod}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
