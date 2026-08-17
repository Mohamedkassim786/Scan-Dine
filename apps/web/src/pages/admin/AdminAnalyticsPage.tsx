import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';

export const AdminAnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [menuReport, setMenuReport] = useState<any[]>([]);
  const [tableReport, setTableReport] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'sales' | 'menu' | 'tables' | 'sessions'>('sales');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [dashRes, menuRes, tableRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/reports/menu'),
        api.get('/reports/tables'),
      ]);
      setStats(dashRes.data);
      setMenuReport(menuRes.data);
      setTableReport(tableRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] flex">
      <AdminSidebar />

      <div className="pl-64 flex-1 flex flex-col">
        <AdminHeader title="Hospitality & Sales Analytics" />

        <main className="pt-16 p-8 space-y-6 max-w-7xl w-full">
          {/* Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4f4539]/20 pb-4">
            <div>
              <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#e3e2e2]">
                Performance & Dining Analytics
              </h1>
              <p className="text-xs text-[#d2c4b4]/60 mt-0.5">
                Multi-dimensional insights covering ticket sizes, table velocity, menu margins, and anonymous diner activity
              </p>
            </div>

            {/* Navigation Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#1f2020] border border-[#4f4539]/30 text-xs">
              {[
                { key: 'sales', label: 'Sales Metrics' },
                { key: 'menu', label: 'Menu Velocity' },
                { key: 'tables', label: 'Table Utilization' },
                { key: 'sessions', label: 'Anonymous Traffic' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold uppercase tracking-wider text-[11px] transition-colors ${
                    activeTab === tab.key
                      ? 'bg-[#edbf7b] text-[#442b00] shadow-sm'
                      : 'text-[#d2c4b4] hover:text-[#e3e2e2]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#d2c4b4]/60">Today's Gross Sales</span>
                  <p className="font-serif-heading text-3xl font-bold text-[#edbf7b]">
                    ₹{(stats?.todaysRevenue || 0).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-semibold">↑ 14.8% vs last week</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#d2c4b4]/60">Average Ticket Size (AOV)</span>
                  <p className="font-serif-heading text-3xl font-bold text-[#e3e2e2]">
                    ₹{((stats?.todaysRevenue || 0) / Math.max(1, stats?.todaysOrders || 1)).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-semibold">↑ ₹120.00 lift via AI upsell</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#d2c4b4]/60">Total Completed Orders</span>
                  <p className="font-serif-heading text-3xl font-bold text-[#e3e2e2]">
                    {stats?.todaysOrders || 0}
                  </p>
                  <p className="text-[11px] text-[#d2c4b4]/60">100% kitchen fulfillment</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#d2c4b4]/60">Peak Turn Rate</span>
                  <p className="font-serif-heading text-3xl font-bold text-[#edbf7b]">
                    38 Mins
                  </p>
                  <p className="text-[11px] text-emerald-400 font-semibold">Fast table throughput</p>
                </div>
              </div>

              {/* Weekly Trend Chart */}
              <div className="p-6 rounded-2xl bg-[#1f2020] border border-[#4f4539]/20 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif-heading text-lg font-bold text-[#e3e2e2]">Revenue & Order Trajectory</h3>
                  <span className="text-xs text-[#edbf7b] font-semibold">Last 7 Days Operating Volume</span>
                </div>

                <div className="h-56 w-full pt-4">
                  <svg className="w-full h-full" viewBox="0 0 800 220" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="anGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#edbf7b" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#edbf7b" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d="M 0,190 Q 130,160 260,130 T 520,70 T 800,30 L 800,220 L 0,220 Z" fill="url(#anGlow)" />
                    <path d="M 0,190 Q 130,160 260,130 T 520,70 T 800,30" fill="none" stroke="#edbf7b" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="260" cy="130" r="5" fill="#121414" stroke="#edbf7b" strokeWidth="2.5" />
                    <circle cx="520" cy="70" r="5" fill="#121414" stroke="#edbf7b" strokeWidth="2.5" />
                    <circle cx="800" cy="30" r="5" fill="#121414" stroke="#edbf7b" strokeWidth="2.5" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Menu Velocity Tab */}
          {activeTab === 'menu' && (
            <div className="space-y-4">
              <div className="bg-[#1f2020] rounded-2xl border border-[#4f4539]/20 overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#4f4539]/30 text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60 bg-[#121414]/40">
                      <th className="p-4">Dish</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Units Sold</th>
                      <th className="p-4">Gross Revenue</th>
                      <th className="p-4 text-right">Performance Band</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#4f4539]/15 text-[#e3e2e2]">
                    {menuReport.map((m, idx) => (
                      <tr key={m.id} className="hover:bg-[#121414]/50">
                        <td className="p-4 font-serif-heading font-semibold text-sm text-[#e3e2e2]">{m.name}</td>
                        <td className="p-4 text-[#d2c4b4]">{m.category}</td>
                        <td className="p-4 font-bold text-[#edbf7b]">₹{m.price.toFixed(2)}</td>
                        <td className="p-4 font-bold text-[#e3e2e2]">{m.unitsSold}</td>
                        <td className="p-4 font-serif-heading font-bold text-sm text-emerald-400">₹{m.grossRevenue.toFixed(2)}</td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            idx < 3 ? 'bg-emerald-950/60 text-emerald-300' : 'bg-neutral-900 text-[#d2c4b4]/60'
                          }`}>
                            {idx < 3 ? 'Star Driver' : 'Steady Volume'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table Utilization Tab */}
          {activeTab === 'tables' && (
            <div className="space-y-4">
              <div className="bg-[#1f2020] rounded-2xl border border-[#4f4539]/20 overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#4f4539]/30 text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60 bg-[#121414]/40">
                      <th className="p-4">Table</th>
                      <th className="p-4">Capacity</th>
                      <th className="p-4">Live Status</th>
                      <th className="p-4">Completed Orders</th>
                      <th className="p-4">Gross Revenue</th>
                      <th className="p-4 text-right">AOV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#4f4539]/15 text-[#e3e2e2]">
                    {tableReport.map((t) => (
                      <tr key={t.tableNumber} className="hover:bg-[#121414]/50">
                        <td className="p-4 font-bold text-[#edbf7b]">Table {t.tableNumber}</td>
                        <td className="p-4 text-[#d2c4b4]">{t.capacity} Guests</td>
                        <td className="p-4 uppercase font-bold text-[10px] text-emerald-400">{t.status}</td>
                        <td className="p-4 font-bold text-[#e3e2e2]">{t.totalOrders}</td>
                        <td className="p-4 font-serif-heading font-bold text-sm text-[#edbf7b]">₹{t.totalRevenue.toFixed(2)}</td>
                        <td className="p-4 text-right font-bold text-[#e3e2e2]">₹{t.averageOrderValue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Anonymous Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#d2c4b4]/60">Anonymous QR Scans</span>
                  <p className="font-serif-heading text-2xl font-bold text-[#edbf7b]">482</p>
                  <span className="text-[10px] text-emerald-400">Zero sign-in needed</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#d2c4b4]/60">Food Item Views</span>
                  <p className="font-serif-heading text-2xl font-bold text-[#e3e2e2]">1,294</p>
                  <span className="text-[10px] text-[#d2c4b4]/60">Modal engagements</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#d2c4b4]/60">Cart Additions</span>
                  <p className="font-serif-heading text-2xl font-bold text-emerald-400">388</p>
                  <span className="text-[10px] text-emerald-400">30% conversion rate</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#d2c4b4]/60">Dine AI Queries</span>
                  <p className="font-serif-heading text-2xl font-bold text-[#edbf7b]">142</p>
                  <span className="text-[10px] text-[#d2c4b4]/60">Wine & pairing questions</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
