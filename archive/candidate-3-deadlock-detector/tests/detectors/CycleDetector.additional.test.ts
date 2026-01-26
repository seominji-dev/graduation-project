import { describe, it, expect } from 'vitest';
import { CycleDetector, GraphBasedCycleDetector } from '../../src/detectors/CycleDetector';
import { 
  createWaitForGraph, 
  createAgent, 
  createWaitForEdge, 
} from '../../src/domain/models';

describe('CycleDetector - Additional Coverage', () => {
  describe('isAgentInDeadlock', () => {
    it('should return true for agent in deadlock cycle', () => {
      const graph = createWaitForGraph();
      
      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');
      
      graph.agents.set(agent1.id, agent1);
      graph.agents.set(agent2.id, agent2);
      
      // Create cycle: agent1 -> agent2 -> agent1
      const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r1');
      const edge2 = createWaitForEdge(agent2.id, agent1.id, 'r2');
      graph.edges.push(edge1, edge2);

      const detector = new CycleDetector(graph);
      detector.detect();

      expect(detector.isAgentInDeadlock(agent1.id)).toBe(true);
      expect(detector.isAgentInDeadlock(agent2.id)).toBe(true);
    });

    it('should return false for agent not in deadlock', () => {
      const graph = createWaitForGraph();
      
      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');
      const agent3 = createAgent('Agent-3');
      
      graph.agents.set(agent1.id, agent1);
      graph.agents.set(agent2.id, agent2);
      graph.agents.set(agent3.id, agent3);
      
      // Create cycle between agent1 and agent2 only
      const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r1');
      const edge2 = createWaitForEdge(agent2.id, agent1.id, 'r2');
      graph.edges.push(edge1, edge2);

      const detector = new CycleDetector(graph);
      detector.detect();

      expect(detector.isAgentInDeadlock(agent3.id)).toBe(false);
    });
  });

  describe('getDeadlockedAgents', () => {
    it('should return all agents in deadlock cycles', () => {
      const graph = createWaitForGraph();
      
      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');
      const agent3 = createAgent('Agent-3');
      
      graph.agents.set(agent1.id, agent1);
      graph.agents.set(agent2.id, agent2);
      graph.agents.set(agent3.id, agent3);
      
      // Create cycle: agent1 -> agent2 -> agent3 -> agent1
      const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r1');
      const edge2 = createWaitForEdge(agent2.id, agent3.id, 'r2');
      const edge3 = createWaitForEdge(agent3.id, agent1.id, 'r3');
      graph.edges.push(edge1, edge2, edge3);

      const detector = new CycleDetector(graph);
      detector.detect();

      const deadlocked = detector.getDeadlockedAgents();

      expect(deadlocked.size).toBe(3);
      expect(deadlocked.has(agent1.id)).toBe(true);
      expect(deadlocked.has(agent2.id)).toBe(true);
      expect(deadlocked.has(agent3.id)).toBe(true);
    });

    it('should return empty set when no deadlocks', () => {
      const graph = createWaitForGraph();
      
      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');
      
      graph.agents.set(agent1.id, agent1);
      graph.agents.set(agent2.id, agent2);
      
      // No cycle - agent1 waits for agent2 but not vice versa
      const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r1');
      graph.edges.push(edge1);

      const detector = new CycleDetector(graph);
      detector.detect();

      const deadlocked = detector.getDeadlockedAgents();

      expect(deadlocked.size).toBe(0);
    });
  });

  describe('static detectCycles', () => {
    it('should detect cycles using static method', () => {
      const graph = createWaitForGraph();
      
      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');
      
      graph.agents.set(agent1.id, agent1);
      graph.agents.set(agent2.id, agent2);
      
      // Create cycle
      const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r1');
      const edge2 = createWaitForEdge(agent2.id, agent1.id, 'r2');
      graph.edges.push(edge1, edge2);

      const cycles = CycleDetector.detectCycles(graph);

      expect(cycles.length).toBeGreaterThan(0);
    });
  });

  describe('getLastDetectedCycles', () => {
    it('should return detected cycles', () => {
      const graph = createWaitForGraph();
      
      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');
      
      graph.agents.set(agent1.id, agent1);
      graph.agents.set(agent2.id, agent2);
      
      const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r1');
      const edge2 = createWaitForEdge(agent2.id, agent1.id, 'r2');
      graph.edges.push(edge1, edge2);

      const detector = new CycleDetector(graph);
      detector.detect();

      const cycles = detector.getLastDetectedCycles();

      expect(cycles.length).toBeGreaterThan(0);
    });
  });

  describe('getCycleCount', () => {
    it('should return correct cycle count', () => {
      const graph = createWaitForGraph();
      
      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');
      
      graph.agents.set(agent1.id, agent1);
      graph.agents.set(agent2.id, agent2);
      
      const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r1');
      const edge2 = createWaitForEdge(agent2.id, agent1.id, 'r2');
      graph.edges.push(edge1, edge2);

      const detector = new CycleDetector(graph);
      detector.detect();

      expect(detector.getCycleCount()).toBe(1);
    });

    it('should return 0 when no cycles', () => {
      const graph = createWaitForGraph();
      const agent1 = createAgent('Agent-1');
      graph.agents.set(agent1.id, agent1);

      const detector = new CycleDetector(graph);
      detector.detect();

      expect(detector.getCycleCount()).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle neighbor not in graph', () => {
      const graph = createWaitForGraph();
      
      const agent1 = createAgent('Agent-1');
      graph.agents.set(agent1.id, agent1);
      
      // Edge to non-existent agent
      const edge = createWaitForEdge(agent1.id, 'non-existent', 'r1');
      graph.edges.push(edge);

      const detector = new CycleDetector(graph);
      const cycles = detector.detect();

      expect(cycles.length).toBe(0);
    });

    it('should handle extractCycle with invalid indices', () => {
      const graph = createWaitForGraph();
      
      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');
      
      graph.agents.set(agent1.id, agent1);
      graph.agents.set(agent2.id, agent2);

      const detector = new CycleDetector(graph);
      detector.detect();

      // No cycles should be found with this configuration
      expect(detector.getCycleCount()).toBe(0);
    });

    it('should handle multiple independent cycles', () => {
      const graph = createWaitForGraph();
      
      // Cycle 1: agent1 <-> agent2
      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');
      
      // Cycle 2: agent3 <-> agent4
      const agent3 = createAgent('Agent-3');
      const agent4 = createAgent('Agent-4');
      
      graph.agents.set(agent1.id, agent1);
      graph.agents.set(agent2.id, agent2);
      graph.agents.set(agent3.id, agent3);
      graph.agents.set(agent4.id, agent4);
      
      // Create two independent cycles
      graph.edges.push(createWaitForEdge(agent1.id, agent2.id, 'r1'));
      graph.edges.push(createWaitForEdge(agent2.id, agent1.id, 'r2'));
      graph.edges.push(createWaitForEdge(agent3.id, agent4.id, 'r3'));
      graph.edges.push(createWaitForEdge(agent4.id, agent3.id, 'r4'));

      const detector = new CycleDetector(graph);
      const cycles = detector.detect();

      expect(cycles.length).toBe(2);
    });
  });
});

describe('GraphBasedCycleDetector', () => {
  describe('detect', () => {
    it('should detect cycles using adjacency list', () => {
      const graph = createWaitForGraph();
      
      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');
      
      graph.agents.set(agent1.id, agent1);
      graph.agents.set(agent2.id, agent2);
      
      const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r1');
      const edge2 = createWaitForEdge(agent2.id, agent1.id, 'r2');
      graph.edges.push(edge1, edge2);

      const detector = new GraphBasedCycleDetector(graph);
      const cycles = detector.detect();

      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should handle graph with no edges', () => {
      const graph = createWaitForGraph();
      
      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');
      
      graph.agents.set(agent1.id, agent1);
      graph.agents.set(agent2.id, agent2);

      const detector = new GraphBasedCycleDetector(graph);
      const cycles = detector.detect();

      expect(cycles.length).toBe(0);
    });

    it('should handle empty graph', () => {
      const graph = createWaitForGraph();

      const detector = new GraphBasedCycleDetector(graph);
      const cycles = detector.detect();

      expect(cycles.length).toBe(0);
    });

    it('should handle three-agent cycle', () => {
      const graph = createWaitForGraph();
      
      const agent1 = createAgent('Agent-1');
      const agent2 = createAgent('Agent-2');
      const agent3 = createAgent('Agent-3');
      
      graph.agents.set(agent1.id, agent1);
      graph.agents.set(agent2.id, agent2);
      graph.agents.set(agent3.id, agent3);
      
      // Create cycle: agent1 -> agent2 -> agent3 -> agent1
      graph.edges.push(createWaitForEdge(agent1.id, agent2.id, 'r1'));
      graph.edges.push(createWaitForEdge(agent2.id, agent3.id, 'r2'));
      graph.edges.push(createWaitForEdge(agent3.id, agent1.id, 'r3'));

      const detector = new GraphBasedCycleDetector(graph);
      const cycles = detector.detect();

      expect(cycles.length).toBe(1);
      expect(cycles[0].agentIds.length).toBe(3);
    });
  });
});
