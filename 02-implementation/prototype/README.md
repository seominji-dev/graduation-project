# 사전 타당성 검증 프로토타입

> 작성일: 2026년 2월 초

## 개요

OS 수업에서 배운 스케줄링 알고리즘을 LLM API 요청 관리에 적용할 수 있는지 확인하기 위해 며칠간 만들어 본 간단한 프로토타입입니다.

## 구성

- `scheduler-prototype.js` — FCFS, Priority 스케줄러 (Aging 없이 기본 로직만)
- `run-test.js` — 15개 요청으로 FCFS vs Priority 비교 시뮬레이션

## 실행 방법

```bash
node prototype/run-test.js
```

## 확인한 것

- FCFS는 도착 순서대로 처리하므로 우선순위에 관계없이 대기시간이 동일하게 증가
- Priority는 URGENT 요청을 먼저 처리하여 긴급 요청의 대기시간이 크게 줄어듦
- → OS 스케줄링 알고리즘을 LLM 요청 관리에 적용하는 것이 타당하다고 판단

## 향후 계획

- MLFQ, WFQ 등 추가 알고리즘 구현
- Aging 메커니즘 추가 (기아 방지)
- REST API로 확장
- Jest 테스트 작성
