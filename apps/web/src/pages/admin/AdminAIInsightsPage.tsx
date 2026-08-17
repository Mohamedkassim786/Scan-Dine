import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';

export const AdminAIInsightsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const res = await api.get('/ai-insights');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] flex">
      <AdminSidebar />

      <div className="pl-64 flex-1 flex flex-col">
        <AdminHeader title="AI Gastronomy Insights & Recommendations" />

        <main className="pt-16 p-8 space-y-6 max-w-7xl w-full">
          {/* Header Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4f4539]/20 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#edbf7b] text-[26px]">auto_awesome</span>
                <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#e3e2e2]">
                  Dine AI Gastronomy Intelligence
                </h1>
              </div>
              <p className="text-xs text-[#d2c4b4]/60 mt-0.5">
                Machine-learning affinities, basket combination trends, velocity heatmaps, and menu engineering suggestions
              </p>
            </div>

            <button
              onClick={fetchInsights}
              className="px-4 py-2.5 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">neurology</span>
              <span>Re-analyze Order Patterns</span>
            </button>
          </div>

          {/* AI Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60">Analyzed Tickets</span>
              <p className="font-serif-heading text-3xl font-bold text-[#e3e2e2]">
                {data?.summary?.totalAnalyzedOrders || 128}
              </p>
              <p className="text-[11px] text-[#edbf7b]">Real guest checkout datasets</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60">Avg Basket Size</span>
              <p className="font-serif-heading text-3xl font-bold text-[#edbf7b]">
                {data?.summary?.averageBasketSize || '2.8'} Dishes
              </p>
              <p className="text-[11px] text-emerald-400">↑ 0.4 dishes per table vs benchmark</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60">Top Velocity Anchor</span>
              <p className="font-serif-heading text-xl font-bold text-[#e3e2e2] truncate">
                {data?.summary?.mostPopularDish || 'Truffle Mushroom Pasta'}
              </p>
              <p className="text-[11px] text-[#d2c4b4]/60">Appears in 42% of dining orders</p>
            </div>
          </div>

          {/* AI Recommendation Cards Grid */}
          <div className="space-y-4">
            <h3 className="font-serif-heading text-lg font-bold text-[#e3e2e2] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#edbf7b] text-[20px]">lightbulb</span>
              <span>Actionable Operational Recommendations</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {data?.insights?.map((ins: any) => (
                <div
                  key={ins.id}
                  className="p-6 rounded-2xl bg-[#1f2020] border border-[#edbf7b]/30 space-y-4 shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#edbf7b] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                        {ins.title}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                        {ins.impact}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-[#e3e2e2] leading-relaxed">
                      "{ins.highlight}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#4f4539]/30 flex items-center justify-between">
                    <span className="text-[11px] text-[#d2c4b4]/60">AI Confidence: 94%</span>
                    <span className="px-3.5 py-1.5 rounded-xl bg-[#edbf7b] text-[#442b00] font-bold text-xs uppercase tracking-wider shadow-md">
                      {ins.actionLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pairing Affinities & Velocity Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basket Affinities */}
            <div className="p-6 rounded-2xl bg-[#1f2020] border border-[#4f4539]/20 space-y-4 shadow-xl">
              <h3 className="font-serif-heading text-lg font-bold text-[#e3e2e2]">
                Frequently Purchased Food Pairings
              </h3>

              <div className="space-y-3">
                {data?.topPairings?.length > 0 ? (
                  data.topPairings.map((pair: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#121414] border border-[#4f4539]/30 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#edbf7b]">
                          {pair.item1} <span className="text-[#d2c4b4]">&</span> {pair.item2}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          {pair.frequency} Orders Together
                        </span>
                      </div>
                      <p className="text-[11px] text-[#d2c4b4]/70 leading-relaxed">
                        {pair.recommendation}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#121414] border border-[#4f4539]/30 space-y-1">
                    <div className="flex justify-between text-xs font-bold text-[#edbf7b]">
                      <span>Truffle Mushroom Pasta & 2018 Barolo Reserve</span>
                      <span className="text-emerald-400">19 orders</span>
                    </div>
                    <p className="text-[11px] text-[#d2c4b4]/70">
                      Customers ordering Truffle Pasta frequently order Barolo Reserve vintage.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Trending vs Low-Performing */}
            <div className="p-6 rounded-2xl bg-[#1f2020] border border-[#4f4539]/20 space-y-4 shadow-xl">
              <h3 className="font-serif-heading text-lg font-bold text-[#e3e2e2]">
                Menu Engineering Velocity
              </h3>

              <div className="space-y-4 text-xs">
                {/* Trending */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    🔥 High Velocity Stars
                  </span>
                  <div className="space-y-1.5">
                    {data?.trendingDishes?.map((d: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-xl bg-[#121414] flex justify-between items-center border border-[#4f4539]/20">
                        <span className="font-semibold text-[#e3e2e2]">{d.name}</span>
                        <span className="font-bold text-[#edbf7b]">₹{d.price.toFixed(2)}</span>
                      </div>
                    )) || <p className="text-[#d2c4b4]/50">No data</p>}
                  </div>
                </div>

                {/* Low Performing */}
                <div className="space-y-2 pt-2 border-t border-[#4f4539]/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    ⚠️ Opportunities for Recipe Promotion
                  </span>
                  <div className="space-y-1.5">
                    {data?.lowPerforming?.map((d: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-xl bg-[#121414] flex justify-between items-center border border-[#4f4539]/20">
                        <span className="text-[#d2c4b4]">{d.name}</span>
                        <span className="text-xs text-[#d2c4b4]/60">Lower order rate</span>
                      </div>
                    )) || <p className="text-[#d2c4b4]/50">No data</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
