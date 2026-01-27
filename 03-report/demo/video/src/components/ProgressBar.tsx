import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  color?: string;
  showPercentage?: boolean;
  startFrame?: number;
  animationDuration?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  color = '#6366f1',
  showPercentage = true,
  startFrame = 0,
  animationDuration = 60,
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - startFrame;

  const percentage = (value / max) * 100;
  const animatedPercentage = interpolate(
    relativeFrame,
    [0, animationDuration],
    [0, percentage],
    { extrapolateRight: 'clamp' }
  );

  const containerOpacity = interpolate(relativeFrame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ width: '100%', maxWidth: '500px', opacity: containerOpacity }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#e4e4e7' }}>{label}</span>
          {showPercentage && (
            <span style={{ fontSize: '14px', fontWeight: 600, color }}>
              {animatedPercentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div style={{ height: '12px', backgroundColor: '#27272a', borderRadius: '6px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: animatedPercentage + '%',
            backgroundColor: color,
            borderRadius: '6px',
            boxShadow: '0 0 10px ' + color + '60',
          }}
        />
      </div>
    </div>
  );
};

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  startFrame?: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = '#6366f1',
  label,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - startFrame;

  const percentage = (value / max) * 100;
  const animatedPercentage = interpolate(relativeFrame, [0, 60], [0, percentage], {
    extrapolateRight: 'clamp',
  });

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  const scale = spring({
    frame: relativeFrame,
    fps,
    config: { damping: 12 },
  });

  const halfSize = size / 2;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(' + scale + ')' }}>
      <svg width={size} height={size}>
        <circle
          cx={halfSize}
          cy={halfSize}
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={halfSize}
          cy={halfSize}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={'rotate(-90 ' + halfSize + ' ' + halfSize + ')'}
          style={{ filter: 'drop-shadow(0 0 6px ' + color + ')' }}
        />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '24px', fontWeight: 700, color }}>{animatedPercentage.toFixed(1)}%</span>
        {label && <span style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '4px' }}>{label}</span>}
      </div>
    </div>
  );
};

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  startFrame?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon,
  color = '#6366f1',
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - startFrame;

  const scale = spring({
    frame: relativeFrame,
    fps,
    config: { damping: 10 },
  });

  const opacity = interpolate(relativeFrame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        backgroundColor: '#1a1a2e',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid ' + color + '40',
        textAlign: 'center',
        minWidth: '160px',
        opacity,
        transform: 'scale(' + scale + ')',
      }}
    >
      {icon && (
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
          fontSize: '24px',
          backgroundColor: color + '20',
          color,
        }}>
          {icon}
        </div>
      )}
      <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '4px', color }}>{value}</div>
      <div style={{ fontSize: '14px', color: '#a1a1aa' }}>{label}</div>
    </div>
  );
};
