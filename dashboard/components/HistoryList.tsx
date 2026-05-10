'use client';

import { TestRun } from '@/lib/types';
import { useState } from 'react';

interface HistoryListProps {
  history: TestRun[];
  onSelectRun: (run: TestRun) => void;
  selectedRun: TestRun | null;
  onClearHistory?: () => void;
  compact?: boolean;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(run: TestRun): string {
  if (run.duration) {
    if (run.duration < 1000) return `${run.duration}ms`;
    if (run.duration < 60000) return `${(run.duration / 1000).toFixed(0)}s`;
    const m = Math.floor(run.duration / 60000);
    const s = Math.floor((run.duration % 60000) / 1000);
    return `${m}m ${s}s`;
  }
  if (run.completedAt && run.startedAt) {
    const ms = new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime();
    if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`;
    return `${Math.floor(ms / 60000)}m`;
  }
  return '-';
}

export function HistoryList({ history, onSelectRun, selectedRun, onClearHistory, compact }: HistoryListProps) {
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleClearHistory = async () => {
    if (!confirm('Clear all test history? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/history', { method: 'DELETE' });
      if (res.ok) onClearHistory?.();
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const filteredHistory = history.filter(run => {
    if (filter !== 'all' && run.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return run.tags.some(t => t.toLowerCase().includes(q)) ||
        run.environment.toLowerCase().includes(q);
    }
    return true;
  });

  const envColors: Record<string, string> = {
    dev: 'text-blue-400 bg-blue-500/10',
    project: 'text-yellow-400 bg-yellow-500/10',
    prod: 'text-red-400 bg-red-500/10',
    map: 'text-purple-400 bg-purple-500/10',
  };

  if (compact) {
    return (
      <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl overflow-hidden">
        <div className="divide-y divide-zinc-700/50 max-h-[calc(100vh-180px)] overflow-y-auto">
          {filteredHistory.length === 0 ? (
            <div className="p-4 text-center text-sm text-zinc-400">No runs yet</div>
          ) : (
            filteredHistory.map(run => {
              const passed = run.results.filter(r => r.status === 'passed').length;
              const failed = run.results.filter(r => r.status === 'failed').length;
              const total = run.results.length;

              return (
                <button
                  key={run.id}
                  onClick={() => onSelectRun(run)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all hover:bg-zinc-700/50 ${selectedRun?.id === run.id ? 'bg-zinc-700/70' : ''
                    }`}
                >
                  {/* Status dot */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${run.status === 'passed' ? 'bg-emerald-500' :
                      run.status === 'failed' ? 'bg-red-500' :
                        run.status === 'running' ? 'bg-blue-500 animate-pulse' :
                          'bg-zinc-500'
                    }`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${envColors[run.environment] || 'text-zinc-300 bg-zinc-700'}`}>
                        {run.environment}
                      </span>
                      <span className="text-sm text-zinc-300 truncate">
                        {run.tags.map(t => `@${t}`).join(' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {total > 0 ? (
                      <div className="flex items-center gap-1 text-xs">
                        {passed > 0 && <span className="text-emerald-400">{passed}✓</span>}
                        {failed > 0 && <span className="text-red-400">{failed}✗</span>}
                      </div>
                    ) : run.status === 'passed' || run.status === 'failed' ? (
                      <span className="text-xs text-yellow-400" title="No scenarios executed">⚠️</span>
                    ) : null}
                    <span className="text-xs text-zinc-400">{formatRelativeTime(run.startedAt)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-zinc-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
            <span className="text-zinc-400 font-normal">({filteredHistory.length})</span>
          </h3>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Search */}
        <div className="mb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tags or environment..."
            className="w-full bg-zinc-700/80 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-1">
          {(['all', 'passed', 'failed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f
                  ? f === 'passed' ? 'bg-emerald-500/20 text-emerald-400'
                    : f === 'failed' ? 'bg-red-500/20 text-red-400'
                      : 'bg-zinc-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-zinc-700/50 flex-1 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-400">
            {searchQuery ? 'No matching runs' : 'No test runs yet'}
          </div>
        ) : (
          filteredHistory.map(run => {
            const passed = run.results.filter(r => r.status === 'passed').length;
            const failed = run.results.filter(r => r.status === 'failed').length;
            const total = run.results.length;
            const isSelected = selectedRun?.id === run.id;

            return (
              <button
                key={run.id}
                onClick={() => onSelectRun(run)}
                className={`w-full px-5 py-3 text-left transition-all hover:bg-zinc-700/40 ${isSelected ? 'bg-zinc-700/60 border-l-2 border-l-emerald-500' : 'border-l-2 border-l-transparent'
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Status + Environment */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${run.status === 'passed' ? 'bg-emerald-500' :
                          run.status === 'failed' ? 'bg-red-500' :
                            run.status === 'running' ? 'bg-blue-500 animate-pulse' :
                              'bg-zinc-500'
                        }`} />
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${envColors[run.environment] || 'text-zinc-300 bg-zinc-700'}`}>
                        {run.environment}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">{formatDuration(run)}</span>
                    </div>

                    {/* Tags */}
                    <p className="text-sm text-zinc-300 truncate mb-1">
                      {run.tags.map(t => `@${t}`).join(' ')}
                    </p>

                    {/* Time */}
                    <p className="text-xs text-zinc-400">
                      {formatRelativeTime(run.startedAt)}
                      {' · '}
                      {new Date(run.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Results mini */}
                  {total > 0 && (
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {/* Mini bar */}
                      <div className="flex h-2 w-16 rounded-full overflow-hidden bg-zinc-700">
                        {passed > 0 && (
                          <div className="bg-emerald-500 h-full" style={{ width: `${(passed / total) * 100}%` }} />
                        )}
                        {failed > 0 && (
                          <div className="bg-red-500 h-full" style={{ width: `${(failed / total) * 100}%` }} />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-emerald-400">{passed}</span>
                        <span className="text-zinc-500">/</span>
                        <span className="text-red-400">{failed}</span>
                        <span className="text-zinc-500">/</span>
                        <span className="text-zinc-300">{total}</span>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
