#!/usr/bin/env node

/**
 * Version Management Agent
 * 
 * Cross-file version control and release management for the Arduino Interpreter Project.
 * This agent handles version bumping across all files, coordinates version consistency,
 * and manages release preparation tasks.
 * 
 * Role: Version control and release management
 * Reports to: Task Manager Agent
 * Integrates with: Documentation Sync Agent for post-version updates
 * 
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class VersionManagementAgent {
    constructor() {
        this.version = "1.0.0";
        this.projectRoot = path.resolve(__dirname, '../..');
        this.agentName = "Version Management";
        
        // Version-controlled files in the project
        this.versionedFiles = {
            "ASTInterpreter.js": {
                path: "ASTInterpreter.js",
                versionPattern: /const INTERPRETER_VERSION = "([^"]+)"/,
                versionVariable: "INTERPRETER_VERSION",
                currentVersion: null,
                component: "interpreter"
            },
            "ArduinoParser.js": {
                path: "ArduinoParser.js", 
                versionPattern: /const PARSER_VERSION = "([^"]+)"/,
                versionVariable: "PARSER_VERSION",
                currentVersion: null,
                component: "parser"
            },
            "interpreter_playground.html": {
                path: "interpreter_playground.html",
                versionPattern: /<!-- Arduino Interpreter Playground v([\d.]+) -/,
                currentVersion: null,
                component: "playground",
                isComment: true
            }
        };
        
        // Semantic version utilities
        this.versionTypes = {
            "MAJOR": 0,  // Breaking changes (X.0.0)
            "MINOR": 1,  // New features (0.X.0)
            "PATCH": 2   // Bug fixes (0.0.X)
        };
        
        // Version history tracking
        this.versionHistory = [];
        
        console.log(`🔢 ${this.agentName} Agent v${this.version} initialized`);
        console.log(`📊 Managing versions for ${Object.keys(this.versionedFiles).length} files`);
    }
    
    /**
     * Read current versions from all versioned files
     */
    async readCurrentVersions() {
        console.log(`🔍 Reading current versions from all files...`);
        
        for (const [fileName, fileInfo] of Object.entries(this.versionedFiles)) {
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
     * Parse semantic version string
     */
    parseVersion(versionString) {
        const match = versionString.match(/^v?(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
        if (!match) {
            throw new Error(`Invalid version format: ${versionString}`);
        }
        
        return {
            major: parseInt(match[1]),
            minor: parseInt(match[2]),
            patch: parseInt(match[3]),
            prerelease: match[4] || null,
            original: versionString
        };
    }
    
    /**
     * Format version object back to string
     */
    formatVersion(versionObj) {
        let version = `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`;
        if (versionObj.prerelease) {
            version += `-${versionObj.prerelease}`;
        }
        return version;
    }
    
    /**
     * Increment version based on type
     */
    incrementVersion(currentVersion, incrementType, prerelease = null) {
        const parsed = this.parseVersion(currentVersion);
        
        switch (incrementType.toUpperCase()) {
            case "MAJOR":
                parsed.major++;
                parsed.minor = 0;
                parsed.patch = 0;
                parsed.prerelease = prerelease;
                break;
            case "MINOR":
                parsed.minor++;
                parsed.patch = 0;
                parsed.prerelease = prerelease;
                break;
            case "PATCH":
                parsed.patch++;
                parsed.prerelease = prerelease;
                break;
            default:
                throw new Error(`Invalid increment type: ${incrementType}`);
        }
        
        return this.formatVersion(parsed);
    }
    
    /**
     * Bump version for a specific file
     */
    async bumpFileVersion(fileName, newVersion) {
        const fileInfo = this.versionedFiles[fileName];
        if (!fileInfo) {
            throw new Error(`Unknown versioned file: ${fileName}`);
        }
        
        const filePath = path.join(this.projectRoot, fileInfo.path);
        
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            const currentMatch = content.match(fileInfo.versionPattern);
            
            if (!currentMatch) {
                throw new Error(`Version pattern not found in ${fileName}`);
            }
            
            const oldVersion = currentMatch[1];
            
            // Replace version in file
            if (fileInfo.isComment) {
                // Handle HTML comment format
                content = content.replace(fileInfo.versionPattern, `<!-- Arduino Interpreter Playground v${newVersion} -`);
            } else {
                // Handle JavaScript const format
                const quote = fileInfo.path.includes('preprocessor') ? "'" : '"';
                content = content.replace(
                    fileInfo.versionPattern, 
                    `const ${fileInfo.versionVariable} = ${quote}${newVersion}${quote}`
                );
            }
            
            fs.writeFileSync(filePath, content, 'utf8');
            
            // Update in-memory version
            fileInfo.currentVersion = newVersion;
            
            console.log(`   ✅ ${fileName}: v${oldVersion} → v${newVersion}`);
            
            return {
                fileName,
                oldVersion,
                newVersion,
                success: true
            };
            
        } catch (error) {
            console.error(`   ❌ ${fileName}: Failed to update version - ${error.message}`);
            return {
                fileName,
                error: error.message,
                success: false
            };
        }
    }
    
    /**
     * Bump version for specific component (interpreter, parser, preprocessor, etc.)
     */
    async bumpComponentVersion(component, incrementType, prerelease = null) {
        console.log(`\n🔢 Bumping ${component} version (${incrementType})...`);
        
        const results = [];
        
        // Find files for this component
        const componentFiles = Object.entries(this.versionedFiles).filter(
            ([fileName, fileInfo]) => fileInfo.component === component
        );
        
        if (componentFiles.length === 0) {
            throw new Error(`No files found for component: ${component}`);
        }
        
        // Get current version from the main component file
        const mainFile = componentFiles[0][1];
        if (!mainFile.currentVersion) {
            throw new Error(`Current version not available for ${component}`);
        }
        
        // Calculate new version
        const newVersion = this.incrementVersion(mainFile.currentVersion, incrementType, prerelease);
        
        // Update all files for this component
        for (const [fileName, fileInfo] of componentFiles) {
            const result = await this.bumpFileVersion(fileName, newVersion);
            results.push(result);
        }
        
        return {
            component,
            incrementType,
            newVersion,
            results
        };
    }
    
    /**
     * Verify version consistency across all files
     */
    async verifyVersionConsistency() {
        console.log(`\n🔍 Verifying version consistency...`);
        
        const issues = [];
        
        // Group files by component
        const componentVersions = {};
        
        for (const [fileName, fileInfo] of Object.entries(this.versionedFiles)) {
            if (!fileInfo.currentVersion) {
                issues.push({
                    type: "MISSING_VERSION",
                    file: fileName,
                    component: fileInfo.component
                });
                continue;
            }
            
            const component = fileInfo.component;
            if (!componentVersions[component]) {
                componentVersions[component] = [];
            }
            
            componentVersions[component].push({
                file: fileName,
                version: fileInfo.currentVersion
            });
        }
        
        // Check for inconsistencies within components
        for (const [component, versions] of Object.entries(componentVersions)) {
            const uniqueVersions = [...new Set(versions.map(v => v.version))];
            
            if (uniqueVersions.length > 1) {
                issues.push({
                    type: "INCONSISTENT_VERSIONS",
                    component,
                    versions: versions
                });
            }
        }
        
        return {
            consistent: issues.length === 0,
            issues,
            componentVersions
        };
    }
    
    /**
     * Generate version report
     */
    generateVersionReport(consistencyCheck = null) {
        const report = {
            versionManagementAgent: {
                agent: this.agentName,
                version: this.version,
                reportTimestamp: new Date().toISOString()
            },
            currentVersions: Object.fromEntries(
                Object.entries(this.versionedFiles).map(([name, info]) => [
                    name, 
                    { version: info.currentVersion, component: info.component }
                ])
            ),
            consistencyCheck,
            recommendations: this.generateRecommendations(consistencyCheck)
        };
        
        return report;
    }
    
    /**
     * Generate recommendations based on version state
     */
    generateRecommendations(consistencyCheck) {
        const recommendations = [];
        
        if (!consistencyCheck) {
            recommendations.push({
                type: "ACTION_REQUIRED",
                message: "Run version consistency check to identify issues",
                priority: "MEDIUM"
            });
            return recommendations;
        }
        
        if (consistencyCheck.consistent) {
            recommendations.push({
                type: "SUCCESS",
                message: "All version numbers are consistent across components",
                priority: "INFO"
            });
        } else {
            recommendations.push({
                type: "INCONSISTENCY_DETECTED",
                message: `${consistencyCheck.issues.length} version inconsistency/ies found`,
                priority: "HIGH"
            });
        }
        
        // Check for upcoming version milestones
        for (const [fileName, fileInfo] of Object.entries(this.versionedFiles)) {
            if (fileInfo.currentVersion && fileInfo.component !== "playground") {
                try {
                    const parsed = this.parseVersion(fileInfo.currentVersion);
                    
                    // Suggest major version bump if minor is getting high
                    if (parsed.minor >= 9) {
                        recommendations.push({
                            type: "MILESTONE_SUGGESTION",
                            message: `Consider major version bump for ${fileInfo.component} (currently v${fileInfo.currentVersion})`,
                            priority: "LOW"
                        });
                    }
                } catch (error) {
                    // Skip invalid versions
                }
            }
        }
        
        return recommendations;
    }
    
    /**
     * Display version report summary
     */
    displayVersionReport(report) {
        console.log(`\n📊 Version Management Summary:`);
        
        console.log(`\n📋 Current Versions by Component:`);
        const componentVersions = {};
        Object.entries(report.currentVersions).forEach(([file, info]) => {
            if (!componentVersions[info.component]) {
                componentVersions[info.component] = [];
            }
            componentVersions[info.component].push(`${file}: v${info.version || 'unknown'}`);
        });
        
        Object.entries(componentVersions).forEach(([component, files]) => {
            console.log(`   🔧 ${component.toUpperCase()}:`);
            files.forEach(file => console.log(`     ${file}`));
        });
        
        if (report.consistencyCheck) {
            console.log(`\n🔍 Consistency Check: ${report.consistencyCheck.consistent ? '✅ CONSISTENT' : '❌ ISSUES FOUND'}`);
            
            if (!report.consistencyCheck.consistent) {
                console.log(`\n⚠️  Version Issues:`);
                report.consistencyCheck.issues.forEach((issue, i) => {
                    console.log(`   ${i + 1}. ${issue.type} - ${issue.component || issue.file}`);
                    if (issue.versions) {
                        issue.versions.forEach(v => console.log(`      ${v.file}: v${v.version}`));
                    }
                });
            }
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
     * Main execution method - version management operations
     */
    async execute(operation = "check", ...args) {
        console.log(`\n🔢 ${this.agentName} Agent - Version Management`);
        console.log("============================================");
        
        // Always read current versions first
        await this.readCurrentVersions();
        
        let result = null;
        
        switch (operation.toLowerCase()) {
            case "check":
                const consistencyCheck = await this.verifyVersionConsistency();
                result = this.generateVersionReport(consistencyCheck);
                this.displayVersionReport(result);
                break;
                
            case "bump":
                if (args.length < 2) {
                    throw new Error("Bump operation requires component and increment type (e.g., 'interpreter', 'MINOR')");
                }
                const [component, incrementType, prerelease] = args;
                const bumpResult = await this.bumpComponentVersion(component, incrementType, prerelease);
                
                // Re-check consistency after bump
                const postBumpCheck = await this.verifyVersionConsistency();
                result = {
                    operation: "bump",
                    bumpResult,
                    versionReport: this.generateVersionReport(postBumpCheck)
                };
                
                console.log(`\n✅ Version bump completed for ${component}`);
                this.displayVersionReport(result.versionReport);
                break;
                
            default:
                throw new Error(`Unknown operation: ${operation}. Supported: check, bump`);
        }
        
        console.log(`\n✅ Version management operation completed`);
        
        return result;
    }
}

// Export for use by other agents and direct execution
module.exports = { VersionManagementAgent };

// Allow direct execution with command line arguments
if (require.main === module) {
    const agent = new VersionManagementAgent();
    
    // Parse command line arguments
    const operation = process.argv[2] || "check";
    const args = process.argv.slice(3);
    
    agent.execute(operation, ...args).then(result => {
        console.log(`\n📋 Version management completed - Operation: ${operation}`);
        
        // Exit with error if inconsistencies found
        if (result.versionReport && result.versionReport.consistencyCheck && !result.versionReport.consistencyCheck.consistent) {
            process.exit(1);
        }
    }).catch(error => {
        console.error(`❌ ${agent.agentName} Agent failed:`, error.message);
        process.exit(1);
    });
}