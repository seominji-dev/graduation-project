/**
 * Tests for API Routes
 */

import { describe, it, expect } from 'vitest';
import routes from '../../src/api/routes/index.js';

describe('API Routes', () => {
  describe('Route Configuration', () => {
    it('should export a router', () => {
      expect(routes).toBeDefined();
      expect(routes).toHaveProperty('stack');
    });

    it('should have health check route', () => {
      const healthRoute = routes.stack.find((layer: any) => layer.route?.path === '/health');
      expect(healthRoute).toBeDefined();
      expect(healthRoute.route.methods.get).toBe(true);
    });

    it('should have agents route', () => {
      const agentsRoute = routes.stack.find((layer: any) => layer.route?.path === '/agents');
      expect(agentsRoute).toBeDefined();
      expect(agentsRoute.route.methods.post).toBe(true);
    });

    it('should have resources routes', () => {
      const resourcesPostRoute = routes.stack.find((layer: any) => layer.route?.path === '/resources');
      expect(resourcesPostRoute).toBeDefined();
      expect(resourcesPostRoute.route.methods.post).toBe(true);

      const requestRoute = routes.stack.find((layer: any) => layer.route?.path === '/resources/request');
      expect(requestRoute).toBeDefined();
      expect(requestRoute.route.methods.post).toBe(true);

      const releaseRoute = routes.stack.find((layer: any) => layer.route?.path === '/resources/release');
      expect(releaseRoute).toBeDefined();
      expect(releaseRoute.route.methods.post).toBe(true);
    });

    it('should have deadlock detection routes', () => {
      const detectRoute = routes.stack.find((layer: any) => layer.route?.path === '/deadlock/detect');
      expect(detectRoute).toBeDefined();
      expect(detectRoute.route.methods.post).toBe(true);

      const victimRoute = routes.stack.find((layer: any) => layer.route?.path === '/deadlock/victim');
      expect(victimRoute).toBeDefined();
      expect(victimRoute.route.methods.post).toBe(true);
    });

    it('should have graph state route', () => {
      const graphRoute = routes.stack.find((layer: any) => layer.route?.path === '/graph');
      expect(graphRoute).toBeDefined();
      expect(graphRoute.route.methods.get).toBe(true);
    });

    it('should have recovery routes', () => {
      const checkpointRoute = routes.stack.find((layer: any) => layer.route?.path === '/recovery/checkpoint/:agentId');
      expect(checkpointRoute).toBeDefined();
      expect(checkpointRoute.route.methods.post).toBe(true);

      const rollbackRoute = routes.stack.find((layer: any) => layer.route?.path === '/recovery/rollback/:agentId');
      expect(rollbackRoute).toBeDefined();
      expect(rollbackRoute.route.methods.post).toBe(true);
    });

    it('should have Banker\'s algorithm route', () => {
      const bankersRoute = routes.stack.find((layer: any) => layer.route?.path === '/bankers');
      expect(bankersRoute).toBeDefined();
      expect(bankersRoute.route.methods.get).toBe(true);
    });

    it('should have system reset route', () => {
      const resetRoute = routes.stack.find((layer: any) => layer.route?.path === '/system/reset');
      expect(resetRoute).toBeDefined();
      expect(resetRoute.route.methods.post).toBe(true);
    });
  });

  describe('Route Handlers Integration', () => {
    it('should bind getHealth to /health route', () => {
      const healthRoute = routes.stack.find((layer: any) => layer.route?.path === '/health');
      expect(healthRoute).toBeDefined();
      expect(typeof healthRoute.route.stack[0].handle).toBe('function');
    });

    it('should bind addAgent to /agents route', () => {
      const agentsRoute = routes.stack.find((layer: any) => layer.route?.path === '/agents');
      expect(agentsRoute).toBeDefined();
      expect(typeof agentsRoute.route.stack[0].handle).toBe('function');
    });

    it('should bind addResource to /resources route', () => {
      const resourcesRoute = routes.stack.find((layer: any) => layer.route?.path === '/resources');
      expect(resourcesRoute).toBeDefined();
      expect(typeof resourcesRoute.route.stack[0].handle).toBe('function');
    });

    it('should bind requestResource to /resources/request route', () => {
      const requestRoute = routes.stack.find((layer: any) => layer.route?.path === '/resources/request');
      expect(requestRoute).toBeDefined();
      expect(typeof requestRoute.route.stack[0].handle).toBe('function');
    });

    it('should bind releaseResource to /resources/release route', () => {
      const releaseRoute = routes.stack.find((layer: any) => layer.route?.path === '/resources/release');
      expect(releaseRoute).toBeDefined();
      expect(typeof releaseRoute.route.stack[0].handle).toBe('function');
    });

    it('should bind detectDeadlock to /deadlock/detect route', () => {
      const detectRoute = routes.stack.find((layer: any) => layer.route?.path === '/deadlock/detect');
      expect(detectRoute).toBeDefined();
      expect(typeof detectRoute.route.stack[0].handle).toBe('function');
    });

    it('should bind selectVictim to /deadlock/victim route', () => {
      const victimRoute = routes.stack.find((layer: any) => layer.route?.path === '/deadlock/victim');
      expect(victimRoute).toBeDefined();
      expect(typeof victimRoute.route.stack[0].handle).toBe('function');
    });

    it('should bind getGraphState to /graph route', () => {
      const graphRoute = routes.stack.find((layer: any) => layer.route?.path === '/graph');
      expect(graphRoute).toBeDefined();
      expect(typeof graphRoute.route.stack[0].handle).toBe('function');
    });

    it('should bind createCheckpoint to /recovery/checkpoint/:agentId route', () => {
      const checkpointRoute = routes.stack.find((layer: any) => layer.route?.path === '/recovery/checkpoint/:agentId');
      expect(checkpointRoute).toBeDefined();
      expect(typeof checkpointRoute.route.stack[0].handle).toBe('function');
    });

    it('should bind rollback to /recovery/rollback/:agentId route', () => {
      const rollbackRoute = routes.stack.find((layer: any) => layer.route?.path === '/recovery/rollback/:agentId');
      expect(rollbackRoute).toBeDefined();
      expect(typeof rollbackRoute.route.stack[0].handle).toBe('function');
    });

    it('should bind getBankersState to /bankers route', () => {
      const bankersRoute = routes.stack.find((layer: any) => layer.route?.path === '/bankers');
      expect(bankersRoute).toBeDefined();
      expect(typeof bankersRoute.route.stack[0].handle).toBe('function');
    });

    it('should bind resetSystem to /system/reset route', () => {
      const resetRoute = routes.stack.find((layer: any) => layer.route?.path === '/system/reset');
      expect(resetRoute).toBeDefined();
      expect(typeof resetRoute.route.stack[0].handle).toBe('function');
    });
  });

  describe('Route Structure', () => {
    it('should have routes defined', () => {
      const routeCount = routes.stack.filter((layer: any) => layer.route).length;
      expect(routeCount).toBeGreaterThan(10);
    });

    it('should have GET routes for health, graph, and bankers', () => {
      const getRoutes = routes.stack.filter((layer: any) => 
        layer.route?.methods.get === true,
      );
      expect(getRoutes.length).toBeGreaterThanOrEqual(2);
    });

    it('should have POST routes for mutations', () => {
      const postRoutes = routes.stack.filter((layer: any) => 
        layer.route?.methods.post === true,
      );
      expect(postRoutes.length).toBeGreaterThan(5);
    });
  });
});
