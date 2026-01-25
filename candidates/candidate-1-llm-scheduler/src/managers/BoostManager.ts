/**
 * Boost Manager for MLFQ Scheduler
 * 
 * Implements periodic boosting (Rule 5) to prevent starvation in MLFQ.
 * All jobs are moved to the highest priority queue (Q0) at regular intervals.
 * 
 * SPEC-SCHED-003: MLFQ Rule 5 - Periodic boosting
 */

/**
 * Boost configuration
 */
const BOOST_INTERVAL_MS = 5000; // 5 seconds - boost all jobs to Q0

/**
 * Interface for MLFQScheduler to allow BoostManager to reset queue levels
 */
export interface IMLFQScheduler {
  boostAllJobs(): Promise<number>; // Returns number of jobs boosted
  getJobCount(): Promise<number>; // Get total number of jobs in all queues
}

export class BoostManager {
  private scheduler: IMLFQScheduler | null;
  private intervalId: NodeJS.Timeout | null = null;
  private boostCount: number = 0;
  private isStopped: boolean = false;

  constructor(scheduler: IMLFQScheduler) {
    this.scheduler = scheduler;
    this.isStopped = false;
  }

  /**
   * Start the periodic boosting process
   */
  start(): void {
    if (this.intervalId) {
      console.warn('BoostManager already started');
      return;
    }

    console.log('Starting BoostManager (interval: ' + BOOST_INTERVAL_MS + 'ms)');

    // Schedule periodic boosting
    this.intervalId = setInterval(() => {
      void this.runBoost();
    }, BOOST_INTERVAL_MS);

    // Prevent interval from keeping Node.js alive during tests
    if (this.intervalId.unref) {
      this.intervalId.unref();
    }
  }

  /**
   * Stop the boosting process
   */
  stop(): void {
    this.isStopped = true;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.scheduler = null;
    console.log('BoostManager stopped (total boosts: ' + this.boostCount + ')');
  }

  /**
   * Run boost process - move all jobs to Q0
   */
  private async runBoost(): Promise<void> {
    // Guard: Check if stopped or scheduler is invalid
    if (this.isStopped || !this.scheduler) {
      return;
    }

    try {
      const boostedCount = await this.scheduler.boostAllJobs();
      this.boostCount++;
      
      console.log('Boost #' + this.boostCount + ': Moved ' + boostedCount + ' jobs to Q0');
    } catch (error) {
      console.error('Boost cycle failed:', error);
    }
  }

  /**
   * Get boost statistics
   */
  getStats(): { interval: number; totalBoosts: number } {
    return {
      interval: BOOST_INTERVAL_MS,
      totalBoosts: this.boostCount,
    };
  }
}
