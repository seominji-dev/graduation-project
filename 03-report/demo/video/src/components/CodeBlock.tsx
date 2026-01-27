import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  highlightLines?: number[];
  startFrame?: number;
  animateTyping?: boolean;
}

// 간단한 구문 하이라이팅 (키워드 기반)
const highlightSyntax = (code: string, language: string): React.ReactNode[] => {
  const keywords = {
    python: ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'for', 'while', 'async', 'await', 'try', 'except', 'with', 'as', 'True', 'False', 'None'],
    json: [],
    typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'async', 'await', 'import', 'export', 'from', 'interface', 'type'],
  };

  const colors = {
    keyword: '#ff79c6',
    string: '#f1fa8c',
    number: '#bd93f9',
    comment: '#6272a4',
    function: '#50fa7b',
    property: '#8be9fd',
    punctuation: '#f8f8f2',
  };

  const lines = code.split('\n');
  
  return lines.map((line, index) => {
    let highlightedLine = line;

    // 문자열 하이라이팅
    highlightedLine = highlightedLine.replace(
      /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
      `<span style="color: ${colors.string}">$&</span>`
    );

    // 주석 하이라이팅
    highlightedLine = highlightedLine.replace(
      /(#.*)$/,
      `<span style="color: ${colors.comment}">$1</span>`
    );

    // 숫자 하이라이팅
    highlightedLine = highlightedLine.replace(
      /\b(\d+\.?\d*)\b/g,
      `<span style="color: ${colors.number}">$1</span>`
    );

    // 키워드 하이라이팅
    const langKeywords = keywords[language as keyof typeof keywords] || [];
    langKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
      highlightedLine = highlightedLine.replace(
        regex,
        `<span style="color: ${colors.keyword}">$1</span>`
      );
    });

    return (
      <div
        key={index}
        style={{
          display: 'flex',
          lineHeight: 1.8,
        }}
      >
        <span style={{ color: '#6272a4', minWidth: '40px', userSelect: 'none' }}>
          {index + 1}
        </span>
        <span
          dangerouslySetInnerHTML={{ __html: highlightedLine || '&nbsp;' }}
        />
      </div>
    );
  });
};

// 코드 블록 컴포넌트
export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'python',
  title,
  highlightLines = [],
  startFrame = 0,
  animateTyping = false,
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - startFrame;

  // 타이핑 애니메이션
  const visibleCode = animateTyping
    ? code.substring(0, Math.floor(relativeFrame * 1.5))
    : code;

  const opacity = interpolate(relativeFrame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ ...styles.container, opacity }}>
      {title && (
        <div style={styles.header}>
          <span style={styles.dot} />
          <span style={styles.dot} />
          <span style={styles.dot} />
          <span style={styles.title}>{title}</span>
        </div>
      )}
      <div style={styles.codeArea}>
        <pre style={styles.pre}>
          <code style={styles.code}>
            {highlightSyntax(visibleCode, language)}
          </code>
        </pre>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#282a36',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
    fontFamily: "'JetBrains Mono', monospace",
    maxWidth: '800px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#21222c',
    gap: '8px',
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#44475a',
  },
  title: {
    marginLeft: '12px',
    color: '#f8f8f2',
    fontSize: '13px',
    fontWeight: 500,
  },
  codeArea: {
    padding: '20px',
    overflow: 'auto',
  },
  pre: {
    margin: 0,
    padding: 0,
  },
  code: {
    color: '#f8f8f2',
    fontSize: '14px',
    lineHeight: 1.6,
  },
};
