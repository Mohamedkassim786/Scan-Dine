import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Chef } from '../../types';

export const AdminChefsPage: React.FC = () => {
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchChefs();
  }, []);

  const fetchChefs = async () => {
    try {
      const res = await api.get('/chefs');
      setChefs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateChef = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/chefs', { name, email, password });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      fetchChefs();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create chef');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChef) return;
    try {
      await api.patch(`/chefs/${selectedChef.id}/reset-password`, { password: newPassword });
      setIsPasswordModalOpen(false);
      setNewPassword('');
      alert('Chef password reset successfully');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reset password');
    }
  };

  const handleToggleStatus = async (chef: Chef) => {
    try {
      await api.put(`/chefs/${chef.id}`, { isActive: !chef.isActive });
      fetchChefs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] flex">
      <AdminSidebar />

      <div className="pl-64 flex-1 flex flex-col">
        <AdminHeader title="Kitchen Chef Staff & Terminal Management" />

        <main className="pt-16 p-8 space-y-6 max-w-6xl w-full">
          {/* Header Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4f4539]/20 pb-4">
            <div>
              <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#e3e2e2]">
                Kitchen Chefs & KDS Terminals
              </h1>
              <p className="text-xs text-[#d2c4b4]/60 mt-0.5">
                Manage chef staff logins, terminal credentials, and monitor kitchen prep activity
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">skillet</span>
              <span>Add Kitchen Chef</span>
            </button>
          </div>

          {/* Chefs Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {chefs.map((chef) => (
              <div
                key={chef.id}
                className="p-5 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#121414] border border-[#edbf7b]/40 flex items-center justify-center font-serif-heading font-bold text-[#edbf7b] text-base">
                        {chef.name[0]}
                      </div>
                      <div>
                        <h3 className="font-serif-heading font-bold text-base text-[#e3e2e2]">
                          {chef.name}
                        </h3>
                        <span className="text-[10px] uppercase tracking-wider text-[#edbf7b] font-semibold">
                          Executive Chef
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(chef)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        chef.isActive
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {chef.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-[#121414] border border-[#4f4539]/30 space-y-1 text-xs">
                    <div className="flex justify-between text-[#d2c4b4]">
                      <span>KDS Login Email:</span>
                      <span className="font-mono text-[#e3e2e2] font-semibold">{chef.email}</span>
                    </div>
                    <div className="flex justify-between text-[#d2c4b4]">
                      <span>Role Scope:</span>
                      <span className="font-semibold text-purple-300">Kitchen Display Only</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#4f4539]/20 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedChef(chef);
                      setIsPasswordModalOpen(true);
                    }}
                    className="flex-1 py-2 rounded-xl bg-[#121414] hover:bg-[#343535] text-xs font-semibold text-[#d2c4b4] hover:text-[#edbf7b] border border-[#4f4539]/30 transition-colors"
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Create Chef Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#1f2020] rounded-3xl border border-[#edbf7b]/40 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#4f4539]/30">
              <h3 className="font-serif-heading text-lg font-bold text-[#edbf7b]">
                Add Kitchen Chef
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#9b8f80] hover:text-[#e3e2e2]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateChef} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#d2c4b4]">Chef Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chef Marcus Sterling"
                  className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#d2c4b4]">Login Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="chef.marcus@aurelian.com"
                  className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#d2c4b4]">Initial Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                />
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
                  Create Chef
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {isPasswordModalOpen && selectedChef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#1f2020] rounded-3xl border border-[#edbf7b]/40 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#4f4539]/30">
              <h3 className="font-serif-heading text-lg font-bold text-[#edbf7b]">
                Reset Chef Password
              </h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-[#9b8f80] hover:text-[#e3e2e2]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-[#d2c4b4]">
              Setting new KDS password for <strong className="text-[#e3e2e2]">{selectedChef.name}</strong>
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#d2c4b4]">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 h-10 rounded-xl bg-[#121414] text-[#d2c4b4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-[#edbf7b] text-[#442b00] font-bold shadow-lg"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
