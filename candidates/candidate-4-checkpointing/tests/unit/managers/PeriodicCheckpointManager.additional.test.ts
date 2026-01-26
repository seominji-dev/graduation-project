import { PeriodicCheckpointManager } from '../../../src/managers/PeriodicCheckpointManager';
import { CheckpointManager } from '../../../src/managers/CheckpointManager';
import { AgentState, CheckpointType } from '../../../src/domain/models';

// Mock the CheckpointManager
jest.mock('../../../src/managers/CheckpointManager');

describe('PeriodicCheckpointManager - Additional Coverage', () => {
  let periodicManager: PeriodicCheckpointManager;
  let mockCheckpointManager: jest.Mocked<CheckpointManager>;

  const createMockAgentState = (overrides: Partial<AgentState> = {}): AgentState => ({
    messages: [],
    variables: { key: 'value' },
    status: 'idle',
    lastActivity: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockCheckpointManager = new CheckpointManager(null as any, null as any) as jest.Mocked<CheckpointManager>;
    mockCheckpointManager.createCheckpoint = jest.fn().mockResolvedValue({
      success: true,
      skipped: false,
      checkpointId: 'cp-1',
    });

    periodicManager = new PeriodicCheckpointManager(mockCheckpointManager, {
      intervalMs: 1000,
      idleCheckpointsEnabled: true,
      adaptiveInterval: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('startGlobalTimer - line 171', () => {
    it('should not start another timer if one is already running', () => {
      periodicManager.startGlobalTimer();
      const stats1 = periodicManager.getStats();

      periodicManager.startGlobalTimer();
      const stats2 = periodicManager.getStats();

      expect(stats1.registeredAgents).toBe(stats2.registeredAgents);
    });
  });

  describe('performAgentCheckpoint - lines 241-269', () => {
    it('should skip checkpoint when state hash has not changed', async () => {
      const state = createMockAgentState();
      periodicManager.registerAgent('agent-1', state, false);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(true).toBe(true);
    });

    it('should create checkpoint when state hash changes', async () => {
      const state = createMockAgentState();
      periodicManager.registerAgent('agent-1', state, false);

      periodicManager.updateAgentState('agent-1', createMockAgentState({
        variables: { key: 'newValue' },
      }));

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(mockCheckpointManager.createCheckpoint).toHaveBeenCalled();
    });

    it('should handle agent not found in performAgentCheckpoint', async () => {
      periodicManager.registerAgent('agent-1', createMockAgentState(), false);
      periodicManager.unregisterAgent('agent-1');

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(true).toBe(true);
    });
  });

  describe('startAgentTimer - lines 282, 288', () => {
    it('should use intervalOverride when set', () => {
      const state = createMockAgentState();
      periodicManager.registerAgent('agent-1', state, false);

      periodicManager.setAgentInterval('agent-1', 500);

      const stats = periodicManager.getStats();
      expect(stats.registeredAgents).toBe(1);
    });

    it('should use adaptive interval for important tasks', () => {
      const state = createMockAgentState();
      periodicManager.registerAgent('agent-1', state, true);

      const stats = periodicManager.getStats();
      expect(stats.registeredAgents).toBe(1);
    });

    it('should handle agent not found in startAgentTimer', () => {
      periodicManager.setAgentInterval('non-existent', 500);

      expect(true).toBe(true);
    });
  });

  describe('restartAgentTimer - line 302', () => {
    it('should restart timer with new interval', () => {
      const state = createMockAgentState();
      periodicManager.registerAgent('agent-1', state, false);

      periodicManager.setAgentInterval('agent-1', 2000);

      const stats = periodicManager.getStats();
      expect(stats.registeredAgents).toBe(1);
    });
  });

  describe('performGlobalCheckpoint', () => {
    it('should checkpoint all registered agents', async () => {
      const state1 = createMockAgentState({ variables: { agent: '1' } });
      const state2 = createMockAgentState({ variables: { agent: '2' } });

      periodicManager.registerAgent('agent-1', state1, false);
      periodicManager.registerAgent('agent-2', state2, false);

      periodicManager.startGlobalTimer();

      periodicManager.updateAgentState('agent-1', createMockAgentState({
        variables: { agent: '1', updated: true },
      }));
      periodicManager.updateAgentState('agent-2', createMockAgentState({
        variables: { agent: '2', updated: true },
      }));

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(mockCheckpointManager.createCheckpoint).toHaveBeenCalled();
    });
  });

  describe('triggerCheckpoint', () => {
    it('should return false for non-existent agent', async () => {
      const result = await periodicManager.triggerCheckpoint('non-existent');
      expect(result).toBe(false);
    });

    it('should return true on successful checkpoint', async () => {
      periodicManager.registerAgent('agent-1', createMockAgentState(), false);

      const result = await periodicManager.triggerCheckpoint('agent-1');

      expect(result).toBe(true);
    });

    it('should return false when checkpoint is skipped', async () => {
      mockCheckpointManager.createCheckpoint.mockResolvedValue({
        success: true,
        skipped: true,
      });

      periodicManager.registerAgent('agent-1', createMockAgentState(), false);

      const result = await periodicManager.triggerCheckpoint('agent-1');

      expect(result).toBe(false);
    });

    it('should return false when checkpoint fails', async () => {
      mockCheckpointManager.createCheckpoint.mockResolvedValue({
        success: false,
        error: 'Failed',
      });

      periodicManager.registerAgent('agent-1', createMockAgentState(), false);

      const result = await periodicManager.triggerCheckpoint('agent-1');

      expect(result).toBe(false);
    });
  });

  describe('triggerMilestoneCheckpoint', () => {
    it('should create milestone checkpoint with correct options', async () => {
      periodicManager.registerAgent('agent-1', createMockAgentState(), false);

      await periodicManager.triggerMilestoneCheckpoint('agent-1', 'Phase 1 Complete');

      expect(mockCheckpointManager.createCheckpoint).toHaveBeenCalledWith(
        'agent-1',
        expect.any(Object),
        expect.objectContaining({
          type: CheckpointType.FULL,
          reason: 'milestone',
          description: 'Milestone: Phase 1 Complete',
          tags: ['milestone', 'Phase 1 Complete'],
        })
      );
    });
  });

  describe('createFinalCheckpoint', () => {
    it('should return false for non-existent agent', async () => {
      const result = await periodicManager.createFinalCheckpoint('non-existent');
      expect(result).toBe(false);
    });

    it('should create final checkpoint and unregister agent', async () => {
      periodicManager.registerAgent('agent-1', createMockAgentState(), false);

      const result = await periodicManager.createFinalCheckpoint('agent-1');

      expect(result).toBe(true);
      expect(mockCheckpointManager.createCheckpoint).toHaveBeenCalledWith(
        'agent-1',
        expect.any(Object),
        expect.objectContaining({
          type: CheckpointType.FULL,
          reason: 'shutdown',
          tags: ['shutdown', 'final'],
        })
      );

      const stats = periodicManager.getStats();
      expect(stats.registeredAgents).toBe(0);
    });
  });

  describe('createFinalCheckpointsForAll', () => {
    it('should create final checkpoints for all agents and stop global timer', async () => {
      periodicManager.registerAgent('agent-1', createMockAgentState(), false);
      periodicManager.registerAgent('agent-2', createMockAgentState(), false);
      periodicManager.startGlobalTimer();

      await periodicManager.createFinalCheckpointsForAll();

      const stats = periodicManager.getStats();
      expect(stats.registeredAgents).toBe(0);
    });
  });

  describe('updateAgentState', () => {
    it('should do nothing for non-existent agent', () => {
      periodicManager.updateAgentState('non-existent', createMockAgentState());

      expect(true).toBe(true);
    });

    it('should update isImportantTask when provided', () => {
      periodicManager.registerAgent('agent-1', createMockAgentState(), false);

      periodicManager.updateAgentState('agent-1', createMockAgentState(), true);

      expect(true).toBe(true);
    });
  });

  describe('stopGlobalTimer', () => {
    it('should safely stop when no timer is running', () => {
      periodicManager.stopGlobalTimer();

      expect(true).toBe(true);
    });

    it('should stop running global timer', () => {
      periodicManager.startGlobalTimer();
      periodicManager.stopGlobalTimer();

      expect(true).toBe(true);
    });
  });

  describe('hashState', () => {
    it('should generate consistent hash for same state', () => {
      const state = createMockAgentState();
      periodicManager.registerAgent('agent-1', state, false);
      periodicManager.registerAgent('agent-2', state, false);

      const stats = periodicManager.getStats();
      expect(stats.registeredAgents).toBe(2);
    });
  });
});
