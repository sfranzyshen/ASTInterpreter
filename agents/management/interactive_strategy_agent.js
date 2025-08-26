#!/usr/bin/env node

/**
 * Interactive Strategic Planning Agent
 * 
 * Provides a conversational, dynamic strategic planning experience for the 
 * Arduino Interpreter Project. This agent guides users through strategic 
 * decision-making, goal setting, and plan creation with real-time feedback
 * and customization.
 * 
 * Role: Interactive strategic planning and decision support
 * Reports to: Human users (direct interaction)
 * Integrates with: Project Manager Agent, Plan Manager Agent, all specialized agents
 * 
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Import existing agents
const { ProjectManagerAgent } = require('./project_manager_agent.js');
const { PlanManagerAgent } = require('./plan_manager_agent.js');
const { TaskManagerAgent } = require('./task_manager_agent.js');

class InteractiveStrategyAgent {
    constructor() {
        this.version = "1.0.0";
        this.projectRoot = path.resolve(__dirname, '../..');
        this.agentName = "Interactive Strategy";
        
        // Initialize readline interface for user interaction
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        // Strategic options and their details
        this.strategicOptions = {
            "performance_optimization": {
                name: "Performance Optimization",
                description: "Focus on improving interpreter execution speed and memory efficiency",
                effort: "High",
                timeline: "4-6 weeks",
                benefits: ["Faster test execution", "Reduced memory usage", "Better scalability"],
                agents: ["Performance Monitoring Agent", "Command Stream Analysis Agent"]
            },
            "feature_expansion": {
                name: "Feature Expansion", 
                description: "Add new Arduino language features and library support",
                effort: "High",
                timeline: "6-8 weeks",
                benefits: ["Broader Arduino compatibility", "More comprehensive testing", "Enhanced functionality"],
                agents: ["Test Harness Agent", "Documentation Sync Agent"]
            },
            "quality_assurance": {
                name: "Quality Assurance Enhancement",
                description: "Strengthen testing, validation, and quality monitoring systems",
                effort: "Medium",
                timeline: "2-4 weeks", 
                benefits: ["Higher reliability", "Better error detection", "Automated quality gates"],
                agents: ["Test Harness Agent", "Documentation Sync Agent", "Version Management Agent"]
            },
            "architecture_refinement": {
                name: "Architecture Refinement",
                description: "Improve code structure, modularity, and maintainability",
                effort: "Medium",
                timeline: "3-5 weeks",
                benefits: ["Cleaner codebase", "Easier maintenance", "Better extensibility"],
                agents: ["Command Stream Analysis Agent", "Documentation Sync Agent"]
            },
            "automation_expansion": {
                name: "Automation Expansion",
                description: "Extend agent capabilities and autonomous project management",
                effort: "Medium",
                timeline: "2-3 weeks",
                benefits: ["Reduced manual work", "Improved consistency", "Proactive maintenance"],
                agents: ["Task Manager Agent", "All specialized agents"]
            },
            "release_preparation": {
                name: "Release Preparation",
                description: "Prepare for production release with packaging and distribution",
                effort: "Low",
                timeline: "1-2 weeks",
                benefits: ["Production-ready system", "Distribution packages", "Release documentation"],
                agents: ["Version Management Agent", "Documentation Sync Agent", "Test Harness Agent"]
            }
        };
        
        // Session data
        this.sessionData = {
            userGoals: [],
            selectedOptions: [],
            customObjectives: [],
            finalStrategy: null,
            sessionId: Date.now().toString()
        };
        
        console.log(`🎯 ${this.agentName} Agent v${this.version} initialized`);
    }
    
    /**
     * Prompt user for input with validation
     */
    async promptUser(question, validator = null) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                if (validator && !validator(answer)) {
                    console.log("❌ Invalid input. Please try again.");
                    resolve(this.promptUser(question, validator));
                } else {
                    resolve(answer.trim());
                }
            });
        });
    }
    
    /**
     * Display welcome and introduction
     */
    async displayWelcome() {
        console.log('\n🌟 Welcome to Interactive Strategic Planning!');
        console.log('============================================');
        console.log('This session will help you create a comprehensive strategy for your Arduino Interpreter Project.');
        console.log('We\'ll assess your current situation, understand your goals, and create an actionable plan.\n');
        
        const proceed = await this.promptUser('Ready to begin strategic planning? (yes/no): ', 
            (answer) => ['yes', 'y', 'no', 'n'].includes(answer.toLowerCase()));
        
        if (!['yes', 'y'].includes(proceed.toLowerCase())) {
            console.log('👋 Strategic planning session cancelled. Feel free to return when ready!');
            return false;
        }
        
        return true;
    }
    
    /**
     * Present current project assessment
     */
    async presentProjectAssessment() {
        console.log('\n📊 STEP 1: Current Project Assessment');
        console.log('=====================================');
        console.log('Let me analyze your current project status...\n');
        
        // Get assessment from Project Manager
        const projectManager = new ProjectManagerAgent();
        const assessment = await projectManager.execute();
        
        console.log('🔍 Current Project Health Analysis:');
        console.log(`   Overall Status: ${assessment.projectOverview.overallHealth}`);
        console.log(`   Current Phase: ${assessment.projectOverview.currentPhase}`);
        console.log(`   Versions: Parser v${assessment.projectOverview.versions.parser}, Interpreter v${assessment.projectOverview.versions.interpreter}, Preprocessor v${assessment.projectOverview.versions.preprocessor}`);
        
        console.log('\n📋 Key Findings:');
        Object.entries(assessment.healthAssessment.assessment).forEach(([area, data], i) => {
            const emoji = data.status === "EXCELLENT" ? "🌟" : data.status === "GOOD" ? "✅" : "⚠️";
            console.log(`   ${i + 1}. ${emoji} ${area.toUpperCase()}: ${data.status} - ${data.details}`);
        });
        
        if (assessment.recommendations && assessment.recommendations.length > 0) {
            console.log('\n💡 Current Recommendations:');
            assessment.recommendations.forEach((rec, i) => {
                console.log(`   ${i + 1}. [${rec.type}] ${rec.description}`);
            });
        }
        
        console.log('\nPress Enter to continue to goal setting...');
        await this.promptUser('');
        
        return assessment;
    }
    
    /**
     * Elicit user goals and vision
     */
    async elicitUserGoals() {
        console.log('\n🎯 STEP 2: Strategic Goal Definition');
        console.log('====================================');
        
        console.log('Now let\'s understand your strategic vision and goals.\n');
        
        // Primary strategic focus
        console.log('What is your primary strategic focus? Choose one:');
        console.log('1. 🚀 Growth & Expansion (adding features, capabilities)');
        console.log('2. ⚡ Performance & Optimization (speed, efficiency)');
        console.log('3. 🛡️ Quality & Reliability (testing, stability)'); 
        console.log('4. 🔧 Maintenance & Refinement (code quality, structure)');
        console.log('5. 🎯 Custom Focus (tell me your specific goals)');
        
        const focusChoice = await this.promptUser('\nEnter your choice (1-5): ',
            (answer) => ['1', '2', '3', '4', '5'].includes(answer.trim()));
        
        const focusMap = {
            '1': 'growth_expansion',
            '2': 'performance_optimization', 
            '3': 'quality_reliability',
            '4': 'maintenance_refinement',
            '5': 'custom_focus'
        };
        
        this.sessionData.primaryFocus = focusMap[focusChoice];
        
        // Timeline preference
        const timeline = await this.promptUser('\n⏰ What\'s your preferred timeline for strategic initiatives?\n' +
            '1. Short-term (1-4 weeks)\n' +
            '2. Medium-term (1-3 months)\n' + 
            '3. Long-term (3+ months)\n' +
            'Enter choice (1-3): ',
            (answer) => ['1', '2', '3'].includes(answer.trim()));
        
        const timelineMap = {
            '1': 'short_term',
            '2': 'medium_term', 
            '3': 'long_term'
        };
        
        this.sessionData.preferredTimeline = timelineMap[timeline];
        
        // Specific goals
        if (focusChoice === '5') {
            const customGoals = await this.promptUser('\n📝 Please describe your specific strategic goals: ');
            this.sessionData.customObjectives.push(customGoals);
        }
        
        // Additional priorities
        const additionalGoals = await this.promptUser('\n🎯 Any additional strategic priorities? (optional, press Enter to skip): ');
        if (additionalGoals) {
            this.sessionData.customObjectives.push(additionalGoals);
        }
        
        return this.sessionData;
    }
    
    /**
     * Present strategic options based on user goals
     */
    async presentStrategicOptions() {
        console.log('\n🗺️ STEP 3: Strategic Options Analysis');
        console.log('=====================================');
        
        console.log('Based on your goals, here are strategic options tailored for you:\n');
        
        // Filter options based on user focus and timeline
        const relevantOptions = this.filterOptionsForUser();
        
        console.log('📊 Recommended Strategic Options:');
        relevantOptions.forEach((option, i) => {
            const opt = this.strategicOptions[option.key];
            console.log(`\n${i + 1}. 🎯 ${opt.name}`);
            console.log(`   📋 ${opt.description}`);
            console.log(`   ⚡ Effort: ${opt.effort} | ⏱️ Timeline: ${opt.timeline}`);
            console.log(`   ✨ Benefits: ${opt.benefits.join(', ')}`);
            console.log(`   🤖 Agents Involved: ${opt.agents.join(', ')}`);
            console.log(`   📈 Fit Score: ${option.score}/10`);
        });
        
        // Multi-select options
        console.log('\n🎯 Selection Options:');
        console.log('A. Select specific options by number (e.g., 1,3,5)');
        console.log('B. Select all recommended options');
        console.log('C. Let me choose the best combination for you');
        
        const selectionType = await this.promptUser('\nHow would you like to proceed? (A/B/C): ',
            (answer) => ['a', 'b', 'c'].includes(answer.toLowerCase()));
        
        let selectedOptions = [];
        
        switch (selectionType.toLowerCase()) {
            case 'a':
                const choices = await this.promptUser('Enter option numbers separated by commas (e.g., 1,3): ');
                const numbers = choices.split(',').map(n => parseInt(n.trim()) - 1);
                selectedOptions = numbers.filter(n => n >= 0 && n < relevantOptions.length)
                    .map(n => relevantOptions[n].key);
                break;
                
            case 'b':
                selectedOptions = relevantOptions.map(opt => opt.key);
                break;
                
            case 'c':
                selectedOptions = this.selectBestCombination(relevantOptions);
                console.log(`🎯 I recommend focusing on: ${selectedOptions.map(key => this.strategicOptions[key].name).join(', ')}`);
                break;
        }
        
        this.sessionData.selectedOptions = selectedOptions;
        console.log(`\n✅ Selected ${selectedOptions.length} strategic option(s) for detailed planning.`);
        
        return selectedOptions;
    }
    
    /**
     * Filter strategic options based on user preferences
     */
    filterOptionsForUser() {
        const options = [];
        
        Object.entries(this.strategicOptions).forEach(([key, option]) => {
            let score = 5; // Base score
            
            // Adjust score based on primary focus
            switch (this.sessionData.primaryFocus) {
                case 'growth_expansion':
                    if (key === 'feature_expansion') score += 3;
                    if (key === 'automation_expansion') score += 2;
                    break;
                case 'performance_optimization':
                    if (key === 'performance_optimization') score += 3;
                    if (key === 'architecture_refinement') score += 2;
                    break;
                case 'quality_reliability':
                    if (key === 'quality_assurance') score += 3;
                    if (key === 'release_preparation') score += 1;
                    break;
                case 'maintenance_refinement':
                    if (key === 'architecture_refinement') score += 3;
                    if (key === 'quality_assurance') score += 2;
                    break;
            }
            
            // Adjust score based on timeline preference
            const timelineScores = {
                'short_term': { 'release_preparation': 2, 'automation_expansion': 1 },
                'medium_term': { 'quality_assurance': 2, 'architecture_refinement': 2, 'performance_optimization': 1 },
                'long_term': { 'feature_expansion': 2, 'performance_optimization': 2 }
            };
            
            const timelineBonus = timelineScores[this.sessionData.preferredTimeline];
            if (timelineBonus && timelineBonus[key]) {
                score += timelineBonus[key];
            }
            
            options.push({ key, score: Math.min(score, 10) });
        });
        
        // Sort by score and return top options
        return options.sort((a, b) => b.score - a.score);
    }
    
    /**
     * Select best combination of options automatically
     */
    selectBestCombination(relevantOptions) {
        // For automatic selection, choose top 2-3 options based on timeline
        const timelineLimits = {
            'short_term': 2,
            'medium_term': 3,  
            'long_term': 4
        };
        
        const maxOptions = timelineLimits[this.sessionData.preferredTimeline] || 2;
        return relevantOptions.slice(0, maxOptions).map(opt => opt.key);
    }
    
    /**
     * Generate detailed strategic plan
     */
    async generateDetailedPlan() {
        console.log('\n📋 STEP 4: Detailed Strategic Plan Generation');
        console.log('=============================================');
        
        console.log('Creating your customized strategic plan...\n');
        
        // Convert selected options to objectives for Plan Manager
        const objectives = this.sessionData.selectedOptions.map(optionKey => {
            const option = this.strategicOptions[optionKey];
            return option.name.toLowerCase().replace(/\s+/g, '_');
        });
        
        // Add custom objectives
        objectives.push(...this.sessionData.customObjectives.map(obj => obj.toLowerCase().replace(/\s+/g, '_')));
        
        // Generate plan using Plan Manager
        const planManager = new PlanManagerAgent();
        const detailedPlan = await planManager.execute(objectives);
        
        console.log('📊 Strategic Plan Summary:');
        console.log(`   🎯 Objectives: ${objectives.length}`);
        console.log(`   📝 Total Tasks: ${detailedPlan.tasks.length}`);
        console.log(`   ⏱️ Estimated Time: ${detailedPlan.metrics.estimatedTotalTime} hours`);
        console.log(`   📈 Current Progress: ${detailedPlan.metrics.completionPercentage}%`);
        
        console.log('\n🎯 Strategic Focus Areas:');
        this.sessionData.selectedOptions.forEach((optionKey, i) => {
            const option = this.strategicOptions[optionKey];
            console.log(`   ${i + 1}. ${option.name} - ${option.timeline}`);
            console.log(`      Benefits: ${option.benefits.join(', ')}`);
        });
        
        this.sessionData.finalStrategy = {
            objectives: objectives,
            detailedPlan: detailedPlan,
            selectedOptions: this.sessionData.selectedOptions,
            estimatedDuration: detailedPlan.metrics.estimatedTotalTime,
            createdAt: new Date().toISOString()
        };
        
        return detailedPlan;
    }
    
    /**
     * Present agent coordination strategy
     */
    async presentAgentCoordination() {
        console.log('\n🤖 STEP 5: Agent Coordination Strategy');
        console.log('=====================================');
        
        console.log('Here\'s how the agent ecosystem will execute your strategy:\n');
        
        // Get involved agents from selected options
        const involvedAgents = new Set();
        this.sessionData.selectedOptions.forEach(optionKey => {
            this.strategicOptions[optionKey].agents.forEach(agent => involvedAgents.add(agent));
        });
        
        console.log('🎯 Agent Coordination Plan:');
        console.log(`   🏢 Management Tier: Project Manager → Plan Manager → Task Manager`);
        console.log(`   🔧 Specialized Agents: ${Array.from(involvedAgents).join(', ')}`);
        console.log(`   📊 Coordination: Task Manager will delegate work to specialized agents`);
        console.log(`   📈 Monitoring: Continuous progress tracking and quality assessment`);
        
        console.log('\n📋 Execution Workflow:');
        console.log('   1. Task Manager receives strategic plan');
        console.log('   2. Tasks are automatically assigned to appropriate agents');
        console.log('   3. Specialized agents execute work and report progress');
        console.log('   4. Project Manager monitors overall strategic progress');
        console.log('   5. Plan Manager adjusts plans based on results');
        
        return Array.from(involvedAgents);
    }
    
    /**
     * Save session and generate outputs
     */
    async saveSession() {
        const sessionFile = path.join(this.projectRoot, `strategic_session_${this.sessionData.sessionId}.json`);
        
        try {
            fs.writeFileSync(sessionFile, JSON.stringify(this.sessionData, null, 2));
            console.log(`💾 Session saved to: strategic_session_${this.sessionData.sessionId}.json`);
        } catch (error) {
            console.log(`⚠️ Could not save session: ${error.message}`);
        }
        
        return sessionFile;
    }
    
    /**
     * Present final strategy and next steps
     */
    async presentFinalStrategy() {
        console.log('\n🎉 STEP 6: Your Strategic Plan is Ready!');
        console.log('=======================================');
        
        const strategy = this.sessionData.finalStrategy;
        
        console.log('📋 Strategic Plan Summary:');
        console.log(`   🎯 Focus: ${this.sessionData.primaryFocus.replace('_', ' ').toUpperCase()}`);
        console.log(`   ⏱️ Timeline: ${this.sessionData.preferredTimeline.replace('_', ' ').toUpperCase()}`);
        console.log(`   📊 Objectives: ${strategy.objectives.length}`);
        console.log(`   📝 Tasks: ${strategy.detailedPlan.tasks.length}`);
        console.log(`   ⏰ Estimated Duration: ${strategy.estimatedDuration} hours`);
        
        console.log('\n🚀 Next Steps:');
        console.log('   1. Review the generated task list');
        console.log('   2. Use Task Manager to begin execution:');
        console.log('      node agents/management/task_manager_agent.js');
        console.log('   3. Monitor progress with specialized agents');
        console.log('   4. Regular check-ins with Project Manager');
        
        console.log('\n📄 Available Outputs:');
        console.log(`   • Strategic session data: strategic_session_${this.sessionData.sessionId}.json`);
        console.log(`   • TodoWrite-compatible task list: Ready for immediate use`);
        console.log(`   • Agent coordination plan: Integrated with existing ecosystem`);
        
        const executeNow = await this.promptUser('\n🎯 Would you like to start executing tasks now? (yes/no): ',
            (answer) => ['yes', 'y', 'no', 'n'].includes(answer.toLowerCase()));
        
        return ['yes', 'y'].includes(executeNow.toLowerCase());
    }
    
    /**
     * Execute immediate next steps
     */
    async executeImmediateSteps() {
        console.log('\n🚀 Executing Immediate Strategic Steps');
        console.log('=====================================');
        
        const taskManager = new TaskManagerAgent();
        const immediateTasks = this.sessionData.finalStrategy.detailedPlan.tasks
            .filter(task => task.status === "pending")
            .slice(0, 3); // Execute first 3 tasks
        
        console.log(`🎯 Executing ${immediateTasks.length} immediate tasks...\n`);
        
        const results = await taskManager.execute(immediateTasks);
        
        console.log('✅ Immediate execution completed!');
        console.log(`   Success Rate: ${results.summary.successRate}%`);
        console.log(`   Tasks Completed: ${results.summary.completed}/${results.summary.totalTasks}`);
        
        return results;
    }
    
    /**
     * Main execution method - run interactive strategic planning session
     */
    async execute() {
        try {
            console.log(`\n🎯 ${this.agentName} Agent - Interactive Strategic Planning Session`);
            console.log("================================================================");
            
            // Welcome and introduction
            const ready = await this.displayWelcome();
            if (!ready) return { cancelled: true };
            
            // Present current project assessment
            const assessment = await this.presentProjectAssessment();
            
            // Elicit user goals and vision
            await this.elicitUserGoals();
            
            // Present strategic options
            await this.presentStrategicOptions();
            
            // Generate detailed strategic plan
            const detailedPlan = await this.generateDetailedPlan();
            
            // Present agent coordination strategy
            await this.presentAgentCoordination();
            
            // Save session data
            await this.saveSession();
            
            // Present final strategy and get confirmation
            const executeNow = await this.presentFinalStrategy();
            
            // Optionally execute immediate steps
            let executionResults = null;
            if (executeNow) {
                executionResults = await this.executeImmediateSteps();
            }
            
            console.log('\n🎉 Interactive Strategic Planning Session Complete!');
            console.log('Your customized strategic plan is ready for execution.');
            
            return {
                success: true,
                sessionData: this.sessionData,
                strategy: this.sessionData.finalStrategy,
                executionResults
            };
            
        } catch (error) {
            console.error('\n❌ Strategic planning session failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        } finally {
            this.rl.close();
        }
    }
}

// Export for use by other agents and direct execution
module.exports = { InteractiveStrategyAgent };

// Allow direct execution
if (require.main === module) {
    const agent = new InteractiveStrategyAgent();
    agent.execute().then(result => {
        if (result.success) {
            console.log('\n✅ Interactive strategic planning completed successfully!');
            process.exit(0);
        } else if (result.cancelled) {
            console.log('\n👋 Strategic planning session cancelled by user.');
            process.exit(0);
        } else {
            console.log('\n❌ Strategic planning session failed');
            process.exit(1);
        }
    });
}