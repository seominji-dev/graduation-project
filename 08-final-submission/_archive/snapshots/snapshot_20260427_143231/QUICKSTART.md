# QUICKSTART — 시연 환경 15분 구축 가이드

이 문서는 **시연을 지금 당장 시작하기 위한 단계별 명령**입니다. 개념 설명이 아닌 실행 순서만 담고 있습니다. 각 단계를 순서대로 따라하세요.

> **서민지의 자기 리허설용 체크리스트** — 발표장 당일이 아닌 **발표 1주 전까지** 이 문서를 처음부터 끝까지 3회 연습하세요. 당일에는 Step 3(npm install)부터 다시 수행하면 됩니다.

## 실행 기준 (모든 명령이 공유)

- **작업 디렉토리**: 이 문서의 모든 `cd` 명령은 **`08-final-submission/` 폴더가 보이는 위치(즉 프로젝트 루트 또는 zip 해제 루트)**에서 시작합니다. 08 폴더 안에서 터미널을 열었다면 `cd ..`로 한 번 나간 뒤 진행하세요.
- **운영체제**: macOS·Linux는 표기된 명령 그대로 사용. Windows는 Step 4에 별도 표기된 대안 명령을 사용.
- **Node.js 버전**: v20 LTS 이상 필수 (Step 3의 `npm install`이 `package-lock.json` 기준으로 69 패키지를 설치).

---

## Prerequisites (사전 확인, 1분)

다음 4가지가 준비되어 있어야 합니다. 터미널에서 각각 명령을 실행하여 확인하세요.

```bash
node --version          # v20.0.0 이상이어야 함
npm --version           # 10.x 이상이어야 함
ollama --version        # 0.3.x 이상이어야 함 (없으면 Step 1로)
lsof -i :3000           # 출력 없으면 OK (있으면 Step 5 문제 해결 참조)
```

Node.js가 없다면 [nodejs.org](https://nodejs.org)에서 LTS 버전을 설치합니다.

---

## Step 1 — Ollama 설치 (5분, 이미 설치되어 있다면 건너뜀)

### macOS

```bash
brew install ollama
ollama --version
```

또는 [ollama.com/download](https://ollama.com/download)에서 앱 설치 파일을 다운로드.

### Windows

[ollama.com/download/windows](https://ollama.com/download/windows)에서 `.exe` 설치 파일 다운로드 후 실행.

### Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 설치 성공 확인

```bash
ollama --version
# ollama version is 0.3.x (숫자 출력되면 성공)
```

---

## Step 2 — LLM 모델 다운로드 및 warmup (5분, 최초 1회)

모델 파일이 약 3GB이므로 시간이 걸립니다. 한 번 다운로드하면 이후에는 즉시 사용됩니다.

```bash
# 1. Ollama 서버 기동 (백그라운드)
ollama serve &       # macOS/Linux
# Windows는 설치 시 자동 기동됨

# 2. 모델 pull
ollama pull gemma4:e4b

# 3. warmup (최초 추론을 미리 돌려 GPU/CPU 로드 시간 제거)
ollama run gemma4:e4b "안녕"
#   → 프롬프트가 나오면 "/bye" 입력 후 Enter로 종료

# 4. 성공 확인
ollama list
# NAME                  ID              SIZE      MODIFIED
# gemma4:e4b            xxxxxxxxxxxxx   3.3 GB    N minutes ago

curl http://localhost:11434/api/tags
# JSON 응답이 출력되면 성공
```

**다른 모델을 쓰고 싶다면:** `ollama pull <모델명>` 후 Step 4의 서버 실행 시 `OLLAMA_MODEL=<모델명>`을 환경변수로 전달하세요.

---

## Step 3 — 소스코드 의존성 설치 (2분)

```bash
cd 08-final-submission/source-code
npm install
```

`package-lock.json`이 포함되어 있어 정확한 버전으로 설치됩니다. 설치가 끝나면 `node_modules/` 폴더가 생성되고 약 68~70개 패키지가 로컬에 들어옵니다 (npm 버전에 따라 1~2개 차이 가능).

### 설치 성공 확인

```bash
ls node_modules/.package-lock.json
# → 출력이 있으면 성공
```

---

## Step 4 — 서버 실행 (30초)

### macOS / Linux

```bash
# 기본 (FCFS 스케줄러)
npm start

# 또는 특정 스케줄러 선택
npm run start:fcfs
npm run start:priority
npm run start:mlfq
npm run start:wfq

# 환경변수 커스터마이즈
SCHEDULER_TYPE=WFQ OLLAMA_MODEL=gemma4:e4b RATE_LIMIT_ENABLED=true npm start
```

### Windows (CMD)

`npm run start:fcfs` 같은 스크립트는 Unix 환경변수 문법이 포함되어 있어 Windows CMD에서 실패합니다. 아래 명령으로 대체하세요.

```cmd
REM 기본 (FCFS)
npm start

REM 스케줄러 선택
set SCHEDULER_TYPE=FCFS&& node index.js
set SCHEDULER_TYPE=Priority&& node index.js
set SCHEDULER_TYPE=MLFQ&& node index.js
set SCHEDULER_TYPE=WFQ&& node index.js

REM 여러 환경변수
set SCHEDULER_TYPE=WFQ&& set OLLAMA_MODEL=gemma4:e4b&& set RATE_LIMIT_ENABLED=true&& node index.js
```

### Windows (PowerShell)

```powershell
# 기본 (FCFS)
npm start

# 스케줄러 선택
$env:SCHEDULER_TYPE="WFQ"; node index.js

# 여러 환경변수
$env:SCHEDULER_TYPE="WFQ"; $env:OLLAMA_MODEL="gemma4:e4b"; $env:RATE_LIMIT_ENABLED="true"; node index.js
```

### 실행 성공 확인

터미널에 다음 메시지가 출력되어야 합니다:

```
[Server] Listening on http://localhost:3000
[Server] Scheduler: FCFS (or the selected one)
[Server] Ollama: http://localhost:11434 (gemma4:e4b)
```

---

## Step 5 — 대시보드 접속 및 요청 테스트 (2분)

### 대시보드

브라우저로 `http://localhost:3000` 접속. 좌측 패널에 스케줄러 상태, 우측 패널에 대기 큐가 표시됩니다.

### 요청 전송 (한 건만)

새 터미널에서:

```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"enterprise-user-1","prompt":"안녕하세요","priority":"NORMAL"}'
```

응답 예시:

```json
{"requestId": "req-xxxxx", "status": "queued"}
```

### 처리 트리거

대시보드의 **"다음 처리"** 버튼 클릭 (또는 curl로):

```bash
curl -X POST http://localhost:3000/api/scheduler/process
```

약 100~300ms 후 요청이 Ollama로 전달되고, 응답이 대시보드에 표시됩니다.

---

## 성공 확인 체크리스트

- [ ] `ollama list`가 `gemma4:e4b` 출력
- [ ] `curl http://localhost:11434/api/tags`가 JSON 반환
- [ ] `npm start`가 `Listening on http://localhost:3000` 출력
- [ ] 브라우저에서 `http://localhost:3000` 대시보드 확인
- [ ] 요청 전송 → "다음 처리" 클릭 → Ollama 응답 확인

모두 체크되면 시연 환경이 완성된 것입니다. 상세 시연 순서는 [`demo/demo-scenario.md`](demo/demo-scenario.md)를 참조하세요.

---

## 문제 해결

### "포트 3000이 이미 사용 중"

```bash
lsof -i :3000
# → 표시되는 PID 확인 후:
kill -9 <PID>
```

### "Ollama 서버 응답 없음" (curl이 연결 거부)

```bash
# Ollama가 기동 중인지 확인
ps aux | grep ollama

# 기동되어 있지 않으면:
ollama serve &
```

### "npm install 실패"

```bash
# Node.js 버전 확인 (v20 이상 필요)
node --version

# npm 캐시 문제 시:
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

주의: `package-lock.json` 삭제 후 재설치하면 버전이 달라질 수 있습니다. 시연이 급하지 않다면 원본 `package-lock.json`을 복원하고 `npm install` 다시 시도.

### "Ollama 응답이 너무 느림" (시나리오 3 진행 중)

현장에서 Ollama가 느려 시연이 막힐 수 있습니다. 백업 녹화본을 준비하세요. 제작 방법은 [`minji/backup-demo-shooting-kit.md`](minji/backup-demo-shooting-kit.md) 참조.

### "화면이 투사되지 않음"

발표장 프로젝터 문제. [`minji/projector-checklist.md`](minji/projector-checklist.md)의 10~15분 체크리스트를 따르세요.

---

## 다음 단계

이 문서의 모든 단계가 성공했다면:

1. [`demo/demo-scenario.md`](demo/demo-scenario.md) — 시연 전체 흐름 (시나리오 1~7)
2. [`demo/script.md`](demo/script.md) — 발표 스크립트 (원본)
3. [`demo/script-v2.md`](demo/script-v2.md) — 발표 스크립트 (서민지 입말 버전)
4. [`minji/rehearsal-playbook.md`](minji/rehearsal-playbook.md) — 리허설 플레이북
