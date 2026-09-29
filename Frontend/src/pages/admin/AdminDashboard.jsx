import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Receipt,
  Users,
  Store,
  ArrowRight,
  Eye,
  Calendar,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { getDashboardSummaryApi } from '../../api/reports';
import { useAuthStore } from '../../store/authStore';
import ReceiptModal from '../../components/ReceiptModal';
import EditBillModal from '../../components/EditBillModal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminDashboard() {
  const { user, settings } = useAuthStore();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBill, setActiveBill] = useState(null);
  const [editingBill, setEditingBill] = useState(null);

  const currency = (settings?.currency && settings?.currency !== '₹') ? settings.currency : 'Rs. ';

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await getDashboardSummaryApi();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return <LoadingSpinner message="Loading executive monitoring dashboard..." />;
  }

  const { summary, salesByOutlet = [], recentBills = [] } = data;

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-500">
            Real-time multi-branch sales, bills, and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to="/billing"
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-600/20 transition-all"
          >
            <span>Open POS Billing</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              {currency}{summary.todaySales.toFixed(2)}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Live completed sales</p>
          </div>
        </div>

        {/* Today's Bills */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Bills</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{summary.todayBills}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Generated today</p>
          </div>
        </div>

        {/* Today's Unique Customers */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Guests</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{summary.todayCustomers}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Unique customers recorded</p>
          </div>
        </div>

        {/* Active Outlets */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Outlets</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{summary.activeOutlets}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Operational branches</p>
          </div>
        </div>
      </div>

      {/* Sales by Outlet Grid */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Sales by Branch / Outlet</h3>
            <p className="text-xs text-slate-500">Live breakdown of revenue across all active outlets</p>
          </div>
          <Link
            to="/admin/reports"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
          >
            <span>Full Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {salesByOutlet.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No outlet sales recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {salesByOutlet.map((out) => (
              <div
                key={out._id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{out.name}</h4>
                    <span className="text-[10px] font-mono font-bold text-orange-700 bg-orange-100/70 px-1.5 py-0.5 rounded">
                      {out.code}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {out.todayBills} bills today
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Today's Revenue:</span>
                    <span className="font-bold text-emerald-700">
                      {currency}{out.todaySales.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">All-Time Revenue:</span>
                    <span className="font-bold text-slate-900">
                      {currency}{out.totalSales.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Bills Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Bills</h3>
            <p className="text-xs text-slate-500">Latest completed billing transactions</p>
          </div>
          <Link
            to="/bills"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
          >
            <span>View All Bills</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentBills.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No recent bills created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Bill No</th>
                  <th className="py-2.5 px-4">Branch</th>
                  <th className="py-2.5 px-4">Billed By</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Mode</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {recentBills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{bill.billNumber}</td>
                    <td className="py-2.5 px-4 text-slate-600">{bill.outletId?.name}</td>
                    <td className="py-2.5 px-4 text-slate-600">{bill.createdBy?.name || 'Staff'}</td>
                    <td className="py-2.5 px-4">{bill.customerSnapshot?.name || 'Guest'}</td>
                    <td className="py-2.5 px-4 uppercase text-[11px] font-bold text-slate-500">
                      {bill.paymentMethod}
                    </td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-slate-900">
                      {currency}{bill.grandTotal.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => setActiveBill(bill)}
                        className="p-1 text-slate-500 hover:text-orange-600"
                        title="View Receipt"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        bill={activeBill}
        isOpen={Boolean(activeBill)}
        canCancel={user?.role === 'admin'}
        canEdit={true}
        restaurantName={settings?.restaurantName}
        onClose={() => setActiveBill(null)}
        onEditBill={(b) => setEditingBill(b)}
      />

      {/* Edit Bill Modal */}
      <EditBillModal
        isOpen={Boolean(editingBill)}
        bill={editingBill}
        onClose={() => setEditingBill(null)}
        onSuccess={(updatedBill) => {
          setEditingBill(null);
          fetchDashboard();
          if (activeBill && activeBill._id === updatedBill._id) {
            setActiveBill(updatedBill);
          }
        }}
      />
    </div>
  );
}
