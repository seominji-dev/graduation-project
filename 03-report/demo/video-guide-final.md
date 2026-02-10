# 비디오 녹화 가이드 (Video Recording Guide)
## 데모 비디오 제작 가이드

---

## 비디오 개요 (Video Overview)

**목표:** 3분 데모 비디오 제작

**포맷:** MP4 (H.264)

**해상도:** 1920x1080 (Full HD)

**길이:** 3분 정도

---

## 녹화 준비 (Recording Setup)

### 하드웨어

| 항목 | 권장 사양 |
|------|----------|
| 마이크 | USB 콘덴서 마이크 |
| 화면 | 1920x1080 이상 |
| 조명 | 자연광 또는 링 라이트 |

### 소프트웨어

| 용도 | 도구 |
|------|------|
| 화면 녹화 | OBS Studio, Loom, CleanShot X |
| 동영상 편집 | DaVinci Resolve, iMovie, Final Cut Pro |
| 오디오 편집 | Audacity (선택) |

### 환경 설정

1. **배경:** 깨끗하고 산만하지 않은 배경
2. **소음:** 조용한 환경, 이어폰 마이크 권장
3. **인터넷:** 안정적인 연결 (Ollama 사용 시)

---

## 비디오 스크립트 (Video Script)

### 오프닝 (0:00 - 0:20)

**화면:** 시스템 아키텍처 다이어그램

**내레이션:**
"안녕하십니까? 홍익대학교 컴퓨터공학과 서민지입니다. 오늘은 OS 스케줄링 알고리즘을 활용한 LLM API 요청 관리 시스템을 데모하겠습니다."

**화면 전환:** 터미널로 이동

---

### 섹션 1: 시스템 시작 (0:20 - 0:40)

**화면:** 터미널

**액션:**
```bash
cd 02-implementation
npm start
```

**내레이션:**
"먼저 시스템을 시작하겠습니다. 서버가 포트 3000에서 실행되고, FCFS 스케줄러가 기본으로 설정되어 있습니다."

**화면:** 헬스 체크 결과

---

### 섹션 2: FCFS 데모 (0:40 - 1:00)

**화면:** 터미널

**액션:**
```bash
# 요청 제출
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is AI?","priority":"NORMAL"}'

# 처리
curl -X POST http://localhost:3000/api/scheduler/process
```

**내레이션:**
"FCFS는 요청이 도착한 순서대로 처리합니다. 기본 스케줄러로서 다른 알고리즘과 비교하는 베이스라인 역할을 합니다."

---

### 섹션 3: Priority 데모 (1:00 - 1:25)

**화면:** 터미널

**액션:**
```bash
# 스케줄러 변경
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -d '{"scheduler":"priority"}'

# LOW 요청
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Explain history","priority":"LOW"}'

# URGENT 요청
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Emergency fix","priority":"URGENT"}'
```

**내레이션:**
"Priority 스케줄러로 변경했습니다. LOW 요청을 먼저 제출하고, URGENT 요청을 제출하겠습니다. 처리해 보니 URGENT 요청이 먼저 처리됩니다."

---

### 섹션 4: MLFQ 데모 (1:25 - 1:55)

**화면:** 터미널

**액션:**
```bash
# 스케줄러 변경
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -d '{"scheduler":"mlfq"}'

# 상태 확인
curl http://localhost:3000/api/scheduler/status
```

**내레이션:**
"MLFQ 스케줄러는 4단계 큐를 사용합니다. 현재 상태를 확인해 보니 Q0에 2개 요청이 있습니다. MLFQ는 시간 슬라이스 500ms 기반 선점형으로 동작합니다."

**화면:** MLFQ 다이어그램 오버레이

---

### 섹션 5: WFQ 데모 (1:55 - 2:25)

**화면:** 터미널

**액션:**
```bash
# 스케줄러 변경
curl -X POST http://localhost:3000/api/scheduler/switch \
  -H "Content-Type: application/json" \
  -d '{"scheduler":"wfq"}'

# 공정성 확인
curl http://localhost:3000/api/fairness
```

**내레이션:**
"WFQ 스케줄러는 테넌트 가중치에 비례하여 자원을 분배합니다. 공정성 지표를 확인해 보니 시스템 JFI가 0.89, 테넌트 JFI가 0.95 이상입니다."

---

### 섹션 6: 통계 확인 (2:25 - 2:40)

**화면:** 터미널 또는 브라우저

**액션:**
```bash
curl http://localhost:3000/api/stats
```

**내레이션:**
"시스템 통계를 확인해 보니, 전체 307개 테스트에 100% 통과했고, 코드 커버리지는 99.76%입니다."

---

### 클로징 (2:40 - 3:00)

**화면:** 요약 슬라이드

**내레이션:**
"데모를 통해 각 스케줄러의 특징을 확인했습니다. FCFS는 순서대로, Priority는 긴급한 요청을, MLFQ는 짧은 요청을, WFQ는 가중치에 비례하여 처리합니다. 감사합니다."

---

## 녹화 팁 (Recording Tips)

### 1. 사전 리허설

- 전체 스크립트를 2-3번 연습
- 명령어 복사하여 준비
- 예상 결과 미리 확인

### 2. 오디오 품질

- 마이크 거리: 10-20cm
- 말하기 속도: 분당 120-140단어
- 명료한 발음, 자연스러운 어조

### 3. 화면 구성

```
┌─────────────────────────────────────────────┐
│                                              │
│          메인 콘텐츠 영역                    │
│         (터미널/브라우저)                    │
│                                              │
└─────────────────────────────────────────────┘
                    키보드 단축키 표시 (선택)
```

### 4. 편집 포인트

- 컷 전환: 부드러운 페이드
- 자막: 주요 명령어와 결과
- 하이라이트: 중요한 수치 강조
- 배경음: 차분한 로파이 음악 (선택)

---

## 편집 체크리스트 (Editing Checklist)

비디오 편집 시 다음 항목을 확인하세요:

| 항목 | 확인 |
|------|------|
| 오프닝/엔딩 자막 | ☐ |
| 명령어 하이라이트 | ☐ |
| 결과값 확대/강조 | ☐ |
| 전환 효과 자연스러움 | ☐ |
| 오디오 레벨 균형 | ☐ |
| 배경음 볼륨 조절 | ☐ |
| 전체 길이 3분 이내 | ☐ |
| 파일 크기 100MB 이하 | ☐ |
| 포맷 MP4 (H.264) | ☐ |

---

## 내보내기 설정 (Export Settings)

### 비디오

| 설정 | 값 |
|------|-----|
| 포맷 | MP4 |
| 코덱 | H.264 |
| 해상도 | 1920x1080 |
| 프레임 레이트 | 30fps |
| 비트레이트 | 5-8 Mbps |

### 오디오

| 설정 | 값 |
|------|-----|
| 코덱 | AAC |
| 샘플 레이트 | 48kHz |
| 비트레이트 | 128-192 kbps |
| 채널 | 스테레오 |

---

## 대안 옵션 (Alternatives)

### 라이브 데모 선호 시

1. **발표 장소에서 실시간 데모**
- 장점: 상호작용 가능, 질문 즉시 답변
- 단점: 기술적 문제 위험

2. **녹화 비디오 + 라이브 Q&A**
- 장점: 안정적인 데모, 유연한 Q&A
- 단점: 사전 녹화 필요

3. **하이브리드 (녹화 + 라이브)**
- 오프닝/클로징: 라이브
- 데모 부분: 녹화 비디오
- 장점: 안정성 + 상호작용

---

**비디오 가이드 작성일:** 2026년 2월 11일
