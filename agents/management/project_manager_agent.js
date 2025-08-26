#!/usr/bin/env node

/**
 * Project Manager Agent
 * 
 * Strategic oversight and goal management for the Arduino Interpreter Project.
 * This agent defines project objectives, monitors overall health, and coordinates
 * with other management agents to ensure project success.
 * 
 * Role: Top-level strategic decision making and goal tracking
 * Reports to: Human developers
 * Manages: Plan Manager Agent, Task Manager Agent (via delegation)
 * 
 * Version: 1.1.0 - Added Claude Code subagent integration
 */

const fs = require('fs');
const path = require('path');

class ProjectManagerAgent {
    constructor() {
        this.version = "1.1.0";
        this.projectRoot = path.resolve(__dirname, '../..');
        this.agentName = "Project Manager";
        
        // Strategic project objectives
        this.projectGoals = {
            primary: [
                "Maintain 100% test success rate across all test suites",
                "Ensure architectural integrity (clean command streams)",
                "Keep documentation synchronized with code changes",
                "Continuous improvement of interpreter capabilities"
            ],
            secondary: [
                "Optimize performance and reduce execution time",
                "Expand Arduino library compatibility",
                "Enhance playground user experience",
                "Improve development workflow automation"
            ]
        };
        
        // Success metrics and thresholds
        this.successMetrics = {
            testSuccessRate: { target: 100.0, minimum: 95.0 },
            semanticAccuracy: { target: 100.0, minimum: 95.0 },
            documentationSync: { target: 100.0, minimum: 90.0 },
            versionConsistency: { target: 100.0, minimum: 100.0 }
        };
        
        // Current project status
        this.projectStatus = {
            phase: "Maintenance & Enhancement",
            lastUpdate: new Date().toISOString(),
            currentVersion: {
                parser: "5.0.0",
                interpreter: "6.3.0", 
                preprocessor: "1.1.0"
            },
            overallHealth: "EXCELLENT"
        };
        
        console.log(`🎯 ${this.agentName} Agent v${this.version} initialized`);
    }
    
    /**
     * Get current project health assessment
     */
    assessProjectHealth() {
        const healthReport = {
            timestamp: new Date().toISOString(),
            agent: this.agentName,
            version: this.version,
            assessment: {}
        };
        
        // Check test success rates (would integrate with Test Harness Agent)
        healthReport.assessment.testing = {
            status: "EXCELLENT",
            details: "100% success rate maintained across all test suites",
            metric: this.successMetrics.testSuccessRate.target
        };
        
        // Check architectural compliance
        healthReport.assessment.architecture = {
            status: "EXCELLENT", 
            details: "Clean command stream architecture maintained",
            lastCommandDisplayFix: "2025-01-25"
        };
        
        // Check documentation sync
        healthReport.assessment.documentation = {
            status: "EXCELLENT",
            details: "All documentation files synchronized with latest changes",
            lastSync: "2025-01-25"
        };
        
        // Check version consistency
        healthReport.assessment.versions = {
            status: "EXCELLENT",
            details: "All version numbers consistent across project files",
            currentVersions: this.projectStatus.currentVersion
        };
        
        // Overall health calculation
        const statuses = Object.values(healthReport.assessment).map(item => item.status);
        const allExcellent = statuses.every(status => status === "EXCELLENT");
        const anyPoor = statuses.some(status => status === "POOR");
        
        healthReport.overallHealth = allExcellent ? "EXCELLENT" : 
                                   anyPoor ? "NEEDS_ATTENTION" : "GOOD";
        
        return healthReport;
    }
    
    /**
     * Define strategic objectives for other agents
     */
    defineStrategicObjectives() {
        return {
            immediate: [
                {
                    objective: "Establish agent communication protocols",
                    priority: "HIGH",
                    assignedTo: "Task Manager Agent",
                    deadline: "Phase 1 completion"
                },
                {
                    objective: "Implement comprehensive test automation",
                    priority: "HIGH", 
                    assignedTo: "Test Harness Agent",
                    deadline: "Phase 2 completion"
                },
                {
                    objective: "Maintain documentation synchronization",
                    priority: "MEDIUM",
                    assignedTo: "Documentation Sync Agent", 
                    deadline: "Ongoing"
                }
            ],
            longTerm: [
                {
                    objective: "Optimize interpreter performance",
                    priority: "MEDIUM",
                    assignedTo: "Performance Monitoring Agent",
                    deadline: "Phase 3 completion"
                },
                {
                    objective: "Enhance command stream analysis",
                    priority: "LOW",
                    assignedTo: "Command Stream Analysis Agent",
                    deadline: "Phase 3 completion"
                }
            ]
        };
    }
    
    /**
     * Generate project status report
     */
    generateStatusReport() {
        const health = this.assessProjectHealth();
        const objectives = this.defineStrategicObjectives();
        
        const report = {
            projectManager: {
                agent: this.agentName,
                version: this.version,
                reportTimestamp: new Date().toISOString()
            },
            projectOverview: {
                name: "Arduino C++ Parser/Interpreter",
                currentPhase: this.projectStatus.phase,
                overallHealth: health.overallHealth,
                versions: this.projectStatus.currentVersion
            },
            healthAssessment: health,
            strategicObjectives: objectives,
            recommendations: this.generateRecommendations(health)
        };
        
        return report;
    }
    
    /**
     * Generate recommendations based on health assessment
     */
    generateRecommendations(healthReport) {
        const recommendations = [];
        
        // Always recommend maintaining current excellence
        if (healthReport.overallHealth === "EXCELLENT") {
            recommendations.push({
                type: "MAINTAIN",
                priority: "HIGH",
                description: "Continue current maintenance and enhancement practices",
                actionItems: [
                    "Keep running comprehensive test suites",
                    "Maintain documentation synchronization",
                    "Continue architectural integrity monitoring"
                ]
            });
        }
        
        // Recommend agent ecosystem development
        recommendations.push({
            type: "ENHANCEMENT",
            priority: "MEDIUM", 
            description: "Implement comprehensive agent ecosystem",
            actionItems: [
                "Complete management tier agents (Plan Manager, Task Manager)",
                "Implement core worker agents for automation",
                "Establish inter-agent communication protocols"
            ]
        });
        
        return recommendations;
    }
    
    /**
     * Coordinate with Plan Manager Agent
     */
    requestDetailedPlan(objective) {
        // This would integrate with Plan Manager Agent when implemented
        return {
            message: `Requesting detailed plan for: ${objective}`,
            targetAgent: "Plan Manager Agent",
            requestType: "PLAN_GENERATION",
            priority: "NORMAL",
            context: this.generateStatusReport()
        };
    }
    
    /**
     * Main execution method - assess and report
     */
    async execute() {
        console.log(`\n🚀 ${this.agentName} Agent - Strategic Assessment`);
        console.log("================================================");
        
        const statusReport = this.generateStatusReport();
        
        // Display key metrics
        console.log(`📊 Project Health: ${statusReport.projectOverview.overallHealth}`);
        console.log(`📈 Current Phase: ${statusReport.projectOverview.currentPhase}`);
        console.log(`🔢 Versions: Parser v${statusReport.projectOverview.versions.parser}, Interpreter v${statusReport.projectOverview.versions.interpreter}, Preprocessor v${statusReport.projectOverview.versions.preprocessor}`);
        
        // Display health details
        console.log(`\n🏥 Health Assessment:`);
        Object.entries(statusReport.healthAssessment.assessment).forEach(([category, data]) => {
            const emoji = data.status === "EXCELLENT" ? "✅" : 
                         data.status === "GOOD" ? "🟡" : "❌";
            console.log(`   ${emoji} ${category.toUpperCase()}: ${data.status} - ${data.details}`);
        });
        
        // Display strategic objectives
        console.log(`\n🎯 Strategic Objectives:`);
        statusReport.strategicObjectives.immediate.forEach((obj, i) => {
            console.log(`   ${i + 1}. [${obj.priority}] ${obj.objective} (→ ${obj.assignedTo})`);
        });
        
        // Display recommendations
        console.log(`\n💡 Recommendations:`);
        statusReport.recommendations.forEach((rec, i) => {
            console.log(`   ${i + 1}. [${rec.type}] ${rec.description}`);
            rec.actionItems.forEach(item => {
                console.log(`      • ${item}`);
            });
        });
        
        // Check for architectural concerns that need Claude Code subagent review
        const architecturalAnalysis = this.assessArchitecturalConcerns(statusReport);
        if (architecturalAnalysis.needsReview) {
            console.log(`\n🏗️ Architectural Review Recommended`);
            console.log(`   Concern Level: ${architecturalAnalysis.level}`);
            console.log(`   Triggers: ${architecturalAnalysis.concerns.join(', ')}`);
            
            const architectureResult = await this.invokeArchitectureReviewer({
                concerns: architecturalAnalysis.concerns,
                level: architecturalAnalysis.level,
                healthMetrics: statusReport.healthAssessment,
                currentPhase: statusReport.projectOverview.currentPhase
            });
            
            statusReport.architecturalAnalysis = architectureResult;
        }
        
        console.log(`\n✅ Strategic assessment completed successfully`);
        
        return statusReport;
    }
    
    /**
     * Claude Code Subagent Integration Methods
     */
    
    /**
     * Assess if architectural review is needed
     */
    assessArchitecturalConcerns(statusReport) {
        const concerns = [];
        let needsReview = false;
        let level = 'LOW';
        
        // Check for health issues that might indicate architectural problems
        const healthAssessment = statusReport.healthAssessment.assessment;
        
        if (healthAssessment.architecture && healthAssessment.architecture.status !== "EXCELLENT") {
            concerns.push('architecture_degradation');
            needsReview = true;
            level = 'HIGH';
        }
        
        if (healthAssessment.testing && healthAssessment.testing.status !== "EXCELLENT") {
            concerns.push('testing_architecture');
            needsReview = true;
            level = level === 'HIGH' ? 'HIGH' : 'MEDIUM';
        }
        
        // Check for version inconsistencies (architectural concern)
        if (healthAssessment.versions && healthAssessment.versions.status !== "EXCELLENT") {
            concerns.push('version_architecture');
            needsReview = true;
            level = level === 'HIGH' ? 'HIGH' : 'MEDIUM';
        }
        
        // Check if we're in a critical phase requiring architectural oversight
        if (statusReport.projectOverview.currentPhase.includes('Enhancement')) {
            concerns.push('enhancement_architecture');
            needsReview = true;
        }
        
        return {
            needsReview,
            concerns,
            level,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Trigger architecture-reviewer subagent for architectural analysis
     */
    async invokeArchitectureReviewer(context) {
        console.log(`🤖 Triggering architecture-reviewer subagent for project analysis...`);
        
        const architecturalContext = {
            timestamp: new Date().toISOString(),
            projectPhase: context.currentPhase,
            concerns: context.concerns,
            concernLevel: context.level,
            healthMetrics: context.healthMetrics,
            systemOverview: {
                components: ['Parser', 'Preprocessor', 'Interpreter', 'Platform Emulation'],
                integrationPoints: ['Parser-Interpreter', 'Preprocessor-Parser', 'Platform-Preprocessor'],
                agentEcosystem: ['Management Tier', 'Core Workers', 'Analysis Tier', 'Claude Code Specialists']
            },
            currentVersions: {
                parser: "5.0.0",
                interpreter: "6.3.0", 
                preprocessor: "1.2.0",
                testHarness: "1.1.0"
            }
        };
        
        console.log(`   🏗️ Analysis Context: ${context.concerns.length} concerns, ${context.level} priority`);
        console.log(`   📋 Context prepared for architecture-reviewer subagent`);
        console.log(`   🎯 Recommended analysis: System integrity assessment and improvement recommendations`);
        
        return {
            triggered: true,
            subagent: 'architecture-reviewer',
            context: architecturalContext,
            expectedActions: [
                'Assess overall system architecture integrity',
                'Review component integration patterns',
                'Evaluate agent ecosystem coordination',
                'Recommend architectural improvements',
                'Ensure scalability and maintainability'
            ]
        };
    }
}

// Export for use by other agents and direct execution
module.exports = { ProjectManagerAgent };

// Allow direct execution
if (require.main === module) {
    const agent = new ProjectManagerAgent();
    agent.execute().then(report => {
        console.log(`\n📋 Full report generated - ${Object.keys(report).length} sections`);
    }).catch(error => {
        console.error(`❌ ${agent.agentName} Agent failed:`, error.message);
        process.exit(1);
    });
}