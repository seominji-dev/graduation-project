/**
 * Deadlock Detection Controller
 */

import { Request, Response } from 'express';
import { AgentState, WaitForGraph, createWaitForGraph, createAgent, createResource, createWaitForEdge, createDetectionResult } from '../../domain/models.js';
import { CycleDetector } from '../../detectors/CycleDetector.js';
import { VictimSelector, VictimSelectionStrategy } from '../../recovery/VictimSelector.js';
import { RollbackManager } from '../../recovery/RollbackManager.js';
import { BankersAlgorithm } from '../../avoiders/BankersAlgorithm.js';

class DeadlockController {
  private wfg: WaitForGraph;
  private detector: CycleDetector;
  private victimSelector: VictimSelector;
  private rollbackManager: RollbackManager;
  private bankersAlgorithm: BankersAlgorithm;

  constructor() {
    this.wfg = createWaitForGraph();
    this.detector = new CycleDetector(this.wfg);
    this.victimSelector = new VictimSelector();
    this.rollbackManager = new RollbackManager();
    this.bankersAlgorithm = new BankersAlgorithm();
  }

  public getHealth = (_req: Request, res: Response): void => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      agents: this.wfg.agents.size,
      resources: this.wfg.resources.size,
      edges: this.wfg.edges.length,
    });
  };

  public addAgent = (req: Request, res: Response): void => {
    const { name, priority = 5 } = req.body;
    
    const agent = createAgent(name, priority);
    this.wfg.agents.set(agent.id, agent);

    res.status(201).json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        priority: agent.priority,
        state: agent.state,
      },
    });
  };

  public addResource = (req: Request, res: Response): void => {
    const { name, type = 'custom', instances = 1 } = req.body;
    
    const resource = createResource(name, type, instances);
    this.wfg.resources.set(resource.id, resource);

    res.status(201).json({
      success: true,
      resource: {
        id: resource.id,
        name: resource.name,
        type: resource.type,
        totalInstances: resource.totalInstances,
      },
    });
  };

  public requestResource = (req: Request, res: Response): void => {
    const { agentId, resourceId } = req.body;
    
    const agent = this.wfg.agents.get(agentId);
    const resource = this.wfg.resources.get(resourceId);

    if (!agent || !resource) {
      res.status(404).json({
        success: false,
        error: 'Agent or resource not found',
      });
      return;
    }

    const holdingAgentId = resource.heldBy;
    
    if (holdingAgentId === null) {
      resource.heldBy = agentId;
      agent.heldResources.push(resourceId);
      
      res.json({
        success: true,
        message: 'Resource granted immediately',
      });
    } else {
      agent.waitingFor = resourceId;
      agent.state = AgentState.WAITING;
      
      const edge = createWaitForEdge(agentId, holdingAgentId, resourceId);
      this.wfg.edges.push(edge);
      
      res.json({
        success: true,
        message: 'Agent added to wait queue',
        waitingFor: holdingAgentId,
      });
    }
  };

  public releaseResource = (req: Request, res: Response): void => {
    const { agentId, resourceId } = req.body;
    
    const agent = this.wfg.agents.get(agentId);
    const resource = this.wfg.resources.get(resourceId);

    if (!agent || !resource) {
      res.status(404).json({
        success: false,
        error: 'Agent or resource not found',
      });
      return;
    }

    if (resource.heldBy === agentId) {
      resource.heldBy = null;
      const idx = agent.heldResources.indexOf(resourceId);
      if (idx >= 0) {
        agent.heldResources.splice(idx, 1);
      }
      
      res.json({
        success: true,
        message: 'Resource released',
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Agent does not hold this resource',
      });
    }
  };

  public detectDeadlock = (_req: Request, res: Response): void => {
    this.detector = new CycleDetector(this.wfg);
    const cycles = this.detector.detect();

    const result = createDetectionResult(cycles.length > 0, cycles);

    res.json({
      success: true,
      hasDeadlock: result.hasDeadlock,
      cycles: result.cycles.map(cycle => ({
        id: cycle.id,
        agentIds: cycle.agentIds,
        detectedAt: cycle.detectedAt,
      })),
      affectedAgents: result.affectedAgents,
      detectedAt: result.detectedAt,
    });
  };

  public getGraphState = (_req: Request, res: Response): void => {
    const agents = Array.from(this.wfg.agents.values()).map(agent => ({
      id: agent.id,
      name: agent.name,
      state: agent.state,
      heldResources: agent.heldResources,
      waitingFor: agent.waitingFor,
      priority: agent.priority,
    }));

    const resources = Array.from(this.wfg.resources.values()).map(resource => ({
      id: resource.id,
      name: resource.name,
      type: resource.type,
      heldBy: resource.heldBy,
      waitQueue: resource.waitQueue,
      totalInstances: resource.totalInstances,
    }));

    const edges = this.wfg.edges.map(edge => ({
      from: edge.fromAgentId,
      to: edge.toAgentId,
      resource: edge.resourceId,
    }));

    res.json({
      agents,
      resources,
      edges,
      lastUpdated: this.wfg.lastUpdated,
    });
  };

  public selectVictim = (req: Request, res: Response): void => {
    const { cycleId, strategy = 'lowest_priority' } = req.body;

    this.detector = new CycleDetector(this.wfg);
    const cycles = this.detector.detect();

    const targetCycle = cycles.find(c => c.id === cycleId) || cycles[0];

    if (!targetCycle) {
      res.status(404).json({
        success: false,
        error: 'No deadlock cycle found',
      });
      return;
    }

    this.victimSelector.setStrategy(strategy as VictimSelectionStrategy);
    const selection = this.victimSelector.selectVictim(targetCycle, this.wfg.agents);

    res.json({
      success: true,
      victim: {
        id: selection.victim.id,
        name: selection.victim.name,
        priority: selection.victim.priority,
      },
      reason: selection.reason,
      actionType: selection.actionType,
      score: selection.score,
    });
  };

  public resetSystem = (_req: Request, res: Response): void => {
    this.wfg = createWaitForGraph();
    this.detector = new CycleDetector(this.wfg);
    this.rollbackManager.clearAllCheckpoints();
    this.bankersAlgorithm = new BankersAlgorithm();

    res.json({
      success: true,
      message: 'System reset complete',
    });
  };

  public createCheckpoint = (req: Request, res: Response): void => {
    const { agentId } = req.params;
    
    const agent = this.wfg.agents.get(agentId);

    if (!agent) {
      res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
      return;
    }

    const checkpoint = this.rollbackManager.createCheckpoint(agent);

    res.json({
      success: true,
      checkpoint: {
        id: checkpoint.id,
        agentId: checkpoint.agentId,
        heldResources: checkpoint.heldResources,
        sequenceNumber: checkpoint.sequenceNumber,
        timestamp: checkpoint.timestamp,
      },
    });
  };

  public rollback = (req: Request, res: Response): void => {
    const { agentId } = req.params;
    
    const result = this.rollbackManager.rollbackToLatest(
      agentId,
      this.wfg.agents,
      this.wfg.resources,
    );

    res.json({
      success: result.success,
      agentId: result.agentId,
      checkpointId: result.checkpointId,
      resourcesReleased: result.resourcesReleased,
      error: result.error,
    });
  };

  public getBankersState = (_req: Request, res: Response): void => {
    const safetyResult = this.bankersAlgorithm.checkSafety();
    const systemState = this.bankersAlgorithm.getSystemState();

    res.json({
      safetyResult: {
        isSafe: safetyResult.isSafe,
        safeSequence: safetyResult.safeSequence,
      },
      systemState,
    });
  };
}

export default DeadlockController;
