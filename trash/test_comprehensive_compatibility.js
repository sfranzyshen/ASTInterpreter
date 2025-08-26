#!/usr/bin/env node

/**
 * Comprehensive Node.js Test Runner v1.0
 * Tests all 162 Arduino examples using comprehensive test collection
 * 
 * Usage:
 *   node test_comprehensive_compatibility.js
 *   node test_comprehensive_compatibility.js --category="Arduino Examples"
 *   node test_comprehensive_compatibility.js --verbose
 *   node test_comprehensive_compatibility.js --parser-only
 *   node test_comprehensive_compatibility.js --interpreter-only
 */

const fs = require('fs');
const path = require('path');

// Load modules
const { Parser, parse, prettyPrintAST } = require('./parser.js');
const { ArduinoInterpreter } = require('./interpreter.js');
const comprehensiveTestCollection = require('./comprehensive_tests.js');

// Test configuration
const config = {
    verbose: process.argv.includes('--verbose'),
    category: process.argv.find(arg => arg.startsWith('--category='))?.split('=')[1] || 'all',
    parserOnly: process.argv.includes('--parser-only'),
    interpreterOnly: process.argv.includes('--interpreter-only'),
    stopOnFirst: process.argv.includes('--stop-on-first'),
    exportResults: process.argv.includes('--export'),
    timing: process.argv.includes('--timing')
};

// Statistics tracking
const stats = {
    totalTests: 0,
    parserPassed: 0,
    parserFailed: 0,
    interpreterPassed: 0,
    interpreterFailed: 0,
    startTime: 0,
    endTime: 0,
    results: []
};

/**
 * Print colored output to console
 */
function colorLog(message, color = 'white') {
    const colors = {
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        gray: '\x1b[90m',
        reset: '\x1b[0m'
    };
    
    console.log(colors[color] + message + colors.reset);
}

/**
 * Print test header
 */
function printHeader() {
    console.log('\n' + '='.repeat(80));
    colorLog('🚀 COMPREHENSIVE ARDUINO COMPATIBILITY TEST RUNNER v1.0', 'cyan');
    console.log('='.repeat(80));
    
    colorLog(`📊 Configuration:`, 'blue');
    console.log(`   • Category: ${config.category}`);
    console.log(`   • Verbose: ${config.verbose}`);
    console.log(`   • Parser Only: ${config.parserOnly}`);
    console.log(`   • Interpreter Only: ${config.interpreterOnly}`);
    console.log(`   • Stop on First Failure: ${config.stopOnFirst}`);
    console.log(`   • Export Results: ${config.exportResults}`);
    console.log(`   • Timing Enabled: ${config.timing}`);
    
    console.log('\n📂 Available Test Categories:');
    Object.entries(comprehensiveTestCollection).forEach(([category, data]) => {
        console.log(`   • ${category}: ${data.count} tests`);
    });
    
    const totalCount = Object.values(comprehensiveTestCollection)
        .reduce((sum, category) => sum + category.count, 0);
    colorLog(`\n📈 Total Tests Available: ${totalCount}`, 'magenta');
    console.log('');
}

/**
 * Get tests based on category filter
 */
function getFilteredTests() {
    const tests = [];
    
    if (config.category === 'all') {
        Object.entries(comprehensiveTestCollection).forEach(([categoryName, data]) => {
            data.tests.forEach(test => {
                tests.push({ ...test, category: categoryName });
            });
        });
    } else {
        const categoryData = comprehensiveTestCollection[config.category];
        if (categoryData) {
            categoryData.tests.forEach(test => {
                tests.push({ ...test, category: config.category });
            });
        } else {
            colorLog(`❌ Category "${config.category}" not found!`, 'red');
            process.exit(1);
        }
    }
    
    return tests;
}

/**
 * Test parser functionality
 */
function testParser(test) {
    try {
        const startTime = config.timing ? Date.now() : 0;
        const ast = parse(test.code);
        const parseTime = config.timing ? Date.now() - startTime : 0;
        
        if (!ast) {
            throw new Error("Parser returned null AST");
        }
        
        if (config.verbose) {
            colorLog(`  ✅ Parser: AST generated successfully`, 'green');
            if (config.timing) {
                colorLog(`     ⏱️ Parse time: ${parseTime}ms`, 'gray');
            }
        }
        
        return { success: true, ast, parseTime };
        
    } catch (error) {
        if (config.verbose) {
            colorLog(`  ❌ Parser: ${error.message}`, 'red');
        }
        return { success: false, error: error.message, parseTime: 0 };
    }
}

/**
 * Test interpreter functionality
 */
function testInterpreter(ast) {
    try {
        const startTime = config.timing ? Date.now() : 0;
        const interpreter = new ArduinoInterpreter(ast, { verbose: false });
        const result = interpreter.start();
        const interpreterTime = config.timing ? Date.now() - startTime : 0;
        
        if (result) {
            if (config.verbose) {
                colorLog(`  ✅ Interpreter: Executed successfully`, 'green');
                if (config.timing) {
                    colorLog(`     ⏱️ Execution time: ${interpreterTime}ms`, 'gray');
                }
            }
            return { success: true, interpreterTime };
        } else {
            if (config.verbose) {
                colorLog(`  ❌ Interpreter: Execution returned false`, 'red');
            }
            return { success: false, error: 'Execution returned false', interpreterTime };
        }
        
    } catch (error) {
        if (config.verbose) {
            colorLog(`  ❌ Interpreter: ${error.message}`, 'red');
        }
        return { success: false, error: error.message, interpreterTime: 0 };
    }
}

/**
 * Execute a single test
 */
function executeTest(test, index, total) {
    const testNumber = `[${index.toString().padStart(3, '0')}/${total.toString().padStart(3, '0')}]`;
    
    if (!config.verbose) {
        process.stdout.write(`\r${testNumber} Testing: ${test.name.substring(0, 50).padEnd(50)}`);
    } else {
        colorLog(`\n${testNumber} Testing: ${test.name}`, 'blue');
        colorLog(`  Category: ${test.category}`, 'gray');
    }
    
    const result = {
        name: test.name,
        category: test.category,
        parserSuccess: false,
        interpreterSuccess: false,
        parserError: null,
        interpreterError: null,
        parseTime: 0,
        interpreterTime: 0
    };
    
    // Test parser (unless interpreter-only mode)
    if (!config.interpreterOnly) {
        const parserResult = testParser(test);
        result.parserSuccess = parserResult.success;
        result.parserError = parserResult.error;
        result.parseTime = parserResult.parseTime || 0;
        
        if (parserResult.success) {
            stats.parserPassed++;
            
            // Test interpreter (unless parser-only mode)
            if (!config.parserOnly && parserResult.ast) {
                const interpreterResult = testInterpreter(parserResult.ast);
                result.interpreterSuccess = interpreterResult.success;
                result.interpreterError = interpreterResult.error;
                result.interpreterTime = interpreterResult.interpreterTime || 0;
                
                if (interpreterResult.success) {
                    stats.interpreterPassed++;
                } else {
                    stats.interpreterFailed++;
                }
            }
        } else {
            stats.parserFailed++;
        }
    } else if (config.interpreterOnly) {
        // Interpreter-only mode: parse first, then test interpreter
        const parserResult = testParser(test);
        if (parserResult.success && parserResult.ast) {
            const interpreterResult = testInterpreter(parserResult.ast);
            result.interpreterSuccess = interpreterResult.success;
            result.interpreterError = interpreterResult.error;
            result.interpreterTime = interpreterResult.interpreterTime || 0;
            
            if (interpreterResult.success) {
                stats.interpreterPassed++;
            } else {
                stats.interpreterFailed++;
            }
        } else {
            stats.interpreterFailed++;
            result.interpreterError = 'Parser failed: ' + (parserResult.error || 'Unknown error');
        }
    }
    
    stats.results.push(result);
    
    // Check for stop on first failure
    if (config.stopOnFirst && (result.parserError || result.interpreterError)) {
        return false; // Signal to stop
    }
    
    return true; // Continue
}

/**
 * Print final results
 */
function printResults() {
    const duration = ((stats.endTime - stats.startTime) / 1000).toFixed(2);
    
    if (!config.verbose) {
        console.log('\r' + ' '.repeat(80)); // Clear progress line
    }
    
    console.log('\n' + '='.repeat(80));
    colorLog('📊 COMPREHENSIVE TEST RESULTS', 'cyan');
    console.log('='.repeat(80));
    
    colorLog(`⏱️  Total execution time: ${duration}s`, 'blue');
    colorLog(`📈 Total tests executed: ${stats.totalTests}`, 'blue');
    
    if (!config.interpreterOnly) {
        console.log('\n🔧 PARSER RESULTS:');
        colorLog(`   ✅ Passed: ${stats.parserPassed}`, 'green');
        colorLog(`   ❌ Failed: ${stats.parserFailed}`, 'red');
        const parserRate = stats.totalTests > 0 ? ((stats.parserPassed / stats.totalTests) * 100).toFixed(1) : 0;
        colorLog(`   📊 Success Rate: ${parserRate}%`, parserRate >= 90 ? 'green' : parserRate >= 70 ? 'yellow' : 'red');
    }
    
    if (!config.parserOnly) {
        console.log('\n🚀 INTERPRETER RESULTS:');
        colorLog(`   ✅ Passed: ${stats.interpreterPassed}`, 'green');
        colorLog(`   ❌ Failed: ${stats.interpreterFailed}`, 'red');
        const interpreterTotal = stats.interpreterPassed + stats.interpreterFailed;
        const interpreterRate = interpreterTotal > 0 ? ((stats.interpreterPassed / interpreterTotal) * 100).toFixed(1) : 0;
        colorLog(`   📊 Success Rate: ${interpreterRate}%`, interpreterRate >= 90 ? 'green' : interpreterRate >= 70 ? 'yellow' : 'red');
    }
    
    // Show category breakdown
    console.log('\n📂 CATEGORY BREAKDOWN:');
    const categoryStats = {};
    stats.results.forEach(result => {
        if (!categoryStats[result.category]) {
            categoryStats[result.category] = { parser: {pass: 0, fail: 0}, interpreter: {pass: 0, fail: 0} };
        }
        if (!config.interpreterOnly) {
            if (result.parserSuccess) categoryStats[result.category].parser.pass++;
            else categoryStats[result.category].parser.fail++;
        }
        if (!config.parserOnly) {
            if (result.interpreterSuccess) categoryStats[result.category].interpreter.pass++;
            else categoryStats[result.category].interpreter.fail++;
        }
    });
    
    Object.entries(categoryStats).forEach(([category, stats]) => {
        console.log(`\n   📁 ${category}:`);
        if (!config.interpreterOnly) {
            const pTotal = stats.parser.pass + stats.parser.fail;
            const pRate = pTotal > 0 ? ((stats.parser.pass / pTotal) * 100).toFixed(1) : 0;
            colorLog(`      🔧 Parser: ${stats.parser.pass}/${pTotal} (${pRate}%)`, pRate >= 90 ? 'green' : 'yellow');
        }
        if (!config.parserOnly) {
            const iTotal = stats.interpreter.pass + stats.interpreter.fail;
            const iRate = iTotal > 0 ? ((stats.interpreter.pass / iTotal) * 100).toFixed(1) : 0;
            colorLog(`      🚀 Interpreter: ${stats.interpreter.pass}/${iTotal} (${iRate}%)`, iRate >= 90 ? 'green' : 'yellow');
        }
    });
    
    // Show failed tests
    const failedTests = stats.results.filter(r => r.parserError || r.interpreterError);
    if (failedTests.length > 0 && config.verbose) {
        console.log('\n❌ FAILED TESTS:');
        failedTests.forEach(test => {
            colorLog(`\n   • ${test.name} (${test.category})`, 'red');
            if (test.parserError) {
                colorLog(`     Parser: ${test.parserError}`, 'gray');
            }
            if (test.interpreterError) {
                colorLog(`     Interpreter: ${test.interpreterError}`, 'gray');
            }
        });
    }
    
    console.log('\n' + '='.repeat(80));
}

/**
 * Export results to JSON file
 */
function exportResults() {
    if (!config.exportResults) return;
    
    const exportData = {
        metadata: {
            timestamp: new Date().toISOString(),
            version: '1.0',
            configuration: config,
            duration: ((stats.endTime - stats.startTime) / 1000).toFixed(2) + 's'
        },
        summary: {
            totalTests: stats.totalTests,
            parserPassed: stats.parserPassed,
            parserFailed: stats.parserFailed,
            interpreterPassed: stats.interpreterPassed,
            interpreterFailed: stats.interpreterFailed
        },
        results: stats.results
    };
    
    const filename = `comprehensive_test_results_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    colorLog(`\n💾 Results exported to: ${filename}`, 'green');
}

/**
 * Main execution function
 */
async function main() {
    try {
        printHeader();
        
        const tests = getFilteredTests();
        if (tests.length === 0) {
            colorLog('❌ No tests found for the specified criteria!', 'red');
            process.exit(1);
        }
        
        stats.totalTests = tests.length;
        stats.startTime = Date.now();
        
        colorLog(`🚀 Starting execution of ${tests.length} tests...\n`, 'green');
        
        for (let i = 0; i < tests.length; i++) {
            const shouldContinue = executeTest(tests[i], i + 1, tests.length);
            if (!shouldContinue) {
                colorLog('\n\n⏹️ Stopped on first failure as requested', 'yellow');
                break;
            }
        }
        
        stats.endTime = Date.now();
        
        printResults();
        exportResults();
        
        // Exit with error code if any tests failed
        const hasFailures = stats.parserFailed > 0 || stats.interpreterFailed > 0;
        process.exit(hasFailures ? 1 : 0);
        
    } catch (error) {
        colorLog(`\n💥 Fatal error: ${error.message}`, 'red');
        if (config.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    main,
    executeTest,
    getFilteredTests,
    config,
    stats
};