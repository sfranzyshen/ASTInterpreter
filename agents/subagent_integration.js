#!/usr/bin/env node

/**
 * Claude Code Subagent Integration Helper
 * 
 * Provides utility functions for JavaScript automation agents to integrate
 * with Claude Code subagents. Handles communication, context preparation,
 * and coordination between the automation tier and AI specialist tier.
 * 
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class SubagentIntegration {
    constructor(projectRoot = path.resolve(__dirname, '..')) {
        this.projectRoot = projectRoot;
        this.availableSubagents = {
            'parser-specialist': {
                description: 'Arduino C++ parsing, AST generation, preprocessor integration',
                contextFiles: ['ArduinoParser.js', 'ALR.txt'],
                specialties: ['parsing', 'preprocessing', 'platform_emulation', 'ast_generation']
            },
            'interpreter-specialist': {
                description: 'Arduino code execution, hardware simulation, library integration',
                contextFiles: ['ASTInterpreter.js', 'command_stream_validator.js'],
                specialties: ['execution', 'hardware_simulation', 'library_integration', 'command_streams']
            },
            'test-diagnostician': {
                description: 'Test failure analysis, regression detection, test quality',
                contextFiles: ['test_*.js', 'examples.js', 'old_test.js', 'neopixel.js'],
                specialties: ['test_analysis', 'regression_detection', 'failure_diagnosis', 'quality_assessment']
            },
            'architecture-reviewer': {
                description: 'Architecture assessment, design patterns, integration strategies',
                contextFiles: ['CLAUDE.md', 'ARCHITECTURE_DESIGN.md', 'AI_TESTBED_GUIDE.md'],
                specialties: ['architecture', 'design_patterns', 'integration', 'scalability']
            }
        };
        
        console.log(`🔗 Subagent Integration Helper initialized`);
        console.log(`   Available subagents: ${Object.keys(this.availableSubagents).length}`);
    }
    
    /**
     * Check if Claude Code subagents are available
     */
    checkSubagentAvailability() {
        const subagentDir = path.join(this.projectRoot, '.claude/agents');
        
        if (!fs.existsSync(subagentDir)) {
            return { available: false, reason: 'No .claude/agents directory found' };
        }
        
        const availableAgents = [];
        const missingAgents = [];
        
        for (const [name, info] of Object.entries(this.availableSubagents)) {
            const agentFile = path.join(subagentDir, `${name}.md`);
            if (fs.existsSync(agentFile)) {
                availableAgents.push(name);
            } else {
                missingAgents.push(name);
            }
        }
        
        return {
            available: availableAgents.length > 0,
            availableAgents,
            missingAgents,
            totalExpected: Object.keys(this.availableSubagents).length,
            availableCount: availableAgents.length
        };
    }
    
    /**
     * Recommend appropriate subagent for a given issue type
     */
    recommendSubagent(issueContext) {
        const recommendations = [];
        
        // Analyze issue context and recommend appropriate subagent
        if (issueContext.type === 'parsing' || issueContext.category === 'parser') {
            recommendations.push({
                subagent: 'parser-specialist',
                confidence: 0.9,
                reason: 'Issue involves parsing, AST generation, or preprocessor functionality'
            });
        }
        
        if (issueContext.type === 'execution' || issueContext.category === 'interpreter') {
            recommendations.push({
                subagent: 'interpreter-specialist',
                confidence: 0.9,
                reason: 'Issue involves code execution, hardware simulation, or library integration'
            });
        }
        
        if (issueContext.type === 'test_failure' || issueContext.category === 'testing') {
            recommendations.push({
                subagent: 'test-diagnostician',
                confidence: 0.8,
                reason: 'Issue involves test failures, regressions, or quality assessment'
            });
        }
        
        if (issueContext.type === 'architecture' || issueContext.scope === 'system_wide') {
            recommendations.push({
                subagent: 'architecture-reviewer',
                confidence: 0.7,
                reason: 'Issue involves architectural concerns or system-wide design'
            });
        }
        
        // Multiple component issues should involve test-diagnostician for triage
        if (issueContext.components && issueContext.components.length > 1) {
            recommendations.push({
                subagent: 'test-diagnostician',
                confidence: 0.6,
                reason: 'Multi-component issue requires diagnostic analysis and specialist delegation'
            });
        }
        
        // Sort by confidence and return best recommendations
        return recommendations
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 2); // Top 2 recommendations
    }
    
    /**
     * Prepare context for subagent invocation
     */
    prepareSubagentContext(subagentName, issueContext, additionalData = {}) {
        const subagentInfo = this.availableSubagents[subagentName];
        if (!subagentInfo) {
            throw new Error(`Unknown subagent: ${subagentName}`);
        }
        
        const context = {
            subagent: subagentName,
            timestamp: new Date().toISOString(),
            issueContext,
            additionalData,
            subagentInfo: {
                description: subagentInfo.description,
                specialties: subagentInfo.specialties,
                relevantFiles: subagentInfo.contextFiles
            },
            projectInfo: {
                root: this.projectRoot,
                versions: {
                    parser: "5.0.0",
                    interpreter: "6.3.0",
                    preprocessor: "1.2.0"
                }
            }
        };
        
        return context;
    }
    
    /**
     * Log subagent invocation (placeholder for actual API call)
     */
    async invokeSubagent(subagentName, context) {
        console.log(`🤖 Invoking Claude Code subagent: ${subagentName}`);
        console.log(`   Issue Type: ${context.issueContext.type || 'general'}`);
        console.log(`   Priority: ${context.issueContext.priority || 'MEDIUM'}`);
        console.log(`   Context Files: ${this.availableSubagents[subagentName].contextFiles.length} files`);
        
        // In a real implementation, this would make an API call to Claude Code
        // For now, we return a mock response with the prepared context
        return {
            invoked: true,
            subagent: subagentName,
            context,
            mockResponse: {
                message: `${subagentName} would analyze this issue and provide recommendations`,
                expectedActions: this.availableSubagents[subagentName].specialties.map(s => 
                    `Analyze ${s.replace('_', ' ')} aspects of the issue`
                ),
                estimatedTokens: this.estimateTokenUsage(subagentName, context)
            }
        };
    }
    
    /**
     * Estimate token usage for subagent invocation
     */
    estimateTokenUsage(subagentName, context) {
        const baseTokens = 500; // Base system prompt and context
        const contextFiles = this.availableSubagents[subagentName].contextFiles.length;
        const fileTokens = contextFiles * 200; // Approximate tokens per context file
        const issueTokens = JSON.stringify(context.issueContext).length; // Issue description
        
        return baseTokens + fileTokens + issueTokens;
    }
    
    /**
     * Utility method to format issue context
     */
    createIssueContext(type, details, priority = 'MEDIUM') {
        return {
            type,
            priority,
            timestamp: new Date().toISOString(),
            details,
            source: 'javascript_agent'
        };
    }
}

// Export for use by JavaScript agents
module.exports = { SubagentIntegration };

// Allow direct execution for testing
if (require.main === module) {
    const integration = new SubagentIntegration();
    
    console.log('\n📋 Subagent Integration Test');
    console.log('============================');
    
    // Test availability check
    const availability = integration.checkSubagentAvailability();
    console.log(`\n✅ Availability Check:`);
    console.log(`   Available: ${availability.available}`);
    console.log(`   Agents: ${availability.availableCount}/${availability.totalExpected}`);
    if (availability.availableAgents.length > 0) {
        console.log(`   Ready: ${availability.availableAgents.join(', ')}`);
    }
    if (availability.missingAgents.length > 0) {
        console.log(`   Missing: ${availability.missingAgents.join(', ')}`);
    }
    
    // Test recommendation system
    const testIssue = integration.createIssueContext('test_failure', {
        suite: 'interpreter_examples',
        failures: 3,
        regressions: 1
    }, 'HIGH');
    
    const recommendations = integration.recommendSubagent(testIssue);
    console.log(`\n🎯 Subagent Recommendations for test failure:`);
    recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec.subagent} (${(rec.confidence * 100).toFixed(0)}% confidence)`);
        console.log(`      Reason: ${rec.reason}`);
    });
    
    console.log(`\n✅ Integration helper ready for use by JavaScript agents`);
}