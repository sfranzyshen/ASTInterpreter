#!/usr/bin/env node

/**
 * Plan Manager Agent
 * 
 * Detailed planning and task breakdown for the Arduino Interpreter Project.
 * This agent works with the Project Manager to translate high-level goals
 * into actionable, TodoWrite-compatible task lists with proper sequencing.
 * 
 * Role: Strategic planning and task breakdown
 * Reports to: Project Manager Agent
 * Manages: Task Manager Agent (via task delegation)
 * Coordinates with: All specialized agents for task estimation
 * 
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class PlanManagerAgent {
    constructor() {
        this.version = "1.0.0";
        this.projectRoot = path.resolve(__dirname, '../..');
        this.agentName = "Plan Manager";
        
        // Task complexity estimation matrix
        this.complexityMatrix = {
            "SIMPLE": { estimatedTime: 30, effort: 1 },      // 30 minutes
            "MODERATE": { estimatedTime: 120, effort: 2 },    // 2 hours  
            "COMPLEX": { estimatedTime: 480, effort: 4 },     // 8 hours
            "ADVANCED": { estimatedTime: 960, effort: 8 }     // 16 hours
        };
        
        // Task categories and their typical patterns
        this.taskCategories = {
            "AGENT_IMPLEMENTATION": { 
                defaultComplexity: "COMPLEX",
                dependencies: ["ARCHITECTURE_DESIGN", "TESTING_SETUP"]
            },
            "TESTING": {
                defaultComplexity: "MODERATE", 
                dependencies: ["IMPLEMENTATION"]
            },
            "DOCUMENTATION": {
                defaultComplexity: "SIMPLE",
                dependencies: ["IMPLEMENTATION", "TESTING"]
            },
            "INTEGRATION": {
                defaultComplexity: "ADVANCED",
                dependencies: ["MULTIPLE_IMPLEMENTATIONS"]
            },
            "OPTIMIZATION": {
                defaultComplexity: "COMPLEX",
                dependencies: ["BASELINE_MEASUREMENT", "ANALYSIS"]
            }
        };
        
        console.log(`📋 ${this.agentName} Agent v${this.version} initialized`);
    }
    
    /**
     * Create TodoWrite-compatible task structure
     */
    createTodoTask(content, activeForm, status = "pending", metadata = {}) {
        return {
            content,
            status,
            activeForm,
            metadata: {
                estimatedTime: metadata.estimatedTime || null,
                complexity: metadata.complexity || null,
                category: metadata.category || null,
                dependencies: metadata.dependencies || [],
                assignedAgent: metadata.assignedAgent || null,
                createdBy: this.agentName,
                createdAt: new Date().toISOString(),
                ...metadata
            }
        };
    }
    
    /**
     * Break down a high-level objective into detailed tasks
     */
    breakdownObjective(objective, context = {}) {
        const tasks = [];
        
        switch (objective.toLowerCase()) {
            case "implement agent ecosystem":
                tasks.push(...this.createAgentEcosystemPlan());
                break;
                
            case "establish testing automation":
                tasks.push(...this.createTestAutomationPlan());
                break;
                
            case "implement documentation sync":
                tasks.push(...this.createDocumentationSyncPlan());
                break;
                
            case "optimize performance":
                tasks.push(...this.createPerformanceOptimizationPlan());
                break;
                
            case "move preprocessor to parser":
            case "relocate preprocessor functionality":
                tasks.push(...this.createPreprocessorRelocationPlan());
                break;
                
            default:
                // Generic task breakdown
                tasks.push(...this.createGenericPlan(objective, context));
        }
        
        return tasks;
    }
    
    /**
     * Create comprehensive agent ecosystem implementation plan
     */
    createAgentEcosystemPlan() {
        return [
            // Management Tier
            this.createTodoTask(
                "Implement Project Manager Agent core functionality",
                "Implementing Project Manager Agent core functionality",
                "completed", // Already done!
                { complexity: "COMPLEX", category: "AGENT_IMPLEMENTATION", assignedAgent: "Project Manager Agent" }
            ),
            this.createTodoTask(
                "Implement Plan Manager Agent core functionality", 
                "Implementing Plan Manager Agent core functionality",
                "in_progress", // Currently working on this
                { complexity: "COMPLEX", category: "AGENT_IMPLEMENTATION", assignedAgent: "Plan Manager Agent" }
            ),
            this.createTodoTask(
                "Implement Task Manager Agent with delegation framework",
                "Implementing Task Manager Agent with delegation framework", 
                "pending",
                { complexity: "ADVANCED", category: "AGENT_IMPLEMENTATION", assignedAgent: "Task Manager Agent" }
            ),
            
            // Core Worker Agents
            this.createTodoTask(
                "Implement Test Harness Agent with comprehensive test automation",
                "Implementing Test Harness Agent with comprehensive test automation",
                "pending",
                { complexity: "COMPLEX", category: "AGENT_IMPLEMENTATION", assignedAgent: "Test Harness Agent" }
            ),
            this.createTodoTask(
                "Implement Documentation Sync Agent with multi-file coordination",
                "Implementing Documentation Sync Agent with multi-file coordination", 
                "pending",
                { complexity: "COMPLEX", category: "AGENT_IMPLEMENTATION", assignedAgent: "Documentation Sync Agent" }
            ),
            this.createTodoTask(
                "Implement Version Management Agent with cross-file version control",
                "Implementing Version Management Agent with cross-file version control",
                "pending", 
                { complexity: "MODERATE", category: "AGENT_IMPLEMENTATION", assignedAgent: "Version Management Agent" }
            ),
            
            // Analysis Agents
            this.createTodoTask(
                "Implement Command Stream Analysis Agent with pattern detection",
                "Implementing Command Stream Analysis Agent with pattern detection",
                "pending",
                { complexity: "ADVANCED", category: "AGENT_IMPLEMENTATION", assignedAgent: "Command Stream Analysis Agent" }
            ),
            this.createTodoTask(
                "Implement Performance Monitoring Agent with metrics tracking",
                "Implementing Performance Monitoring Agent with metrics tracking", 
                "pending",
                { complexity: "COMPLEX", category: "AGENT_IMPLEMENTATION", assignedAgent: "Performance Monitoring Agent" }
            ),
            
            // Integration Tasks
            this.createTodoTask(
                "Establish inter-agent communication protocols",
                "Establishing inter-agent communication protocols",
                "pending",
                { complexity: "ADVANCED", category: "INTEGRATION", dependencies: ["Task Manager Agent"] }
            ),
            this.createTodoTask(
                "Test complete agent ecosystem integration",
                "Testing complete agent ecosystem integration",
                "pending",
                { complexity: "COMPLEX", category: "TESTING", dependencies: ["ALL_AGENTS"] }
            ),
            this.createTodoTask(
                "Document agent ecosystem architecture and usage",
                "Documenting agent ecosystem architecture and usage",
                "pending",
                { complexity: "MODERATE", category: "DOCUMENTATION", dependencies: ["INTEGRATION"] }
            )
        ];
    }
    
    /**
     * Create test automation implementation plan
     */
    createTestAutomationPlan() {
        return [
            this.createTodoTask(
                "Analyze existing test harnesses for integration patterns",
                "Analyzing existing test harnesses for integration patterns",
                "pending",
                { complexity: "MODERATE", category: "ANALYSIS" }
            ),
            this.createTodoTask(
                "Design automated test execution framework",
                "Designing automated test execution framework", 
                "pending",
                { complexity: "COMPLEX", category: "ARCHITECTURE_DESIGN" }
            ),
            this.createTodoTask(
                "Implement test result aggregation and reporting",
                "Implementing test result aggregation and reporting",
                "pending",
                { complexity: "COMPLEX", category: "IMPLEMENTATION" }
            ),
            this.createTodoTask(
                "Add regression detection and baseline comparison",
                "Adding regression detection and baseline comparison",
                "pending",
                { complexity: "ADVANCED", category: "IMPLEMENTATION" }
            ),
            this.createTodoTask(
                "Integrate with TodoWrite for test status tracking",
                "Integrating with TodoWrite for test status tracking",
                "pending", 
                { complexity: "MODERATE", category: "INTEGRATION" }
            )
        ];
    }
    
    /**
     * Create documentation synchronization plan
     */
    createDocumentationSyncPlan() {
        return [
            this.createTodoTask(
                "Map all documentation files and their interdependencies",
                "Mapping all documentation files and their interdependencies",
                "pending",
                { complexity: "MODERATE", category: "ANALYSIS" }
            ),
            this.createTodoTask(
                "Implement version number synchronization across files", 
                "Implementing version number synchronization across files",
                "pending",
                { complexity: "COMPLEX", category: "IMPLEMENTATION" }
            ),
            this.createTodoTask(
                "Create automatic changelog generation from code changes",
                "Creating automatic changelog generation from code changes",
                "pending",
                { complexity: "ADVANCED", category: "IMPLEMENTATION" }
            ),
            this.createTodoTask(
                "Add documentation validation and consistency checking",
                "Adding documentation validation and consistency checking",
                "pending",
                { complexity: "COMPLEX", category: "IMPLEMENTATION" }
            )
        ];
    }
    
    /**
     * Create preprocessor relocation plan (move from interpreter to parser)
     */
    createPreprocessorRelocationPlan() {
        return [
            this.createTodoTask(
                "Analyze current preprocessor integration points in interpreter",
                "Analyzing current preprocessor integration points in interpreter",
                "pending",
                { complexity: "MODERATE", category: "ANALYSIS", assignedAgent: "Command Stream Analysis Agent" }
            ),
            this.createTodoTask(
                "Design new parser-based preprocessor architecture",
                "Designing new parser-based preprocessor architecture",
                "pending",
                { complexity: "COMPLEX", category: "ARCHITECTURE_DESIGN", dependencies: ["ANALYSIS"] }
            ),
            this.createTodoTask(
                "Implement preprocessor integration in ArduinoParser.js",
                "Implementing preprocessor integration in ArduinoParser.js",
                "pending",
                { complexity: "COMPLEX", category: "IMPLEMENTATION", dependencies: ["ARCHITECTURE_DESIGN"] }
            ),
            this.createTodoTask(
                "Update ArduinoInterpreter.js to use parser preprocessing",
                "Updating ArduinoInterpreter.js to use parser preprocessing",
                "pending",
                { complexity: "COMPLEX", category: "IMPLEMENTATION", dependencies: ["PARSER_IMPLEMENTATION"] }
            ),
            this.createTodoTask(
                "Establish baseline test results before change",
                "Establishing baseline test results before change",
                "pending",
                { complexity: "MODERATE", category: "BASELINE_MEASUREMENT", assignedAgent: "Test Harness Agent" }
            ),
            this.createTodoTask(
                "Run comprehensive test suite validation (all 135 tests)",
                "Running comprehensive test suite validation (all 135 tests)",
                "pending",
                { complexity: "COMPLEX", category: "TESTING", dependencies: ["IMPLEMENTATION"], assignedAgent: "Test Harness Agent" }
            ),
            this.createTodoTask(
                "Validate performance impact and optimization",
                "Validating performance impact and optimization",
                "pending",
                { complexity: "MODERATE", category: "PERFORMANCE_VALIDATION", assignedAgent: "Performance Monitoring Agent" }
            ),
            this.createTodoTask(
                "Update documentation (CLAUDE.md, AI_TESTBED_GUIDE.md, README_FOR_AI.md)",
                "Updating documentation (CLAUDE.md, AI_TESTBED_GUIDE.md, README_FOR_AI.md)",
                "pending",
                { complexity: "MODERATE", category: "DOCUMENTATION", dependencies: ["TESTING"], assignedAgent: "Documentation Sync Agent" }
            ),
            this.createTodoTask(
                "Update version numbers across all files",
                "Updating version numbers across all files",
                "pending",
                { complexity: "SIMPLE", category: "VERSION_MANAGEMENT", dependencies: ["DOCUMENTATION"], assignedAgent: "Version Management Agent" }
            ),
            this.createTodoTask(
                "Generate final architecture change report",
                "Generating final architecture change report",
                "pending",
                { complexity: "SIMPLE", category: "REPORTING", dependencies: ["VERSION_MANAGEMENT"] }
            )
        ];
    }

    /**
     * Create performance optimization plan
     */
    createPerformanceOptimizationPlan() {
        return [
            this.createTodoTask(
                "Establish performance baseline measurements",
                "Establishing performance baseline measurements",
                "pending",
                { complexity: "MODERATE", category: "BASELINE_MEASUREMENT" }
            ),
            this.createTodoTask(
                "Implement execution time monitoring and profiling",
                "Implementing execution time monitoring and profiling",
                "pending",
                { complexity: "COMPLEX", category: "IMPLEMENTATION" }
            ),
            this.createTodoTask(
                "Analyze bottlenecks in interpreter execution",
                "Analyzing bottlenecks in interpreter execution", 
                "pending",
                { complexity: "ADVANCED", category: "ANALYSIS" }
            ),
            this.createTodoTask(
                "Optimize critical execution paths",
                "Optimizing critical execution paths",
                "pending",
                { complexity: "ADVANCED", category: "OPTIMIZATION" }
            )
        ];
    }
    
    /**
     * Create generic plan for unknown objectives
     */
    createGenericPlan(objective, context) {
        return [
            this.createTodoTask(
                `Analyze requirements for: ${objective}`,
                `Analyzing requirements for: ${objective}`,
                "pending",
                { complexity: "MODERATE", category: "ANALYSIS" }
            ),
            this.createTodoTask(
                `Design solution approach for: ${objective}`,
                `Designing solution approach for: ${objective}`,
                "pending", 
                { complexity: "COMPLEX", category: "DESIGN" }
            ),
            this.createTodoTask(
                `Implement solution for: ${objective}`,
                `Implementing solution for: ${objective}`,
                "pending",
                { complexity: "COMPLEX", category: "IMPLEMENTATION" }
            ),
            this.createTodoTask(
                `Test and validate: ${objective}`,
                `Testing and validating: ${objective}`,
                "pending",
                { complexity: "MODERATE", category: "TESTING" }
            )
        ];
    }
    
    /**
     * Sequence tasks based on dependencies
     */
    sequenceTasks(tasks) {
        // Simple dependency-based sequencing
        const sequenced = [...tasks];
        
        // Sort by complexity (simpler tasks first within dependency groups)
        sequenced.sort((a, b) => {
            const complexityOrder = { "SIMPLE": 1, "MODERATE": 2, "COMPLEX": 3, "ADVANCED": 4 };
            return (complexityOrder[a.metadata.complexity] || 2) - (complexityOrder[b.metadata.complexity] || 2);
        });
        
        return sequenced;
    }
    
    /**
     * Generate comprehensive project plan
     */
    generateProjectPlan(objectives = []) {
        console.log(`\n📋 ${this.agentName} Agent - Generating Project Plan`);
        console.log("===================================================");
        
        let allTasks = [];
        
        // If no objectives provided, use default agent ecosystem plan
        if (objectives.length === 0) {
            objectives = ["implement agent ecosystem"];
        }
        
        // Break down each objective
        objectives.forEach(objective => {
            console.log(`📝 Breaking down objective: ${objective}`);
            const tasks = this.breakdownObjective(objective);
            allTasks.push(...tasks);
        });
        
        // Sequence tasks properly
        const sequencedTasks = this.sequenceTasks(allTasks);
        
        // Calculate plan metrics
        const planMetrics = this.calculatePlanMetrics(sequencedTasks);
        
        const plan = {
            planManager: {
                agent: this.agentName,
                version: this.version,
                generatedAt: new Date().toISOString()
            },
            objectives,
            tasks: sequencedTasks,
            metrics: planMetrics,
            todoWriteFormat: sequencedTasks.map(task => ({
                content: task.content,
                status: task.status, 
                activeForm: task.activeForm
            }))
        };
        
        this.displayPlanSummary(plan);
        
        return plan;
    }
    
    /**
     * Calculate plan metrics
     */
    calculatePlanMetrics(tasks) {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === "completed").length;
        const inProgress = tasks.filter(t => t.status === "in_progress").length;
        const pending = tasks.filter(t => t.status === "pending").length;
        
        const complexityCounts = {};
        let totalEstimatedTime = 0;
        
        tasks.forEach(task => {
            const complexity = task.metadata.complexity || "MODERATE";
            complexityCounts[complexity] = (complexityCounts[complexity] || 0) + 1;
            totalEstimatedTime += this.complexityMatrix[complexity]?.estimatedTime || 120;
        });
        
        return {
            totalTasks: total,
            completed,
            inProgress,
            pending,
            completionPercentage: Math.round((completed / total) * 100),
            complexityBreakdown: complexityCounts,
            estimatedTotalTime: Math.round(totalEstimatedTime / 60), // Convert to hours
        };
    }
    
    /**
     * Display plan summary
     */
    displayPlanSummary(plan) {
        console.log(`\n📊 Plan Summary:`);
        console.log(`   📝 Total Tasks: ${plan.metrics.totalTasks}`);
        console.log(`   ✅ Completed: ${plan.metrics.completed}`);
        console.log(`   🔄 In Progress: ${plan.metrics.inProgress}`);
        console.log(`   ⏳ Pending: ${plan.metrics.pending}`);
        console.log(`   📈 Progress: ${plan.metrics.completionPercentage}%`);
        console.log(`   ⏱️  Estimated Time: ${plan.metrics.estimatedTotalTime} hours`);
        
        console.log(`\n🎯 Task Breakdown by Complexity:`);
        Object.entries(plan.metrics.complexityBreakdown).forEach(([complexity, count]) => {
            console.log(`   ${complexity}: ${count} tasks`);
        });
        
        console.log(`\n📋 Next 5 Pending Tasks:`);
        const nextTasks = plan.tasks.filter(t => t.status === "pending").slice(0, 5);
        nextTasks.forEach((task, i) => {
            console.log(`   ${i + 1}. ${task.content}`);
        });
    }
    
    /**
     * Main execution method
     */
    async execute(objectives = []) {
        const plan = this.generateProjectPlan(objectives);
        
        console.log(`\n✅ Project plan generated successfully`);
        console.log(`📤 Plan ready for Task Manager Agent delegation`);
        
        return plan;
    }
}

// Export for use by other agents and direct execution
module.exports = { PlanManagerAgent };

// Allow direct execution
if (require.main === module) {
    const agent = new PlanManagerAgent();
    agent.execute().then(plan => {
        console.log(`\n📋 Full plan generated - ${plan.tasks.length} tasks across ${plan.objectives.length} objectives`);
    }).catch(error => {
        console.error(`❌ ${agent.agentName} Agent failed:`, error.message);
        process.exit(1);
    });
}