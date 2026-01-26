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
        [edge1, edge2, edge3],
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
        [edge1, edge2],
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
        [edge1, edge2],
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
        [edge1, edge2],
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
        [edge1, edge2, edge3],
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
      [edge1, edge2],
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
      [edge1, edge2],
    );

    const consensus = compositeSelector.getConsensusVictim(cycle, agents);

    expect(consensus).not.toBeNull();
    expect(consensus?.reason).toContain('consensus');
  });
});

describe('VictimSelector - Additional Coverage', () => {
  describe('Random Strategy', () => {
    it('should select a random agent', () => {
      const selector = new VictimSelector(VictimSelectionStrategy.RANDOM);

      const agent1 = createAgent('Agent-1', 5);
      const agent2 = createAgent('Agent-2', 5);
      const agent3 = createAgent('Agent-3', 5);

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
        [edge1, edge2, edge3],
      );

      const result = selector.selectVictim(cycle, agents);

      expect(result.victim).toBeDefined();
      expect(result.reason).toContain('Random selection');
      expect([agent1.id, agent2.id, agent3.id]).toContain(result.victim.id);
    });
  });

  describe('Agent Ranking with Different Strategies', () => {
    const createTestSetup = () => {
      const agent1 = createAgent('Priority-1', 1);
      const agent2 = createAgent('Priority-10', 10);
      const agent3 = createAgent('Priority-5', 5);

      agent1.heldResources = ['r1'];
      agent2.heldResources = ['r2', 'r3', 'r4'];
      agent3.heldResources = ['r5', 'r6'];

      agent1.createdAt = new Date(Date.now() - 10000);
      agent2.createdAt = new Date(Date.now() - 5000);
      agent3.createdAt = new Date();

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
        [edge1, edge2, edge3],
      );

      return { agents, cycle, agent1, agent2, agent3 };
    };

    it('should rank agents by youngest strategy', () => {
      const selector = new VictimSelector(VictimSelectionStrategy.YOUNGEST);
      const { agents, cycle, agent3 } = createTestSetup();

      const ranked = selector.rankAgents(cycle, agents);

      expect(ranked).toHaveLength(3);
      // Youngest agent should be ranked first (lowest score for youngest)
      expect(ranked[0].agent.id).toBe(agent3.id);
    });

    it('should rank agents by most resources strategy', () => {
      const selector = new VictimSelector(VictimSelectionStrategy.MOST_RESOURCES);
      const { agents, cycle, agent2 } = createTestSetup();

      const ranked = selector.rankAgents(cycle, agents);

      expect(ranked).toHaveLength(3);
      // Agent with most resources should be ranked first (negative score)
      expect(ranked[0].agent.id).toBe(agent2.id);
    });

    it('should rank agents by minimum dependencies strategy', () => {
      const selector = new VictimSelector(VictimSelectionStrategy.MINIMUM_DEPENDENCIES);
      const { agents, cycle, agent1 } = createTestSetup();

      const ranked = selector.rankAgents(cycle, agents);

      expect(ranked).toHaveLength(3);
      // Agent with fewest resources should be ranked first
      expect(ranked[0].agent.id).toBe(agent1.id);
    });

    it('should rank agents with random strategy', () => {
      const selector = new VictimSelector(VictimSelectionStrategy.RANDOM);
      const { agents, cycle } = createTestSetup();

      const ranked = selector.rankAgents(cycle, agents);

      expect(ranked).toHaveLength(3);
      // All agents should be ranked
      ranked.forEach((item, idx) => {
        expect(item.rank).toBe(idx + 1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when no valid agents in cycle', () => {
      const selector = new VictimSelector();
      
      const agents = new Map();  // Empty map

      const cycle = createDeadlockCycle(
        ['non-existent-1', 'non-existent-2'],
        [],
      );

      expect(() => selector.selectVictim(cycle, agents)).toThrow('No valid agents in cycle');
    });

    it('should handle cycle with some missing agents', () => {
      const selector = new VictimSelector();
      
      const agent1 = createAgent('Agent-1', 5);
      
      const agents = new Map([
        [agent1.id, agent1],
        // agent2 and agent3 are missing
      ]);

      const edge1 = createWaitForEdge(agent1.id, 'non-existent', 'r1');

      const cycle = createDeadlockCycle(
        [agent1.id, 'non-existent-1', 'non-existent-2'],
        [edge1],
      );

      // Should not throw, just use available agents
      const result = selector.selectVictim(cycle, agents);
      expect(result.victim.id).toBe(agent1.id);
    });
  });
});

describe('CompositeVictimSelector - Additional Coverage', () => {
  it('should return null for empty cycle', () => {
    const compositeSelector = new CompositeVictimSelector();
    
    const agents = new Map();
    const cycle = createDeadlockCycle([], []);

    const recommendations = compositeSelector.getAllRecommendations(cycle, agents);
    
    // Should have no recommendations due to error
    expect(recommendations.size).toBe(0);
  });

  it('should handle single agent cycle', () => {
    const compositeSelector = new CompositeVictimSelector();
    
    const agent1 = createAgent('Single-Agent', 5);
    agent1.heldResources = ['r1'];

    const agents = new Map([
      [agent1.id, agent1],
    ]);

    const edge1 = createWaitForEdge(agent1.id, agent1.id, 'r1');

    const cycle = createDeadlockCycle(
      [agent1.id],
      [edge1],
    );

    const recommendations = compositeSelector.getAllRecommendations(cycle, agents);
    
    expect(recommendations.size).toBeGreaterThan(0);
    
    // All strategies should select the same agent
    for (const result of recommendations.values()) {
      expect(result.victim.id).toBe(agent1.id);
    }
  });

  it('should return null consensus when no recommendations', () => {
    const compositeSelector = new CompositeVictimSelector();
    
    const agents = new Map();
    const cycle = createDeadlockCycle([], []);

    const consensus = compositeSelector.getConsensusVictim(cycle, agents);
    
    expect(consensus).toBeNull();
  });

  it('should find consensus among all strategies', () => {
    const compositeSelector = new CompositeVictimSelector();
    
    // Create agents where one is clearly the best victim for all strategies
    const bestVictim = createAgent('Best-Victim', 1); // lowest priority
    bestVictim.heldResources = ['r1', 'r2', 'r3', 'r4', 'r5']; // most resources
    bestVictim.createdAt = new Date(); // youngest
    
    const otherAgent = createAgent('Other-Agent', 10);
    otherAgent.heldResources = ['r6'];
    otherAgent.createdAt = new Date(Date.now() - 100000);

    const agents = new Map([
      [bestVictim.id, bestVictim],
      [otherAgent.id, otherAgent],
    ]);

    const edge1 = createWaitForEdge(bestVictim.id, otherAgent.id, 'r6');
    const edge2 = createWaitForEdge(otherAgent.id, bestVictim.id, 'r1');

    const cycle = createDeadlockCycle(
      [bestVictim.id, otherAgent.id],
      [edge1, edge2],
    );

    const consensus = compositeSelector.getConsensusVictim(cycle, agents);
    
    expect(consensus).not.toBeNull();
    expect(consensus!.reason).toContain('consensus');
  });
});

describe('VictimSelector - Default Strategy Case', () => {
  it('should handle unknown strategy with default case', () => {
    const selector = new VictimSelector(VictimSelectionStrategy.LOWEST_PRIORITY);
    
    // Force an unknown strategy value
    (selector as any).strategy = 'unknown_strategy';

    const agent1 = createAgent('Agent-1', 5);
    const agent2 = createAgent('Agent-2', 10);

    const agents = new Map([
      [agent1.id, agent1],
      [agent2.id, agent2],
    ]);

    const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r1');
    const edge2 = createWaitForEdge(agent2.id, agent1.id, 'r2');

    const cycle = createDeadlockCycle(
      [agent1.id, agent2.id],
      [edge1, edge2],
    );

    const result = selector.selectVictim(cycle, agents);

    // Default case should select first agent
    expect(result.victim.id).toBe(agent1.id);
    expect(result.reason).toBe('Default selection (first agent)');
    expect(result.score).toBe(0);
  });

  it('should handle unknown strategy in rankAgents', () => {
    const selector = new VictimSelector(VictimSelectionStrategy.LOWEST_PRIORITY);
    
    // Force an unknown strategy value
    (selector as any).strategy = 'unknown_strategy';

    const agent1 = createAgent('Agent-1', 5);
    const agent2 = createAgent('Agent-2', 10);

    const agents = new Map([
      [agent1.id, agent1],
      [agent2.id, agent2],
    ]);

    const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r1');
    const edge2 = createWaitForEdge(agent2.id, agent1.id, 'r2');

    const cycle = createDeadlockCycle(
      [agent1.id, agent2.id],
      [edge1, edge2],
    );

    const ranked = selector.rankAgents(cycle, agents);

    expect(ranked).toHaveLength(2);
    // All scores should be 0 in default case
    ranked.forEach(item => {
      expect(item.score).toBe(0);
    });
  });
});

describe('CompositeVictimSelector - Additional Edge Cases', () => {
  it('should handle error in individual selector gracefully', () => {
    const compositeSelector = new CompositeVictimSelector();
    
    // Create an empty cycle that will cause errors
    const agents = new Map();
    const cycle = createDeadlockCycle(['agent-1', 'agent-2'], []);

    const recommendations = compositeSelector.getAllRecommendations(cycle, agents);
    
    // All selectors should fail gracefully and return empty recommendations
    expect(recommendations.size).toBe(0);
  });

  it('should return null consensus when consensusAgentId becomes null unexpectedly', () => {
    const compositeSelector = new CompositeVictimSelector();
    
    const agents = new Map();
    const cycle = createDeadlockCycle([], []);

    const consensus = compositeSelector.getConsensusVictim(cycle, agents);
    
    expect(consensus).toBeNull();
  });

  it('should handle tie-breaking in consensus selection', () => {
    const compositeSelector = new CompositeVictimSelector();
    
    // Create agents with exactly equal characteristics
    const agent1 = createAgent('Agent-1', 5);
    const agent2 = createAgent('Agent-2', 5);
    
    agent1.heldResources = ['r1'];
    agent2.heldResources = ['r2'];
    
    // Make them same age
    const now = new Date();
    agent1.createdAt = now;
    agent2.createdAt = now;

    const agents = new Map([
      [agent1.id, agent1],
      [agent2.id, agent2],
    ]);

    const edge1 = createWaitForEdge(agent1.id, agent2.id, 'r1');
    const edge2 = createWaitForEdge(agent2.id, agent1.id, 'r2');

    const cycle = createDeadlockCycle(
      [agent1.id, agent2.id],
      [edge1, edge2],
    );

    const consensus = compositeSelector.getConsensusVictim(cycle, agents);
    
    expect(consensus).not.toBeNull();
    // Should have a valid victim
    expect([agent1.id, agent2.id]).toContain(consensus!.victim.id);
  });
});
