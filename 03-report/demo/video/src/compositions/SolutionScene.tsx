import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from 'remotion';

// 해결책 Scene (0:20 - 0:38, 540 frames @30fps)
export const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const schedulers = [
    {
      name: 'FCFS',
      fullName: 'First Come First Served',
      color: '#3b82f6',
      description: '도착 순서대로 처리하는 가장 기본적인 스케줄링',
      features: ['단순한 구현', '공정한 처리', '기본 스케줄링'],
    },
    {
      name: 'Priority',
      fullName: 'Priority Scheduling',
      color: '#8b5cf6',
      description: 'VIP 사용자 우선 처리 및 에이징 기반 동적 우선순위',
      features: ['VIP 우선 처리', '동적 우선순위', '에이징 지원'],
    },
    {
      name: 'MLFQ',
      fullName: 'Multi-Level Feedback Queue',
      color: '#06b6d4',
      description: '다단계 큐를 활용한 적응형 스케줄링',
      features: ['적응형 스케줄링', '공정성 보장', '응답성 최적화'],
    },
    {
      name: 'WFQ',
      fullName: 'Weighted Fair Queuing',
      color: '#10b981',
      description: '가중치 기반 공정한 대역폭 분배',
      features: ['대역폭 보장', '가중치 할당', '공정 분배'],
    },
    {
      name: 'RateLimiter',
      fullName: 'Token Bucket Rate Limiting',
      color: '#f59e0b',
      description: '토큰 버킷 기반 속도 제한으로 과부하 방지',
      features: ['속도 제한', '과부하 방지', '처리량 제어'],
    },
  ];

  const headerOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
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
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderRadius: '9999px',
            color: '#6366f1',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          SOLUTION
        </span>
        <h2
          style={{
            fontSize: '42px',
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
          }}
        >
          <span style={{ color: '#6366f1' }}>5가지</span> OS 스케줄링 알고리즘
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
          운영체제의 검증된 스케줄링 기법을 LLM에 적용
        </p>
      </div>

      {/* 스케줄러 그리드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          maxWidth: '1400px',
        }}
      >
        {schedulers.map((scheduler, index) => {
          // fps 기반 타이밍
          const cardDelay = Math.round(0.8 * fps) + index * Math.round(0.6 * fps);
          const cardOpacity = interpolate(frame, [cardDelay, cardDelay + Math.round(0.4 * fps)], [0, 1], {
            extrapolateRight: 'clamp',
          });
          const cardX = (index % 3 - 1) * 30;
          const cardTranslateX = interpolate(frame, [cardDelay, cardDelay + Math.round(0.4 * fps)], [cardX, 0], {
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={scheduler.name}
              style={{
                backgroundColor: '#1a1a2e',
                borderRadius: '20px',
                padding: '28px',
                border: '2px solid ' + scheduler.color + '40',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                opacity: cardOpacity,
                transform: 'translateX(' + cardTranslateX + 'px)',
              }}
            >
              {/* 헤더 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    backgroundColor: scheduler.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#ffffff',
                  }}
                >
                  {scheduler.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    {scheduler.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: 0 }}>
                    {scheduler.fullName}
                  </p>
                </div>
              </div>

              {/* 설명 */}
              <p style={{ fontSize: '15px', color: '#a1a1aa', marginBottom: '16px', lineHeight: 1.5 }}>
                {scheduler.description}
              </p>

              {/* 기능 태그 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {scheduler.features.map((feature, featureIndex) => {
                  // fps 기반 타이밍
                  const featureDelay = cardDelay + Math.round(0.53 * fps) + featureIndex * Math.round(0.2 * fps);
                  const featureOpacity = interpolate(
                    frame,
                    [featureDelay, featureDelay + Math.round(0.2 * fps)],
                    [0, 1],
                    { extrapolateRight: 'clamp' }
                  );

                  return (
                    <span
                      key={featureIndex}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: scheduler.color + '20',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: scheduler.color,
                        fontWeight: 500,
                        opacity: featureOpacity,
                      }}
                    >
                      {feature}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 요약 - fps 기반 타이밍 (4.8초) */}
      <Sequence from={Math.round(4.8 * fps)} premountFor={Math.round(0.5 * fps)}>
        <div
          style={{
            marginTop: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
          }}
        >
          {schedulers.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: s.color,
                }}
              />
              <span style={{ fontSize: '14px', color: '#a1a1aa' }}>{s.name}</span>
            </div>
          ))}
        </div>
      </Sequence>
    </div>
  );
};
