import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';

export const AdminStaffPage: React.FC = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('staff');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/staff');
      setStaff(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/staff', {
        name,
        email,
        password,
        phone,
        role,
      });

      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create staff member');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    try {
      await api.patch(`/staff/${selectedStaff.id}/password`, { password: newPassword });
      setIsPasswordModalOpen(false);
      setNewPassword('');
      alert('Password updated successfully');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reset password');
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      await api.put(`/staff/${user.id}`, { isActive: !user.isActive });
      fetchStaff();
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-[#edbf7b]/20 text-[#edbf7b] border-[#edbf7b]/40';
      case 'chef':
        return 'bg-purple-950/60 text-purple-300 border-purple-500/40';
      case 'staff':
        return 'bg-blue-950/60 text-blue-300 border-blue-500/40';
      default:
        return 'bg-neutral-900 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] flex">
      <AdminSidebar />

      <div className="pl-64 flex-1 flex flex-col">
        <AdminHeader title="Restaurant Staff & Access Control" />

        <main className="pt-16 p-8 space-y-6 max-w-6xl w-full">
          {/* Header Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#4f4539]/20 pb-4">
            <div>
              <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#e3e2e2]">
                Staff & Role Permissions
              </h1>
              <p className="text-xs text-[#d2c4b4]/60 mt-0.5">
                Manage accounts for Executive Chefs, Estate Managers, and Dining Floor Runners
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Add Staff Member</span>
            </button>
          </div>

          {/* Staff Table */}
          <div className="bg-[#1f2020] rounded-2xl border border-[#4f4539]/20 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#4f4539]/30 text-[10px] font-bold uppercase tracking-wider text-[#d2c4b4]/60 bg-[#121414]/40">
                    <th className="p-4">Staff Member</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#4f4539]/15 text-[#e3e2e2]">
                  {staff.map((u) => (
                    <tr key={u.id} className="hover:bg-[#121414]/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#121414] border border-[#edbf7b]/40 flex items-center justify-center font-bold text-[#edbf7b]">
                            {u.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-[#e3e2e2]">{u.name}</p>
                            <p className="text-[10px] text-[#d2c4b4]/60">Joined: {new Date(u.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRoleBadge(u.role)}`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-xs text-[#d2c4b4]">{u.email}</td>
                      <td className="p-4 text-xs text-[#d2c4b4]">{u.phone || '—'}</td>

                      <td className="p-4">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            u.isActive
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedStaff(u);
                            setIsPasswordModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#121414] hover:bg-[#343535] text-[10px] font-semibold text-[#d2c4b4] hover:text-[#edbf7b] border border-[#4f4539]/30 transition-colors"
                        >
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Create Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#1f2020] rounded-3xl border border-[#edbf7b]/40 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#4f4539]/30">
              <h3 className="font-serif-heading text-lg font-bold text-[#edbf7b]">
                Add New Staff Member
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#9b8f80] hover:text-[#e3e2e2]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#d2c4b4]">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marcus Vance"
                  className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#d2c4b4]">Role Assignment</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-10 bg-[#121414] rounded-xl px-3 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                >
                  <option value="chef">Chef (Kitchen Terminal Only)</option>
                  <option value="staff">Staff (Table & Orders View Only)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#d2c4b4]">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@aurelian.com"
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

              <div className="space-y-1">
                <label className="font-semibold text-[#d2c4b4]">Phone (Optional)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 ..."
                  className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40"
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
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {isPasswordModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#1f2020] rounded-3xl border border-[#edbf7b]/40 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#4f4539]/30">
              <h3 className="font-serif-heading text-lg font-bold text-[#edbf7b]">
                Reset Staff Password
              </h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-[#9b8f80] hover:text-[#e3e2e2]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-[#d2c4b4]">
              Setting new password for <strong className="text-[#e3e2e2]">{selectedStaff.name}</strong> ({selectedStaff.email})
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
                  className="flex-1 h-10 rounded-xl bg-[#121414] text-[#d2c4b4] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-[#edbf7b] text-[#442b00] font-bold shadow-lg"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
