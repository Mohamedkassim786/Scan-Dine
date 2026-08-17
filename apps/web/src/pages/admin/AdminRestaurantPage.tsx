import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';

export const AdminRestaurantPage: React.FC = () => {
  const [restaurantId, setRestaurantId] = useState('');
  const [name, setName] = useState('Aurelian');
  const [cuisine, setCuisine] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [openTime, setOpenTime] = useState('11:00');
  const [closeTime, setCloseTime] = useState('23:30');
  const [currency, setCurrency] = useState('₹');
  const [taxPercentage, setTaxPercentage] = useState('5.0');
  const [serviceChargePercentage, setServiceChargePercentage] = useState('0.0');
  const [isOpen, setIsOpen] = useState(true);
  const [isTemporarilyClosed, setIsTemporarilyClosed] = useState(false);
  const [temporaryClosureReason, setTemporaryClosureReason] = useState('');

  // Weekly Schedule
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, string>>({
    mon: '11:00 - 23:30',
    tue: '11:00 - 23:30',
    wed: '11:00 - 23:30',
    thu: '11:00 - 23:30',
    fri: '11:00 - 00:00',
    sat: '11:00 - 00:00',
    sun: '11:00 - 23:00',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRestaurant();
  }, []);

  const fetchRestaurant = async () => {
    try {
      const res = await api.get('/restaurants');
      if (res.data.length > 0) {
        const r = res.data[0];
        setRestaurantId(r.id);
        setName(r.name || '');
        setCuisine(r.cuisine || '');
        setDescription(r.description || '');
        setLogoUrl(r.logoUrl || '');
        setCoverUrl(r.coverUrl || '');
        setPhone(r.phone || '');
        setEmail(r.email || '');
        setAddress(r.address || '');
        setOpenTime(r.openTime || '11:00');
        setCloseTime(r.closeTime || '23:30');
        setCurrency(r.currency || '₹');
        setTaxPercentage(String(r.taxPercentage || 5.0));
        setServiceChargePercentage(String(r.serviceChargePercentage || 0.0));
        setIsOpen(r.isOpen ?? true);
        setIsTemporarilyClosed(r.isTemporarilyClosed ?? false);
        setTemporaryClosureReason(r.temporaryClosureReason || '');

        if (r.weeklySchedule) {
          try {
            setWeeklySchedule(
              typeof r.weeklySchedule === 'string' ? JSON.parse(r.weeklySchedule) : r.weeklySchedule
            );
          } catch {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch restaurant:', err);
    }
  };

  const handleUploadImage = async (file: File, type: 'logo' | 'cover') => {
    if (type === 'logo') setIsUploadingLogo(true);
    else setIsUploadingCover(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.url) {
        if (type === 'logo') setLogoUrl(res.data.url);
        else setCoverUrl(res.data.url);
      }
    } catch (err) {
      console.error(`Failed to upload ${type}:`, err);
    } finally {
      if (type === 'logo') setIsUploadingLogo(false);
      else setIsUploadingCover(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    setIsSaving(true);
    try {
      await api.put(`/restaurants/${restaurantId}`, {
        name,
        cuisine,
        description,
        logoUrl,
        coverUrl,
        phone,
        email,
        address,
        openTime,
        closeTime,
        currency,
        taxPercentage: parseFloat(taxPercentage) || 0,
        serviceChargePercentage: parseFloat(serviceChargePercentage) || 0,
        isOpen,
        isTemporarilyClosed,
        temporaryClosureReason,
        weeklySchedule,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] flex">
      <AdminSidebar />

      <div className="pl-64 flex-1 flex flex-col">
        <AdminHeader title="Restaurant Configuration" />

        <main className="pt-16 p-8 space-y-6 max-w-5xl w-full">
          {/* Title Header */}
          <div className="flex items-center justify-between border-b border-[#4f4539]/20 pb-4">
            <div>
              <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[#e3e2e2]">
                Restaurant Identity & Operations
              </h1>
              <p className="text-xs text-[#d2c4b4]/60 mt-0.5">
                Manage brand profile, photo uploads, dining schedules, tax rates, and operational closure states
              </p>
            </div>

            {saveSuccess && (
              <div className="px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-fade-in shadow-lg">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Settings Saved Successfully!</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* General Identity Bento */}
            <div className="p-6 rounded-2xl bg-[#1f2020] border border-[#4f4539]/25 space-y-4 shadow-xl">
              <h3 className="font-serif-heading text-lg font-bold text-[#edbf7b] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">storefront</span>
                <span>Brand & Dining Identity</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Restaurant Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Cuisine / Gastronomy Classification</label>
                  <input
                    type="text"
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    placeholder="e.g. Modern European & Indian Fusion"
                    className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Description / Estate Story</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#121414] rounded-xl p-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                  />
                </div>

                {/* Logo Uploader */}
                <div className="space-y-2 p-3.5 rounded-xl bg-[#121414] border border-[#4f4539]/30">
                  <label className="font-bold text-[#edbf7b] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                    <span>Brand Logo</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#1f2020] border border-[#4f4539]/40 overflow-hidden shrink-0 flex items-center justify-center">
                      {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <span className="material-symbols-outlined text-[#4f4539]">image</span>}
                    </div>
                    <div className="flex-1 space-y-1">
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0], 'logo')}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="px-3 py-1 rounded-lg bg-[#edbf7b] text-[#442b00] font-bold text-[10px] uppercase shadow"
                      >
                        {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                      </button>
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-[#1f2020] rounded px-2 py-1 text-[10px] text-[#e3e2e2] border border-[#4f4539]/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Cover Image Uploader */}
                <div className="space-y-2 p-3.5 rounded-xl bg-[#121414] border border-[#4f4539]/30">
                  <label className="font-bold text-[#edbf7b] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                    <span>Hero Cover Photo</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#1f2020] border border-[#4f4539]/40 overflow-hidden shrink-0 flex items-center justify-center">
                      {coverUrl ? <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-[#4f4539]">image</span>}
                    </div>
                    <div className="flex-1 space-y-1">
                      <input
                        type="file"
                        ref={coverInputRef}
                        onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0], 'cover')}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={isUploadingCover}
                        className="px-3 py-1 rounded-lg bg-[#edbf7b] text-[#442b00] font-bold text-[10px] uppercase shadow"
                      >
                        {isUploadingCover ? 'Uploading...' : 'Upload Cover'}
                      </button>
                      <input
                        type="url"
                        value={coverUrl}
                        onChange={(e) => setCoverUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-[#1f2020] rounded px-2 py-1 text-[10px] text-[#e3e2e2] border border-[#4f4539]/30"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact & Location Bento */}
            <div className="p-6 rounded-2xl bg-[#1f2020] border border-[#4f4539]/25 space-y-4 shadow-xl">
              <h3 className="font-serif-heading text-lg font-bold text-[#edbf7b] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">location_on</span>
                <span>Contact & Estate Location</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Concierge Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44 20 7946 0912"
                    className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Inquiry Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="concierge@aurelian.com"
                    className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Physical Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="42 Royal Observatory Way, Greenwich"
                    className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                  />
                </div>
              </div>
            </div>

            {/* Financial, Tax & Currency Bento */}
            <div className="p-6 rounded-2xl bg-[#1f2020] border border-[#4f4539]/25 space-y-4 shadow-xl">
              <h3 className="font-serif-heading text-lg font-bold text-[#edbf7b] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">currency_rupee</span>
                <span>Tax, Currency & Pricing Settings</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Currency Symbol</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] font-bold border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Goods & Services Tax (GST %)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(e.target.value)}
                    className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#d2c4b4]">Service Charge (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={serviceChargePercentage}
                    onChange={(e) => setServiceChargePercentage(e.target.value)}
                    className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
                  />
                </div>
              </div>
            </div>

            {/* Operating Schedule & Temporary Closure */}
            <div className="p-6 rounded-2xl bg-[#1f2020] border border-[#4f4539]/25 space-y-5 shadow-xl">
              <h3 className="font-serif-heading text-lg font-bold text-[#edbf7b] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">schedule</span>
                <span>Operating Hours & Status Controls</span>
              </h3>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#121414] border border-[#4f4539]/30">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-semibold text-xs text-[#e3e2e2]">Open for Service Today</p>
                    <p className="text-[10px] text-[#d2c4b4]/60">Allow active customer ordering</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isOpen}
                    onChange={(e) => setIsOpen(e.target.checked)}
                    className="w-5 h-5 accent-[#edbf7b]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-semibold text-xs text-rose-300">Temporary Closure Mode</p>
                    <p className="text-[10px] text-[#d2c4b4]/60">Display emergency banner on menu</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isTemporarilyClosed}
                    onChange={(e) => setIsTemporarilyClosed(e.target.checked)}
                    className="w-5 h-5 accent-rose-500"
                  />
                </label>
              </div>

              {isTemporarilyClosed && (
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-rose-300">Closure Reason Message to Diners</label>
                  <input
                    type="text"
                    value={temporaryClosureReason}
                    onChange={(e) => setTemporaryClosureReason(e.target.value)}
                    placeholder="E.g., Private estate gala in session. Open tomorrow at 11:00 AM."
                    className="w-full h-10 bg-[#121414] rounded-xl px-3.5 text-[#e3e2e2] border border-rose-500/40 focus:outline-none"
                  />
                </div>
              )}

              {/* Weekly Hours Matrix */}
              <div className="space-y-2 pt-2 text-xs">
                <label className="font-semibold text-[#d2c4b4]">Weekly Operating Schedule</label>
                <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                  {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                    <div key={day} className="p-2.5 rounded-xl bg-[#121414] border border-[#4f4539]/30 space-y-1">
                      <span className="font-bold uppercase text-[10px] text-[#edbf7b]">{day}</span>
                      <input
                        type="text"
                        value={weeklySchedule[day] || '11:00 - 23:30'}
                        onChange={(e) =>
                          setWeeklySchedule({ ...weeklySchedule, [day]: e.target.value })
                        }
                        className="w-full bg-transparent text-[11px] text-[#e3e2e2] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Save CTA */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 h-12 rounded-xl bg-[#edbf7b] hover:bg-[#ffddb0] text-[#442b00] font-bold text-xs uppercase tracking-widest transition-all shadow-xl flex items-center gap-2"
              >
                {isSaving ? (
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Save Restaurant Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};
