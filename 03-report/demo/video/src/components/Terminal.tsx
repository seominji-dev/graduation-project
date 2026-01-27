import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

interface TerminalProps {
  commands: Array<{
    prompt?: string;
    command: string;
    output?: string[];
    delay?: number;
  }>;
  title?: string;
  startFrame?: number;
}

// 터미널 애니메이션 컴포넌트
export const Terminal: React.FC<TerminalProps> = ({
  commands,
  title = 'Terminal',
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - startFrame;

  // 커서 깜빡임
  const cursorOpacity = Math.floor(relativeFrame / 15) % 2 === 0 ? 1 : 0;

  // 타이핑 속도 (프레임당 문자 수)
  const CHARS_PER_FRAME = 0.8;

  // 각 명령어의 시작 프레임과 타이핑 진행 계산
  let accumulatedFrames = 0;
  const commandStates = commands.map((cmd, index) => {
    const commandStartFrame = accumulatedFrames + (cmd.delay || 0);
    const commandLength = cmd.command.length;
    const typingDuration = Math.ceil(commandLength / CHARS_PER_FRAME);
    const outputStartFrame = commandStartFrame + typingDuration + 10;
    
    accumulatedFrames = outputStartFrame + (cmd.output?.length || 0) * 8 + 20;

    const typingProgress = Math.min(
      1,
      Math.max(0, (relativeFrame - commandStartFrame) * CHARS_PER_FRAME / commandLength)
    );

    const visibleChars = Math.floor(typingProgress * commandLength);
    const showOutput = relativeFrame >= outputStartFrame;

    return {
      ...cmd,
      visibleChars,
      showOutput,
      isTyping: relativeFrame >= commandStartFrame && relativeFrame < commandStartFrame + typingDuration,
    };
  });

  return (
    <div style={styles.terminal}>
      {/* 터미널 헤더 */}
      <div style={styles.header}>
        <div style={styles.buttons}>
          <div style={{ ...styles.button, backgroundColor: '#ff5f56' }} />
          <div style={{ ...styles.button, backgroundColor: '#ffbd2e' }} />
          <div style={{ ...styles.button, backgroundColor: '#27ca40' }} />
        </div>
        <span style={styles.title}>{title}</span>
      </div>

      {/* 터미널 본문 */}
      <div style={styles.body}>
        {commandStates.map((cmd, index) => (
          <div key={index} style={styles.commandBlock}>
            {/* 프롬프트와 명령어 */}
            <div style={styles.line}>
              <span style={styles.prompt}>{cmd.prompt || '$ '}</span>
              <span style={styles.command}>
                {cmd.command.substring(0, cmd.visibleChars)}
              </span>
              {cmd.isTyping && (
                <span style={{ ...styles.cursor, opacity: cursorOpacity }}>|</span>
              )}
            </div>

            {/* 출력 */}
            {cmd.showOutput && cmd.output?.map((line, lineIndex) => (
              <div key={lineIndex} style={styles.output}>
                {line}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  terminal: {
    width: '900px',
    backgroundColor: '#0d1117',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
    fontFamily: "'JetBrains Mono', monospace",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#161b22',
    borderBottom: '1px solid #30363d',
  },
  buttons: {
    display: 'flex',
    gap: '8px',
  },
  button: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#8b949e',
    fontSize: '13px',
    fontWeight: 500,
  },
  body: {
    padding: '20px',
    minHeight: '300px',
  },
  commandBlock: {
    marginBottom: '16px',
  },
  line: {
    display: 'flex',
    alignItems: 'center',
    lineHeight: 1.6,
  },
  prompt: {
    color: '#7ee787',
    marginRight: '8px',
  },
  command: {
    color: '#f0f6fc',
    fontSize: '15px',
  },
  cursor: {
    color: '#f0f6fc',
    marginLeft: '2px',
  },
  output: {
    color: '#8b949e',
    fontSize: '14px',
    lineHeight: 1.8,
    paddingLeft: '4px',
  },
};
