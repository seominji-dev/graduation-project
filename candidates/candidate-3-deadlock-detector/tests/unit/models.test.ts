import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAgent,
  createResource,
  createWaitForEdge,
  createWaitForGraph,
  createDeadlockCycle,
  createDetectionResult,
  createRecoveryAction,
  AgentState,
  ResourceType,
  RecoveryActionType,
  RecoveryResult,
} from '../../src/domain/models';

describe('Domain Models', () => {
  describe('createAgent', () => {
    it('should create an agent with default values', () => {
      const agent = createAgent('test-agent');
      
      expect(agent.id).toBeDefined();
      expect(agent.name).toBe('test-agent');
      expect(agent.state).toBe(AgentState.ACTIVE);
      expect(agent.heldResources).toEqual([]);
      expect(agent.waitingFor).toBeNull();
      expect(agent.priority).toBe(5);
    });

    it('should create an agent with custom priority', () => {
      const agent = createAgent('priority-agent', 10);
      
      expect(agent.priority).toBe(10);
    });

    it('should have valid timestamps', () => {
      const agent = createAgent('timestamp-agent');
      
      expect(agent.createdAt).toBeInstanceOf(Date);
      expect(agent.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('createResource', () => {
    it('should create a resource with default values', () => {
      const resource = createResource('test-resource');
      
      expect(resource.id).toBeDefined();
      expect(resource.name).toBe('test-resource');
      expect(resource.type).toBe(ResourceType.CUSTOM);
      expect(resource.heldBy).toBeNull();
      expect(resource.waitQueue).toEqual([]);
      expect(resource.totalInstances).toBe(1);
    });

    it('should create a resource with custom type', () => {
      const resource = createResource('cpu-resource', ResourceType.COMPUTATIONAL);
      
      expect(resource.type).toBe(ResourceType.COMPUTATIONAL);
    });

    it('should create a resource with multiple instances', () => {
      const resource = createResource('multi-resource', ResourceType.MEMORY, 5);
      
      expect(resource.totalInstances).toBe(5);
    });
  });

  describe('createWaitForEdge', () => {
    it('should create a wait-for edge', () => {
      const edge = createWaitForEdge('agent-1', 'agent-2', 'resource-1');
      
      expect(edge.id).toBeDefined();
      expect(edge.fromAgentId).toBe('agent-1');
      expect(edge.toAgentId).toBe('agent-2');
      expect(edge.resourceId).toBe('resource-1');
      expect(edge.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('createWaitForGraph', () => {
    it('should create an empty wait-for graph', () => {
      const graph = createWaitForGraph();
      
      expect(graph.agents).toBeInstanceOf(Map);
      expect(graph.agents.size).toBe(0);
      expect(graph.resources).toBeInstanceOf(Map);
      expect(graph.resources.size).toBe(0);
      expect(graph.edges).toEqual([]);
      expect(graph.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('createDeadlockCycle', () => {
    it('should create a deadlock cycle', () => {
      const agentIds = ['agent-1', 'agent-2', 'agent-3'];
      const edges = [
        createWaitForEdge('agent-1', 'agent-2', 'r1'),
        createWaitForEdge('agent-2', 'agent-3', 'r2'),
        createWaitForEdge('agent-3', 'agent-1', 'r3'),
      ];
      
      const cycle = createDeadlockCycle(agentIds, edges);
      
      expect(cycle.id).toBeDefined();
      expect(cycle.agentIds).toEqual(agentIds);
      expect(cycle.edges).toEqual(edges);
      expect(cycle.detectedAt).toBeInstanceOf(Date);
    });
  });

  describe('createDetectionResult', () => {
    it('should create detection result for no deadlock', () => {
      const result = createDetectionResult(false, []);
      
      expect(result.hasDeadlock).toBe(false);
      expect(result.cycles).toEqual([]);
      expect(result.affectedAgents).toBe(0);
      expect(result.detectedAt).toBeInstanceOf(Date);
    });

    it('should count affected agents correctly', () => {
      const agentIds1 = ['agent-1', 'agent-2'];
      const agentIds2 = ['agent-2', 'agent-3'];
      
      const cycles = [
        createDeadlockCycle(agentIds1, []),
        createDeadlockCycle(agentIds2, []),
      ];
      
      const result = createDetectionResult(true, cycles);
      
      expect(result.hasDeadlock).toBe(true);
      expect(result.cycles).toHaveLength(2);
      expect(result.affectedAgents).toBe(3); // agent-1, agent-2, agent-3
    });
  });

  describe('createRecoveryAction', () => {
    it('should create a recovery action with default values', () => {
      const action = createRecoveryAction(
        RecoveryActionType.TERMINATE,
        'agent-1',
        ['resource-1'],
        RecoveryResult.SUCCESS
      );
      
      expect(action.type).toBe(RecoveryActionType.TERMINATE);
      expect(action.agentId).toBe('agent-1');
      expect(action.resourcesReleased).toEqual(['resource-1']);
      expect(action.result).toBe(RecoveryResult.SUCCESS);
      expect(action.timestamp).toBeInstanceOf(Date);
    });
  });
});
