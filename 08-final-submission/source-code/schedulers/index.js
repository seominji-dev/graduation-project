/**
 * 스케줄러 모듈 익스포트
 */
const BaseScheduler = require('./BaseScheduler');
const FCFSScheduler = require('./FCFSScheduler');
const { PriorityScheduler, PRIORITY } = require('./PriorityScheduler');
const { MLFQScheduler, TIME_QUANTUM, NUM_QUEUES } = require('./MLFQScheduler');
const { WFQScheduler, DEFAULT_WEIGHTS } = require('./WFQScheduler');

module.exports = {
  BaseScheduler,
  FCFSScheduler,
  PriorityScheduler,
  MLFQScheduler,
  WFQScheduler,
  PRIORITY,
  TIME_QUANTUM,
  NUM_QUEUES,
  DEFAULT_WEIGHTS
};
