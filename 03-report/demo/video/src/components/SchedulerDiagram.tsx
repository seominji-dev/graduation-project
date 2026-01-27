import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

interface SchedulerType {
  name: string;
  shortName: string;
  color: string;
  description: string;
  features: string[];
}

interface SchedulerDiagramProps {
  scheduler: SchedulerType;
  startFrame?: number;
  showFeatures?: boolean;
}

// 스케줄러 정보
export const SCHEDULERS: Record<string, SchedulerType> = {
  FCFS: {
    name: 'First Come First Served',
    shortName: 'FCFS',
    color: '#3b82f6',
    description: '도착 순서대로 처리',
    features: ['단순한 구현', '공정한 처리', '기본 스케줄링'],
  },
  PRIORITY: {
    name: 'Priority Scheduling',
    shortName: 'Priority',
    color: '#8b5cf6',
    description: '우선순위 기반 처리',
    features: ['VIP 우선 처리', '동적 우선순위', '에이징 지원'],
  },
  MLFQ: {
    name: 'Multi-Level Feedback Queue',
    shortName: 'MLFQ',
    color: '#06b6d4',
    description: '다단계 피드백 큐',
    features: ['적응형 스케줄링', '공정성 보장', '응답성 최적화'],
  },
  WFQ: {
    name: 'Weighted Fair Queuing',
    shortName: 'WFQ',
    color: '#10b981',
    description: '가중치 기반 공정 분배',
    features: ['대역폭 보장', '가중치 할당', '공정 분배'],
  },
};

// 스케줄러 다이어그램 컴포넌트
export const SchedulerDiagram: React.FC<SchedulerDiagramProps> = ({
  scheduler,
  startFrame = 0,
  showFeatures = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - startFrame;

  // 애니메이션 값들
  const cardOpacity = interpolate(relativeFrame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const cardScale = spring({
    frame: relativeFrame,
    fps,
    config: { damping: 12 },
  });

  const titleOffset = interpolate(relativeFrame, [10, 30], [30, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        ...styles.card,
        opacity: cardOpacity,
        transform: `scale(${cardScale})`,
        borderColor: scheduler.color,
      }}
    >
      {/* 헤더 */}
      <div style={styles.header}>
        <div
          style={{
            ...styles.icon,
            backgroundColor: scheduler.color,
          }}
        >
          {scheduler.shortName.charAt(0)}
        </div>
        <div style={{ transform: `translateY(${titleOffset}px)` }}>
          <h3 style={styles.shortName}>{scheduler.shortName}</h3>
          <p style={styles.fullName}>{scheduler.name}</p>
        </div>
      </div>

      {/* 설명 */}
      <p style={styles.description}>{scheduler.description}</p>

      {/* 기능 목록 */}
      {showFeatures && (
        <div style={styles.features}>
          {scheduler.features.map((feature, index) => {
            const featureOpacity = interpolate(
              relativeFrame,
              [30 + index * 10, 40 + index * 10],
              [0, 1],
              { extrapolateRight: 'clamp' }
            );
            return (
              <div
                key={index}
                style={{
                  ...styles.feature,
                  opacity: featureOpacity,
                  backgroundColor: `${scheduler.color}20`,
                  borderColor: `${scheduler.color}40`,
                }}
              >
                <span style={{ color: scheduler.color }}>✓</span>
                <span>{feature}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 4개 스케줄러를 나란히 보여주는 컴포넌트
export const SchedulerGrid: React.FC<{ startFrame?: number }> = ({
  startFrame = 0,
}) => {
  const schedulerList = Object.values(SCHEDULERS);

  return (
    <div style={styles.grid}>
      {schedulerList.map((scheduler, index) => (
        <SchedulerDiagram
          key={scheduler.shortName}
          scheduler={scheduler}
          startFrame={startFrame + index * 20}
          showFeatures={false}
        />
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: '16px',
    padding: '24px',
    border: '2px solid',
    width: '320px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  icon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 700,
    color: '#ffffff',
  },
  shortName: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
  },
  fullName: {
    fontSize: '12px',
    color: '#a1a1aa',
    margin: 0,
  },
  description: {
    fontSize: '14px',
    color: '#d4d4d8',
    marginBottom: '16px',
    lineHeight: 1.5,
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#e4e4e7',
    border: '1px solid',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
  },
};
