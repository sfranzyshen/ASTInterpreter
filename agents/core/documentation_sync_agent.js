#!/usr/bin/env node

/**
 * Documentation Sync Agent
 * 
 * Multi-file documentation synchronization for the Arduino Interpreter Project.
 * This agent monitors code changes, updates version numbers across files,
 * synchronizes feature changes between documentation files, and maintains
 * documentation consistency.
 * 
 * Role: Documentation consistency and synchronization
 * Reports to: Task Manager Agent
 * Monitors: CLAUDE.md, AI_TESTBED_GUIDE.md, README_FOR_AI.md, source files
 * 
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class DocumentationSyncAgent {
    constructor() {
        this.version = "1.0.0";
        this.projectRoot = path.resolve(__dirname, '../..');
        this.agentName = "Documentation Sync";
        
        // Documentation files to monitor and sync
        this.documentationFiles = {
            "CLAUDE.md": {
                path: "CLAUDE.md",
                type: "primary", 
                sections: ["Current Status", "File Structure Summary", "Session Status"],
                versionPatterns: ["v6.3.0", "Interpreter v6.3.0", "Parser v5.0.0", "Preprocessor v1.1.0"]
            },
            "AI_TESTBED_GUIDE.md": {
                path: "AI_TESTBED_GUIDE.md",
                type: "secondary",
                sections: ["Version Header"],
                versionPatterns: ["Interpreter**: v6.3.0", "Parser**: v5.0.0", "Preprocessor**: v1.1.0"]
            },
            "README_FOR_AI.md": {
                path: "README_FOR_AI.md", 
                type: "secondary",
                sections: ["Project Status", "Essential Commands"],
                versionPatterns: ["Interpreter v6.3.0", "Parser v5.0.0", "Preprocessor v1.1.0"]
            }
        };
        
        // Source files that contain version information
        this.sourceFiles = {
            "ASTInterpreter.js": {
                path: "ASTInterpreter.js",
                versionPattern: /const INTERPRETER_VERSION = "([^"]+)"/,
                currentVersion: null
            },
            "ArduinoParser.js": {
                path: "ArduinoParser.js", 
                versionPattern: /const PARSER_VERSION = "([^"]+)"/,
                currentVersion: null
            },
        };
        
        // Change tracking
        this.changeLog = [];
        this.lastSyncTimestamp = null;
        
        console.log(`📝 ${this.agentName} Agent v${this.version} initialized`);
        console.log(`📊 Monitoring ${Object.keys(this.documentationFiles).length} documentation files`);
    }
    
    /**
     * Read current version information from source files
     */
    async readSourceVersions() {
        console.log(`🔍 Reading current versions from source files...`);
        
        for (const [fileName, fileInfo] of Object.entries(this.sourceFiles)) {
            const filePath = path.join(this.projectRoot, fileInfo.path);
            
            try {
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const match = content.match(fileInfo.versionPattern);
                    
                    if (match) {
                        fileInfo.currentVersion = match[1];
                        console.log(`   ✅ ${fileName}: v${fileInfo.currentVersion}`);
                    } else {
                        console.log(`   ⚠️  ${fileName}: Version pattern not found`);
                    }
                } else {
                    console.log(`   ❌ ${fileName}: File not found`);
                }
            } catch (error) {
                console.error(`   💥 ${fileName}: Error reading file - ${error.message}`);
            }
        }
    }
    
    /**
     * Check documentation file consistency
     */
    async checkDocumentationConsistency() {
        console.log(`\n🔍 Checking documentation consistency...`);
        
        const inconsistencies = [];
        
        for (const [fileName, fileInfo] of Object.entries(this.documentationFiles)) {
            const filePath = path.join(this.projectRoot, fileInfo.path);
            
            try {
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    // Check version patterns
                    for (const pattern of fileInfo.versionPatterns) {
                        if (!content.includes(pattern)) {
                            inconsistencies.push({
                                file: fileName,
                                type: "VERSION_MISMATCH",
                                expected: pattern,
                                section: "Version references"
                            });
                        }
                    }
                    
                    console.log(`   ✅ ${fileName}: Checked`);
                } else {
                    inconsistencies.push({
                        file: fileName,
                        type: "FILE_MISSING",
                        message: "Documentation file not found"
                    });
                }
            } catch (error) {
                inconsistencies.push({
                    file: fileName,
                    type: "READ_ERROR",
                    message: error.message
                });
            }
        }
        
        return inconsistencies;
    }
    
    /**
     * Synchronize version information across documentation
     */
    async synchronizeVersions() {
        console.log(`\n🔄 Synchronizing version information...`);
        
        const updates = [];
        
        // Get current versions from source
        const interpreterVersion = this.sourceFiles["ASTInterpreter.js"].currentVersion;
        const parserVersion = this.sourceFiles["ArduinoParser.js"].currentVersion;
        // Read preprocessorVersion from ArduinoParser.js
        const fs = require('fs');
        const parserContent = fs.readFileSync(path.join(this.projectRoot, 'ArduinoParser.js'), 'utf8');
        const preprocessorMatch = parserContent.match(/const PREPROCESSOR_VERSION = ['"]([^'"]+)['"]/);
        const preprocessorVersion = preprocessorMatch ? preprocessorMatch[1] : null;
        
        if (!interpreterVersion || !parserVersion || !preprocessorVersion) {
            console.error(`❌ Could not read all source versions`);
            return updates;
        }
        
        // Update CLAUDE.md
        const claudeUpdates = await this.updateClaudeFile(interpreterVersion, parserVersion, preprocessorVersion);
        updates.push(...claudeUpdates);
        
        // Update AI_TESTBED_GUIDE.md
        const testbedUpdates = await this.updateTestbedGuide(interpreterVersion, parserVersion, preprocessorVersion);
        updates.push(...testbedUpdates);
        
        // Update README_FOR_AI.md
        const readmeUpdates = await this.updateReadmeForAI(interpreterVersion, parserVersion, preprocessorVersion);
        updates.push(...readmeUpdates);
        
        return updates;
    }
    
    /**
     * Update CLAUDE.md with current versions
     */
    async updateClaudeFile(interpreterVersion, parserVersion, preprocessorVersion) {
        const filePath = path.join(this.projectRoot, "CLAUDE.md");
        const updates = [];
        
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;
            
            // Update interpreter version references
            const interpreterPattern = /- \*\*Interpreter Version\*\*: v[\d.]+/;
            const newInterpreterLine = `- **Interpreter Version**: v${interpreterVersion} (🎯 COMMAND DISPLAY ENHANCEMENT)`;
            if (content.match(interpreterPattern)) {
                content = content.replace(interpreterPattern, newInterpreterLine);
                modified = true;
                updates.push("Updated interpreter version in Current Status section");
            }
            
            // Update file structure section
            const fileStructurePattern = /├── ASTInterpreter\.js\s+# Core interpreter \(v[\d.]+\)/;
            const newFileStructureLine = `├── ASTInterpreter.js                       # Core interpreter (v${interpreterVersion})`;
            if (content.match(fileStructurePattern)) {
                content = content.replace(fileStructurePattern, newFileStructureLine);
                modified = true;
                updates.push("Updated interpreter version in File Structure section");
            }
            
            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`   ✅ Updated CLAUDE.md`);
            } else {
                console.log(`   ℹ️  CLAUDE.md already up to date`);
            }
            
        } catch (error) {
            console.error(`   ❌ Error updating CLAUDE.md: ${error.message}`);
        }
        
        return updates;
    }
    
    /**
     * Update AI_TESTBED_GUIDE.md with current versions
     */
    async updateTestbedGuide(interpreterVersion, parserVersion, preprocessorVersion) {
        const filePath = path.join(this.projectRoot, "AI_TESTBED_GUIDE.md");
        const updates = [];
        
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;
            
            // Update version header
            const versionPattern = /\*\*🎉 Version\*\*: [\d-]+ \| \*\*Parser\*\*: v[\d.]+ \| \*\*Interpreter\*\*: v[\d.]+ \| \*\*Preprocessor\*\*: v[\d.]+/;
            const today = new Date().toISOString().split('T')[0];
            const newVersionLine = `**🎉 Version**: ${today} | **Parser**: v${parserVersion} | **Interpreter**: v${interpreterVersion} | **Preprocessor**: v${preprocessorVersion}`;
            
            if (content.match(versionPattern)) {
                content = content.replace(versionPattern, newVersionLine);
                modified = true;
                updates.push("Updated version header");
            }
            
            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`   ✅ Updated AI_TESTBED_GUIDE.md`);
            } else {
                console.log(`   ℹ️  AI_TESTBED_GUIDE.md already up to date`);
            }
            
        } catch (error) {
            console.error(`   ❌ Error updating AI_TESTBED_GUIDE.md: ${error.message}`);
        }
        
        return updates;
    }
    
    /**
     * Update README_FOR_AI.md with current versions
     */
    async updateReadmeForAI(interpreterVersion, parserVersion, preprocessorVersion) {
        const filePath = path.join(this.projectRoot, "README_FOR_AI.md");
        const updates = [];
        
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;
            
            // Update version line in project status
            const versionPattern = /- \*\*Parser v[\d.]+\*\* \+ \*\*Interpreter v[\d.]+\*\* \+ \*\*Preprocessor v[\d.]+\*\*/;
            const newVersionLine = `- **Parser v${parserVersion}** + **Interpreter v${interpreterVersion}** + **Preprocessor v${preprocessorVersion}**`;
            
            if (content.match(versionPattern)) {
                content = content.replace(versionPattern, newVersionLine);
                modified = true;
                updates.push("Updated version information in project status");
            }
            
            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`   ✅ Updated README_FOR_AI.md`);
            } else {
                console.log(`   ℹ️  README_FOR_AI.md already up to date`);
            }
            
        } catch (error) {
            console.error(`   ❌ Error updating README_FOR_AI.md: ${error.message}`);
        }
        
        return updates;
    }
    
    /**
     * Generate documentation sync report
     */
    generateSyncReport(inconsistencies = [], updates = []) {
        const report = {
            documentationSyncAgent: {
                agent: this.agentName,
                version: this.version,
                reportTimestamp: new Date().toISOString()
            },
            sourceVersions: Object.fromEntries(
                Object.entries(this.sourceFiles).map(([name, info]) => [name, info.currentVersion])
            ),
            documentationFiles: Object.keys(this.documentationFiles).length,
            inconsistencies: inconsistencies.length,
            updates: updates.length,
            details: {
                inconsistencies,
                updates
            },
            recommendations: this.generateRecommendations(inconsistencies, updates)
        };
        
        return report;
    }
    
    /**
     * Generate recommendations based on sync results
     */
    generateRecommendations(inconsistencies, updates) {
        const recommendations = [];
        
        if (inconsistencies.length === 0 && updates.length === 0) {
            recommendations.push({
                type: "SUCCESS",
                message: "All documentation files are synchronized and consistent",
                priority: "INFO"
            });
        }
        
        if (inconsistencies.length > 0) {
            recommendations.push({
                type: "INCONSISTENCY_DETECTED",
                message: `${inconsistencies.length} inconsistency/ies found that need attention`,
                priority: "MEDIUM"
            });
        }
        
        if (updates.length > 0) {
            recommendations.push({
                type: "UPDATES_APPLIED",
                message: `${updates.length} update(s) applied to maintain synchronization`,
                priority: "INFO"
            });
        }
        
        // Always recommend regular synchronization
        recommendations.push({
            type: "MAINTENANCE",
            message: "Run documentation sync regularly to maintain consistency",
            priority: "LOW"
        });
        
        return recommendations;
    }
    
    /**
     * Display sync report summary
     */
    displaySyncReport(report) {
        console.log(`\n📊 Documentation Sync Summary:`);
        console.log(`   📝 Documentation Files: ${report.documentationFiles}`);
        console.log(`   🔍 Inconsistencies: ${report.inconsistencies}`);
        console.log(`   🔄 Updates Applied: ${report.updates}`);
        
        console.log(`\n📋 Source Versions:`);
        Object.entries(report.sourceVersions).forEach(([file, version]) => {
            console.log(`   ${file}: v${version || 'unknown'}`);
        });
        
        if (report.details.inconsistencies.length > 0) {
            console.log(`\n⚠️  Inconsistencies Found:`);
            report.details.inconsistencies.forEach((issue, i) => {
                console.log(`   ${i + 1}. ${issue.file}: ${issue.type}`);
                if (issue.expected) console.log(`      Expected: ${issue.expected}`);
            });
        }
        
        if (report.details.updates.length > 0) {
            console.log(`\n✅ Updates Applied:`);
            report.details.updates.forEach((update, i) => {
                console.log(`   ${i + 1}. ${update}`);
            });
        }
        
        if (report.recommendations.length > 0) {
            console.log(`\n💡 Recommendations:`);
            report.recommendations.forEach((rec, i) => {
                const priorityEmoji = rec.priority === "MEDIUM" ? "⚠️" : "ℹ️";
                console.log(`   ${priorityEmoji} ${rec.message}`);
            });
        }
    }
    
    /**
     * Main execution method - perform full documentation sync
     */
    async execute() {
        console.log(`\n📝 ${this.agentName} Agent - Documentation Synchronization`);
        console.log("=====================================================");
        
        // Read current versions from source files
        await this.readSourceVersions();
        
        // Check for inconsistencies
        const inconsistencies = await this.checkDocumentationConsistency();
        
        // Synchronize versions if needed
        const updates = await this.synchronizeVersions();
        
        // Generate and display report
        const report = this.generateSyncReport(inconsistencies, updates);
        this.displaySyncReport(report);
        
        // Update sync timestamp
        this.lastSyncTimestamp = new Date().toISOString();
        
        console.log(`\n✅ Documentation synchronization completed`);
        
        return report;
    }
}

// Export for use by other agents and direct execution
module.exports = { DocumentationSyncAgent };

// Allow direct execution
if (require.main === module) {
    const agent = new DocumentationSyncAgent();
    agent.execute().then(report => {
        const hasIssues = report.inconsistencies > 0;
        console.log(`\n📋 Documentation sync completed - ${hasIssues ? 'Issues detected' : 'All synchronized'}`);
        
        if (hasIssues) {
            process.exit(1);
        }
    }).catch(error => {
        console.error(`❌ ${agent.agentName} Agent failed:`, error.message);
        process.exit(1);
    });
}