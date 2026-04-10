# Terminology Guide: Tier vs Priority

Final report and presentation must use these terms consistently.
Created from memo.md feedback (professor flagged "사용자 등급" used for both concepts).

---

## Official Terms

| English | Korean | Scope | Values | Used By |
|---------|--------|-------|--------|---------|
| Subscription Tier | 구독 등급 | Tenant (fixed) | Enterprise / Premium / Standard / Free | WFQ weight, Rate Limiter |
| Request Priority | 요청 우선순위 | Per-request (variable) | URGENT / HIGH / NORMAL / LOW | Priority Scheduler |

## System Architecture Mapping

```
[Client Request]
     |
     v
[Rate Limiter] --- uses: 구독 등급 (Subscription Tier)
     |               Enterprise: 100 req/min
     |               Premium:     50 req/min
     |               Standard:    10 req/min
     |               Free:         5 req/min
     v
[Scheduler] --- uses: depends on algorithm
     |
     |   FCFS:     neither (arrival order)
     |   Priority: 요청 우선순위 (Request Priority)
     |   MLFQ:     neither (queue level by execution time)
     |   WFQ:      구독 등급 (Subscription Tier) -> weight
     |
     v
[LLM Processing]
```

## Writing Rules

- NEVER use "사용자 등급" alone (ambiguous)
- When referring to Enterprise/Premium/Standard/Free: always "구독 등급"
- When referring to URGENT/HIGH/NORMAL/LOW: always "요청 우선순위"
- Rate Limiter section: "구독 등급에 따른 요청 제한"
- Priority Scheduler section: "요청 우선순위에 따른 스케줄링"
- WFQ section: "구독 등급 기반 가중치 할당"

## Affected Report Sections

- 3.2 시스템 아키텍처: API/스케줄러 계층 역할 경계에서 명확히 구분
- 3.3 설계 방침: "사용자 등급" → 구체적 용어로 교체
- 4.3 핵심 알고리즘: 각 알고리즘이 어떤 분류 체계를 사용하는지 명시
- 5장 실험: 실험 설정에서 구독 등급 분포와 요청 우선순위 분포를 별도 명시

---

Created: 2026-04-10
Source: memo.md professor feedback, code analysis of src-simple/
