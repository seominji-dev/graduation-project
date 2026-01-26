# 기여 가이드

먼저 이 프로젝트에 관심을 가져주셔서 감사합니다! 기여를 환영합니다.

## 기여하는 방법

### 버그 신고

버그를 발견하시면 [이슈](../../issues)를 생성해 주세요. 이슈에 다음 정보를 포함해 주세요:

- 버그에 대한 설명
- 재현 단계
- 예상 동작
- 실제 동작
- 스크린샷 (해당하는 경우)
- 운영체제 및 버전
- Node.js 버전 (`node -v`)

### 기능 제안

새로운 기능을 제안하려면:

1. [이슈](../../issues)를 생성하여 제안을 설명하세요
2. 기능의 사용 사례를 설명하세요
3. 가능한 경우 예시 코드를 포함하세요
4. 논의를 위해 기다려 주세요

### 풀 리퀘스트 제출

1. 이 저장소를 포크하세요
2. 기능 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. 변경 사항을 커밋하세요 (`git commit -m 'feat: add amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. 풀 리퀘스트를 열어주세요

## 개발 설정

### 포크 및 클론

```bash
# 저장소 포크 후 클론
git clone https://github.com/YOUR_USERNAME/checkpointing.git
cd checkpointing

# 원격 저장소 추가
git remote add upstream https://github.com/ORIGINAL_OWNER/checkpointing.git
```

### 의존성 설치

```bash
npm install
```

### 개발 서버 실행

```bash
# MongoDB 시작
docker-compose up -d

# 개발 서버 시작
npm run dev
```

### 테스트 실행

```bash
# 모든 테스트
npm test

# 커버리지 포함
npm run test:coverage

# 워치 모드
npm run test:watch
```

## 코드 스타일 가이드라인

### TypeScript/JavaScript

- TypeScript 엄격 모드 사용
- 함수명은 카멜 케이스 (`camelCase`)
- 클래스/타입명은 파스칼 케이스 (`PascalCase`)
- 상수명은 대문자 스네이크 케이스 (`UPPER_SNAKE_CASE`)
- 최대 라인 길이: 100자

### 명명 규칙

- 파일명: 카멜 케이스 (`checkpointManager.ts`)
- 인터페이스: `I` 접두사 없이 파스칼 케이스 (`Checkpoint`)
- 타입: 파스칼 케이스 (`CheckpointType`)
- 함수: 동사로 시작 (`createCheckpoint`, `recoverAgent`)

### 주석 요구사항

- **코드 주석**: 한국어 작성
- **JSDoc**: 영어 작성 (API 문서화용)
- **복잡한 로직**: 반드시 주석 포함

```typescript
/**
 * Create a checkpoint for agent state
 * @param agentId - Agent identifier
 * @param state - Current agent state
 * @param options - Checkpoint creation options
 * @returns Created checkpoint metadata
 */
async createCheckpoint(
  agentId: string,
  state: AgentState,
  options: CheckpointOptions
): Promise<Checkpoint> {
  // 에이전트 상태를 JSON으로 직렬화
  // MongoDB에 영구 저장
  // 메타데이터와 함께 반환
  ...
}
```

## 커밋 메시지 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/)를 따르세요:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 타입

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅 (세미콜론, 등)
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스 또는 보조 도구 변경

### 예시

```bash
git commit -m "feat(checkpoint): add incremental checkpoint compression"
git commit -m "fix(recovery): resolve state deserialization error"
git commit -m "docs: update recovery API documentation"
```

## PR 리뷰 프로세스

1. 모든 CI 테스트가 통과해야 합니다
2. 최소 1명의 maintainer 승인이 필요합니다
3. 코드 리뷰 코멘트에 응답해 주세요
4. 요청된 변경사항을 반영해 주세요
5. Conflict가 발생하면 최신 main과 rebase하세요

## 행동 강령

이 프로젝트는 [행동 강령](CODE_OF_CONDUCT.md)을 따릅니다. 모든 기여자는 존중하고 포용적인 환경을 유지해야 합니다.

## 질문?

[이슈](../../issues)를 생성하여 질문하세요. 우리는 도와드리겠습니다!

---

기여해 주셔서 다시 한번 감사합니다! 🎉
