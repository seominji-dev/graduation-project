/**
 * State Serializer
 * Handles serialization and deserialization of agent states (REQ-CHECK-001)
 */

import { v4 as uuidv4 } from 'uuid';
import { AgentState, CheckpointMetadata, CheckpointType, StateDiff } from '../domain/models.js';

export interface SerializationResult {
  success: boolean;
  data?: string;
  error?: string;
  size: number;
  warnings: string[];
}

export interface DeserializationResult {
  success: boolean;
  state?: AgentState;
  error?: string;
}

/**
 * State Serializer Class
 * Implements REQ-CHECK-001 through REQ-CHECK-009
 */
export class StateSerializer {
  private readonly MAX_SIZE_BYTES: number;
  private readonly SENSITIVE_KEYS = ['password', 'apiKey', 'secret', 'token'];

  constructor(maxSizeBytes: number = 10485760) { // 10MB default
    this.MAX_SIZE_BYTES = maxSizeBytes;
  }

  /**
   * Serialize agent state to JSON (REQ-CHECK-001)
   */
  public serialize(state: AgentState): SerializationResult {
    const warnings: string[] = [];
    const startTime = Date.now();

    try {
      // Filter sensitive information (REQ-CHECK-009)
      const sanitizedState = this.filterSensitiveData(state, warnings);

      // Convert to JSON
      const jsonString = JSON.stringify(sanitizedState, this.replacer);
      const size = Buffer.byteLength(jsonString, 'utf8');

      // Check size limit (REQ-CHECK-006)
      if (size > this.MAX_SIZE_BYTES) {
        warnings.push(
          `State size (${size} bytes) exceeds limit (${this.MAX_SIZE_BYTES} bytes)`
        );
      }

      // Add timestamp (REQ-CHECK-002) and checkpoint ID (REQ-CHECK-003)
      const result: SerializationResult = {
        success: true,
        data: jsonString,
        size,
        warnings,
      };

      return result;
    } catch (error) {
      return {
        success: false,
        size: 0,
        warnings,
        error: error instanceof Error ? error.message : 'Unknown serialization error',
      };
    }
  }

  /**
   * Deserialize JSON to agent state (REQ-CHECK-005)
   */
  public deserialize(jsonString: string): DeserializationResult {
    try {
      const state = JSON.parse(jsonString, this.reviver) as AgentState;

      // Validate required fields
      if (!state.messages || !Array.isArray(state.messages)) {
        return {
          success: false,
          error: 'Invalid state: missing or invalid messages field',
        };
      }

      // Convert date strings back to Date objects
      if (state.messages) {
        state.messages = state.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp as any),
        }));
      }

      if (state.lastActivity) {
        state.lastActivity = new Date(state.lastActivity as any);
      }

      return {
        success: true,
        state,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deserialization error',
      };
    }
  }

  /**
   * Calculate state diff for incremental checkpoints (REQ-CHECK-017, REQ-CHECK-019)
   */
  public calculateDiff(
    baseState: AgentState,
    currentState: AgentState
  ): StateDiff {
    const added: Record<string, any> = {};
    const modified: Record<string, any> = {};
    const deleted: string[] = [];

    // Compare variables
    const baseVars = baseState.variables || {};
    const currentVars = currentState.variables || {};

    for (const key of Object.keys(currentVars)) {
      if (!(key in baseVars)) {
        added[key] = currentVars[key];
      } else if (JSON.stringify(baseVars[key]) !== JSON.stringify(currentVars[key])) {
        modified[key] = currentVars[key];
      }
    }

    for (const key of Object.keys(baseVars)) {
      if (!(key in currentVars)) {
        deleted.push(`variables.${key}`);
      }
    }

    // Compare messages (simplified: just check if count changed)
    if (currentState.messages.length !== baseState.messages.length) {
      modified.messages = currentState.messages;
    }

    // Compare execution position
    if (JSON.stringify(currentState.executionPosition) !== 
        JSON.stringify(baseState.executionPosition)) {
      modified.executionPosition = currentState.executionPosition;
    }

    // Compare status
    if (currentState.status !== baseState.status) {
      modified._status = currentState.status; // Use _status to avoid confusion with variables
    }

    return { added, modified, deleted };
  }

  /**
   * Apply diff to base state (REQ-CHECK-020)
   */
  public applyDiff(baseState: AgentState, diff: StateDiff): AgentState {
    const newState: AgentState = JSON.parse(JSON.stringify(baseState));

    // Apply added fields
    Object.assign(newState.variables, diff.added);

    // Apply modified fields (excluding special keys)
    for (const key of Object.keys(diff.modified)) {
      if (key === '_status') {
        newState.status = diff.modified[key];
      } else if (key === 'messages') {
        newState.messages = diff.modified[key];
      } else if (key === 'executionPosition') {
        newState.executionPosition = diff.modified[key];
      } else {
        newState.variables[key] = diff.modified[key];
      }
    }

    // Apply deleted fields (simple path-based deletion)
    for (const path of diff.deleted) {
      if (path.startsWith('variables.')) {
        const key = path.substring('variables.'.length);
        delete newState.variables[key];
      }
    }

    return newState;
  }

  /**
   * Check if diff size justifies full checkpoint (REQ-CHECK-021)
   */
  public shouldUseFullCheckpoint(
    baseState: AgentState,
    diff: StateDiff
  ): boolean {
    const baseSize = JSON.stringify(baseState).length;
    const diffSize = JSON.stringify(diff).length;

    return diffSize >= baseSize * 0.5; // 50% threshold
  }

  /**
   * Filter sensitive data from state (REQ-CHECK-009)
   */
  private filterSensitiveData(state: AgentState, warnings: string[]): AgentState {
    const sanitized = JSON.parse(JSON.stringify(state));

    const filterRecursive = (obj: any, path: string = ''): void => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }

      for (const key of Object.keys(obj)) {
        const fullPath = path ? `${path}.${key}` : key;

        if (this.SENSITIVE_KEYS.some(sensitive => 
          key.toLowerCase().includes(sensitive.toLowerCase()))) {
          obj[key] = '[REDACTED]';
          warnings.push(`Filtered sensitive field: ${fullPath}`);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          filterRecursive(obj[key], fullPath);
        }
      }
    };

    filterRecursive(sanitized);
    return sanitized;
  }

  /**
   * JSON replacer function for handling special types
   */
  private replacer(key: string, value: any): any {
    // Handle Date objects
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }

    // Handle undefined
    if (value === undefined) {
      return null;
    }

    // Handle non-serializable objects (REQ-CHECK-007)
    if (typeof value === 'function') {
      return null;
    }

    return value;
  }

  /**
   * JSON reviver function for restoring special types
   */
  private reviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  }

  /**
   * Calculate state size in bytes (REQ-CHECK-006)
   */
  public calculateStateSize(state: AgentState): number {
    return Buffer.byteLength(JSON.stringify(state), 'utf8');
  }

  /**
   * Clone state (non-blocking, REQ-CHECK-008)
   */
  public cloneState(state: AgentState): AgentState {
    return JSON.parse(JSON.stringify(state));
  }
}
