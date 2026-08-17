import React, { useState } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';

export const AdminSettingsPage: React.FC = () => {
  const [sessionTimeout, setSessionTimeout] = useState('12');
  const [requireTableToken, setRequireTableToken] = useState(true);
  const [enableAuditLogging, setEnableAuditLogging] = useState(true);
  const [autoArchiveDays, setAutoArchiveDays] = useState('90');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] flex">
      <AdminSidebar />

      <div className="pl-64 flex-1 flex flex-col">
        <AdminHeader title="Platform Security & Tenant Settings" />

        <main className="pt-16 p-8 space-y-6 max-w-4xl w-full">
          {/* Header Action */}
          <div className="flex items-center justify-between border-b border-[#4f4539]/20 pb-4">
            <div>
              <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#e3e2e2]">
                Security & Tenant Architecture
              </h1>
              <p className="text-xs text-[#d2c4b4]/60 mt-0.5">
                Configure restaurant multi-tenant boundaries, audit retention, and API encryption tokens
              </p>
            </div>

            {saved && (
              <span className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>Security Policies Updated</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Multi-Tenant Security Bento */}
            <div className="p-6 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 space-y-4 shadow-xl">
              <h3 className="font-serif-heading font-bold text-base text-[#edbf7b] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">security</span>
                <span>Tenant Isolation & Access Rules</span>
              </h3>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#121414] border border-[#4f4539]/30 cursor-pointer">
                  <div>
                    <p className="font-semibold text-[#e3e2e2]">Strict QR Token Scoping</p>
                    <p className="text-[11px] text-[#d2c4b4]/60">Require cryptographically signed table tokens to place orders</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireTableToken}
                    onChange={(e) => setRequireTableToken(e.target.checked)}
                    className="w-5 h-5 accent-[#edbf7b]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#121414] border border-[#4f4539]/30 cursor-pointer">
                  <div>
                    <p className="font-semibold text-[#e3e2e2]">Immutable Audit Logging</p>
                    <p className="text-[11px] text-[#d2c4b4]/60">Record all menu modifications and chef updates</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableAuditLogging}
                    onChange={(e) => setEnableAuditLogging(e.target.checked)}
                    className="w-5 h-5 accent-[#edbf7b]"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Admin Session Expiry (Hours)</label>
                  <input
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Data Archive Retention (Days)</label>
                  <input
                    type="number"
                    value={autoArchiveDays}
                    onChange={(e) => setAutoArchiveDays(e.target.value)}
                    className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 h-11 rounded-xl bg-[#edbf7b] text-[#442b00] font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-[#ffddb0] transition-all"
              >
                Save Security Settings
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};
