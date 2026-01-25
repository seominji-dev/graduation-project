/**
 * Victim Selector for Deadlock Recovery
 * 
 * Selects the best agent to terminate/preempt for deadlock resolution
 * using various strategies: lowest priority, youngest, most resources held
 */

import {
  Agent,
  DeadlockCycle,
  RecoveryActionType,
  
} from '../domain/models.js';

/**
 * Victim selection strategy
 */
export enum VictimSelectionStrategy {
  /** Select agent with lowest priority */
  LOWEST_PRIORITY = 'lowest_priority',
  /** Select youngest agent (most recently created) */
  YOUNGEST = 'youngest',
  /** Select agent holding the most resources */
  MOST_RESOURCES = 'most_resources',
  /** Select agent with fewest dependencies */
  MINIMUM_DEPENDENCIES = 'minimum_dependencies',
  /** Select random agent (for comparison) */
  RANDOM = 'random',
}

/**
 * Result of victim selection
 */
export interface VictimSelectionResult {
  /** Selected agent to be victim */
  victim: Agent;
  /** Reason for selection */
  reason: string;
  /** Recommended recovery action */
  actionType: RecoveryActionType;
  /** Score of this victim (lower = better victim) */
  score: number;
}

/**
 * VictimSelector selects the best victim for deadlock recovery
 */
export class VictimSelector {
  private strategy: VictimSelectionStrategy;

  constructor(strategy: VictimSelectionStrategy = VictimSelectionStrategy.LOWEST_PRIORITY) {
    this.strategy = strategy;
  }

  /**
   * Select a victim from a deadlock cycle
   */
  public selectVictim(
    cycle: DeadlockCycle,
    agents: Map<string, Agent>,
  ): VictimSelectionResult {
    const cycleAgents = cycle.agentIds
      .map(id => agents.get(id))
      .filter((agent): agent is Agent => agent !== undefined);

    if (cycleAgents.length === 0) {
      throw new Error('No valid agents in cycle');
    }

    let victim: Agent;
    let reason: string;
    let score: number;

    switch (this.strategy) {
      case VictimSelectionStrategy.LOWEST_PRIORITY: {
        const result = this.selectByLowestPriority(cycleAgents);
        victim = result.victim;
        reason = result.reason;
        score = result.score;
        break;
      }

      case VictimSelectionStrategy.YOUNGEST: {
        const youngestResult = this.selectByYoungest(cycleAgents);
        victim = youngestResult.victim;
        reason = youngestResult.reason;
        score = youngestResult.score;
        break;
      }

      case VictimSelectionStrategy.MOST_RESOURCES: {
        const mostResourcesResult = this.selectByMostResources(cycleAgents);
        victim = mostResourcesResult.victim;
        reason = mostResourcesResult.reason;
        score = mostResourcesResult.score;
        break;
      }

      case VictimSelectionStrategy.MINIMUM_DEPENDENCIES: {
        const minDepsResult = this.selectByMinimumDependencies(cycleAgents);
        victim = minDepsResult.victim;
        reason = minDepsResult.reason;
        score = minDepsResult.score;
        break;
      }

      case VictimSelectionStrategy.RANDOM: {
        const randomResult = this.selectRandom(cycleAgents);
        victim = randomResult.victim;
        reason = randomResult.reason;
        score = randomResult.score;
        break;
      }

      default:
        victim = cycleAgents[0];
        reason = 'Default selection (first agent)';
        score = 0;
    }

    return {
      victim,
      reason,
      actionType: RecoveryActionType.TERMINATE,
      score,
    };
  }

  private selectByLowestPriority(agents: Agent[]): {
    victim: Agent;
    reason: string;
    score: number;
  } {
    const sorted = [...agents].sort((a, b) => a.priority - b.priority);
    const victim = sorted[0];
    
    return {
      victim,
      reason: 'Lowest priority (' + victim.priority + ') among ' + agents.length + ' agents',
      score: victim.priority,
    };
  }

  private selectByYoungest(agents: Agent[]): {
    victim: Agent;
    reason: string;
    score: number;
  } {
    const sorted = [...agents].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const victim = sorted[0];
    
    const ageMs = Date.now() - victim.createdAt.getTime();
    const ageSeconds = Math.floor(ageMs / 1000);
    
    return {
      victim,
      reason: 'Youngest agent (' + ageSeconds + 's old) with least invested work',
      score: ageSeconds,
    };
  }

  private selectByMostResources(agents: Agent[]): {
    victim: Agent;
    reason: string;
    score: number;
  } {
    const sorted = [...agents].sort(
      (a, b) => b.heldResources.length - a.heldResources.length,
    );
    const victim = sorted[0];
    
    return {
      victim,
      reason: 'Holding most resources (' + victim.heldResources.length + ')',
      score: -victim.heldResources.length,
    };
  }

  private selectByMinimumDependencies(agents: Agent[]): {
    victim: Agent;
    reason: string;
    score: number;
  } {
    const sorted = [...agents].sort(
      (a, b) => a.heldResources.length - b.heldResources.length,
    );
    const victim = sorted[0];
    
    return {
      victim,
      reason: 'Fewest dependencies (' + victim.heldResources.length + ' resources)',
      score: victim.heldResources.length,
    };
  }

  private selectRandom(agents: Agent[]): {
    victim: Agent;
    reason: string;
    score: number;
  } {
    const index = Math.floor(Math.random() * agents.length);
    const victim = agents[index];
    
    return {
      victim,
      reason: 'Random selection (agent ' + (index + 1) + ' of ' + agents.length + ')',
      score: Math.random(),
    };
  }

  public setStrategy(strategy: VictimSelectionStrategy): void {
    this.strategy = strategy;
  }

  public getStrategy(): VictimSelectionStrategy {
    return this.strategy;
  }

  public rankAgents(
    cycle: DeadlockCycle,
    agents: Map<string, Agent>,
  ): Array<{ agent: Agent; score: number; rank: number }> {
    const cycleAgents = cycle.agentIds
      .map(id => agents.get(id))
      .filter((agent): agent is Agent => agent !== undefined);

    const ranked = cycleAgents.map(agent => {
      let score: number;

      switch (this.strategy) {
        case VictimSelectionStrategy.LOWEST_PRIORITY:
          score = agent.priority;
          break;
        case VictimSelectionStrategy.YOUNGEST:
          score = Date.now() - agent.createdAt.getTime();
          break;
        case VictimSelectionStrategy.MOST_RESOURCES:
          score = -agent.heldResources.length;
          break;
        case VictimSelectionStrategy.MINIMUM_DEPENDENCIES:
          score = agent.heldResources.length;
          break;
        case VictimSelectionStrategy.RANDOM:
          score = Math.random();
          break;
        default:
          score = 0;
      }

      return { agent, score, rank: 0 };
    });

    ranked.sort((a, b) => a.score - b.score);
    ranked.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return ranked;
  }
}

/**
 * Composite victim selector using multiple strategies
 */
export class CompositeVictimSelector {
  private selectors: Map<VictimSelectionStrategy, VictimSelector>;

  constructor() {
    this.selectors = new Map();
    
    const strategies: VictimSelectionStrategy[] = [
      VictimSelectionStrategy.LOWEST_PRIORITY,
      VictimSelectionStrategy.YOUNGEST,
      VictimSelectionStrategy.MOST_RESOURCES,
      VictimSelectionStrategy.MINIMUM_DEPENDENCIES,
    ];

    for (const strategy of strategies) {
      this.selectors.set(strategy, new VictimSelector(strategy));
    }
  }

  public getAllRecommendations(
    cycle: DeadlockCycle,
    agents: Map<string, Agent>,
  ): Map<VictimSelectionStrategy, VictimSelectionResult> {
    const recommendations = new Map<VictimSelectionStrategy, VictimSelectionResult>();

    for (const [strategy, selector] of this.selectors) {
      try {
        const result = selector.selectVictim(cycle, agents);
        recommendations.set(strategy, result);
      } catch (error) {
        continue;
      }
    }

    return recommendations;
  }

  public getConsensusVictim(
    cycle: DeadlockCycle,
    agents: Map<string, Agent>,
  ): VictimSelectionResult | null {
    const recommendations = this.getAllRecommendations(cycle, agents);
    
    if (recommendations.size === 0) {
      return null;
    }

    const counts = new Map<string, number>();
    
    for (const result of recommendations.values()) {
      const count = counts.get(result.victim.id) || 0;
      counts.set(result.victim.id, count + 1);
    }

    let maxCount = 0;
    let consensusAgentId: string | null = null;

    for (const [agentId, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        consensusAgentId = agentId;
      }
    }

    if (!consensusAgentId) {
      return null;
    }

    for (const result of recommendations.values()) {
      if (result.victim.id === consensusAgentId) {
        return {
          ...result,
          reason: result.reason + ' (consensus: ' + maxCount + '/' + recommendations.size + ' strategies)',
        };
      }
    }

    return null;
  }
}
