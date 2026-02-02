# 학습자료 (Study Materials)

## 프로젝트명
**LLM 스케줄러: OS 스케줄링 기법을 활용한 LLM API 요청 최적화**

## 이 폴더의 목적
프로젝트를 이해하고 설명하기 위한 학습 자료를 제공합니다.
졸업발표 준비 및 면접 대비용으로 활용하세요.

> **참고**: 포괄적인 학습 자료는 `../03-report/learning-materials/`에 위치합니다.
> 이 폴더는 빠른 참조용 핵심 개념만 포함합니다.

## 포괄적 학습 자료 안내

**7개 챕터의 상세 학습 자료**는 `03-report/learning-materials/`에서 확인하세요:

| 챕터 | 파일명 | 내용 | 분량 |
|------|--------|------|------|
| 01 | 01-project-overview.md | 프로젝트 개요, 기술 스택, 용어 정의 | 281줄 |
| 02 | 02-code-walkthrough.md | 완전한 코드 워크스루 | 753줄 |
| 03 | 03-algorithms-deep-dive.md | 알고리즘 상세 설명 | 527줄 |
| 04 | 04-component-interactions.md | 컴포넌트 상호작용 | 738줄 |
| 05 | 05-faq.md | Q&A 형식 (20+ 질문) | 694줄 |
| 06 | 06-eli5.md | 쉽게 설명하기 | 335줄 |
| 07 | 07-os-scheduling-reference.md | OS 스케줄링 참고 자료 | 471줄 |

## 이 폴더의 구조

```
study-materials/
├── README.md                    # 이 파일 (학습 가이드)
├── os-concepts/                 # OS 개념 빠른 참조
│   └── scheduling-algorithms.md # 4가지 알고리즘 + 심화 개념 (250줄+)
├── code-analysis/               # 코드 분석 자료
│   └── README.md                # 핵심 코드 분석, 아키텍처 (400줄+)
└── faq/                         # 면접 대비
    └── interview-questions.md   # 예상 질문 및 답변 (15개+)
```

## 학습 순서 권장

### 빠른 학습 (이 폴더)
1. `os-concepts/scheduling-algorithms.md` - 스케줄링 개요 및 심화 개념 (250줄+)
2. `code-analysis/README.md` - 핵심 코드 분석 (400줄+)
3. `faq/interview-questions.md` - 면접 예상 질문 (15개+)

### 심화 학습 (03-report/learning-materials/)
1. `01-project-overview.md` - 프로젝트 전체 그림
2. `02-code-walkthrough.md` - 코드 라인별 설명
3. `03-algorithms-deep-dive.md` - 알고리즘 심층 분석
4. `04-component-interactions.md` - 컴포넌트 간 협력
5. `05-faq.md` - 상세 Q&A (20+ 질문)
6. `06-eli5.md` - 5살에게 설명하기
7. `07-os-scheduling-reference.md` - OS 교과서 연결

## 핵심 개념 요약

### OS 스케줄링 알고리즘
| 알고리즘 | 특징 | LLM 적용 | 시간 복잡도 |
|---------|------|---------|-----------|
| FCFS | 선착순 처리 | 기본 요청 처리 | O(1) |
| Priority | 우선순위 기반 | 중요도별 처리 | O(log n) |
| MLFQ | 동적 우선순위 | 작업 특성 학습 | O(log n) |
| WFQ | 가중치 공정 분배 | 멀티테넌트 공정성 | O(log n) |

### 프로젝트 성과 (2026-01-30 기준)
| 항목 | 결과 |
|------|------|
| 테스트 케이스 | 777개 (100% 통과) |
| 코드 커버리지 (Statements) | 98.72% |
| 코드 커버리지 (Branches) | 85.77% |
| 코드 커버리지 (Lines) | 98.93% |

### 이 프로젝트의 핵심 가치
1. OS 이론의 실제 적용 사례
2. LLM API 비용/성능 최적화
3. 98.72% 테스트 커버리지로 검증된 코드

## 관련 문서
- 계획 단계: ../01-plan/README.md
- 구현 단계: ../02-implementation/README.md
- 보고서 단계: ../03-report/README.md
- **포괄적 학습 자료**: ../03-report/learning-materials/

## 학술적 기여 요약

본 프로젝트의 핵심 학술적 기여:

1. **OS 이론의 AI 도메인 확장**: CPU 스케줄링 알고리즘을 LLM API 요청 관리에 최초 적용
2. **LLM 특화 메커니즘 개발**: Aging(30초), Boost(60초) 등 기아 방지 메커니즘 구현
3. **정량적 성능 비교**: 4개 알고리즘의 대기시간, 처리량, 공정성 실증 분석
4. **오픈소스 기여**: MIT License로 전체 코드 및 777개 테스트 공개

---

**최종 업데이트**: 2026-02-01
**버전**: 2.1.0 (학술적 기여 요약 추가)
