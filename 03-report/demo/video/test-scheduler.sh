#!/bin/bash
# 간단한 스케줄러 테스트

API_BASE_URL="http://localhost:3000"
API_KEY="demo-api-key-32-characters-long-for-testing"

echo "=== FCFS 스케줄러 전환 ==="
curl -s -X POST "$API_BASE_URL/api/scheduler/switch" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"type": "FCFS"}' | jq .

echo ""
echo "=== WFQ 스케줄러 전환 ==="
curl -s -X POST "$API_BASE_URL/api/scheduler/switch" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"type": "WFQ"}' | jq .

echo ""
echo "=== 통계 확인 ==="
curl -s "$API_BASE_URL/api/scheduler/stats" \
  -H "X-API-Key: $API_KEY" | jq .
