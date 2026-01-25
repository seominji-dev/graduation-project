import { describe, it, expect, beforeEach } from 'vitest';
import {
  VictimSelector,
  CompositeVictimSelector,
  VictimSelectionStrategy,
} from '../../src/recovery/VictimSelector';
import {
  createAgent,
  createDeadlockCycle,
  createWaitForEdge,
  AgentState,
} from '../../src/domain/models';

describe('VictimSelector', () => {
  describe('Lowest Priority Strategy', () => {
    it('should select agent with lowest priority', () => {
      const selector = new VictimSelector(VictimSelectionStrategy.LOWEST_PRIORITY);

      const agent1 = createAgent('Low-Priority', 1);
      const agent2 = createAgent('High-Priority', 10);
      const agent3 = createAgent('Mid-Priority', 5);

      const agents = new Map([
        [agent1.id, agent1],
        [agent2.id, agent2],
        [agent3.id, agent3],
      ]);

      const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r1');
      const edge2 = createWaitForEdge(agent2.id, agent3.id, 'r2');
      const edge3 = createWaitForEdge(agent3.id, agent1.id, 'r3');

      const cycle = createDeadlockCycle(
        [agent1.id, agent2.id, agent3.id],
        [edge1, edge2, edge3]
      );

      const result = selector.selectVictim(cycle, agents);

      expect(result.victim.id).toBe(agent1.id);
      expect(result.reason).toContain('Lowest priority');
      expect(result.score).toBe(1);
    });
  });

  describe('Youngest Strategy', () => {
    it('should select youngest agent', () => {
      const selector = new VictimSelector(VictimSelectionStrategy.YOUNGEST);

      const agent1 = createAgent('Old-Agent', 5);
      const agent2 = createAgent('Young-Agent', 5);

      // Manually set creation times
      agent1.createdAt = new Date(Date.now() - 10000);
      agent2.createdAt = new Date();

      const agents = new Map([
        [agent1.id, agent1],
        [agent2.id, agent2],
      ]);

      const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r1');
      const edge2 = createWaitForEdge(agent2.id, agent1.id, 'r2');

      const cycle = createDeadlockCycle(
        [agent1.id, agent2.id],
        [edge1, edge2]
      );

      const result = selector.selectVictim(cycle, agents);

      expect(result.victim.id).toBe(agent2.id);
      expect(result.reason).toContain('Youngest');
    });
  });

  describe('Most Resources Strategy', () => {
    it('should select agent holding most resources', () => {
      const selector = new VictimSelector(VictimSelectionStrategy.MOST_RESOURCES);

      const agent1 = createAgent('Few-Resources', 5);
      const agent2 = createAgent('Many-Resources', 5);

      agent1.heldResources.push('r1');
      agent2.heldResources.push('r1', 'r2', 'r3');

      const agents = new Map([
        [agent1.id, agent1],
        [agent2.id, agent2],
      ]);

      const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r4');
      const edge2 = createWaitForEdge(agent2.id, agent1.id, 'r5');

      const cycle = createDeadlockCycle(
        [agent1.id, agent2.id],
        [edge1, edge2]
      );

      const result = selector.selectVictim(cycle, agents);

      expect(result.victim.id).toBe(agent2.id);
      expect(result.reason).toContain('Holding most resources');
    });
  });

  describe('Minimum Dependencies Strategy', () => {
    it('should select agent with fewest resources', () => {
      const selector = new VictimSelector(VictimSelectionStrategy.MINIMUM_DEPENDENCIES);

      const agent1 = createAgent('Few-Resources', 5);
      const agent2 = createAgent('Many-Resources', 5);

      agent1.heldResources.push('r1');
      agent2.heldResources.push('r1', 'r2', 'r3');

      const agents = new Map([
        [agent1.id, agent1],
        [agent2.id, agent2],
      ]);

      const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r4');
      const edge2 = createWaitForEdge(agent2.id, agent1.id, 'r5');

      const cycle = createDeadlockCycle(
        [agent1.id, agent2.id],
        [edge1, edge2]
      );

      const result = selector.selectVictim(cycle, agents);

      expect(result.victim.id).toBe(agent1.id);
      expect(result.reason).toContain('Fewest dependencies');
    });
  });

  describe('Strategy Changes', () => {
    it('should allow changing strategy', () => {
      const selector = new VictimSelector();

      expect(selector.getStrategy()).toBe(VictimSelectionStrategy.LOWEST_PRIORITY);

      selector.setStrategy(VictimSelectionStrategy.YOUNGEST);

      expect(selector.getStrategy()).toBe(VictimSelectionStrategy.YOUNGEST);
    });
  });

  describe('Agent Ranking', () => {
    it('should rank agents by victim suitability', () => {
      const selector = new VictimSelector(VictimSelectionStrategy.LOWEST_PRIORITY);

      const agent1 = createAgent('Priority-1', 1);
      const agent2 = createAgent('Priority-10', 10);
      const agent3 = createAgent('Priority-5', 5);

      const agents = new Map([
        [agent1.id, agent1],
        [agent2.id, agent2],
        [agent3.id, agent3],
      ]);

      const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r1');
      const edge2 = createWaitForEdge(agent2.id, agent3.id, 'r2');
      const edge3 = createWaitForEdge(agent3.id, agent1.id, 'r3');

      const cycle = createDeadlockCycle(
        [agent1.id, agent2.id, agent3.id],
        [edge1, edge2, edge3]
      );

      const ranked = selector.rankAgents(cycle, agents);

      expect(ranked).toHaveLength(3);
      expect(ranked[0].agent.id).toBe(agent1.id);
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(2);
      expect(ranked[2].rank).toBe(3);
    });
  });
});

describe('CompositeVictimSelector', () => {
  let compositeSelector: CompositeVictimSelector;

  beforeEach(() => {
    compositeSelector = new CompositeVictimSelector();
  });

  it('should get recommendations from all strategies', () => {
    const agent1 = createAgent('Agent-1', 1);
    const agent2 = createAgent('Agent-2', 10);

    const agents = new Map([
      [agent1.id, agent1],
      [agent2.id, agent2],
    ]);

    const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r1');
    const edge2 = createWaitForEdge(agent2.id, agent1.id, 'r2');

    const cycle = createDeadlockCycle(
      [agent1.id, agent2.id],
      [edge1, edge2]
    );

    const recommendations = compositeSelector.getAllRecommendations(cycle, agents);

    expect(recommendations.size).toBeGreaterThan(0);
  });

  it('should find consensus victim', () => {
    const agent1 = createAgent('Agent-1', 1);
    const agent2 = createAgent('Agent-2', 10);

    const agents = new Map([
      [agent1.id, agent1],
      [agent2.id, agent2],
    ]);

    const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r1');
    const edge2 = createWaitForEdge(agent2.id, agent1.id, 'r2');

    const cycle = createDeadlockCycle(
      [agent1.id, agent2.id],
      [edge1, edge2]
    );

    const consensus = compositeSelector.getConsensusVictim(cycle, agents);

    expect(consensus).not.toBeNull();
    expect(consensus?.reason).toContain('consensus');
  });
});
