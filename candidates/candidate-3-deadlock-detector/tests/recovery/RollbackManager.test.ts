import { describe, it, expect, beforeEach } from 'vitest';
import { RollbackManager } from '../../src/recovery/RollbackManager';
import { createAgent, createResource } from '../../src/domain/models';

describe('RollbackManager', () => {
  let manager: RollbackManager;
  let agent: ReturnType<typeof createAgent>;
  let resource: ReturnType<typeof createResource>;

  beforeEach(() => {
    manager = new RollbackManager(5);
    agent = createAgent('Test-Agent', 5);
    resource = createResource('Test-Resource');
  });

  describe('Checkpoint Creation', () => {
    it('should create a checkpoint for an agent', () => {
      const checkpoint = manager.createCheckpoint(agent);

      expect(checkpoint.id).toBeDefined();
      expect(checkpoint.agentId).toBe(agent.id);
      expect(checkpoint.heldResources).toEqual([]);
      expect(checkpoint.sequenceNumber).toBe(1);
    });

    it('should increment sequence numbers', () => {
      const cp1 = manager.createCheckpoint(agent);
      const cp2 = manager.createCheckpoint(agent);

      expect(cp1.sequenceNumber).toBe(1);
      expect(cp2.sequenceNumber).toBe(2);
    });

    it('should capture held resources at checkpoint', () => {
      agent.heldResources.push('resource-1', 'resource-2');

      const checkpoint = manager.createCheckpoint(agent);

      expect(checkpoint.heldResources).toEqual(['resource-1', 'resource-2']);
    });

    it('should limit checkpoints per agent', () => {
      manager = new RollbackManager(3);

      for (let i = 0; i < 10; i++) {
        manager.createCheckpoint(agent);
      }

      const checkpoints = manager.getCheckpoints(agent.id);

      expect(checkpoints.length).toBe(3);
    });
  });

  describe('Rollback Operations', () => {
    it('should rollback to latest checkpoint', () => {
      agent.heldResources.push('resource-1');
      manager.createCheckpoint(agent);

      agent.heldResources.push('resource-2');
      
      const agents = new Map([[agent.id, agent]]);
      const resources = new Map([[resource.id, resource]]);

      const result = manager.rollbackToLatest(agent.id, agents, resources);

      expect(result.success).toBe(true);
      expect(agent.heldResources).toEqual(['resource-1']);
    });

    it('should fail when agent not found', () => {
      const agents = new Map();
      const resources = new Map();

      const result = manager.rollback('non-existent', null, agents, resources);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Agent not found');
    });

    it('should fail when no checkpoints exist', () => {
      const agents = new Map([[agent.id, agent]]);
      const resources = new Map();

      const result = manager.rollbackToLatest(agent.id, agents, resources);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No checkpoints found for agent');
    });

    it('should release resources acquired after checkpoint', () => {
      const r1 = createResource('R1');
      const r2 = createResource('R2');

      agent.heldResources.push(r1.id);
      manager.createCheckpoint(agent);

      agent.heldResources.push(r2.id);
      r2.heldBy = agent.id;

      const agents = new Map([[agent.id, agent]]);
      const resources = new Map([
        [r1.id, r1],
        [r2.id, r2],
      ]);

      const result = manager.rollbackToLatest(agent.id, agents, resources);

      expect(result.success).toBe(true);
      expect(result.resourcesReleased).toContain(r2.id);
      expect(r2.heldBy).toBeNull();
    });
  });

  describe('Checkpoint Management', () => {
    it('should get checkpoints for an agent', () => {
      manager.createCheckpoint(agent);
      manager.createCheckpoint(agent);

      const checkpoints = manager.getCheckpoints(agent.id);

      expect(checkpoints).toHaveLength(2);
    });

    it('should get latest checkpoint', () => {
      const _cp1 = manager.createCheckpoint(agent);
      const cp2 = manager.createCheckpoint(agent);

      const latest = manager.getLatestCheckpoint(agent.id);

      expect(latest?.id).toBe(cp2.id);
    });

    it('should return null when no checkpoints exist', () => {
      const latest = manager.getLatestCheckpoint('non-existent');

      expect(latest).toBeNull();
    });

    it('should clear checkpoints for an agent', () => {
      manager.createCheckpoint(agent);
      manager.createCheckpoint(agent);

      manager.clearCheckpoints(agent.id);

      const checkpoints = manager.getCheckpoints(agent.id);

      expect(checkpoints).toHaveLength(0);
    });

    it('should clear all checkpoints', () => {
      const agent2 = createAgent('Agent-2');

      manager.createCheckpoint(agent);
      manager.createCheckpoint(agent2);

      manager.clearAllCheckpoints();

      expect(manager.getTotalCheckpointCount()).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should count total checkpoints', () => {
      const agent2 = createAgent('Agent-2');
      const agent3 = createAgent('Agent-3');

      manager.createCheckpoint(agent);
      manager.createCheckpoint(agent);
      manager.createCheckpoint(agent2);
      manager.createCheckpoint(agent3);

      expect(manager.getTotalCheckpointCount()).toBe(4);
    });
  });
});

describe('RollbackManager - Additional Coverage', () => {
  let manager: RollbackManager;
  let agent: ReturnType<typeof createAgent>;

  beforeEach(() => {
    manager = new RollbackManager(5);
    agent = createAgent('Test-Agent', 5);
  });

  describe('Rollback with specific checkpoint ID', () => {
    it('should fail when specific checkpoint ID does not exist', () => {
      // Create a checkpoint first
      manager.createCheckpoint(agent);
      
      const agents = new Map([[agent.id, agent]]);
      const resources = new Map();

      // Try to rollback to a checkpoint that doesn't exist
      const result = manager.rollback(agent.id, 'non-existent-cp-id', agents, resources);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Checkpoint not found');
      expect(result.checkpointId).toBe('non-existent-cp-id');
    });

    it('should rollback to a specific checkpoint by ID', () => {
      const r1 = createResource('R1');
      
      // First checkpoint with no resources
      const cp1 = manager.createCheckpoint(agent);
      
      // Acquire resource and create second checkpoint
      agent.heldResources.push(r1.id);
      r1.heldBy = agent.id;
      const cp2 = manager.createCheckpoint(agent);
      
      // Acquire more state change
      agent.heldResources.push('R2');
      
      const agents = new Map([[agent.id, agent]]);
      const resources = new Map([[r1.id, r1]]);

      // Rollback to first checkpoint (no resources)
      const result = manager.rollback(agent.id, cp1.id, agents, resources);

      expect(result.success).toBe(true);
      expect(result.checkpointId).toBe(cp1.id);
      expect(agent.heldResources).toEqual([]);
    });
  });

  describe('createRecoveryActionResult static method', () => {
    it('should create recovery action from successful rollback result', () => {
      const rollbackResult = {
        success: true,
        agentId: 'agent-1',
        checkpointId: 'cp-1',
        resourcesReleased: ['r1', 'r2'],
        timestamp: new Date(),
      };

      const action = RollbackManager.createRecoveryActionResult(rollbackResult);

      expect(action.agentId).toBe('agent-1');
      expect(action.resourcesReleased).toEqual(['r1', 'r2']);
      expect(action.result).toBe('success');
    });

    it('should create recovery action from failed rollback result', () => {
      const rollbackResult = {
        success: false,
        agentId: 'agent-1',
        checkpointId: 'cp-1',
        resourcesReleased: [],
        timestamp: new Date(),
        error: 'Agent not found',
      };

      const action = RollbackManager.createRecoveryActionResult(rollbackResult);

      expect(action.agentId).toBe('agent-1');
      expect(action.result).toBe('failed');
    });
  });

  describe('Edge cases', () => {
    it('should handle agent with empty checkpoints array explicitly', () => {
      const agents = new Map([[agent.id, agent]]);
      const resources = new Map();

      // No checkpoints created
      const result = manager.rollbackToLatest(agent.id, agents, resources);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No checkpoints found for agent');
    });

    it('should properly clear checkpoints and sequence', () => {
      manager.createCheckpoint(agent);
      manager.createCheckpoint(agent);
      
      expect(manager.getCheckpoints(agent.id)).toHaveLength(2);
      
      manager.clearCheckpoints(agent.id);
      
      expect(manager.getCheckpoints(agent.id)).toHaveLength(0);
      
      // Create new checkpoint after clearing - should start from sequence 1
      const newCp = manager.createCheckpoint(agent);
      expect(newCp.sequenceNumber).toBe(1);
    });

    it('should handle multiple agents correctly', () => {
      const agent2 = createAgent('Agent-2');
      const agent3 = createAgent('Agent-3');
      
      manager.createCheckpoint(agent);
      manager.createCheckpoint(agent);
      manager.createCheckpoint(agent2);
      manager.createCheckpoint(agent3);
      manager.createCheckpoint(agent3);
      manager.createCheckpoint(agent3);
      
      expect(manager.getTotalCheckpointCount()).toBe(6);
      
      manager.clearCheckpoints(agent2.id);
      
      expect(manager.getTotalCheckpointCount()).toBe(5);
      expect(manager.getCheckpoints(agent2.id)).toHaveLength(0);
      expect(manager.getCheckpoints(agent.id)).toHaveLength(2);
      expect(manager.getCheckpoints(agent3.id)).toHaveLength(3);
    });
  });
});
