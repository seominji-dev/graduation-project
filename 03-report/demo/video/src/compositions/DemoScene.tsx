import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from 'remotion';
import { Terminal } from '../components/Terminal';

// 데모 Scene (0:38 - 1:03, 750 frames @30fps)
export const DemoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // 터미널 명령어 시퀀스 - 타이밍 조정
  const terminalCommands = [
    {
      prompt: '$ ',
      command: 'curl -X POST http://localhost:8000/api/v1/requests',
      delay: 0,
      output: [
        '{"request_id": "req_001", "status": "queued", "scheduler": "MLFQ"}',
      ],
    },
    {
      prompt: '$ ',
      command: 'curl http://localhost:8000/api/v1/stats',
      delay: 50,
      output: [
        '{',
        '  "total_requests": 1247,',
        '  "avg_wait_time": "45ms",',
        '  "throughput": "156 req/s"',
        '}',
      ],
    },
  ];

  // JSON 응답 시각화
  const jsonResponse = {
    request_id: 'req_001',
    status: 'completed',
    scheduler: 'MLFQ',
    metrics: {
      wait_time: '12ms',
      processing_time: '234ms',
      queue_position: 0,
    },
  };

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
            backgroundColor: 'rgba(34, 211, 238, 0.1)',
            borderRadius: '9999px',
            color: '#22d3ee',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          DEMO
        </span>
        <h2
          style={{
            fontSize: '42px',
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
          }}
        >
          실제 <span style={{ color: '#22d3ee' }}>동작 데모</span>
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
          실제 API 호출과 스케줄러 동작 확인
        </p>
      </div>

      {/* 메인 컨텐츠 */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* 터미널 섹션 */}
        <Sequence from={15}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Step 1 설명 */}
            <div
              style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(34, 211, 238, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(34, 211, 238, 0.2)',
              }}
            >
              <span style={{ fontSize: '14px', color: '#22d3ee', fontWeight: 500 }}>
                Step 1: API 요청 전송
              </span>
            </div>
            <Terminal
              commands={terminalCommands}
              title="LLM Scheduler API"
              startFrame={0}
            />
          </div>
        </Sequence>

        {/* 응답 시각화 - 타이밍 조정: 300 -> 125 */}
        <Sequence from={125}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Step 2 설명 */}
            <div
              style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <span style={{ fontSize: '14px', color: '#10b981', fontWeight: 500 }}>
                Step 2: 스케줄러가 요청을 처리합니다
              </span>
            </div>
            <div
              style={{
                width: '400px',
                backgroundColor: '#1a1a2e',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(34, 211, 238, 0.3)',
              }}
            >
              <h4
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#22d3ee',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '20px' }}>&#9889;</span>
                Response Details
              </h4>

              {/* 메트릭스 - 타이밍 조정 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <MetricRow label="Request ID" value="req_001" color="#6366f1" frame={frame} delay={137} />
                <MetricRow label="Scheduler" value="MLFQ" color="#06b6d4" frame={frame} delay={150} />
                <MetricRow label="Wait Time" value="12ms" color="#10b981" frame={frame} delay={162} />
                <MetricRow label="Processing" value="234ms" color="#f59e0b" frame={frame} delay={175} />
                <MetricRow label="Status" value="Completed" color="#22c55e" frame={frame} delay={187} />
              </div>
            </div>
          </div>
        </Sequence>
      </div>

      {/* 하단 스케줄러 상태 - 타이밍 조정: 500 -> 208 */}
      <Sequence from={208}>
        <div
          style={{
            marginTop: '36px',
            display: 'flex',
            gap: '24px',
          }}
        >
          <SchedulerStatus name="FCFS" requests={45} color="#3b82f6" frame={frame} delay={208} />
          <SchedulerStatus name="Priority" requests={128} color="#8b5cf6" frame={frame} delay={220} />
          <SchedulerStatus name="MLFQ" requests={312} color="#06b6d4" frame={frame} delay={233} />
          <SchedulerStatus name="WFQ" requests={89} color="#10b981" frame={frame} delay={245} />
        </div>
      </Sequence>
    </div>
  );
};

// 메트릭 행 컴포넌트
const MetricRow: React.FC<{
  label: string;
  value: string;
  color: string;
  frame: number;
  delay: number;
}> = ({ label, value, color, frame, delay }) => {
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: '#0a0a0a',
        borderRadius: '8px',
        opacity,
      }}
    >
      <span style={{ fontSize: '14px', color: '#a1a1aa' }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: 600, color }}>{value}</span>
    </div>
  );
};

// 스케줄러 상태 컴포넌트
const SchedulerStatus: React.FC<{
  name: string;
  requests: number;
  color: string;
  frame: number;
  delay: number;
}> = ({ name, requests, color, frame, delay }) => {
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(frame, [delay, delay + 10], [0.8, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        padding: '16px 24px',
        backgroundColor: '#1a1a2e',
        borderRadius: '12px',
        border: '1px solid ' + color + '40',
        textAlign: 'center',
        minWidth: '120px',
        opacity,
        transform: 'scale(' + scale + ')',
      }}
    >
      <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>{name}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color }}>{requests}</div>
      <div style={{ fontSize: '11px', color: '#52525b' }}>requests</div>
    </div>
  );
};
