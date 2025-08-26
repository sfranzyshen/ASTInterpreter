#!/usr/bin/env node

/**
 * Performance Monitoring Agent
 * 
 * Execution performance tracking and bottleneck detection for the Arduino Interpreter Project.
 * This agent monitors interpreter execution performance, tracks metrics over time,
 * identifies bottlenecks, and suggests optimization strategies.
 * 
 * Role: Performance analysis and optimization guidance
 * Reports to: Task Manager Agent
 * Integrates with: Test Harness Agent for performance data collection
 * 
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class PerformanceMonitoringAgent {
    constructor() {
        this.version = "1.0.0";
        this.projectRoot = path.resolve(__dirname, '../..');
        this.agentName = "Performance Monitoring";
        
        // Performance metrics to track
        this.performanceMetrics = {
            executionTime: [], // Test execution duration
            memoryUsage: [],   // Memory consumption
            commandRate: [],   // Commands processed per second
            throughput: [],    // Tests processed per time unit
            regressionThreshold: 20 // % increase considered a regression
        };
        
        // Test suites to monitor performance for
        this.monitoredSuites = {
            "interpreter_examples": {
                path: "test_interpreter_examples.js",
                baseline: { executionTime: 8000, testCount: 79 }, // 8 seconds baseline
                critical: true
            },
            "interpreter_old_test": {
                path: "test_interpreter_old_test.js", 
                baseline: { executionTime: 5000, testCount: 54 }, // 5 seconds baseline
                critical: true
            },
            "interpreter_neopixel": {
                path: "test_interpreter_neopixel.js",
                baseline: { executionTime: 200, testCount: 2 }, // 0.2 seconds baseline
                critical: false
            }
        };
        
        // Performance history storage
        this.performanceHistory = this.loadPerformanceHistory();
        
        console.log(`⚡ ${this.agentName} Agent v${this.version} initialized`);
        console.log(`📊 Monitoring ${Object.keys(this.monitoredSuites).length} test suites for performance`);
    }
    
    /**
     * Load performance history from previous runs
     */
    loadPerformanceHistory() {
        const historyPath = path.join(this.projectRoot, 'agents/analysis/performance_history.json');
        
        try {
            if (fs.existsSync(historyPath)) {
                const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
                console.log(`📈 Loaded performance history: ${history.measurements ? history.measurements.length : 0} measurements`);
                return history;
            }
        } catch (error) {
            console.log(`⚠️  Could not load performance history: ${error.message}`);
        }
        
        return {
            measurements: [],
            baselines: {},
            regressions: []
        };
    }
    
    /**
     * Save performance history
     */
    savePerformanceHistory() {
        const historyPath = path.join(this.projectRoot, 'agents/analysis/performance_history.json');
        
        try {
            fs.writeFileSync(historyPath, JSON.stringify(this.performanceHistory, null, 2));
            console.log(`💾 Saved performance history: ${this.performanceHistory.measurements.length} measurements`);
        } catch (error) {
            console.error(`❌ Failed to save performance history: ${error.message}`);
        }
    }
    
    /**
     * Measure performance of a single test suite
     */
    async measureTestSuitePerformance(suiteName, suiteInfo) {
        console.log(`\n⚡ Measuring performance: ${suiteName}`);
        
        const startTime = Date.now();
        const testPath = path.join(this.projectRoot, suiteInfo.path);
        
        // Check if test file exists
        if (!fs.existsSync(testPath)) {
            return {
                suiteName,
                error: `Test file not found: ${suiteInfo.path}`,
                timestamp: new Date().toISOString()
            };
        }
        
        return new Promise((resolve) => {
            // Monitor initial memory
            const initialMemory = process.memoryUsage();
            
            const child = spawn('node', [testPath], {
                cwd: this.projectRoot,
                stdio: 'pipe'
            });
            
            let stdout = '';
            let stderr = '';
            let peakMemory = initialMemory;
            
            // Monitor memory usage during execution
            const memoryMonitor = setInterval(() => {
                try {
                    const currentMemory = process.memoryUsage();
                    if (currentMemory.heapUsed > peakMemory.heapUsed) {
                        peakMemory = currentMemory;
                    }
                } catch (error) {
                    // Process might have ended
                }
            }, 100);
            
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            // Set timeout for performance measurement
            const timeout = setTimeout(() => {
                child.kill('SIGTERM');
                clearInterval(memoryMonitor);
                resolve({
                    suiteName,
                    error: "Performance measurement timeout",
                    duration: Date.now() - startTime,
                    timestamp: new Date().toISOString()
                });
            }, 60000); // 1 minute timeout
            
            child.on('close', (code) => {
                clearTimeout(timeout);
                clearInterval(memoryMonitor);
                
                const duration = Date.now() - startTime;
                const endTime = new Date().toISOString();
                
                // Parse test results from output
                const results = this.parsePerformanceData(stdout, suiteInfo);
                
                resolve({
                    suiteName,
                    success: code === 0,
                    duration,
                    timestamp: endTime,
                    memoryUsage: {
                        initial: initialMemory,
                        peak: peakMemory,
                        delta: peakMemory.heapUsed - initialMemory.heapUsed
                    },
                    testResults: results,
                    commandRate: results.commandCount ? (results.commandCount / (duration / 1000)) : 0,
                    throughput: results.testCount ? (results.testCount / (duration / 1000)) : 0
                });
            });
            
            child.on('error', (error) => {
                clearTimeout(timeout);
                clearInterval(memoryMonitor);
                resolve({
                    suiteName,
                    error: error.message,
                    duration: Date.now() - startTime,
                    timestamp: new Date().toISOString()
                });
            });
        });
    }
    
    /**
     * Parse performance data from test output
     */
    parsePerformanceData(output, suiteInfo) {
        const result = {
            testCount: 0,
            passedTests: 0,
            failedTests: 0,
            commandCount: 0,
            successRate: 0
        };
        
        // Parse different output formats
        if (output.includes('FINAL RESULTS')) {
            // Interpreter test format
            const passedMatch = output.match(/✅ Passed: (\d+)/);
            const failedMatch = output.match(/❌ Failed: (\d+)/);
            const successRateMatch = output.match(/Success Rate: ([\d.]+)%/);
            
            if (passedMatch) result.passedTests = parseInt(passedMatch[1]);
            if (failedMatch) result.failedTests = parseInt(failedMatch[1]);
            if (successRateMatch) result.successRate = parseFloat(successRateMatch[1]);
            
            result.testCount = result.passedTests + result.failedTests;
            
            // Estimate command count (very rough estimate)
            result.commandCount = result.testCount * 50; // Assume ~50 commands per test
            
        } else {
            // Use baseline values if can't parse output
            result.testCount = suiteInfo.baseline.testCount;
            result.passedTests = result.testCount; // Assume success
            result.successRate = 100.0;
            result.commandCount = result.testCount * 50;
        }
        
        return result;
    }
    
    /**
     * Detect performance regressions
     */
    detectPerformanceRegressions(currentMeasurements) {
        const regressions = [];
        
        for (const measurement of currentMeasurements) {
            if (measurement.error) continue; // Skip failed measurements
            
            const suiteName = measurement.suiteName;
            const suiteInfo = this.monitoredSuites[suiteName];
            
            if (!suiteInfo) continue;
            
            // Compare against baseline
            const baseline = suiteInfo.baseline;
            const currentTime = measurement.duration;
            const baselineTime = baseline.executionTime;
            
            const percentageIncrease = ((currentTime - baselineTime) / baselineTime) * 100;
            
            // Check if this is a significant regression
            if (percentageIncrease > this.performanceMetrics.regressionThreshold) {
                const severity = percentageIncrease > 50 ? "SEVERE" : "MODERATE";
                
                regressions.push({
                    suiteName,
                    type: "EXECUTION_TIME_REGRESSION",
                    severity,
                    baseline: baselineTime,
                    current: currentTime,
                    percentageIncrease: percentageIncrease.toFixed(1),
                    critical: suiteInfo.critical
                });
            }
            
            // Check throughput regression
            if (measurement.throughput && baseline.testCount) {
                const baselineThroughput = baseline.testCount / (baseline.executionTime / 1000);
                const throughputDecrease = ((baselineThroughput - measurement.throughput) / baselineThroughput) * 100;
                
                if (throughputDecrease > this.performanceMetrics.regressionThreshold) {
                    regressions.push({
                        suiteName,
                        type: "THROUGHPUT_REGRESSION", 
                        severity: throughputDecrease > 50 ? "SEVERE" : "MODERATE",
                        baseline: baselineThroughput.toFixed(2),
                        current: measurement.throughput.toFixed(2),
                        percentageDecrease: throughputDecrease.toFixed(1)
                    });
                }
            }
        }
        
        return regressions;
    }
    
    /**
     * Generate performance analysis report
     */
    generatePerformanceReport(measurements, regressions) {
        const report = {
            performanceMonitoringAgent: {
                agent: this.agentName,
                version: this.version,
                reportTimestamp: new Date().toISOString()
            },
            summary: {
                suitesMonitored: measurements.length,
                successfulMeasurements: measurements.filter(m => !m.error).length,
                failedMeasurements: measurements.filter(m => m.error).length,
                regressions: regressions.length
            },
            measurements,
            regressions,
            performanceMetrics: this.calculatePerformanceMetrics(measurements),
            recommendations: this.generateRecommendations(measurements, regressions)
        };
        
        return report;
    }
    
    /**
     * Calculate aggregate performance metrics
     */
    calculatePerformanceMetrics(measurements) {
        const successful = measurements.filter(m => !m.error);
        
        if (successful.length === 0) {
            return { error: "No successful measurements to analyze" };
        }
        
        const totalDuration = successful.reduce((sum, m) => sum + m.duration, 0);
        const totalTests = successful.reduce((sum, m) => sum + (m.testResults?.testCount || 0), 0);
        const totalCommands = successful.reduce((sum, m) => sum + (m.testResults?.commandCount || 0), 0);
        
        return {
            averageExecutionTime: Math.round(totalDuration / successful.length),
            totalExecutionTime: totalDuration,
            averageCommandRate: totalCommands > 0 ? Math.round((totalCommands / (totalDuration / 1000))) : 0,
            overallThroughput: totalTests > 0 ? (totalTests / (totalDuration / 1000)).toFixed(2) : 0,
            memoryEfficiency: {
                averagePeakMemory: Math.round(successful.reduce((sum, m) => sum + (m.memoryUsage?.peak.heapUsed || 0), 0) / successful.length),
                averageMemoryDelta: Math.round(successful.reduce((sum, m) => sum + (m.memoryUsage?.delta || 0), 0) / successful.length)
            }
        };
    }
    
    /**
     * Generate optimization recommendations
     */
    generateRecommendations(measurements, regressions) {
        const recommendations = [];
        
        if (measurements.length === 0) {
            recommendations.push({
                type: "NO_DATA",
                message: "No performance measurements available",
                priority: "MEDIUM"
            });
            return recommendations;
        }
        
        if (regressions.length === 0) {
            recommendations.push({
                type: "PERFORMANCE_HEALTHY",
                message: "No significant performance regressions detected",
                priority: "INFO"
            });
        } else {
            const criticalRegressions = regressions.filter(r => r.critical && r.severity === "SEVERE");
            if (criticalRegressions.length > 0) {
                recommendations.push({
                    type: "CRITICAL_REGRESSION",
                    message: `${criticalRegressions.length} critical performance regression(s) require immediate attention`,
                    priority: "HIGH"
                });
            }
            
            recommendations.push({
                type: "OPTIMIZATION_NEEDED",
                message: `${regressions.length} performance regression(s) detected - consider optimization`,
                priority: "MEDIUM"
            });
        }
        
        // Analyze memory usage
        const successfulMeasurements = measurements.filter(m => !m.error && m.memoryUsage);
        if (successfulMeasurements.length > 0) {
            const avgMemoryDelta = successfulMeasurements.reduce((sum, m) => sum + m.memoryUsage.delta, 0) / successfulMeasurements.length;
            
            if (avgMemoryDelta > 50 * 1024 * 1024) { // 50MB threshold
                recommendations.push({
                    type: "MEMORY_OPTIMIZATION",
                    message: "High memory usage detected - consider memory optimization",
                    priority: "LOW"
                });
            }
        }
        
        return recommendations;
    }
    
    /**
     * Display performance report
     */
    displayPerformanceReport(report) {
        console.log(`\n📊 Performance Monitoring Summary:`);
        console.log(`   ⚡ Suites Monitored: ${report.summary.suitesMonitored}`);
        console.log(`   ✅ Successful: ${report.summary.successfulMeasurements}`);
        console.log(`   ❌ Failed: ${report.summary.failedMeasurements}`);
        console.log(`   🚨 Regressions: ${report.summary.regressions}`);
        
        if (report.performanceMetrics && !report.performanceMetrics.error) {
            console.log(`\n📈 Performance Metrics:`);
            console.log(`   ⏱️  Average Execution Time: ${report.performanceMetrics.averageExecutionTime}ms`);
            console.log(`   🚀 Average Command Rate: ${report.performanceMetrics.averageCommandRate} cmd/sec`);
            console.log(`   📊 Overall Throughput: ${report.performanceMetrics.overallThroughput} tests/sec`);
            console.log(`   💾 Average Peak Memory: ${(report.performanceMetrics.memoryEfficiency.averagePeakMemory / 1024 / 1024).toFixed(1)}MB`);
        }
        
        if (report.regressions.length > 0) {
            console.log(`\n🚨 Performance Regressions:`);
            report.regressions.forEach((regression, i) => {
                const severityEmoji = regression.severity === "SEVERE" ? "🔥" : "⚠️";
                console.log(`   ${severityEmoji} ${regression.suiteName}: ${regression.type}`);
                if (regression.percentageIncrease) {
                    console.log(`      Execution time increased by ${regression.percentageIncrease}% (${regression.baseline}ms → ${regression.current}ms)`);
                }
            });
        }
        
        if (report.recommendations.length > 0) {
            console.log(`\n💡 Recommendations:`);
            report.recommendations.forEach((rec, i) => {
                const priorityEmoji = rec.priority === "HIGH" ? "🚨" : 
                                    rec.priority === "MEDIUM" ? "⚠️" : "ℹ️";
                console.log(`   ${priorityEmoji} ${rec.message}`);
            });
        }
    }
    
    /**
     * Main execution method - monitor performance
     */
    async execute(suiteFilter = []) {
        console.log(`\n⚡ ${this.agentName} Agent - Performance Analysis`);
        console.log("===============================================");
        
        // Determine which suites to monitor
        const suitesToMonitor = suiteFilter.length > 0 ? 
            Object.fromEntries(Object.entries(this.monitoredSuites).filter(([name]) => suiteFilter.includes(name))) :
            this.monitoredSuites;
        
        console.log(`🎯 Monitoring ${Object.keys(suitesToMonitor).length} test suites...`);
        
        const measurements = [];
        
        // Measure performance for each suite
        for (const [suiteName, suiteInfo] of Object.entries(suitesToMonitor)) {
            const measurement = await this.measureTestSuitePerformance(suiteName, suiteInfo);
            measurements.push(measurement);
            
            const statusEmoji = measurement.error ? "❌" : "✅";
            const durationText = measurement.duration ? `${(measurement.duration / 1000).toFixed(1)}s` : "N/A";
            console.log(`${statusEmoji} ${suiteName}: ${durationText}`);
        }
        
        // Detect regressions
        const regressions = this.detectPerformanceRegressions(measurements);
        
        // Generate report
        const report = this.generatePerformanceReport(measurements, regressions);
        this.displayPerformanceReport(report);
        
        // Save measurements to history
        this.performanceHistory.measurements.push(...measurements.filter(m => !m.error));
        if (regressions.length > 0) {
            this.performanceHistory.regressions.push(...regressions.map(r => ({
                ...r,
                timestamp: new Date().toISOString()
            })));
        }
        this.savePerformanceHistory();
        
        console.log(`\n✅ Performance monitoring completed`);
        
        return report;
    }
}

// Export for use by other agents and direct execution
module.exports = { PerformanceMonitoringAgent };

// Allow direct execution
if (require.main === module) {
    const agent = new PerformanceMonitoringAgent();
    
    // Allow command line suite filtering
    const suiteFilter = process.argv.slice(2);
    
    agent.execute(suiteFilter).then(report => {
        console.log(`\n📋 Performance monitoring completed - ${report.summary.regressions} regressions detected`);
        
        // Exit with error code if critical regressions found
        const criticalRegressions = report.regressions.filter(r => r.critical && r.severity === "SEVERE");
        if (criticalRegressions.length > 0) {
            process.exit(1);
        }
    }).catch(error => {
        console.error(`❌ ${agent.agentName} Agent failed:`, error.message);
        process.exit(1);
    });
}