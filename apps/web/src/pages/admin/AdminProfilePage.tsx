import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';

export const AdminProfilePage: React.FC = () => {
  const { user, setAuth } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile');
      setName(res.data.name || '');
      setEmail(res.data.email || '');
      setPhone(res.data.phone || '');
      setAvatarUrl(res.data.avatarUrl || '');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage(null);

    try {
      const res = await api.put('/profile', { name, phone, avatarUrl });
      if (user) {
        setAuth({ ...user, name: res.data.name }, localStorage.getItem('token') || '');
      }
      setProfileMessage('Profile details updated successfully!');
      setTimeout(() => setProfileMessage(null), 3500);
    } catch (err: any) {
      setProfileMessage(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage('New passwords do not match');
      return;
    }
    setIsUpdatingPassword(true);
    setPasswordMessage(null);

    try {
      await api.patch('/profile/password', { currentPassword, newPassword });
      setPasswordMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(null), 3500);
    } catch (err: any) {
      setPasswordMessage(err.response?.data?.error || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] flex">
      <AdminSidebar />

      <div className="pl-64 flex-1 flex flex-col">
        <AdminHeader title="Admin Account Profile" />

        <main className="pt-16 p-8 space-y-6 max-w-4xl w-full">
          {/* Title Header */}
          <div className="border-b border-[#4f4539]/20 pb-4">
            <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#e3e2e2]">
              Administrator Profile & Security
            </h1>
            <p className="text-xs text-[#d2c4b4]/60 mt-0.5">
              Manage personal credentials, security keys, and estate management authorizations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Info Form */}
            <div className="p-6 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-4 shadow-xl">
              <h3 className="font-serif-heading font-bold text-base text-[#edbf7b] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">badge</span>
                <span>Personal Information</span>
              </h3>

              {profileMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                  {profileMessage}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Email (Read-only)</label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full h-10 bg-[#121414]/60 rounded-xl px-3.5 text-[#d2c4b4]/50 border border-[#4f4539]/20 cursor-not-allowed font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44 7700 ..."
                    className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Avatar URL (Optional)</label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full h-11 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
                >
                  Save Profile Info
                </button>
              </form>
            </div>

            {/* Password Change Form */}
            <div className="p-6 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-4 shadow-xl">
              <h3 className="font-serif-heading font-bold text-base text-[#edbf7b] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">lock</span>
                <span>Security & Password</span>
              </h3>

              {passwordMessage && (
                <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-semibold">
                  {passwordMessage}
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">New Password (min 6 characters)</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full h-11 rounded-xl bg-[#121414] hover:bg-[#343535] border border-[#edbf7b]/40 text-[#edbf7b] font-bold text-xs uppercase tracking-wider transition-colors shadow-md"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
