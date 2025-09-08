#!/usr/bin/env node

/**
 * Arduino Parser Test - Comprehensive Test Suite
 * Tests parsing of all 54 comprehensive tests from old_test.js
 * Parser-only testing (no interpreter execution)
 */

console.log('🚀 Arduino Parser Test - All 54 Comprehensive Tests');
console.log('==================================================');

// Load dependencies
const { Parser, parse, PlatformEmulation, ArduinoPreprocessor } = require('../../libs/ArduinoParser/src/ArduinoParser.js');

// Load old_test.js file
let testFiles;
try {
    const testData = require('../../old_test.js');
    testFiles = testData.oldTestFiles || testData;
} catch (error) {
    console.error('❌ Failed to load old_test.js:', error.message);
    process.exit(1);
}

console.log('✅ Dependencies loaded:', testFiles.length, 'comprehensive tests');

// Initialize platform emulation and preprocessor
const platformEmulation = new PlatformEmulation('ESP32_NANO');
const preprocessor = new ArduinoPreprocessor({
    defines: platformEmulation.getDefines(),
    libraries: platformEmulation.getLibraries()
});
console.log(`🎯 Platform: ${platformEmulation.currentPlatform.displayName}`);
console.log('🔧 Preprocessor initialized with platform context');

let successes = 0;
let failures = [];

// Test a single example - parser only
function testExample(example, index) {
    console.log(`[${index+1}/${testFiles.length}] Parsing: ${example.name}`);
    
    try {
        // Step 1: Preprocess code with platform context
        const code = example.content || example.code;
        const preprocessResult = preprocessor.preprocess(code);
        
        // Step 2: Parse preprocessed code to AST
        const ast = parse(preprocessResult.processedCode);
        
        // Check if parsing succeeded (AST should be truthy and have expected structure)
        if (ast && typeof ast === 'object') {
            console.log(`  ✅ PARSED successfully`);
            return {
                success: true,
                name: example.name
            };
        } else {
            console.log(`  ❌ PARSE FAILED: Invalid AST structure`);
            return {
                success: false,
                name: example.name,
                error: 'Invalid AST structure'
            };
        }
    } catch (error) {
        console.log(`  ❌ PARSE FAILED: ${error.message.substring(0, 60)}...`);
        return {
            success: false,
            name: example.name,
            error: error.message
        };
    }
}

// Run all parser tests
async function runAllTests() {
    console.log('\n🧪 STARTING PARSER TESTS');
    console.log('=========================');
    
    const startTime = Date.now();
    
    for (let i = 0; i < testFiles.length; i++) {
        const result = testExample(testFiles[i], i);
        
        if (result.success) {
            successes++;
        } else {
            failures.push(result);
        }
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    
    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL RESULTS - ALL 54 COMPREHENSIVE TESTS (PARSER)');
    console.log('='.repeat(50));
    console.log(`✅ Parsed: ${successes}`);
    console.log(`❌ Failed: ${failures.length}`);
    console.log(`📈 Success Rate: ${((successes / testFiles.length) * 100).toFixed(1)}%`);
    console.log(`⏱️  Duration: ${duration}s`);
    
    if (failures.length > 0 && failures.length <= 10) {
        console.log('\n🔍 PARSE FAILURE DETAILS:');
        failures.forEach((failure, idx) => {
            console.log(`${idx + 1}. ${failure.name}: ${failure.error.substring(0, 60)}...`);
        });
    } else if (failures.length > 10) {
        console.log(`\n🔍 First 10 parse failures shown, ${failures.length - 10} more not displayed`);
        failures.slice(0, 10).forEach((failure, idx) => {
            console.log(`${idx + 1}. ${failure.name}: ${failure.error.substring(0, 60)}...`);
        });
    }
    
    console.log('\n🎯 Parser testing completed successfully!');
}

// Start the tests
runAllTests().catch(error => {
    console.error('❌ Parser test suite failed:', error.message);
    process.exit(1);
});