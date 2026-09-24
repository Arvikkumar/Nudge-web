import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Pursuit } from '../../types';

interface CreateOrEditGoalModalProps {
  isOpen: boolean;
  goalToEdit?: Pursuit | null;
  onDismiss: () => void;
  onSave: (data: {
    name: string;
    targetHours: number;
    emoji: string;
    color?: string;
  }) => Promise<void>;
}

const PRESET_MINUTES = [
  { mins: 30, label: '30m' },
  { mins: 45, label: '45m' },
  { mins: 60, label: '1h' },
  { mins: 90, label: '1h 30m' },
  { mins: 120, label: '2h' },
  { mins: 150, label: '2h 30m' },
  { mins: 180, label: '3h' },
  { mins: 240, label: '4h' },
];

const EMOJI_OPTIONS = ['🎯', '📚', '✍️', '🧘', '💻', '🎨', '🏃', '🎵', '🌿', '☕', '🔬', '💡'];

export const CreateOrEditGoalModal: React.FC<CreateOrEditGoalModalProps> = ({
  isOpen,
  goalToEdit,
  onDismiss,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [dailyMinutes, setDailyMinutes] = useState(40);
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const [customHours, setCustomHours] = useState(1);
  const [customMinutes, setCustomMinutes] = useState(0);
  const [emoji, setEmoji] = useState('🎯');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (goalToEdit) {
      setName(goalToEdit.name);
      setEmoji(goalToEdit.emoji || '🎯');
      // Approximate daily minutes from monthly target hours
      const dMins = Math.round((goalToEdit.targetHours * 60) / 30);
      setDailyMinutes(dMins);
      const isPreset = PRESET_MINUTES.some((p) => p.mins === dMins);
      if (!isPreset) {
        setIsCustomSelected(true);
        setCustomHours(Math.floor(dMins / 60));
        setCustomMinutes(dMins % 60);
      } else {
        setIsCustomSelected(false);
      }
    } else {
      setName('');
      setEmoji('🎯');
      setDailyMinutes(40);
      setIsCustomSelected(false);
      setCustomHours(1);
      setCustomMinutes(0);
    }
  }, [goalToEdit, isOpen]);

  if (!isOpen) return null;

  const currentDailyMins = isCustomSelected
    ? customHours * 60 + customMinutes
    : dailyMinutes;

  // Monthly target hours = daily target minutes * 30 / 60 = dailyMinutes / 2
  const computedMonthlyTargetHours = Math.max(1, Math.round(currentDailyMins / 2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        targetHours: computedMonthlyTargetHours,
        emoji,
      });
      onDismiss();
    } catch (err) {
      console.error('Failed to save goal:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-nudge-card-dark rounded-3xl border border-nudge-border dark:border-nudge-border-dark p-6 w-full max-w-md shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-editorial-serif text-2xl font-normal text-nudge-text-primary dark:text-nudge-text-primary-dark">
            {goalToEdit ? 'Edit Pursuit' : 'New Time Goal'}
          </h3>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-full hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark text-nudge-text-muted hover:text-nudge-text-primary"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pursuit Name */}
          <div>
            <label className="block text-xs font-semibold text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase tracking-wider mb-1">
              Pursuit Name
            </label>
            <input
              type="text"
              required
              data-testid="input_goal_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Reading, Coding, Deep Work..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-nudge-border dark:border-nudge-border-dark bg-transparent text-sm text-nudge-text-primary dark:text-nudge-text-primary-dark focus:outline-none focus:border-nudge-blue"
            />
          </div>

          {/* Daily Target Duration Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase tracking-wider">
                Daily Target
              </label>
              <span className="text-xs text-nudge-blue font-semibold">
                {currentDailyMins} min/day (~{computedMonthlyTargetHours}h / month)
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_MINUTES.map((p) => {
                const isSelected = !isCustomSelected && dailyMinutes === p.mins;
                return (
                  <button
                    key={p.mins}
                    type="button"
                    onClick={() => {
                      setIsCustomSelected(false);
                      setDailyMinutes(p.mins);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-nudge-blue text-white shadow-2xs font-bold'
                        : 'bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border/60 dark:border-nudge-border-dark/60 text-nudge-text-primary dark:text-nudge-text-primary-dark hover:bg-nudge-parchment'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCustomSelected(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isCustomSelected
                    ? 'bg-nudge-blue text-white shadow-2xs font-bold'
                    : 'bg-nudge-parchment/60 dark:bg-nudge-parchment-dark/60 border border-nudge-border/60 dark:border-nudge-border-dark/60 text-nudge-text-primary dark:text-nudge-text-primary-dark hover:bg-nudge-parchment'
                }`}
              >
                Custom
              </button>
            </div>

            {/* Custom Hours & Minutes */}
            {isCustomSelected && (
              <div className="mt-2.5 p-3 rounded-2xl bg-nudge-parchment/40 dark:bg-nudge-parchment-dark/40 border border-nudge-border/60 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={customHours}
                    onChange={(e) => setCustomHours(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-16 px-2.5 py-1.5 rounded-lg border border-nudge-border dark:border-nudge-border-dark text-sm bg-white dark:bg-nudge-card-dark text-center"
                  />
                  <span className="text-xs text-nudge-text-secondary">hours</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="5"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-16 px-2.5 py-1.5 rounded-lg border border-nudge-border dark:border-nudge-border-dark text-sm bg-white dark:bg-nudge-card-dark text-center"
                  />
                  <span className="text-xs text-nudge-text-secondary">mins</span>
                </div>
              </div>
            )}
          </div>

          {/* Emoji / Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-nudge-text-secondary dark:text-nudge-text-secondary-dark uppercase tracking-wider mb-1.5">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`text-xl p-2 rounded-xl border transition-all cursor-pointer ${
                    emoji === e
                      ? 'border-nudge-blue bg-blue-50 dark:bg-blue-950/40 scale-105 shadow-2xs'
                      : 'border-nudge-border dark:border-nudge-border-dark hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="px-4 py-2 rounded-xl text-xs font-medium text-nudge-text-secondary hover:text-nudge-text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-nudge-blue text-white hover:bg-nudge-blue-hover transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : goalToEdit ? 'Save Changes' : 'Create Pursuit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
