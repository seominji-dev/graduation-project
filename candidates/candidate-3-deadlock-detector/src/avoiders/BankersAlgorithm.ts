/**
 * Banker's Algorithm for Deadlock Avoidance
 * 
 * Implements resource allocation using Banker's Algorithm to prevent
 * deadlocks by ensuring the system always remains in a safe state.
 */

import { Agent, AgentState, Resource } from '../domain/models.js';
import { SafetyChecker, SafetyResult, ResourceRequest } from './SafetyChecker.js';

/**
 * Allocation result
 */
export interface AllocationResult {
  /** Whether allocation was granted */
  granted: boolean;
  /** Agent that requested the resource */
  agentId: string;
  /** Resource that was requested */
  resourceId: string;
  /** Number of instances granted */
  count: number;
  /** Reason for denial (if not granted) */
  reason?: string;
  /** Safety result after allocation */
  safetyResult: SafetyResult;
}

/**
 * Banker's Algorithm implementation
 */
export class BankersAlgorithm {
  private agents: Map<string, Agent>;
  private resources: Map<string, Resource>;
  private safetyChecker: SafetyChecker;

  constructor() {
    this.agents = new Map();
    this.resources = new Map();
    this.safetyChecker = new SafetyChecker(this.agents, this.resources);
  }

  /**
   * Add an agent to the system
   */
  public addAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
    this.updateSafetyChecker();
  }

  /**
   * Add a resource to the system
   */
  public addResource(resource: Resource): void {
    this.resources.set(resource.id, resource);
    this.updateSafetyChecker();
  }

  /**
   * Request resources for an agent
   * 
   * @param request Resource request
   * @returns Allocation result
   */
  public requestAllocation(request: ResourceRequest): AllocationResult {
    const agent = this.agents.get(request.agentId);
    const resource = this.resources.get(request.resourceId);

    if (!agent) {
      return {
        granted: false,
        agentId: request.agentId,
        resourceId: request.resourceId,
        count: 0,
        reason: 'Agent not found',
        safetyResult: this.createUnsafeSafetyResult(),
      };
    }

    if (!resource) {
      return {
        granted: false,
        agentId: request.agentId,
        resourceId: request.resourceId,
        count: 0,
        reason: 'Resource not found',
        safetyResult: this.createUnsafeSafetyResult(),
      };
    }

    // Check if request is valid
    if (request.requestCount > resource.totalInstances) {
      return {
        granted: false,
        agentId: request.agentId,
        resourceId: request.resourceId,
        count: 0,
        reason: 'Request exceeds total resource instances',
        safetyResult: this.createUnsafeSafetyResult(),
      };
    }

    // Check if granting request is safe
    const isSafe = this.safetyChecker.isRequestSafe(request);

    if (!isSafe) {
      // Update agent state to waiting
      agent.state = 'waiting' as any;
      agent.waitingFor = request.resourceId;
      
      // Add to resource wait queue
      if (!resource.waitQueue.includes(request.agentId)) {
        resource.waitQueue.push(request.agentId);
      }

      return {
        granted: false,
        agentId: request.agentId,
        resourceId: request.resourceId,
        count: 0,
        reason: 'Granting request would lead to unsafe state',
        safetyResult: this.safetyChecker.checkSafety(),
      };
    }

    // Grant the request
    return this.grantResource(request, agent, resource);
  }

  /**
   * Grant resource to agent
   */
  private grantResource(
    request: ResourceRequest,
    agent: Agent,
    resource: Resource,
  ): AllocationResult {
    // Allocate resource to agent
    if (!agent.heldResources.includes(request.resourceId)) {
      agent.heldResources.push(request.resourceId);
    }
    
    resource.heldBy = request.agentId;
    agent.state = 'active' as any;
    agent.waitingFor = null;
    agent.updatedAt = new Date();

    // Remove from wait queue if present
    const queueIndex = resource.waitQueue.indexOf(request.agentId);
    if (queueIndex >= 0) {
      resource.waitQueue.splice(queueIndex, 1);
    }

    return {
      granted: true,
      agentId: request.agentId,
      resourceId: request.resourceId,
      count: request.requestCount,
      safetyResult: this.safetyChecker.checkSafety(),
    };
  }

  /**
   * Release resources from an agent
   */
  public releaseResources(
    agentId: string,
    resourceIds: string[],
  ): boolean {
    const agent = this.agents.get(agentId);

    if (!agent) {
      return false;
    }

    for (const resourceId of resourceIds) {
      const resource = this.resources.get(resourceId);
      
      if (resource && resource.heldBy === agentId) {
        // Release the resource
        resource.heldBy = null;
        
        // Remove from agent's held resources
        const index = agent.heldResources.indexOf(resourceId);
        if (index >= 0) {
          agent.heldResources.splice(index, 1);
        }

        // Process wait queue
        this.processWaitQueue(resource);
      }
    }

    agent.updatedAt = new Date();
    return true;
  }

  /**
   * Process resource wait queue (FIFO)
   */
  private processWaitQueue(resource: Resource): void {
    while (resource.waitQueue.length > 0 && resource.heldBy === null) {
      const nextAgentId = resource.waitQueue[0];
      const nextAgent = this.agents.get(nextAgentId);

      if (!nextAgent) {
        resource.waitQueue.shift();
        continue;
      }

      const request: ResourceRequest = {
        agentId: nextAgentId,
        resourceId: resource.id,
        requestCount: 1,
      };

      const result = this.requestAllocation(request);

      if (result.granted) {
        resource.waitQueue.shift();
      } else {
        break;
      }
    }
  }

  /**
   * Check current system safety
   */
  public checkSafety(): SafetyResult {
    return this.safetyChecker.checkSafety();
  }

  /**
   * Get all agents
   */
  public getAgents(): Map<string, Agent> {
    return this.agents;
  }

  /**
   * Get all resources
   */
  public getResources(): Map<string, Resource> {
    return this.resources;
  }

  /**
   * Update safety checker with current state
   */
  private updateSafetyChecker(): void {
    this.safetyChecker = new SafetyChecker(this.agents, this.resources);
  }

  /**
   * Create an unsafe safety result for error cases
   */
  private createUnsafeSafetyResult(): SafetyResult {
    return {
      isSafe: false,
      safeSequence: [],
      work: new Map(),
      finish: new Map(),
    };
  }

  /**
   * Create a resource request
   */
  public createRequest(
    agentId: string,
    resourceId: string,
    count: number = 1,
  ): ResourceRequest {
    return this.safetyChecker.createRequest(agentId, resourceId, count);
  }

  /**
   * Get system state summary
   */
  public getSystemState(): {
    totalAgents: number;
    totalResources: number;
    availableResources: number;
    waitingAgents: number;
    isSafe: boolean;
  } {
    let availableCount = 0;
    let waitingCount = 0;

    for (const resource of this.resources.values()) {
      if (resource.heldBy === null) {
        availableCount++;
      }
    }

    for (const agent of this.agents.values()) {
      if (agent.state === AgentState.WAITING) {
        waitingCount++;
      }
    }

    const safetyResult = this.checkSafety();

    return {
      totalAgents: this.agents.size,
      totalResources: this.resources.size,
      availableResources: availableCount,
      waitingAgents: waitingCount,
      isSafe: safetyResult.isSafe,
    };
  }
}
