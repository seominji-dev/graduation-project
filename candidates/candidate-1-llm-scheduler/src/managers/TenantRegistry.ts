/**
 * Tenant Registry
 *
 * Manages tenant registration and weight assignment for WFQ scheduling.
 * Each tenant has a weight that determines their share of bandwidth.
 *
 * SPEC-SCHED-004: Weight-based fair queuing for multi-tenant LLM requests
 */

/**
 * Default tenant weights based on service tier
 * Higher weight = larger share of processing capacity
 */
export enum TenantTier {
  ENTERPRISE = 'enterprise',
  PREMIUM = 'premium',
  STANDARD = 'standard',
  FREE = 'free',
}

// Default weights for each tier
export const DEFAULT_WEIGHTS: Record<TenantTier, number> = {
  [TenantTier.ENTERPRISE]: 100,
  [TenantTier.PREMIUM]: 50,
  [TenantTier.STANDARD]: 10,
  [TenantTier.FREE]: 1,
};

/**
 * Tenant information
 */
export interface Tenant {
  id: string;
  name: string;
  tier: TenantTier;
  weight: number;
  createdAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Tenant Registry
 *
 * Manages tenant registration and weight assignment.
 * Provides weight lookup for WFQ scheduling decisions.
 */
export class TenantRegistry {
  private tenants: Map<string, Tenant> = new Map();
  private defaultTenantId: string = 'default';

  /**
   * Register a new tenant
   */
  registerTenant(tenant: Omit<Tenant, 'createdAt'>): Tenant {
    const fullTenant: Tenant = {
      ...tenant,
      createdAt: new Date(),
    };

    this.tenants.set(tenant.id, fullTenant);
    console.log('Tenant registered: ' + tenant.id + ' (tier: ' + tenant.tier + ', weight: ' + tenant.weight + ')');

    return fullTenant;
  }

  /**
   * Get tenant by ID
   */
  getTenant(tenantId: string): Tenant | undefined {
    return this.tenants.get(tenantId);
  }

  /**
   * Get tenant weight
   */
  getTenantWeight(tenantId: string): number {
    const tenant = this.tenants.get(tenantId);
    if (tenant) {
      return tenant.weight;
    }

    // Return default weight for unknown tenants
    return DEFAULT_WEIGHTS[TenantTier.FREE];
  }

  /**
   * Check if tenant exists
   */
  hasTenant(tenantId: string): boolean {
    return this.tenants.has(tenantId);
  }

  /**
   * Update tenant weight
   */
  updateTenantWeight(tenantId: string, newWeight: number): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    tenant.weight = newWeight;
    this.tenants.set(tenantId, tenant);
    console.log('Tenant weight updated: ' + tenantId + ' -> ' + newWeight);

    return true;
  }

  /**
   * Update tenant tier
   */
  updateTenantTier(tenantId: string, newTier: TenantTier): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    const oldTier = tenant.tier;
    tenant.tier = newTier;
    tenant.weight = DEFAULT_WEIGHTS[newTier];
    this.tenants.set(tenantId, tenant);

    console.log('Tenant tier updated: ' + tenantId + ' (' + oldTier + ' -> ' + newTier + ')');

    return true;
  }

  /**
   * Get all tenants
   */
  getAllTenants(): Tenant[] {
    return Array.from(this.tenants.values());
  }

  /**
   * Get total weight (sum of all tenant weights)
   */
  getTotalWeight(): number {
    let total = 0;
    for (const tenant of this.tenants.values()) {
      total += tenant.weight;
    }
    return total;
  }

  /**
   * Remove tenant
   */
  removeTenant(tenantId: string): boolean {
    return this.tenants.delete(tenantId);
  }

  /**
   * Get or create default tenant
   */
  getOrCreateDefaultTenant(): Tenant {
    if (!this.hasTenant(this.defaultTenantId)) {
      this.registerTenant({
        id: this.defaultTenantId,
        name: 'Default Tenant',
        tier: TenantTier.STANDARD,
        weight: DEFAULT_WEIGHTS[TenantTier.STANDARD],
      });
    }

    return this.tenants.get(this.defaultTenantId)!;
  }

  /**
   * Set default tenant ID
   */
  setDefaultTenantId(tenantId: string): void {
    this.defaultTenantId = tenantId;
  }

  /**
   * Get tenant count
   */
  getTenantCount(): number {
    return this.tenants.size;
  }

  /**
   * Clear all tenants (useful for testing)
   */
  clear(): void {
    this.tenants.clear();
  }

  /**
   * Initialize with default tenants
   */
  initializeDefaultTenants(): void {
    // Create sample tenants for each tier
    this.registerTenant({
      id: 'tenant-enterprise',
      name: 'Enterprise Client',
      tier: TenantTier.ENTERPRISE,
      weight: DEFAULT_WEIGHTS[TenantTier.ENTERPRISE],
    });

    this.registerTenant({
      id: 'tenant-premium',
      name: 'Premium Client',
      tier: TenantTier.PREMIUM,
      weight: DEFAULT_WEIGHTS[TenantTier.PREMIUM],
    });

    this.registerTenant({
      id: 'tenant-standard',
      name: 'Standard Client',
      tier: TenantTier.STANDARD,
      weight: DEFAULT_WEIGHTS[TenantTier.STANDARD],
    });

    this.registerTenant({
      id: 'tenant-free',
      name: 'Free Tier Client',
      tier: TenantTier.FREE,
      weight: DEFAULT_WEIGHTS[TenantTier.FREE],
    });
  }
}
