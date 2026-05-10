'use client';

import { useState } from 'react';
import { Environment } from '@/lib/types';

interface TestRunnerProps {
  availableTags: string[];
  onRun: (tags: string[], environment: Environment) => void;
  isRunning: boolean;
}

const environments: { value: Environment; label: string; description: string; icon: string; color: string; activeColor: string }[] = [
  { value: 'dev', label: 'Dev', description: 'Server Development', icon: '🛠', color: 'border-blue-500/30 bg-blue-500/5', activeColor: 'border-blue-500 bg-blue-500/20 text-blue-300 shadow-blue-500/10' },
  { value: 'project', label: 'project', description: 'Server Pre-Production', icon: '🧪', color: 'border-yellow-500/30 bg-yellow-500/5', activeColor: 'border-yellow-500 bg-yellow-500/20 text-yellow-300 shadow-yellow-500/10' },
  { value: 'prod', label: 'Production', description: 'Server Live/Aktif', icon: '🚀', color: 'border-red-500/30 bg-red-500/5', activeColor: 'border-red-500 bg-red-500/20 text-red-300 shadow-red-500/10' },
  { value: 'map', label: 'Map', description: 'Server Peta', icon: '🗺', color: 'border-purple-500/30 bg-purple-500/5', activeColor: 'border-purple-500 bg-purple-500/20 text-purple-300 shadow-purple-500/10' },
];

const popularTags = ['smoke', 'p0', 'p1', 'roi', 'interment', 'login', 'advanced-search-plot', 'sales', 'person'];

const TAG_DESCRIPTIONS: Record<string, string> = {
  'smoke': 'Test dasar - cek apakah fitur utama berfungsi',
  'p0': 'Prioritas Tinggi - fitur paling kritis',
  'p1': 'Prioritas Sedang - fitur penting',
  'roi': 'Test fitur ROI (Return on Investment)',
  'interment': 'Test fitur Interment/Pemakaman',
  'login': 'Test halaman login & autentikasi',
  'advanced-search-plot': 'Test pencarian plot lanjutan',
  'sales': 'Test fitur penjualan',
  'person': 'Test management data orang/person',
};

export function TestRunner({ availableTags, onRun, isRunning }: TestRunnerProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>('project');
  const [customTag, setCustomTag] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags(prev => [...prev, customTag.trim()]);
      setCustomTag('');
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const handleRun = () => {
    if (selectedTags.length === 0) {
      alert('Silakan pilih minimal satu tag test terlebih dahulu');
      return;
    }

    // Check for invalid tags
    const invalidTags = selectedTags.filter(tag => !availableTags.includes(tag));
    if (invalidTags.length > 0) {
      const proceed = confirm(
        `Peringatan: Tag berikut tidak ditemukan di file test manapun:\n\n${invalidTags.map(t => `@${t}`).join(', ')}\n\nTest dengan tag ini tidak akan menghasilkan skenario apapun.\n\nLanjutkan?`
      );
      if (!proceed) return;
    }

    onRun(selectedTags, selectedEnvironment);
  };

  return (
    <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-700">
        <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          </svg>
          Pengaturan Test
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">Ikuti langkah di bawah untuk menjalankan test otomatis</p>
      </div>

      <div className="p-4 space-y-3">
        {/* Environment Selection */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">1</span>
              Pilih Environment
            </span>
          </label>
          <p className="text-[11px] text-zinc-500 mb-2">Server mana yang ingin di-test?</p>
          <div className="grid grid-cols-4 gap-1.5">
            {environments.map(env => (
              <button
                key={env.value}
                onClick={() => setSelectedEnvironment(env.value)}
                disabled={isRunning}
                title={env.description}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg border text-sm font-medium transition-all ${isRunning
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                  } ${selectedEnvironment === env.value
                    ? `${env.activeColor} shadow-md`
                    : `${env.color} text-zinc-300 hover:text-white`
                  }`}
              >
                <span className="text-base">{env.icon}</span>
                <span className="text-xs">{env.label}</span>
                <span className="text-[9px] text-zinc-500">{env.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Tags */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">2</span>
              Pilih Test yang Dijalankan
            </span>
          </label>
          <p className="text-[11px] text-zinc-500 mb-2">Klik satu atau lebih tag di bawah. Setiap tag mewakili kelompok test tertentu.</p>
          <div className="flex flex-wrap gap-1.5">
            {popularTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                disabled={isRunning}
                title={TAG_DESCRIPTIONS[tag] || `Test @${tag}`}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${isRunning ? 'opacity-50 cursor-not-allowed' : ''
                  } ${selectedTags.includes(tag)
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                    : 'bg-zinc-700 text-zinc-300 border border-zinc-600 hover:border-zinc-500 hover:text-white'
                  }`}
              >
                @{tag}
              </button>
            ))}
          </div>
        </div>

        {/* All Available Tags (collapsible) */}
        {availableTags.length > 0 && (
          <div>
            <button
              onClick={() => setShowAllTags(!showAllTags)}
              disabled={isRunning}
              className={`flex items-center gap-1 text-xs font-medium text-zinc-300 uppercase tracking-wider mb-2 hover:text-white transition-colors ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className={`w-3 h-3 transition-transform ${showAllTags ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Semua Tag ({availableTags.length})
            </button>
            {showAllTags && (
              <div className="max-h-32 overflow-y-auto bg-zinc-800 rounded-lg p-2 border border-zinc-600">
                <div className="flex flex-wrap gap-1">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      disabled={isRunning}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${isRunning ? 'opacity-50 cursor-not-allowed' : ''
                        } ${selectedTags.includes(tag)
                          ? 'bg-emerald-500/25 text-emerald-300'
                          : 'bg-zinc-700 text-zinc-300 hover:text-white'
                        }`}
                    >
                      @{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom Tag Input */}
        <div>
          <label className="block text-[11px] text-zinc-500 mb-1">Atau ketik tag secara manual:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
              placeholder="Ketik nama tag..."
              disabled={isRunning}
              className={`flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <button
              onClick={addCustomTag}
              disabled={isRunning || !customTag.trim()}
              className="px-3 py-1.5 bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 hover:text-white transition-all text-sm font-medium disabled:opacity-30"
            >
              Tambah
            </button>
          </div>
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
                Terpilih ({selectedTags.length})
              </label>
              <button
                onClick={() => setSelectedTags([])}
                disabled={isRunning}
                className={`text-xs text-zinc-400 hover:text-red-400 transition-colors ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Hapus semua
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedTags.map(tag => {
                const isValidTag = availableTags.includes(tag);
                return (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium group ${isValidTag
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
                      }`}
                    title={isValidTag ? 'Valid tag' : 'Warning: Tag not found in any feature file'}
                  >
                    {!isValidTag && '⚠️ '}
                    @{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      disabled={isRunning}
                      className={`ml-0.5 opacity-60 hover:opacity-100 transition-opacity ${isRunning ? 'hidden' : ''}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                );
              })}
            </div>
            {selectedTags.some(tag => !availableTags.includes(tag)) && (
              <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <svg className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-yellow-300/90">
                  Beberapa tag tidak ditemukan di file test. Test dengan tag tersebut tidak akan menghasilkan skenario apapun.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Run Button */}
      <div className="px-4 pb-4">
        <div className="mb-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300 uppercase tracking-wider">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">3</span>
            Jalankan
          </span>
        </div>
        <button
          onClick={handleRun}
          disabled={isRunning || selectedTags.length === 0}
          className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${isRunning || selectedTags.length === 0
              ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98]'
            }`}
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sedang Menjalankan Test...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Jalankan {selectedTags.length > 0 ? `${selectedTags.length} Test` : 'Test'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
