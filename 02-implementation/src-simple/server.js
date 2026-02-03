/**
 * Express 서버 설정
 * 학부생 수준의 간단한 구현
 */
const express = require('express');
const path = require('path');

// 모듈 임포트
const { FCFSScheduler, PriorityScheduler, MLFQScheduler, WFQScheduler } = require('./schedulers');
const { MemoryQueue } = require('./queue/MemoryQueue');
const JSONStore = require('./storage/JSONStore');
const OllamaClient = require('./llm/OllamaClient');
const createRoutes = require('./api/routes');

// 환경 변수
const PORT = process.env.PORT || 3000;
const SCHEDULER_TYPE = process.env.SCHEDULER_TYPE || 'FCFS';

/**
 * 스케줄러 생성 팩토리
 * @param {string} type - 스케줄러 타입 (FCFS, Priority, MLFQ, WFQ)
 */
function createScheduler(type) {
  switch (type.toUpperCase()) {
    case 'FCFS':
      return new FCFSScheduler();
    case 'PRIORITY':
      const ps = new PriorityScheduler();
      ps.startAging();  // Aging 시작
      return ps;
    case 'MLFQ':
      const mlfq = new MLFQScheduler();
      mlfq.startBoosting();  // Boosting 시작
      return mlfq;
    case 'WFQ':
      return new WFQScheduler();
    default:
      console.warn(`알 수 없는 스케줄러 타입: ${type}, FCFS를 사용합니다.`);
      return new FCFSScheduler();
  }
}

/**
 * 서버 생성 및 시작
 */
function createServer() {
  const app = express();

  // 미들웨어
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS 설정 (간단한 버전)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  // 컴포넌트 초기화
  const scheduler = createScheduler(SCHEDULER_TYPE);
  const memoryQueue = new MemoryQueue();
  const jsonStore = new JSONStore();
  const llmClient = new OllamaClient();

  // JSON Store 초기화
  jsonStore.initialize();

  // API 라우트 등록
  const routes = createRoutes({
    scheduler,
    memoryQueue,
    jsonStore,
    llmClient
  });
  app.use('/api', routes);

  // 루트 경로
  app.get('/', (req, res) => {
    res.json({
      name: 'LLM Scheduler API',
      version: '1.0.0',
      scheduler: scheduler.name,
      endpoints: {
        health: 'GET /api/health',
        submitRequest: 'POST /api/requests',
        getRequest: 'GET /api/requests/:id',
        processNext: 'POST /api/scheduler/process',
        stats: 'GET /api/stats'
      }
    });
  });

  // 에러 핸들러
  app.use((err, req, res, next) => {
    console.error('서버 에러:', err);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다' });
  });

  // 서버 시작
  const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║         LLM Scheduler 서버 시작                 ║
╠════════════════════════════════════════════════╣
║  포트: ${PORT}                                   ║
║  스케줄러: ${scheduler.name.padEnd(35)}║
║  API 문서: http://localhost:${PORT}              ║
╚════════════════════════════════════════════════╝
    `);
  });

  // 종료 처리
  process.on('SIGTERM', () => {
    console.log('서버 종료 중...');
    jsonStore.close();
    server.close(() => {
      console.log('서버가 종료되었습니다.');
      process.exit(0);
    });
  });

  return { app, server, scheduler, memoryQueue, jsonStore, llmClient };
}

// 직접 실행 시 서버 시작
if (require.main === module) {
  createServer();
}

module.exports = { createServer, createScheduler };
