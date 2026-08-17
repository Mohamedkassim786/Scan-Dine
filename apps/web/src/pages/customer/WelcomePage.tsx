import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomerStore } from '../../store/useCustomerStore';

export const WelcomePage: React.FC = () => {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const navigate = useNavigate();
  const { restaurant, table, isLoading, error, initSessionFromQR } = useCustomerStore();

  useEffect(() => {
    if (token) {
      initSessionFromQR(token);
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121414] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-[#edbf7b] border-t-transparent animate-spin mb-4" />
        <p className="text-[#edbf7b] font-serif-heading text-lg">Authenticating table QR...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121414] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-950/50 border border-rose-500/50 flex items-center justify-center text-rose-400 mb-4">
          <span className="material-symbols-outlined text-[32px]">qr_code_scanner</span>
        </div>
        <h2 className="font-serif-heading text-2xl font-bold text-[#e3e2e2] mb-2">QR Code Issue</h2>
        <p className="text-[#d2c4b4] text-sm max-w-xs mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-full bg-[#edbf7b] text-[#442b00] font-semibold text-xs uppercase tracking-wider"
        >
          Retry Scan
        </button>
      </div>
    );
  }

  const handleViewMenu = () => {
    navigate(`/r/${slug}/t/${token}/menu`);
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] flex flex-col justify-between animate-fade-in pb-10">
      {/* Top Cover Hero */}
      <div className="relative w-full h-[52vh] min-h-[380px] bg-[#1f2020] overflow-hidden">
        <img
          src={
            restaurant?.coverUrl ||
            'https://lh3.googleusercontent.com/aida-public/AB6AXuDZNEXKPCZ9-5qjSkmpJqU4-7cjOJpdcwOXjqAN2a6_3LjxxyGk80QvYJqwt_9vokM5qetmHCy1wvzx0BKKkJCM0tfWx9o-7Mq_YE8Sc_w5QzxTDpLpHa2Qod3SqFY09x4IwcYduZDi6oziWmfQj4mGKn86ZsFUwYYlcGq3cyQJch4R4YzlaKvyH1sH5K4qqNmdVRlIm2vMjX2oeDN4E-cBaLz-mYHruGVAg6fGDinKqOq-P_BXd288'
          }
          alt="Restaurant Cover"
          className="w-full h-full object-cover"
        />
        {/* Gradient Scrims */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121414] via-[#121414]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#121414]/60 via-transparent to-transparent" />

        {/* Brand & Table Overlay */}
        <div className="absolute bottom-6 left-6 right-6 z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-[#edbf7b] uppercase tracking-widest">
              Live Service Active
            </span>
          </div>

          <h1 className="font-serif-heading text-4xl sm:text-5xl font-extrabold text-[#edbf7b] tracking-tight">
            {restaurant?.name || 'Aurelian'}
          </h1>

          <div className="flex items-center gap-2 text-xs text-[#d2c4b4]">
            <span>{restaurant?.cuisine || 'Modern European'}</span>
            <span className="w-1 h-1 rounded-full bg-[#9b8f80]" />
            <span>London, Greenwich</span>
          </div>
        </div>
      </div>

      {/* Main Body Section */}
      <div className="px-6 space-y-6 max-w-md mx-auto w-full -mt-4 z-20">
        {/* Seating Card */}
        <div className="p-5 rounded-2xl bg-[#1f2020] border border-[#4f4539]/40 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#d2c4b4]/70">
              Verified Seating
            </p>
            <p className="font-serif-heading text-2xl font-bold text-[#e3e2e2] mt-0.5">
              Table {String(table?.tableNumber || 1).padStart(2, '0')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#121414] border border-[#edbf7b]/30 flex items-center justify-center text-[#edbf7b] shadow-inner">
            <span className="material-symbols-outlined text-[24px]">restaurant</span>
          </div>
        </div>

        {/* Welcome Description */}
        <p className="text-center text-xs text-[#d2c4b4]/80 leading-relaxed px-2">
          Welcome to {restaurant?.name || 'Aurelian'}. Your table identity is securely synchronized. Scan & Dine AI is active to curate your dining experience.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleViewMenu}
            className="w-full h-14 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-sm uppercase tracking-widest transition-all duration-200 shadow-[0_4px_20px_rgba(189,147,84,0.25)] active:scale-98 flex items-center justify-center gap-2"
          >
            <span>Discover Menu</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>

          <button
            onClick={() => navigate(`/r/${slug}/t/${token}/assistant`)}
            className="w-full h-12 rounded-xl bg-transparent border border-[#4f4539]/60 hover:border-[#edbf7b]/60 text-[#edbf7b] font-semibold text-xs uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            <span>Ask Dine AI Sommelier</span>
          </button>
        </div>
      </div>
    </div>
  );
};
