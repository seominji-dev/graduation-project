/**
 * Express API 라우트
 * REST API 엔드포인트 정의
 */
const express = require('express');
const router = express.Router();

/**
 * 라우트 초기화
 * @param {Object} deps - 의존성 객체
 * @param {Object} deps.scheduler - 현재 스케줄러
 * @param {Object} deps.memoryQueue - 메모리 큐
 * @param {Object} deps.jsonStore - JSON 저장소
 * @param {Object} deps.llmClient - LLM 클라이언트
 */
function createRoutes(deps) {
  const { scheduler, memoryQueue, jsonStore, llmClient } = deps;

  // ============================================
  // 요청 관리 API
  // ============================================

  /**
   * POST /api/requests
   * 새 LLM 요청 제출
   */
  router.post('/requests', async (req, res) => {
    try {
      const { prompt, priority, tenantId, tier, estimatedTokens } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'prompt는 필수입니다' });
      }

      // 요청 생성
      const request = memoryQueue.createRequest({
        prompt,
        priority,
        tenantId,
        tier,
        estimatedTokens
      });

      // 스케줄러에 추가
      scheduler.enqueue(request);

      res.status(201).json({
        message: '요청이 제출되었습니다',
        requestId: request.id,
        status: request.status
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/requests/:id
   * 요청 상태 조회
   */
  router.get('/requests/:id', (req, res) => {
    const request = memoryQueue.getRequest(req.params.id);

    if (!request) {
      return res.status(404).json({ error: '요청을 찾을 수 없습니다' });
    }

    res.json(request);
  });

  /**
   * GET /api/requests
   * 전체 요청 목록 조회
   */
  router.get('/requests', (req, res) => {
    const status = req.query.status;
    let requests;

    if (status) {
      requests = memoryQueue.getRequestsByStatus(status);
    } else {
      requests = memoryQueue.getAllRequests();
    }

    res.json({
      count: requests.length,
      requests
    });
  });

  // ============================================
  // 스케줄러 관리 API
  // ============================================

  /**
   * GET /api/scheduler/status
   * 스케줄러 상태 조회
   */
  router.get('/scheduler/status', (req, res) => {
    const queueStats = memoryQueue.getStats();
    const schedulerStats = scheduler.getStats ? scheduler.getStats() : {};

    res.json({
      schedulerType: scheduler.name,
      queueSize: scheduler.size(),
      ...queueStats,
      ...schedulerStats
    });
  });

  /**
   * POST /api/scheduler/process
   * 다음 요청 처리 (수동 트리거)
   */
  router.post('/scheduler/process', async (req, res) => {
    try {
      if (scheduler.isEmpty()) {
        return res.json({ message: '처리할 요청이 없습니다' });
      }

      // 다음 요청 선택
      const request = scheduler.dequeue();
      if (!request) {
        return res.json({ message: '처리할 요청이 없습니다' });
      }

      // 처리 시작
      memoryQueue.startProcessing(request.id);

      // LLM 호출
      const response = await llmClient.generate(request.prompt);

      // 완료 처리
      memoryQueue.completeRequest(request.id, response);

      // MLFQ 피드백 (있는 경우)
      if (scheduler.feedback) {
        const processingTime = Date.now() - request.startedAt;
        scheduler.feedback(request, processingTime);
      }

      // 로그 저장
      const completedRequest = memoryQueue.getRequest(request.id);
      jsonStore.saveRequestLog(completedRequest, scheduler.name);

      res.json({
        message: '요청이 처리되었습니다',
        requestId: request.id,
        response
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // 통계 API
  // ============================================

  /**
   * GET /api/stats
   * 전체 통계 조회
   */
  router.get('/stats', (req, res) => {
    const queueStats = memoryQueue.getStats();
    const schedulerComparison = jsonStore.getSchedulerComparison();

    res.json({
      current: {
        scheduler: scheduler.name,
        queueSize: scheduler.size(),
        ...queueStats
      },
      historical: schedulerComparison
    });
  });

  /**
   * GET /api/stats/tenant/:tenantId
   * 테넌트별 통계 조회
   */
  router.get('/stats/tenant/:tenantId', (req, res) => {
    const stats = jsonStore.getTenantStats(req.params.tenantId);
    res.json(stats);
  });

  /**
   * GET /api/logs
   * 최근 요청 로그 조회
   */
  router.get('/logs', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const logs = jsonStore.getRecentLogs(limit);
    res.json({ count: logs.length, logs });
  });

  // ============================================
  // 시스템 API
  // ============================================

  /**
   * GET /api/health
   * 헬스 체크
   */
  router.get('/health', async (req, res) => {
    const llmAvailable = await llmClient.isAvailable();

    res.json({
      status: 'ok',
      scheduler: scheduler.name,
      llm: llmAvailable ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  });

  return router;
}

module.exports = createRoutes;
