import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [selectedEntity]);

  const fetchLogs = async () => {
    try {
      const res = await api.get(`/audit-logs?entity=${selectedEntity}&search=${encodeURIComponent(searchQuery)}`);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] flex">
      <AdminSidebar />

      <div className="pl-64 flex-1 flex flex-col">
        <AdminHeader title="Security & Operational Audit Trail" />

        <main className="pt-16 p-8 space-y-6 max-w-7xl w-full">
          {/* Header Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4f4539]/20 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#edbf7b] text-[24px]">history</span>
                <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#e3e2e2]">
                  System Audit Logs
                </h1>
              </div>
              <p className="text-xs text-[#d2c4b4]/60 mt-0.5">
                Immutable chronological log of all administrator actions, menu changes, and operational dispatches
              </p>
            </div>

            <button
              onClick={fetchLogs}
              className="px-4 py-2.5 rounded-xl bg-[#1f2020] border border-[#4f4539]/40 hover:border-[#edbf7b]/40 text-xs font-semibold text-[#d2c4b4] hover:text-[#edbf7b] flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Sync Trail</span>
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 rounded-2xl bg-[#1f2020] border border-[#4f4539]/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex overflow-x-auto hide-scrollbar gap-1.5">
              {[
                { key: 'all', label: 'All Entities' },
                { key: 'MenuItem', label: 'Food Items' },
                { key: 'RestaurantTable', label: 'Tables & QR' },
                { key: 'Payment', label: 'Payments' },
                { key: 'Restaurant', label: 'Restaurant' },
                { key: 'User', label: 'Staff & Security' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedEntity(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
                    selectedEntity === tab.key
                      ? 'bg-[#edbf7b] text-[#442b00]'
                      : 'bg-[#121414] text-[#d2c4b4] border border-[#4f4539]/30'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search action or user..."
                className="bg-[#121414] border border-[#4f4539]/40 rounded-xl px-3 py-2 text-xs text-[#e3e2e2] placeholder-[#d2c4b4]/40 focus:outline-none focus:border-[#edbf7b]"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-[#edbf7b] text-[#442b00] font-bold text-xs uppercase shadow-md"
              >
                Search
              </button>
            </form>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-[#1f2020] rounded-2xl border border-[#4f4539]/20 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#4f4539]/30 text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60 bg-[#121414]/40">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Entity</th>
                    <th className="p-4">Details</th>
                    <th className="p-4 text-right">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#4f4539]/15 text-[#e3e2e2]">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#d2c4b4]/50 italic">
                        No audit logs recorded yet for this entity.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#121414]/50 transition-colors">
                        <td className="p-4 font-mono text-[11px] text-[#d2c4b4]/70 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 font-semibold text-[#e3e2e2]">
                          {log.userName || 'System'}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#121414] border border-[#edbf7b]/30 text-[#edbf7b] font-mono text-[10px] font-bold">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-[#d2c4b4]">{log.entity}</td>
                        <td className="p-4 text-[#e3e2e2] max-w-md">{log.details}</td>
                        <td className="p-4 font-mono text-right text-[11px] text-[#d2c4b4]/50">
                          {log.ipAddress || '127.0.0.1'}
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
    </div>
  );
};
