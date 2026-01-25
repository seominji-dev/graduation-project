/**
 * Rollback Manager for Deadlock Recovery
 */

import {
  Agent,
  Resource,
  RecoveryAction,
  RecoveryResult,
  createRecoveryAction,
} from '../domain/models.js';

export interface Checkpoint {
  id: string;
  agentId: string;
  heldResources: string[];
  state: string;
  timestamp: Date;
  sequenceNumber: number;
}

export interface RollbackResult {
  success: boolean;
  agentId: string;
  checkpointId: string;
  resourcesReleased: string[];
  timestamp: Date;
  error?: string;
}

export class RollbackManager {
  private checkpoints: Map<string, Checkpoint[]>;
  private currentSequence: Map<string, number>;
  private maxCheckpointsPerAgent: number;

  constructor(maxCheckpointsPerAgent: number = 10) {
    this.checkpoints = new Map();
    this.currentSequence = new Map();
    this.maxCheckpointsPerAgent = maxCheckpointsPerAgent;
  }

  public createCheckpoint(agent: Agent): Checkpoint {
    const agentCheckpoints = this.checkpoints.get(agent.id) || [];
    const sequenceNumber = (this.currentSequence.get(agent.id) || 0) + 1;
    
    const timestamp = new Date();
    const checkpoint: Checkpoint = {
      id: this.generateCheckpointId(agent.id, sequenceNumber, timestamp.getTime()),
      agentId: agent.id,
      heldResources: [...agent.heldResources],
      state: agent.state,
      timestamp: timestamp,
      sequenceNumber,
    };

    agentCheckpoints.push(checkpoint);
    
    if (agentCheckpoints.length > this.maxCheckpointsPerAgent) {
      agentCheckpoints.shift();
    }

    this.checkpoints.set(agent.id, agentCheckpoints);
    this.currentSequence.set(agent.id, sequenceNumber);

    return checkpoint;
  }

  public rollback(
    agentId: string,
    checkpointId: string | null,
    agents: Map<string, Agent>,
    resources: Map<string, Resource>,
  ): RollbackResult {
    const agent = agents.get(agentId);
    
    if (!agent) {
      return {
        success: false,
        agentId: agentId,
        checkpointId: checkpointId || '',
        resourcesReleased: [],
        timestamp: new Date(),
        error: 'Agent not found',
      };
    }

    const agentCheckpoints = this.checkpoints.get(agentId);
    
    if (!agentCheckpoints || agentCheckpoints.length === 0) {
      return {
        success: false,
        agentId: agentId,
        checkpointId: checkpointId || '',
        resourcesReleased: [],
        timestamp: new Date(),
        error: 'No checkpoints found for agent',
      };
    }

    let targetCheckpoint: Checkpoint;

    if (checkpointId) {
      targetCheckpoint = agentCheckpoints.find(cp => cp.id === checkpointId)!;
      
      if (!targetCheckpoint) {
        return {
          success: false,
          agentId: agentId,
          checkpointId: checkpointId,
          resourcesReleased: [],
          timestamp: new Date(),
          error: 'Checkpoint not found',
        };
      }
    } else {
      targetCheckpoint = agentCheckpoints[agentCheckpoints.length - 1];
    }

    const resourcesReleased = this.performRollback(
      agent,
      targetCheckpoint,
      resources,
    );

    return {
      success: true,
      agentId: agentId,
      checkpointId: targetCheckpoint.id,
      resourcesReleased: resourcesReleased,
      timestamp: new Date(),
    };
  }

  private performRollback(
    agent: Agent,
    checkpoint: Checkpoint,
    resources: Map<string, Resource>,
  ): string[] {
    const resourcesReleased: string[] = [];

    for (const resourceId of agent.heldResources) {
      if (!checkpoint.heldResources.includes(resourceId)) {
        const resource = resources.get(resourceId);
        
        if (resource) {
          resource.heldBy = null;
          resourcesReleased.push(resourceId);
        }
      }
    }

    agent.heldResources = [...checkpoint.heldResources];
    agent.state = checkpoint.state as any;
    agent.waitingFor = null;
    agent.updatedAt = new Date();

    return resourcesReleased;
  }

  public rollbackToLatest(
    agentId: string,
    agents: Map<string, Agent>,
    resources: Map<string, Resource>,
  ): RollbackResult {
    return this.rollback(agentId, null, agents, resources);
  }

  public getCheckpoints(agentId: string): Checkpoint[] {
    return this.checkpoints.get(agentId) || [];
  }

  public getLatestCheckpoint(agentId: string): Checkpoint | null {
    const checkpoints = this.checkpoints.get(agentId);
    
    if (!checkpoints || checkpoints.length === 0) {
      return null;
    }

    return checkpoints[checkpoints.length - 1];
  }

  public clearCheckpoints(agentId: string): void {
    this.checkpoints.delete(agentId);
    this.currentSequence.delete(agentId);
  }

  public clearAllCheckpoints(): void {
    this.checkpoints.clear();
    this.currentSequence.clear();
  }

  public getTotalCheckpointCount(): number {
    let total = 0;
    
    for (const checkpoints of this.checkpoints.values()) {
      total += checkpoints.length;
    }
    
    return total;
  }

  private generateCheckpointId(agentId: string, seq: number, time: number): string {
    return agentId + '-cp-' + seq + '-' + time;
  }

  public static createRecoveryActionResult(
    result: RollbackResult,
  ): RecoveryAction {
    return createRecoveryAction(
      'rollback' as any,
      result.agentId,
      result.resourcesReleased,
      result.success ? RecoveryResult.SUCCESS : RecoveryResult.FAILED,
    );
  }
}
