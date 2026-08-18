import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../store/useAuthStore';
import { Table } from '../../types';

export const AdminTablesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [tables, setTables] = useState<Table[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  // Form State
  const [tableNumber, setTableNumber] = useState('1');
  const [capacity, setCapacity] = useState('4');
  const [status, setStatus] = useState('available');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    socket.on('order-status-update', handleUpdate);
    socket.on('new-order', handleUpdate);

    const interval = setInterval(fetchTables, 3000);

    return () => {
      socket.off('session-closed', handleUpdate);
      socket.off('table-updated', handleUpdate);
      socket.off('qr-updated', handleUpdate);
      socket.off('order-status-update', handleUpdate);
      socket.off('new-order', handleUpdate);
      clearInterval(interval);
    };
  }, [showDeleted, user]);

  const fetchTables = async () => {
    try {
      const res = await api.get(`/tables?includeDeleted=${showDeleted}`);
      setTables(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setEditingTable(null);
    setTableNumber((tables.length + 1).toString());
    setCapacity('4');
    setStatus('available');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (table: Table) => {
    setEditingTable(table);
    setTableNumber(table.tableNumber.toString());
    setCapacity(table.capacity.toString());
    setStatus(table.status);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      if (editingTable) {
        await api.put(`/tables/${editingTable.id}`, {
          tableNumber: parseInt(tableNumber, 10),
          capacity: parseInt(capacity, 10),
          status,
        });
      } else {
        await api.post('/tables', {
          tableNumber: parseInt(tableNumber, 10),
          capacity: parseInt(capacity, 10),
          status,
        });
      }
      setIsModalOpen(false);
      fetchTables();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to save table');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deactivate this table?')) return;
    try {
      await api.delete(`/tables/${id}`);
      fetchTables();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.post(`/tables/${id}/restore`, {});
      fetchTables();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickStatusChange = async (tableId: string, newStatus: string) => {
    try {
      await api.put(`/tables/${tableId}`, { status: newStatus });
      fetchTables();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'available':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40';
      case 'occupied':
        return 'bg-amber-950/60 text-amber-300 border-amber-500/40';
      case 'ordering':
        return 'bg-blue-950/60 text-blue-300 border-blue-500/40';
      case 'payment_pending':
        return 'bg-purple-950/60 text-purple-300 border-purple-500/40';
      case 'cleaning':
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40';
      case 'disabled':
        return 'bg-rose-950/60 text-rose-300 border-rose-500/40';
      default:
        return 'bg-neutral-900 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] flex">
      <AdminSidebar />

      <div className="pl-64 flex-1 flex flex-col">
        <AdminHeader title="Dining Tables Management" />

        <main className="pt-16 p-8 space-y-6 max-w-7xl w-full">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4f4539]/20 pb-4">
            <div>
              <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#e3e2e2]">
                Dining Tables & Seating
              </h1>
              <p className="text-xs text-[#d2c4b4]/60 mt-0.5">
                Configure table seating capacity, live occupancy states, and active ticket associations
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-[#d2c4b4] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                  className="w-4 h-4 accent-[#edbf7b]"
                />
                <span>Show Deactivated Tables</span>
              </label>

              <button
                onClick={handleOpenAdd}
                className="px-4 py-2.5 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Add Table</span>
              </button>
            </div>
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {tables.map((table) => {
              const activeOrder = (table as any).orders?.[0];

              return (
                <div
                  key={table.id}
                  className="p-5 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-4 shadow-xl flex flex-col justify-between hover:border-[#edbf7b]/60 transition-all"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="w-9 h-9 rounded-xl bg-[#121414] border border-[#edbf7b]/40 flex items-center justify-center font-serif-heading font-bold text-[#edbf7b]">
                          {table.tableNumber}
                        </span>
                        <div>
                          <h3 className="font-serif-heading font-bold text-base text-[#e3e2e2]">
                            Table {table.tableNumber}
                          </h3>
                          <p className="text-[11px] text-[#d2c4b4]/60">
                            Capacity: {table.capacity} Guests
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(table)}
                          className="p-1 rounded-lg bg-[#121414] text-[#d2c4b4] hover:text-[#edbf7b]"
                          title="Edit Table"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        {(table as any).isDeleted ? (
                          <button
                            onClick={() => handleRestore(table.id)}
                            className="p-1 rounded-lg bg-[#121414] text-emerald-400 hover:bg-emerald-950/40"
                            title="Restore Table"
                          >
                            <span className="material-symbols-outlined text-[16px]">restore</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDelete(table.id)}
                            className="p-1 rounded-lg bg-[#121414] text-[#d2c4b4] hover:text-rose-400"
                            title="Deactivate Table"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick Status Selector */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-[#d2c4b4]/60 tracking-wider">
                        Table Status
                      </label>
                      <select
                        value={table.status}
                        onChange={(e) => handleQuickStatusChange(table.id, e.target.value)}
                        className={`w-full h-8 px-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border focus:outline-none cursor-pointer ${getStatusBadge(
                          table.status
                        )}`}
                      >
                        <option value="available" className="bg-[#121414] text-[#e3e2e2]">Available</option>
                        <option value="occupied" className="bg-[#121414] text-[#e3e2e2]">Occupied</option>
                        <option value="ordering" className="bg-[#121414] text-[#e3e2e2]">Ordering</option>
                        <option value="payment_pending" className="bg-[#121414] text-[#e3e2e2]">Payment Pending</option>
                        <option value="cleaning" className="bg-[#121414] text-[#e3e2e2]">Cleaning</option>
                        <option value="disabled" className="bg-[#121414] text-rose-300">Disabled</option>
                      </select>
                    </div>

                    {/* Associated Active Order Preview */}
                    <div className="p-3 rounded-xl bg-[#121414] border border-[#4f4539]/30 space-y-1 text-xs">
                      <span className="text-[10px] font-bold uppercase text-[#d2c4b4]/60 tracking-wider">
                        Active Order
                      </span>
                      {activeOrder ? (
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <p className="font-mono font-bold text-[#edbf7b]">#{activeOrder.orderNumber}</p>
                            <span className="text-[10px] uppercase font-bold text-amber-300">
                              {activeOrder.status}
                            </span>
                          </div>
                          <span className="font-serif-heading font-bold text-sm text-[#e3e2e2]">
                            ₹{activeOrder.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#d2c4b4]/40 italic">No active dining ticket</p>
                      )}
                    </div>
                  </div>

                  {/* QR Link */}
                  <div className="pt-2 border-t border-[#4f4539]/20 flex items-center justify-between text-[11px]">
                    <span className="text-[#d2c4b4]/60 font-mono">Token: {table.qrToken.slice(0, 14)}...</span>
                    <a
                      href={`http://192.168.1.4:5173/r/aurelian/t/${table.qrToken}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#edbf7b] hover:underline flex items-center gap-0.5"
                    >
                      <span>Menu</span>
                      <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#1f2020] rounded-3xl border border-[#edbf7b]/40 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#4f4539]/30">
              <h3 className="font-serif-heading text-lg font-bold text-[#edbf7b]">
                {editingTable ? 'Edit Table Details' : 'Create New Table'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#9b8f80] hover:text-[#e3e2e2]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#d2c4b4]">Table Number (Must be unique)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] font-bold border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#d2c4b4]">Seating Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#d2c4b4]">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 bg-[#121414] rounded-xl px-3 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="ordering">Ordering</option>
                  <option value="payment_pending">Payment Pending</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-[#121414] text-[#d2c4b4] font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-[#edbf7b] text-[#442b00] font-bold uppercase tracking-wider shadow-lg"
                >
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
