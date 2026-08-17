import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('admin@aurelian.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password, 'admin');
      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e0f] text-[#e3e2e2] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1f2020] rounded-2xl border border-[#4f4539]/30 p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <img
            src="https://lh3.googleusercontent.com/aida/AP1WRLschiOZ0NVcE0OBlkc9Ry8PdhCC_xP8tOOAdTw8D9egbzKblxBr2Q5vJ4_q8q2LnNXjsbXFLijeI_9Mwu0aAjpQAEJnox-qFfmwjtXkXAPokPZ8ahk1arQG0Rfcbu2nV58Vd9D4yrqCY9tg1Ig7GefYRUtX9qDUUjM0Ajvss2AYmmLq6zUvCBkMcbzHDp0gQrag42ljh_wuMBLwJg9IM1bumqKAQn6mA5lmeRPHQRr7RjxckxrT1KIskXw"
            alt="Scan & Dine Logo"
            className="h-10 w-auto mx-auto object-contain mb-1"
          />
          <h1 className="font-serif-heading text-2xl font-bold text-[#edbf7b]">
            Restaurant Management Console
          </h1>
          <p className="text-xs text-[#d2c4b4]/70">Admin Authorization Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#d2c4b4]">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@aurelian.com"
              className="w-full h-11 bg-[#121414] rounded-xl px-3.5 text-xs text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#d2c4b4]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 bg-[#121414] rounded-xl px-3.5 text-xs text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-widest transition-all duration-200 shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
            ) : (
              <>
                <span>Access Management System</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[#4f4539]/20 text-center space-y-1">
          <p className="text-[11px] text-[#d2c4b4]/60">Demo Admin: <span className="text-[#edbf7b]">admin@aurelian.com</span></p>
          <p className="text-[11px] text-[#d2c4b4]/60">Password: <span className="text-[#edbf7b]">password123</span></p>
        </div>
      </div>
    </div>
  );
};
