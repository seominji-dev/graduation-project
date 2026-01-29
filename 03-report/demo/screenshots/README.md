# 데모 스크린샷 캡처 가이드

이 폴더는 졸업프로젝트 발표 및 시연을 위한 스크린샷 이미지를 저장하는 곳입니다.

## 필요한 스크린샷 목록

### 1. 시스템 초기화 (init-01.png)
- **내용**: 터미널에서 `npm run dev` 실행 후 시스템 시작 로그
- **보여줄 요소**:
  - Redis 연결 성공 메시지
  - MongoDB 연결 성공 메시지
  - 서버 시작 메시지 (포트 3000)
  - 스케줄러 초기화 완료 메시지

### 2. 대시보드 초기 화면 (dashboard-01.png)
- **내용**: 브라우저에서 http://localhost:3000 접속 후 빈 대시보드
- **보여줄 요소**:
  - 4개의 스케줄러 선택 탭 (FCFS, Priority, MLFQ, WFQ)
  - 초기 통계 (0 requests, 0 completed)
  - 요청 제출 폼

### 3. FCFS 스케줄러 테스트 (fcfs-01.png)
- **내용**: FCFS 모드에서 3개의 요청 순차적으로 제출
- **보여줄 요소**:
  - 요청 #1: "What is machine learning?" (NORMAL priority)
  - 요청 #2: "Explain neural networks" (NORMAL priority)
  - 요청 #3: "Define deep learning" (NORMAL priority)
  - 큐에 3개가 대기 중인 상태

### 4. FCFS 처리 완료 (fcfs-02.png)
- **내용**: 3개의 요청이 모두 처리된 상태
- **보여줄 요소**:
  - Completed Requests: 3
  - 각 요청의 응답 내용
  - 총 처리 시간

### 5. Priority 스케줄러 테스트 (priority-01.png)
- **내용**: Priority 모드에서 다양한 우선순위 요청 제출
- **보여줄 요소**:
  - 요청 #1: "Low priority task" (LOW priority)
  - 요청 #2: "Normal priority task" (NORMAL priority)
  - 요청 #3: "High priority task" (HIGH priority)
  - 요청 #4: "Urgent task!" (URGENT priority)
  - 큐에서 우선순위 순서대로 처리되는 것

### 6. Priority 처리 순서 (priority-02.png)
- **내용**: URGENT 요청이 먼저 처리되는 것을 확인
- **보여줄 요소**:
  - URGENT 요청이 처리 중인 상태
  - 다른 요청들이 대기 중인 상태
  - 대기열에서 우선순위 순서 표시

### 7. MLFQ 스케줄러 초기화 (mlfq-01.png)
- **내용**: MLFQ 모드로 전환 후 4개 큐 표시
- **보여줄 요소**:
  - Q0 (Priority: 1, Quantum: 1s)
  - Q1 (Priority: 2, Quantum: 3s)
  - Q2 (Priority: 3, Quantum: 8s)
  - Q3 (Priority: 4, Quantum: ∞)
  - 각 큐의 현재 작업 수

### 8. MLFQ 큐 강등 (mlfq-02.png)
- **내용**: 작업이 Q0에서 Q1로 강등되는 과정
- **보여줄 요소**:
  - 타임 슬라이스 초과 로그
  - 작업이 Q1로 이동한 것 표시
  - 현재 큐 레벨 표시

### 9. MLFQ Boost 동작 (mlfq-03.png)
- **내용**: 60초 후 Boost가 발동하여 모든 작업이 Q0로 이동
- **보여줄 요소**:
  - Boost 실행 로그
  - 모든 작업이 Q0에 있는 상태
  - Boost 카운터

### 10. WFQ 스케줄러 초기화 (wfq-01.png)
- **내용**: WFQ 모드로 전환 후 테넌트 설정
- **보여줄 요소**:
  - 4개 테넌트 (Enterprise, Premium, Standard, Free)
  - 각 테넌트의 가중치 (100, 50, 10, 1)
  - Virtual Time 표시

### 11. WFQ 다중 테넌트 요청 (wfq-02.png)
- **내용**: 4개 테넌트에서 동시에 요청 제출
- **보여줄 요소**:
  - Enterprise 테넌트: 10개 요청
  - Premium 테넌트: 5개 요청
  - Standard 테넌트: 3개 요청
  - Free 테넌트: 1개 요청
  - 가중치별 처리량 차이

### 12. WFQ Fairness Index (wfq-03.png)
- **내용**: Jain's Fairness Index 실시간 표시
- **보여줄 요소**:
  - 전체 Fairness Index: 0.89
  - 개별 테넌트 Fairness Index (0.92-0.98)
  - 공정성 그래프

### 13. 대시보드 통계 (stats-01.png)
- **내용**: 모든 테스트 완료 후 통계 요약
- **보여줄 요소**:
  - 총 요청 수
  - 완료된 요청 수
  - 평균 대기 시간
  - 평균 처리 시간
  - 스케줄러별 성능 비교

### 14. API 요청 예시 (api-01.png)
- **내용**: Postman 또는 curl로 API 요청
- **보여줄 요소**:
  ```bash
  curl -X POST http://localhost:3000/api/requests \
    -H "Content-Type: application/json" \
    -d '{
      "prompt": "What is TypeScript?",
      "provider": {"name": "ollama", "model": "llama2"},
      "priority": 2
    }'
  ```
- **응답**: 202 Accepted with requestId

### 15. API 응답 확인 (api-02.png)
- **내용**: GET /api/requests/:id로 상태 확인
- **보여줄 요소**:
  - 요청 상태 변화 (QUEUED -> PROCESSING -> COMPLETED)
  - 최종 응답 내용
  - 처리 시간 정보

## 스크린샷 캡처 방법

### macOS
```bash
# 전체 화면 캡처
Command + Shift + 3

# 특정 영역 캡처
Command + Shift + 4

# 터미널에서 캡처 (screencapture 사용)
screencapture -x screenshot.png
```

### 권장 설정
- **해상도**: 1920x1080 (Full HD) 이상
- **포맷**: PNG (손실 압축 없음)
- **파일명**: 위 목록의 파일명 사용
- **크기**: 가로 1200-1400px로 리사이징 권장

## 편집 가이드

### 필요한 편집 작업
1. **개인 정보 제거**: 이메일, API key 등
2. **민감 정보 가리기**: IP 주소, 포트 번호 (필요시)
3. **화살표/박스 추가**: 주요 부분 하이라이트
4. **텍스트 추가**: 설명 레이블

### 추천 편집 도구
- **macOS**: Preview, Skitch
- **온라인**: Canva, Figma
- **명령줄**: ImageMagick

```bash
# ImageMagick으로 리사이징
convert screenshot.png -resize 1280x720 resized-screenshot.png

# 화살표 추가 (예시)
convert screenshot.png -draw "line 100,100 200,200" output.png
```

## 발표용 슬라이드 활용

### PowerPoint/Keynote로 가져오기
1. 스크린샷을 드래그 앤 드롭
2. 크기를 슬라이드에 맞게 조정
3. 그림자/테두리 효과 추가 (선택사항)
4. 캡션/설명 텍스트 추가

### 발표 시 스크린샷 활용 팁
- **FCFS**: 슬라이드 15 (구현 상세)
- **Priority**: 슬라이드 15 (구현 상세)
- **MLFQ**: 슬라이드 16 (구현 상세), 슬라이드 8 (상세 설명)
- **WFQ**: 슬라이드 17 (구현 상세), 슬라이드 9 (공정성)
- **통계**: 슬라이드 19 (성능 비교), 슬라이드 20 (공정성 분석)

## 백업 전략

```bash
# 원본 스크린샷 백업
cp screenshot.png backup/screenshot-original.png

# 여러 버전 관리
screenshot-v1.png (원본)
screenshot-v2.png (편집본)
screenshot-final.png (최종본)
```

## 체크리스트

### 발표 전 확인
- [ ] 모든 15개 스크린샷 캡처 완료
- [ ] 파일명 일치 확인
- [ ] 해상도 적절성 확인 (1280x720 이상)
- [ ] 개인 정보 제거 완료
- [ ] 필요한 주석/화살표 추가 완료
- [ ] 백업 파일 생성 완료
- [ ] 발표 슬라이드에 삽입 테스트 완료

### 발표 당일
- [ ] 스크린샷 폴더 접근성 확인
- [ ] 인터넷 연결 상태 확인
- [ ] 예비 스크린샷 (문제 발생 시)
- [ ] 라이브 데모와 스크린샷 병행 전략 수립

---

**마지막 업데이트**: 2026-01-29
**담당자**: 서민지 (C235180)
