#!/usr/bin/env node

/**
 * K6 Benchmark Results Analyzer
 * Processes k6 JSON output and generates comparison reports
 */

const fs = require('fs');
const path = require('path');

const RESULTS_DIR = process.env.RESULTS_DIR || './benchmark-results';
const OUTPUT_DIR = process.env.OUTPUT_DIR || './analysis';

// Metrics to extract from k6 results
const METRICS = [
  'http_reqs',           // Total requests
  'http_req_duration',   // Response time
  'http_req_failed',     // Failed requests
  'http_reqs',           // Request count
];

/**
 * Parse k6 JSON output file
 */
function parseK6Results(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');

    const results = [];
    for (const line of lines) {
      if (line.trim()) {
        try {
          results.push(JSON.parse(line));
        } catch (e) {
          // Skip non-JSON lines (stdout output)
        }
      }
    }

    return results;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Extract key metrics from k6 data
 */
function extractMetrics(k6Data, schedulerName) {
  const metrics = k6Data.metrics || {};

  return {
    scheduler: schedulerName,
    totalRequests: metrics.http_reqs?.values?.count || 0,
    successRate: metrics.http_req_failed
      ? ((1 - metrics.http_req_failed.values.rate) * 100).toFixed(2)
      : 'N/A',
    avgResponseTime: metrics.http_req_duration?.values?.avg?.toFixed(2) || 'N/A',
    minResponseTime: metrics.http_req_duration?.values?.min?.toFixed(2) || 'N/A',
    maxResponseTime: metrics.http_req_duration?.values?.max?.toFixed(2) || 'N/A',
    p50ResponseTime: metrics.http_req_duration?.values?.['p(50)']?.toFixed(2) || 'N/A',
    p95ResponseTime: metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) || 'N/A',
    p99ResponseTime: metrics.http_req_duration?.values?.['p(99)']?.toFixed(2) || 'N/A',
    throughput: metrics.http_reqs?.values?.rate?.toFixed(2) || 'N/A',
  };
}

/**
 * Generate Markdown comparison table
 */
function generateComparisonTable(allMetrics) {
  let table = '\n## Performance Comparison Results\n\n';
  table += '| Algorithm | Requests | Success Rate | Avg Time (ms) | P95 (ms) | P99 (ms) | Throughput (req/s) |\n';
  table += '|-----------|----------|--------------|---------------|----------|----------|-------------------|\n';

  for (const metrics of allMetrics) {
    table += `| ${metrics.scheduler.padEnd(9)} | `;
    table += `${metrics.totalRequests.toString().padStart(8)} | `;
    table += `${metrics.successRate.padStart(12)} | `;
    table += `${metrics.avgResponseTime.padStart(13)} | `;
    table += `${metrics.p95ResponseTime.padStart(8)} | `;
    table += `${metrics.p99ResponseTime.padStart(8)} | `;
    table += `${metrics.throughput.padStart(17)} |\n`;
  }

  return table;
}

/**
 * Generate detailed analysis for each scheduler
 */
function generateDetailedAnalysis(allMetrics) {
  let analysis = '\n## Detailed Analysis\n\n';

  // Find best performers
  const bestResponseTime = allMetrics.reduce((best, m) =>
    !best || parseFloat(m.avgResponseTime) < parseFloat(best.avgResponseTime) ? m : best
  );

  const bestThroughput = allMetrics.reduce((best, m) =>
    !best || parseFloat(m.throughput) > parseFloat(best.throughput) ? m : best
  );

  const bestP95 = allMetrics.reduce((best, m) =>
    !best || parseFloat(m.p95ResponseTime) < parseFloat(best.p95ResponseTime) ? m : best
  );

  analysis += `### Best Performers\n\n`;
  analysis += `- **Fastest Response Time**: ${bestResponseTime.scheduler} (${bestResponseTime.avgResponseTime}ms)\n`;
  analysis += `- **Highest Throughput**: ${bestThroughput.scheduler} (${bestThroughput.throughput} req/s)\n`;
  analysis += `- **Best P95 Latency**: ${bestP95.scheduler} (${bestP95.p95ResponseTime}ms)\n\n`;

  return analysis;
}

/**
 * Generate algorithm selection guide
 */
function generateSelectionGuide(allMetrics) {
  let guide = '\n## Algorithm Selection Guide\n\n';

  guide += '### Use FCFS When:\n';
  guide += '- Simple implementation is preferred\n';
  guide += '- All requests have equal importance\n';
  guide += '- Predictable FIFO ordering is required\n\n';

  guide += '### Use Priority When:\n';
  guide += '- Request importance varies significantly\n';
  guide += '- High-priority requests need preferential treatment\n';
  guide += '- SLAs require priority-based service\n\n';

  guide += '### Use MLFQ When:\n';
  guide += '- Workload characteristics are unknown\n';
  guide += '- Short requests should be optimized\n';
  guide += '- Adaptive scheduling is beneficial\n\n';

  guide += '### Use WFQ When:\n';
  guide += '- Multi-tenant environment exists\n';
  guide += '- Fair resource allocation across tenants is required\n';
  guide += '- Different service tiers need guaranteed bandwidth\n\n';

  return guide;
}

/**
 * Main execution
 */
function main() {
  console.log('K6 Benchmark Results Analyzer');
  console.log('=============================\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Find all result files
  const schedulers = ['fcfs', 'priority', 'mlfq', 'wfq'];
  const allMetrics = [];

  for (const scheduler of schedulers) {
    const resultFile = path.join(RESULTS_DIR, `${scheduler}-results.json`);

    if (fs.existsSync(resultFile)) {
      console.log(`Processing ${scheduler} results...`);
      const k6Data = parseK6Results(resultFile);

      if (k6Data && k6Data.length > 0) {
        const metrics = extractMetrics(k6Data[0], scheduler.toUpperCase());
        allMetrics.push(metrics);
        console.log(`  ✓ ${scheduler}: ${metrics.totalRequests} requests, ${metrics.avgResponseTime}ms avg`);
      }
    } else {
      console.log(`  ⚠ ${scheduler} results not found: ${resultFile}`);
    }
  }

  if (allMetrics.length === 0) {
    console.error('\nNo valid results found. Please run benchmarks first.');
    process.exit(1);
  }

  // Generate comparison report
  let report = '# LLM Scheduler Performance Comparison Report\n\n';
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += '---\n';

  report += generateComparisonTable(allMetrics);
  report += generateDetailedAnalysis(allMetrics);
  report += generateSelectionGuide(allMetrics);

  // Write report
  const reportPath = path.join(OUTPUT_DIR, 'Performance_Comparison_Report.md');
  fs.writeFileSync(reportPath, report);

  console.log(`\n✓ Report generated: ${reportPath}`);
  console.log(`\nSummary:`);
  console.log(`  Processed ${allMetrics.length} scheduler(s)`);
  console.log(`  Total requests: ${allMetrics.reduce((sum, m) => sum + parseInt(m.totalRequests), 0)}`);
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { parseK6Results, extractMetrics, generateComparisonTable };
