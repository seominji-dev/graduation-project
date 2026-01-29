/**
 * Virtual Time Tracker
 *
 * Manages virtual time calculation for WFQ scheduling.
 * Virtual time is used to achieve fair bandwidth allocation among tenants.
 *
 * SPEC-SCHED-004: Virtual time for GPS (Generalized Processor Sharing) approximation
 *
 * WFQ Virtual Time Formula:
 * V(t) = V(t_prev) + (service_time / sum_of_active_weights)
 *
 * Virtual Finish Time (F_i):
 * F_i = max(V(t), P_i) + (packet_size / weight_i)
 * Where P_i is the virtual start time of the packet
 */

/**
 * Virtual time state
 */
export interface VirtualTimeState {
  currentTime: number; // Current virtual time
  lastUpdateTime: number; // Real timestamp of last update
  activeWeightSum: number; // Sum of weights of active tenants
}

/**
 * Virtual finish time for a request
 */
export interface VirtualFinishTime {
  requestId: string;
  tenantId: string;
  virtualStartTime: number; // P_i
  virtualFinishTime: number; // F_i
  estimatedServiceTime: number; // Expected processing time
  weight: number; // Tenant weight
}

/**
 * Virtual Time Tracker
 *
 * Tracks virtual time for WFQ scheduling decisions.
 * Virtual time advances faster when fewer tenants are active.
 */
export class VirtualTimeTracker {
  private state: VirtualTimeState;
  private finishTimes: Map<string, VirtualFinishTime> = new Map();

  constructor() {
    this.state = {
      currentTime: 0,
      lastUpdateTime: Date.now(),
      activeWeightSum: 0,
    };
  }

  /**
   * Update virtual time based on elapsed real time and active tenants
   *
   * @param serviceTime Actual service time used (ms)
   * @param activeWeightSum Sum of weights of all active tenants during service
   */
  updateVirtualTime(serviceTime: number, activeWeightSum: number): void {
    const now = Date.now();
    const _realTimeElapsed = now - this.state.lastUpdateTime;

    // Update virtual time using GPS formula
    // V(t) = V(t_prev) + (service_time / sum_of_active_weights)
    if (activeWeightSum > 0) {
      const virtualTimeIncrement = serviceTime / activeWeightSum;
      this.state.currentTime += virtualTimeIncrement;
    }

    this.state.activeWeightSum = activeWeightSum;
    this.state.lastUpdateTime = now;
  }

  /**
   * Calculate virtual finish time for a request
   *
   * @param requestId Request ID
   * @param tenantId Tenant ID
   * @param estimatedServiceTime Expected processing time (ms)
   * @param weight Tenant weight
   * @returns Virtual finish time
   */
  calculateVirtualFinishTime(
    requestId: string,
    tenantId: string,
    estimatedServiceTime: number,
    weight: number,
  ): VirtualFinishTime {
    // Virtual start time is current virtual time
    const virtualStartTime = this.state.currentTime;

    // Calculate virtual finish time
    // F_i = max(V(t), P_i) + (service_time / weight_i)
    const virtualFinishTime =
      Math.max(this.state.currentTime, virtualStartTime) +
      estimatedServiceTime / weight;

    const finishTime: VirtualFinishTime = {
      requestId,
      tenantId,
      virtualStartTime,
      virtualFinishTime,
      estimatedServiceTime,
      weight,
    };

    this.finishTimes.set(requestId, finishTime);

    return finishTime;
  }

  /**
   * Get virtual finish time for a request
   */
  getVirtualFinishTime(requestId: string): VirtualFinishTime | undefined {
    return this.finishTimes.get(requestId);
  }

  /**
   * Remove virtual finish time (when request is completed)
   */
  removeVirtualFinishTime(requestId: string): void {
    this.finishTimes.delete(requestId);
  }

  /**
   * Get current virtual time
   */
  getCurrentVirtualTime(): number {
    return this.state.currentTime;
  }

  /**
   * Get virtual time state
   */
  getState(): VirtualTimeState {
    return { ...this.state };
  }

  /**
   * Set active weight sum (called when tenants become active/inactive)
   */
  setActiveWeightSum(weightSum: number): void {
    this.state.activeWeightSum = weightSum;
  }

  /**
   * Increment active weight sum
   */
  incrementActiveWeightSum(weight: number): void {
    this.state.activeWeightSum += weight;
  }

  /**
   * Decrement active weight sum
   */
  decrementActiveWeightSum(weight: number): void {
    this.state.activeWeightSum = Math.max(
      0,
      this.state.activeWeightSum - weight,
    );
  }

  /**
   * Reset virtual time (useful for testing or reinitialization)
   */
  reset(): void {
    this.state = {
      currentTime: 0,
      lastUpdateTime: Date.now(),
      activeWeightSum: 0,
    };
    this.finishTimes.clear();
  }

  /**
   * Compare two requests by their virtual finish times
   * Returns negative if a should be scheduled before b
   */
  compareByVirtualFinishTime(requestIdA: string, requestIdB: string): number {
    const finishTimeA = this.finishTimes.get(requestIdA);
    const finishTimeB = this.finishTimes.get(requestIdB);

    if (!finishTimeA && !finishTimeB) return 0;
    if (!finishTimeA) return 1; // b should be scheduled first
    if (!finishTimeB) return -1; // a should be scheduled first

    return finishTimeA.virtualFinishTime - finishTimeB.virtualFinishTime;
  }

  /**
   * Get sorted request IDs by virtual finish time
   */
  getSortedRequestIds(requestIds: string[]): string[] {
    return [...requestIds].sort((a, b) =>
      this.compareByVirtualFinishTime(a, b),
    );
  }

  /**
   * Get statistics about virtual finish times
   */
  getStatistics(): {
    count: number;
    minVirtualFinishTime: number;
    maxVirtualFinishTime: number;
    avgVirtualFinishTime: number;
  } {
    const finishTimes = Array.from(this.finishTimes.values());

    if (finishTimes.length === 0) {
      return {
        count: 0,
        minVirtualFinishTime: 0,
        maxVirtualFinishTime: 0,
        avgVirtualFinishTime: 0,
      };
    }

    const values = finishTimes.map((ft) => ft.virtualFinishTime);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

    return {
      count: finishTimes.length,
      minVirtualFinishTime: min,
      maxVirtualFinishTime: max,
      avgVirtualFinishTime: avg,
    };
  }
}
