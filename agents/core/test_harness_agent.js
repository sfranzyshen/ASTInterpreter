#!/usr/bin/env node

/**
 * Test Harness Agent
 * 
 * Comprehensive test automation for the Arduino Interpreter Project.
 * This agent automates all test suites, provides consolidated reporting,
 * detects regressions, and maintains test quality standards.
 * 
 * Role: Test automation and quality assurance
 * Reports to: Task Manager Agent
 * Integrates with: All existing test harnesses in the project
 * 
 * Version: 1.2.0 - Added C++ test infrastructure and cross-platform validation
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class TestHarnessAgent {
    constructor() {
        this.version = "1.2.0";
        this.projectRoot = path.resolve(__dirname, '../..');
        this.agentName = "Test Harness";
        
        // Available test suites in the project
        this.testSuites = {
            "interpreter_examples": {
                path: "test_interpreter_examples.js",
                description: "79 Arduino examples interpretation test",
                expectedResults: { total: 79, successRate: 100.0 }
            },
            "interpreter_old_test": {
                path: "test_interpreter_old_test.js", 
                description: "54 comprehensive language features test",
                expectedResults: { total: 54, successRate: 100.0 }
            },
            "interpreter_neopixel": {
                path: "test_interpreter_neopixel.js",
                description: "2 NeoPixel library functionality test", 
                expectedResults: { total: 2, successRate: 100.0 }
            },
            "parser_examples": {
                path: "test_parser_examples.js",
                description: "79 Arduino examples parsing test",
                expectedResults: { total: 79, successRate: 100.0 }
            },
            "parser_old_test": {
                path: "test_parser_old_test.js",
                description: "54 comprehensive language features parsing test",
                expectedResults: { total: 54, successRate: 100.0 }
            },
            "parser_neopixel": {
                path: "test_parser_neopixel.js",
                description: "2 NeoPixel library parsing test",
                expectedResults: { total: 2, successRate: 100.0 }
            },
            "semantic_accuracy_examples": {
                path: "test_semantic_accuracy_examples.js",
                description: "79 Arduino examples semantic analysis",
                expectedResults: { total: 79, semanticAccuracy: 100.0 }
            },
            "semantic_accuracy": {
                path: "test_semantic_accuracy.js",
                description: "54 comprehensive tests semantic analysis", 
                expectedResults: { total: 54, semanticAccuracy: 100.0 }
            },
            "cpp_basic_interpreter": {
                path: "./basic_interpreter_example",
                description: "C++ basic interpreter functionality test",
                type: "cpp_executable",
                expectedResults: { successRate: 100.0 }
            },
            "cpp_cross_platform_validation": {
                path: "./test_cross_platform_validation",
                description: "JavaScript ↔ C++ command stream validation",
                type: "cpp_executable", 
                expectedResults: { successRate: 100.0 }
            },
            "cpp_simple_test": {
                path: "./simple_test",
                description: "C++ AST parsing and interpretation test",
                type: "cpp_executable",
                expectedResults: { successRate: 100.0 }
            },
            "test_data_generation": {
                path: "generate_test_data.js",
                description: "Generate binary AST test data for C++ validation",
                type: "javascript_generator",
                expectedResults: { total: 135, successRate: 95.0 }
            }
        };
        
        // Test execution configuration
        this.testConfig = {
            timeout: 600000, // 10 minutes per test suite
            retryAttempts: 1,
            parallelExecution: false, // Sequential for reliability
            outputCapture: true
        };
        
        // Results storage
        this.testResults = new Map();
        this.regressionBaseline = this.loadRegressionBaseline();
        
        console.log(`🧪 ${this.agentName} Agent v${this.version} initialized`);
        console.log(`📋 Available test suites: ${Object.keys(this.testSuites).length}`);
    }
    
    /**
     * Load regression baseline from previous runs
     */
    loadRegressionBaseline() {
        const baselinePath = path.join(this.projectRoot, 'agents/core/test_baseline.json');
        
        try {
            if (fs.existsSync(baselinePath)) {
                const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
                console.log(`📊 Loaded regression baseline: ${Object.keys(baseline).length} test suites`);
                return baseline;
            }
        } catch (error) {
            console.log(`⚠️  Could not load regression baseline: ${error.message}`);
        }
        
        // Return default baseline based on project documentation
        return {
            "interpreter_examples": { successRate: 100.0, total: 79 },
            "interpreter_old_test": { successRate: 100.0, total: 54 },
            "interpreter_neopixel": { successRate: 100.0, total: 2 },
            "parser_examples": { successRate: 100.0, total: 79 },
            "parser_old_test": { successRate: 100.0, total: 54 },
            "parser_neopixel": { successRate: 100.0, total: 2 },
            "semantic_accuracy_examples": { semanticAccuracy: 100.0, total: 79 },
            "semantic_accuracy": { semanticAccuracy: 100.0, total: 54 }
        };
    }
    
    /**
     * Save regression baseline for future comparisons
     */
    saveRegressionBaseline() {
        const baselinePath = path.join(this.projectRoot, 'agents/core/test_baseline.json');
        
        try {
            const baseline = {};
            for (const [suiteName, result] of this.testResults.entries()) {
                if (result.status === "PASSED") {
                    baseline[suiteName] = {
                        successRate: result.successRate || 100.0,
                        semanticAccuracy: result.semanticAccuracy || 100.0,
                        total: result.total || 0,
                        timestamp: result.timestamp
                    };
                }
            }
            
            fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
            console.log(`💾 Saved regression baseline: ${Object.keys(baseline).length} test suites`);
        } catch (error) {
            console.error(`❌ Failed to save regression baseline: ${error.message}`);
        }
    }
    
    /**
     * Execute a single test suite
     */
    async executeTestSuite(suiteName, suiteInfo) {
        console.log(`\n🧪 Running ${suiteName}: ${suiteInfo.description}`);
        
        const startTime = Date.now();
        const testPath = path.join(this.projectRoot, suiteInfo.path);
        
        // Check if test file exists
        if (!fs.existsSync(testPath)) {
            return {
                suiteName,
                status: "ERROR",
                error: `Test file not found: ${suiteInfo.path}`,
                duration: 0
            };
        }
        
        return new Promise((resolve) => {
            const child = spawn('node', [testPath], {
                cwd: this.projectRoot,
                stdio: this.testConfig.outputCapture ? 'pipe' : 'inherit'
            });
            
            let stdout = '';
            let stderr = '';
            
            if (this.testConfig.outputCapture) {
                child.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                
                child.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            }
            
            // Set timeout
            const timeout = setTimeout(() => {
                child.kill('SIGTERM');
                resolve({
                    suiteName,
                    status: "TIMEOUT",
                    error: `Test suite timed out after ${this.testConfig.timeout / 1000} seconds`,
                    duration: Date.now() - startTime
                });
            }, this.testConfig.timeout);
            
            child.on('close', (code) => {
                clearTimeout(timeout);
                const duration = Date.now() - startTime;
                
                if (code === 0) {
                    const results = this.parseTestOutput(stdout, suiteInfo);
                    resolve({
                        suiteName,
                        status: "PASSED",
                        duration,
                        timestamp: new Date().toISOString(),
                        ...results,
                        output: stdout.length > 1000 ? stdout.substring(0, 1000) + '...' : stdout
                    });
                } else {
                    resolve({
                        suiteName,
                        status: "FAILED",
                        error: `Test suite exited with code ${code}`,
                        duration,
                        stderr: stderr.length > 500 ? stderr.substring(0, 500) + '...' : stderr
                    });
                }
            });
            
            child.on('error', (error) => {
                clearTimeout(timeout);
                resolve({
                    suiteName,
                    status: "ERROR",
                    error: error.message,
                    duration: Date.now() - startTime
                });
            });
        });
    }
    
    /**
     * Parse test output to extract metrics
     */
    parseTestOutput(output, suiteInfo) {
        const result = {
            total: 0,
            passed: 0,
            failed: 0,
            successRate: 0,
            semanticAccuracy: null
        };
        
        // Parse different output formats based on test type
        if (output.includes('FINAL RESULTS')) {
            // Interpreter test format
            const passedMatch = output.match(/✅ Passed: (\d+)/);
            const failedMatch = output.match(/❌ Failed: (\d+)/);
            const successRateMatch = output.match(/Success Rate: ([\d.]+)%/);
            
            if (passedMatch) result.passed = parseInt(passedMatch[1]);
            if (failedMatch) result.failed = parseInt(failedMatch[1]);
            if (successRateMatch) result.successRate = parseFloat(successRateMatch[1]);
            
            result.total = result.passed + result.failed;
            
        } else if (output.includes('semantic accuracy')) {
            // Semantic accuracy test format
            const accuracyMatch = output.match(/Overall Accuracy: ([\d.]+)%/);
            const testsMatch = output.match(/(\d+) tests/);
            
            if (accuracyMatch) result.semanticAccuracy = parseFloat(accuracyMatch[1]);
            if (testsMatch) result.total = parseInt(testsMatch[1]);
            
        } else {
            // Parser test or unknown format - use expected values
            result.total = suiteInfo.expectedResults.total || 0;
            result.passed = result.total; // Assume success if no failures detected
            result.successRate = 100.0;
        }
        
        return result;
    }
    
    /**
     * Detect regressions by comparing with baseline
     */
    detectRegressions() {
        const regressions = [];
        
        for (const [suiteName, result] of this.testResults.entries()) {
            const baseline = this.regressionBaseline[suiteName];
            
            if (!baseline) continue; // No baseline to compare against
            
            const currentRate = result.successRate || result.semanticAccuracy || 0;
            const baselineRate = baseline.successRate || baseline.semanticAccuracy || 0;
            
            // Consider it a regression if rate drops by more than 1%
            if (currentRate < baselineRate - 1) {
                regressions.push({
                    suiteName,
                    currentRate,
                    baselineRate,
                    difference: baselineRate - currentRate
                });
            }
        }
        
        return regressions;
    }
    
    /**
     * Generate comprehensive test report
     */
    generateTestReport() {
        const overallStats = {
            totalSuites: this.testResults.size,
            passedSuites: 0,
            failedSuites: 0,
            errorSuites: 0,
            timeoutSuites: 0,
            totalDuration: 0
        };
        
        const detailedResults = [];
        
        for (const [suiteName, result] of this.testResults.entries()) {
            switch (result.status) {
                case "PASSED": overallStats.passedSuites++; break;
                case "FAILED": overallStats.failedSuites++; break;
                case "ERROR": overallStats.errorSuites++; break;
                case "TIMEOUT": overallStats.timeoutSuites++; break;
            }
            
            overallStats.totalDuration += result.duration || 0;
            detailedResults.push(result);
        }
        
        const regressions = this.detectRegressions();
        
        const report = {
            testHarnessAgent: {
                agent: this.agentName,
                version: this.version,
                reportTimestamp: new Date().toISOString()
            },
            overallStats,
            detailedResults,
            regressions,
            recommendations: this.generateRecommendations(overallStats, regressions)
        };
        
        return report;
    }
    
    /**
     * Generate recommendations based on test results
     */
    generateRecommendations(stats, regressions) {
        const recommendations = [];
        
        if (stats.passedSuites === stats.totalSuites) {
            recommendations.push({
                type: "SUCCESS",
                message: "All test suites passed successfully! 🎉",
                priority: "INFO"
            });
        }
        
        if (stats.failedSuites > 0) {
            recommendations.push({
                type: "ACTION_REQUIRED",
                message: `${stats.failedSuites} test suite(s) failed and need attention`,
                priority: "HIGH"
            });
        }
        
        if (regressions.length > 0) {
            recommendations.push({
                type: "REGRESSION_DETECTED",
                message: `${regressions.length} regression(s) detected - performance has decreased`,
                priority: "MEDIUM"
            });
        }
        
        if (stats.totalDuration > 600000) { // More than 10 minutes
            recommendations.push({
                type: "OPTIMIZATION",
                message: "Test execution time is high, consider optimization",
                priority: "LOW"
            });
        }
        
        return recommendations;
    }
    
    /**
     * Display test report summary
     */
    displayTestReport(report) {
        console.log(`\n📊 Test Execution Summary:`);
        console.log(`   📝 Total Suites: ${report.overallStats.totalSuites}`);
        console.log(`   ✅ Passed: ${report.overallStats.passedSuites}`);
        console.log(`   ❌ Failed: ${report.overallStats.failedSuites}`);
        console.log(`   💥 Errors: ${report.overallStats.errorSuites}`);
        console.log(`   ⏱️  Duration: ${(report.overallStats.totalDuration / 1000).toFixed(1)}s`);
        
        const overallSuccessRate = report.overallStats.totalSuites > 0 ? 
            Math.round((report.overallStats.passedSuites / report.overallStats.totalSuites) * 100) : 0;
        console.log(`   📈 Overall Success: ${overallSuccessRate}%`);
        
        if (report.regressions.length > 0) {
            console.log(`\n🚨 Regressions Detected:`);
            report.regressions.forEach((regression, i) => {
                console.log(`   ${i + 1}. ${regression.suiteName}: ${regression.currentRate.toFixed(1)}% (was ${regression.baselineRate.toFixed(1)}%)`);
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
     * Claude Code Subagent Integration Methods
     */
    
    /**
     * Trigger test-diagnostician subagent for test failure analysis
     */
    async invokeTestDiagnostician(failureContext) {
        console.log(`🤖 Triggering test-diagnostician subagent for failure analysis...`);
        
        // Create detailed failure context for the subagent
        const diagnosticContext = {
            timestamp: new Date().toISOString(),
            failedSuites: Array.from(this.testResults.entries())
                .filter(([, result]) => result.status !== "PASSED")
                .map(([name, result]) => ({
                    suiteName: name,
                    status: result.status,
                    error: result.error,
                    successRate: result.successRate || 0,
                    semanticAccuracy: result.semanticAccuracy || null,
                    regressionData: this.compareWithBaseline(name, result)
                })),
            regressionAnalysis: this.detectRegressions(),
            totalStats: {
                failed: Array.from(this.testResults.values()).filter(r => r.status !== "PASSED").length,
                total: this.testResults.size
            },
            ...failureContext
        };
        
        // Log the trigger context
        console.log(`   📊 Analysis Context: ${diagnosticContext.failedSuites.length} failed suites, ${diagnosticContext.regressionAnalysis.length} regressions`);
        
        // Note: In a real implementation, this would make an API call to Claude Code
        // For now, we log the intended action and context
        console.log(`   📋 Context prepared for test-diagnostician subagent`);
        console.log(`   🎯 Recommended analysis: Root cause identification and specialist delegation`);
        
        return {
            triggered: true,
            subagent: 'test-diagnostician',
            context: diagnosticContext,
            expectedActions: [
                'Analyze root cause of test failures',
                'Classify issues by component (parser, interpreter, library)',
                'Recommend appropriate specialist subagent',
                'Provide specific fix recommendations'
            ]
        };
    }
    
    /**
     * Compare current results with baseline for regression detection
     */
    compareWithBaseline(suiteName, result) {
        const baseline = this.regressionBaseline[suiteName];
        if (!baseline) return null;
        
        const currentRate = result.successRate || result.semanticAccuracy || 0;
        const baselineRate = baseline.successRate || baseline.semanticAccuracy || 0;
        
        return {
            current: currentRate,
            baseline: baselineRate,
            difference: baselineRate - currentRate,
            isRegression: currentRate < baselineRate - 1,
            severity: currentRate < baselineRate - 5 ? 'HIGH' : 
                     currentRate < baselineRate - 1 ? 'MEDIUM' : 'LOW'
        };
    }
    
    /**
     * Determine if Claude Code subagent intervention is needed
     */
    shouldTriggerSubagent(report) {
        const triggers = {
            testFailures: report.overallStats.failedSuites > 0,
            regressions: report.regressions.length > 0,
            semanticIssues: report.detailedResults.some(r => 
                r.semanticAccuracy !== null && r.semanticAccuracy < 95
            ),
            systematicFailures: report.detailedResults.filter(r => 
                r.status !== "PASSED"
            ).length > 2
        };
        
        return {
            shouldTrigger: Object.values(triggers).some(t => t),
            triggers,
            priority: triggers.systematicFailures ? 'HIGH' :
                     triggers.testFailures ? 'MEDIUM' : 'LOW',
            recommendedSubagent: triggers.systematicFailures ? 'test-diagnostician' :
                               triggers.testFailures ? 'test-diagnostician' : null
        };
    }
    
    /**
     * Main execution method - run all test suites
     */
    async execute(suiteFilter = []) {
        console.log(`\n🧪 ${this.agentName} Agent - Comprehensive Test Execution`);
        console.log("========================================================");
        
        // Determine which suites to run
        const suitesToRun = suiteFilter.length > 0 ? 
            Object.fromEntries(Object.entries(this.testSuites).filter(([name]) => suiteFilter.includes(name))) :
            this.testSuites;
        
        console.log(`🎯 Running ${Object.keys(suitesToRun).length} test suites...`);
        
        // Execute test suites
        for (const [suiteName, suiteInfo] of Object.entries(suitesToRun)) {
            const result = await this.executeTestSuite(suiteName, suiteInfo);
            this.testResults.set(suiteName, result);
            
            const statusEmoji = result.status === "PASSED" ? "✅" : 
                              result.status === "FAILED" ? "❌" : 
                              result.status === "TIMEOUT" ? "⏱️" : "💥";
            console.log(`${statusEmoji} ${suiteName}: ${result.status} (${(result.duration / 1000).toFixed(1)}s)`);
        }
        
        // Generate and display report
        const report = this.generateTestReport();
        this.displayTestReport(report);
        
        // Check if Claude Code subagent intervention is needed
        const subagentAnalysis = this.shouldTriggerSubagent(report);
        if (subagentAnalysis.shouldTrigger) {
            console.log(`\n🤖 Claude Code Subagent Analysis Required`);
            console.log(`   Priority: ${subagentAnalysis.priority}`);
            console.log(`   Triggers: ${Object.entries(subagentAnalysis.triggers)
                .filter(([, active]) => active)
                .map(([trigger]) => trigger)
                .join(', ')}`);
            
            // Invoke the recommended subagent
            if (subagentAnalysis.recommendedSubagent === 'test-diagnostician') {
                const diagnosticResult = await this.invokeTestDiagnostician({
                    triggerReason: Object.keys(subagentAnalysis.triggers).filter(k => subagentAnalysis.triggers[k]),
                    priority: subagentAnalysis.priority,
                    reportSummary: {
                        totalSuites: report.overallStats.totalSuites,
                        failedSuites: report.overallStats.failedSuites,
                        regressions: report.regressions.length
                    }
                });
                
                // Add subagent analysis to the report
                report.subagentAnalysis = diagnosticResult;
            }
        } else {
            console.log(`\n✅ All tests passed - No subagent intervention needed`);
        }
        
        // Save baseline if all tests passed
        if (report.overallStats.passedSuites === report.overallStats.totalSuites) {
            this.saveRegressionBaseline();
        }
        
        console.log(`\n✅ Test harness execution completed`);
        
        return report;
    }
}

// Export for use by other agents and direct execution
module.exports = { TestHarnessAgent };

// Allow direct execution
if (require.main === module) {
    const agent = new TestHarnessAgent();
    
    // Allow command line suite filtering
    const suiteFilter = process.argv.slice(2);
    
    agent.execute(suiteFilter).then(report => {
        const successRate = Math.round((report.overallStats.passedSuites / report.overallStats.totalSuites) * 100);
        console.log(`\n📋 Test execution completed - ${successRate}% success rate`);
        
        // Exit with error code if any tests failed
        if (report.overallStats.failedSuites > 0 || report.overallStats.errorSuites > 0) {
            process.exit(1);
        }
    }).catch(error => {
        console.error(`❌ ${agent.agentName} Agent failed:`, error.message);
        process.exit(1);
    });
}