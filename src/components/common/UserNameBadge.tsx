import React, { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';

interface UserNameBadgeProps {
  userName: string;
  onUpdateName: (newName: string) => void;
}

export const UserNameBadge: React.FC<UserNameBadgeProps> = ({
  userName,
  onUpdateName,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(userName);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = editValue.trim();
    if (trimmed) {
      onUpdateName(trimmed);
    } else {
      setEditValue(userName);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(userName);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 bg-nudge-parchment dark:bg-nudge-parchment-dark px-2.5 py-1 rounded-full border border-nudge-blue/40">
        <span className="text-sm">🪴</span>
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-24 text-sm font-semibold bg-transparent text-nudge-text-primary dark:text-nudge-text-primary-dark focus:outline-none"
          autoFocus
          maxLength={20}
        />
        <button
          type="submit"
          className="text-nudge-blue hover:text-nudge-blue-light p-0.5"
          title="Save name"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="text-nudge-text-muted hover:text-nudge-text-secondary p-0.5"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="group flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-nudge-parchment dark:hover:bg-nudge-parchment-dark transition-all duration-150 border border-transparent hover:border-nudge-border dark:hover:border-nudge-border-dark"
      title="Click to change your display name"
    >
      <div className="w-7 h-7 rounded-full bg-nudge-parchment dark:bg-nudge-parchment-dark flex items-center justify-center text-sm shadow-xs border border-nudge-border/50 dark:border-nudge-border-dark/50">
        🪴
      </div>
      <span className="text-sm font-semibold text-nudge-text-primary dark:text-nudge-text-primary-dark">
        {userName}
      </span>
      <Edit2 className="w-3 h-3 text-nudge-text-muted opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
    </button>
  );
};
