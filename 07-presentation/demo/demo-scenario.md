# 데모 시나리오

발표 일정: 2026년 5월 26일(화) ~ 5월 29일(금)
발표자: 서민지 (홍익대학교 컴퓨터공학과 4학년)

---

## 사전 준비 사항

### 환경 요구사항

- Node.js 설치 확인: `node --version` (v16 이상 권장)
- 프로젝트 위치: `졸업프로젝트/02-implementation/src-simple/`
- 터미널 2개 준비 (서버용 / 요청 전송용)
- 브라우저 준비 (Chrome 권장)

### 발표 전 체크리스트

- [ ] 노트북 충전 완료
- [ ] `node_modules` 설치 완료: `cd 02-implementation && npm install`
- [ ] 포트 3000 미사용 확인: `lsof -i :3000` (사용 중이면 프로세스 종료)
- [ ] 브라우저 시크릿 모드 준비 (캐시 문제 방지)
- [ ] 터미널 폰트 크기 확대 (청중이 볼 수 있도록 18pt 이상)

---

## 시나리오 1: FCFS vs WFQ 처리 순서 비교 (2분)

### 목적
FCFS는 도착 순서대로, WFQ는 Enterprise 등급을 먼저 처리함을 시각적으로 보여준다.

### 1-1. FCFS 서버 시작

터미널 1에서:

```bash
cd 졸업프로젝트/02-implementation
SCHEDULER_TYPE=FCFS node src-simple/server.js
```

예상 출력:
```
Server running on http://localhost:3000
Scheduler: FCFS
```

### 1-2. 브라우저 대시보드 열기

브라우저에서 접속: `http://localhost:3000`

대시보드에서 확인:
- 현재 스케줄러 타입 (FCFS)
- 대기 중인 요청 목록
- 처리된 요청 통계

### 1-3. 4개 등급 요청 전송

터미널 2에서 순서대로 전송 (Free → Standard → Premium → Enterprise 순):

```bash
# Free 등급 요청 (먼저 도착)
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Free user request","tenantId":"user-free","tier":"free","priority":"NORMAL"}'

# Standard 등급 요청
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Standard user request","tenantId":"user-standard","tier":"standard","priority":"NORMAL"}'

# Premium 등급 요청
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Premium user request","tenantId":"user-premium","tier":"premium","priority":"HIGH"}'

# Enterprise 등급 요청 (나중에 도착)
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Enterprise user request","tenantId":"user-enterprise","tier":"enterprise","priority":"HIGH"}'
```

설명 멘트:
> "FCFS에서는 도착 순서대로 처리됩니다. Free가 먼저 왔으니 Free가 먼저 처리됩니다."

### 1-4. WFQ로 서버 전환

터미널 1에서 Ctrl+C로 서버 중단 후:

```bash
SCHEDULER_TYPE=WFQ node src-simple/server.js
```

### 1-5. 동일 요청 재전송

위 1-3 명령어 동일하게 실행.

설명 멘트:
> "WFQ에서는 구독 등급에 비례한 처리 횟수를 보장합니다. Enterprise가 Free보다 8배 높은 가중치를 가지므로, 먼저 처리됩니다."

브라우저 대시보드에서 처리 순서 확인: Enterprise → Premium → Standard → Free 순.

---

## 시나리오 2: Rate Limiter 동작 시연 (1분)

### 목적
구독 등급별 요청 한도가 적용되어, Free 등급은 일정 수 이상 요청 시 거부됨을 보여준다.

### 2-1. Rate Limiter 활성화 서버 시작

터미널 1에서 (Ctrl+C로 기존 서버 중단 후):

```bash
RATE_LIMIT_ENABLED=true SCHEDULER_TYPE=WFQ node src-simple/server.js
```

### 2-2. Free 등급 요청 빠르게 전송

터미널 2에서 루프로 6번 전송:

```bash
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "요청 $i: %{http_code}\n" \
    -X POST http://localhost:3000/api/requests \
    -H "Content-Type: application/json" \
    -d "{\"prompt\":\"Request $i\",\"tenantId\":\"user-free\",\"tier\":\"free\",\"priority\":\"NORMAL\"}"
done
```

예상 출력:
```
요청 1: 202
요청 2: 202
요청 3: 202
요청 4: 202
요청 5: 202
요청 6: 429
```

설명 멘트:
> "Free 등급은 분당 10건으로 제한됩니다. 한도를 초과하면 HTTP 429 응답을 받습니다. Enterprise 등급은 분당 120건으로 훨씬 높은 한도를 가집니다."

### 2-3. Enterprise는 정상 처리 확인

```bash
curl -s -o /dev/null -w "Enterprise 요청: %{http_code}\n" \
  -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Enterprise request","tenantId":"user-enterprise","tier":"enterprise","priority":"HIGH"}'
```

예상 출력: `Enterprise 요청: 202`

설명 멘트:
> "같은 상황에서 Enterprise는 정상적으로 처리됩니다."

---

## 문제 상황별 대처 방법

### 포트 충돌 오류
```
Error: listen EADDRINUSE: address already in use :::3000
```
해결:
```bash
lsof -ti :3000 | xargs kill -9
```

### curl 명령어 실패 (연결 거부)
서버가 시작되지 않은 경우. 터미널 1의 서버 출력 확인 후 재시도.

### 대시보드 로딩 안됨
브라우저 강력 새로고침: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)

### node 명령어를 찾을 수 없음
```bash
export PATH=$PATH:/usr/local/bin
```

---

## 데모 종료

```
# 터미널 1에서 서버 종료
Ctrl+C
```

질문 시 대기.

---

## 핵심 강조 포인트

1. FCFS: "단순하지만 구독 등급이 반영되지 않음"
2. WFQ: "가중치에 비례한 공정한 차등 서비스"
3. Rate Limiter: "과도한 요청으로부터 서버 보호, 유료 사용자 품질 보장"
