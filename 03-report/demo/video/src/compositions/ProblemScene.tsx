import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from 'remotion';

// 문제 제기 Scene (0:08 - 0:20, 360 frames @30fps)
export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const problems = [
    {
      icon: '$',
      title: '비용 폭증',
      description: 'LLM API 호출 비용이 기하급수적으로 증가',
      color: '#ef4444',
    },
    {
      icon: '\u23F1',
      title: '응답 지연',
      description: '요청 처리 대기 시간으로 인한 사용자 경험 저하',
      color: '#f59e0b',
    },
    {
      icon: '\u2696',
      title: '공정성 부재',
      description: '특정 사용자의 API 독점으로 서비스 품질 불균형',
      color: '#8b5cf6',
    },
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%)',
        padding: '48px',
      }}
    >
      {/* 섹션 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: '36px', opacity: headerOpacity }}>
        <span
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '9999px',
            color: '#ef4444',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          PROBLEM
        </span>
        <h2
          style={{
            fontSize: '42px',
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
          }}
        >
          LLM API 요청의 <span style={{ color: '#ef4444' }}>3가지 문제</span>
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
          기존 LLM API 호출 방식의 한계점
        </p>
      </div>

      {/* 문제 카드들 */}
      <div style={{ display: 'flex', gap: '24px' }}>
        {problems.map((problem, index) => {
          // fps 기반 타이밍
          const cardDelay = Math.round(0.8 * fps) + index * Math.round(0.6 * fps);
          const cardOpacity = interpolate(frame, [cardDelay, cardDelay + Math.round(0.4 * fps)], [0, 1], {
            extrapolateRight: 'clamp',
          });
          const cardY = interpolate(frame, [cardDelay, cardDelay + Math.round(0.4 * fps)], [40, 0], {
            extrapolateRight: 'clamp',
          });
          const cardScale = spring({
            frame: frame - cardDelay,
            fps,
            config: { damping: 12 },
          });

          return (
            <div
              key={index}
              style={{
                width: '320px',
                backgroundColor: '#1a1a2e',
                borderRadius: '20px',
                padding: '32px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                opacity: cardOpacity,
                transform: 'translateY(' + cardY + 'px) scale(' + Math.max(0.8, cardScale) + ')',
              }}
            >
              {/* 아이콘 */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  backgroundColor: problem.color + '20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  fontSize: '28px',
                }}
              >
                {problem.icon}
              </div>

              {/* 타이틀 */}
              <h3
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: problem.color,
                  marginBottom: '12px',
                }}
              >
                {problem.title}
              </h3>

              {/* 설명 */}
              <p
                style={{
                  fontSize: '16px',
                  color: '#a1a1aa',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {problem.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* 하단 강조 텍스트 - fps 기반 타이밍 (3.2초) */}
      <Sequence from={Math.round(3.2 * fps)} premountFor={Math.round(0.5 * fps)}>
        <div
          style={{
            marginTop: '36px',
            padding: '20px 40px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <p
            style={{
              fontSize: '18px',
              color: '#fca5a5',
              margin: 0,
              fontWeight: 500,
            }}
          >
            이러한 문제들을 해결하기 위해 OS 스케줄링 알고리즘을 적용합니다
          </p>
        </div>
      </Sequence>
    </div>
  );
};
