/**
 * Scheduler Factory
 * Creates scheduler instances based on configuration
 */

import { FCFSScheduler } from "../schedulers/FCFSScheduler";
import { PriorityScheduler } from "../schedulers/PriorityScheduler";
import { MLFQScheduler } from "../schedulers/MLFQScheduler";
import { WFQScheduler } from "../schedulers/WFQScheduler";
import { IScheduler, SchedulerConfig } from "../schedulers/types";
import { LLMService } from "./llmService";

export enum SchedulerType {
  FCFS = "fcfs",
  PRIORITY = "priority",
  MLFQ = "mlfq",
  WFQ = "wfq",
}

export class SchedulerFactory {
  private llmService: LLMService;

  constructor(llmService: LLMService) {
    this.llmService = llmService;
  }

  /**
   * Create a scheduler instance based on type
   */
  createScheduler(type: SchedulerType, config: SchedulerConfig): IScheduler {
    switch (type) {
      case SchedulerType.FCFS:
        return new FCFSScheduler(config, this.llmService);

      case SchedulerType.PRIORITY:
        return new PriorityScheduler(config, this.llmService);

      case SchedulerType.MLFQ:
        return new MLFQScheduler(config, this.llmService);

      case SchedulerType.WFQ:
        return new WFQScheduler(config, this.llmService);

      default: {
        const _exhaustiveCheck: never = type;
        throw new Error("Unknown scheduler type: " + String(_exhaustiveCheck));
      }
    }
  }
}
