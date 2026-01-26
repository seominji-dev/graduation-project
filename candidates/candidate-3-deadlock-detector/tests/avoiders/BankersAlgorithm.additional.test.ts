import { describe, it, expect, beforeEach } from 'vitest';
import { BankersAlgorithm } from '../../src/avoiders/BankersAlgorithm';
import { createAgent, createResource, AgentState } from '../../src/domain/models';

describe('BankersAlgorithm - Additional Coverage', () => {
  let banker: BankersAlgorithm;

  beforeEach(() => {
    banker = new BankersAlgorithm();
  });

  describe('requestAllocation - edge cases', () => {
    it('should handle request exceeding total instances', () => {
      const agent = createAgent('Agent-1');
      const resource = createResource('Resource-1');
      resource.totalInstances = 2;

      banker.addAgent(agent);
      banker.addResource(resource);

      const request = banker.createRequest(agent.id, resource.id, 5);
      const result = banker.requestAllocation(request);

      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Request exceeds total resource instances');
    });

    it('should add agent to wait queue when request is unsafe', () => {
      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');
      const resource = createResource('Resource-1');

      banker.addAgent(agent1);
      banker.addAgent(agent2);
      banker.addResource(resource);

      // Agent 1 holds the resource
      const request1 = banker.createRequest(agent1.id, resource.id, 1);
      banker.requestAllocation(request1);

      // Agent 2 requests same resource - should be queued
      const request2 = banker.createRequest(agent2.id, resource.id, 1);
      const result = banker.requestAllocation(request2);

      expect(result.granted).toBe(false);
      
      const agents = banker.getAgents();
      const resources = banker.getResources();
      
      expect(agents.get(agent2.id)?.state).toBe(AgentState.WAITING);
      expect(agents.get(agent2.id)?.waitingFor).toBe(resource.id);
      expect(resources.get(resource.id)?.waitQueue).toContain(agent2.id);
    });

    it('should not add duplicate agent to wait queue', () => {
      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');
      const resource = createResource('Resource-1');

      banker.addAgent(agent1);
      banker.addAgent(agent2);
      banker.addResource(resource);

      // Agent 1 holds the resource
      const request1 = banker.createRequest(agent1.id, resource.id, 1);
      banker.requestAllocation(request1);

      // Agent 2 requests same resource twice
      const request2 = banker.createRequest(agent2.id, resource.id, 1);
      banker.requestAllocation(request2);
      banker.requestAllocation(request2);

      const resources = banker.getResources();
      const waitQueue = resources.get(resource.id)?.waitQueue || [];
      
      // Should only appear once in wait queue
      expect(waitQueue.filter(id => id === agent2.id).length).toBe(1);
    });
  });

  describe('releaseResources', () => {
    it('should return false when agent not found', () => {
      const result = banker.releaseResources('non-existent', ['r1']);
      expect(result).toBe(false);
    });

    it('should process wait queue after release', () => {
      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');
      const resource = createResource('Resource-1');

      banker.addAgent(agent1);
      banker.addAgent(agent2);
      banker.addResource(resource);

      // Agent 1 acquires resource
      const request1 = banker.createRequest(agent1.id, resource.id, 1);
      banker.requestAllocation(request1);

      // Agent 2 waits for resource
      const request2 = banker.createRequest(agent2.id, resource.id, 1);
      banker.requestAllocation(request2);

      // Agent 1 releases resource
      const result = banker.releaseResources(agent1.id, [resource.id]);

      expect(result).toBe(true);
      
      const agents = banker.getAgents();
      const resources = banker.getResources();

      // Agent 2 should now hold the resource
      expect(resources.get(resource.id)?.heldBy).toBe(agent2.id);
      expect(agents.get(agent2.id)?.state).toBe(AgentState.ACTIVE);
    });

    it('should handle wait queue with non-existent agent', () => {
      const agent1 = createAgent('Agent-1');
      const resource = createResource('Resource-1');

      banker.addAgent(agent1);
      banker.addResource(resource);

      // Manually add non-existent agent to wait queue
      const resources = banker.getResources();
      resources.get(resource.id)!.waitQueue.push('non-existent-agent');

      // Agent 1 acquires and releases resource
      const request = banker.createRequest(agent1.id, resource.id, 1);
      banker.requestAllocation(request);
      
      // This should process the wait queue and skip the non-existent agent
      const result = banker.releaseResources(agent1.id, [resource.id]);
      
      expect(result).toBe(true);
      // Resource should be free since the waiting agent doesn't exist
      expect(resources.get(resource.id)?.heldBy).toBeNull();
    });

    it('should remove agent from held resources', () => {
      const agent = createAgent('Agent-1');
      const resource = createResource('Resource-1');

      banker.addAgent(agent);
      banker.addResource(resource);

      // Acquire resource
      const result = banker.requestAllocation(banker.createRequest(agent.id, resource.id, 1));
      expect(result.granted).toBe(true);

      const agents = banker.getAgents();
      expect(agents.get(agent.id)?.heldResources).toContain(resource.id);
      
      // Release the resource
      banker.releaseResources(agent.id, [resource.id]);

      // Should no longer hold the resource
      expect(agents.get(agent.id)?.heldResources).not.toContain(resource.id);
      expect(agents.get(agent.id)?.heldResources).toHaveLength(0);
    });
  });

  describe('grantResource', () => {
    it('should remove agent from wait queue when granted', () => {
      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');
      const resource = createResource('Resource-1');

      banker.addAgent(agent1);
      banker.addAgent(agent2);
      banker.addResource(resource);

      // Add agent2 to wait queue manually
      const resources = banker.getResources();
      resources.get(resource.id)!.waitQueue.push(agent2.id);

      // Agent2 requests resource while in queue
      const request = banker.createRequest(agent2.id, resource.id, 1);
      const result = banker.requestAllocation(request);

      expect(result.granted).toBe(true);
      expect(resources.get(resource.id)?.waitQueue).not.toContain(agent2.id);
    });

    it('should not duplicate held resources', () => {
      const agent = createAgent('Agent-1');
      const resource = createResource('Resource-1');

      banker.addAgent(agent);
      banker.addResource(resource);

      // Request same resource twice
      banker.requestAllocation(banker.createRequest(agent.id, resource.id, 1));
      
      // Manually release and request again
      const resources = banker.getResources();
      resources.get(resource.id)!.heldBy = null;
      
      banker.requestAllocation(banker.createRequest(agent.id, resource.id, 1));

      const agents = banker.getAgents();
      // Should only have the resource once
      expect(agents.get(agent.id)?.heldResources.filter(r => r === resource.id).length).toBe(1);
    });
  });

  describe('getSystemState', () => {
    it('should return correct system state with waiting agents', () => {
      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');
      const resource1 = createResource('Resource-1');
      const resource2 = createResource('Resource-2');

      banker.addAgent(agent1);
      banker.addAgent(agent2);
      banker.addResource(resource1);
      banker.addResource(resource2);

      // Agent 1 holds resource 1
      banker.requestAllocation(banker.createRequest(agent1.id, resource1.id, 1));
      
      // Agent 2 waits for resource 1
      banker.requestAllocation(banker.createRequest(agent2.id, resource1.id, 1));

      const state = banker.getSystemState();

      expect(state.totalAgents).toBe(2);
      expect(state.totalResources).toBe(2);
      expect(state.availableResources).toBe(1); // resource2 is free
      expect(state.waitingAgents).toBe(1); // agent2 is waiting
    });

    it('should return correct state with no agents or resources', () => {
      const state = banker.getSystemState();

      expect(state.totalAgents).toBe(0);
      expect(state.totalResources).toBe(0);
      expect(state.availableResources).toBe(0);
      expect(state.waitingAgents).toBe(0);
      expect(state.isSafe).toBe(true);
    });
  });

  describe('checkSafety', () => {
    it('should delegate to SafetyChecker', () => {
      const agent = createAgent('Agent-1');
      const resource = createResource('Resource-1');

      banker.addAgent(agent);
      banker.addResource(resource);

      const result = banker.checkSafety();

      expect(result).toBeDefined();
      expect(result.isSafe).toBeDefined();
      expect(result.safeSequence).toBeDefined();
    });
  });
});
