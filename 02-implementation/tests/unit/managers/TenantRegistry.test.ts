/**
 * Tenant Registry Unit Tests
 *
 * SPEC-SCHED-004: Weight-based fair queuing for multi-tenant LLM requests
 * Tests for tenant registration and weight management
 */

import {
  TenantRegistry,
  Tenant,
  TenantTier,
  DEFAULT_WEIGHTS,
} from "../../../src/managers/TenantRegistry";

describe("TenantRegistry", () => {
  let registry: TenantRegistry;

  beforeEach(() => {
    registry = new TenantRegistry();
  });

  describe("registerTenant", () => {
    it("should register a new tenant", () => {
      const tenant = registry.registerTenant({
        id: "tenant-1",
        name: "Test Tenant",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      expect(tenant.id).toBe("tenant-1");
      expect(tenant.name).toBe("Test Tenant");
      expect(tenant.tier).toBe(TenantTier.STANDARD);
      expect(tenant.weight).toBe(10);
      expect(tenant.createdAt).toBeInstanceOf(Date);
    });

    it("should add createdAt timestamp if missing", () => {
      const beforeTime = Date.now();
      const tenant = registry.registerTenant({
        id: "tenant-1",
        name: "Test Tenant",
        tier: TenantTier.STANDARD,
        weight: 10,
      });
      const afterTime = Date.now();

      expect(tenant.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime);
      expect(tenant.createdAt.getTime()).toBeLessThanOrEqual(afterTime);
    });

    it("should allow registering multiple tenants", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Tenant 1",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      registry.registerTenant({
        id: "tenant-2",
        name: "Tenant 2",
        tier: TenantTier.PREMIUM,
        weight: 50,
      });

      expect(registry.getTenantCount()).toBe(2);
    });

    it("should replace existing tenant with same ID", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Original Tenant",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      registry.registerTenant({
        id: "tenant-1",
        name: "Updated Tenant",
        tier: TenantTier.PREMIUM,
        weight: 50,
      });

      const tenant = registry.getTenant("tenant-1");
      expect(tenant?.name).toBe("Updated Tenant");
      expect(tenant?.tier).toBe(TenantTier.PREMIUM);
      expect(tenant?.weight).toBe(50);
    });

    it("should preserve metadata if provided", () => {
      const metadata = { region: "us-east", plan: "annual" };
      const tenant = registry.registerTenant({
        id: "tenant-1",
        name: "Test Tenant",
        tier: TenantTier.ENTERPRISE,
        weight: 100,
        metadata,
      });

      expect(tenant.metadata).toEqual(metadata);
    });
  });

  describe("getTenant", () => {
    it("should return registered tenant", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Test Tenant",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      const tenant = registry.getTenant("tenant-1");

      expect(tenant).toBeDefined();
      expect(tenant?.id).toBe("tenant-1");
    });

    it("should return undefined for non-existent tenant", () => {
      const tenant = registry.getTenant("non-existent");
      expect(tenant).toBeUndefined();
    });

    it("should return full tenant object", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Test Tenant",
        tier: TenantTier.STANDARD,
        weight: 10,
        metadata: { key: "value" },
      });

      const tenant = registry.getTenant("tenant-1");

      expect(tenant).toEqual({
        id: "tenant-1",
        name: "Test Tenant",
        tier: TenantTier.STANDARD,
        weight: 10,
        createdAt: expect.any(Date),
        metadata: { key: "value" },
      });
    });
  });

  describe("getTenantWeight", () => {
    it("should return weight for existing tenant", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Test Tenant",
        tier: TenantTier.STANDARD,
        weight: 25,
      });

      expect(registry.getTenantWeight("tenant-1")).toBe(25);
    });

    it("should return default FREE tier weight for unknown tenant", () => {
      expect(registry.getTenantWeight("non-existent")).toBe(
        DEFAULT_WEIGHTS[TenantTier.FREE],
      );
    });

    it("should return 1 for unknown tenant (FREE tier default)", () => {
      expect(registry.getTenantWeight("unknown-tenant")).toBe(1);
    });
  });

  describe("hasTenant", () => {
    it("should return true for existing tenant", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Test Tenant",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      expect(registry.hasTenant("tenant-1")).toBe(true);
    });

    it("should return false for non-existent tenant", () => {
      expect(registry.hasTenant("non-existent")).toBe(false);
    });

    it("should return false for empty registry", () => {
      expect(registry.hasTenant("any-tenant")).toBe(false);
    });
  });

  describe("updateTenantWeight", () => {
    it("should update weight for existing tenant", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Test Tenant",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      const result = registry.updateTenantWeight("tenant-1", 50);

      expect(result).toBe(true);
      expect(registry.getTenantWeight("tenant-1")).toBe(50);
    });

    it("should return false for non-existent tenant", () => {
      const result = registry.updateTenantWeight("non-existent", 50);
      expect(result).toBe(false);
    });

    it("should preserve other tenant properties", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Test Tenant",
        tier: TenantTier.STANDARD,
        weight: 10,
        metadata: { key: "value" },
      });

      registry.updateTenantWeight("tenant-1", 100);

      const tenant = registry.getTenant("tenant-1");
      expect(tenant?.name).toBe("Test Tenant");
      expect(tenant?.tier).toBe(TenantTier.STANDARD);
      expect(tenant?.metadata).toEqual({ key: "value" });
    });

    it("should handle zero weight", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Test Tenant",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      registry.updateTenantWeight("tenant-1", 0);

      expect(registry.getTenantWeight("tenant-1")).toBe(0);
    });

    it("should handle very large weight", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Test Tenant",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      registry.updateTenantWeight("tenant-1", 10000);

      expect(registry.getTenantWeight("tenant-1")).toBe(10000);
    });
  });

  describe("updateTenantTier", () => {
    it("should update tier for existing tenant", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Test Tenant",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      const result = registry.updateTenantTier(
        "tenant-1",
        TenantTier.ENTERPRISE,
      );

      expect(result).toBe(true);
      const tenant = registry.getTenant("tenant-1");
      expect(tenant?.tier).toBe(TenantTier.ENTERPRISE);
      expect(tenant?.weight).toBe(DEFAULT_WEIGHTS[TenantTier.ENTERPRISE]);
    });

    it("should update weight to default for new tier", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Test Tenant",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      registry.updateTenantTier("tenant-1", TenantTier.PREMIUM);

      expect(registry.getTenantWeight("tenant-1")).toBe(
        DEFAULT_WEIGHTS[TenantTier.PREMIUM],
      );
    });

    it("should return false for non-existent tenant", () => {
      const result = registry.updateTenantTier(
        "non-existent",
        TenantTier.ENTERPRISE,
      );
      expect(result).toBe(false);
    });

    it("should preserve other tenant properties", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Test Tenant",
        tier: TenantTier.STANDARD,
        weight: 10,
        metadata: { region: "us-west" },
      });

      registry.updateTenantTier("tenant-1", TenantTier.ENTERPRISE);

      const tenant = registry.getTenant("tenant-1");
      expect(tenant?.name).toBe("Test Tenant");
      expect(tenant?.metadata).toEqual({ region: "us-west" });
    });

    it("should handle all tier transitions", () => {
      const tiers = [
        TenantTier.FREE,
        TenantTier.STANDARD,
        TenantTier.PREMIUM,
        TenantTier.ENTERPRISE,
      ];

      registry.registerTenant({
        id: "tenant-1",
        name: "Test Tenant",
        tier: TenantTier.FREE,
        weight: DEFAULT_WEIGHTS[TenantTier.FREE],
      });

      for (const tier of tiers) {
        const result = registry.updateTenantTier("tenant-1", tier);
        expect(result).toBe(true);
        expect(registry.getTenant("tenant-1")?.tier).toBe(tier);
        expect(registry.getTenantWeight("tenant-1")).toBe(
          DEFAULT_WEIGHTS[tier],
        );
      }
    });
  });

  describe("getAllTenants", () => {
    it("should return empty array for empty registry", () => {
      const tenants = registry.getAllTenants();
      expect(tenants).toEqual([]);
    });

    it("should return all registered tenants", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Tenant 1",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      registry.registerTenant({
        id: "tenant-2",
        name: "Tenant 2",
        tier: TenantTier.PREMIUM,
        weight: 50,
      });

      registry.registerTenant({
        id: "tenant-3",
        name: "Tenant 3",
        tier: TenantTier.FREE,
        weight: 1,
      });

      const tenants = registry.getAllTenants();

      expect(tenants.length).toBe(3);
      expect(tenants.map((t) => t.id).sort()).toEqual([
        "tenant-1",
        "tenant-2",
        "tenant-3",
      ]);
    });

    it("should return new array with tenant references", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Test Tenant",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      const tenants1 = registry.getAllTenants();
      const tenants2 = registry.getAllTenants();

      // Different array instances
      expect(tenants1).not.toBe(tenants2);
      // But same tenant objects
      expect(tenants1[0]).toBe(tenants2[0]);
    });
  });

  describe("getTotalWeight", () => {
    it("should return 0 for empty registry", () => {
      expect(registry.getTotalWeight()).toBe(0);
    });

    it("should sum all tenant weights", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Tenant 1",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      registry.registerTenant({
        id: "tenant-2",
        name: "Tenant 2",
        tier: TenantTier.PREMIUM,
        weight: 50,
      });

      registry.registerTenant({
        id: "tenant-3",
        name: "Tenant 3",
        tier: TenantTier.ENTERPRISE,
        weight: 100,
      });

      expect(registry.getTotalWeight()).toBe(160);
    });

    it("should update when tenant weight changes", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Tenant 1",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      expect(registry.getTotalWeight()).toBe(10);

      registry.updateTenantWeight("tenant-1", 50);

      expect(registry.getTotalWeight()).toBe(50);
    });

    it("should update when tenant is removed", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Tenant 1",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      registry.registerTenant({
        id: "tenant-2",
        name: "Tenant 2",
        tier: TenantTier.PREMIUM,
        weight: 50,
      });

      expect(registry.getTotalWeight()).toBe(60);

      registry.removeTenant("tenant-1");

      expect(registry.getTotalWeight()).toBe(50);
    });
  });

  describe("removeTenant", () => {
    it("should remove existing tenant", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Test Tenant",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      const result = registry.removeTenant("tenant-1");

      expect(result).toBe(true);
      expect(registry.hasTenant("tenant-1")).toBe(false);
    });

    it("should return false for non-existent tenant", () => {
      const result = registry.removeTenant("non-existent");
      expect(result).toBe(false);
    });

    it("should decrease tenant count", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Tenant 1",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      registry.registerTenant({
        id: "tenant-2",
        name: "Tenant 2",
        tier: TenantTier.PREMIUM,
        weight: 50,
      });

      expect(registry.getTenantCount()).toBe(2);

      registry.removeTenant("tenant-1");

      expect(registry.getTenantCount()).toBe(1);
    });
  });

  describe("getOrCreateDefaultTenant", () => {
    it("should create default tenant if not exists", () => {
      const tenant = registry.getOrCreateDefaultTenant();

      expect(tenant).toBeDefined();
      expect(tenant.id).toBe("default");
      expect(tenant.name).toBe("Default Tenant");
      expect(tenant.tier).toBe(TenantTier.STANDARD);
      expect(tenant.weight).toBe(DEFAULT_WEIGHTS[TenantTier.STANDARD]);
    });

    it("should return existing default tenant", () => {
      const tenant1 = registry.getOrCreateDefaultTenant();
      const tenant2 = registry.getOrCreateDefaultTenant();

      expect(tenant1).toBe(tenant2);
      expect(registry.getTenantCount()).toBe(1);
    });

    it("should use default tenant ID", () => {
      registry.getOrCreateDefaultTenant();

      expect(registry.hasTenant("default")).toBe(true);
    });
  });

  describe("setDefaultTenantId", () => {
    it("should change default tenant ID", () => {
      registry.setDefaultTenantId("my-default");

      registry.registerTenant({
        id: "my-default",
        name: "My Default",
        tier: TenantTier.PREMIUM,
        weight: 50,
      });

      const tenant = registry.getOrCreateDefaultTenant();

      expect(tenant.id).toBe("my-default");
      expect(tenant.name).toBe("My Default");
    });

    it("should create new default if set ID does not exist", () => {
      registry.setDefaultTenantId("new-default");

      const tenant = registry.getOrCreateDefaultTenant();

      expect(tenant.id).toBe("new-default");
      expect(registry.hasTenant("new-default")).toBe(true);
    });
  });

  describe("getTenantCount", () => {
    it("should return 0 for empty registry", () => {
      expect(registry.getTenantCount()).toBe(0);
    });

    it("should count all registered tenants", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Tenant 1",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      registry.registerTenant({
        id: "tenant-2",
        name: "Tenant 2",
        tier: TenantTier.PREMIUM,
        weight: 50,
      });

      registry.registerTenant({
        id: "tenant-3",
        name: "Tenant 3",
        tier: TenantTier.ENTERPRISE,
        weight: 100,
      });

      expect(registry.getTenantCount()).toBe(3);
    });

    it("should update count after tenant removal", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Tenant 1",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      registry.registerTenant({
        id: "tenant-2",
        name: "Tenant 2",
        tier: TenantTier.PREMIUM,
        weight: 50,
      });

      registry.removeTenant("tenant-1");

      expect(registry.getTenantCount()).toBe(1);
    });
  });

  describe("clear", () => {
    it("should remove all tenants", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Tenant 1",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      registry.registerTenant({
        id: "tenant-2",
        name: "Tenant 2",
        tier: TenantTier.PREMIUM,
        weight: 50,
      });

      registry.clear();

      expect(registry.getTenantCount()).toBe(0);
      expect(registry.getAllTenants()).toEqual([]);
    });

    it("should reset total weight to 0", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Tenant 1",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      registry.clear();

      expect(registry.getTotalWeight()).toBe(0);
    });

    it("should allow registering new tenants after clear", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Tenant 1",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      registry.clear();

      registry.registerTenant({
        id: "tenant-2",
        name: "Tenant 2",
        tier: TenantTier.PREMIUM,
        weight: 50,
      });

      expect(registry.getTenantCount()).toBe(1);
      expect(registry.hasTenant("tenant-2")).toBe(true);
    });
  });

  describe("initializeDefaultTenants", () => {
    it("should create four default tenants", () => {
      registry.initializeDefaultTenants();

      expect(registry.getTenantCount()).toBe(4);
    });

    it("should create enterprise tenant", () => {
      registry.initializeDefaultTenants();

      const tenant = registry.getTenant("tenant-enterprise");
      expect(tenant).toBeDefined();
      expect(tenant?.name).toBe("Enterprise Client");
      expect(tenant?.tier).toBe(TenantTier.ENTERPRISE);
      expect(tenant?.weight).toBe(DEFAULT_WEIGHTS[TenantTier.ENTERPRISE]);
    });

    it("should create premium tenant", () => {
      registry.initializeDefaultTenants();

      const tenant = registry.getTenant("tenant-premium");
      expect(tenant).toBeDefined();
      expect(tenant?.name).toBe("Premium Client");
      expect(tenant?.tier).toBe(TenantTier.PREMIUM);
      expect(tenant?.weight).toBe(DEFAULT_WEIGHTS[TenantTier.PREMIUM]);
    });

    it("should create standard tenant", () => {
      registry.initializeDefaultTenants();

      const tenant = registry.getTenant("tenant-standard");
      expect(tenant).toBeDefined();
      expect(tenant?.name).toBe("Standard Client");
      expect(tenant?.tier).toBe(TenantTier.STANDARD);
      expect(tenant?.weight).toBe(DEFAULT_WEIGHTS[TenantTier.STANDARD]);
    });

    it("should create free tenant", () => {
      registry.initializeDefaultTenants();

      const tenant = registry.getTenant("tenant-free");
      expect(tenant).toBeDefined();
      expect(tenant?.name).toBe("Free Tier Client");
      expect(tenant?.tier).toBe(TenantTier.FREE);
      expect(tenant?.weight).toBe(DEFAULT_WEIGHTS[TenantTier.FREE]);
    });

    it("should have correct total weight after initialization", () => {
      registry.initializeDefaultTenants();

      const expectedTotal =
        DEFAULT_WEIGHTS[TenantTier.ENTERPRISE] +
        DEFAULT_WEIGHTS[TenantTier.PREMIUM] +
        DEFAULT_WEIGHTS[TenantTier.STANDARD] +
        DEFAULT_WEIGHTS[TenantTier.FREE];

      expect(registry.getTotalWeight()).toBe(expectedTotal);
    });

    it("should add to existing tenants if not empty", () => {
      registry.registerTenant({
        id: "custom-tenant",
        name: "Custom",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      registry.initializeDefaultTenants();

      expect(registry.getTenantCount()).toBe(5);
      expect(registry.hasTenant("custom-tenant")).toBe(true);
    });
  });

  describe("DEFAULT_WEIGHTS", () => {
    it("should have correct weights for all tiers", () => {
      expect(DEFAULT_WEIGHTS[TenantTier.ENTERPRISE]).toBe(100);
      expect(DEFAULT_WEIGHTS[TenantTier.PREMIUM]).toBe(50);
      expect(DEFAULT_WEIGHTS[TenantTier.STANDARD]).toBe(10);
      expect(DEFAULT_WEIGHTS[TenantTier.FREE]).toBe(1);
    });

    it("should have weight ratio of 100:50:10:1", () => {
      const ratio = {
        enterprise:
          DEFAULT_WEIGHTS[TenantTier.ENTERPRISE] /
          DEFAULT_WEIGHTS[TenantTier.FREE],
        premium:
          DEFAULT_WEIGHTS[TenantTier.PREMIUM] /
          DEFAULT_WEIGHTS[TenantTier.FREE],
        standard:
          DEFAULT_WEIGHTS[TenantTier.STANDARD] /
          DEFAULT_WEIGHTS[TenantTier.FREE],
      };

      expect(ratio.enterprise).toBe(100);
      expect(ratio.premium).toBe(50);
      expect(ratio.standard).toBe(10);
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters in tenant ID", () => {
      const tenant = registry.registerTenant({
        id: "tenant-with-dash_and.dot",
        name: "Special Tenant",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      expect(registry.getTenant("tenant-with-dash_and.dot")).toBeDefined();
    });

    it("should handle very long tenant names", () => {
      const longName = "A".repeat(1000);
      const tenant = registry.registerTenant({
        id: "tenant-1",
        name: longName,
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      expect(tenant.name).toBe(longName);
    });

    it("should handle zero weight tenant", () => {
      registry.registerTenant({
        id: "tenant-zero",
        name: "Zero Weight",
        tier: TenantTier.STANDARD,
        weight: 0,
      });

      expect(registry.getTenantWeight("tenant-zero")).toBe(0);
    });

    it("should handle negative weight through update", () => {
      registry.registerTenant({
        id: "tenant-1",
        name: "Test",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      // The registry allows negative weights (could be used for penalized tenants)
      registry.updateTenantWeight("tenant-1", -5);

      expect(registry.getTenantWeight("tenant-1")).toBe(-5);
    });

    it("should handle empty tenant ID", () => {
      const tenant = registry.registerTenant({
        id: "",
        name: "Empty ID",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      expect(registry.getTenant("")).toBeDefined();
    });

    it("should handle metadata with complex objects", () => {
      const complexMetadata = {
        tags: ["tag1", "tag2"],
        config: { setting1: true, setting2: false },
        nested: { deep: { value: 42 } },
      };

      const tenant = registry.registerTenant({
        id: "tenant-complex",
        name: "Complex Metadata",
        tier: TenantTier.ENTERPRISE,
        weight: 100,
        metadata: complexMetadata,
      });

      expect(tenant.metadata).toEqual(complexMetadata);
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle typical multi-tenant workflow", () => {
      // Initialize with defaults
      registry.initializeDefaultTenants();

      // Add custom tenant
      registry.registerTenant({
        id: "custom-corp",
        name: "Custom Corp",
        tier: TenantTier.ENTERPRISE,
        weight: 150,
      });

      // Update tier for standard tenant
      registry.updateTenantTier("tenant-standard", TenantTier.PREMIUM);

      // Adjust weight for specific tenant
      registry.updateTenantWeight("custom-corp", 200);

      // Verify state
      expect(registry.getTenantCount()).toBe(5);
      expect(registry.getTenant("custom-corp")?.weight).toBe(200);
      expect(registry.getTenant("tenant-standard")?.tier).toBe(
        TenantTier.PREMIUM,
      );
    });

    it("should handle tenant lifecycle", () => {
      // Create tenant
      registry.registerTenant({
        id: "temp-tenant",
        name: "Temporary",
        tier: TenantTier.STANDARD,
        weight: 10,
      });

      expect(registry.hasTenant("temp-tenant")).toBe(true);

      // Upgrade tier
      registry.updateTenantTier("temp-tenant", TenantTier.PREMIUM);
      expect(registry.getTenant("temp-tenant")?.tier).toBe(TenantTier.PREMIUM);

      // Custom weight
      registry.updateTenantWeight("temp-tenant", 75);
      expect(registry.getTenantWeight("temp-tenant")).toBe(75);

      // Remove
      registry.removeTenant("temp-tenant");
      expect(registry.hasTenant("temp-tenant")).toBe(false);
    });

    it("should handle concurrent access simulation", () => {
      // Simulate multiple "operations"
      for (let i = 0; i < 100; i++) {
        registry.registerTenant({
          id: `tenant-${i}`,
          name: `Tenant ${i}`,
          tier: TenantTier.STANDARD,
          weight: 10,
        });
      }

      expect(registry.getTenantCount()).toBe(100);

      // Update half of them
      for (let i = 0; i < 50; i++) {
        registry.updateTenantTier(`tenant-${i}`, TenantTier.PREMIUM);
      }

      // Verify updates
      for (let i = 0; i < 50; i++) {
        expect(registry.getTenant(`tenant-${i}`)?.tier).toBe(
          TenantTier.PREMIUM,
        );
      }

      // Remove some
      for (let i = 0; i < 25; i++) {
        registry.removeTenant(`tenant-${i}`);
      }

      expect(registry.getTenantCount()).toBe(75);
    });
  });
});
