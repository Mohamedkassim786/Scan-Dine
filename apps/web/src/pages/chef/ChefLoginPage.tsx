import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export const ChefLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('chef.marcus@aurelian.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password, 'chef');
      navigate('/chef/kitchen');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e0f] text-[#e3e2e2] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1f2020] rounded-2xl border border-[#4f4539]/30 p-8 shadow-2xl space-y-6">
        {/* Chef Icon & Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-[#121414] border border-[#edbf7b]/40 mx-auto flex items-center justify-center text-[#edbf7b] shadow-inner">
            <span className="material-symbols-outlined text-[32px]">skillet</span>
          </div>
          <h1 className="font-serif-heading text-2xl font-bold text-[#edbf7b]">
            Kitchen Display System
          </h1>
          <p className="text-xs text-[#d2c4b4]/70">Executive Chef & Line Cook Terminal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#d2c4b4]">Chef Credentials / Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9b8f80] text-[18px]">
                badge
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chef@restaurant.com"
                className="w-full h-11 bg-[#121414] rounded-xl pl-9 pr-3 text-xs text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#d2c4b4]">Security Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9b8f80] text-[18px]">
                lock
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 bg-[#121414] rounded-xl pl-9 pr-3 text-xs text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
              />
            </div>
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
                <span>Access Kitchen Board</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="pt-4 border-t border-[#4f4539]/20 text-center space-y-1">
          <p className="text-[11px] text-[#d2c4b4]/60">Demo Login: <span className="text-[#edbf7b]">chef.marcus@aurelian.com</span></p>
          <p className="text-[11px] text-[#d2c4b4]/60">Password: <span className="text-[#edbf7b]">password123</span></p>
        </div>
      </div>
    </div>
  );
};
