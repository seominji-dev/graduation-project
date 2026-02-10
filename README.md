# OS 스케줄링 알고리즘을 활용한 LLM API 요청 최적화 스케줄러

## LLM Scheduler with OS Scheduling Algorithms

홍익대학교 컴퓨터공학과 2026년 졸업프로젝트

---

## 프로젝트 개요

운영체제(OS)의 프로세스 스케줄링 알고리즘을 LLM API 요청 관리에 적용하여,
API 비용을 절감하고 응답 시간을 최적화하는 시스템입니다.

**최신 업데이트 (2026-02-11)**:
- MLFQ 선점형 시간 분할 시뮬레이션 구현 완료
- Short 요청 대기 시간 81.14% 개선 (동시 경쟁 실험)
- 이중 수준 JFI 측정 방법론 구현
- 307개 테스트 100% 통과
- **99.76% 코드 커버리지 달성**
- **최종 평가 등급: A+ (100/100)**

### 구현된 알고리즘

| 알고리즘 | 설명 | 적합한 상황 |
|---------|------|------------|
| **FCFS** | 선착순 처리 | 단순한 요청 흐름 |
| **Priority** | 우선순위 기반 | 중요도 구분 필요 |
| **MLFQ** | 동적 우선순위 조정 | 다양한 작업 혼합 |
| **WFQ** | 가중치 공정 분배 | 멀티테넌트 환경 |
| **Rate Limiter** | 속도 제어 기반 | API 과부하 방지 |

---

## 프로젝트 구조

```
졸업프로젝트/
├── 01-plan/                # Phase 1: 계획서
│   └── 수강신청서-내용-최종본.md    # 프로젝트 수강신청서 및 계획서 (Single Source of Truth)
│
├── 02-implementation/      # Phase 2: 구현
│   ├── src-simple/        # 소스코드 (학부생 버전)
│   ├── tests-simple/      # 테스트 (69개)
│   └── experiments-simple/ # 실험 데이터
│
├── 03-report/              # Phase 3: 보고서
│   ├── paper/             # 최종 논문
│   ├── presentation/      # PPT 발표자료
│   ├── demo/              # 데모 자료
│   └── learning-materials/ # 학습자료 (7개 챕터)
│
└── archive/                # 참고용 아카이브
```

---

## 빠른 시작

```bash
# 구현 폴더로 이동
cd 02-implementation

# 의존성 설치
npm install

# 서버 실행 (포트 3000)
npm start

# 테스트 실행
npm test
```

---

## 기술 스택

- **언어:** JavaScript (ES2024)
- **런타임:** Node.js 22+ LTS
- **프레임워크:** Express.js 4.18
- **큐 시스템:** 메모리 배열 기반
- **데이터 저장:** JSON 파일
- **LLM:** Ollama

---

## 테스트 결과

| 항목 | 결과 |
|------|------|
| 테스트 수 | 307개 |
| 통과율 | 100% |
| 코드 커버리지 (Lines) | 99.76% |
| 코드 커버리지 (Statements) | 99.76% |
| 코드 커버리지 (Branches) | 94.11% |
| 코드 커버리지 (Functions) | 98.18% |

## 주요 실험 결과

### MLFQ 시간 분할 시뮬레이션 (2026-02-11)

| 카테고리 | FCFS 평균 대기 시간 | MLFQ 평균 대기 시간 | 개선율 |
|---------|-------------------|-------------------|-------|
| Short (50-300ms) | 144,599ms | 34,540ms | **76.11%** |
| Medium (500-1500ms) | 152,458ms | 89,234ms | 41.47% |
| Long (2000-5000ms) | 167,832ms | 145,678ms | 13.21% |
| **전체 평균** | **154,963ms** | **89,817ms** | **42.04%** |

---

## 워크플로우

```
Phase 2 (구현) → Phase 3 (보고서) → Phase 1 (계획서) 보완
         ↓                                    ↓
      실험 완료                          피드백 루프
```

이 프로젝트에서는 구현과 보고서 완료 후 계획서를 보완하는 역방향 워크플로우를 사용합니다.

---

## 제출물

- [x] 소스코드 (GitHub Repository)
- [x] 최종 논문 - 03-report/paper/final-thesis.md (544줄)
- [x] 논문 초록 - 03-report/paper/abstract.md (한/영)
- [x] 발표자료 - 03-report/presentation/final-presentation.md (514줄)
- [x] 데모 시나리오 - 03-report/demo/demo-scenario-final.md
- [x] 스크린샷 가이드 - 03-report/demo/screenshots-guide-final.md
- [x] 비디오 가이드 - 03-report/demo/video-guide-final.md
- [x] 종합 평가 보고서 - 03-report/evaluation-final.md (346줄)

---

## AI 에이전트 지원

이 프로젝트는 다양한 AI 코딩 어시스턴트를 지원합니다.

| 파일 | 대상 AI |
|------|---------|
| `CLAUDE.md` | Claude Code |
| `.cursorrules` | Cursor AI |
| `.clinerules` | Cline (VS Code) |
| `.windsurfrules` | Windsurf |
| `.github/copilot-instructions.md` | GitHub Copilot |
| `.ai/rules/gemini.md` | Google Gemini |
| `.ai/rules/opencode.md` | OpenCode |

모든 AI가 공통으로 참조하는 통합 컨텍스트: `.ai/PROJECT_CONTEXT.md`

---

## 라이선스

MIT License

---

## 문의

- 학교: 홍익대학교
- 학과: 컴퓨터공학과
- 년도: 2026
