import React from 'react';

interface GentleNudgeLogoProps {
  className?: string;
  size?: number;
}

export const GentleNudgeLogo: React.FC<GentleNudgeLogoProps> = ({
  className = "text-nudge-text-primary dark:text-nudge-text-primary-dark",
  size = 28,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Nudge Logo"
    >
      {/* Gentle organic leaf sprout emblem */}
      <path
        d="M16 26C16 19.5 20 14 26 13C25 19 21.5 24 16 26Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M16 26C15.5 17 11 10 5 9C7 16 11 22 16 26Z"
        fill="#2E62F6"
      />
      <path
        d="M16 26V8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.4"
      />
      <circle cx="16" cy="7" r="2" fill="#2E62F6" />
    </svg>
  );
};
