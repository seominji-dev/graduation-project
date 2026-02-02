# LLM Scheduler Demo Video

홍익대학교 C235180 서민지 2026년 졸업프로젝트 데모 비디오

**프로젝트:** OS 스케줄링 알고리즘을 활용한 LLM API 요청 최적화 스케줄러

## 비디오 구성 (3분 15초)

| Scene | 시간 | 프레임 | 내용 |
|-------|------|--------|------|
| TitleScene | 0:00 - 0:15 | 0 - 450 | 프로젝트 타이틀, 학교 정보 |
| ProblemScene | 0:15 - 0:45 | 450 - 1350 | LLM API 요청의 3가지 문제 |
| SolutionScene | 0:45 - 1:30 | 1350 - 2700 | 4가지 스케줄링 알고리즘 소개 |
| DemoScene | 1:30 - 2:30 | 2700 - 4500 | 실제 API 동작 데모 |
| ResultsScene | 2:30 - 3:00 | 4500 - 5400 | 테스트 결과 및 성과 |
| EndingScene | 3:00 - 3:15 | 5400 - 5850 | 마무리 및 감사 인사 |

## 기술 스택

- **Remotion 4.0**: React 기반 비디오 제작 프레임워크
- **React 18.2**: UI 컴포넌트
- **TypeScript 5.3**: 타입 안전성

## 설치 방법

```bash
# 1. 디렉토리 이동
cd 03-report/demo/video

# 2. 의존성 설치
npm install

# 3. Remotion 스튜디오 실행 (미리보기)
npm run studio
```

## 사용 방법

### 미리보기 (개발 모드)

```bash
npm run studio
```

브라우저에서 `http://localhost:3000`으로 접속하여 실시간 미리보기 가능

### 비디오 렌더링

```bash
# MP4 출력 (기본)
npm run build

# 출력 파일: out/demo.mp4
```

### GIF 렌더링 (선택)

```bash
npm run build:gif

# 출력 파일: out/demo.gif
```

## 프로젝트 구조

```
video/
├── package.json          # 프로젝트 설정 및 의존성
├── tsconfig.json         # TypeScript 설정
├── remotion.config.ts    # Remotion 설정
├── README.md             # 이 파일
└── src/
    ├── index.ts          # 진입점
    ├── Root.tsx          # 메인 컴포지션
    ├── compositions/     # Scene 컴포넌트
    │   ├── TitleScene.tsx
    │   ├── ProblemScene.tsx
    │   ├── SolutionScene.tsx
    │   ├── DemoScene.tsx
    │   ├── ResultsScene.tsx
    │   └── EndingScene.tsx
    ├── components/       # 재사용 컴포넌트
    │   ├── Terminal.tsx
    │   ├── CodeBlock.tsx
    │   ├── SchedulerDiagram.tsx
    │   └── ProgressBar.tsx
    └── styles/
        └── global.css    # 글로벌 스타일
```

## 주요 기능

### 스케줄러 종류

1. **FCFS (First Come First Served)**: 도착 순서대로 처리
2. **Priority Scheduling**: VIP 우선 처리 및 에이징
3. **MLFQ (Multi-Level Feedback Queue)**: 적응형 다단계 큐
4. **WFQ (Weighted Fair Queuing)**: 가중치 기반 공정 분배

### 프로젝트 성과

- 777개 테스트, 100% 통과
- 98.72% 코드 커버리지

## 커스터마이징

### Scene 수정

각 Scene 파일(`src/compositions/*.tsx`)을 수정하여 내용 변경 가능

### 색상 변경

`src/styles/global.css`의 CSS 변수 수정:

```css
:root {
  --color-primary: #6366f1;
  --color-secondary: #22d3ee;
  /* ... */
}
```

### 비디오 설정 변경

`src/Root.tsx`에서 FPS, 해상도 등 수정:

```typescript
const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;
```

## 문제 해결

### npm install 실패 시

```bash
# Node.js 18+ 필요
node --version

# 캐시 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 렌더링 오류 시

```bash
# Remotion 버전 업그레이드
npm run upgrade
```

## 라이선스

홍익대학교 C235180 서민지 졸업프로젝트 2026

---

제작: MoAI-ADK (Multi-domain Orchestrated AI Agentic Development Kit)
