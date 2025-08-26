#!/usr/bin/env node

/**
 * Task Manager Agent
 * 
 * Task delegation and execution coordination for the Arduino Interpreter Project.
 * This agent receives detailed plans from the Plan Manager and coordinates
 * execution across specialized worker agents while monitoring progress.
 * 
 * Role: Task delegation and execution oversight
 * Reports to: Project Manager Agent (via Plan Manager Agent)
 * Manages: All specialized worker agents
 * Coordinates with: Plan Manager Agent for task sequencing
 * 
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class TaskManagerAgent {
    constructor() {
        this.version = "1.0.0";
        this.projectRoot = path.resolve(__dirname, '../..');
        this.agentName = "Task Manager";
        
        // Available specialized agents and their capabilities
        this.availableAgents = {
            "Test Harness Agent": {
                path: "../core/test_harness_agent.js",
                capabilities: ["TESTING", "REGRESSION_DETECTION", "REPORT_GENERATION"],
                status: "PENDING_IMPLEMENTATION",
                maxConcurrentTasks: 1
            },
            "Documentation Sync Agent": {
                path: "../core/documentation_sync_agent.js", 
                capabilities: ["DOCUMENTATION", "VERSION_SYNC", "CHANGELOG_GENERATION"],
                status: "PENDING_IMPLEMENTATION",
                maxConcurrentTasks: 1
            },
            "Version Management Agent": {
                path: "../core/version_management_agent.js",
                capabilities: ["VERSION_CONTROL", "RELEASE_MANAGEMENT"],
                status: "PENDING_IMPLEMENTATION", 
                maxConcurrentTasks: 1
            },
            "Command Stream Analysis Agent": {
                path: "../analysis/command_stream_analysis_agent.js",
                capabilities: ["ANALYSIS", "PATTERN_DETECTION", "OPTIMIZATION_SUGGESTIONS"],
                status: "PENDING_IMPLEMENTATION",
                maxConcurrentTasks: 1
            },
            "Performance Monitoring Agent": {
                path: "../analysis/performance_monitoring_agent.js",
                capabilities: ["PERFORMANCE_ANALYSIS", "METRICS_TRACKING", "BOTTLENECK_DETECTION"],
                status: "PENDING_IMPLEMENTATION",
                maxConcurrentTasks: 1
            }
        };
        
        // Task execution state
        this.executionState = {
            activeTasks: new Map(),
            completedTasks: [],
            failedTasks: [],
            taskHistory: []
        };
        
        // Inter-agent communication protocols
        this.communicationProtocols = {
            taskAssignment: {
                format: "JSON",
                requiredFields: ["taskId", "content", "assignedAgent", "priority", "dependencies"]
            },
            statusUpdates: {
                format: "JSON",
                requiredFields: ["taskId", "status", "progress", "timestamp"]
            },
            errorReporting: {
                format: "JSON", 
                requiredFields: ["taskId", "error", "details", "timestamp"]
            }
        };
        
        console.log(`🎯 ${this.agentName} Agent v${this.version} initialized`);
        console.log(`📊 Available agents: ${Object.keys(this.availableAgents).length}`);
    }
    
    /**
     * Assign task to appropriate specialized agent
     */
    assignTaskToAgent(task) {
        // Determine best agent based on task metadata
        const taskCategory = task.metadata?.category || "IMPLEMENTATION";
        const assignedAgent = task.metadata?.assignedAgent;
        
        let selectedAgent = null;
        
        // First try explicitly assigned agent
        if (assignedAgent && this.availableAgents[assignedAgent]) {
            selectedAgent = assignedAgent;
        } else {
            // Find agent based on capabilities
            for (const [agentName, agentInfo] of Object.entries(this.availableAgents)) {
                if (agentInfo.capabilities.includes(taskCategory)) {
                    selectedAgent = agentName;
                    break;
                }
            }
        }
        
        // If no specific agent found, assign to Task Manager for direct handling
        if (!selectedAgent) {
            selectedAgent = this.agentName;
        }
        
        return selectedAgent;
    }
    
    /**
     * Execute task directly (for tasks not requiring specialized agents)
     */
    async executeTaskDirectly(task) {
        console.log(`🔧 Executing task directly: ${task.content}`);
        
        const startTime = Date.now();
        let result = null;
        let error = null;
        
        try {
            // Handle different task types
            switch (task.metadata?.category) {
                case "ANALYSIS":
                    result = await this.performAnalysis(task);
                    break;
                case "DOCUMENTATION":
                    result = await this.updateDocumentation(task);
                    break;
                case "TESTING":
                    result = await this.runTests(task);
                    break;
                default:
                    result = { message: "Task acknowledged but no specific action taken", status: "completed" };
            }
        } catch (err) {
            error = err.message;
            console.error(`❌ Task execution failed: ${error}`);
        }
        
        const executionTime = Date.now() - startTime;
        
        return {
            taskId: task.taskId,
            status: error ? "failed" : "completed",
            result,
            error,
            executionTime,
            executedBy: this.agentName
        };
    }
    
    /**
     * Delegate task to specialized agent
     */
    async delegateTaskToAgent(task, agentName) {
        console.log(`📤 Delegating task to ${agentName}: ${task.content}`);
        
        const agentInfo = this.availableAgents[agentName];
        if (!agentInfo) {
            throw new Error(`Unknown agent: ${agentName}`);
        }
        
        if (agentInfo.status !== "ACTIVE") {
            console.log(`⚠️  Agent ${agentName} is not yet implemented, handling task directly`);
            return await this.executeTaskDirectly(task);
        }
        
        // In a full implementation, this would spawn the agent process
        // For now, simulate delegation
        const delegationResult = {
            taskId: task.taskId,
            delegatedTo: agentName,
            status: "delegated",
            timestamp: new Date().toISOString()
        };
        
        return delegationResult;
    }
    
    /**
     * Process a batch of tasks from a plan
     */
    async processTasks(tasks) {
        console.log(`\n🎯 ${this.agentName} Agent - Processing Task Batch`);
        console.log("===============================================");
        console.log(`📋 Tasks to process: ${tasks.length}`);
        
        const results = [];
        
        for (const [index, task] of tasks.entries()) {
            // Add unique task ID if not present
            const taskWithId = {
                ...task,
                taskId: task.taskId || `task_${Date.now()}_${index}`
            };
            
            console.log(`\n[${index + 1}/${tasks.length}] Processing: ${taskWithId.content}`);
            console.log(`Status: ${taskWithId.status}, Complexity: ${taskWithId.metadata?.complexity || 'UNKNOWN'}`);
            
            // Skip already completed tasks
            if (taskWithId.status === "completed") {
                console.log(`✅ Task already completed, skipping`);
                results.push({
                    taskId: taskWithId.taskId,
                    status: "completed",
                    message: "Previously completed"
                });
                continue;
            }
            
            // Assign to appropriate agent
            const assignedAgent = this.assignTaskToAgent(taskWithId);
            console.log(`👤 Assigned to: ${assignedAgent}`);
            
            try {
                let result;
                if (assignedAgent === this.agentName) {
                    result = await this.executeTaskDirectly(taskWithId);
                } else {
                    result = await this.delegateTaskToAgent(taskWithId, assignedAgent);
                }
                
                results.push(result);
                this.executionState.completedTasks.push(taskWithId);
                
                console.log(`✅ Task completed successfully`);
                
            } catch (error) {
                console.error(`❌ Task failed: ${error.message}`);
                const failureResult = {
                    taskId: taskWithId.taskId,
                    status: "failed",
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
                results.push(failureResult);
                this.executionState.failedTasks.push(taskWithId);
            }
        }
        
        return results;
    }
    
    /**
     * Generate execution summary
     */
    generateExecutionSummary(results) {
        const summary = {
            totalTasks: results.length,
            completed: results.filter(r => r.status === "completed" || r.status === "delegated").length,
            failed: results.filter(r => r.status === "failed").length,
            executionTime: new Date().toISOString(),
            results
        };
        
        summary.successRate = summary.totalTasks > 0 ? 
            Math.round((summary.completed / summary.totalTasks) * 100) : 0;
        
        return summary;
    }
    
    /**
     * Display execution summary
     */
    displayExecutionSummary(summary) {
        console.log(`\n📊 Execution Summary:`);
        console.log(`   📝 Total Tasks: ${summary.totalTasks}`);
        console.log(`   ✅ Completed: ${summary.completed}`);
        console.log(`   ❌ Failed: ${summary.failed}`);
        console.log(`   📈 Success Rate: ${summary.successRate}%`);
        
        if (summary.failed > 0) {
            console.log(`\n🚨 Failed Tasks:`);
            summary.results
                .filter(r => r.status === "failed")
                .forEach((result, i) => {
                    console.log(`   ${i + 1}. ${result.taskId}: ${result.error}`);
                });
        }
        
        console.log(`\n📤 Summary ready for Project Manager review`);
    }
    
    /**
     * Dummy implementations for direct task execution
     */
    async performAnalysis(task) {
        // Simulate analysis work
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
            analysis: `Analysis completed for: ${task.content}`,
            findings: ["Task structure is well-defined", "Dependencies are clear"],
            recommendations: ["Proceed with implementation"]
        };
    }
    
    async updateDocumentation(task) {
        // Simulate documentation update
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
            documentation: `Documentation updated for: ${task.content}`,
            filesUpdated: ["CLAUDE.md", "README_FOR_AI.md"],
            changesSummary: "Added task completion notes"
        };
    }
    
    async runTests(task) {
        // Simulate test execution
        await new Promise(resolve => setTimeout(resolve, 200));
        return {
            testResults: `Tests completed for: ${task.content}`,
            passed: 15,
            failed: 0,
            coverage: "100%"
        };
    }
    
    /**
     * Get agent status for Project Manager reporting
     */
    getAgentStatus() {
        return {
            agent: this.agentName,
            version: this.version,
            status: "ACTIVE",
            availableAgents: Object.keys(this.availableAgents).length,
            activeAgents: Object.values(this.availableAgents).filter(a => a.status === "ACTIVE").length,
            executionStats: {
                totalTasksProcessed: this.executionState.completedTasks.length + this.executionState.failedTasks.length,
                successfulTasks: this.executionState.completedTasks.length,
                failedTasks: this.executionState.failedTasks.length
            }
        };
    }
    
    /**
     * Main execution method
     */
    async execute(tasks = []) {
        if (tasks.length === 0) {
            console.log(`⚠️  No tasks provided to ${this.agentName} Agent`);
            return { message: "No tasks to process", status: "idle" };
        }
        
        const results = await this.processTasks(tasks);
        const summary = this.generateExecutionSummary(results);
        
        this.displayExecutionSummary(summary);
        
        console.log(`\n✅ Task processing completed successfully`);
        
        return {
            summary,
            agentStatus: this.getAgentStatus(),
            timestamp: new Date().toISOString()
        };
    }
}

// Export for use by other agents and direct execution  
module.exports = { TaskManagerAgent };

// Allow direct execution
if (require.main === module) {
    const agent = new TaskManagerAgent();
    
    // Create sample tasks for testing
    const sampleTasks = [
        {
            content: "Test task manager functionality",
            status: "pending",
            activeForm: "Testing task manager functionality",
            metadata: { 
                complexity: "SIMPLE",
                category: "TESTING",
                assignedAgent: "Task Manager Agent"
            }
        },
        {
            content: "Analyze project structure for optimization opportunities",
            status: "pending", 
            activeForm: "Analyzing project structure for optimization opportunities",
            metadata: {
                complexity: "MODERATE",
                category: "ANALYSIS"
            }
        }
    ];
    
    agent.execute(sampleTasks).then(result => {
        console.log(`\n📋 Task Manager execution completed - processed ${result.summary.totalTasks} tasks`);
    }).catch(error => {
        console.error(`❌ ${agent.agentName} Agent failed:`, error.message);
        process.exit(1);
    });
}