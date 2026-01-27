import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from 'remotion';
import { CircularProgress, StatCard } from '../components/ProgressBar';

// 결과 Scene (1:03 - 1:18, 450 frames @30fps)
export const ResultsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #0f172a 100%)',
        padding: '48px',
      }}
    >
      {/* 섹션 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: '36px', opacity: headerOpacity }}>
        <span
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '9999px',
            color: '#10b981',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          RESULTS
        </span>
        <h2
          style={{
            fontSize: '42px',
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
          }}
        >
          프로젝트 <span style={{ color: '#10b981' }}>성과</span>
        </h2>
        {/* 서브 설명 추가 */}
        <p
          style={{
            fontSize: '17px',
            color: '#a1a1aa',
            marginTop: '12px',
            fontWeight: 400,
          }}
        >
          테스트와 품질 검증 결과
        </p>
      </div>

      {/* 메인 통계 - 타이밍 조정: 0.5x 스케일 */}
      <div style={{ display: 'flex', gap: '60px', alignItems: 'center', marginBottom: '36px' }}>
        {/* 테스트 통과 - 타이밍 조정: 30 -> 15 */}
        <Sequence from={15}>
          <div style={{ textAlign: 'center' }}>
            <CircularProgress
              value={100}
              size={160}
              strokeWidth={12}
              color="#10b981"
              label="Tests Passed"
              startFrame={0}
            />
            <div style={{ marginTop: '16px' }}>
              <span style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff' }}>707</span>
              <span style={{ fontSize: '18px', color: '#71717a', marginLeft: '8px' }}>테스트</span>
            </div>
          </div>
        </Sequence>

        {/* 코드 커버리지 - 타이밍 조정: 60 -> 30 */}
        <Sequence from={30}>
          <div style={{ textAlign: 'center' }}>
            <CircularProgress
              value={96.27}
              size={160}
              strokeWidth={12}
              color="#6366f1"
              label="Coverage"
              startFrame={0}
            />
            <div style={{ marginTop: '16px' }}>
              <span style={{ fontSize: '18px', color: '#a1a1aa' }}>코드 커버리지</span>
            </div>
          </div>
        </Sequence>

        {/* TRUST 5 점수 - 타이밍 조정: 90 -> 45 */}
        <Sequence from={45}>
          <div style={{ textAlign: 'center' }}>
            <CircularProgress
              value={88}
              size={160}
              strokeWidth={12}
              color="#f59e0b"
              label="TRUST 5"
              startFrame={0}
            />
            <div style={{ marginTop: '16px' }}>
              <span style={{ fontSize: '18px', color: '#a1a1aa' }}>품질 점수</span>
            </div>
          </div>
        </Sequence>
      </div>

      {/* 상세 통계 카드 - 타이밍 조정: 150 -> 75 */}
      <Sequence from={75}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <StatCardItem
            value="4"
            label="스케줄러"
            sublabel="FCFS, Priority, MLFQ, WFQ"
            color="#3b82f6"
            frame={frame}
            delay={75}
          />
          <StatCardItem
            value="< 50ms"
            label="평균 응답시간"
            sublabel="P99 latency"
            color="#8b5cf6"
            frame={frame}
            delay={90}
          />
          <StatCardItem
            value="156"
            label="req/s"
            sublabel="처리량"
            color="#06b6d4"
            frame={frame}
            delay={105}
          />
          <StatCardItem
            value="100%"
            label="API 호환"
            sublabel="OpenAI Compatible"
            color="#10b981"
            frame={frame}
            delay={120}
          />
        </div>
      </Sequence>

      {/* TRUST 5 배지 - 타이밍 조정: 300 -> 150 */}
      <Sequence from={150}>
        <div
          style={{
            marginTop: '36px',
            padding: '20px 40px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
          }}
        >
          <TrustBadge letter="T" label="Tested" color="#10b981" frame={frame} delay={165} />
          <TrustBadge letter="R" label="Readable" color="#3b82f6" frame={frame} delay={180} />
          <TrustBadge letter="U" label="Unified" color="#8b5cf6" frame={frame} delay={195} />
          <TrustBadge letter="S" label="Secured" color="#ef4444" frame={frame} delay={210} />
          <TrustBadge letter="T" label="Trackable" color="#f59e0b" frame={frame} delay={225} />
        </div>
      </Sequence>
    </div>
  );
};

// 통계 카드 아이템 컴포넌트
const StatCardItem: React.FC<{
  value: string;
  label: string;
  sublabel: string;
  color: string;
  frame: number;
  delay: number;
}> = ({ value, label, sublabel, color, frame, delay }) => {
  const opacity = interpolate(frame, [delay, delay + 15], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frame, [delay, delay + 15], [20, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        backgroundColor: '#1a1a2e',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid ' + color + '30',
        textAlign: 'center',
        minWidth: '160px',
        opacity,
        transform: 'translateY(' + translateY + 'px)',
      }}
    >
      <div style={{ fontSize: '28px', fontWeight: 700, color, marginBottom: '8px' }}>{value}</div>
      <div style={{ fontSize: '14px', color: '#ffffff', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '12px', color: '#71717a' }}>{sublabel}</div>
    </div>
  );
};

// TRUST 배지 컴포넌트
const TrustBadge: React.FC<{
  letter: string;
  label: string;
  color: string;
  frame: number;
  delay: number;
}> = ({ letter, label, color, frame, delay }) => {
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(frame, [delay, delay + 10], [0.5, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        opacity,
        transform: 'scale(' + scale + ')',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 700,
          color: '#ffffff',
        }}
      >
        {letter}
      </div>
      <span style={{ fontSize: '14px', color: '#e4e4e7' }}>{label}</span>
    </div>
  );
};
