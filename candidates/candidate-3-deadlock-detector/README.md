# Deadlock Detector for Multi-Agent Systems

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-87.76%25-brightgreen)](https://github.com/YOUR_USERNAME/deadlock-detector)

> 데드락 감지 및 회복 시스템 - Wait-For Graph 기반 다중 에이전트 시스템용 데드락 감지 및 회복

[![Star us on GitHub](https://img.shields.io/badge/⭐-Star%20us%20on%20GitHub-yellow?style=social)](https://github.com/YOUR_USERNAME/deadlock-detector)

---

## 개요

이 프로젝트는 운영체제의 데드락 감지 알고리즘을 AI/LLM 다중 에이전트 시스템에 적용한 2025년 홍익대학교 컴퓨터공학과 졸업 프로젝트입니다.

## 핵심 기능

### 1. Wait-For Graph (WFG) 기반 사이클 탐지

- DFS(Depth-First Search)를 사용한 사이클 탐지
- O(V + E) 시간 복잡도 (V: 에이전트 수, E: 엣지 수)
- 다중 사이클 동시 감지

### 2. 희생자 선택 전략

- **우선순위 기반**: 가장 낮은 우선순위 에이전트 선택
- **나이 기반**: 가장 최근에 생성된 에이전트 선택
- **자원 보유량 기반**: 가장 많은 자원을 보유한 에이전트 선택
- **의존성 최소화**: 가장 적은 자원을 보유한 에이전트 선택

### 3. 체크포인트 기반 롤백

- 에이전트 상태 저장 및 복구
- 자원 해제를 통한 데드락 해결

### 4. 은행원 알고리즘 (Banker's Algorithm)

- 데드락 회피(avoidance) 기법
- 안전 상태 검사를 통한 자원 할당

## 시작하기

### 설치

```bash
# 의존성 설치
cd candidates/candidate-3-deadlock-detector
npm install

# 개발 모드 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start

# 테스트 실행
npm test

# 커버리지 확인
npm run test:coverage
```

## API 엔드포인트

### 시스템 상태
- `GET /api/health` - 시스템 헬스 체크
- `GET /api/graph` - 현재 WFG 상태 조회

### 에이전트 관리
- `POST /api/agents` - 새 에이전트 생성
  ```json
  {
    "name": "Agent-1",
    "priority": 5
  }
  ```

### 자원 관리
- `POST /api/resources` - 새 자원 생성
  ```json
  {
    "name": "Resource-1",
    "type": "computational",
    "instances": 1
  }
  ```

- `POST /api/resources/request` - 자원 요청
  ```json
  {
    "agentId": "agent-id",
    "resourceId": "resource-id"
  }
  ```

- `POST /api/resources/release` - 자원 해제
  ```json
  {
    "agentId": "agent-id",
    "resourceId": "resource-id"
  }
  ```

### 데드락 감지 및 회복
- `POST /api/deadlock/detect` - 데드락 감지
- `POST /api/deadlock/victim` - 희생자 선택
  ```json
  {
    "cycleId": "cycle-id",
    "strategy": "lowest_priority"
  }
  ```

### 체크포인트 및 롤백
- `POST /api/recovery/checkpoint/:agentId` - 체크포인트 생성
- `POST /api/recovery/rollback/:agentId` - 롤백 실행

### 은행원 알고리즘
- `GET /api/bankers` - 안전 상태 조회

## 프로젝트 구조

```
src/
├── domain/          # 도메인 모델 (Agent, Resource, WaitForEdge)
├── detectors/       # 사이클 탐지기 (CycleDetector)
├── recovery/        # 회복 전략 (VictimSelector, RollbackManager)
├── avoiders/        # 은행원 알고리즘 (SafetyChecker, BankersAlgorithm)
├── api/            # REST API 컨트롤러 및 라우트
├── config/         # 설정 파일
└── infrastructure/ # MongoDB, Redis 연결

tests/
├── unit/           # 단위 테스트
├── detectors/      # 탐지기 테스트
├── recovery/       # 회복 전략 테스트
├── avoiders/       # 은행원 알고리즘 테스트
└── integration/    # 통합 테스트
```

## 알고리즘 설명

### Wait-For Graph 사이클 탐지

1. 에이전트를 노드, 대기 관계를 엣지로 그래프 구성
2. DFS로 백 엣지(back-edge) 탐색
3. 백 엣지 발견 = 사이클 존재 = 데드락

### 희생자 선택

데드락 해결을 위해 종료할 에이전트 선택:

1. **우선순위**: 낮을수록 먼저 종료
2. **나이**: 젊을수록(최근 생성) 먼저 종료
3. **자원 보유**: 많을수록 회복 효과 큼
4. **의존성**: 적을수록 부작용 적음

### 은행원 알고리즘

자원 할당 전 안전 상태 검사:

1. 요청이 가용 자원 내에 있는지 확인
2. 할당 후 안전 상태인지 시뮬레이션
3. 안전하지 않으면 대기열에 추가
4. 안전하면 자원 할당

## 기술 스택

- **런타임**: Node.js 20 LTS
- **언어**: TypeScript 5.9
- **API**: Express.js + Socket.IO
- **데이터베이스**: MongoDB 7.0
- **캐싱**: Redis 7.2
- **테스트**: Vitest

## 학술적 가치

1. **OS 이론의 AI 응용**: 운영체제 데드락 이론을 다중 에이전트 시스템에 적용
2. **실용적 해결책**: 실제 AI 서비스에서 발생하는 자원 경합 문제 해결
3. **성능 비교**: 다양한 감지/회복 전략의 성능 분석

## 기여하기

기여를 환영합니다! [CONTRIBUTING.md](CONTRIBUTING.md)를 참조해 주세요.

## 보안

보안 취약점을 발견하시면 [SECURITY.md](SECURITY.md)를 참조하여 보고해 주세요.

## 변경 내역

[CHANGELOG.md](CHANGELOG.md)를 참조하세요.

## 라이선스

이 프로젝트는 [MIT 라이선스](LICENSE) 하에 배포됩니다.

## 저자

홍익대학교 컴퓨터공학과 졸업 프로젝트 팀
