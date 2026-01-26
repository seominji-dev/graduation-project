import { describe, it, expect, beforeEach } from 'vitest';
import { createWaitForGraph, createAgent, createResource, createWaitForEdge, AgentState } from '../../src/domain/models';
import { CycleDetector } from '../../src/detectors/CycleDetector';
import { VictimSelector, VictimSelectionStrategy } from '../../src/recovery/VictimSelector';
import { RollbackManager } from '../../src/recovery/RollbackManager';

describe('Deadlock Detection Integration', () => {
  describe('Simple 2-Agent Deadlock', () => {
    let graph: ReturnType<typeof createWaitForGraph>;
    let agent1: ReturnType<typeof createAgent>;
    let agent2: ReturnType<typeof createAgent>;
    let resource1: ReturnType<typeof createResource>;
    let resource2: ReturnType<typeof createResource>;

    beforeEach(() => {
      graph = createWaitForGraph();

      agent1 = createAgent('Agent-1', 5);
      agent2 = createAgent('Agent-2', 5);

      resource1 = createResource('Resource-1');
      resource2 = createResource('Resource-2');

      graph.agents.set(agent1.id, agent1);
      graph.agents.set(agent2.id, agent2);
      graph.resources.set(resource1.id, resource1);
      graph.resources.set(resource2.id, resource2);

      // Setup deadlock: Agent1 holds R1, waits for R2 (held by Agent2)
      // Agent2 holds R2, waits for R1 (held by Agent1)
      resource1.heldBy = agent1.id;
      resource2.heldBy = agent2.id;

      agent1.heldResources.push(resource1.id);
      agent2.heldResources.push(resource2.id);

      agent1.waitingFor = resource2.id;
      agent2.waitingFor = resource1.id;

      agent1.state = AgentState.WAITING;
      agent2.state = AgentState.WAITING;

      // Create wait-for edges for the graph
      const edge1 = createWaitForEdge(agent1.id, agent2.id, resource2.id);
      const edge2 = createWaitForEdge(agent2.id, agent1.id, resource1.id);
      graph.edges.push(edge1, edge2);
    });

    it('should detect deadlock between 2 agents', () => {
      const detector = new CycleDetector(graph);
      const cycles = detector.detect();

      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should select victim for recovery', () => {
      const detector = new CycleDetector(graph);
      const cycles = detector.detect();

      const selector = new VictimSelector(VictimSelectionStrategy.LOWEST_PRIORITY);
      const cycle = cycles[0];

      if (cycle) {
        const result = selector.selectVictim(cycle, graph.agents);

        expect(result.victim).toBeDefined();
        expect(result.actionType).toBeDefined();
      }
    });

    it('should recover from deadlock using rollback', () => {
      const detector = new CycleDetector(graph);
      const cycles = detector.detect();

      const rollbackManager = new RollbackManager();

      // Create checkpoints before deadlock
      rollbackManager.createCheckpoint(agent1);
      rollbackManager.createCheckpoint(agent2);

      const selector = new VictimSelector();
      const cycle = cycles[0];

      if (cycle) {
        const victim = selector.selectVictim(cycle, graph.agents);

        // Rollback victim
        const result = rollbackManager.rollbackToLatest(
          victim.victim.id,
          graph.agents,
          graph.resources,
        );

        expect(result.success).toBe(true);
      }
    });
  });

  describe('Complex 3-Agent Circular Wait', () => {
    let graph: ReturnType<typeof createWaitForGraph>;

    beforeEach(() => {
      graph = createWaitForGraph();

      // Create 3 agents and 3 resources
      const agents: ReturnType<typeof createAgent>[] = [];
      const resources: ReturnType<typeof createResource>[] = [];

      for (let i = 1; i <= 3; i++) {
        const agent = createAgent(`Agent-${i}`, i * 2);
        const resource = createResource(`Resource-${i}`);

        agents.push(agent);
        resources.push(resource);

        graph.agents.set(agent.id, agent);
        graph.resources.set(resource.id, resource);
      }

      // Circular wait: Agent1 -> Agent2 -> Agent3 -> Agent1
      for (let i = 0; i < 3; i++) {
        const agent = agents[i];
        const resource = resources[i];
        const nextResource = resources[(i + 1) % 3];
        const nextAgent = agents[(i + 1) % 3];

        resource.heldBy = agent.id;
        agent.heldResources.push(resource.id);
        agent.waitingFor = nextResource.id;
        agent.state = AgentState.WAITING;

        nextResource.heldBy = nextAgent.id;

        // Create wait-for edge
        const edge = createWaitForEdge(agent.id, nextAgent.id, nextResource.id);
        graph.edges.push(edge);
      }
    });

    it('should detect circular deadlock of 3 agents', () => {
      const detector = new CycleDetector(graph);
      const cycles = detector.detect();

      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0].agentIds).toHaveLength(3);
    });

    it('should identify all 3 agents as deadlocked', () => {
      const detector = new CycleDetector(graph);
      detector.detect();

      const deadlockedAgents = detector.getDeadlockedAgents();

      expect(deadlockedAgents.size).toBe(3);
    });
  });

  describe('No Deadlock Scenario', () => {
    let graph: ReturnType<typeof createWaitForGraph>;

    beforeEach(() => {
      graph = createWaitForGraph();

      const agent1 = createAgent('Worker-1', 5);
      const agent2 = createAgent('Worker-2', 5);
      const agent3 = createAgent('Worker-3', 5);

      const r1 = createResource('R1');
      const r2 = createResource('R2');
      const r3 = createResource('R3');
      const r4 = createResource('R4'); // Free resource

      graph.agents.set(agent1.id, agent1);
      graph.agents.set(agent2.id, agent2);
      graph.agents.set(agent3.id, agent3);

      graph.resources.set(r1.id, r1);
      graph.resources.set(r2.id, r2);
      graph.resources.set(r3.id, r3);
      graph.resources.set(r4.id, r4);

      // Agent1 holds R1, working (no wait)
      r1.heldBy = agent1.id;
      agent1.heldResources.push(r1.id);

      // Agent2 holds R2, working (no wait)
      r2.heldBy = agent2.id;
      agent2.heldResources.push(r2.id);

      // Agent3 holds R3, wants R4 (which is free)
      // Since R4 is free, Agent3 can get it immediately - no deadlock
      r3.heldBy = agent3.id;
      agent3.heldResources.push(r3.id);
      r4.heldBy = agent3.id;
      agent3.heldResources.push(r4.id);
    });

    it('should not detect deadlock when no cycle exists', () => {
      const detector = new CycleDetector(graph);
      const cycles = detector.detect();

      expect(cycles).toHaveLength(0);
    });

    it('should have zero deadlocked agents', () => {
      const detector = new CycleDetector(graph);
      detector.detect();

      const deadlockedAgents = detector.getDeadlockedAgents();

      expect(deadlockedAgents.size).toBe(0);
    });
  });
});
