#!/usr/bin/env node
/**
 * COMPREHENSIVE C++ INTERPRETER DIAGNOSTIC SYSTEM
 * 
 * Mission: Systematically analyze C++ interpreter performance across ALL 135 test cases
 * to identify failure patterns, root causes, and create prioritized fix plan.
 * 
 * Analysis Categories:
 * - WORKING: Generating substantial command streams (>500 chars)
 * - PARTIAL: Generating some output but incomplete (100-500 chars) 
 * - MINIMAL: Generating minimal output (10-100 chars)
 * - FAILED: Crashing or not executing (<10 chars)
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Configuration
const TEST_DATA_DIR = './test_data';
const CPP_INTERPRETER = './basic_interpreter_example';
const TIMEOUT_MS = 10000; // 10 seconds per test
const TOTAL_TESTS = 135;

// Result categories based on output characteristics
const CATEGORIES = {
    WORKING: { min: 500, desc: 'Substantial command streams', color: '\x1b[32m' }, // Green
    PARTIAL: { min: 100, desc: 'Incomplete output', color: '\x1b[33m' },          // Yellow
    MINIMAL: { min: 10, desc: 'Minimal output', color: '\x1b[91m' },               // Light red
    FAILED:  { min: 0, desc: 'Crashed/no output', color: '\x1b[31m' }              // Red
};

const RESET_COLOR = '\x1b[0m';

class DiagnosticResults {
    constructor() {
        this.results = [];
        this.categoryCounts = {
            WORKING: 0,
            PARTIAL: 0, 
            MINIMAL: 0,
            FAILED: 0
        };
        this.errorPatterns = new Map();
        this.startTime = Date.now();
    }

    addResult(testIndex, result) {
        this.results.push(result);
        this.categoryCounts[result.category]++;
        
        // Track error patterns
        if (result.error) {
            const errorKey = result.error.split(':')[0]; // First part of error message
            this.errorPatterns.set(errorKey, (this.errorPatterns.get(errorKey) || 0) + 1);
        }
    }

    generateReport() {
        const totalTime = (Date.now() - this.startTime) / 1000;
        const report = [];
        
        report.push('\n' + '='.repeat(80));
        report.push('COMPREHENSIVE C++ INTERPRETER DIAGNOSTIC REPORT');
        report.push('='.repeat(80));
        report.push(`Total Tests: ${TOTAL_TESTS}`);
        report.push(`Execution Time: ${totalTime.toFixed(1)}s`);
        report.push('');
        
        // Category Summary
        report.push('CATEGORY DISTRIBUTION:');
        report.push('-'.repeat(40));
        Object.entries(CATEGORIES).forEach(([category, config]) => {
            const count = this.categoryCounts[category];
            const percentage = ((count / TOTAL_TESTS) * 100).toFixed(1);
            report.push(`${config.color}${category.padEnd(8)}: ${count.toString().padStart(3)} tests (${percentage.padStart(5)}%) - ${config.desc}${RESET_COLOR}`);
        });
        
        // Detailed Results
        report.push('\nDETAILED RESULTS:');
        report.push('-'.repeat(80));
        report.push('ID  | Test Name                     | Category | JS Cmds | C++ Chars | Status');
        report.push('-'.repeat(80));
        
        this.results.forEach((result, i) => {
            const id = i.toString().padStart(3, '0');
            const name = result.testName.substring(0, 29).padEnd(29);
            const category = result.category.padEnd(8);
            const jsCmds = result.jsCommandCount.toString().padStart(7);
            const cppChars = result.cppOutputLength.toString().padStart(9);
            const status = result.error ? 'ERROR' : 'OK';
            const color = CATEGORIES[result.category].color;
            
            report.push(`${color}${id} | ${name} | ${category} | ${jsCmds} | ${cppChars} | ${status}${RESET_COLOR}`);
        });
        
        // Error Pattern Analysis
        if (this.errorPatterns.size > 0) {
            report.push('\nERROR PATTERN ANALYSIS:');
            report.push('-'.repeat(40));
            const sortedErrors = Array.from(this.errorPatterns.entries())
                .sort((a, b) => b[1] - a[1]);
            
            sortedErrors.forEach(([pattern, count]) => {
                const percentage = ((count / TOTAL_TESTS) * 100).toFixed(1);
                report.push(`${pattern.padEnd(30)}: ${count.toString().padStart(3)} tests (${percentage.padStart(5)}%)`);
            });
        }
        
        // Priority Analysis
        report.push('\nPRIORITY ANALYSIS:');
        report.push('-'.repeat(40));
        const workingRate = (this.categoryCounts.WORKING / TOTAL_TESTS * 100).toFixed(1);
        const partialRate = (this.categoryCounts.PARTIAL / TOTAL_TESTS * 100).toFixed(1);
        const failureRate = ((this.categoryCounts.MINIMAL + this.categoryCounts.FAILED) / TOTAL_TESTS * 100).toFixed(1);
        
        report.push(`Current Success Rate: ${workingRate}% (Target: 95%+)`);
        report.push(`Partial Success Rate: ${partialRate}%`);
        report.push(`Critical Failure Rate: ${failureRate}%`);
        report.push('');
        
        if (workingRate < 50) {
            report.push('🚨 CRITICAL: Core execution engine has fundamental failures');
            report.push('   Priority: Fix basic language constructs and execution flow');
        } else if (workingRate < 80) {
            report.push('⚠️  MAJOR: Significant language features missing');
            report.push('   Priority: Implement missing Arduino library functions');
        } else if (workingRate < 95) {
            report.push('🔧 MODERATE: Edge cases and advanced features needed');
            report.push('   Priority: Fine-tune advanced language constructs');
        } else {
            report.push('✅ EXCELLENT: System performing well');
            report.push('   Priority: Optimize and add remaining edge cases');
        }
        
        report.push('\n' + '='.repeat(80));
        
        return report.join('\n');
    }

    saveToFile(filename) {
        fs.writeFileSync(filename, this.generateReport());
        console.log(`\nDiagnostic report saved to: ${filename}`);
    }
}

async function runCppTest(testIndex) {
    const astFile = path.join(TEST_DATA_DIR, `example_${testIndex.toString().padStart(3, '0')}.ast`);
    const metaFile = path.join(TEST_DATA_DIR, `example_${testIndex.toString().padStart(3, '0')}.meta`);
    const jsCommandsFile = path.join(TEST_DATA_DIR, `example_${testIndex.toString().padStart(3, '0')}.commands`);
    
    // Read test metadata
    const metaData = fs.readFileSync(metaFile, 'utf-8');
    const testName = metaData.split('\n').find(line => line.startsWith('name='))?.split('=')[1] || `test_${testIndex}`;
    
    // Read JavaScript reference command count
    let jsCommandCount = 0;
    try {
        const jsCommands = JSON.parse(fs.readFileSync(jsCommandsFile, 'utf-8'));
        jsCommandCount = jsCommands.length;
    } catch (e) {
        jsCommandCount = 0;
    }
    
    return new Promise((resolve) => {
        const startTime = Date.now();
        let output = '';
        let errorOutput = '';
        
        const child = spawn(CPP_INTERPRETER, [astFile], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        child.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        const timeout = setTimeout(() => {
            child.kill('SIGKILL');
            resolve(createResult(testIndex, testName, jsCommandCount, output, 'TIMEOUT', startTime));
        }, TIMEOUT_MS);
        
        child.on('close', (code) => {
            clearTimeout(timeout);
            const error = code !== 0 ? `EXIT_CODE_${code}` : (errorOutput.trim() || null);
            resolve(createResult(testIndex, testName, jsCommandCount, output, error, startTime));
        });
        
        child.on('error', (err) => {
            clearTimeout(timeout);
            resolve(createResult(testIndex, testName, jsCommandCount, output, err.message, startTime));
        });
    });
}

function createResult(testIndex, testName, jsCommandCount, output, error, startTime) {
    const executionTime = Date.now() - startTime;
    const cppOutputLength = output.length;
    
    // Categorize based on output length
    let category = 'FAILED';
    if (cppOutputLength >= CATEGORIES.WORKING.min) {
        category = 'WORKING';
    } else if (cppOutputLength >= CATEGORIES.PARTIAL.min) {
        category = 'PARTIAL';
    } else if (cppOutputLength >= CATEGORIES.MINIMAL.min) {
        category = 'MINIMAL';
    }
    
    return {
        testIndex,
        testName,
        jsCommandCount,
        cppOutputLength,
        category,
        error,
        executionTime,
        output: output.substring(0, 200) // First 200 chars for analysis
    };
}

async function runComprehensiveDiagnostic() {
    console.log('🔍 STARTING COMPREHENSIVE C++ INTERPRETER DIAGNOSTIC');
    console.log(`Testing ${TOTAL_TESTS} cases with ${TIMEOUT_MS/1000}s timeout each...\n`);
    
    const results = new DiagnosticResults();
    
    // Test all cases sequentially to avoid resource conflicts
    for (let i = 0; i < TOTAL_TESTS; i++) {
        process.stdout.write(`Testing ${i.toString().padStart(3, '0')}/${TOTAL_TESTS-1}... `);
        
        const result = await runCppTest(i);
        results.addResult(i, result);
        
        const color = CATEGORIES[result.category].color;
        console.log(`${color}${result.category}${RESET_COLOR} (${result.cppOutputLength} chars)`);
        
        // Show progress every 10 tests
        if ((i + 1) % 10 === 0) {
            const working = results.categoryCounts.WORKING;
            const total = i + 1;
            const rate = (working / total * 100).toFixed(1);
            console.log(`  Progress: ${working}/${total} working (${rate}%)`);
        }
    }
    
    // Generate and display report
    console.log(results.generateReport());
    
    // Save detailed report to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    results.saveToFile(`cpp_diagnostic_report_${timestamp}.txt`);
    
    return results;
}

// Main execution
if (require.main === module) {
    runComprehensiveDiagnostic()
        .then((results) => {
            const successRate = results.categoryCounts.WORKING / TOTAL_TESTS * 100;
            process.exit(successRate >= 50 ? 0 : 1); // Exit with error if <50% success
        })
        .catch((error) => {
            console.error('🚨 DIAGNOSTIC SYSTEM FAILURE:', error);
            process.exit(2);
        });
}

module.exports = { runComprehensiveDiagnostic, DiagnosticResults };