/**
 * Safety Checker for Banker's Algorithm
 * 
 * Determines if the system is in a safe state where all agents
 * can complete without causing a deadlock.
 */

import {
  Agent,
  Resource,
} from '../domain/models.js';

/**
 * Resource allocation state
 */
export interface AllocationState {
  /** Current allocation matrix: agents -> resources */
  allocation: Map<string, Map<string, number>>;
  /** Maximum demand matrix: agents -> resources */
  maximumDemand: Map<string, Map<string, number>>;
  /** Available resources: resources -> available count */
  available: Map<string, number>;
}

/**
 * Safety check result
 */
export interface SafetyResult {
  /** Whether the system is in a safe state */
  isSafe: boolean;
  /** Safe sequence if safe (agent IDs in completion order) */
  safeSequence: string[];
  /** Work array (available resources during algorithm) */
  work: Map<string, number>;
  /** Finish array (agent completion status) */
  finish: Map<string, boolean>;
}

/**
 * Request for resources
 */
export interface ResourceRequest {
  /** Agent making the request */
  agentId: string;
  /** Resource being requested */
  resourceId: string;
  /** Number of instances requested */
  requestCount: number;
}

/**
 * SafetyChecker implements the safety algorithm for Banker's Algorithm
 */
export class SafetyChecker {
  private agents: Map<string, Agent>;
  private resources: Map<string, Resource>;

  constructor(agents: Map<string, Agent>, resources: Map<string, Resource>) {
    this.agents = agents;
    this.resources = resources;
  }

  /**
   * Check if the current system state is safe
   * 
   * @returns Safety result with safe sequence
   */
  public checkSafety(): SafetyResult {
    const state = this.buildAllocationState();
    return this.isSafeState(state);
  }

  /**
   * Check if granting a request would leave the system in a safe state
   * 
   * @param request Resource request to validate
   * @returns Whether the request is safe to grant
   */
  public isRequestSafe(request: ResourceRequest): boolean {
    const state = this.buildAllocationState();
    
    // Tentatively grant the request
    const currentAlloc = state.allocation.get(request.agentId);
    if (currentAlloc) {
      currentAlloc.set(request.resourceId, 
        (currentAlloc.get(request.resourceId) || 0) + request.requestCount);
    }
    
    const currentAvailable = state.available.get(request.resourceId) || 0;
    state.available.set(request.resourceId, currentAvailable - request.requestCount);

    const result = this.isSafeState(state);

    return result.isSafe;
  }

  /**
   * Build the current allocation state from agents and resources
   */
  private buildAllocationState(): AllocationState {
    const allocation = new Map<string, Map<string, number>>();
    const maximumDemand = new Map<string, Map<string, number>>();
    const available = new Map<string, number>();

    // Initialize available resources
    for (const [resourceId, resource] of this.resources) {
      const heldBy = resource.heldBy;
      
      if (!heldBy) {
        // Resource is free
        available.set(resourceId, resource.totalInstances);
      } else {
        // Resource is held, but check for multiple instances
        const allocatedCount = resource.heldBy ? 1 : 0;
        available.set(resourceId, resource.totalInstances - allocatedCount);
      }
    }

    // Initialize agent allocations (simplified - agents hold at most 1 of each resource)
    for (const [agentId, agent] of this.agents) {
      const agentAlloc = new Map<string, number>();
      const agentMax = new Map<string, number>();
      
      // Current allocation: resources held by agent
      for (const resourceId of agent.heldResources) {
        agentAlloc.set(resourceId, 1);
        // Assume maximum demand is current + 1 (simplified)
        agentMax.set(resourceId, 2);
      }
      
      // If agent is waiting for a resource, add to maximum demand
      if (agent.waitingFor) {
        agentMax.set(agent.waitingFor, 1);
      }
      
      allocation.set(agentId, agentAlloc);
      maximumDemand.set(agentId, agentMax);
    }

    return { allocation, maximumDemand, available };
  }

  /**
   * Safety algorithm from Banker's Algorithm
   * 
   * @param state Current allocation state
   * @returns Safety result
   */
  private isSafeState(state: AllocationState): SafetyResult {
    // Initialize work = available
    const work = new Map<string, number>();
    for (const [resourceId, count] of state.available) {
      work.set(resourceId, count);
    }

    // Initialize finish[i] = false for all agents
    const finish = new Map<string, boolean>();
    for (const agentId of this.agents.keys()) {
      finish.set(agentId, false);
    }

    const safeSequence: string[] = [];

    // Find an agent that can finish
    let found = true;
    while (found) {
      found = false;

      for (const agentId of this.agents.keys()) {
        if (finish.get(agentId)) {
          continue; // Already finished
        }

        // Check if finish[i] is false and need[i] <= work
        const need = this.calculateNeed(
          agentId,
          state.allocation,
          state.maximumDemand,
        );

        let canFinish = true;
        for (const [resourceId, neededCount] of need) {
          const workCount = work.get(resourceId) || 0;
          if (neededCount > workCount) {
            canFinish = false;
            break;
          }
        }

        if (canFinish) {
          // Agent can finish
          finish.set(agentId, true);
          safeSequence.push(agentId);

          // Add agent's allocation to work
          const alloc = state.allocation.get(agentId);
          if (alloc) {
            for (const [resourceId, allocCount] of alloc) {
              const currentWork = work.get(resourceId) || 0;
              work.set(resourceId, currentWork + allocCount);
            }
          }

          found = true;
          break;
        }
      }
    }

    // System is safe if all agents can finish
    const isSafe = Array.from(finish.values()).every(f => f);

    return {
      isSafe,
      safeSequence,
      work,
      finish,
    };
  }

  /**
   * Calculate need matrix: need[i] = max[i] - allocation[i]
   */
  private calculateNeed(
    agentId: string,
    allocation: Map<string, Map<string, number>>,
    maximumDemand: Map<string, Map<string, number>>,
  ): Map<string, number> {
    const need = new Map<string, number>();
    const alloc = allocation.get(agentId) || new Map();
    const max = maximumDemand.get(agentId) || new Map();

    // Get all resources from either allocation or max
    const allResources = new Set([
      ...alloc.keys(),
      ...max.keys(),
    ]);

    for (const resourceId of allResources) {
      const maxCount = max.get(resourceId) || 0;
      const allocCount = alloc.get(resourceId) || 0;
      const needCount = Math.max(0, maxCount - allocCount);
      need.set(resourceId, needCount);
    }

    return need;
  }

  /**
   * Get a resource allocation request
   */
  public createRequest(
    agentId: string,
    resourceId: string,
    count: number = 1,
  ): ResourceRequest {
    return {
      agentId,
      resourceId,
      requestCount: count,
    };
  }
}
