# 학습자료 (Study Materials)

## 프로젝트명
**LLM 스케줄러: OS 스케줄링 기법을 활용한 LLM API 요청 최적화**

## 이 폴더의 목적
프로젝트를 이해하고 설명하기 위한 학습 자료를 제공합니다.
졸업발표 준비 및 면접 대비용으로 활용하세요.

## 폴더 구조

```
study-materials/
├── os-concepts/        # OS 개념 정리
│   ├── scheduling-algorithms.md
│   ├── fcfs-explained.md
│   ├── mlfq-explained.md
│   └── wfq-explained.md
├── code-analysis/      # 코드 상세 분석
│   ├── architecture-overview.md
│   ├── scheduler-implementation.md
│   └── test-strategy.md
└── faq/                # 자주 묻는 질문
    ├── interview-questions.md
    └── common-questions.md
```

## 학습 순서 권장

### 1단계: OS 개념 이해
1. `os-concepts/scheduling-algorithms.md` - 스케줄링 개요
2. `os-concepts/fcfs-explained.md` - FCFS 알고리즘
3. `os-concepts/mlfq-explained.md` - MLFQ 알고리즘
4. `os-concepts/wfq-explained.md` - WFQ 알고리즘

### 2단계: 코드 이해
1. `code-analysis/architecture-overview.md` - 전체 아키텍처
2. `code-analysis/scheduler-implementation.md` - 스케줄러 구현 상세
3. `code-analysis/test-strategy.md` - 테스트 전략

### 3단계: 발표 준비
1. `faq/interview-questions.md` - 예상 질문 및 답변
2. `faq/common-questions.md` - 일반적인 질문들

## 핵심 개념 요약

### OS 스케줄링 알고리즘
| 알고리즘 | 특징 | LLM 적용 |
|---------|------|---------|
| FCFS | 선착순 처리 | 기본 요청 처리 |
| Priority | 우선순위 기반 | 중요도별 처리 |
| MLFQ | 동적 우선순위 | 작업 특성 학습 |
| WFQ | 가중치 공정 분배 | 멀티테넌트 공정성 |

### 이 프로젝트의 핵심 가치
1. OS 이론의 실제 적용 사례
2. LLM API 비용/성능 최적화
3. 98.29% 테스트 커버리지로 검증된 코드

## 관련 문서
- 구현 단계: ../02-implementation/README.md
- 보고서 단계: ../03-report/README.md
