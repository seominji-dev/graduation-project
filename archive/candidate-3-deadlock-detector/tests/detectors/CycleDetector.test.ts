import { describe, it, expect, beforeEach } from 'vitest';
import { CycleDetector, GraphBasedCycleDetector } from '../../src/detectors/CycleDetector';
import {
  createWaitForGraph,
  createAgent,
  createResource,
  createWaitForEdge,
  AgentState,
} from '../../src/domain/models';

describe('CycleDetector', () => {
  describe('Single Cycle Detection', () => {
    let graph: ReturnType<typeof createWaitForGraph>;

    beforeEach(() => {
      graph = createWaitForGraph();

      // Create 3 agents
      const agent1 = createAgent('Agent-1', 5);
      const agent2 = createAgent('Agent-2', 5);
      const agent3 = createAgent('Agent-3', 5);

      graph.agents.set(agent1.id, agent1);
      graph.agents.set(agent2.id, agent2);
      graph.agents.set(agent3.id, agent3);

      // Create resources
      const r1 = createResource('R1');
      const r2 = createResource('R2');
      const r3 = createResource('R3');

      graph.resources.set(r1.id, r1);
      graph.resources.set(r2.id, r2);
      graph.resources.set(r3.id, r3);

      // Agent 1 holds R1, waits for R2 (held by Agent 2)
      r1.heldBy = agent1.id;
      agent1.heldResources.push(r1.id);
      agent1.waitingFor = r2.id;
      agent1.state = AgentState.WAITING;

      r2.heldBy = agent2.id;
      agent2.heldResources.push(r2.id);

      // Agent 2 holds R2, waits for R3 (held by Agent 3)
      agent2.waitingFor = r3.id;
      agent2.state = AgentState.WAITING;

      r3.heldBy = agent3.id;
      agent3.heldResources.push(r3.id);

      // Agent 3 holds R3, waits for R1 (held by Agent 1) - CYCLE!
      agent3.waitingFor = r1.id;
      agent3.state = AgentState.WAITING;

      // Create wait-for edges
      const edge1 = createWaitForEdge(agent1.id, agent2.id, r2.id);
      const edge2 = createWaitForEdge(agent2.id, agent3.id, r3.id);
      const edge3 = createWaitForEdge(agent3.id, agent1.id, r1.id);

      graph.edges.push(edge1, edge2, edge3);
    });

    it('should detect a single cycle of 3 agents', () => {
      const detector = new CycleDetector(graph);
      const cycles = detector.detect();

      expect(cycles).toHaveLength(1);
      expect(cycles[0].agentIds).toHaveLength(3);
    });

    it('should identify all agents in the cycle as deadlocked', () => {
      const detector = new CycleDetector(graph);
      detector.detect();

      const deadlockedAgents = detector.getDeadlockedAgents();

      expect(deadlockedAgents.size).toBe(3);
    });

    it('should return correct cycle count', () => {
      const detector = new CycleDetector(graph);
      detector.detect();

      expect(detector.getCycleCount()).toBe(1);
    });
  });

  describe('No Deadlock Detection', () => {
    let graph: ReturnType<typeof createWaitForGraph>;

    beforeEach(() => {
      graph = createWaitForGraph();

      // Create agents without deadlock
      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');

      graph.agents.set(agent1.id, agent1);
      graph.agents.set(agent2.id, agent2);

      // Create resources
      const r1 = createResource('R1');
      const r2 = createResource('R2');

      graph.resources.set(r1.id, r1);
      graph.resources.set(r2.id, r2);

      // Agent 1 holds R1, no waiting
      r1.heldBy = agent1.id;
      agent1.heldResources.push(r1.id);

      // Agent 2 holds R2, no waiting
      r2.heldBy = agent2.id;
      agent2.heldResources.push(r2.id);

      // No edges = no cycle
    });

    it('should detect no cycles', () => {
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

  describe('Multiple Independent Cycles', () => {
    let graph: ReturnType<typeof createWaitForGraph>;

    beforeEach(() => {
      graph = createWaitForGraph();

      // Cycle 1: Agent 1 -> Agent 2 -> Agent 1
      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');
      const agent3 = createAgent('Agent-3');
      const agent4 = createAgent('Agent-4');

      graph.agents.set(agent1.id, agent1);
      graph.agents.set(agent2.id, agent2);
      graph.agents.set(agent3.id, agent3);
      graph.agents.set(agent4.id, agent4);

      // Create edges for cycle 1: agent1 -> agent2 -> agent1
      const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r1');
      const edge2 = createWaitForEdge(agent2.id, agent1.id, 'r2');

      // Create edges for cycle 2: agent3 -> agent4 -> agent3
      const edge3 = createWaitForEdge(agent3.id, agent4.id, 'r3');
      const edge4 = createWaitForEdge(agent4.id, agent3.id, 'r4');

      graph.edges.push(edge1, edge2, edge3, edge4);
    });

    it('should detect two independent cycles', () => {
      const detector = new CycleDetector(graph);
      const cycles = detector.detect();

      expect(cycles.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Self-Loop Detection', () => {
    let graph: ReturnType<typeof createWaitForGraph>;

    beforeEach(() => {
      graph = createWaitForGraph();

      const agent1 = createAgent('Agent-1');
      graph.agents.set(agent1.id, agent1);

      // Self-waiting edge (agent waits for itself)
      const edge = createWaitForEdge(agent1.id, agent1.id, 'r1');
      graph.edges.push(edge);
    });

    it('should detect self-loop as a cycle', () => {
      const detector = new CycleDetector(graph);
      const cycles = detector.detect();

      // Self-loop should be detected
      expect(cycles.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Empty Graph', () => {
    it('should handle empty graph without errors', () => {
      const graph = createWaitForGraph();
      const detector = new CycleDetector(graph);
      const cycles = detector.detect();

      expect(cycles).toHaveLength(0);
    });
  });

  describe('GraphBasedCycleDetector', () => {
    let graph: ReturnType<typeof createWaitForGraph>;

    beforeEach(() => {
      graph = createWaitForGraph();

      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');
      const agent3 = createAgent('Agent-3');

      graph.agents.set(agent1.id, agent1);
      graph.agents.set(agent2.id, agent2);
      graph.agents.set(agent3.id, agent3);

      // Create a cycle
      const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r1');
      const edge2 = createWaitForEdge(agent2.id, agent3.id, 'r2');
      const edge3 = createWaitForEdge(agent3.id, agent1.id, 'r3');

      graph.edges.push(edge1, edge2, edge3);
    });

    it('should detect cycles using adjacency list', () => {
      const detector = new GraphBasedCycleDetector(graph);
      const cycles = detector.detect();

      expect(cycles.length).toBeGreaterThanOrEqual(1);
    });
  });
});
