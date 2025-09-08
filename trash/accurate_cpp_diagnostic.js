#!/usr/bin/env node
/**
 * ACCURATE C++ INTERPRETER DIAGNOSTIC SYSTEM
 * 
 * Mission: Accurately analyze C++ interpreter vs JavaScript interpreter performance
 * by separating AST_AND_COMMANDS tests (with full JS reference) from AST_ONLY tests.
 * 
 * Key Discovery: Many tests are AST_ONLY mode with minimal JS reference commands,
 * making direct comparison misleading.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Configuration
const TEST_DATA_DIR = './test_data';
const CPP_INTERPRETER = './basic_interpreter_example';
const TIMEOUT_MS = 10000;
const TOTAL_TESTS = 135;

class AccurateDiagnosticResults {
    constructor() {
        this.results = [];
        this.astAndCommandsTests = [];
        this.astOnlyTests = [];
        this.startTime = Date.now();
    }

    addResult(testIndex, result) {
        this.results.push(result);
        
        if (result.mode === 'AST_AND_COMMANDS') {
            this.astAndCommandsTests.push(result);
        } else {
            this.astOnlyTests.push(result);
        }
    }

    generateReport() {
        const totalTime = (Date.now() - this.startTime) / 1000;
        const report = [];
        
        report.push('\n' + '='.repeat(80));
        report.push('ACCURATE C++ INTERPRETER DIAGNOSTIC REPORT');
        report.push('='.repeat(80));
        report.push(`Total Tests: ${TOTAL_TESTS}`);
        report.push(`Execution Time: ${totalTime.toFixed(1)}s`);
        report.push('');
        
        // Mode Distribution
        report.push('TEST MODE DISTRIBUTION:');
        report.push('-'.repeat(40));
        report.push(`AST_AND_COMMANDS: ${this.astAndCommandsTests.length} tests (full JS reference)`);
        report.push(`AST_ONLY:         ${this.astOnlyTests.length} tests (minimal JS reference)`);
        report.push('');
        
        // Detailed Analysis of AST_AND_COMMANDS tests (most important)
        if (this.astAndCommandsTests.length > 0) {
            report.push('AST_AND_COMMANDS TESTS (Primary Analysis):');
            report.push('-'.repeat(80));
            report.push('ID  | Test Name                     | JS Chars | C++ Chars | Similarity | Status');
            report.push('-'.repeat(80));
            
            let totalSimilarity = 0;
            let validComparisons = 0;
            
            this.astAndCommandsTests.forEach((result) => {
                const id = result.testIndex.toString().padStart(3, '0');
                const name = result.testName.substring(0, 29).padEnd(29);
                const jsChars = result.jsOutputLength.toString().padStart(8);
                const cppChars = result.cppOutputLength.toString().padStart(9);
                
                let similarity = 0;
                if (result.jsOutputLength > 0) {
                    similarity = Math.min(result.cppOutputLength, result.jsOutputLength) / 
                               Math.max(result.cppOutputLength, result.jsOutputLength) * 100;
                    totalSimilarity += similarity;
                    validComparisons++;
                }
                
                const similarityStr = similarity > 0 ? similarity.toFixed(1).padStart(8) + '%' : '    N/A ';
                const status = result.error ? 'ERROR' : 'OK';
                
                // Color coding based on similarity
                let color = '\x1b[31m'; // Red
                if (similarity >= 80) color = '\x1b[32m'; // Green
                else if (similarity >= 60) color = '\x1b[33m'; // Yellow
                else if (similarity >= 40) color = '\x1b[91m'; // Light red
                
                report.push(`${color}${id} | ${name} | ${jsChars} | ${cppChars} | ${similarityStr} | ${status}\x1b[0m`);
            });
            
            const avgSimilarity = validComparisons > 0 ? (totalSimilarity / validComparisons).toFixed(1) : 0;
            report.push('');
            report.push(`AVERAGE SIMILARITY (AST_AND_COMMANDS): ${avgSimilarity}%`);
        }
        
        // Summary of AST_ONLY tests  
        if (this.astOnlyTests.length > 0) {
            report.push('\nAST_ONLY TESTS SUMMARY:');
            report.push('-'.repeat(40));
            
            const avgCppOutput = this.astOnlyTests.reduce((sum, r) => sum + r.cppOutputLength, 0) / this.astOnlyTests.length;
            const maxCppOutput = Math.max(...this.astOnlyTests.map(r => r.cppOutputLength));
            const minCppOutput = Math.min(...this.astOnlyTests.map(r => r.cppOutputLength));
            
            report.push(`Tests: ${this.astOnlyTests.length}`);
            report.push(`C++ Output Range: ${minCppOutput}-${maxCppOutput} chars (avg: ${avgCppOutput.toFixed(0)})`);
            report.push(`Note: These tests have minimal JS reference data for comparison`);
        }
        
        // Critical Issues Analysis
        report.push('\nCRITICAL ISSUES ANALYSIS:');
        report.push('-'.repeat(40));
        
        if (this.astAndCommandsTests.length > 0) {
            const avgSimilarity = this.astAndCommandsTests.reduce((sum, r) => {
                if (r.jsOutputLength === 0) return sum;
                return sum + (Math.min(r.cppOutputLength, r.jsOutputLength) / 
                             Math.max(r.cppOutputLength, r.jsOutputLength) * 100);
            }, 0) / this.astAndCommandsTests.filter(r => r.jsOutputLength > 0).length;
            
            if (avgSimilarity >= 90) {
                report.push('✅ EXCELLENT: C++ interpreter matches JavaScript very closely');
                report.push('   Status: Production ready');
            } else if (avgSimilarity >= 70) {
                report.push('🔧 GOOD: C++ interpreter working well with minor differences');
                report.push('   Priority: Fine-tune output format compatibility');
            } else if (avgSimilarity >= 50) {
                report.push('⚠️  MODERATE: C++ interpreter has functional differences');
                report.push('   Priority: Investigate command format and execution logic');
            } else {
                report.push('🚨 CRITICAL: Major C++ interpreter functionality issues');
                report.push('   Priority: Debug core execution engine');
            }
        } else {
            report.push('⚠️  WARNING: No AST_AND_COMMANDS tests found for comparison');
        }
        
        report.push('\n' + '='.repeat(80));
        
        return report.join('\n');
    }

    saveToFile(filename) {
        fs.writeFileSync(filename, this.generateReport());
        console.log(`\nAccurate diagnostic report saved to: ${filename}`);
    }
}

async function runAccurateTest(testIndex) {
    const astFile = path.join(TEST_DATA_DIR, `example_${testIndex.toString().padStart(3, '0')}.ast`);
    const metaFile = path.join(TEST_DATA_DIR, `example_${testIndex.toString().padStart(3, '0')}.meta`);
    const jsCommandsFile = path.join(TEST_DATA_DIR, `example_${testIndex.toString().padStart(3, '0')}.commands`);
    
    // Read test metadata
    const metaData = fs.readFileSync(metaFile, 'utf-8');
    const testName = metaData.split('\n').find(line => line.startsWith('name='))?.split('=')[1] || `test_${testIndex}`;
    const mode = metaData.split('\n').find(line => line.startsWith('mode='))?.split('=')[1] || 'UNKNOWN';
    
    // Read JavaScript reference output size
    let jsOutputLength = 0;
    try {
        const jsCommandsData = fs.readFileSync(jsCommandsFile, 'utf-8');
        jsOutputLength = jsCommandsData.length;
    } catch (e) {
        jsOutputLength = 0;
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
            resolve(createAccurateResult(testIndex, testName, mode, jsOutputLength, output, 'TIMEOUT', startTime));
        }, TIMEOUT_MS);
        
        child.on('close', (code) => {
            clearTimeout(timeout);
            const error = code !== 0 ? `EXIT_CODE_${code}` : (errorOutput.trim() || null);
            resolve(createAccurateResult(testIndex, testName, mode, jsOutputLength, output, error, startTime));
        });
        
        child.on('error', (err) => {
            clearTimeout(timeout);
            resolve(createAccurateResult(testIndex, testName, mode, jsOutputLength, output, err.message, startTime));
        });
    });
}

function createAccurateResult(testIndex, testName, mode, jsOutputLength, output, error, startTime) {
    const executionTime = Date.now() - startTime;
    const cppOutputLength = output.length;
    
    return {
        testIndex,
        testName,
        mode,
        jsOutputLength,
        cppOutputLength,
        error,
        executionTime,
        output: output.substring(0, 200) // First 200 chars for analysis
    };
}

async function runAccurateDiagnostic() {
    console.log('🔍 STARTING ACCURATE C++ INTERPRETER DIAGNOSTIC');
    console.log(`Testing ${TOTAL_TESTS} cases to identify real performance gaps...\n`);
    
    const results = new AccurateDiagnosticResults();
    
    // Test all cases sequentially
    for (let i = 0; i < TOTAL_TESTS; i++) {
        process.stdout.write(`Testing ${i.toString().padStart(3, '0')}/${TOTAL_TESTS-1}... `);
        
        const result = await runAccurateTest(i);
        results.addResult(i, result);
        
        console.log(`${result.mode} (JS:${result.jsOutputLength} C++:${result.cppOutputLength})`);
        
        // Show progress every 20 tests
        if ((i + 1) % 20 === 0) {
            const astAndCommands = results.astAndCommandsTests.length;
            const total = i + 1;
            console.log(`  Progress: ${astAndCommands} AST_AND_COMMANDS, ${total - astAndCommands} AST_ONLY`);
        }
    }
    
    // Generate and display report
    console.log(results.generateReport());
    
    // Save detailed report to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    results.saveToFile(`accurate_cpp_diagnostic_${timestamp}.txt`);
    
    return results;
}

// Main execution
if (require.main === module) {
    runAccurateDiagnostic()
        .then((results) => {
            const astAndCommandsCount = results.astAndCommandsTests.length;
            console.log(`\n📊 SUMMARY: ${astAndCommandsCount} meaningful tests found for comparison`);
            process.exit(0);
        })
        .catch((error) => {
            console.error('🚨 DIAGNOSTIC SYSTEM FAILURE:', error);
            process.exit(2);
        });
}

module.exports = { runAccurateDiagnostic, AccurateDiagnosticResults };