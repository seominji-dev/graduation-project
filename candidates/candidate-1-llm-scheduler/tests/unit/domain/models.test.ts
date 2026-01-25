/**
 * Domain Models Specification Tests
 * Test-first approach for greenfield DDD
 */

import {
  LLMRequestSchema,
  LLMResponseSchema,
  QueueJobSchema,
  SchedulerMetricsSchema,
  RequestPriority,
  RequestStatus,
  LLMProviderSchema,
} from '../../../src/domain/models';

describe('Domain Models - Specification Tests', () => {
  describe('LLMProviderSchema', () => {
    it('should validate Ollama provider with required fields', () => {
      const result = LLMProviderSchema.safeParse({
        name: 'ollama',
        model: 'llama2',
        baseUrl: 'http://localhost:11434',
      });

      expect(result.success).toBe(true);
    });

    it('should validate OpenAI provider with required fields', () => {
      const result = LLMProviderSchema.safeParse({
        name: 'openai',
        model: 'gpt-3.5-turbo',
        apiKey: 'sk-test',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid provider name', () => {
      const result = LLMProviderSchema.safeParse({
        name: 'invalid',
        model: 'test',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('LLMRequestSchema', () => {
    it('should validate complete LLM request (REQ-SCHED-001)', () => {
      const result = LLMRequestSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        prompt: 'Test prompt',
        provider: {
          name: 'ollama',
          model: 'llama2',
        },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(result.success).toBe(true);
    });

    it('should require prompt (REQ-SCHED-301: System must not ignore requests)', () => {
      const result = LLMRequestSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        prompt: '',
        provider: {
          name: 'ollama',
          model: 'llama2',
        },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(result.success).toBe(false);
    });

    it('should accept optional priority field (REQ-SCHED-201)', () => {
      const result = LLMRequestSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        prompt: 'Test prompt',
        provider: {
          name: 'ollama',
          model: 'llama2',
        },
        priority: RequestPriority.HIGH,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe(RequestPriority.HIGH);
      }
    });

    it('should require UUID for request ID (REQ-SCHED-101: Return ID)', () => {
      const result = LLMRequestSchema.safeParse({
        id: 'invalid-uuid',
        prompt: 'Test prompt',
        provider: {
          name: 'ollama',
          model: 'llama2',
        },
        priority: RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(result.success).toBe(false);
    });
  });

  describe('LLMResponseSchema', () => {
    it('should validate complete response (REQ-SCHED-103: Save result)', () => {
      const result = LLMResponseSchema.safeParse({
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        content: 'Test response content',
        tokensUsed: 100,
        processingTime: 1500,
        completedAt: new Date(),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.processingTime).toBe(1500);
      }
    });

    it('should require processing time (REQ-SCHED-002)', () => {
      const result = LLMResponseSchema.safeParse({
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        content: 'Test response',
        completedAt: new Date(),
      });

      expect(result.success).toBe(false);
    });

    it('should allow error field for failed requests', () => {
      const result = LLMResponseSchema.safeParse({
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        content: '',
        processingTime: 500,
        completedAt: new Date(),
        error: 'Processing failed',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('QueueJobSchema', () => {
    it('should validate queue job data', () => {
      const result = QueueJobSchema.safeParse({
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        prompt: 'Test prompt',
        provider: {
          name: 'ollama',
          model: 'llama2',
        },
        priority: RequestPriority.NORMAL,
        attempts: 0,
      });

      expect(result.success).toBe(true);
    });

    it('should default attempts to 0', () => {
      const result = QueueJobSchema.safeParse({
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        prompt: 'Test prompt',
        provider: {
          name: 'ollama',
          model: 'llama2',
        },
        priority: RequestPriority.NORMAL,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.attempts).toBe(0);
      }
    });
  });

  describe('SchedulerMetricsSchema', () => {
    it('should validate scheduler metrics', () => {
      const result = SchedulerMetricsSchema.safeParse({
        totalRequests: 100,
        completedRequests: 85,
        failedRequests: 5,
        averageProcessingTime: 1200,
        averageWaitTime: 300,
        queueLength: 10,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('RequestPriority Enum', () => {
    it('should have correct priority values (REQ-SCHED-201)', () => {
      expect(RequestPriority.LOW).toBe(0);
      expect(RequestPriority.NORMAL).toBe(1);
      expect(RequestPriority.HIGH).toBe(2);
      expect(RequestPriority.URGENT).toBe(3);
    });
  });

  describe('RequestStatus Enum', () => {
    it('should have all status values', () => {
      expect(RequestStatus.PENDING).toBe('pending');
      expect(RequestStatus.QUEUED).toBe('queued');
      expect(RequestStatus.PROCESSING).toBe('processing');
      expect(RequestStatus.COMPLETED).toBe('completed');
      expect(RequestStatus.FAILED).toBe('failed');
      expect(RequestStatus.CANCELLED).toBe('cancelled');
    });
  });
});
