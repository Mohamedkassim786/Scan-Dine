import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { DigitalReceipt } from '../../components/common/DigitalReceipt';

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalRevenue: 0,
    onlinePayments: 0,
    cashPayments: 0,
    cashPending: 0,
    failedPayments: 0,
    refunds: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<any | null>(null);

  useEffect(() => {
    fetchPayments();
  }, [selectedStatus, selectedMethod]);

  const fetchPayments = async () => {
    try {
      const res = await api.get(`/payments?status=${selectedStatus}&method=${selectedMethod}`);
      setPayments(res.data.payments || []);
      if (res.data.summary) setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (paymentId: string, newStatus: string) => {
    setUpdatingPaymentId(paymentId);
    try {
      await api.patch(`/payments/${paymentId}/status`, { status: newStatus });
      fetchPayments();
    } catch (err) {
      console.error('Failed to update payment:', err);
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const handleOpenReceipt = async (orderId: string) => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setActiveReceiptOrder(res.data);
    } catch (err) {
      console.error('Failed to fetch order for receipt:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40';
      case 'pending':
        return 'bg-amber-950/60 text-amber-300 border-amber-500/40';
      case 'processing':
        return 'bg-blue-950/60 text-blue-300 border-blue-500/40';
      case 'failed':
        return 'bg-rose-950/60 text-rose-300 border-rose-500/40';
      case 'refunded':
        return 'bg-purple-950/60 text-purple-300 border-purple-500/40';
      default:
        return 'bg-neutral-900 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] flex">
      <AdminSidebar />

      <div className="pl-64 flex-1 flex flex-col">
        <AdminHeader title="Financial & Payment Management" />

        <main className="pt-16 p-8 space-y-6 max-w-7xl w-full">
          {/* Header Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4f4539]/20 pb-4">
            <div>
              <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#e3e2e2]">
                Payments & Collections
              </h1>
              <p className="text-xs text-[#d2c4b4]/60 mt-0.5">
                Manage online UPI/card settlements, cash at counter reconciliation, and refund transactions
              </p>
            </div>

            <button
              onClick={fetchPayments}
              className="px-4 py-2.5 rounded-xl bg-[#1f2020] border border-[#4f4539]/40 hover:border-[#edbf7b]/40 text-xs font-semibold text-[#d2c4b4] hover:text-[#edbf7b] flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Reconcile Transactions</span>
            </button>
          </div>

          {/* 6 Financial Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Total Revenue */}
            <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60">Total Settled</span>
              <p className="font-serif-heading text-xl font-bold text-[#edbf7b]">
                ₹{summary.totalRevenue.toFixed(2)}
              </p>
              <span className="text-[10px] text-emerald-400 font-semibold">100% Verified</span>
            </div>

            {/* Online Payments */}
            <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60">Online Digital</span>
              <p className="font-serif-heading text-xl font-bold text-[#e3e2e2]">
                ₹{summary.onlinePayments.toFixed(2)}
              </p>
              <span className="text-[10px] text-blue-400 font-semibold">UPI / Card</span>
            </div>

            {/* Cash Paid */}
            <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60">Cash Collected</span>
              <p className="font-serif-heading text-xl font-bold text-[#e3e2e2]">
                ₹{summary.cashPayments.toFixed(2)}
              </p>
              <span className="text-[10px] text-emerald-400 font-semibold">Counter Settled</span>
            </div>

            {/* Cash Pending */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 to-[#1f2020] border border-amber-500/40 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Cash Pending</span>
              <p className="font-serif-heading text-xl font-bold text-amber-300">
                ₹{summary.cashPending.toFixed(2)}
              </p>
              <span className="text-[10px] text-amber-400 font-semibold">Action Required</span>
            </div>

            {/* Failed */}
            <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60">Failed Attempts</span>
              <p className="font-serif-heading text-xl font-bold text-rose-400">
                {summary.failedPayments}
              </p>
              <span className="text-[10px] text-rose-300/60">Declined Gateway</span>
            </div>

            {/* Refunds */}
            <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60">Refunds</span>
              <p className="font-serif-heading text-xl font-bold text-[#e3e2e2]">
                {summary.refunds}
              </p>
              <span className="text-[10px] text-purple-400">Processed</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex overflow-x-auto hide-scrollbar gap-1.5">
              {[
                { key: 'all', label: 'All Statuses' },
                { key: 'pending', label: 'Pending / Unpaid' },
                { key: 'paid', label: 'Paid & Settled' },
                { key: 'refunded', label: 'Refunded' },
                { key: 'failed', label: 'Failed' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedStatus(tab.key)}
                  className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider text-[11px] transition-colors ${
                    selectedStatus === tab.key
                      ? 'bg-[#edbf7b] text-[#442b00]'
                      : 'bg-[#121414] text-[#d2c4b4] border border-[#4f4539]/30'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="bg-[#121414] border border-[#4f4539]/40 rounded-xl px-3 py-2 text-xs text-[#d2c4b4] focus:outline-none focus:border-[#edbf7b]"
            >
              <option value="all">All Methods (Cash & Online)</option>
              <option value="cash">Cash at Counter</option>
              <option value="online">Online (UPI / Card)</option>
            </select>
          </div>

          {/* Transactions Table */}
          <div className="bg-[#1f2020] rounded-2xl border border-[#4f4539]/20 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#4f4539]/30 text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60 bg-[#121414]/40">
                    <th className="p-4">Table</th>
                    <th className="p-4">Order #</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Payment Status</th>
                    <th className="p-4">Date / Time</th>
                    <th className="p-4 text-right">Settlement & Bill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#4f4539]/15 text-[#e3e2e2]">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#d2c4b4]/50 italic">
                        No transactions found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-[#121414]/50 transition-colors">
                        <td className="p-4 font-bold">
                          <span className="px-2.5 py-1 rounded-lg bg-[#121414] border border-[#edbf7b]/40 text-[#edbf7b]">
                            Table {p.order?.table?.tableNumber || 1}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-[#d2c4b4]">
                          #{p.order?.orderNumber}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#121414] border border-[#4f4539]/30 text-xs font-semibold uppercase">
                            {p.method}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[11px] text-[#d2c4b4]/70">
                          {p.transactionId || 'CASH-COUNTER'}
                        </td>
                        <td className="p-4 font-serif-heading font-bold text-sm text-[#edbf7b]">
                          ₹{p.amount.toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                              p.status
                            )}`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 text-[11px] text-[#d2c4b4]/60">
                          {new Date(p.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {p.orderId && (
                              <button
                                onClick={() => handleOpenReceipt(p.orderId)}
                                className="px-2.5 py-1 rounded-lg bg-[#121414] border border-[#edbf7b]/40 text-[#edbf7b] hover:bg-[#edbf7b] hover:text-[#442b00] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                                title="Print Bill"
                              >
                                <span className="material-symbols-outlined text-[13px]">print</span>
                                <span>Bill</span>
                              </button>
                            )}
                            {p.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateStatus(p.id, 'paid')}
                                disabled={updatingPaymentId === p.id}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider shadow-md transition-all flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[13px]">check</span>
                                <span>Mark Paid</span>
                              </button>
                            )}
                            {p.status === 'paid' && (
                              <button
                                onClick={() => handleUpdateStatus(p.id, 'refunded')}
                                disabled={updatingPaymentId === p.id}
                                className="px-2.5 py-1 rounded-lg bg-[#121414] hover:bg-purple-950/40 text-[#d2c4b4] hover:text-purple-300 border border-[#4f4539]/30 text-[10px] font-semibold uppercase tracking-wider transition-colors"
                              >
                                Refund
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Admin Printable Bill Modal */}
      {activeReceiptOrder && (
        <DigitalReceipt
          order={activeReceiptOrder}
          onClose={() => setActiveReceiptOrder(null)}
          isAdmin={true}
        />
      )}
    </div>
  );
};
