/**
 * Periodic Checkpoint Manager
 * Manages automatic periodic checkpoint creation (REQ-CHECK-033 through REQ-CHECK-039)
 */

import { CheckpointManager } from './CheckpointManager.js';
import { AgentState, CheckpointCreationOptions, CheckpointType } from '../domain/models.js';

interface AgentTracker {
  state: AgentState;
  lastCheckpointTime: number;
  lastStateHash: string;
  isImportantTask: boolean;
  intervalOverride: number | null;
}

export interface PeriodicCheckpointConfig {
  intervalMs: number;
  idleCheckpointsEnabled: boolean;
  adaptiveInterval: boolean;
}

/**
 * PeriodicCheckpointManager Class
 * Handles automatic periodic checkpointing with adaptive intervals
 */
export class PeriodicCheckpointManager {
  private manager: CheckpointManager;
  private timers: Map<string, NodeJS.Timeout>;
  private agents: Map<string, AgentTracker>;
  private config: PeriodicCheckpointConfig;
  private globalTimer: NodeJS.Timeout | null;

  constructor(
    manager: CheckpointManager,
    config: Partial<PeriodicCheckpointConfig> = {}
  ) {
    this.manager = manager;
    this.timers = new Map();
    this.agents = new Map();
    this.globalTimer = null;

    this.config = {
      intervalMs: config.intervalMs || 30000, // 30 seconds default
      idleCheckpointsEnabled: config.idleCheckpointsEnabled ?? true,
      adaptiveInterval: config.adaptiveInterval ?? false,
    };
  }

  /**
   * Register agent for periodic checkpointing
   */
  registerAgent(
    agentId: string,
    initialState: AgentState,
    isImportantTask: boolean = false
  ): void {
    const tracker: AgentTracker = {
      state: initialState,
      lastCheckpointTime: Date.now(),
      lastStateHash: this.hashState(initialState),
      isImportantTask,
      intervalOverride: null,
    };

    this.agents.set(agentId, tracker);

    // Start individual timer for this agent
    this.startAgentTimer(agentId);
  }

  /**
   * Unregister agent from periodic checkpointing
   */
  unregisterAgent(agentId: string): void {
    // Stop timer
    const timer = this.timers.get(agentId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(agentId);
    }

    // Remove agent tracking
    this.agents.delete(agentId);
  }

  /**
   * Update agent state (called by agent during execution)
   */
  updateAgentState(
    agentId: string,
    newState: AgentState,
    isImportantTask?: boolean
  ): void {
    const tracker = this.agents.get(agentId);
    if (!tracker) return;

    tracker.state = newState;
    if (isImportantTask !== undefined) {
      tracker.isImportantTask = isImportantTask;
    }
  }

  /**
   * Set custom interval for specific agent (REQ-CHECK-034)
   */
  setAgentInterval(agentId: string, intervalMs: number): void {
    const tracker = this.agents.get(agentId);
    if (!tracker) return;

    tracker.intervalOverride = intervalMs;

    // Restart timer with new interval
    this.restartAgentTimer(agentId);
  }

  /**
   * Trigger checkpoint for specific agent now (REQ-CHECK-013)
   */
  async triggerCheckpoint(
    agentId: string,
    options?: CheckpointCreationOptions
  ): Promise<boolean> {
    const tracker = this.agents.get(agentId);
    if (!tracker) return false;

    const result = await this.manager.createCheckpoint(
      agentId,
      tracker.state,
      options
    );

    if (result.success && !result.skipped) {
      tracker.lastCheckpointTime = Date.now();
      tracker.lastStateHash = this.hashState(tracker.state);
      return true;
    }

    return false;
  }

  /**
   * Trigger checkpoint for milestone completion (REQ-CHECK-014)
   */
  async triggerMilestoneCheckpoint(
    agentId: string,
    milestone: string
  ): Promise<boolean> {
    return await this.triggerCheckpoint(agentId, {
      type: CheckpointType.FULL,
      reason: 'milestone',
      description: `Milestone: ${milestone}`,
      tags: ['milestone', milestone],
    });
  }

  /**
   * Start global periodic checkpoint timer
   */
  startGlobalTimer(): void {
    if (this.globalTimer) {
      return;
    }

    this.globalTimer = setInterval(async () => {
      await this.performGlobalCheckpoint();
    }, this.config.intervalMs);
  }

  /**
   * Stop global periodic checkpoint timer
   */
  stopGlobalTimer(): void {
    if (this.globalTimer) {
      clearInterval(this.globalTimer);
      this.globalTimer = null;
    }
  }

  /**
   * Create final checkpoint before shutdown (REQ-CHECK-036)
   */
  async createFinalCheckpoint(agentId: string): Promise<boolean> {
    const tracker = this.agents.get(agentId);
    if (!tracker) return false;

    const result = await this.manager.createCheckpoint(
      agentId,
      tracker.state,
      {
        type: CheckpointType.FULL,
        reason: 'shutdown',
        description: 'Final checkpoint before shutdown',
        tags: ['shutdown', 'final'],
      }
    );

    // Unregister after final checkpoint
    this.unregisterAgent(agentId);

    return result.success;
  }

  /**
   * Create final checkpoints for all agents (REQ-CHECK-036)
   */
  async createFinalCheckpointsForAll(): Promise<void> {
    const agentIds = Array.from(this.agents.keys());

    for (const agentId of agentIds) {
      await this.createFinalCheckpoint(agentId);
    }

    this.stopGlobalTimer();
  }

  /**
   * Get statistics
   */
  getStats(): {
    registeredAgents: number;
    activeTimers: number;
    config: PeriodicCheckpointConfig;
  } {
    return {
      registeredAgents: this.agents.size,
      activeTimers: this.timers.size,
      config: this.config,
    };
  }

  /**
   * Perform checkpoint for single agent (called by timer)
   */
  private async performAgentCheckpoint(agentId: string): Promise<void> {
    const tracker = this.agents.get(agentId);
    if (!tracker) return;

    // Check state hash to avoid duplicate checkpoints
    const currentHash = this.hashState(tracker.state);
    if (currentHash === tracker.lastStateHash) {
      return; // No change
    }

    // Create checkpoint
    await this.manager.createCheckpoint(agentId, tracker.state, {
      type: CheckpointType.FULL,
      reason: 'periodic',
      description: `Periodic checkpoint (${this.config.intervalMs}ms interval)`,
      tags: [],
    });

    tracker.lastCheckpointTime = Date.now();
    tracker.lastStateHash = currentHash;
  }

  /**
   * Perform checkpoint for all agents (global timer callback)
   */
  private async performGlobalCheckpoint(): Promise<void> {
    const agentIds = Array.from(this.agents.keys());

    for (const agentId of agentIds) {
      await this.performAgentCheckpoint(agentId);
    }
  }

  /**
   * Start timer for specific agent
   */
  private startAgentTimer(agentId: string): void {
    const tracker = this.agents.get(agentId);
    if (!tracker) return;

    let interval = this.config.intervalMs;
    if (tracker.intervalOverride !== null) {
      interval = tracker.intervalOverride;
    } else if (this.config.adaptiveInterval && tracker.isImportantTask) {
      interval = interval / 2;
    }

    const timer = setInterval(async () => {
      await this.performAgentCheckpoint(agentId);
    }, interval);

    this.timers.set(agentId, timer);
  }

  /**
   * Restart timer for agent (for interval changes)
   */
  private restartAgentTimer(agentId: string): void {
    this.unregisterAgent(agentId);
    
    const tracker = this.agents.get(agentId);
    if (tracker) {
      this.startAgentTimer(agentId);
    }
  }

  /**
   * Calculate simple hash of state for change detection
   */
  private hashState(state: AgentState): string {
    const hashInput = {
      status: state.status,
      messageCount: state.messages.length,
      variables: JSON.stringify(state.variables),
    };
    return JSON.stringify(hashInput);
  }
}
