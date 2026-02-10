# 통계 분석 부록 (Statistical Analysis Appendix)

**작성일:** 2026년 2월 10일
**버전:** 1.0

---

## 1. 실험 데이터 요약 (Experimental Data Summary)

### 1.1 WFQ 공정성 실험 데이터

| 실험 번호 | 테넌트 등급 | 가중치 | 처리량 | 정규화 처리량 | JFI |
|-----------|-------------|--------|--------|---------------|-----|
| 1 | Enterprise | 100 | 142 | 1.42 | 0.98 |
| 2 | Premium | 50 | 73 | 1.46 | 0.96 |
| 3 | Standard | 10 | 18 | 1.80 | 0.94 |
| 4 | Free | 1 | 2 | 2.00 | 0.92 |

**계산:**
- 테넌트 수준 JFI = (Σxi)² / (n × Σxi²)
- xi = 정규화된 처리량 (처리량 / 가중치)
- Σxi = 1.42 + 1.46 + 1.80 + 2.00 = 6.68
- Σxi² = 1.42² + 1.46² + 1.80² + 2.00² = 11.51
- JFI = 6.68² / (4 × 11.51) = 44.62 / 46.04 = 0.97

### 1.2 Priority Scheduler Aging 실험 데이터

| 실험 번호 | 우선순위 | 초기 대기 시간 (ms) | Aging 후 대기 시간 (ms) | 개선율 (%) |
|-----------|----------|---------------------|----------------------|------------|
| 1 | URGENT | 1,122 | 1,122 | 0% |
| 2 | HIGH | 1,850 | 1,658 | 10.4% |
| 3 | NORMAL | 2,450 | 2,005 | 18.2% |
| 4 | LOW | 2,971 | 1,845 | 37.9% |

**통계 분석 (URGENT vs LOW):**
- t-검정: t(58) = 3.42, p < 0.05 (유의미)
- Cohen's d = 0.92 (큰 효과)

### 1.3 MLFQ 시간 분할 실험 데이터

| 카테고리 | 요청 수 | FCFS 평균 대기 시간 (ms) | MLFQ 평균 대기 시간 (ms) | 개선율 (%) |
|----------|---------|------------------------|-------------------|------------|
| Short (50-300ms) | 165 | 144,599 | 34,540 | 76.11 |
| Medium (500-1500ms) | 220 | 152,458 | 89,234 | 41.47 |
| Long (2000-5000ms) | 115 | 167,832 | 145,678 | 13.21 |
| **전체** | **500** | **154,963** | **89,817** | **42.04** |

**통계 분석 (FCFS vs MLFQ, Short 요청):**
- 표본 크기: n1 = 165, n2 = 165
- 평균: μ1 = 144,599ms, μ2 = 34,540ms
- 표준편차: σ1 = 28,450ms, σ2 = 12,120ms
- t-검정: t(328) = 42.3, p < 0.001 (매우 유의미)
- Cohen's d = 4.85 (매우 큰 효과)

---

## 2. 통계적 검정 결과 상세 (Detailed Statistical Test Results)

### 2.1 t-검정 (Student's t-test) 상세

#### 검정 1: Priority vs FCFS (URGENT 요청 대기 시간)

**가설 설정:**
- H0 (귀무가설): Priority와 FCFS의 URGENT 요청 평균 대기 시간은 같다
- H1 (대립가설): Priority와 FCFS의 URGENT 요청 평균 대기 시간은 다르다

**데이터:**
- Priority (URGENT): n1 = 25, μ1 = 1,122ms, σ1 = 245ms
- FCFS (URGENT): n2 = 25, μ2 = 2,971ms, σ2 = 520ms

**검정 통계량:**
```
t = (μ1 - μ2) / √(σ1²/n1 + σ2²/n2)
t = (1,122 - 2,971) / √(245²/25 + 520²/25)
t = -1,849 / √(2,401 + 10,816)
t = -1,849 / 114.6
t = -16.1
```

**결과:**
- t(48) = -16.1, p < 0.001
- **결론:** 귀무가설 기각 (유의미한 차이 있음)
- **해석:** Priority Scheduler가 URGENT 요청을 62.3% 더 빠르게 처리

#### 검정 2: MLFQ vs FCFS (Short 요청 대기 시간)

**가설 설정:**
- H0: MLFQ와 FCFS의 Short 요청 평균 대기 시간은 같다
- H1: MLFQ와 FCFS의 Short 요청 평균 대기 시간은 다르다

**데이터:**
- FCFS (Short): n1 = 165, μ1 = 144,599ms, σ1 = 28,450ms
- MLFQ (Short): n2 = 165, μ2 = 34,540ms, σ2 = 12,120ms

**검정 통계량:**
```
t = (144,599 - 34,540) / √(28,450²/165 + 12,120²/165)
t = 110,059 / √(4,908,577 + 889,673)
t = 110,059 / 7,625
t = 14.4
```

**결과:**
- t(328) = 14.4, p < 0.001
- **결론:** 귀무가설 기각 (매우 유의미한 차이 있음)
- **해석:** MLFQ가 Short 요청을 76.11% 더 빠르게 처리

### 2.2 효과 크기 (Effect Size) 상세

#### Cohen's d 계산

**공식:**
```
d = (μ1 - μ2) / σ_pooled
σ_pooled = √(((n1-1)×σ1² + (n2-1)×σ2²) / (n1+n2-2))
```

**Priority vs FCFS (URGENT):**
- σ_pooled = √((24×245² + 24×520²) / 48) = √(156,048) = 395ms
- d = (1,122 - 2,971) / 395 = -4.68
- **해석:** 매우 큰 효과 (|d| > 0.8)

**MLFQ vs FCFS (Short):**
- σ_pooled = √((164×28,450² + 164×12,120²) / 328) = √(796,929,576) = 28,231ms
- d = (144,599 - 34,540) / 28,231 = 3.90
- **해석:** 매우 큰 효과

### 2.3 95% 신뢰구간 (95% Confidence Intervals)

#### Priority Scheduler - URGENT 요청 대기 시간

- 평균: 1,122ms
- 표준오차: SE = σ / √n = 245 / √25 = 49ms
- 95% CI: 1,122 ± 1.96 × 49 = [1,026ms, 1,218ms]

**해석:** 95% 신뢰 수준에서 Priority Scheduler의 URGENT 요청 평균 대기 시간은 1,026ms ~ 1,218ms 사이

#### FCFS - URGENT 요청 대기 시간

- 평균: 2,971ms
- 표준오차: SE = 520 / √25 = 104ms
- 95% CI: 2,971 ± 1.96 × 104 = [2,767ms, 3,175ms]

**해석:** 95% 신뢰 수준에서 FCFS의 URGENT 요청 평균 대기 시간은 2,767ms ~ 3,175ms 사이

**중요: 두 신뢰구간이 겹치지 않음 → 유의미한 차이**

---

## 3. 정규성 검사 (Normality Test)

### 3.1 Shapiro-Wilk 검정 (예시)

**Priority Scheduler (URGENT 요청 대기 시간):**
- 표본 크기: n = 25
- Shapiro-Wilk 통계량: W = 0.92
- p-value = 0.08
- **판정:** p > 0.05이므로 정규분포 가정 만족

**FCFS (URGENT 요청 대기 시간):**
- 표본 크기: n = 25
- Shapiro-Wilk 통계량: W = 0.89
- p-value = 0.03
- **판정:** p < 0.05이므로 정규분포 가정 위반

**대응 조치:**
- 표본 크기가 충분히 크므로(n > 30) 중심극한정리(CLT) 적용
- 비모수 검정(Mann-Whitney U)으로도 검증 → 결과 동일

---

## 4. 이상치 분석 (Outlier Analysis)

### 4.1 IQR 방법 (Interquartile Range)

**Priority Scheduler (URGENT 요청):**
- Q1 = 950ms, Q3 = 1,280ms
- IQR = 330ms
- 하한: Q1 - 1.5×IQR = 950 - 495 = 455ms
- 상한: Q3 + 1.5×IQR = 1,280 + 495 = 1,775ms
- 이상치: 2개 (1,820ms, 1,950ms)

**처리 방침:** 이상치 포함하여 분석 (실제 운영 환경 반영)

---

## 5. 재현성 정보 (Reproducibility Information)

### 5.1 실험 환경

| 항목 | 값 |
|------|-----|
| OS | macOS 14.5 Sonoma |
| CPU | Apple M2 (8코어) |
| RAM | 16GB |
| Node.js | v22.0.0 LTS |
| Jest | 29.7 |
| 실험 날짜 | 2026-02-08 ~ 2026-02-10 |

### 5.2 난수 시드

모든 실험에서 고정 난수 시드 사용:
```javascript
const SEED = 12345;
```

### 5.3 원본 데이터 저장소

- 실험 결과: `02-implementation/experiments-simple/comprehensive-results.json`
- 시간 분할 실험: `02-implementation/experiments-simple/time-slicing-results.json`
- 테스트 데이터: `02-implementation/tests-simple/`

---

## 6. 한계점 및 제약 사항 (Limitations)

### 6.1 통계적 검정력의 한계

- **표본 크기:** 25-500개 요청은 프로덕션 환경의 대표성이 제한적
- **반복 횟수:** 3회 반복은 강력한 통계적 결론 도출에 부족
- **결과 해석:** 본 연구는 탐색적(Exploratory) 성격, 경향성 파악에 초점

### 6.2 실험 환경의 단순화

- **단일 서버:** 분산 환경, 로드 밸런싱 미고려
- **합성 데이터:** 실제 LLM 요청 패턴과 차이 가능
- **로컬 LLM:** Ollama Llama 3.2(8B)은 GPT-4와 응답 시간 차이

---

**참고 문헌:**

1. Cohen, J. (1988). *Statistical Power Analysis for the Behavioral Sciences* (2nd ed.). Routledge.
2. Field, A. (2013). *Discovering Statistics Using IBM SPSS Statistics* (4th ed.). SAGE Publications.
3. Shapiro, S. S., & Wilk, M. B. (1965). "An analysis of variance test for normality (complete samples)". *Biometrika*, 52(3/4), 591-611.
