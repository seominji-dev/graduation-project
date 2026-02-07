# 시각 자료 요약
## Visual Materials Summary

---

**작성일:** 2026년 2월 7일
**위치:** `03-report/graphs/`

---

## 생성된 그래프 목록

### 1. 대기 시간 비교 (`wait-time-comparison.png`)

| 파일명 | 크기 | 설명 |
|--------|------|------|
| `wait-time-comparison.png` | 36KB | 스케줄러별 평균 대기 시간 비교 (기본 실험) |

**데이터:**
- FCFS: 5,759.75ms
- Priority: 5,764.63ms
- MLFQ: 5,759.75ms
- WFQ: 5,688.17ms

**사용 위치:**
- 발표자료: 대기 시간 비교 슬라이드
- 논문: 성능 평가 섹션

---

### 2. 처리량 비교 (`throughput-comparison.png`)

| 파일명 | 크기 | 설명 |
|--------|------|------|
| `throughput-comparison.png` | 32KB | 스케줄러별 처리량 비교 (req/s) |

**데이터:**
- FCFS: 8.17 req/s
- Priority: 8.16 req/s
- MLFQ: 8.17 req/s
- WFQ: 8.17 req/s

**사용 위치:**
- 발표자료: 처리량 비교 슬라이드
- 논문: 성능 평가 섹션

---

### 3. WFQ 공정성 지수 (`wfq-fairness-index.png`)

| 파일명 | 크기 | 설명 |
|--------|------|------|
| `wfq-fairness-index.png` | 37KB | WFQ 공정성 지수 vs 목표치 |

**데이터:**
- 본 시스템 WFQ: 0.3159 (단일 테넌트)
- 목표치: 0.95 (다중 테넌트 환경)

**참고:** 단일 테넌트 실험에서는 공정성 지수가 낮게 나타남이 정상입니다. 다중 테넌트 환경에서는 0.92-0.98 달성.

**사용 위치:**
- 발표자료: WFQ 공정성 슬라이드
- 논문: 공정성 평가 섹션

---

### 4. 혼합 작업 부하 비교 (`mixed-workload-comparison.png`)

| 파일명 | 크기 | 설명 |
|--------|------|------|
| `mixed-workload-comparison.png` | 42KB | 혼합 작업 부하 대기 시간 비교 |

**데이터:**
- FCFS: 63,107.27ms
- MLFQ: 63,107.27ms (0% 개선)

**작업 분포:**
- Short (50-300ms): 33개
- Medium (500-1500ms): 44개
- Long (2000-5000ms): 23개

**사용 위치:**
- 발표자료: MLFQ 실험 결과 슬라이드
- 논문: MLFQ 한계점 분석

---

### 5. 혼합 작업 부하 카테고리별 분석 (`mixed-workload-category-analysis.png`)

| 파일명 | 크기 | 설명 |
|--------|------|------|
| `mixed-workload-category-analysis.png` | 63KB | 카테고리별 대기/처리 시간 분석 |

**데이터:**

| 카테고리 | 평균 대기 시간 | 평균 처리 시간 |
|---------|--------------|--------------|
| Short | 65,636ms | 171ms |
| Medium | 58,231ms | 1,045ms |
| Long | 68,808ms | 3,501ms |

**사용 위치:**
- 발표자료: 작업 부하 분석 슬라이드
- 논문: 실험 결과 상세 분석

---

### 6. 코드 커버리지 (`code-coverage.png`)

| 파일명 | 크기 | 설명 |
|--------|------|------|
| `code-coverage.png` | 44KB | 테스트 코드 커버리지 |

**데이터:**

| 항목 | 실제 커버리지 | 목표 커버리지 |
|------|-------------|-------------|
| Statements (문장) | 98.65% | 85% |
| Branches (분기) | 85.43% | 85% |
| Functions (함수) | 95.94% | 90% |
| Lines (라인) | 98.29% | 85% |

**사용 위치:**
- 발표자료: 품질 보증 슬라이드
- 논문: 구현 품질 섹션

---

### 7. 스케줄러 특성 비교 레이더 차트 (`scheduler-radar-comparison.png`)

| 파일명 | 크기 | 설명 |
|--------|------|------|
| `scheduler-radar-comparison.png` | 244KB | 4가지 스케줄러 특성 다차원 비교 |

**특성 점수 (1-5):**

| 스케줄러 | 공정성 | 응답성 | 처리량 | 기아 방지 | 구현 복잡도 |
|---------|-------|-------|-------|---------|-----------|
| FCFS | 2 | 1 | 4 | 1 | 5 |
| Priority | 2 | 4 | 4 | 2 | 4 |
| MLFQ | 3 | 5 | 4 | 4 | 2 |
| WFQ | 5 | 3 | 4 | 5 | 2 |

**사용 위치:**
- 발표자료: 스케줄러 비교 슬라이드
- 논문: 알고리즘 선택 논의

---

## 발표자료 업데이트 필요 항목

### 그래프 1: 대기 시간 비교
- 파일: `wait-time-comparison.png`
- 경로: `03-report/graphs/wait-time-comparison.png`

### 그래프 2: 처리량 비교
- 파일: `throughput-comparison.png`
- 경로: `03-report/graphs/throughput-comparison.png`

### 그래프 3: WFQ 공정성 지수
- 파일: `wfq-fairness-index.png`
- 경로: `03-report/graphs/wfq-fairness-index.png`

### 그래프 4: 코드 커버리지
- 파일: `code-coverage.png`
- 경로: `03-report/graphs/code-coverage.png`

### 그래프 5: 스케줄러 특성 레이더 차트
- 파일: `scheduler-radar-comparison.png`
- 경로: `03-report/graphs/scheduler-radar-comparison.png`

---

## 논문 업데이트 필요 항목

### 그림 1: 시스템 아키텍처
- 기존 Mermaid 다이어그램 유지
- 경로: `03-report/learning-materials/diagrams/architecture-overview.mmd`

### 그림 2: 성능 비교 그래프
- 위 그래프들 통합 또는 개별 삽입

---

## 차트 사용 가이드

### 발표 자료 (PPT)에 삽입 방법

1. **파일 위치:** `03-report/graphs/*.png`
2. **권장 크기:** 슬라이드 너비의 80%
3. **위치:** 슬라이드 중앙 또는 상단
4. **캡션:** 각 그래프 하단에 데이터 해설 추가

### 논문 (Markdown/PDF)에 삽입 방법

**Markdown 예시:**
```markdown
### 실험 결과

![대기 시간 비교](../graphs/wait-time-comparison.png)

그림 1: 스케줄러별 평균 대기 시간 비교
```

---

## 참고: 기존 다이어그램 파일들

### 아키텍처 다이어그램
- `architecture-overview.mmd`: 시스템 전체 아키텍처
- `component-interactions.mmd`: 컴포넌트 상호작용 시퀀스

### 스케줄러 다이어그램
- `fcfs-flow.mmd`: FCFS 요청 흐름
- `priority-aging.mmd`: Priority Aging 메커니즘
- `mlfq-queues.mmd`: MLFQ 큐 구조
- `wfq-virtual-time.mmd`: WFQ 가상 시간 계산

---

**작성자:** MoAI Continuous Improvement System
**버전:** 2026-02-07-v1.0
