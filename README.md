# LLM 스케줄러
**OS 스케줄링 기법을 활용한 LLM API 요청 최적화**

홍익대학교 컴퓨터공학과 2026년 졸업프로젝트

---

## 프로젝트 개요

운영체제(OS)의 프로세스 스케줄링 알고리즘을 LLM API 요청 관리에 적용하여,
API 비용을 절감하고 응답 시간을 최적화하는 시스템입니다.

### 구현된 알고리즘

| 알고리즘 | 설명 | 적합한 상황 |
|---------|------|------------|
| **FCFS** | 선착순 처리 | 단순한 요청 흐름 |
| **Priority** | 우선순위 기반 | 중요도 구분 필요 |
| **MLFQ** | 동적 우선순위 조정 | 다양한 작업 혼합 |
| **WFQ** | 가중치 공정 분배 | 멀티테넌트 환경 |

---

## 프로젝트 구조

```
졸업프로젝트/
├── 01-plan/                # Phase 1: 계획서
│   ├── proposal.md        # 연구 계획서
│   └── requirements.md    # 요구사항 분석
│
├── 02-implementation/      # Phase 2: 구현
│   ├── src/               # 소스코드
│   ├── tests/             # 테스트 (777개)
│   └── experiments/       # 실험 데이터
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

# 개발 서버 실행 (포트 3000)
npm run dev

# 테스트 실행
npm test
```

---

## 기술 스택

- **언어:** TypeScript 5.3+
- **런타임:** Node.js 20 LTS
- **프레임워크:** Express.js 4.18
- **큐 시스템:** BullMQ 5.1.8
- **데이터베이스:** Redis 7.2+, MongoDB 8.0+
- **LLM:** Ollama, OpenAI API

---

## 테스트 결과

| 항목 | 결과 |
|------|------|
| 테스트 수 | 777개 |
| 통과율 | 100% |
| 코드 커버리지 | 98.72% |

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
- [x] 최종 논문 (PDF) - 03-report/paper/final-report.pdf (154KB)
- [x] 발표자료 (PPT) - 03-report/presentation/graduation-presentation.pptx (457KB)
- [x] 데모 영상 - 03-report/demo/video/out/demo.mp4 (5.2MB)

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
