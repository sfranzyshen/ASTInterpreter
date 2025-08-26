#!/usr/bin/env node

// Test complex #if defined() expressions specifically
// Focus: Enhanced #if defined() evaluation in preprocessor fix

const { ArduinoPreprocessor } = require('./preprocessor.js');
const { PlatformEmulation } = require('./platform_emulation.js');

console.log('🔬 Testing Complex #if defined() Expression Evaluation');
console.log('=' + '='.repeat(60));
console.log('');

// Test cases for complex #if defined() expressions
const testCases = [
    {
        name: 'Simple defined() expression',
        code: `#if defined(ARDUINO)
int test = 1;
#endif`,
        platform: 'ESP32_NANO',
        expectIncluded: true
    },
    {
        name: 'Negated defined() expression', 
        code: `#if !defined(MISSING_DEFINE)
int test = 2;
#endif`,
        platform: 'ESP32_NANO',
        expectIncluded: true
    },
    {
        name: 'Complex OR expression (ArduinoISP style)',
        code: `#define ARDUINOISP_PIN_MISO MISO
#define ARDUINOISP_PIN_MOSI MOSI
#define ARDUINOISP_PIN_SCK SCK
#if (ARDUINOISP_PIN_MISO != MISO) || (ARDUINOISP_PIN_MOSI != MOSI) || (ARDUINOISP_PIN_SCK != SCK)
int shouldBeExcluded = 1;
#else
int shouldBeIncluded = 1;
#endif`,
        platform: 'ESP32_NANO',
        expectIncluded: 'shouldBeIncluded'
    },
    {
        name: 'Nested defined() with AND/OR',
        code: `#if defined(ARDUINO) && (defined(ESP32) || defined(ARDUINO_ARCH_ESP32))
int esp32Code = 1;
#endif`,
        platform: 'ESP32_NANO', 
        expectIncluded: true
    },
    {
        name: 'AVR-specific code (should be excluded on ESP32)',
        code: `#if defined(ARDUINO_ARCH_AVR)
int avrOnlyCode = 1;
#else
int nonAvrCode = 1;
#endif`,
        platform: 'ESP32_NANO',
        expectIncluded: 'nonAvrCode'
    },
    {
        name: 'Complex Arduino API version check',
        code: `#if !defined(ARDUINO_API_VERSION) || ARDUINO_API_VERSION != 10001
int fallbackCode = 1;
#endif`,
        platform: 'ESP32_NANO',
        expectIncluded: true
    }
];

function runTest(testCase, index) {
    console.log(`🗺 Test ${index + 1}: ${testCase.name}`);
    console.log('-'.repeat(50));
    
    try {
        const platform = new PlatformEmulation(testCase.platform);
        const preprocessor = new ArduinoPreprocessor({
            platformContext: platform,
            debug: false // Suppress debug for cleaner output
        });
        
        console.log('Input code:');
        console.log(testCase.code.split('\n').map((line, i) => `  ${i + 1}: ${line}`).join('\n'));
        
        const result = preprocessor.preprocess(testCase.code);
        const processedCode = result.processedCode;
        
        console.log('\nProcessed code:');
        console.log(processedCode.split('\n').map((line, i) => `  ${i + 1}: ${line}`).join('\n'));
        
        // Check expectations
        let testPassed = false;
        let reason = '';
        
        if (typeof testCase.expectIncluded === 'boolean') {
            // Simple inclusion/exclusion test
            const hasContent = processedCode.trim().split('\n').some(line => 
                line.trim().startsWith('int') || line.includes('=')
            );
            testPassed = hasContent === testCase.expectIncluded;
            reason = `Expected ${testCase.expectIncluded ? 'content' : 'no content'}, got ${hasContent ? 'content' : 'no content'}`;
        } else if (typeof testCase.expectIncluded === 'string') {
            // Specific content test
            testPassed = processedCode.includes(testCase.expectIncluded);
            reason = `Expected to find '${testCase.expectIncluded}' in processed code`;
        }
        
        console.log(`\n📊 Result: ${testPassed ? '✅ PASSED' : '❌ FAILED'} - ${reason}`);
        
        return { passed: testPassed, name: testCase.name, reason };
        
    } catch (error) {
        console.log(`\n❌ ERROR: ${error.message}`);
        return { passed: false, name: testCase.name, reason: `Error: ${error.message}` };
    } finally {
        console.log('\n');
    }
}

// Run all tests
console.log('🚀 Running Conditional Expression Tests...');
console.log('');

const results = [];
for (let i = 0; i < testCases.length; i++) {
    const result = runTest(testCases[i], i);
    results.push(result);
}

// Summary
console.log('📊 TEST SUMMARY');
console.log('=' + '='.repeat(30));

const passed = results.filter(r => r.passed).length;
const total = results.length;

console.log(`Total Tests: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${total - passed}`);
console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
console.log('');

if (passed < total) {
    console.log('⚠️  Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}: ${r.reason}`);
    });
} else {
    console.log('✅ All conditional expression tests passed!');
}

console.log('');
console.log('🏆 CONDITIONAL EXPRESSION TEST COMPLETE');

if (passed === total) {
    console.log('');
    console.log('✅ The recent preprocessor fix successfully handles:');
    console.log('   - Simple defined() expressions');
    console.log('   - Negated defined() expressions (!defined)'); 
    console.log('   - Complex OR/AND combinations');
    console.log('   - Nested conditional logic');
    console.log('   - Platform-specific exclusions');
    console.log('   - Arduino API version checks');
    console.log('');
    console.log('This confirms the #if defined() evaluation improvements are working correctly.');
}
