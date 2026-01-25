/**
 * API Routes for Deadlock Detector
 */

import { Router } from 'express';
import DeadlockController from '../controllers/DeadlockController.js';

const router = Router();
const controller = new DeadlockController();

// Health check
router.get('/health', controller.getHealth);

// Agent management
router.post('/agents', controller.addAgent);

// Resource management
router.post('/resources', controller.addResource);
router.post('/resources/request', controller.requestResource);
router.post('/resources/release', controller.releaseResource);

// Deadlock detection
router.post('/deadlock/detect', controller.detectDeadlock);
router.post('/deadlock/victim', controller.selectVictim);

// Graph state
router.get('/graph', controller.getGraphState);

// Recovery
router.post('/recovery/checkpoint/:agentId', controller.createCheckpoint);
router.post('/recovery/rollback/:agentId', controller.rollback);

// Banker's Algorithm
router.get('/bankers', controller.getBankersState);

// System management
router.post('/system/reset', controller.resetSystem);

export default router;
