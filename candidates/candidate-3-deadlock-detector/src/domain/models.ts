/**
 * Domain Models for Deadlock Detector
 * 
 * Core entities representing agents, resources, and wait-for relationships
 * in a multi-agent system for deadlock detection using Wait-For Graph.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Agent represents an AI agent in the multi-agent system
 * Agents can hold resources and wait for other agents to release resources
 */
export interface Agent {
  /** Unique identifier for the agent */
  id: string;
  /** Human-readable name for the agent */
  name: string;
  /** Current state of the agent */
  state: AgentState;
  /** IDs of resources currently held by this agent */
  heldResources: string[];
  /** ID of resource this agent is waiting for (if any) */
  waitingFor: string | null;
  /** Priority level for recovery decisions (higher = more important) */
  priority: number;
  /** Timestamp when agent was created */
  createdAt: Date;
  /** Timestamp of last state change */
  updatedAt: Date;
}

/**
 * Possible states for an agent in the system
 */
export enum AgentState {
  /** Agent is actively running */
  ACTIVE = 'active',
  /** Agent is waiting for a resource */
  WAITING = 'waiting',
  /** Agent is blocked (part of a deadlock cycle) */
  BLOCKED = 'blocked',
  /** Agent has been terminated */
  TERMINATED = 'terminated',
}

/**
 * Resource represents a shared resource in the system
 * Resources can be held by at most one agent at a time (single instance)
 */
export interface Resource {
  /** Unique identifier for the resource */
  id: string;
  /** Human-readable name for the resource */
  name: string;
  /** Type/category of the resource */
  type: ResourceType;
  /** ID of agent currently holding this resource (null if free) */
  heldBy: string | null;
  /** Queue of agent IDs waiting for this resource (FIFO order) */
  waitQueue: string[];
  /** Total available instances (for multi-instance resources) */
  totalInstances: number;
  /** Timestamp when resource was created */
  createdAt: Date;
}

/**
 * Types of resources in the system
 */
export enum ResourceType {
  /** Computational resource (CPU, GPU) */
  COMPUTATIONAL = 'computational',
  /** Storage resource (database, file) */
  STORAGE = 'storage',
  /** Network resource (API endpoint, socket) */
  NETWORK = 'network',
  /** Memory resource (RAM, cache) */
  MEMORY = 'memory',
  /** Custom resource type */
  CUSTOM = 'custom',
}

/**
 * WaitForEdge represents an edge in the Wait-For Graph
 * Edge from Agent A to Agent B means A is waiting for B to release a resource
 */
export interface WaitForEdge {
  /** Unique identifier for the edge */
  id: string;
  /** ID of the agent that is waiting (source of edge) */
  fromAgentId: string;
  /** ID of the agent that is being waited for (target of edge) */
  toAgentId: string;
  /** ID of the resource that caused this wait relationship */
  resourceId: string;
  /** Timestamp when this wait relationship started */
  createdAt: Date;
}

/**
 * Wait-For Graph (WFG) represents the wait relationships between agents
 * A cycle in the WFG indicates a deadlock
 */
export interface WaitForGraph {
  /** All agents currently in the system */
  agents: Map<string, Agent>;
  /** All resources in the system */
  resources: Map<string, Resource>;
  /** All wait-for edges between agents */
  edges: WaitForEdge[];
  /** Timestamp of last graph update */
  lastUpdated: Date;
}

/**
 * Deadlock Cycle represents a detected cycle in the Wait-For Graph
 */
export interface DeadlockCycle {
  /** Ordered list of agent IDs forming the cycle */
  agentIds: string[];
  /** Edges that form the cycle */
  edges: WaitForEdge[];
  /** Timestamp when cycle was detected */
  detectedAt: Date;
  /** Unique identifier for this cycle instance */
  id: string;
}

/**
 * Deadlock Detection Result
 */
export interface DetectionResult {
  /** Whether a deadlock was detected */
  hasDeadlock: boolean;
  /** All detected cycles (empty if no deadlock) */
  cycles: DeadlockCycle[];
  /** Timestamp of detection */
  detectedAt: Date;
  /** Number of agents involved in deadlocks */
  affectedAgents: number;
}

/**
 * Recovery Action represents an action taken to resolve a deadlock
 */
export interface RecoveryAction {
  /** Type of recovery action */
  type: RecoveryActionType;
  /** ID of the agent this action affects */
  agentId: string;
  /** Resources being released (if applicable) */
  resourcesReleased: string[];
  /** Timestamp when action was taken */
  timestamp: Date;
  /** Result of the action */
  result: RecoveryResult;
}

/**
 * Types of recovery actions
 */
export enum RecoveryActionType {
  /** Terminate the agent */
  TERMINATE = 'terminate',
  /** Rollback agent to checkpoint */
  ROLLBACK = 'rollback',
  /** Preempt resources from agent */
  PREEMPT = 'preempt',
}

/**
 * Result of a recovery action
 */
export enum RecoveryResult {
  /** Action succeeded */
  SUCCESS = 'success',
  /** Action failed */
  FAILED = 'failed',
  /** Action was skipped */
  SKIPPED = 'skipped',
}

// ===== Factory Functions =====

/**
 * Create a new Agent instance
 */
export function createAgent(
  name: string,
  priority: number = 5
): Agent {
  return {
    id: uuidv4(),
    name,
    state: AgentState.ACTIVE,
    heldResources: [],
    waitingFor: null,
    priority,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Create a new Resource instance
 */
export function createResource(
  name: string,
  type: ResourceType = ResourceType.CUSTOM,
  instances: number = 1
): Resource {
  return {
    id: uuidv4(),
    name,
    type,
    heldBy: null,
    waitQueue: [],
    totalInstances: instances,
    createdAt: new Date(),
  };
}

/**
 * Create a new WaitForEdge instance
 */
export function createWaitForEdge(
  fromAgentId: string,
  toAgentId: string,
  resourceId: string
): WaitForEdge {
  return {
    id: uuidv4(),
    fromAgentId,
    toAgentId,
    resourceId,
    createdAt: new Date(),
  };
}

/**
 * Create a new empty WaitForGraph
 */
export function createWaitForGraph(): WaitForGraph {
  return {
    agents: new Map<string, Agent>(),
    resources: new Map<string, Resource>(),
    edges: [],
    lastUpdated: new Date(),
  };
}

/**
 * Create a DeadlockCycle from agent IDs and edges
 */
export function createDeadlockCycle(
  agentIds: string[],
  edges: WaitForEdge[]
): DeadlockCycle {
  return {
    agentIds,
    edges,
    detectedAt: new Date(),
    id: uuidv4(),
  };
}

/**
 * Create a DetectionResult
 */
export function createDetectionResult(
  hasDeadlock: boolean,
  cycles: DeadlockCycle[]
): DetectionResult {
  const affectedAgents = new Set<string>();
  cycles.forEach(cycle => {
    cycle.agentIds.forEach(id => affectedAgents.add(id));
  });

  return {
    hasDeadlock,
    cycles,
    detectedAt: new Date(),
    affectedAgents: affectedAgents.size,
  };
}

/**
 * Create a RecoveryAction
 */
export function createRecoveryAction(
  type: RecoveryActionType,
  agentId: string,
  resourcesReleased: string[] = [],
  result: RecoveryResult = RecoveryResult.SUCCESS
): RecoveryAction {
  return {
    type,
    agentId,
    resourcesReleased,
    timestamp: new Date(),
    result,
  };
}
