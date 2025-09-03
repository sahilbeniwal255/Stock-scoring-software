// CircularScore.jsx
import React, { useId } from 'react';

const CircularScore = ({
  value,
  max = 70,
  size = 140,
  strokeWidth = 12,
  trackColor = '#1e3a8a',          // Tailwind blue-800
  progressColorStart = '#22c55e',   // Tailwind green-500
  progressColorEnd = '#16a34a',     // Tailwind green-600
  showLabel = true,
}) => {
  const id = useId();

  const safeValue = Number.isFinite(value)
    ? Math.max(0, Math.min(value, max))
    : 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (safeValue / max) * circumference;
  const dashOffset = circumference - progress;

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
      aria-label={`Score ${safeValue.toFixed(2)} of ${max}`}
      role="img"
    >
      <svg width={size} height={size} className="block">
        <defs>
          <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={progressColorStart} />
            <stop offset="100%" stopColor={progressColorEnd} />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
          className="opacity-30"
        />

        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#grad-${id})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 700ms ease' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      {/* Center label */}
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-yellow-300 font-semibold text-lg">
            {safeValue.toFixed(2)}
          </span>
          <span className="text-blue-300 text-xs">of {max}</span>
        </div>
      )}
    </div>
  );
};

export default CircularScore;
