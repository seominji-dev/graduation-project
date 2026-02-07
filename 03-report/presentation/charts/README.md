# 발표 자료 시각화 차트

생성된 시각화 자료 목록과 사용법 안내입니다.

## 📊 차트 데이터 파일

### 성능 비교
- **파일**: `data/performance_comparison.json`, `data/performance_comparison.csv`
- **내용**: 4가지 알고리즘(FCFS, Priority, MLFQ, WFQ)의 성능 비교
- **필드**: scheduler, avgWaitTime, maxWaitTime, minWaitTime, throughput, totalTime

### 공정성 지표
- **파일**: `data/jains_fairness_index.json`
- **내용**: 테넌트 등급별 Jain's Fairness Index 측정 결과
- **필드**: individual_tenants[], system_level.*

### 테넌트 처리량 분포
- **파일**: `data/tenant_throughput_distribution.json`, `data/tenant_throughput_distribution.csv`
- **내용**: WFQ 가중치 기반 테넌트별 처리량 분포
- **필드**: tier, weight, expected_ratio, throughput, jfi_contribution

### 대기 시간 비교
- **파일**: `data/wait_time_comparison.json`, `data/wait_time_comparison.csv`
- **내용**: FCFS vs WFQ 테넌트별 대기 시간 비교
- **필드**: tier, fcfs_wait_time, wfq_wait_time, improvement_pct

### 기아 방지 검증
- **파일**: `data/starvation_prevention.json`, `data/starvation_prevention.csv`
- **내용**: 알고리즘별 기아 방지 효과 검증
- **필드**: algorithm, free_served, max_wait_time, starvation

### 혼합 워크로드 분석
- **파일**: `data/mixed_workload_analysis.json`, `data/mixed_workload_analysis.csv`
- **내용**: Short/Medium/Long 카테고리별 대기 시간 분석
- **필드**: category, count, fcfs_avg_wait, mlfq_avg_wait, fcfs_avg_processing, mlfq_avg_processing

## 🎨 Mermaid 다이어그램

### 01. 성능 비교 레이더 차트
- **파일**: `mermaid/01-performance-comparison.mmd`
- **유형**: XY Chart
- **내용**: 알고리즘별 성능 점수 비교 (대기시간, 처리량, 공정성)

### 02. Jain's Fairness Index 막대 그래프
- **파일**: `mermaid/02-jains-fairness-index.mmd`
- **유형**: XY Chart
- **내용**: 테넌트 등급별 Jain's Fairness Index와 목표치 비교

### 03. 대기 시간 비교 막대 그래프
- **파일**: `mermaid/03-wait-time-comparison.mmd`
- **유형**: XY Chart
- **내용**: FCFS vs WFQ 테넌트별 대기 시간 비교

### 04. 처리량 분포 파이 차트
- **파일**: `mermaid/04-throughput-distribution.mmd`
- **유형**: Pie Chart
- **내용**: WFQ 테넌트별 처리량 분포 비율

### 05. 기아 방지 흐름도
- **파일**: `mermaid/05-starvation-prevention.mmd`
- **유형**: Flowchart
- **내용**: FCFS, Priority+Ageing, MLFQ+Boosting, WFQ의 기아 방지 메커니즘

### 06. 시스템 아키텍처 다이어그램
- **파일**: `mermaid/06-system-architecture.mmd`
- **유형**: Flowchart
- **내용**: 3계층 시스템 구조 (요청 수신, 스케줄러 엔진, 저장소)

### 07. 알고리즘 비교 테이블
- **파일**: `mermaid/07-algorithm-comparison.mmd`
- **유형**: Graph
- **내용**: 4가지 알고리즘의 특성 비교 (공정성, 기아방지, 테넌트 지원)

### 08. GPS 수식 설명
- **파일**: `mermaid/08-gps-formula.mmd`
- **유형**: Flowchart
- **내용**: GPS 수식과 예시 계산

### 09. WFQ 동작 흐름도
- **파일**: `mermaid/09-wfq-workflow.mmd`
- **유형**: Flowchart
- **내용**: WFQ 요청 처리 단계별 프로세스

## 🛠️ 사용 방법

### Python으로 차트 재생성
```bash
cd 03-report/presentation/charts
python3 generate_charts.py
python3 generate_mermaid_charts.py
```

### Mermaid Live Editor 사용
1. https://mermaid.live 접속
2. `mermaid/` 폴더의 .mmd 파일 내용 복사
3. 에디터에 붙여넣어 미리보기
4. PNG/SVG로 다운로드

### 슬라이드에 차트 삽입
**Markdown/Reveal.js**:
```markdown
![성능 비교](charts/data/performance_comparison.json)
```

**HTML/Chart.js**:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<canvas id="performanceChart"></canvas>
<script>
  fetch('charts/data/performance_comparison.json')
    .then(r => r.json())
    .then(data => new Chart(ctx, { type: 'bar', data }));
</script>
```

## 📁 파일 구조
```
charts/
├── generate_charts.py          # 차트 데이터 생성 스크립트
├── generate_mermaid_charts.py  # Mermaid 다이어그램 생성 스크립트
├── README.md                   # 이 파일
├── data/                       # JSON/CSV 데이터 파일
│   ├── performance_comparison.json
│   ├── jains_fairness_index.json
│   ├── tenant_throughput_distribution.json
│   ├── wait_time_comparison.json
│   ├── starvation_prevention.json
│   └── mixed_workload_analysis.json
└── mermaid/                    # Mermaid 다이어그램 파일
    ├── 01-performance-comparison.mmd
    ├── 02-jains-fairness-index.mmd
    ├── 03-wait-time-comparison.mmd
    ├── 04-throughput-distribution.mmd
    ├── 05-starvation-prevention.mmd
    ├── 06-system-architecture.mmd
    ├── 07-algorithm-comparison.mmd
    ├── 08-gps-formula.mmd
    └── 09-wfq-workflow.mmd
```

## 📝 데이터 출처

- **실험 데이터**: `../../02-implementation/experiments-simple/comprehensive-results.json`
- **발표 슬라이드**: `../slides-outline.md`
- **발표 대본**: `../presentation-script.md`

## 🔄 업데이트 내역

- **2026-02-07**: 초기 차트 데이터 및 Mermaid 다이어그램 생성
- **2026-02-07**: 발표 슬라이드/대본 시각화 참조 추가
