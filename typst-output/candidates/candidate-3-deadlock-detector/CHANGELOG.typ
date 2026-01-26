= Changelog
<changelog>
All notable changes to this project will be documented in this file.

The format is based on
#link("https://keepachangelog.com/en/1.0.0/")[Keep a Changelog], and
this project adheres to
#link("https://semver.org/spec/v2.0.0.html")[Semantic Versioning].

== #link("https://github.com/YOUR_USERNAME/deadlock-detector/releases/tag/v1.0.0")[1.0.0] - 2025-01-24
<section>
=== Added
<added>
==== Deadlock Detection
<deadlock-detection>
- Wait-For Graph (WFG) construction and management
- DFS-based cycle detection algorithm (O(V + E) complexity)
- Multiple cycle detection support
- Real-time deadlock monitoring

==== Victim Selection Strategies
<victim-selection-strategies>
- Priority-based victim selection
- Age-based victim selection (newest agents first)
- Resource-holding-based selection (most resources first)
- Minimum dependency selection (least dependencies first)

==== Recovery Mechanisms
<recovery-mechanisms>
- Checkpoint-based state rollback
- Resource release operations
- Agent state restoration
- Recovery workflow orchestration

==== Deadlock Avoidance
<deadlock-avoidance>
- Banker's Algorithm implementation
- Safety state checking
- Resource allocation validation
- Safe sequence detection

==== REST API
<rest-api>
- Agent management endpoints
- Resource request/release endpoints
- Deadlock detection and recovery endpoints
- Checkpoint and rollback endpoints
- Wait-For Graph visualization endpoint

==== Real-time Monitoring
<real-time-monitoring>
- Socket.io-based real-time updates
- Live WFG visualization
- Deadlock alert notifications
- System health monitoring

==== Testing
<testing>
- Unit tests for cycle detection algorithms
- Victim selection strategy tests
- Banker's algorithm tests
- Integration tests for full workflow
- Performance benchmarking

==== Documentation
<documentation>
- Comprehensive README with algorithm explanations
- API documentation with examples
- OS concepts mapping (Deadlock, WFG, Banker's Algorithm)
- Implementation report

=== Changed
<changed>
- Initial project structure setup
- TypeScript strict mode configuration
- Vitest testing framework integration
- Docker Compose for infrastructure services

=== Security
<security>
- Input validation using Zod schemas
- Environment variable configuration
- MongoDB authentication
- Redis password protection

=== Performance
<performance>
- Optimized cycle detection for large graphs
- Efficient WFG storage and retrieval
- Fast rollback operations
- Minimal overhead for deadlock monitoring

== \[Unreleased\]
<unreleased>
=== Planned
<planned>
- Additional deadlock detection algorithms (Resource Allocation Graph)
- Advanced victim selection with ML-based prediction
- Distributed deadlock detection for multi-server scenarios
- Deadlock prevention with resource ordering
- Performance optimization for large-scale deployments

#line(length: 100%)
