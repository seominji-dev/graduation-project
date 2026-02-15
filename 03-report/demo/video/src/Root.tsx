import { Composition, Sequence, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { TitleScene } from './compositions/TitleScene';
import { ProblemScene } from './compositions/ProblemScene';
import { SolutionScene } from './compositions/SolutionScene';
import { DemoScene } from './compositions/DemoScene';
import { ResultsScene } from './compositions/ResultsScene';
import { EndingScene } from './compositions/EndingScene';
import './styles/global.css';

// 비디오 설정
const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

// 각 Scene 프레임 계산 (30fps 기준) - 총 약 1분 26초
const TITLE_FRAMES = 8 * FPS;       // 0:00-0:08 (240 frames)
const PROBLEM_FRAMES = 12 * FPS;    // 0:08-0:20 (360 frames)
const SOLUTION_FRAMES = 18 * FPS;   // 0:20-0:38 (540 frames)
const DEMO_FRAMES = 25 * FPS;       // 0:38-1:03 (750 frames)
const RESULTS_FRAMES = 15 * FPS;    // 1:03-1:18 (450 frames)
const ENDING_FRAMES = 8 * FPS;      // 1:18-1:26 (240 frames)

const TOTAL_FRAMES = TITLE_FRAMES + PROBLEM_FRAMES + SOLUTION_FRAMES +
                     DEMO_FRAMES + RESULTS_FRAMES + ENDING_FRAMES;

// 각 Scene 시작 프레임
const TITLE_START = 0;
const PROBLEM_START = TITLE_FRAMES;
const SOLUTION_START = PROBLEM_START + PROBLEM_FRAMES;
const DEMO_START = SOLUTION_START + SOLUTION_FRAMES;
const RESULTS_START = DEMO_START + DEMO_FRAMES;
const ENDING_START = RESULTS_START + RESULTS_FRAMES;

// Premount 설정 (0.5초 premount for smooth transitions)
const PREMOUNT_FRAMES = Math.round(0.5 * FPS);

// 전체 진행 표시바 컴포넌트
const VideoProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '4px',
        backgroundColor: '#27272a',
        zIndex: 100,
      }}
    >
      <div
        style={{
          height: '100%',
          width: progress + '%',
          backgroundColor: '#6366f1',
          boxShadow: '0 0 10px #6366f180',
          transition: 'width 0.1s ease-out',
        }}
      />
    </div>
  );
};

// Scene 라벨 표시 컴포넌트
const SceneLabel: React.FC<{ label: string; sceneNumber: number; totalScenes: number }> = ({
  label,
  sceneNumber,
  totalScenes,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        left: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity,
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: '#6366f1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 700,
          color: 'white',
        }}
      >
        {sceneNumber}
      </div>
      <span style={{ fontSize: 16, fontWeight: 500, color: '#a1a1aa' }}>
        {sceneNumber} / {totalScenes}
      </span>
      <span style={{ fontSize: 16, fontWeight: 600, color: '#e4e4e7' }}>{label}</span>
    </div>
  );
};

// 전체 데모 비디오 컴포넌트
const DemoVideo: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#0a0a0a', width: '100%', height: '100%', position: 'relative' }}>
      {/* Scene 1: 타이틀 (0:00-0:08) */}
      <Sequence from={TITLE_START} durationInFrames={TITLE_FRAMES}>
        <TitleScene />
      </Sequence>

      {/* Scene 2: 문제 제기 (0:08-0:20) */}
      <Sequence from={PROBLEM_START} durationInFrames={PROBLEM_FRAMES} premountFor={PREMOUNT_FRAMES}>
        <ProblemScene />
        <SceneLabel label="문제 제기" sceneNumber={2} totalScenes={6} />
      </Sequence>

      {/* Scene 3: 해결책 (0:20-0:38) */}
      <Sequence from={SOLUTION_START} durationInFrames={SOLUTION_FRAMES} premountFor={PREMOUNT_FRAMES}>
        <SolutionScene />
        <SceneLabel label="해결책" sceneNumber={3} totalScenes={6} />
      </Sequence>

      {/* Scene 4: 데모 (0:38-1:03) */}
      <Sequence from={DEMO_START} durationInFrames={DEMO_FRAMES} premountFor={PREMOUNT_FRAMES}>
        <DemoScene />
        <SceneLabel label="데모" sceneNumber={4} totalScenes={6} />
      </Sequence>

      {/* Scene 5: 결과 (1:03-1:18) */}
      <Sequence from={RESULTS_START} durationInFrames={RESULTS_FRAMES} premountFor={PREMOUNT_FRAMES}>
        <ResultsScene />
        <SceneLabel label="결과" sceneNumber={5} totalScenes={6} />
      </Sequence>

      {/* Scene 6: 엔딩 (1:18-1:26) */}
      <Sequence from={ENDING_START} durationInFrames={ENDING_FRAMES} premountFor={PREMOUNT_FRAMES}>
        <EndingScene />
      </Sequence>

      {/* 전체 진행 표시바 */}
      <VideoProgressBar />
    </div>
  );
};

// Remotion 컴포지션 등록
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 전체 데모 비디오 */}
      <Composition
        id="DemoVideo"
        component={DemoVideo}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      {/* 개별 Scene 미리보기용 */}
      <Composition
        id="TitleScene"
        component={TitleScene}
        durationInFrames={TITLE_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="ProblemScene"
        component={ProblemScene}
        durationInFrames={PROBLEM_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="SolutionScene"
        component={SolutionScene}
        durationInFrames={SOLUTION_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="DemoScene"
        component={DemoScene}
        durationInFrames={DEMO_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="ResultsScene"
        component={ResultsScene}
        durationInFrames={RESULTS_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="EndingScene"
        component={EndingScene}
        durationInFrames={ENDING_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
