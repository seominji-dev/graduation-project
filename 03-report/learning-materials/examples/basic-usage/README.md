# 기본 사용법 예제 (Basic Usage Examples)

이 디렉토리에는 LLM Scheduler의 기본 사용법을 보여주는 예제 코드가 포함되어 있습니다.

## 예제 목록

### 01-submit-request.ts
**요청 제출 기본**
- LLM 요청 제출 방법
- 우선순위별 요청 생성
- 요청 상태 조회

```bash
# 실행 방법
npx ts-node 01-submit-request.ts
```

### 02-scheduler-selection.ts
**스케줄러 선택 가이드**
- 4가지 스케줄러 비교
- 스케줄러 변경 방법
- 사용 케이스별 권장 스케줄러

```bash
# 실행 방법
npx ts-node 02-scheduler-selection.ts
```

## 사전 준비 사항

1. **서버 실행**
   ```bash
   cd 02-implementation
   npm run dev
   ```

2. **Ollama 실행**
   ```bash
   ollama serve
   ```

## API 엔드포인트 요약

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/requests | 새 요청 제출 |
| GET | /api/requests/:id | 요청 상태 조회 |
| GET | /api/schedulers/current | 현재 스케줄러 조회 |
| POST | /api/schedulers/switch | 스케줄러 변경 |
| GET | /api/stats | 통계 조회 |
