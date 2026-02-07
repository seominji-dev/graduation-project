#!/usr/bin/env python3
"""
Mermaid 다이어그램 생성 스크립트
발표 슬라이드용 시각화 자료 생성
"""

import os
from pathlib import Path

def generate_performance_comparison_radar():
    """알고리즘별 성능 비교 레이더 차트 (Mermaid XY Chart)"""
    return """%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#ffcc00', 'primaryTextColor': '#ffcc00'}}}%%
xychart-beta
    title "알고리즘별 성능 비교 (정규화 점수)"
    x-axis ["FCFS", "Priority", "MLFQ", "WFQ"]
    y-axis "성능 점수 (0-100)" 0 --> 100
    line "대기시간 역전" [50, 65, 70, 68]
    line "처리량" [82, 82, 76, 82]
    line "공정성" [30, 35, 75, 95]
"""

def generate_jains_fairness_bar():
    """Jain's Fairness Index 막대 그래프"""
    return """%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#4caf50'}}}%%
xychart-beta
    title "테넌트 등급별 Jain's Fairness Index"
    x-axis ["Enterprise", "Premium", "Standard", "Free"]
    y-axis "Jain's Fairness Index" 0.85 --> 1.0
    bar [0.98, 0.96, 0.94, 0.92]
    line "목표" [0.90, 0.90, 0.90, 0.90]
"""

def generate_wait_time_comparison():
    """FCFS vs WFQ 대기 시간 비교 막대 그래프"""
    return """%%{init: {'theme': 'base'}}%%
xychart-beta
    title "테넌트별 대기 시간 비교 (FCFS vs WFQ)"
    x-axis ["Enterprise", "Premium", "Standard", "Free"]
    y-axis "대기 시간 (ms)" 0 --> 2000
    bar "FCFS" [48.3, 892.5, 1245.8, 1892.3]
    bar "WFQ" [52.1, 104.2, 156.3, 523.0]
"""

def generate_throughput_distribution():
    """테넌트별 처리량 분포 파이 차트 (Mermaid Pie Chart)"""
    return """%%{init: {'theme': 'base'}}%%
pie title "WFQ 테넌트별 처리량 분포"
    "Enterprise (w=100)" : 62.1
    "Premium (w=50)" : 31.1
    "Standard (w=10)" : 6.2
    "Free (w=1)" : 0.6
"""

def generate_starvation_prevention_flowchart():
    """기아 방지 메커니즘 흐름도"""
    return """flowchart TD
    A[요청 도착] --> B{알고리즘 선택}

    B --> C[FCFS]
    B --> D[Priority + Aging]
    B --> E[MLFQ + Boosting]
    B --> F[WFQ]

    C --> C1[순차적 처리<br/>조건부 기아 방지]

    D --> D1[우선순위 큐]
    D1 --> D2{대기 시간 30초+?}
    D2 -->|Yes| D3[우선순위 상승]
    D2 -->|No| D1
    D3 --> D4[기아 방지]

    E --> E1[4단계 큐 Q0-Q3]
    E1 --> E2{60초 경과?}
    E2 -->|Yes| E3[모든 작업 → Q0]
    E2 -->|No| E1
    E3 --> E4[기아 방지]

    F --> F1[Virtual Time 계산]
    F1 --> F2[가중치 기반 분배]
    F2 --> F3[자동 기아 방지]

    C1 --> Z[완료]
    D4 --> Z
    E4 --> Z
    F3 --> Z

    style D3 fill:#90EE90
    style E3 fill:#90EE90
    style F3 fill:#90EE90
"""

def generate_architecture_diagram():
    """시스템 아키텍처 다이어그램"""
    return """flowchart TB
    subgraph Request["요청 수신 계층"]
        E[Enterprise<br/>w=100]
        P[Premium<br/>w=50]
        S[Standard<br/>w=10]
        F[Free<br/>w=1]
    end

    subgraph Scheduler["공정 스케줄러 엔진"]
        FC[FCFS<br/>기준선]
        PR[Priority<br/>+Aging]
        ML[MLFQ<br/>+Boosting]
        WF[WFQ<br/>공정분배]
    end

    subgraph Management["공정성 관리자"]
        TR[TenantRegistry]
        VT[VirtualTimeTracker]
        FC[ FairnessCalculator]
    end

    subgraph Storage["저장소 계층"]
        MQ[메모리 큐]
        DB[SQLite 로그]
        LL[LLM Service]
    end

    E & P & S & F --> Scheduler
    Scheduler --> Management
    Management --> Storage

    style WF fill:#4CAF50,color:#fff
    style FC fill:#2196F3,color:#fff
    style E fill:#FF9800
    style P fill:#2196F3
    style S fill:#9C27B0
    style F fill:#9E9E9E
"""

def generate_algorithm_comparison_table():
    """알고리즘 비교 테이블 (Mermaid로 표현)"""
    return """graph LR
    subgraph Compare[알고리즘 특성 비교]
        direction TB
        A1[FCFS<br/>⏱ 공정성: 없음<br/>🛡️ 기아방지: 자동<br/>👥 테넌트: 미지원]
        A2[Priority<br/>⏱ 공정성: 없음<br/>🛡️ 기아방지: Aging 필요<br/>👥 테넌트: 미지원]
        A3[MLFQ<br/>⏱ 공정성: 부분<br/>🛡️ 기아방지: Boosting<br/>👥 테넌트: 미지원]
        A4[WFQ<br/>⏱ 공정성: 가중치 기반<br/>🛡️ 기아방지: 자동 보장<br/>👥 테넌트: 핵심 기능]
    end

    style A4 fill:#4CAF50,color:#fff,stroke:#1B5E20,stroke-width:3px
"""

def generate_gps_formula_diagram():
    """GPS 수식 설명 다이어그램"""
    return """flowchart LR
    A[GPS 수식] --> B["Si(t1,t2) = (wi / Σwj) × (t2 - t1)"]

    B --> C[Si: 테넌트 i의 서비스 시간]
    B --> D[wi: 테넌트 i의 가중치]
    B --> E[Σwj: 전체 가중치 합]
    B --> F[t2-t1: 시간 구간]

    G[예시: 10초 동안] --> H[Enterprise: 6.21초 62.1%]
    G --> I[Premium: 3.11초 31.1%]
    G --> J[Standard: 0.62초 6.2%]
    G --> K[Free: 0.06초 0.6%]

    style B fill:#E3F2FD
    style H fill:#FF9800
    style I fill:#2196F3
    style J fill:#9C27B0
    style K fill:#9E9E9E
"""

def generate_workflow_diagram():
    """WFQ 동작 흐름도"""
    return """flowchart TD
    Start([새 요청 도착]) --> Identify[테넌트 ID 식별]
    Identify --> GetWeight[가중치 조회]
    GetWeight --> CalcVFT[Virtual Finish Time 계산]

    CalcVFT --> Formula["VFT = max(VT, PVT) + (service_time / weight)"]

    Formula --> Insert[우선순위 큐에 삽입]
    Insert --> CheckEmpty{큐가 비어있나?}

    CheckEmpty -->|Yes| Process[요청 처리 시작]
    CheckEmpty -->|No| Wait[대기]

    Process --> UpdateVT[Virtual Time 업데이트]
    UpdateVT --> Complete([처리 완료])

    Wait --> CheckEmpty

    style Formula fill:#E3F2FD,stroke:#2196F3,stroke-width:2px
    style Complete fill:#4CAF50,color:#fff
"""

def generate_mermaid_file(content, filename):
    """Mermaid 파일로 저장"""
    output_dir = Path(__file__).parent / 'mermaid'
    output_dir.mkdir(exist_ok=True)

    output_path = output_dir / filename

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Generated Mermaid: {output_path}")

def generate_all_mermaid_charts():
    """모든 Mermaid 다이어그램 생성"""
    print("Mermaid 다이어그램 생성 시작...")

    charts = [
        (generate_performance_comparison_radar(), '01-performance-comparison.mmd'),
        (generate_jains_fairness_bar(), '02-jains-fairness-index.mmd'),
        (generate_wait_time_comparison(), '03-wait-time-comparison.mmd'),
        (generate_throughput_distribution(), '04-throughput-distribution.mmd'),
        (generate_starvation_prevention_flowchart(), '05-starvation-prevention.mmd'),
        (generate_architecture_diagram(), '06-system-architecture.mmd'),
        (generate_algorithm_comparison_table(), '07-algorithm-comparison.mmd'),
        (generate_gps_formula_diagram(), '08-gps-formula.mmd'),
        (generate_workflow_diagram(), '09-wfq-workflow.mmd'),
    ]

    for content, filename in charts:
        generate_mermaid_file(content, filename)

    print("\n모든 Mermaid 다이어그램 생성 완료!")

if __name__ == '__main__':
    generate_all_mermaid_charts()
