import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export const LandingPage: React.FC = () => {
  const [demoQrToken, setDemoQrToken] = useState<string>('tbl-token-7a2c9dd5-de45-4fa5-a8a4-4ec6ecd38780');

  useEffect(() => {
    api.get('/restaurants/aurelian/demo-table')
      .then((res) => {
        if (res.data?.qrToken) {
          setDemoQrToken(res.data.qrToken);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0e0f] text-[#e3e2e2] flex flex-col justify-between selection:bg-[#edbf7b] selection:text-[#121414]">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-header">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://lh3.googleusercontent.com/aida/AP1WRLschiOZ0NVcE0OBlkc9Ry8PdhCC_xP8tOOAdTw8D9egbzKblxBr2Q5vJ4_q8q2LnNXjsbXFLijeI_9Mwu0aAjpQAEJnox-qFfmwjtXkXAPokPZ8ahk1arQG0Rfcbu2nV58Vd9D4yrqCY9tg1Ig7GefYRUtX9qDUUjM0Ajvss2AYmmLq6zUvCBkMcbzHDp0gQrag42ljh_wuMBLwJg9IM1bumqKAQn6mA5lmeRPHQRr7RjxckxrT1KIskXw"
              alt="Scan & Dine"
              className="h-9 w-auto object-contain"
            />
            <span className="font-serif-heading font-extrabold text-xl text-[#edbf7b] tracking-wider">
              SCAN & DINE
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/chef/login"
              className="px-4 py-2 rounded-xl bg-[#1f2020] hover:bg-[#343535] border border-[#4f4539]/40 text-xs font-semibold uppercase tracking-wider text-[#d2c4b4] hover:text-[#e3e2e2] transition-colors"
            >
              Chef KDS
            </Link>
            <Link
              to="/admin/login"
              className="px-5 py-2 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] text-xs font-bold uppercase tracking-wider transition-all shadow-lg"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Landing Sections */}
      <main className="pt-24 space-y-24 max-w-7xl mx-auto px-6 pb-20">
        {/* Hero Section */}
        <section className="pt-12 pb-8 text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1f2020] border border-[#edbf7b]/40 text-xs font-semibold text-[#edbf7b] tracking-widest uppercase shadow-sm">
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            <span>Intelligent Hospitality 2.0</span>
          </div>

          <h1 className="font-serif-heading text-4xl sm:text-6xl font-extrabold text-[#e3e2e2] tracking-tight leading-tight">
            Your Table Just Got <span className="gold-gradient-text">Smarter.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#d2c4b4]/80 leading-relaxed font-normal max-w-2xl mx-auto">
            Scan a luxury restaurant table QR. The menu opens immediately in the browser with zero app installation, zero customer login, and real-time kitchen synchronization.
          </p>

          {/* Direct Demo CTA Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Direct customer demo: Table 1 */}
            <Link
              to={`/r/aurelian/t/${demoQrToken}`}
              className="w-full sm:w-auto px-8 h-14 rounded-2xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-sm uppercase tracking-widest transition-all duration-200 shadow-[0_4px_25px_rgba(189,147,84,0.3)] flex items-center justify-center gap-2 active:scale-98"
            >
              <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
              <span>Test Customer QR (Table 01)</span>
            </Link>

            <Link
              to="/chef/login"
              className="w-full sm:w-auto px-7 h-14 rounded-2xl bg-[#1f2020] hover:bg-[#343535] border border-[#4f4539]/60 text-[#e3e2e2] font-semibold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">skillet</span>
              <span>Kitchen Display Terminal</span>
            </Link>
          </div>
        </section>

        {/* 3 Pillars / User Experiences */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-serif-heading text-3xl font-bold text-[#e3e2e2]">
              Three Purpose-Built Interfaces
            </h2>
            <p className="text-xs sm:text-sm text-[#d2c4b4]/70">
              Harmonious real-time interaction between Customer, Kitchen, and Estate Management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer */}
            <div className="p-8 rounded-3xl bg-[#161818] border border-[#4f4539]/25 hover:border-[#edbf7b]/40 transition-all space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#1f2020] border border-[#edbf7b]/30 flex items-center justify-center text-[#edbf7b]">
                  <span className="material-symbols-outlined text-[28px]">phone_iphone</span>
                </div>
                <h3 className="font-serif-heading text-xl font-bold text-[#e3e2e2]">1. Customer Experience</h3>
                <ul className="text-xs text-[#d2c4b4]/80 space-y-2 leading-relaxed">
                  <li className="flex items-center gap-2">✓ No login, no app installation</li>
                  <li className="flex items-center gap-2">✓ Verified table QR code identity</li>
                  <li className="flex items-center gap-2">✓ Interactive Dine AI Concierge</li>
                  <li className="flex items-center gap-2">✓ Live real-time order tracking</li>
                </ul>
              </div>
              <Link
                to={`/r/aurelian/t/${demoQrToken}`}
                className="mt-6 block text-center py-3 rounded-xl bg-[#1f2020] hover:bg-[#edbf7b] hover:text-[#442b00] text-[#edbf7b] font-bold text-xs uppercase tracking-wider transition-all border border-[#edbf7b]/30"
              >
                Launch Menu (Table 01) →
              </Link>
            </div>

            {/* Chef */}
            <div className="p-8 rounded-3xl bg-[#161818] border border-[#4f4539]/25 hover:border-[#edbf7b]/40 transition-all space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#1f2020] border border-[#edbf7b]/30 flex items-center justify-center text-[#edbf7b]">
                  <span className="material-symbols-outlined text-[28px]">skillet</span>
                </div>
                <h3 className="font-serif-heading text-xl font-bold text-[#e3e2e2]">2. Kitchen Display (KDS)</h3>
                <ul className="text-xs text-[#d2c4b4]/80 space-y-2 leading-relaxed">
                  <li className="flex items-center gap-2">✓ High-contrast tablet/display board</li>
                  <li className="flex items-center gap-2">✓ Kanban order workflow (New → Ready)</li>
                  <li className="flex items-center gap-2">✓ Instant WebSocket push chime</li>
                  <li className="flex items-center gap-2">✓ Special allergy & guest notes</li>
                </ul>
              </div>
              <Link
                to="/chef/login"
                className="mt-6 block text-center py-3 rounded-xl bg-[#1f2020] hover:bg-[#edbf7b] hover:text-[#442b00] text-[#edbf7b] font-bold text-xs uppercase tracking-wider transition-all border border-[#edbf7b]/30"
              >
                Open Kitchen Terminal →
              </Link>
            </div>

            {/* Admin */}
            <div className="p-8 rounded-3xl bg-[#161818] border border-[#4f4539]/25 hover:border-[#edbf7b]/40 transition-all space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#1f2020] border border-[#edbf7b]/30 flex items-center justify-center text-[#edbf7b]">
                  <span className="material-symbols-outlined text-[28px]">admin_panel_settings</span>
                </div>
                <h3 className="font-serif-heading text-xl font-bold text-[#e3e2e2]">3. Admin Estate Control</h3>
                <ul className="text-xs text-[#d2c4b4]/80 space-y-2 leading-relaxed">
                  <li className="flex items-center gap-2">✓ Live revenue & order analytics</li>
                  <li className="flex items-center gap-2">✓ Dynamic menu & recipe management</li>
                  <li className="flex items-center gap-2">✓ Table QR generator & print sheets</li>
                  <li className="flex items-center gap-2">✓ Chef staff authentication roles</li>
                </ul>
              </div>
              <Link
                to="/admin/login"
                className="mt-6 block text-center py-3 rounded-xl bg-[#1f2020] hover:bg-[#edbf7b] hover:text-[#442b00] text-[#edbf7b] font-bold text-xs uppercase tracking-wider transition-all border border-[#edbf7b]/30"
              >
                Access Admin Suite →
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works Step-by-Step */}
        <section className="p-10 rounded-3xl bg-[#1f2020] border border-[#4f4539]/30 space-y-8 shadow-2xl">
          <div className="text-center space-y-2">
            <h2 className="font-serif-heading text-3xl font-bold text-[#e3e2e2]">The Frictionless Dining Flow</h2>
            <p className="text-xs sm:text-sm text-[#d2c4b4]/70">From physical table scan to kitchen preparation</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-center">
            <div className="space-y-2 p-4">
              <div className="w-12 h-12 rounded-full bg-[#121414] border border-[#edbf7b]/40 text-[#edbf7b] font-serif-heading text-lg font-bold flex items-center justify-center mx-auto">
                1
              </div>
              <h4 className="font-serif-heading font-semibold text-sm text-[#e3e2e2]">Scan Table QR</h4>
              <p className="text-[11px] text-[#d2c4b4]/70 leading-relaxed">
                Guest scans table card. Backend validates token and maps table identity.
              </p>
            </div>

            <div className="space-y-2 p-4">
              <div className="w-12 h-12 rounded-full bg-[#121414] border border-[#edbf7b]/40 text-[#edbf7b] font-serif-heading text-lg font-bold flex items-center justify-center mx-auto">
                2
              </div>
              <h4 className="font-serif-heading font-semibold text-sm text-[#e3e2e2]">Curate & Select</h4>
              <p className="text-[11px] text-[#d2c4b4]/70 leading-relaxed">
                Browse luxury dishes, view allergens, and ask Dine AI for vintage wine pairings.
              </p>
            </div>

            <div className="space-y-2 p-4">
              <div className="w-12 h-12 rounded-full bg-[#121414] border border-[#edbf7b]/40 text-[#edbf7b] font-serif-heading text-lg font-bold flex items-center justify-center mx-auto">
                3
              </div>
              <h4 className="font-serif-heading font-semibold text-sm text-[#e3e2e2]">Instant Order Push</h4>
              <p className="text-[11px] text-[#d2c4b4]/70 leading-relaxed">
                Order fires directly to the kitchen display with table number and guest notes.
              </p>
            </div>

            <div className="space-y-2 p-4">
              <div className="w-12 h-12 rounded-full bg-[#121414] border border-[#edbf7b]/40 text-[#edbf7b] font-serif-heading text-lg font-bold flex items-center justify-center mx-auto">
                4
              </div>
              <h4 className="font-serif-heading font-semibold text-sm text-[#e3e2e2]">Live Tracking</h4>
              <p className="text-[11px] text-[#d2c4b4]/70 leading-relaxed">
                Guest follows cooking progress live on mobile until dishes are served.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#4f4539]/20 py-8 bg-[#0d0e0f] text-center text-xs text-[#d2c4b4]/60">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Scan & Dine Systems. Engineered for luxury hospitality.</p>
          <div className="flex items-center gap-6">
            <Link to="/chef/login" className="hover:text-[#edbf7b]">Chef Display</Link>
            <Link to="/admin/login" className="hover:text-[#edbf7b]">Admin Portal</Link>
            <Link to={`/r/aurelian/t/${demoQrToken}`} className="hover:text-[#edbf7b]">Customer Demo</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
