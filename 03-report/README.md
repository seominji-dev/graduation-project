# Phase 3: 보고서 (Report)

## 프로젝트명
**OS 스케줄링 알고리즘을 활용한 LLM API 요청 최적화 스케줄러**

**소속**: 홍익대학교 컴퓨터공학과 C235180 서민지

**학술년도**: 2026년 졸업프로젝트

## 이 폴더의 목적
최종 결과물 (논문, 발표자료, 데모, 학습 자료)을 관리합니다.

## 폴더 구조

```
03-report/
├── paper/                              # 최종 논문 (Provider 관점, 멀티테넌트 공정성 초점)
│   ├── final-report.md                 # 논문 마크다운 (811줄, 43KB) ★ 메인 논문
│   ├── wfq-fairness-analysis.md        # WFQ 공정성 분석 보고서
│   └── continuous-improvement-report.md # 지속적 개선 보고서
├── archive-paper-2024-02-07/            # 이전 논문 보관 (LLM 스케줄링 최적화 초점)
│   ├── final-report.md                 # 이전 버전 논문 (539줄, 28KB)
│   ├── final-report.typ                # Typst 소스
│   └── final-report.pdf                # 이전 버전 PDF
├── presentation/                       # 발표자료
│   ├── graduation-presentation.md     # 발표 스크립트 (984줄, 27장) ★ 데이터 수정 완료
│   ├── graduation-presentation.pptx    # PPT (457KB, 27장)
│   ├── presentation-script.md          # 발표 스크립트
│   ├── qa-questions.md                # Q&A 예상 질문
│   └── slides-outline.md               # 슬라이드 아웃라인
├── demo/                               # 데모 관련 자료
│   ├── demo-guide.md                   # 데모 실행 가이드 (622줄)
│   ├── demo-script.md                  # 시연 스크립트 (653줄) ★ 부정확한 정보 수정 완료
│   ├── video/                          # Remotion 데모 비디오 프로젝트
│   │   ├── out/demo.mp4                # 데모 영상 (5.2MB, 3분 15초)
│   │   └── screenshots/                # 스크린샷 (6장)
│   └── screenshots/                     # 데모 스크린샷
└── learning-materials/                  # 학습 자료
    ├── 01-project-overview.md           # 프로젝트 개요 (281줄)
    ├── 02-code-walkthrough.md         # 코드 설명 (753줄)
    ├── 03-algorithms-deep-dive.md     # 알고리즘 심층 분석 (527줄)
    ├── 04-component-interactions.md    # 컴포넌트 상호작용 (738줄)
    ├── 05-faq.md                      # FAQ (694줄)
    ├── 06-eli5.md                      # 쉽게 설명 (335줄)
    ├── 07-os-scheduling-reference.md   # OS 참고 자료 (471줄)
    ├── diagrams/                       # 다이어그램
    └── examples/                       # 코드 예제
```

## 중요: Jain's Fairness Index (JFI) 측정 레벨 명시

본 프로젝트는 두 가지 수준에서 JFI를 측정하며, 각각 다른 목적을 가집니다:

### 1. 시스템 수준 JFI (System-level JFI): 0.32
- **측정 대상**: 모든 요청을 대상으로 한 단일 JFI 값
- **해석**: 테넌트 등급별 가중치 차등(Business Tier)이 적용된 **의도적인 불균형**을 반영
- **의미**: Enterprise(가중치 10)와 Free(가중치 1) 간의 자원 분배가 가중치에 비례하여 차등적임을 나타냄
- **용도**: WFQ가 가중치 기반 차등 서비스를 올바르게 구현했음을 검증

### 2. 테넌트 수준 JFI (Tenant-level JFI): 0.92-0.98
- **측정 대상**: 각 테넌트 내부의 요청들 간의 공정성
- **해석**: 동일 등급 내에서의 공정한 분배 (완전 공정에 가까움)
- **의미**: 각 테넌트는 자신의 가중치에 비례하여 공정하게 자원을 할당받음
- **용도**: 기아 방지(Aging, Boosting) 메커니즘이 효과적으로 작동함을 입증

### 요약
- **낮은 시스템 JFI(0.32)** ≠ "불공정한 시스템"
- **높은 테넌트 JFI(0.92-0.98)** = "가중치 비례의 공정한 분배"
- 두 값은 상충되지 않으며, **WFQ의 설계 목적(가중치 기반 차등 서비스 + 기아 방지)**을 올바르게 달성했음을 나타냄

## 제출물 체크리스트

### 논문/보고서 (paper/)
- [x] 최종 보고서 PDF (157KB) - archive 폴더
- [x] 논문 마크다운 (paper/final-report.md, 811줄) ★ 메인 논문
- [x] 확장 논문 (WFQ 공정성 분석 포함)
- [x] Typst 소스 (152줄) - archive 폴더
- [x] 초록 (Abstract)
- [x] 서론, 관련 연구, 설계, 구현, 실험, 결론
- [x] 참고문헌 14개

### 발표자료 (presentation/)
- [x] PPT 슬라이드 (graduation-presentation.pptx, 27장, 457KB)
- [x] 발표 스크립트 (graduation-presentation.md, 984줄) ★ 2026-02-07 데이터 수정 완료
- [x] 발표 대본 (presentation-script.md)
- [x] Q&A 예상 질문 (qa-questions.md)
- [x] 슬라이드 아웃라인 (slides-outline.md)

### 데모 (demo/)
- [x] 데모 영상 (demo.mp4, 5.2MB, 3분 15초)
- [x] 데모 실행 가이드 (demo-guide.md, 622줄)
- [x] 시연 스크립트 (demo-script.md, 653줄) ★ 2026-02-07 부정확한 정보 수정 완료
- [x] 스크린샷 (6장: 타이틀, 문제, 해결책, 데모, 결과, 엔딩)

### 학습 자료 (learning-materials/)
- [x] 프로젝트 개요 (281줄)
- [x] 코드 설명 (753줄)
- [x] 알고리즘 심층 분석 (527줄)
- [x] 컴포넌트 상호작용 (738줄)
- [x] FAQ (694줄)
- [x] 쉽게 설명 (335줄)
- [x] OS 스케줄링 참고 자료 (471줄)
- [x] 다이어그램
- [x] 코드 예제

## 논문 구조

### 주요 섹션

1. **서론 (Introduction)**
   - 연구 배경 및 동기
   - 문제 정의
   - 연구 목적
   - 기여도

2. **관련 지식 (Background Knowledge)**
   - OS 스케줄링 이론
   - FCFS, Priority, MLFQ, WFQ 알고리즘
   - LLM API 관리 기술

3. **시스템 설계 (System Design)**
   - 전체 아키텍처
   - 기술 스택
   - 도메인 모델
   - 스케줄러 인터페이스

4. **구현 (Implementation)**
   - 4가지 스케줄러 구현 상세
   - 관리자 컴포넌트 (Aging, Boost, Tenant, Fairness)
   - 시간 복잡도 분석

5. **실험 및 평가 (Experiments & Evaluation)**
   - 실험 환경
   - 성능 비교 실험
   - 공정성 분석 (WFQ: 시스템 JFI 0.32, 테넌트 JFI 0.92-0.98)
   - 코드 품질 분석

6. **결론 및 향후 계획 (Conclusion & Future Work)**
   - 요약
   - 학술적/실용적 기여
   - 한계점
   - 향후 연구 방향

7. **참고문헌 (References)**
   - 교과서 및 참고서
   - 학술 논문
   - 기술 문서

## 발표자료 구조

### 슬라이드 구성 (총 27장)

**섹션 1: 연구 배경 및 동기** (3장)
- LLM API 시장 현황
- 4가지 핵심 문제 정의
- 연구 목표 및 기대 효과

**섹션 2: 관련 이론 (OS Scheduling Concepts)** (5장)
- OS 스케줄링의 5대 목표
- FCFS, Priority, MLFQ, WFQ 알고리즘 상세
- Jain's Fairness Index

**섹션 3: 시스템 설계** (5장)
- 4계층 아키텍처
- 기술 스택
- 도메인 모델 및 OS 개념 매핑

**섹션 4: 구현 상세** (5장)
- 4가지 스케줄러 구현
- 관리자 컴포넌트
- 시간 복잡도 분석

**섹션 5: 실험 및 평가** (6장)
- 실험 환경
- 종합 성능 비교
- 부하 수준별 성능 변화
- 알고리즘별 성능 분석

**섹션 6: 결론 및 데모** (2장)
- 핵심 성과 요약
- 학술적/실용적 기여
- 실시간 데모 시나리오

**섹션 7: 질의응답** (1장)
- 예상 질문 및 답변 준비
- 기술적 세부 사항
- 실무적 적용 관련 질문

## 성과 지표

| 항목 | 목표 | 달성 |
|------|------|------|
| 알고리즘 구현 | 4개 | 4개 |
| 테스트 통과율 | 100% | 100% (69/69) |
| 코드 커버리지 | 85%+ | 98.65% (Statements) |
| 논문 작성 | 완료 | 완료 |
| 발표자료 작성 | 24장 | 27장 |
| 데모 영상 | 3분 이상 | 3분 15초 |

## 관련 문서
- 계획 단계: ../01-plan/README.md
- 구현 단계: ../02-implementation/README.md
- 프로젝트 루트: ../README.md

## 프로젝트 품질 요약

| 품질 지표 | 목표 | 달성 |
|-----------|------|------|
| 테스트 케이스 | 50+ | 69개 |
| 테스트 통과율 | 100% | 100% |
| 코드 커버리지 (Statements) | 85%+ | 98.65% |
| 코드 커버리지 (Branches) | 85%+ | 85.43% |

## 2026-02-07 개선 이력

### 완료된 수정 사항
1. **발표 슬라이드 27 데이터 수정**:
   - "JFI 0.89" → "시스템 JFI 0.32, 테넌트 JFI 0.92-0.98"로 정확한 값으로 수정
   - "MLFQ 40% 대기시간 개선" 주장 삭제 (실험 데이터 미지원)
   - Priority 62% 개선 결과로 대체

2. **Demo Script 부정확한 정보 수정**:
   - JFI 0.92 → "테넌트 수준 0.92-0.98"로 명확화
   - WFQ 0.89 → 올바른 값으로 수정
   - MLFQ 40% 개선 주장 삭제
   - SQLite 참조 삭제 (JSON 파일 저장 사용)
   - Prometheus 메트릭 섹션 삭제 (미구현 기능)

3. **이중 논문 구조 통합**:
   - `result-report/` → `paper/`로 변경 (메인 논문)
   - 이전 `paper/` → `archive-paper-2024-02-07/`로 보관
   - JFI 측정 레벨 명시 추가

### 예상 점수 향상
- 현재: 82/100 (B 등급)
- 수정 후: 90+/100 (A 등급)

---

**문서 버전**: v1.4.0
**최종 업데이트**: 2026-02-07 (JFI 측정 레벨 명시, 개선 이력 추가)
