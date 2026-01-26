/**
 * Tests for DeadlockController
 * API Controller for Deadlock Detection and Recovery
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import DeadlockController from '../../src/api/controllers/DeadlockController.js';
import { AgentState } from '../../src/domain/models.js';

// Mock Response object
const createMockResponse = (): Response => {
  const res: any = {
    statusCode: 200,
    body: {},
    status: function(code: number) {
      this.statusCode = code;
      return this;
    },
    json: function(data: any) {
      this.body = data;
      return this;
    },
  };
  return res as Response;
};

describe('DeadlockController', () => {
  let controller: DeadlockController;

  beforeEach(() => {
    controller = new DeadlockController();
  });

  describe('getHealth', () => {
    it('should return health status with system metrics', () => {
      const req = {} as Request;
      const res = createMockResponse();

      controller.getHealth(req, res);

      expect((res as any).statusCode).toBe(200);
      expect((res as any).body).toHaveProperty('status', 'ok');
      expect((res as any).body).toHaveProperty('timestamp');
      expect((res as any).body).toHaveProperty('agents');
      expect((res as any).body).toHaveProperty('resources');
      expect((res as any).body).toHaveProperty('edges');
    });
  });

  describe('addAgent', () => {
    it('should add an agent with default priority', () => {
      const req = {
        body: { name: 'TestAgent' },
      } as Request;
      const res = createMockResponse();

      controller.addAgent(req, res);

      expect((res as any).statusCode).toBe(201);
      expect((res as any).body.success).toBe(true);
      expect((res as any).body.agent).toHaveProperty('id');
      expect((res as any).body.agent.name).toBe('TestAgent');
      expect((res as any).body.agent.priority).toBe(5);
      expect((res as any).body.agent.state).toBe(AgentState.ACTIVE);
    });

    it('should add an agent with custom priority', () => {
      const req = {
        body: { name: 'PriorityAgent', priority: 10 },
      } as Request;
      const res = createMockResponse();

      controller.addAgent(req, res);

      expect((res as any).statusCode).toBe(201);
      expect((res as any).body.agent.priority).toBe(10);
    });
  });

  describe('addResource', () => {
    it('should add a resource with default values', () => {
      const req = {
        body: { name: 'TestResource' },
      } as Request;
      const res = createMockResponse();

      controller.addResource(req, res);

      expect((res as any).statusCode).toBe(201);
      expect((res as any).body.success).toBe(true);
      expect((res as any).body.resource).toHaveProperty('id');
      expect((res as any).body.resource.name).toBe('TestResource');
      expect((res as any).body.resource.type).toBe('custom');
      expect((res as any).body.resource.totalInstances).toBe(1);
    });

    it('should add a resource with custom type and instances', () => {
      const req = {
        body: { name: 'CPU', type: 'computational', instances: 4 },
      } as Request;
      const res = createMockResponse();

      controller.addResource(req, res);

      expect((res as any).statusCode).toBe(201);
      expect((res as any).body.resource.type).toBe('computational');
      expect((res as any).body.resource.totalInstances).toBe(4);
    });
  });

  describe('requestResource', () => {
    let agentId: string;
    let resourceId: string;

    beforeEach(() => {
      const addAgentReq = { body: { name: 'Agent1' } } as Request;
      const addAgentRes = createMockResponse();
      controller.addAgent(addAgentReq, addAgentRes);
      agentId = (addAgentRes as any).body.agent.id;

      const addResourceReq = { body: { name: 'Resource1' } } as Request;
      const addResourceRes = createMockResponse();
      controller.addResource(addResourceReq, addResourceRes);
      resourceId = (addResourceRes as any).body.resource.id;
    });

    it('should grant resource immediately when available', () => {
      const req = {
        body: { agentId, resourceId },
      } as Request;
      const res = createMockResponse();

      controller.requestResource(req, res);

      expect((res as any).body.success).toBe(true);
      expect((res as any).body.message).toBe('Resource granted immediately');
    });

    it('should return 404 when agent not found', () => {
      const req = {
        body: { agentId: 'non-existent-agent', resourceId },
      } as Request;
      const res = createMockResponse();

      controller.requestResource(req, res);

      expect((res as any).statusCode).toBe(404);
      expect((res as any).body.success).toBe(false);
      expect((res as any).body.error).toBe('Agent or resource not found');
    });

    it('should return 404 when resource not found', () => {
      const req = {
        body: { agentId, resourceId: 'non-existent-resource' },
      } as Request;
      const res = createMockResponse();

      controller.requestResource(req, res);

      expect((res as any).statusCode).toBe(404);
      expect((res as any).body.success).toBe(false);
    });
  });

  describe('releaseResource', () => {
    let agentId: string;
    let resourceId: string;

    beforeEach(() => {
      const addAgentReq = { body: { name: 'Agent1' } } as Request;
      const addAgentRes = createMockResponse();
      controller.addAgent(addAgentReq, addAgentRes);
      agentId = (addAgentRes as any).body.agent.id;

      const addResourceReq = { body: { name: 'Resource1' } } as Request;
      const addResourceRes = createMockResponse();
      controller.addResource(addResourceReq, addResourceRes);
      resourceId = (addResourceRes as any).body.resource.id;

      const requestReq = { body: { agentId, resourceId } } as Request;
      const requestRes = createMockResponse();
      controller.requestResource(requestReq, requestRes);
    });

    it('should release held resource', () => {
      const req = {
        body: { agentId, resourceId },
      } as Request;
      const res = createMockResponse();

      controller.releaseResource(req, res);

      expect((res as any).body.success).toBe(true);
      expect((res as any).body.message).toBe('Resource released');
    });

    it('should return 404 when agent not found', () => {
      const req = {
        body: { agentId: 'non-existent-agent', resourceId },
      } as Request;
      const res = createMockResponse();

      controller.releaseResource(req, res);

      expect((res as any).statusCode).toBe(404);
      expect((res as any).body.success).toBe(false);
    });

    it('should return 400 when agent does not hold resource', () => {
      const addAgentReq = { body: { name: 'Agent2' } } as Request;
      const addAgentRes = createMockResponse();
      controller.addAgent(addAgentReq, addAgentRes);
      const otherAgentId = (addAgentRes as any).body.agent.id;

      const req = {
        body: { agentId: otherAgentId, resourceId },
      } as Request;
      const res = createMockResponse();

      controller.releaseResource(req, res);

      expect((res as any).statusCode).toBe(400);
      expect((res as any).body.success).toBe(false);
      expect((res as any).body.error).toBe('Agent does not hold this resource');
    });
  });

  describe('detectDeadlock', () => {
    it('should detect no deadlock in empty system', () => {
      const req = {} as Request;
      const res = createMockResponse();

      controller.detectDeadlock(req, res);

      expect((res as any).body.success).toBe(true);
      expect((res as any).body.hasDeadlock).toBe(false);
      expect((res as any).body.cycles).toEqual([]);
    });

    it('should detect deadlock when cycle exists', () => {
      const addAgentReq1 = { body: { name: 'Agent1' } } as Request;
      const addAgentRes1 = createMockResponse();
      controller.addAgent(addAgentReq1, addAgentRes1);
      const agent1Id = (addAgentRes1 as any).body.agent.id;

      const addAgentReq2 = { body: { name: 'Agent2' } } as Request;
      const addAgentRes2 = createMockResponse();
      controller.addAgent(addAgentReq2, addAgentRes2);
      const agent2Id = (addAgentRes2 as any).body.agent.id;

      const addAgentReq3 = { body: { name: 'Agent3' } } as Request;
      const addAgentRes3 = createMockResponse();
      controller.addAgent(addAgentReq3, addAgentRes3);
      const agent3Id = (addAgentRes3 as any).body.agent.id;

      const addResourceReq1 = { body: { name: 'R1' } } as Request;
      const addResourceRes1 = createMockResponse();
      controller.addResource(addResourceReq1, addResourceRes1);
      const r1Id = (addResourceRes1 as any).body.resource.id;

      const addResourceReq2 = { body: { name: 'R2' } } as Request;
      const addResourceRes2 = createMockResponse();
      controller.addResource(addResourceReq2, addResourceRes2);
      const r2Id = (addResourceRes2 as any).body.resource.id;

      const addResourceReq3 = { body: { name: 'R3' } } as Request;
      const addResourceRes3 = createMockResponse();
      controller.addResource(addResourceReq3, addResourceRes3);
      const r3Id = (addResourceRes3 as any).body.resource.id;

      controller.requestResource({ body: { agentId: agent1Id, resourceId: r1Id } } as Request, createMockResponse());
      controller.requestResource({ body: { agentId: agent2Id, resourceId: r2Id } } as Request, createMockResponse());
      controller.requestResource({ body: { agentId: agent3Id, resourceId: r3Id } } as Request, createMockResponse());
      controller.requestResource({ body: { agentId: agent1Id, resourceId: r2Id } } as Request, createMockResponse());
      controller.requestResource({ body: { agentId: agent2Id, resourceId: r3Id } } as Request, createMockResponse());
      controller.requestResource({ body: { agentId: agent3Id, resourceId: r1Id } } as Request, createMockResponse());

      const req = {} as Request;
      const res = createMockResponse();

      controller.detectDeadlock(req, res);

      expect((res as any).body.success).toBe(true);
      expect((res as any).body.hasDeadlock).toBe(true);
      expect((res as any).body.cycles.length).toBeGreaterThan(0);
    });
  });

  describe('getGraphState', () => {
    it('should return empty graph state initially', () => {
      const req = {} as Request;
      const res = createMockResponse();

      controller.getGraphState(req, res);

      expect((res as any).body.agents).toEqual([]);
      expect((res as any).body.resources).toEqual([]);
      expect((res as any).body.edges).toEqual([]);
      expect((res as any).body).toHaveProperty('lastUpdated');
    });

    it('should return graph state with agents and resources', () => {
      const addAgentReq = { body: { name: 'TestAgent' } } as Request;
      controller.addAgent(addAgentReq, createMockResponse());

      const addResourceReq = { body: { name: 'TestResource' } } as Request;
      controller.addResource(addResourceReq, createMockResponse());

      const req = {} as Request;
      const res = createMockResponse();

      controller.getGraphState(req, res);

      expect((res as any).body.agents.length).toBe(1);
      expect((res as any).body.resources.length).toBe(1);
      expect((res as any).body.agents[0]).toHaveProperty('id');
      expect((res as any).body.agents[0]).toHaveProperty('name');
      expect((res as any).body.agents[0]).toHaveProperty('state');
      expect((res as any).body.agents[0]).toHaveProperty('priority');
    });
  });

  describe('selectVictim', () => {
    beforeEach(() => {
      const addAgentReq1 = { body: { name: 'LowPriority', priority: 1 } } as Request;
      const addAgentRes1 = createMockResponse();
      controller.addAgent(addAgentReq1, addAgentRes1);

      const addAgentReq2 = { body: { name: 'HighPriority', priority: 10 } } as Request;
      const addAgentRes2 = createMockResponse();
      controller.addAgent(addAgentReq2, addAgentRes2);

      const addAgentReq3 = { body: { name: 'MidPriority', priority: 5 } } as Request;
      const addAgentRes3 = createMockResponse();
      controller.addAgent(addAgentReq3, addAgentRes3);

      const agent1Id = (addAgentRes1 as any).body.agent.id;
      const agent2Id = (addAgentRes2 as any).body.agent.id;
      const agent3Id = (addAgentRes3 as any).body.agent.id;

      const addResourceReq1 = { body: { name: 'R1' } } as Request;
      const addResourceRes1 = createMockResponse();
      controller.addResource(addResourceReq1, addResourceRes1);
      const r1Id = (addResourceRes1 as any).body.resource.id;

      const addResourceReq2 = { body: { name: 'R2' } } as Request;
      const addResourceRes2 = createMockResponse();
      controller.addResource(addResourceReq2, addResourceRes2);
      const r2Id = (addResourceRes2 as any).body.resource.id;

      const addResourceReq3 = { body: { name: 'R3' } } as Request;
      const addResourceRes3 = createMockResponse();
      controller.addResource(addResourceReq3, addResourceRes3);
      const r3Id = (addResourceRes3 as any).body.resource.id;

      controller.requestResource({ body: { agentId: agent1Id, resourceId: r1Id } } as Request, createMockResponse());
      controller.requestResource({ body: { agentId: agent2Id, resourceId: r2Id } } as Request, createMockResponse());
      controller.requestResource({ body: { agentId: agent3Id, resourceId: r3Id } } as Request, createMockResponse());
      controller.requestResource({ body: { agentId: agent1Id, resourceId: r2Id } } as Request, createMockResponse());
      controller.requestResource({ body: { agentId: agent2Id, resourceId: r3Id } } as Request, createMockResponse());
      controller.requestResource({ body: { agentId: agent3Id, resourceId: r1Id } } as Request, createMockResponse());
    });

    it('should select victim with lowest priority strategy', () => {
      const req = {
        body: { strategy: 'lowest_priority' },
      } as Request;
      const res = createMockResponse();

      controller.selectVictim(req, res);

      expect((res as any).body.success).toBe(true);
      expect((res as any).body.victim).toHaveProperty('id');
      expect((res as any).body.victim).toHaveProperty('name');
      expect((res as any).body.victim).toHaveProperty('priority');
      expect((res as any).body).toHaveProperty('reason');
      expect((res as any).body).toHaveProperty('actionType');
    });

    it('should return 404 when no deadlock exists', () => {
      const resetReq = {} as Request;
      const resetRes = createMockResponse();
      controller.resetSystem(resetReq, resetRes);

      const req = {
        body: { strategy: 'lowest_priority' },
      } as Request;
      const res = createMockResponse();

      controller.selectVictim(req, res);

      expect((res as any).statusCode).toBe(404);
      expect((res as any).body.success).toBe(false);
      expect((res as any).body.error).toBe('No deadlock cycle found');
    });
  });

  describe('resetSystem', () => {
    it('should reset the system to initial state', () => {
      const addAgentReq = { body: { name: 'TestAgent' } } as Request;
      controller.addAgent(addAgentReq, createMockResponse());

      const req = {} as Request;
      const res = createMockResponse();

      controller.resetSystem(req, res);

      expect((res as any).body.success).toBe(true);
      expect((res as any).body.message).toBe('System reset complete');

      const graphReq = {} as Request;
      const graphRes = createMockResponse();
      controller.getGraphState(graphReq, graphRes);

      expect((graphRes as any).body.agents).toEqual([]);
      expect((graphRes as any).body.resources).toEqual([]);
      expect((graphRes as any).body.edges).toEqual([]);
    });
  });

  describe('createCheckpoint', () => {
    let agentId: string;

    beforeEach(() => {
      const addAgentReq = { body: { name: 'TestAgent' } } as Request;
      const addAgentRes = createMockResponse();
      controller.addAgent(addAgentReq, addAgentRes);
      agentId = (addAgentRes as any).body.agent.id;
    });

    it('should create checkpoint for agent', () => {
      const req = {
        params: { agentId },
      } as Request;
      const res = createMockResponse();

      controller.createCheckpoint(req, res);

      expect((res as any).body.success).toBe(true);
      expect((res as any).body.checkpoint).toHaveProperty('id');
      expect((res as any).body.checkpoint.agentId).toBe(agentId);
      expect((res as any).body.checkpoint).toHaveProperty('heldResources');
      expect((res as any).body.checkpoint).toHaveProperty('sequenceNumber');
      expect((res as any).body.checkpoint).toHaveProperty('timestamp');
    });

    it('should return 404 when agent not found', () => {
      const req = {
        params: { agentId: 'non-existent-agent' },
      } as Request;
      const res = createMockResponse();

      controller.createCheckpoint(req, res);

      expect((res as any).statusCode).toBe(404);
      expect((res as any).body.success).toBe(false);
      expect((res as any).body.error).toBe('Agent not found');
    });
  });

  describe('rollback', () => {
    let agentId: string;

    beforeEach(() => {
      const addAgentReq = { body: { name: 'TestAgent' } } as Request;
      const addAgentRes = createMockResponse();
      controller.addAgent(addAgentReq, addAgentRes);
      agentId = (addAgentRes as any).body.agent.id;

      controller.createCheckpoint({ params: { agentId } } as Request, createMockResponse());
    });

    it('should rollback agent to checkpoint', () => {
      const req = {
        params: { agentId },
      } as Request;
      const res = createMockResponse();

      controller.rollback(req, res);

      expect((res as any).body).toHaveProperty('success');
      expect((res as any).body).toHaveProperty('agentId', agentId);
      expect((res as any).body).toHaveProperty('checkpointId');
      expect((res as any).body).toHaveProperty('resourcesReleased');
    });

    it('should handle rollback for non-existent agent', () => {
      const req = {
        params: { agentId: 'non-existent-agent' },
      } as Request;
      const res = createMockResponse();

      controller.rollback(req, res);

      expect((res as any).body).toHaveProperty('success');
      expect((res as any).body.agentId).toBe('non-existent-agent');
    });
  });

  describe('getBankersState', () => {
    it('should return Banker\'s algorithm state', () => {
      const req = {} as Request;
      const res = createMockResponse();

      controller.getBankersState(req, res);

      expect((res as any).body).toHaveProperty('safetyResult');
      expect((res as any).body).toHaveProperty('systemState');
      expect((res as any).body.safetyResult).toHaveProperty('isSafe');
      expect((res as any).body.safetyResult).toHaveProperty('safeSequence');
    });
  });
});
