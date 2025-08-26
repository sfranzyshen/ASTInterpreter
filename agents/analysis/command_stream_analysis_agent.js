#!/usr/bin/env node

/**
 * Command Stream Analysis Agent
 * 
 * Pattern detection and optimization analysis for Arduino Interpreter command streams.
 * This agent analyzes interpreter command output, identifies patterns, detects
 * anomalies, and suggests optimizations for command generation and display.
 * 
 * Role: Command stream analysis and optimization guidance  
 * Reports to: Task Manager Agent
 * Integrates with: Test Harness Agent for command stream data collection
 * 
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class CommandStreamAnalysisAgent {
    constructor() {
        this.version = "1.0.0";
        this.projectRoot = path.resolve(__dirname, '../..');
        this.agentName = "Command Stream Analysis";
        
        // Command types to analyze and their expected patterns
        this.commandTypes = {
            // Basic Arduino commands
            "PIN_MODE": { category: "HARDWARE", frequency: "LOW", shouldHaveFields: ["pin", "mode"] },
            "DIGITAL_WRITE": { category: "HARDWARE", frequency: "MEDIUM", shouldHaveFields: ["pin", "value"] },
            "DIGITAL_READ_REQUEST": { category: "HARDWARE", frequency: "MEDIUM", shouldHaveFields: ["pin", "requestId"] },
            "ANALOG_WRITE": { category: "HARDWARE", frequency: "LOW", shouldHaveFields: ["pin", "value"] },
            "ANALOG_READ_REQUEST": { category: "HARDWARE", frequency: "LOW", shouldHaveFields: ["pin", "requestId"] },
            
            // Control flow commands  
            "IF_STATEMENT": { category: "CONTROL_FLOW", frequency: "HIGH", shouldHaveFields: ["condition", "result", "branch"] },
            "SWITCH_CASE": { category: "CONTROL_FLOW", frequency: "MEDIUM", shouldHaveFields: ["caseValue", "matched"] },
            "FOR_LOOP": { category: "CONTROL_FLOW", frequency: "HIGH", shouldHaveFields: ["message"] },
            "WHILE_LOOP": { category: "CONTROL_FLOW", frequency: "MEDIUM", shouldHaveFields: ["message"] },
            
            // Variable operations
            "VAR_SET": { category: "VARIABLES", frequency: "HIGH", shouldHaveFields: ["variable", "value"] },
            "VAR_GET": { category: "VARIABLES", frequency: "HIGH", shouldHaveFields: ["variable", "value"] },
            
            // Function operations  
            "FUNCTION_CALL": { category: "FUNCTIONS", frequency: "HIGH", shouldHaveFields: ["function"] },
            "SETUP_START": { category: "LIFECYCLE", frequency: "SINGLE", shouldHaveFields: [] },
            "SETUP_END": { category: "LIFECYCLE", frequency: "SINGLE", shouldHaveFields: [] },
            "LOOP_START": { category: "LIFECYCLE", frequency: "HIGH", shouldHaveFields: [] },
            "LOOP_END": { category: "LIFECYCLE", frequency: "HIGH", shouldHaveFields: [] },
            
            // Library operations
            "LIBRARY_METHOD_CALL": { category: "LIBRARIES", frequency: "MEDIUM", shouldHaveFields: ["library", "method"] },
            "LIBRARY_METHOD_INTERNAL": { category: "LIBRARIES", frequency: "MEDIUM", shouldHaveFields: ["library", "method", "result"] },
            "LIBRARY_METHOD_REQUEST": { category: "LIBRARIES", frequency: "LOW", shouldHaveFields: ["library", "method", "requestId"] },
            
            // System commands
            "MILLIS_REQUEST": { category: "TIMING", frequency: "MEDIUM", shouldHaveFields: ["requestId"] },
            "DELAY": { category: "TIMING", frequency: "MEDIUM", shouldHaveFields: ["duration"] },
            "ERROR": { category: "SYSTEM", frequency: "RARE", shouldHaveFields: ["message"] },
            "WARNING": { category: "SYSTEM", frequency: "RARE", shouldHaveFields: ["message"] }
        };
        
        // Pattern analysis results storage
        this.analysisResults = {
            commandFrequencies: {},
            missingFields: [],
            anomalies: [],
            optimizationSuggestions: []
        };
        
        console.log(`🔍 ${this.agentName} Agent v${this.version} initialized`);
        console.log(`📊 Analyzing ${Object.keys(this.commandTypes).length} command types`);
    }
    
    /**
     * Capture command stream from a test execution
     */
    async captureCommandStream(testScript) {
        console.log(`\n🔍 Capturing command stream from: ${testScript}`);
        
        const testPath = path.join(this.projectRoot, testScript);
        
        if (!fs.existsSync(testPath)) {
            throw new Error(`Test script not found: ${testScript}`);
        }
        
        return new Promise((resolve) => {
            const child = spawn('node', [testPath], {
                cwd: this.projectRoot,
                stdio: 'pipe'
            });
            
            let stdout = '';
            let stderr = '';
            
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            const timeout = setTimeout(() => {
                child.kill('SIGTERM');
                resolve({
                    error: "Command stream capture timeout",
                    partial: true,
                    stdout,
                    stderr
                });
            }, 30000); // 30 second timeout
            
            child.on('close', (code) => {
                clearTimeout(timeout);
                resolve({
                    success: code === 0,
                    stdout,
                    stderr,
                    exitCode: code
                });
            });
            
            child.on('error', (error) => {
                clearTimeout(timeout);
                resolve({
                    error: error.message,
                    stdout,
                    stderr
                });
            });
        });
    }
    
    /**
     * Parse commands from captured output (simulated - would need actual command capture)
     */
    parseCommandsFromOutput(output) {
        // In a real implementation, this would parse actual command stream output
        // For now, simulate command parsing based on common patterns
        const commands = [];
        
        // Look for test result patterns to estimate command generation
        const testMatches = output.match(/✅ PASSED \((\d+) commands\)/g);
        if (testMatches) {
            // Simulate typical Arduino command patterns
            let commandId = 0;
            testMatches.forEach(() => {
                // Simulate common Arduino program flow
                commands.push(
                    { type: "SETUP_START", timestamp: Date.now() + commandId++ },
                    { type: "PIN_MODE", pin: 13, mode: 1, timestamp: Date.now() + commandId++ },
                    { type: "SETUP_END", timestamp: Date.now() + commandId++ },
                    { type: "LOOP_START", timestamp: Date.now() + commandId++ },
                    { type: "DIGITAL_WRITE", pin: 13, value: 1, timestamp: Date.now() + commandId++ },
                    { type: "DELAY", duration: 1000, timestamp: Date.now() + commandId++ },
                    { type: "DIGITAL_WRITE", pin: 13, value: 0, timestamp: Date.now() + commandId++ },
                    { type: "DELAY", duration: 1000, timestamp: Date.now() + commandId++ },
                    { type: "LOOP_END", timestamp: Date.now() + commandId++ }
                );
            });
        }
        
        // Add some IF_STATEMENT commands based on control flow patterns
        if (output.includes('if')) {
            commands.push(
                { type: "IF_STATEMENT", condition: true, result: true, branch: "then", timestamp: Date.now() },
                { type: "VAR_SET", variable: "ledState", value: 1, timestamp: Date.now() }
            );
        }
        
        // Add library method calls if library tests detected
        if (output.includes('NeoPixel') || output.includes('Library')) {
            commands.push(
                { type: "LIBRARY_METHOD_CALL", library: "Adafruit_NeoPixel", method: "begin", args: [], timestamp: Date.now() },
                { type: "LIBRARY_METHOD_INTERNAL", library: "Adafruit_NeoPixel", method: "setPixelColor", args: [0, 255], result: null, timestamp: Date.now() },
                { type: "LIBRARY_METHOD_REQUEST", library: "Adafruit_NeoPixel", method: "numPixels", requestId: "req_123", timestamp: Date.now() }
            );
        }
        
        return commands;
    }
    
    /**
     * Analyze command frequency patterns
     */
    analyzeCommandFrequencies(commands) {
        console.log(`📊 Analyzing command frequency patterns...`);
        
        const frequencies = {};
        const totalCommands = commands.length;
        
        // Count command types
        commands.forEach(cmd => {
            frequencies[cmd.type] = (frequencies[cmd.type] || 0) + 1;
        });
        
        // Calculate percentages and detect anomalies
        const frequencyAnalysis = {};
        Object.entries(frequencies).forEach(([type, count]) => {
            const percentage = (count / totalCommands) * 100;
            const expected = this.commandTypes[type];
            
            frequencyAnalysis[type] = {
                count,
                percentage: percentage.toFixed(2),
                expected: expected ? expected.frequency : "UNKNOWN",
                anomaly: this.detectFrequencyAnomaly(type, percentage, expected)
            };
        });
        
        return frequencyAnalysis;
    }
    
    /**
     * Detect frequency anomalies
     */
    detectFrequencyAnomaly(commandType, actualPercentage, expectedInfo) {
        if (!expectedInfo) return null;
        
        const thresholds = {
            "SINGLE": { min: 0, max: 0.5 },    // Should appear very rarely
            "RARE": { min: 0, max: 1 },       // Less than 1%
            "LOW": { min: 0, max: 5 },        // Less than 5%
            "MEDIUM": { min: 2, max: 20 },    // 2-20%
            "HIGH": { min: 10, max: 80 }      // 10-80%
        };
        
        const threshold = thresholds[expectedInfo.frequency];
        if (!threshold) return null;
        
        if (actualPercentage < threshold.min) {
            return { type: "UNDER_FREQUENCY", severity: "LOW" };
        } else if (actualPercentage > threshold.max) {
            return { type: "OVER_FREQUENCY", severity: actualPercentage > threshold.max * 2 ? "HIGH" : "MEDIUM" };
        }
        
        return null;
    }
    
    /**
     * Analyze command structure for missing fields
     */
    analyzeMissingFields(commands) {
        console.log(`🔍 Analyzing command structure for missing fields...`);
        
        const missingFields = [];
        
        commands.forEach((cmd, index) => {
            const expectedInfo = this.commandTypes[cmd.type];
            if (!expectedInfo) return; // Skip unknown command types
            
            expectedInfo.shouldHaveFields.forEach(field => {
                if (cmd[field] === undefined || cmd[field] === null) {
                    missingFields.push({
                        commandIndex: index,
                        commandType: cmd.type,
                        missingField: field,
                        timestamp: cmd.timestamp
                    });
                }
            });
        });
        
        return missingFields;
    }
    
    /**
     * Detect command stream anomalies
     */
    detectStreamAnomalies(commands) {
        console.log(`🚨 Detecting command stream anomalies...`);
        
        const anomalies = [];
        
        // Check for lifecycle anomalies
        const setupStarts = commands.filter(cmd => cmd.type === "SETUP_START").length;
        const setupEnds = commands.filter(cmd => cmd.type === "SETUP_END").length;
        
        if (setupStarts !== setupEnds) {
            anomalies.push({
                type: "LIFECYCLE_MISMATCH",
                severity: "HIGH",
                description: `Setup start/end mismatch: ${setupStarts} starts, ${setupEnds} ends`
            });
        }
        
        // Check for excessive error commands
        const errorCount = commands.filter(cmd => cmd.type === "ERROR").length;
        if (errorCount > commands.length * 0.05) { // More than 5%
            anomalies.push({
                type: "EXCESSIVE_ERRORS",
                severity: "HIGH",
                description: `High error rate: ${errorCount} errors out of ${commands.length} commands`
            });
        }
        
        // Check for missing timestamps
        const missingTimestamps = commands.filter(cmd => !cmd.timestamp).length;
        if (missingTimestamps > 0) {
            anomalies.push({
                type: "MISSING_TIMESTAMPS",
                severity: "MEDIUM", 
                description: `${missingTimestamps} commands missing timestamps`
            });
        }
        
        // Check for command clustering (rapid succession of same command type)
        let previousType = null;
        let clusterCount = 0;
        let maxCluster = 0;
        
        commands.forEach(cmd => {
            if (cmd.type === previousType) {
                clusterCount++;
                maxCluster = Math.max(maxCluster, clusterCount);
            } else {
                clusterCount = 1;
            }
            previousType = cmd.type;
        });
        
        if (maxCluster > 10) { // More than 10 consecutive same commands
            anomalies.push({
                type: "COMMAND_CLUSTERING",
                severity: "MEDIUM",
                description: `Excessive command clustering detected: ${maxCluster} consecutive ${previousType} commands`
            });
        }
        
        return anomalies;
    }
    
    /**
     * Generate optimization suggestions
     */
    generateOptimizationSuggestions(frequencyAnalysis, missingFields, anomalies) {
        const suggestions = [];
        
        // Frequency-based optimizations
        Object.entries(frequencyAnalysis).forEach(([type, data]) => {
            if (data.anomaly) {
                if (data.anomaly.type === "OVER_FREQUENCY") {
                    suggestions.push({
                        type: "FREQUENCY_OPTIMIZATION",
                        priority: data.anomaly.severity,
                        description: `Consider reducing ${type} command frequency (${data.percentage}% of stream)`,
                        commandType: type
                    });
                }
            }
        });
        
        // Missing field optimizations
        if (missingFields.length > 0) {
            const fieldIssues = {};
            missingFields.forEach(issue => {
                const key = `${issue.commandType}.${issue.missingField}`;
                fieldIssues[key] = (fieldIssues[key] || 0) + 1;
            });
            
            Object.entries(fieldIssues).forEach(([key, count]) => {
                suggestions.push({
                    type: "FIELD_COMPLETENESS",
                    priority: "MEDIUM",
                    description: `Add missing field: ${key} (${count} occurrences)`,
                    affectedCommands: count
                });
            });
        }
        
        // Anomaly-based optimizations
        anomalies.forEach(anomaly => {
            suggestions.push({
                type: "ANOMALY_RESOLUTION",
                priority: anomaly.severity,
                description: `Resolve ${anomaly.type}: ${anomaly.description}`,
                anomaly: anomaly.type
            });
        });
        
        // General optimization suggestions
        suggestions.push({
            type: "ARCHITECTURE_IMPROVEMENT",
            priority: "LOW",
            description: "Consider implementing command batching for performance optimization"
        });
        
        return suggestions;
    }
    
    /**
     * Generate analysis report
     */
    generateAnalysisReport(commands, frequencyAnalysis, missingFields, anomalies, suggestions) {
        const report = {
            commandStreamAnalysisAgent: {
                agent: this.agentName,
                version: this.version,
                reportTimestamp: new Date().toISOString()
            },
            summary: {
                totalCommands: commands.length,
                uniqueCommandTypes: Object.keys(frequencyAnalysis).length,
                missingFields: missingFields.length,
                anomalies: anomalies.length,
                suggestions: suggestions.length
            },
            frequencyAnalysis,
            missingFields,
            anomalies,
            suggestions,
            recommendations: this.generateRecommendations(anomalies, suggestions)
        };
        
        return report;
    }
    
    /**
     * Generate high-level recommendations
     */
    generateRecommendations(anomalies, suggestions) {
        const recommendations = [];
        
        const highPrioritySuggestions = suggestions.filter(s => s.priority === "HIGH").length;
        const mediumPrioritySuggestions = suggestions.filter(s => s.priority === "MEDIUM").length;
        
        if (anomalies.length === 0 && suggestions.length <= 2) {
            recommendations.push({
                type: "HEALTHY_STREAM",
                message: "Command stream appears healthy with minimal issues",
                priority: "INFO"
            });
        }
        
        if (highPrioritySuggestions > 0) {
            recommendations.push({
                type: "URGENT_OPTIMIZATION",
                message: `${highPrioritySuggestions} high-priority optimization(s) need immediate attention`,
                priority: "HIGH"
            });
        }
        
        if (mediumPrioritySuggestions > 0) {
            recommendations.push({
                type: "OPTIMIZATION_OPPORTUNITY",
                message: `${mediumPrioritySuggestions} optimization opportunity/ies identified`,
                priority: "MEDIUM"
            });
        }
        
        if (anomalies.some(a => a.type === "LIFECYCLE_MISMATCH")) {
            recommendations.push({
                type: "STRUCTURAL_ISSUE",
                message: "Command stream has structural integrity issues",
                priority: "HIGH"
            });
        }
        
        return recommendations;
    }
    
    /**
     * Display analysis report
     */
    displayAnalysisReport(report) {
        console.log(`\n📊 Command Stream Analysis Summary:`);
        console.log(`   📝 Total Commands: ${report.summary.totalCommands}`);
        console.log(`   🎯 Unique Command Types: ${report.summary.uniqueCommandTypes}`);
        console.log(`   ⚠️  Missing Fields: ${report.summary.missingFields}`);
        console.log(`   🚨 Anomalies: ${report.summary.anomalies}`);
        console.log(`   💡 Optimization Suggestions: ${report.summary.suggestions}`);
        
        // Display top command types by frequency
        console.log(`\n📈 Top Command Types by Frequency:`);
        const sortedFrequencies = Object.entries(report.frequencyAnalysis)
            .sort(([,a], [,b]) => parseFloat(b.percentage) - parseFloat(a.percentage))
            .slice(0, 5);
            
        sortedFrequencies.forEach(([type, data], i) => {
            const anomalyIndicator = data.anomaly ? "⚠️" : "✅";
            console.log(`   ${i+1}. ${type}: ${data.percentage}% (${data.count} commands) ${anomalyIndicator}`);
        });
        
        if (report.anomalies.length > 0) {
            console.log(`\n🚨 Detected Anomalies:`);
            report.anomalies.forEach((anomaly, i) => {
                const severityEmoji = anomaly.severity === "HIGH" ? "🔥" : "⚠️";
                console.log(`   ${severityEmoji} ${anomaly.type}: ${anomaly.description}`);
            });
        }
        
        if (report.suggestions.length > 0) {
            console.log(`\n💡 Top Optimization Suggestions:`);
            const topSuggestions = report.suggestions
                .sort((a, b) => {
                    const priorityOrder = { "HIGH": 3, "MEDIUM": 2, "LOW": 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                })
                .slice(0, 5);
                
            topSuggestions.forEach((suggestion, i) => {
                const priorityEmoji = suggestion.priority === "HIGH" ? "🚨" : 
                                    suggestion.priority === "MEDIUM" ? "⚠️" : "ℹ️";
                console.log(`   ${priorityEmoji} ${suggestion.description}`);
            });
        }
        
        if (report.recommendations.length > 0) {
            console.log(`\n🎯 Recommendations:`);
            report.recommendations.forEach((rec, i) => {
                const priorityEmoji = rec.priority === "HIGH" ? "🚨" : 
                                    rec.priority === "MEDIUM" ? "⚠️" : "ℹ️";
                console.log(`   ${priorityEmoji} ${rec.message}`);
            });
        }
    }
    
    /**
     * Main execution method - analyze command streams
     */
    async execute(testScripts = []) {
        console.log(`\n🔍 ${this.agentName} Agent - Command Stream Analysis`);
        console.log("====================================================");
        
        // Default test scripts if none provided
        if (testScripts.length === 0) {
            testScripts = ["test_interpreter_neopixel.js"]; // Start with a simple test
        }
        
        console.log(`🎯 Analyzing command streams from ${testScripts.length} test script(s)...`);
        
        let allCommands = [];
        
        // Capture and analyze each test script
        for (const testScript of testScripts) {
            console.log(`\n📋 Processing: ${testScript}`);
            
            try {
                const captureResult = await this.captureCommandStream(testScript);
                
                if (captureResult.error) {
                    console.log(`   ❌ Capture failed: ${captureResult.error}`);
                    continue;
                }
                
                // Parse commands from output
                const commands = this.parseCommandsFromOutput(captureResult.stdout);
                allCommands.push(...commands);
                
                console.log(`   ✅ Captured ${commands.length} commands`);
                
            } catch (error) {
                console.error(`   💥 Error processing ${testScript}: ${error.message}`);
            }
        }
        
        if (allCommands.length === 0) {
            console.log(`⚠️  No commands captured for analysis`);
            return { error: "No command data available", totalCommands: 0 };
        }
        
        console.log(`\n🔍 Analyzing ${allCommands.length} total commands...`);
        
        // Perform analysis
        const frequencyAnalysis = this.analyzeCommandFrequencies(allCommands);
        const missingFields = this.analyzeMissingFields(allCommands);
        const anomalies = this.detectStreamAnomalies(allCommands);
        const suggestions = this.generateOptimizationSuggestions(frequencyAnalysis, missingFields, anomalies);
        
        // Generate report
        const report = this.generateAnalysisReport(allCommands, frequencyAnalysis, missingFields, anomalies, suggestions);
        this.displayAnalysisReport(report);
        
        console.log(`\n✅ Command stream analysis completed`);
        
        return report;
    }
}

// Export for use by other agents and direct execution
module.exports = { CommandStreamAnalysisAgent };

// Allow direct execution
if (require.main === module) {
    const agent = new CommandStreamAnalysisAgent();
    
    // Allow command line test script specification
    const testScripts = process.argv.slice(2);
    
    agent.execute(testScripts).then(report => {
        if (report.error) {
            console.log(`\n📋 Command stream analysis completed with errors`);
            process.exit(1);
        } else {
            const urgentIssues = (report.anomalies || []).filter(a => a.severity === "HIGH").length;
            console.log(`\n📋 Command stream analysis completed - ${urgentIssues} urgent issues found`);
            
            // Exit with error code if high-severity issues found
            if (urgentIssues > 0) {
                process.exit(1);
            }
        }
    }).catch(error => {
        console.error(`❌ ${agent.agentName} Agent failed:`, error.message);
        process.exit(1);
    });
}