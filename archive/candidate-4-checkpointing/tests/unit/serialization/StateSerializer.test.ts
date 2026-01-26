/**
 * Unit Tests for StateSerializer
 * Tests REQ-CHECK-001 through REQ-CHECK-009
 */

import { StateSerializer } from '../../../src/serialization/StateSerializer';
import { AgentState, Message, AgentStatus } from '../../../src/domain/models';

describe('StateSerializer', () => {
  let serializer: StateSerializer;

  beforeEach(() => {
    serializer = new StateSerializer(10485760); // 10MB limit
  });

  const createTestState = (overrides?: Partial<AgentState>): AgentState => ({
    messages: [],
    variables: {},
    status: AgentStatus.IDLE,
    ...overrides,
  });

  describe('serialize', () => {
    it('should serialize valid agent state to JSON (REQ-CHECK-001)', () => {
      const state: AgentState = createTestState({
        messages: [
          {
            role: 'user',
            content: 'Hello',
            timestamp: new Date(),
          },
        ],
        variables: { count: 0 },
      });

      const result = serializer.serialize(state);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.size).toBeGreaterThan(0);
    });

    it('should filter sensitive data (REQ-CHECK-009)', () => {
      const state: AgentState = createTestState({
        variables: {
          apiKey: 'secret-key-123',
          password: 'my-password',
          normalData: 'keep-this',
        },
      });

      const result = serializer.serialize(state);

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Filtered sensitive field: variables.apiKey');
      expect(result.warnings).toContain('Filtered sensitive field: variables.password');

      const parsed = JSON.parse(result.data!);
      expect(parsed.variables.apiKey).toBe('[REDACTED]');
      expect(parsed.variables.password).toBe('[REDACTED]');
      expect(parsed.variables.normalData).toBe('keep-this');
    });

    it('should warn when state size exceeds limit (REQ-CHECK-006)', () => {
      const smallSerializer = new StateSerializer(100); // 100 bytes
      const state: AgentState = createTestState({
        variables: { data: 'x'.repeat(200) },
      });

      const result = smallSerializer.serialize(state);

      expect(result.success).toBe(true);
      expect(result.warnings.some(w => w.includes('exceeds limit'))).toBe(true);
    });

    it('should handle Date objects correctly', () => {
      const testDate = new Date('2024-01-01T00:00:00Z');
      const state: AgentState = createTestState({
        messages: [
          {
            role: 'user',
            content: 'Test',
            timestamp: testDate,
          },
        ],
        lastActivity: testDate,
      });

      const result = serializer.serialize(state);
      expect(result.success).toBe(true);

      const deserializeResult = serializer.deserialize(result.data!);
      expect(deserializeResult.success).toBe(true);
      // Date is deserialized as Date object
      expect(deserializeResult.state!.messages[0].timestamp).toBeInstanceOf(Date);
      expect(deserializeResult.state!.messages[0].timestamp.getTime()).toBe(testDate.getTime());
      expect(deserializeResult.state!.lastActivity).toBeInstanceOf(Date);
      expect(deserializeResult.state!.lastActivity!.getTime()).toBe(testDate.getTime());
    });
  });

  describe('deserialize', () => {
    it('should deserialize JSON to agent state (REQ-CHECK-005)', () => {
      const testDate = new Date();
      const state: AgentState = createTestState({
        messages: [
          { role: 'user', content: 'Hello', timestamp: testDate },
        ],
        variables: { key: 'value' },
      });

      const serialized = serializer.serialize(state);
      const result = serializer.deserialize(serialized.data!);

      expect(result.success).toBe(true);
      // Check individual fields instead of deep equality
      expect(result.state!.messages.length).toBe(state.messages.length);
      expect(result.state!.messages[0].role).toBe(state.messages[0].role);
      expect(result.state!.messages[0].content).toBe(state.messages[0].content);
      expect(result.state!.messages[0].timestamp).toBeInstanceOf(Date);
      expect(result.state!.variables.key).toBe('value');
      expect(result.state!.status).toBe(state.status);
    });

    it('should fail for invalid JSON', () => {
      const result = serializer.deserialize('invalid json');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail for missing required fields', () => {
      const invalidState = JSON.stringify({ variables: {} });
      const result = serializer.deserialize(invalidState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing or invalid messages');
    });
  });

  describe('calculateDiff', () => {
    it('should calculate diff between states (REQ-CHECK-019)', () => {
      const baseState: AgentState = createTestState({
        variables: { a: 1, b: 2 },
      });

      const currentState: AgentState = createTestState({
        variables: { a: 1, b: 3, c: 4 },
        status: AgentStatus.RUNNING,
      });

      const diff = serializer.calculateDiff(baseState, currentState);

      expect(diff.added).toEqual({ c: 4 });
      expect(diff.modified._status).toBe(AgentStatus.RUNNING);
      expect(diff.modified.b).toBe(3);
      expect(diff.deleted).toHaveLength(0);
    });

    it('should detect deleted variables', () => {
      const baseState: AgentState = createTestState({
        variables: { a: 1, b: 2, c: 3 },
      });

      const currentState: AgentState = createTestState({
        variables: { a: 1 },
      });

      const diff = serializer.calculateDiff(baseState, currentState);

      expect(diff.deleted).toContain('variables.b');
      expect(diff.deleted).toContain('variables.c');
    });
  });

  describe('applyDiff', () => {
    it('should apply diff to base state (REQ-CHECK-020)', () => {
      const baseState: AgentState = createTestState({
        variables: { a: 1, b: 2 },
      });

      const diff = {
        added: { c: 3 },
        modified: { b: 5, _status: AgentStatus.RUNNING },
        deleted: [] as string[],
      };

      const result = serializer.applyDiff(baseState, diff);

      expect(result.variables).toEqual({ a: 1, b: 5, c: 3 });
      expect(result.status).toBe(AgentStatus.RUNNING);
    });

    it('should handle deleted fields', () => {
      const baseState: AgentState = createTestState({
        variables: { a: 1, b: 2, c: 3 },
      });

      const diff = {
        added: {},
        modified: {},
        deleted: ['variables.b', 'variables.c'],
      };

      const result = serializer.applyDiff(baseState, diff);

      expect(result.variables).toEqual({ a: 1 });
    });
  });

  describe('shouldUseFullCheckpoint', () => {
    it('should return true when diff is large (REQ-CHECK-021)', () => {
      const baseState: AgentState = createTestState({
        variables: { data: 'small' },
      });

      const currentState: AgentState = createTestState({
        variables: { data: 'x'.repeat(1000) }, // Large diff
        status: AgentStatus.RUNNING,
      });

      const diff = serializer.calculateDiff(baseState, currentState);
      const shouldUseFull = serializer.shouldUseFullCheckpoint(baseState, diff);

      expect(shouldUseFull).toBe(true);
    });

    it('should return false when diff is small', () => {
      const baseState: AgentState = createTestState({
        variables: { data: 'x'.repeat(1000) },
      });

      const currentState: AgentState = createTestState({
        variables: { data: 'x'.repeat(1000), added: 'small' },
      });

      const diff = serializer.calculateDiff(baseState, currentState);
      const shouldUseFull = serializer.shouldUseFullCheckpoint(baseState, diff);

      expect(shouldUseFull).toBe(false);
    });
  });

  describe('cloneState', () => {
    it('should create independent clone (REQ-CHECK-008)', () => {
      const original: AgentState = createTestState({
        variables: { data: [1, 2, 3] },
      });

      const clone = serializer.cloneState(original);

      // Modify clone
      (clone.variables.data as number[]).push(4);

      // Original should be unchanged
      expect((original.variables.data as number[])).toEqual([1, 2, 3]);
      expect((clone.variables.data as number[])).toEqual([1, 2, 3, 4]);
    });
  });

  describe('calculateStateSize', () => {
    it('should calculate correct size in bytes (REQ-CHECK-006)', () => {
      const state: AgentState = createTestState({
        messages: [
          { role: 'user', content: 'Hello', timestamp: new Date() },
        ],
        variables: { key: 'value' },
      });

      const size = serializer.calculateStateSize(state);

      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(1000); // Should be small
    });
  });
});
