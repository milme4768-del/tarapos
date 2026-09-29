import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, TrendingUp, CreditCard, Award, Calendar, Store } from 'lucide-react';
import { getSalesReportApi } from '../../api/reports';
import { getOutletsApi } from '../../api/outlets';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Reports() {
  const { user, settings } = useAuthStore();
  const [data, setData] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('thisMonth');
  const [selectedOutlet, setSelectedOutlet] = useState('');

  const isAdmin = user?.role === 'admin';
  const currency = (settings?.currency && settings?.currency !== '₹') ? settings.currency : 'Rs. ';

  useEffect(() => {
    if (isAdmin) {
      getOutletsApi().then((res) => setOutlets(res.data || []));
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchReport();
  }, [dateRange, selectedOutlet]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await getSalesReportApi({
        dateRange,
        outletId: selectedOutlet || undefined,
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const { paymentBreakdown = [], topItems = [], dailyTrend = [] } = data || {};
  const totalPeriodRevenue = paymentBreakdown.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPeriodBills = paymentBreakdown.reduce((sum, p) => sum + (p.count || 0), 0);

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">Sales & Analytics</h1>
          <p className="text-xs text-slate-500">
            Real-time server-side aggregated financial and product reporting
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <select
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
            >
              <option value="">All Branches</option>
              {outlets.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.name} ({o.code})
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'thisWeek', label: 'This Week' },
              { id: 'thisMonth', label: 'This Month' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateRange(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  dateRange === tab.id
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Calculating aggregation reports..." />
      ) : (
        <>
          {/* Top Period Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Period Revenue
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  {currency}{totalPeriodRevenue.toFixed(2)}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Total completed billings</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Period Invoices
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  {totalPeriodBills}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Bills finalized</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Payment Methods & Daily Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Payment Method Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Payment Methods</h3>
                <CreditCard className="w-4 h-4 text-slate-400" />
              </div>

              {paymentBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No payment records.</p>
              ) : (
                <div className="space-y-3">
                  {paymentBreakdown.map((pm) => {
                    const percentage = totalPeriodRevenue > 0
                      ? Math.round((pm.amount / totalPeriodRevenue) * 100)
                      : 0;

                    return (
                      <div key={pm._id} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="uppercase text-slate-700">{pm._id}</span>
                          <span className="text-slate-900">
                            {currency}{pm.amount.toFixed(2)} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-600 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 text-right">{pm.count} bills</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Daily Trend List */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Daily Sales Trend</h3>
                <Calendar className="w-4 h-4 text-slate-400" />
              </div>

              {dailyTrend.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No daily sales in selected window.</p>
              ) : (
                <div className="space-y-2 max-h-[260px] overflow-y-auto">
                  {dailyTrend.map((d) => (
                    <div
                      key={d._id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-800 font-mono">{d._id}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-slate-500">{d.bills} bill(s)</span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {currency}{d.sales.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Selling Food Items */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Top-Selling Food Items & Variants</h3>
                <p className="text-xs text-slate-500">Highest grossing items sorted by revenue</p>
              </div>
              <Award className="w-5 h-5 text-orange-600" />
            </div>

            {topItems.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No product sales data yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Rank</th>
                      <th className="py-2.5 px-4">Item Name</th>
                      <th className="py-2.5 px-4">Variant / Portion</th>
                      <th className="py-2.5 px-4 text-center">Quantity Sold</th>
                      <th className="py-2.5 px-4 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {topItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-bold text-slate-400">#{idx + 1}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{item.productName}</td>
                        <td className="py-2.5 px-4 text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-semibold">
                            {item.variantName} ({item.unit})
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-700">
                          {item.totalQuantity}
                        </td>
                        <td className="py-2.5 px-4 text-right font-extrabold text-slate-900">
                          {currency}{item.totalRevenue?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
