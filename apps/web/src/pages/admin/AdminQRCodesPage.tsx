import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../store/useAuthStore';

export const AdminQRCodesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [tables, setTables] = useState<any[]>([]);
  const [selectedQR, setSelectedQR] = useState<any | null>(null);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [showESP32Sim, setShowESP32Sim] = useState(true);

  useEffect(() => {
    fetchTables();

    const socket = getSocket();
    if (user?.restaurantId) {
      socket.emit('join-admin', user.restaurantId);
    }

    const handleUpdate = () => {
      fetchTables();
    };

    socket.on('session-closed', handleUpdate);
    socket.on('table-updated', handleUpdate);
    socket.on('qr-updated', handleUpdate);
    socket.on('cash-pass-created', handleUpdate);

    const interval = setInterval(fetchTables, 3000);

    return () => {
      socket.off('session-closed', handleUpdate);
      socket.off('table-updated', handleUpdate);
      socket.off('qr-updated', handleUpdate);
      socket.off('cash-pass-created', handleUpdate);
      clearInterval(interval);
    };
  }, [user]);

  const fetchTables = async () => {
    try {
      const res = await api.get('/tables');
      setTables(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegenerate = async (tableId: string) => {
    if (!window.confirm('Regenerate QR token for this table? Existing printed physical QRs for this table will become invalid.')) return;
    setRegeneratingId(tableId);
    try {
      await api.post(`/tables/${tableId}/regenerate-qr`);
      await fetchTables();
    } catch (err) {
      console.error('Failed to regenerate QR:', err);
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleDownload = (qrDataUrl: string, tableNumber: number) => {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `Aurelian_Table_${String(tableNumber).padStart(2, '0')}_QR.png`;
    link.click();
  };

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] flex">
      <AdminSidebar />

      <div className="pl-64 flex-1 flex flex-col">
        <AdminHeader title="QR Code Management Hub" />

        <main className="pt-16 p-8 space-y-6 max-w-7xl w-full">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4f4539]/20 pb-4">
            <div>
              <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#e3e2e2]">
                Table QR Codes & ESP32 Hub
              </h1>
              <p className="text-xs text-[#d2c4b4]/60 mt-0.5">
                Live ESP32 Table Display Simulator, dynamic token management, and high-res vector downloads
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowESP32Sim(!showESP32Sim)}
                className={`px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 border transition-all ${
                  showESP32Sim
                    ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 shadow-md'
                    : 'bg-[#1f2020] border-[#4f4539]/40 text-[#d2c4b4]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">developer_board</span>
                <span>ESP32 Mode: {showESP32Sim ? 'Simulated' : 'Raw QR'}</span>
              </button>

              <button
                onClick={handlePrintAll}
                className="px-4 py-2.5 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>Print All Stand Cards</span>
              </button>
            </div>
          </div>

          {/* QR Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {tables.map((table) => {
              const baseUrl = 'http://192.168.1.4:5173';
              const targetUrl = `${baseUrl}/r/aurelian/t/${table.qrToken}`;
              const isOccupied = table.orders && table.orders.length > 0 && table.orders.some((o: any) => o.status !== 'delivered' && o.status !== 'cancelled');

              return (
                <div
                  key={table.id}
                  className="p-5 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 flex flex-col justify-between space-y-4 shadow-xl hover:border-[#edbf7b]/60 transition-all group"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-3 py-1 rounded-full bg-[#edbf7b] text-[#442b00] font-bold text-xs uppercase shadow-sm">
                        Table {table.tableNumber}
                      </span>
                      <p className="text-[11px] text-[#d2c4b4]/60 mt-1.5">
                        Capacity: {table.capacity} Guests
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isOccupied
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30 animate-pulse'
                          : table.isActive
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {isOccupied ? 'Occupied' : table.isActive ? 'Available' : 'Disabled'}
                    </span>
                  </div>

                  {/* ESP32 Hardware Screen Simulator / Raw QR View */}
                  {showESP32Sim ? (
                    <div className="p-3 bg-[#0d0e0e] rounded-xl border border-cyan-500/30 shadow-inner space-y-2 relative overflow-hidden">
                      <div className="flex items-center justify-between border-b border-cyan-900/40 pb-1.5">
                        <span className="text-[9px] font-mono font-bold text-cyan-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                          ESP32 DISPLAY
                        </span>
                        <span className="text-[9px] font-mono text-cyan-400/60">Wi-Fi OK</span>
                      </div>

                      {isOccupied ? (
                        <div className="py-6 px-2 text-center space-y-2 bg-[#121414] rounded-lg border border-amber-500/30">
                          <span className="material-symbols-outlined text-amber-400 text-[28px] animate-bounce">
                            lock
                          </span>
                          <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                            QR Hidden — Dining Active
                          </p>
                          <p className="text-[9px] text-[#d2c4b4]/60">
                            Table {table.tableNumber} occupied. Scan disabled.
                          </p>
                        </div>
                      ) : (
                        <div
                          onClick={() => setSelectedQR(table)}
                          className="p-3 bg-white rounded-lg flex flex-col items-center justify-center cursor-pointer shadow-sm relative group/qr"
                        >
                          {table.qrCodeUrl ? (
                            <img src={table.qrCodeUrl} alt={`Table ${table.tableNumber} QR`} className="w-36 h-36 object-contain" />
                          ) : (
                            <div className="w-36 h-36 flex items-center justify-center text-neutral-400 text-xs">
                              No QR Generated
                            </div>
                          )}
                          <span className="mt-1 text-[9px] font-mono font-bold text-neutral-800 uppercase">
                            Scan to Order • Table {table.tableNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => setSelectedQR(table)}
                      className="p-4 bg-white rounded-xl flex items-center justify-center cursor-pointer shadow-md group-hover:scale-102 transition-transform relative"
                    >
                      {table.qrCodeUrl ? (
                        <img src={table.qrCodeUrl} alt={`Table ${table.tableNumber} QR`} className="w-40 h-40 object-contain" />
                      ) : (
                        <div className="w-40 h-40 flex items-center justify-center text-neutral-400 text-xs">
                          No QR Generated
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition-opacity text-white font-bold text-xs gap-1">
                        <span className="material-symbols-outlined text-[20px]">zoom_in</span>
                        <span>Enlarge</span>
                      </div>
                    </div>
                  )}

                  {/* Token & URL Details */}
                  <div className="space-y-1 text-[10px]">
                    <p className="text-[#d2c4b4]/60 font-mono truncate">Token: {table.qrToken}</p>
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#edbf7b] hover:underline flex items-center gap-1 truncate"
                    >
                      <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                      <span>{targetUrl}</span>
                    </a>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pt-2 border-t border-[#4f4539]/20 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleDownload(table.qrCodeUrl, table.tableNumber)}
                      className="flex-1 py-1.5 rounded-lg bg-[#121414] hover:bg-[#343535] text-[#d2c4b4] hover:text-[#edbf7b] text-[11px] font-semibold flex items-center justify-center gap-1 border border-[#4f4539]/30 transition-colors"
                      title="Download PNG"
                    >
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      <span>PNG</span>
                    </button>

                    <button
                      onClick={() => handleRegenerate(table.id)}
                      disabled={regeneratingId === table.id}
                      className="py-1.5 px-2.5 rounded-lg bg-[#121414] hover:bg-rose-950/40 text-[#d2c4b4] hover:text-rose-300 text-[11px] font-semibold flex items-center justify-center gap-1 border border-[#4f4539]/30 transition-colors disabled:opacity-50"
                      title="Regenerate QR Token"
                    >
                      <span className="material-symbols-outlined text-[14px]">sync</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Enlarge QR Modal */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#1f2020] rounded-3xl border border-[#edbf7b]/40 p-6 space-y-5 shadow-2xl text-center">
            <div className="flex justify-between items-center pb-2 border-b border-[#4f4539]/30">
              <span className="font-serif-heading font-bold text-lg text-[#edbf7b]">
                Table {selectedQR.tableNumber} QR Stand
              </span>
              <button onClick={() => setSelectedQR(null)} className="text-[#9b8f80] hover:text-[#e3e2e2]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 bg-white rounded-2xl mx-auto flex flex-col items-center justify-center space-y-3">
              <p className="text-[#121414] font-serif-heading font-extrabold text-sm uppercase tracking-widest">
                Aurelian Gastronomy
              </p>
              <img src={selectedQR.qrCodeUrl} alt="QR" className="w-56 h-56 object-contain" />
              <p className="text-[#121414] font-bold text-xs uppercase tracking-wider">
                Scan to Open Table {selectedQR.tableNumber} Menu
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(selectedQR.qrCodeUrl, selectedQR.tableNumber)}
                className="flex-1 h-11 rounded-xl bg-[#edbf7b] text-[#442b00] font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Download Vector</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 h-11 rounded-xl bg-[#121414] border border-[#4f4539]/40 text-[#d2c4b4] hover:text-[#edbf7b] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
