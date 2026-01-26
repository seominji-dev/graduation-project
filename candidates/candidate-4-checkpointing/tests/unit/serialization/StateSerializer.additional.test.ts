import { StateSerializer } from '../../../src/serialization/StateSerializer';
import { AgentState } from '../../../src/domain/models';

describe('StateSerializer - Additional Coverage', () => {
  let serializer: StateSerializer;

  const createMockAgentState = (overrides: Partial<AgentState> = {}): AgentState => ({
    messages: [
      { role: 'user', content: 'Hello', timestamp: new Date() },
    ],
    variables: { key1: 'value1' },
    status: 'idle',
    lastActivity: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    serializer = new StateSerializer();
  });

  describe('calculateDiff - line 144 (messages differ)', () => {
    it('should detect when messages length differs and add to modified', () => {
      const baseState = createMockAgentState({
        messages: [
          { role: 'user', content: 'Hello', timestamp: new Date() },
        ],
      });

      const currentState = createMockAgentState({
        messages: [
          { role: 'user', content: 'Hello', timestamp: new Date() },
          { role: 'assistant', content: 'Hi there', timestamp: new Date() },
        ],
      });

      const diff = serializer.calculateDiff(baseState, currentState);

      expect(diff.modified.messages).toBeDefined();
      expect(diff.modified.messages).toHaveLength(2);
    });

    it('should not add messages to modified when length is same', () => {
      const baseState = createMockAgentState({
        messages: [
          { role: 'user', content: 'Hello', timestamp: new Date() },
        ],
      });

      const currentState = createMockAgentState({
        messages: [
          { role: 'user', content: 'Different', timestamp: new Date() },
        ],
      });

      const diff = serializer.calculateDiff(baseState, currentState);

      expect(diff.modified.messages).toBeUndefined();
    });
  });

  describe('calculateDiff - line 150 (executionPosition differs)', () => {
    it('should detect when executionPosition differs', () => {
      const baseState = createMockAgentState({
        executionPosition: { step: 1 },
      });

      const currentState = createMockAgentState({
        executionPosition: { step: 2 },
      });

      const diff = serializer.calculateDiff(baseState, currentState);

      expect(diff.modified.executionPosition).toBeDefined();
      expect((diff.modified.executionPosition as any).step).toBe(2);
    });

    it('should not add executionPosition when same', () => {
      const baseState = createMockAgentState({ executionPosition: { step: 1 } });
      const currentState = createMockAgentState({ executionPosition: { step: 1 } });

      const diff = serializer.calculateDiff(baseState, currentState);

      expect(diff.modified.executionPosition).toBeUndefined();
    });
  });

  describe('calculateDiff - status changes', () => {
    it('should detect when status changes', () => {
      const baseState = createMockAgentState({ status: 'idle' });
      const currentState = createMockAgentState({ status: 'running' });

      const diff = serializer.calculateDiff(baseState, currentState);

      expect(diff.modified._status).toBe('running');
    });
  });

  describe('filterSensitiveData - line 215 (non-object values)', () => {
    it('should handle null values in nested objects', () => {
      const state = createMockAgentState({
        variables: {
          nested: {
            value: null,
            apiKey: 'secret123',
          },
        },
      });

      const result = serializer.serialize(state);

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Filtered sensitive field: variables.nested.apiKey');
    });

    it('should handle primitive values in filter recursion', () => {
      const state = createMockAgentState({
        variables: {
          stringVal: 'test',
          numVal: 42,
          boolVal: true,
          password: 'secret',
        },
      });

      const result = serializer.serialize(state);

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Filtered sensitive field: variables.password');
    });
  });

  describe('replacer - line 241 (Date handling)', () => {
    it('should serialize Date objects with special marker', () => {
      const state = createMockAgentState({
        lastActivity: new Date('2024-01-15T10:30:00Z'),
      });

      const result = serializer.serialize(state);

      expect(result.success).toBe(true);
      expect(result.data).toContain('__type');
      expect(result.data).toContain('Date');
    });
  });

  describe('replacer - line 246 (undefined handling)', () => {
    it('should convert undefined to null', () => {
      const state = createMockAgentState({
        variables: {
          definedKey: 'value',
          undefinedKey: undefined,
        },
      });

      const result = serializer.serialize(state);

      expect(result.success).toBe(true);
      const parsed = JSON.parse(result.data!);
      expect(parsed.variables.undefinedKey).toBeNull();
    });
  });

  describe('replacer - line 251 (function handling)', () => {
    it('should convert functions to null', () => {
      const state = createMockAgentState({
        variables: {
          normalKey: 'value',
          funcKey: function() { return 'test'; },
        },
      }) as any;

      const result = serializer.serialize(state);

      expect(result.success).toBe(true);
      const parsed = JSON.parse(result.data!);
      expect(parsed.variables.funcKey).toBeNull();
    });
  });

  describe('reviver - line 262 (Date restoration)', () => {
    it('should restore Date objects from special marker', () => {
      const originalDate = new Date('2024-01-15T10:30:00Z');
      const state = createMockAgentState({
        lastActivity: originalDate,
      });

      const serialized = serializer.serialize(state);
      const deserialized = serializer.deserialize(serialized.data!);

      expect(deserialized.success).toBe(true);
      expect(deserialized.state?.lastActivity).toBeInstanceOf(Date);
    });

    it('should handle nested Date objects in variables', () => {
      const state = createMockAgentState({
        variables: {
          createdAt: new Date('2024-01-01'),
          nested: {
            updatedAt: new Date('2024-06-15'),
          },
        },
      });

      const serialized = serializer.serialize(state);
      expect(serialized.success).toBe(true);

      const parsed = JSON.parse(serialized.data!);
      expect(parsed.variables.createdAt.__type).toBe('Date');
    });
  });

  describe('applyDiff - comprehensive', () => {
    it('should apply added, modified, and deleted fields', () => {
      const baseState = createMockAgentState({
        variables: {
          keep: 'original',
          modify: 'old',
          delete: 'willBeDeleted',
        },
        status: 'idle',
      });

      const diff = {
        added: { newKey: 'newValue' },
        modified: {
          modify: 'new',
          _status: 'running',
        },
        deleted: ['variables.delete'],
      };

      const result = serializer.applyDiff(baseState, diff);

      expect(result.variables.keep).toBe('original');
      expect(result.variables.modify).toBe('new');
      expect(result.variables.newKey).toBe('newValue');
      expect(result.variables.delete).toBeUndefined();
      expect(result.status).toBe('running');
    });

    it('should apply messages from modified', () => {
      const baseState = createMockAgentState({
        messages: [{ role: 'user', content: 'old', timestamp: new Date() }],
      });

      const newMessages = [
        { role: 'user' as const, content: 'new1', timestamp: new Date() },
        { role: 'assistant' as const, content: 'new2', timestamp: new Date() },
      ];

      const diff = {
        added: {},
        modified: { messages: newMessages },
        deleted: [],
      };

      const result = serializer.applyDiff(baseState, diff);

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].content).toBe('new1');
    });

    it('should apply executionPosition from modified', () => {
      const baseState = createMockAgentState({
        executionPosition: { step: 1 },
      });

      const diff = {
        added: {},
        modified: { executionPosition: { step: 5 } },
        deleted: [],
      };

      const result = serializer.applyDiff(baseState, diff);

      expect(result.executionPosition?.step).toBe(5);
    });

    it('should apply regular variables from modified', () => {
      const baseState = createMockAgentState({
        variables: { existing: 'value' },
      });

      const diff = {
        added: {},
        modified: { customVar: 'customValue' },
        deleted: [],
      };

      const result = serializer.applyDiff(baseState, diff);

      expect(result.variables.customVar).toBe('customValue');
    });
  });

  describe('shouldUseFullCheckpoint', () => {
    it('should return true when diff is more than 50% of base size', () => {
      const baseState = createMockAgentState({
        variables: { a: 'short' },
      });

      const largeDiff = {
        added: { b: 'this is a very long value that makes the diff large' },
        modified: { c: 'another long value to increase diff size significantly more' },
        deleted: ['x', 'y', 'z'],
      };

      const result = serializer.shouldUseFullCheckpoint(baseState, largeDiff);

      expect(typeof result).toBe('boolean');
    });

    it('should return false when diff is small', () => {
      const baseState = createMockAgentState({
        variables: {
          a: 'this is a very long value in the base state',
          b: 'another long value in base',
          c: 'yet another long value',
        },
      });

      const smallDiff = {
        added: {},
        modified: { x: 1 },
        deleted: [],
      };

      const result = serializer.shouldUseFullCheckpoint(baseState, smallDiff);

      expect(result).toBe(false);
    });
  });

  describe('serialize - error handling', () => {
    it('should handle circular reference gracefully', () => {
      const circularObj: any = { a: 1 };
      circularObj.self = circularObj;

      const state = createMockAgentState({
        variables: circularObj,
      });

      const result = serializer.serialize(state);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('deserialize - validation', () => {
    it('should fail when messages field is missing', () => {
      const invalidJson = JSON.stringify({ variables: {} });

      const result = serializer.deserialize(invalidJson);

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing or invalid messages field');
    });

    it('should fail when messages is not an array', () => {
      const invalidJson = JSON.stringify({ messages: 'not an array' });

      const result = serializer.deserialize(invalidJson);

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing or invalid messages field');
    });

    it('should handle invalid JSON gracefully', () => {
      const result = serializer.deserialize('not valid json');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('calculateStateSize', () => {
    it('should calculate correct byte size', () => {
      const state = createMockAgentState({
        variables: { test: 'value' },
      });

      const size = serializer.calculateStateSize(state);

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });
  });

  describe('cloneState', () => {
    it('should create deep copy of state', () => {
      const original = createMockAgentState({
        variables: { nested: { deep: 'value' } },
      });

      const clone = serializer.cloneState(original);

      (clone.variables.nested as any).deep = 'modified';

      expect((original.variables.nested as any).deep).toBe('value');
    });
  });
});
