# LLM Scheduler Demo Video

홍익대학교 C235180 서민지 2026년 졸업프로젝트 데모 비디오

**프로젝트:** OS 스케줄링 알고리즘을 활용한 LLM API 요청 최적화 스케줄러

## 빠른 시작

### 1. 데모 실행 (테스트)

```bash
cd 03-report/demo/video
./run-demo.sh
```

### 2. 데모 녹화 (Asciinema)

```bash
# 1. Asciinema 설치
brew install asciinema

# 2. 녹화 시작
asciinema rec demo-screencast.cast

# 3. 데모 실행 (다른 터미널)
./run-demo.sh

# 4. 녹화 종료 (Ctrl+D)
```

### 3. MP4로 변환

```bash
# 변환 도구 설치
npm install -g asciinema-convert

# 변환
asciinema-convert demo-screencast.cast demo-screencast.mp4
```

## 데모 시나리오

| 시나리오 | 시간 | 내용 |
|---------|------|------|
| 시나리오 1 | 1분 | 시스템 시작 및 Health Check |
| 시나리오 2 | 1.5분 | FCFS 스케줄러 - 선착순 처리 |
| 시나리오 3 | 1.5분 | Priority 스케줄러 - 우선순위 처리 |
| 시나리오 4 | 1.5분 | MLFQ 스케줄러 - 다단계 큐 |
| 시나리오 5 | 2분 | WFQ 스케줄러 - 멀티테넌트 공정성 (핵심) |
| 시나리오 6 | 1분 | 통계 및 성능 요약 |

## 사전 요구사항

```bash
# Homebrew 확인
brew --version

# Node.js 확인 (v22.0.0 이상)
node --version

# Ollama 확인 및 모델 다운로드
ollama list
ollama pull llama3.2

# jq 확인 (선택사항, JSON 포맷팅용)
brew install jq
```

## 파일 구조

```
video/
├── README.md              # 이 파일
├── RECORDING-GUIDE.md     # 상세 녹화 가이드
├── run-demo.sh            # 데모 실행 스크립트
├── test-scheduler.sh      # 간단한 테스트 스크립트
├── src/                   # Remotion 비디오 소스
├── out/                   # 렌더링된 비디오
└── screenshots/           # 데모 스크린샷
```

## Remotion 비디오 (애니메이션)

Remotion을 사용하여 프레젠테이션 비디오를 제작할 수도 있습니다.

```bash
# 의존성 설치
npm install

# 스튜디오 실행 (미리보기)
npm run studio

# 비디오 렌더링
npm run build

# 출력 파일: out/demo.mp4
```

## 문제 해결

### 포트 충돌

```bash
# 포트 3000 사용 중인 프로세스 확인
lsof -i :3000

# 프로세스 종료
kill -9 <PID>
```

### Ollama 연결 실패

```bash
# Ollama 재시작
killall ollama
ollama serve
```

### 서버 시작 실패

```bash
# 로그 확인
cat /tmp/api-server-*.log
```

## 상세 가이드

- [녹화 가이드](RECORDING-GUIDE.md) - 상세 녹화 방법
- [데모 스크립트](../demo-script.md) - 발표용 스크립트
- [데모 가이드](../demo-guide.md) - 상세 데모 설명

---

**작성일:** 2026-02-07
**버전:** 1.0.0
