import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

// 마무리 Scene (1:18 - 1:26, 240 frames @30fps)
export const EndingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 타이밍 조정: 0.533x 스케일
  const mainOpacity = interpolate(frame, [0, 16], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const scale = spring({
    frame,
    fps,
    config: { damping: 12 },
  });

  const githubOpacity = interpolate(frame, [32, 48], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const thanksOpacity = interpolate(frame, [64, 80], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // 배경 파티클 효과를 위한 위치 계산
  const particlePositions = Array.from({ length: 20 }, (_, i) => ({
    x: (i * 137) % 100,
    y: (i * 89) % 100,
    delay: i * 3,
    size: 4 + (i % 5) * 2,
  }));

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '48px',
      }}
    >
      {/* 배경 파티클 */}
      {particlePositions.map((particle, i) => {
        const particleOpacity = interpolate(
          frame,
          [particle.delay, particle.delay + 16],
          [0, 0.3],
          { extrapolateRight: 'clamp' }
        );
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: particle.x + '%',
              top: particle.y + '%',
              width: particle.size + 'px',
              height: particle.size + 'px',
              borderRadius: '50%',
              backgroundColor: i % 2 === 0 ? '#6366f1' : '#22d3ee',
              opacity: particleOpacity,
              filter: 'blur(2px)',
            }}
          />
        );
      })}

      {/* 메인 컨텐츠 */}
      <div
        style={{
          textAlign: 'center',
          opacity: mainOpacity,
          transform: 'scale(' + Math.max(0.8, scale) + ')',
        }}
      >
        {/* 로고/아이콘 */}
        <div
          style={{
            width: '100px',
            height: '100px',
            margin: '0 auto 32px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)',
          }}
        >
          &#9889;
        </div>

        {/* 프로젝트 타이틀 */}
        <h1
          style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '16px',
          }}
        >
          LLM Scheduler
        </h1>
        <p
          style={{
            fontSize: '18px',
            color: '#a1a1aa',
            marginBottom: '40px',
          }}
        >
          OS 스케줄링 알고리즘 기반 LLM API 최적화
        </p>
      </div>

      {/* GitHub 링크 */}
      <div
        style={{
          opacity: githubOpacity,
          marginBottom: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 32px',
            backgroundColor: '#1a1a2e',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="#ffffff"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span style={{ fontSize: '16px', color: '#ffffff', fontFamily: 'monospace' }}>
            github.com/hongik-llm-scheduler
          </span>
        </div>
      </div>

      {/* 감사 인사 */}
      <div
        style={{
          opacity: thanksOpacity,
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: '56px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 50%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '16px',
          }}
        >
          감사합니다
        </h2>
        <p style={{ fontSize: '16px', color: '#71717a' }}>
          홍익대학교 C235180 서민지 2026
        </p>
      </div>
    </div>
  );
};
