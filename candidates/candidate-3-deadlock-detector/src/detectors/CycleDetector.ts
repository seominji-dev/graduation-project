/**
 * Cycle Detector for Deadlock Detection
 * 
 * Uses Depth-First Search (DFS) to detect cycles in the Wait-For Graph.
 * A cycle in the WFG indicates a deadlock condition.
 * 
 * Algorithm: Tarjan's strongly connected components detection
 * Time Complexity: O(V + E) where V = agents, E = edges
 */

import {
  WaitForGraph,
  WaitForEdge,
  DeadlockCycle,
  
  createDeadlockCycle,
} from '../domain/models.js';

/**
 * DFS node state for cycle detection
 */
enum NodeState {
  /** Node has not been visited */
  UNVISITED = 'unvisited',
  /** Node is currently being visited (in recursion stack) */
  VISITING = 'visiting',
  /** Node has been completely visited */
  VISITED = 'visited',
}

/**
 * DFS Node for tracking visitation state
 */
interface DFSNode {
  agentId: string;
  state: NodeState;
  discoveryTime: number;
  lowLink: number;
  parent: string | null;
}

/**
 * CycleDetector performs deadlock detection using DFS
 */
export class CycleDetector {
  private graph: WaitForGraph;
  private dfsNodes: Map<string, DFSNode>;
  private discoveryTime: number;
  private cycles: DeadlockCycle[];
  private currentPath: string[];

  constructor(graph: WaitForGraph) {
    this.graph = graph;
    this.dfsNodes = new Map();
    this.discoveryTime = 0;
    this.cycles = [];
    this.currentPath = [];
  }

  /**
   * Detect all deadlock cycles in the Wait-For Graph
   * 
   * @returns Detection result with all found cycles
   */
  public detect(): DeadlockCycle[] {
    // Reset detection state
    this.dfsNodes.clear();
    this.discoveryTime = 0;
    this.cycles = [];
    this.currentPath = [];

    // Initialize DFS nodes for all agents
    for (const agentId of this.graph.agents.keys()) {
      this.dfsNodes.set(agentId, {
        agentId,
        state: NodeState.UNVISITED,
        discoveryTime: -1,
        lowLink: -1,
        parent: null,
      });
    }

    // Run DFS from each unvisited node
    for (const agentId of this.graph.agents.keys()) {
      const node = this.dfsNodes.get(agentId)!;
      if (node.state === NodeState.UNVISITED) {
        this.dfsVisit(agentId);
      }
    }

    return this.cycles;
  }

  /**
   * DFS visit with cycle detection using back-edge detection
   * 
   * @param agentId Current agent being visited
   */
  private dfsVisit(agentId: string): void {
    const node = this.dfsNodes.get(agentId)!;
    
    node.state = NodeState.VISITING;
    node.discoveryTime = this.discoveryTime++;
    node.lowLink = node.discoveryTime;
    this.currentPath.push(agentId);

    // Get all outgoing edges from this agent
    const outgoingEdges = this.getOutgoingEdges(agentId);

    for (const edge of outgoingEdges) {
      const neighborId = edge.toAgentId;
      const neighbor = this.dfsNodes.get(neighborId);

      if (!neighbor) {
        // Neighbor doesn't exist in graph
        continue;
      }

      if (neighbor.state === NodeState.VISITING) {
        // Back edge found - cycle detected!
        neighbor.lowLink = Math.min(
          neighbor.lowLink,
          node.discoveryTime,
        );
        this.extractCycle(agentId, neighborId);
      } else if (neighbor.state === NodeState.UNVISITED) {
        // Tree edge - continue DFS
        neighbor.parent = agentId;
        this.dfsVisit(neighborId);
        node.lowLink = Math.min(node.lowLink, neighbor.lowLink);
      }
    }

    node.state = NodeState.VISITED;
    this.currentPath.pop();
  }

  /**
   * Extract cycle when back edge is found
   * 
   * @param fromId Start of back edge
   * @param toId End of back edge (ancestor in DFS tree)
   */
  private extractCycle(fromId: string, toId: string): void {
    // Find the path from toId to fromId in current path
    const toIndex = this.currentPath.indexOf(toId);
    const fromIndex = this.currentPath.indexOf(fromId);

    if (toIndex === -1 || fromIndex === -1) {
      return;
    }

    // Extract cycle from current path
    const cycleAgentIds = this.currentPath.slice(toIndex, fromIndex + 1);
    
    // Get edges that form the cycle
    const cycleEdges: WaitForEdge[] = [];
    for (let i = 0; i < cycleAgentIds.length; i++) {
      const current = cycleAgentIds[i];
      const next = cycleAgentIds[(i + 1) % cycleAgentIds.length];
      
      const edge = this.findEdge(current, next);
      if (edge) {
        cycleEdges.push(edge);
      }
    }

    // Create and store the cycle
    const cycle = createDeadlockCycle(cycleAgentIds, cycleEdges);
    this.cycles.push(cycle);
  }

  /**
   * Get all outgoing edges from an agent
   * 
   * @param agentId Source agent ID
   * @returns Array of outgoing edges
   */
  private getOutgoingEdges(agentId: string): WaitForEdge[] {
    return this.graph.edges.filter(edge => edge.fromAgentId === agentId);
  }

  /**
   * Find an edge between two agents
   * 
   * @param fromId Source agent ID
   * @param toId Target agent ID
   * @returns Edge if found, undefined otherwise
   */
  private findEdge(fromId: string, toId: string): WaitForEdge | undefined {
    return this.graph.edges.find(
      edge => edge.fromAgentId === fromId && edge.toAgentId === toId,
    );
  }

  /**
   * Static method to detect cycles in a graph
   * Convenience method for one-shot detection
   * 
   * @param graph Wait-For Graph to analyze
   * @returns Array of detected cycles
   */
  public static detectCycles(graph: WaitForGraph): DeadlockCycle[] {
    const detector = new CycleDetector(graph);
    return detector.detect();
  }

  /**
   * Check if a specific agent is part of a deadlock
   * 
   * @param agentId Agent ID to check
   * @returns True if agent is in any deadlock cycle
   */
  public isAgentInDeadlock(agentId: string): boolean {
    return this.cycles.some(cycle => 
      cycle.agentIds.includes(agentId),
    );
  }

  /**
   * Get all agents involved in deadlocks
   * 
   * @returns Set of agent IDs in deadlock cycles
   */
  public getDeadlockedAgents(): Set<string> {
    const deadlockedAgents = new Set<string>();
    
    for (const cycle of this.cycles) {
      for (const agentId of cycle.agentIds) {
        deadlockedAgents.add(agentId);
      }
    }
    
    return deadlockedAgents;
  }

  /**
   * Get the most recent detection results
   * 
   * @returns Array of detected cycles
   */
  public getLastDetectedCycles(): DeadlockCycle[] {
    return this.cycles;
  }

  /**
   * Get the number of detected cycles
   * 
   * @returns Number of unique deadlock cycles
   */
  public getCycleCount(): number {
    return this.cycles.length;
  }
}

/**
 * Alternative detection using adjacency list representation
 * More efficient for dense graphs
 */
export class GraphBasedCycleDetector {
  private graph: WaitForGraph;
  private adjacencyList: Map<string, string[]>;

  constructor(graph: WaitForGraph) {
    this.graph = graph;
    this.adjacencyList = this.buildAdjacencyList();
  }

  /**
   * Build adjacency list from Wait-For Graph edges
   */
  private buildAdjacencyList(): Map<string, string[]> {
    const adjList = new Map<string, string[]>();

    // Initialize with all agents
    for (const agentId of this.graph.agents.keys()) {
      adjList.set(agentId, []);
    }

    // Add edges
    for (const edge of this.graph.edges) {
      const neighbors = adjList.get(edge.fromAgentId) || [];
      neighbors.push(edge.toAgentId);
      adjList.set(edge.fromAgentId, neighbors);
    }

    return adjList;
  }

  /**
   * Detect cycles using three-color marking algorithm
   * 
   * @returns Array of detected cycles
   */
  public detect(): DeadlockCycle[] {
    const color = new Map<string, NodeState>();
    const parent = new Map<string, string | null>();
    const cycles: DeadlockCycle[] = [];
    const path: string[] = [];

    // Initialize colors
    for (const agentId of this.graph.agents.keys()) {
      color.set(agentId, NodeState.UNVISITED);
      parent.set(agentId, null);
    }

    // DFS from each unvisited node
    for (const agentId of this.graph.agents.keys()) {
      if (color.get(agentId) === NodeState.UNVISITED) {
        this.dfsDetect(agentId, color, parent, path, cycles);
      }
    }

    return cycles;
  }

  private dfsDetect(
    agentId: string,
    color: Map<string, NodeState>,
    parent: Map<string, string | null>,
    path: string[],
    cycles: DeadlockCycle[],
  ): void {
    color.set(agentId, NodeState.VISITING);
    path.push(agentId);

    const neighbors = this.adjacencyList.get(agentId) || [];

    for (const neighborId of neighbors) {
      if (color.get(neighborId) === NodeState.VISITING) {
        // Back edge - cycle found
        const cyclePath = this.extractPath(path, neighborId);
        const cycleEdges = this.getPathEdges(cyclePath);
        cycles.push(createDeadlockCycle(cyclePath, cycleEdges));
      } else if (color.get(neighborId) === NodeState.UNVISITED) {
        parent.set(neighborId, agentId);
        this.dfsDetect(neighborId, color, parent, path, cycles);
      }
    }

    color.set(agentId, NodeState.VISITED);
    path.pop();
  }

  private extractPath(path: string[], startNodeId: string): string[] {
    const startIndex = path.indexOf(startNodeId);
    return path.slice(startIndex);
  }

  private getPathEdges(agentIds: string[]): WaitForEdge[] {
    const edges: WaitForEdge[] = [];
    
    for (let i = 0; i < agentIds.length; i++) {
      const from = agentIds[i];
      const to = agentIds[(i + 1) % agentIds.length];
      
      const edge = this.graph.edges.find(
        e => e.fromAgentId === from && e.toAgentId === to,
      );
      
      if (edge) {
        edges.push(edge);
      }
    }
    
    return edges;
  }
}
