'use client';

import { useState, useEffect } from 'react';

interface WelcomeGuideProps {
  onNavigate: (tab: string) => void;
}

export function WelcomeGuide({ onNavigate }: WelcomeGuideProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    const hidden = localStorage.getItem('welcome-guide-dismissed');
    if (hidden === 'true') {
      setDismissed(true);
      setShowGuide(false);
    }
  }, []);

  const handleDismiss = () => {
    setShowGuide(false);
    localStorage.setItem('welcome-guide-dismissed', 'true');
    setDismissed(true);
  };

  const handleShowAgain = () => {
    setShowGuide(true);
    setDismissed(false);
    localStorage.removeItem('welcome-guide-dismissed');
  };

  if (!showGuide && dismissed) {
    return (
      <button
        onClick={handleShowAgain}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-emerald-400 bg-zinc-800/60 border border-zinc-700/50 rounded-lg transition-all hover:border-emerald-500/30"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Tampilkan Panduan
      </button>
    );
  }

  if (!showGuide) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <span className="text-xl">👋</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Selamat Datang di Test Dashboard!</h2>
            <p className="text-sm text-zinc-400">Panduan singkat untuk memulai</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-zinc-400 hover:text-white transition-colors p-1"
          title="Tutup panduan"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Step 1 */}
        <button
          onClick={() => onNavigate('run')}
          className="group text-left bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 hover:border-emerald-500/30 rounded-xl p-4 transition-all"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">1</span>
            <span className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">🚀 Jalankan Test</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Pilih <strong className="text-zinc-300">environment</strong> (Dev/project/Production),
            lalu pilih <strong className="text-zinc-300">tag</strong> test yang ingin dijalankan,
            kemudian klik tombol <strong className="text-emerald-400">Run</strong>.
          </p>
          <div className="mt-2 text-xs text-emerald-400/70 group-hover:text-emerald-400 transition-colors">
            Klik untuk mulai →
          </div>
        </button>

        {/* Step 2 */}
        <button
          onClick={() => onNavigate('history')}
          className="group text-left bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 hover:border-blue-500/30 rounded-xl p-4 transition-all"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">2</span>
            <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">📊 Lihat Hasil</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Setelah test selesai, lihat hasilnya secara otomatis.
            Hasil juga disimpan di <strong className="text-zinc-300">History</strong> untuk dilihat kapan saja.
          </p>
          <div className="mt-2 text-xs text-blue-400/70 group-hover:text-blue-400 transition-colors">
            Lihat riwayat →
          </div>
        </button>

        {/* Step 3 */}
        <button
          onClick={() => onNavigate('features')}
          className="group text-left bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 hover:border-purple-500/30 rounded-xl p-4 transition-all"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">3</span>
            <span className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors">📁 Jelajahi Test</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Browse semua <strong className="text-zinc-300">skenario test</strong> yang tersedia.
            Lihat fitur apa saja yang sudah dicover oleh automation test.
          </p>
          <div className="mt-2 text-xs text-purple-400/70 group-hover:text-purple-400 transition-colors">
            Lihat fitur →
          </div>
        </button>
      </div>

      {/* Quick Tips */}
      <div className="bg-zinc-800/40 rounded-lg p-3">
        <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM4 11a1 1 0 100-2H3a1 1 0 000 2h1zM10 18a1 1 0 001-1v-1a1 1 0 10-2 0v1a1 1 0 001 1z" />
            <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" clipRule="evenodd" />
          </svg>
          Tips Cepat
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-zinc-400">
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">•</span>
            <span><strong className="text-zinc-300">Tag</strong> = label untuk mengelompokkan test. Contoh: <code className="text-emerald-300 bg-zinc-700/50 px-1 rounded">@smoke</code> untuk test dasar, <code className="text-emerald-300 bg-zinc-700/50 px-1 rounded">@p0</code> untuk prioritas tinggi.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">•</span>
            <span><strong className="text-zinc-300">Environment</strong> = server tujuan test. <code className="text-blue-300 bg-zinc-700/50 px-1 rounded">Dev</code> untuk development, <code className="text-yellow-300 bg-zinc-700/50 px-1 rounded">project</code> untuk pre-production.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-yellow-400 mt-0.5">•</span>
            <span><strong className="text-zinc-300">Feature file</strong> = file skenario test yang ditulis dalam bahasa Gherkin (Given/When/Then).</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400 mt-0.5">•</span>
            <span>Klik <strong className="text-zinc-300">tag</strong> untuk memilih, lalu tekan <strong className="text-emerald-400">Run</strong>. Hasil muncul otomatis di bawah.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
