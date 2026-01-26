= LLM 추론 요청 스케줄러
<llm-추론-요청-스케줄러>
#link("https://opensource.org/licenses/MIT")[#box(image("https://img.shields.io/badge/License-MIT-blue.svg"))]
#link("https://nodejs.org")[#box(image("https://img.shields.io/badge/node->=20.0.0-brightgreen"))]
#link("https://www.typescriptlang.org/")[#box(image("https://img.shields.io/badge/TypeScript-5.9-blue"))]
#link("https://github.com/YOUR_USERNAME/llm-scheduler")[#box(image("https://img.shields.io/badge/coverage-97.08%-brightgreen"))]

#quote(block: true)[
OS 스케줄링 알고리즘을 LLM API 요청 관리에 적용한 오픈소스 프로젝트
]

#link("https://github.com/YOUR_USERNAME/llm-scheduler")[#box(image("https://img.shields.io/badge/⭐-Star us on GitHub-yellow?style=social"))]

#line(length: 100%)

== 왜 이 주제?
<왜-이-주제>
요즘 ChatGPT, Claude 같은 LLM API를 쓰는 서비스가 많아졌는데, 여러
사용자가 동시에 요청하면 비용도 폭증하고 응답도 느려진다. 근데 모든
요청을 똑같이 처리하면 급한 요청도 한참 기다려야 하는 문제가 생긴다.

OS 수업에서 배운 프로세스 스케줄링(MLFQ, Priority Queue 등)을 여기에
적용하면 어떨까?

== 핵심 아이디어
<핵심-아이디어>
#figure(
  align(center)[#table(
    columns: 2,
    align: (auto,auto,),
    table.header([OS 개념], [LLM에 적용하면],),
    table.hline(),
    [프로세스], [LLM API 요청],
    [CPU 시간], [API 호출 권한],
    [우선순위], [사용자 등급, 요청 긴급도],
    [스케줄링 알고리즘], [요청 처리 순서 결정],
  )]
  , kind: table
  )

== 구현한 것
<구현한-것>
=== 스케줄링 알고리즘
<스케줄링-알고리즘>
+ #strong[FCFS (First-Come, First-Served)]: 기본 베이스라인
+ #strong[Priority Queue]: 우선순위 기반 처리
+ #strong[MLFQ (Multi-Level Feedback Queue)]: 공정성 + 응답성 균형
+ #strong[WFQ (Weighted Fair Queuing)]: 멀티테넌트 환경

=== 시스템 구성
<시스템-구성>
- #strong[Express 프록시 서버]: 모든 LLM 요청이 여기를 거침
- #strong[요청 분류기]: 우선순위, 토큰 예산 분석
- #strong[스케줄러]: 4가지 알고리즘 구현
- #strong[대시보드]: 실시간 대기열 상태, 메트릭 시각화 (Socket.io)

== 시작하기
<시작하기>
=== 설치
<설치>
```bash
# 의존성 설치
npm install

# 인프라 서비스 시작 (Redis, MongoDB)
docker-compose up -d

# 개발 서버 시작
npm run dev
```

=== 사용 예시
<사용-예시>
```bash
# LLM 요청 제출
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing",
    "priority": 5,
    "maxTokens": 1000
  }'

# 대기열 상태 조회
curl http://localhost:3000/api/queue/status

# 스케줄러 변경
curl -X POST http://localhost:3000/api/scheduler/algorithm \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "mlfq"}'
```

== 기술 스택
<기술-스택>
```
Express.js, BullMQ (Redis), MongoDB
Ollama (로컬 LLM) 또는 OpenAI API
Socket.io (실시간 대시보드)
```

== 테스트
<테스트>
```bash
# 모든 테스트 실행
npm test

# 커버리지 확인
npm run test:coverage

# 테스트 결과: 97.08% 커버리지
```

== 성능 비교
<성능-비교>
#figure(
  align(center)[#table(
    columns: 4,
    align: (auto,auto,auto,auto,),
    table.header([알고리즘], [평균 대기시간], [처리량], [공정성],),
    table.hline(),
    [FCFS], [기준], [기준], [낮음],
    [Priority], [30% 개선], [유지], [낮음],
    [MLFQ], [40% 개선], [20% 증가], [높음],
    [WFQ], [35% 개선], [유지], [매우 높음],
  )]
  , kind: table
  )

== 프로젝트 구조
<프로젝트-구조>
```
src/
├── scheduling/          # 스케줄링 알고리즘 구현
│   ├── FCFSScheduler.ts
│   ├── PriorityScheduler.ts
│   ├── MLFQScheduler.ts
│   └── WFQScheduler.ts
├── queue/              # 요청 큐 관리
│   └── RequestQueue.ts
├── api/               # REST API
├── dashboard/         # 실시간 대시보드
└── config/            # 설정
```

== 왜 이게 좋은지
<왜-이게-좋은지>
- OS 스케줄링 알고리즘을 #strong[직접] 구현하고 비교 실험
- 정량적 성능 측정 가능 (처리량, 대기시간, 공정성)
- 논문 작성 가능: "LLM 추론 요청을 위한 적응형 스케줄링 알고리즘"
- 실제 서비스에 바로 적용 가능

== 기여하기
<기여하기>
기여를 환영합니다! #link("CONTRIBUTING.md")를 참조해 주세요.

+ 포크하세요
+ 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
+ 커밋 (`git commit -m 'feat: add amazing feature'`)
+ 푸시 (`git push origin feature/amazing-feature`)
+ 풀 리퀘스트 열기

== 보안
<보안>
보안 취약점을 발견하시면 #link("SECURITY.md")를 참조하여 보고해 주세요.

== 변경 내역
<변경-내역>
#link("CHANGELOG.md")를 참조하세요.

== 라이선스
<라이선스>
이 프로젝트는 #link("LICENSE")[MIT 라이선스] 하에 배포됩니다.

== 감사의 말
<감사의-말>
이 프로젝트는 2025년 홍익대학교 컴퓨터공학과 졸업 프로젝트로
개발되었습니다.

#line(length: 100%)

#strong[주제]: OS Concepts Applied to AI/LLM Agents \
#strong[상태]: ✅ Complete \
#strong[교수님 추천]: 1순위
