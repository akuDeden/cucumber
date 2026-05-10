'use client';

import { useState, useEffect } from 'react';
import { ScheduledRun, Environment } from '@/lib/types';

const environments = ['dev', 'project', 'prod', 'map'] as const;

const commonCronExpressions = [
  { expression: '0 0 * * *', label: 'Daily at midnight' },
  { expression: '0 */6 * * *', label: 'Every 6 hours' },
  { expression: '0 9 * * 1-5', label: 'Weekdays at 9 AM' },
  { expression: '0 0 * * 1', label: 'Weekly on Monday' },
  { expression: '0 0 1 * *', label: 'Monthly on 1st' },
];

export function ScheduleManager() {
  const [schedules, setSchedules] = useState<ScheduledRun[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    tags: [] as string[],
    environment: 'project' as Environment,
    cronExpression: '0 0 * * *',
    enabled: true,
  });
  const [customTag, setCustomTag] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/schedules');
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    }
  };

  const addSchedule = async () => {
    if (!newSchedule.name || newSchedule.tags.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule),
      });

      if (res.ok) {
        await fetchSchedules();
        setNewSchedule({
          name: '',
          tags: [],
          environment: 'project',
          cronExpression: '0 0 * * *',
          enabled: true,
        });
        setIsAdding(false);
      }
    } catch (error) {
      console.error('Failed to add schedule:', error);
    }
  };

  const toggleSchedule = async (id: string, enabled: boolean) => {
    try {
      await fetch('/api/schedules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled }),
      });
      await fetchSchedules();
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await fetch(`/api/schedules?id=${id}`, { method: 'DELETE' });
      await fetchSchedules();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  const addTag = () => {
    if (customTag.trim() && !newSchedule.tags.includes(customTag.trim())) {
      setNewSchedule(prev => ({ ...prev, tags: [...prev.tags, customTag.trim()] }));
      setCustomTag('');
    }
  };

  const removeTag = (tag: string) => {
    setNewSchedule(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Scheduled Runs
        </h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
          >
            Add Schedule
          </button>
        )}
      </div>

      {/* Add Schedule Form */}
      {isAdding && (
        <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Schedule Name</label>
            <input
              type="text"
              value={newSchedule.name}
              onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Daily Smoke Tests"
              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Enter tag..."
                className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={addTag}
                className="px-4 py-2 bg-zinc-600 text-white rounded-lg hover:bg-zinc-500"
              >
                Add
              </button>
            </div>
            {newSchedule.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newSchedule.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-sm"
                  >
                    @{tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-white">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Environment</label>
            <select
              value={newSchedule.environment}
              onChange={(e) => setNewSchedule(prev => ({ ...prev, environment: e.target.value as Environment }))}
              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {environments.map(env => (
                <option key={env} value={env}>{env}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Schedule</label>
            <select
              value={newSchedule.cronExpression}
              onChange={(e) => setNewSchedule(prev => ({ ...prev, cronExpression: e.target.value }))}
              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2"
            >
              {commonCronExpressions.map(({ expression, label }) => (
                <option key={expression} value={expression}>{label}</option>
              ))}
            </select>
            <input
              type="text"
              value={newSchedule.cronExpression}
              onChange={(e) => setNewSchedule(prev => ({ ...prev, cronExpression: e.target.value }))}
              placeholder="Custom cron expression"
              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={addSchedule}
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium"
            >
              Create Schedule
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-zinc-600 text-white rounded-lg hover:bg-zinc-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Schedules List */}
      <div className="space-y-3">
        {schedules.length === 0 ? (
          <p className="text-center text-zinc-500 py-8">No scheduled runs yet</p>
        ) : (
          schedules.map(schedule => (
            <div
              key={schedule.id}
              className={`bg-zinc-800 rounded-lg p-4 ${!schedule.enabled ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-white font-medium">{schedule.name}</h4>
                  <p className="text-sm text-zinc-400 mt-1">
                    {schedule.tags.map(t => `@${t}`).join(', ')} on {schedule.environment}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Cron: {schedule.cronExpression}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSchedule(schedule.id, !schedule.enabled)}
                    className={`px-3 py-1 rounded text-sm font-medium ${schedule.enabled
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-zinc-700 text-zinc-400'
                      }`}
                  >
                    {schedule.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => deleteSchedule(schedule.id)}
                    className="p-1 text-zinc-400 hover:text-red-400"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
