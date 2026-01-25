import { describe, it, expect, beforeEach } from 'vitest';
import { BankersAlgorithm } from '../../src/avoiders/BankersAlgorithm';
import { SafetyChecker } from '../../src/avoiders/SafetyChecker';
import { createAgent, createResource, ResourceType } from '../../src/domain/models';

describe('SafetyChecker', () => {
  let agents: Map<string, ReturnType<typeof createAgent>>;
  let resources: Map<string, ReturnType<typeof createResource>>;
  let checker: SafetyChecker;

  beforeEach(() => {
    agents = new Map();
    resources = new Map();

    const agent1 = createAgent('Agent-1', 5);
    const agent2 = createAgent('Agent-2', 5);

    const resource1 = createResource('R1', ResourceType.COMPUTATIONAL, 1);
    const resource2 = createResource('R2', ResourceType.COMPUTATIONAL, 1);

    agents.set(agent1.id, agent1);
    agents.set(agent2.id, agent2);

    resources.set(resource1.id, resource1);
    resources.set(resource2.id, resource2);

    checker = new SafetyChecker(agents, resources);
  });

  describe('Safety State Detection', () => {
    it('should detect safe state when no resources held', () => {
      const result = checker.checkSafety();

      expect(result.isSafe).toBe(true);
    });

    it('should produce safe sequence', () => {
      const result = checker.checkSafety();

      expect(result.safeSequence).not.toHaveLength(0);
    });
  });

  describe('Request Safety Validation', () => {
    it('should validate safe requests', () => {
      const agent = Array.from(agents.values())[0];
      const resource = Array.from(resources.values())[0];

      const request = checker.createRequest(agent.id, resource.id, 1);

      const isSafe = checker.isRequestSafe(request);

      expect(typeof isSafe).toBe('boolean');
    });
  });
});

describe('BankersAlgorithm', () => {
  let bankers: BankersAlgorithm;

  beforeEach(() => {
    bankers = new BankersAlgorithm();
  });

  describe('System Setup', () => {
    it('should add agents to the system', () => {
      const agent = createAgent('Test-Agent', 5);

      bankers.addAgent(agent);

      expect(bankers.getAgents().size).toBe(1);
    });

    it('should add resources to the system', () => {
      const resource = createResource('Test-Resource', ResourceType.COMPUTATIONAL, 2);

      bankers.addResource(resource);

      expect(bankers.getResources().size).toBe(1);
    });
  });

  describe('Resource Allocation', () => {
    let agent1: ReturnType<typeof createAgent>;
    let agent2: ReturnType<typeof createAgent>;
    let resource: ReturnType<typeof createResource>;

    beforeEach(() => {
      agent1 = createAgent('Agent-1', 5);
      agent2 = createAgent('Agent-2', 5);
      resource = createResource('Shared-Resource', ResourceType.COMPUTATIONAL, 1);

      bankers.addAgent(agent1);
      bankers.addAgent(agent2);
      bankers.addResource(resource);
    });

    it('should grant request when resource is free', () => {
      const request = bankers.createRequest(agent1.id, resource.id, 1);

      const result = bankers.requestAllocation(request);

      expect(result.granted).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should deny request when granting would be unsafe', () => {
      // First agent holds the resource
      resource.heldBy = agent1.id;
      agent1.heldResources.push(resource.id);

      // Second agent requests the same resource
      const request = bankers.createRequest(agent2.id, resource.id, 1);

      const result = bankers.requestAllocation(request);

      expect(result.granted).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should put agent in waiting state when request denied', () => {
      resource.heldBy = agent1.id;
      agent1.heldResources.push(resource.id);

      const request = bankers.createRequest(agent2.id, resource.id, 1);

      bankers.requestAllocation(request);

      const updatedAgent = bankers.getAgents().get(agent2.id);
      expect(updatedAgent?.state).toBe('waiting');
    });
  });

  describe('Resource Release', () => {
    let agent: ReturnType<typeof createAgent>;
    let resource: ReturnType<typeof createResource>;

    beforeEach(() => {
      agent = createAgent('Test-Agent', 5);
      resource = createResource('Test-Resource', ResourceType.COMPUTATIONAL, 1);

      bankers.addAgent(agent);
      bankers.addResource(resource);

      resource.heldBy = agent.id;
      agent.heldResources.push(resource.id);
    });

    it('should release held resource', () => {
      const success = bankers.releaseResources(agent.id, [resource.id]);

      expect(success).toBe(true);
      expect(resource.heldBy).toBeNull();
      expect(agent.heldResources).not.toContain(resource.id);
    });

    it('should fail when agent not found', () => {
      const success = bankers.releaseResources('non-existent', [resource.id]);

      expect(success).toBe(false);
    });
  });

  describe('Safety Checking', () => {
    it('should check system safety', () => {
      const result = bankers.checkSafety();

      expect(result).toBeDefined();
      expect(typeof result.isSafe).toBe('boolean');
    });
  });

  describe('System State', () => {
    it('should return system state summary', () => {
      const agent1 = createAgent('Agent-1', 5);
      const resource1 = createResource('R1', ResourceType.COMPUTATIONAL, 1);

      bankers.addAgent(agent1);
      bankers.addResource(resource1);

      const state = bankers.getSystemState();

      expect(state.totalAgents).toBe(1);
      expect(state.totalResources).toBe(1);
      expect(state.availableResources).toBe(1);
      expect(state.waitingAgents).toBe(0);
    });
  });

  describe('Request Creation', () => {
    it('should create resource request', () => {
      const agent = createAgent('Agent-1', 5);
      const resource = createResource('R1', ResourceType.COMPUTATIONAL, 1);

      bankers.addAgent(agent);
      bankers.addResource(resource);

      const request = bankers.createRequest(agent.id, resource.id, 1);

      expect(request.agentId).toBe(agent.id);
      expect(request.resourceId).toBe(resource.id);
      expect(request.requestCount).toBe(1);
    });
  });
});
