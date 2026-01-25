/**
 * Checkpoint API Routes
 * REST API endpoints for checkpoint management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { CheckpointManager } from '../managers/CheckpointManager.js';
import { RecoveryManager } from '../recovery/RecoveryManager.js';
import { AgentState, CheckpointCreationOptions, CheckpointType } from '../domain/models.js';

// Validation schemas
const CreateCheckpointSchema = z.object({
  agentId: z.string().uuid(),
  state: z.object({
    messages: z.array(z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
      timestamp: z.date(),
    })),
    variables: z.record(z.any()).default({}),
    executionPosition: z.object({
      step: z.number(),
      functionName: z.string().optional(),
      line: z.number().optional(),
      context: z.string().optional(),
    }).optional(),
    context: z.record(z.any()).optional(),
    status: z.enum(['idle', 'running', 'paused', 'crashed', 'recovering']).default('idle'),
    lastActivity: z.date().optional(),
  }),
  options: z.object({
    type: z.enum(['full', 'incremental']).optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    reason: z.enum(['periodic', 'manual', 'milestone', 'shutdown']).optional(),
    ttl: z.number().nonnegative().optional(),
  }).optional(),
});

const RecoverAgentSchema = z.object({
  agentId: z.string().uuid(),
  checkpointId: z.string().uuid().optional(),
  verifyIntegrity: z.boolean().optional(),
  fallbackToLatest: z.boolean().optional(),
});

const RegisterAgentSchema = z.object({
  agentId: z.string().uuid(),
  initialState: z.any(),
  isImportantTask: z.boolean().optional(),
});

export function createCheckpointRoutes(
  checkpointManager: CheckpointManager,
  recoveryManager: RecoveryManager
): Router {
  const router = Router();

  /**
   * POST /api/checkpoints
   * Create a new checkpoint
   */
  router.post('/checkpoints', async (req: Request, res: Response) => {
    try {
      const body = CreateCheckpointSchema.parse(req.body);
      
      let options: CheckpointCreationOptions | undefined;
      if (body.options) {
        options = {
          type: body.options.type === 'full' ? CheckpointType.FULL : CheckpointType.INCREMENTAL,
          description: body.options.description,
          tags: body.options.tags,
          reason: body.options.reason,
          ttl: body.options.ttl,
        };
      }

      const result = await checkpointManager.createCheckpoint(
        body.agentId,
        body.state as AgentState,
        options
      );

      if (result.success) {
        if (result.skipped) {
          return res.status(200).json({
            success: true,
            skipped: true,
            reason: result.reason,
          });
        }

        return res.status(201).json({
          success: true,
          checkpoint: result.checkpoint,
        });
      }

      return res.status(400).json({
        success: false,
        error: result.error,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request body',
          details: error.errors,
        });
      }

      console.error('Error creating checkpoint:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  /**
   * GET /api/checkpoints/:agentId
   * Get all checkpoints for an agent
   */
  router.get('/checkpoints/:agentId', async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

      const checkpoints = await checkpointManager.getCheckpoints(agentId, limit);
      const stats = await checkpointManager.getStats(agentId);

      return res.status(200).json({
        success: true,
        checkpoints,
        stats,
      });
    } catch (error) {
      console.error('Error getting checkpoints:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  /**
   * GET /api/checkpoints/:agentId/latest
   * Get latest checkpoint for an agent
   */
  router.get('/checkpoints/:agentId/latest', async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;

      const checkpoint = await checkpointManager.getLatestCheckpoint(agentId);

      if (!checkpoint) {
        return res.status(404).json({
          success: false,
          error: 'No checkpoints found for agent',
        });
      }

      return res.status(200).json({
        success: true,
        checkpoint,
      });
    } catch (error) {
      console.error('Error getting latest checkpoint:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  /**
   * DELETE /api/checkpoints/:checkpointId
   * Delete a specific checkpoint
   */
  router.delete('/checkpoints/:checkpointId', async (req: Request, res: Response) => {
    try {
      const { checkpointId } = req.params;

      const deleted = await checkpointManager.deleteCheckpoint(checkpointId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Checkpoint not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Checkpoint deleted',
      });
    } catch (error) {
      console.error('Error deleting checkpoint:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  /**
   * DELETE /api/checkpoints/:agentId/all
   * Delete all checkpoints for an agent
   */
  router.delete('/checkpoints/:agentId/all', async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;

      const count = await checkpointManager.deleteAgentCheckpoints(agentId);

      return res.status(200).json({
        success: true,
        message: `Deleted ${count} checkpoint(s)`,
        count,
      });
    } catch (error) {
      console.error('Error deleting checkpoints:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  /**
   * POST /api/recovery/recover
   * Recover agent to checkpoint
   */
  router.post('/recovery/recover', async (req: Request, res: Response) => {
    try {
      const body = RecoverAgentSchema.parse(req.body);

      const result = await recoveryManager.recover(body.agentId, {
        checkpointId: body.checkpointId,
        verifyIntegrity: body.verifyIntegrity,
        fallbackToLatest: body.fallbackToLatest,
      });

      if (result.success) {
        return res.status(200).json({
          success: true,
          agentId: result.agentId,
          checkpointId: result.checkpointId,
          restoredState: result.restoredState,
          recoveryTime: result.recoveryTime,
        });
      }

      return res.status(400).json({
        success: false,
        error: result.error,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request body',
          details: error.errors,
        });
      }

      console.error('Error recovering agent:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  /**
   * GET /api/recovery/points/:agentId
   * Get available recovery points for an agent
   */
  router.get('/recovery/points/:agentId', async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;

      const recoveryPoints = await recoveryManager.getRecoveryPoints(agentId);

      return res.status(200).json({
        success: true,
        agentId,
        recoveryPoints,
      });
    } catch (error) {
      console.error('Error getting recovery points:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  /**
   * POST /api/recovery/validate/:checkpointId
   * Validate checkpoint for recovery
   */
  router.post('/recovery/validate/:checkpointId', async (req: Request, res: Response) => {
    try {
      const { checkpointId } = req.params;

      const validation = await recoveryManager.validateCheckpoint(checkpointId);

      return res.status(200).json({
        success: true,
        checkpointId,
        valid: validation.valid,
        issues: validation.issues,
      });
    } catch (error) {
      console.error('Error validating checkpoint:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  return router;
}
