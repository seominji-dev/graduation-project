# 통계적 검증 계획 (Statistical Validation Plan)

## 개요 (Overview)

본 프로젝트에서 수행하는 모든 실험의 통계적 검증 방법론을 정의합니다. 학부생 수준에서 수행 가능한 검증 방법으로, 탐색적 연구의 한계를 명시하면서도 과학적 엄밀성을 확보합니다.

---

## 1. 실험 설계 (Experimental Design)

### 1.1 독립 변수 및 종속 변수

| 구분 | 변수 | 설명 |
|------|------|------|
| **독립 변수** | 스케줄링 알고리즘 | FCFS, Priority, MLFQ, WFQ |
| **종속 변수** | 대기 시간 (Wait Time) | 요청 제출부터 처리 시작까지의 시간 (ms) |
| **종속 변수** | 처리량 (Throughput) | 단위 시간당 처리 완료된 요청 수 (req/s) |
| **종속 변수** | 공정성 지수 (Fairness Index) | Jain's Fairness Index (0~1) |

### 1.2 통제 변수

| 변수 | 설정 값 | 이유 |
|------|---------|------|
| 하드웨어 | Apple M2, 16GB RAM | 실험 재현성 확보 |
| Node.js 버전 | v22.0.0 LTS | 런타임 환경 통일 |
| 요청 크기 | 동일 프롬프트 | LLM 응답 시간 가변성 최소화 |
| 테넌트 수 | 4개 (Enterprise, Premium, Standard, Free) | WFQ 가중치 비교 |

---

## 2. 표본 크기 및 반복 측정 (Sample Size & Replication)

### 2.1 표본 크기 결정

**기본 실험:**
- 총 요청 수: 100개 (테넌트당 25개)
- 반복 횟수: 3회
- 총 데이터 포인트: 300개

**MLFQ 시간 분할 실험:**
- 총 요청 수: 500개 (Short 33%, Medium 44%, Long 23%)
- 반복 횟수: 3회
- 총 데이터 포인트: 1,500개

**한계점 인지:**
- 소규모 표본(100-500개 요청)은 프로덕션 환경(수천~수만 개)의 대표성이 제한적
- 학부생 프로젝트의 제약(시간, 자원)을 고려한 최소 실험 규모
- 탐색적(Exploratory) 연구로서 경향성 파악에 초점

### 2.2 반복 측정 절차

1. **동일 환경 설정:** 매 반복마다 시스템 재시작, 큐 초기화
2. **난수 시드 고정:** 요청 생성 시 난수 시드 고정으로 재현성 확보
3. **데이터 기록:** 각 실험의 원본 데이터를 JSON 파일로 저장
4. **이상치 검사:** 극단적인 이상치(평균 ± 3표준편차) 제거 여부 결정

---

## 3. 통계적 검정 방법 (Statistical Tests)

### 3.1 기술 통계 (Descriptive Statistics)

각 실험에서 다음 통계량을 계산:

| 통계량 | 수식 | 설명 |
|--------|------|------|
| 평균 (Mean) | Σx / n | 중심 경향성 |
| 표준편차 (SD) | √(Σ(x-μ)² / (n-1)) | 데이터 분산 |
| 표준오차 (SE) | SD / √n | 표본 평균의 불확실성 |
| 95% 신뢰구간 | Mean ± 1.96 × SE | 모평균의 추정 범위 |
| 최소/최대 | Min, Max | 데이터 범위 |
| 중앙값 | Median | 이상치에 강건한 중심 값 |

**해석 예시:**
- FCFS 평균 대기 시간: 5,760ms ± 320ms (95% CI: 5,120ms ~ 6,400ms)
- MLFQ 평균 대기 시간: 3,450ms ± 280ms (95% CI: 2,890ms ~ 4,010ms)
- **결론:** 95% 신뢰 수준에서 MLFQ가 FCFS보다 2,310ms 빠름 (유의미한 차이)

### 3.2 t-검정 (Student's t-test)

**목적:** 두 그룹 간 평균 차이의 통계적 유의성 검정

**가설 설정:**
- 귀무가설 (H0): μ_FCFS = MLFQ (두 알고리즘의 평균 대기 시간은 같다)
- 대립가설 (H1): μ_FCFS ≠ MLFQ (두 알고리즘의 평균 대기 시간은 다르다)

**검정 통계량:**
```
t = (Mean₁ - Mean₂) / √(SD₁²/n₁ + SD₂²/n₂)
```

**자유도 (df):**
```
df = n₁ + n₂ - 2
```

**유의수준:**
- α = 0.05 (95% 신뢰 수준)
- 양측 검정 (Two-tailed test)

**판정 기준:**
- p-value < 0.05: 귀무가설 기각 (유의미한 차이 있음)
- p-value ≥ 0.05: 귀무가설 채택 (유의미한 차이 없음)

**예시 결과:**
- Priority vs FCFS (URGENT 요청): t(58) = 3.42, p < 0.05 **유의미**
- MLFQ vs FCFS (전체 요청): t(58) = 1.23, p = 0.22 **유의미하지 않음**
- WFQ vs FCFS (테넌트별 대기 시간): t(78) = 4.56, p < 0.01 **매우 유의미**

### 3.3 효과 크기 (Effect Size)

**목적:** 두 그룹 간 차이의 "크기"를 정량화 (Cohen's d)

**수식:**
```
d = (Mean₁ - Mean₂) / PooledSD
```

**해석 기준 (Cohen's conventions):**
- |d| < 0.2: 작은 효과 (Small effect)
- 0.2 ≤ |d| < 0.8: 중간 효과 (Medium effect)
- |d| ≥ 0.8: 큰 효과 (Large effect)

**예시:**
- MLFQ vs FCFS (Short 요청): d = 1.85 **매우 큰 효과**
- Priority vs FCFS (URGENT 요청): d = 0.92 **큰 효과**
- WFQ vs FCFS (Free 테넌트): d = 0.45 **중간 효과**

### 3.4 분산 분석 (ANOVA) - 선택적 적용

**목적:** 3개 이상의 그룹 간 평균 차이 검정

**적용 시나리오:**
- 동일 실험 조건에서 4가지 스케줄러 모두 비교
- 사후 검정 (Post-hoc test): Tukey's HSD

**한계점 인지:**
- 학부생 수준에서는 t-검정으로 충분
- ANOVA는 정규성, 등분산성 가정이 까다로움
- 본 연구에서는 FCFS vs 각 알고리즘의 t-검정으로 대체

---

## 4. 데이터 품질 검사 (Data Quality Checks)

### 4.1 정규성 검사 (Normality Test)

**방법:** Shapiro-Wilk 검정 또는 Q-Q 플롯 시각화

**판정:**
- p-value > 0.05: 정규분포 가정 만족
- p-value ≤ 0.05: 비모수 검정 (Mann-Whitney U 검정) 고려

**현실적 타협:**
- 대부분의 대기 시간 데이터는 지수분포(비대칭)를 따름
- 표본 크기가 충분하면(n ≥ 30) 중심극한정리로 t-검정 사용 가능
- 본 연구에서는 t-검정 사용하되 한계점을 명시

### 4.2 이상치 탐지 (Outlier Detection)

**방법 1: IQR (Interquartile Range) 방법**
- Q1 - 1.5 × IQR 미만 또는 Q3 + 1.5 × IQR 초과 → 이상치

**방법 2: Z-score 방법**
- |Z-score| > 3 → 이상치

**처리 방침:**
- 이상치 제거 전후 결과 모두 보고
- 제거 사유(측정 오류, 시스템 오류) 문서화

---

## 5. 재현성 확보 (Reproducibility)

### 5.1 난수 시드 고정

```javascript
// 예: 실험 스크립트에서 난수 시드 고정
const seed = 12345; // 모든 실험에서 동일한 시드 사용
const random = seededRandom(seed);
```

### 5.2 환경 기록

| 항목 | 값 |
|------|-----|
| OS | macOS 14.5 Sonoma |
| CPU | Apple M2 (8코어) |
| RAM | 16GB |
| Node.js | v22.0.0 LTS |
| 테스트 날짜 | 2026-02-08 |
| 테스트 시간 | 14:30-15:45 KST |

### 5.3 데이터 공개

- 모든 원본 데이터: `experiments-simple/comprehensive-results.json`
- 실험 스크립트: `experiments-simple/run-comprehensive-experiments.js`
- 테스트 코드: `tests-simple/`

---

## 6. 결과 보고 체크리스트 (Reporting Checklist)

### 6.1 필수 보고 항목

- [ ] 평균 ± 표준편차 (Mean ± SD)
- [ ] 95% 신뢰구간 (95% Confidence Interval)
- [ ] t-값, 자유도, p-value (t(df), p)
- [ ] 효과 크기 (Cohen's d)
- [ ] 표본 크기 (n)
- [ ] 실험 조건 (하드웨어, 소프트웨어 버전)

### 6.2 선택적 보고 항목

- [ ] 정규성 검사 결과 (Shapiro-Wilk p-value)
- [ ] 등분산성 검사 (Levene's Test)
- [ ] 그래프 (Box plot, Violin plot, Confidence Interval plot)

---

## 7. 한계점 및 제약 사항 (Limitations)

### 7.1 통계적 검정력의 한계

- **표본 크기:** 100-500개 요청은 프로덕션 환경의 대표성이 제한적
- **반복 횟수:** 3회 반복은 강력한 통계적 결론 도출에 부족
- **결과 해석:** 본 연구는 탐색적(Exploratory) 성격, 경향성 파악에 초점

### 7.2 실험 환경의 단순화

- **단일 서버:** 분산 환경, 로드 밸런싱 미고려
- **합성 데이터:** 실제 LLM 요청 패턴과 차이 가능
- **로컬 LLM:** Ollama Llama 3.2(8B)은 GPT-4와 응답 시간 차이

### 7.3 통계적 가정의 위반

- **정규분포 가정:** 대기 시간은 지수분포(비대칭)를 따름
- **독립성 가정:** 연속 요청 간 상관관계 존재 가능
- **대응 조치:** 중심극한정리(CLT) 적용, 한계점 명시

---

## 8. 참고 문헌 (References)

1. Cohen, J. (1988). *Statistical Power Analysis for the Behavioral Sciences* (2nd ed.). Routledge.
2. Field, A. (2013). *Discovering Statistics Using IBM SPSS Statistics* (4th ed.). SAGE Publications.
3. Kim, T. Y. (2019). *통계적 방법과 연구 설계* (제3판). 학지사.
4. Student's t-test: https://en.wikipedia.org/wiki/Student%27s_t-test
5. Cohen's d: https://en.wikipedia.org/wiki/Effect_size#Cohen%27s_d

---

**작성일:** 2026년 2월 9일
**버전:** 1.0
**작성자:** 서민지 (C235180)
