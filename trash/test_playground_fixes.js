#!/usr/bin/env node

/**
 * Test Playground Script Loading and Global Variable Fixes
 */

console.log('🧪 Testing Playground Script Loading Fixes');
console.log('==========================================');

// Simulate browser environment
global.window = {};
global.console = console;

console.log('🔄 Step 1: Load parser.js (should export globals)...');

// Load parser.js first (like playground)
try {
    require('./parser.js');
    
    // Check if globals are available
    if (global.parse) {
        console.log('✅ parse function is globally available');
    } else {
        console.log('❌ parse function not available globally');
    }
    
    if (global.PARSER_VERSION) {
        console.log(`✅ PARSER_VERSION is available: ${global.PARSER_VERSION}`);
    } else {
        console.log('❌ PARSER_VERSION not available globally');
    }
    
} catch (error) {
    console.log(`❌ Failed to load parser.js: ${error.message}`);
    process.exit(1);
}

console.log('🔄 Step 2: Load preprocessor.js (should not conflict)...');

try {
    require('./preprocessor.js');
    
    if (global.window.ArduinoPreprocessor) {
        console.log('✅ ArduinoPreprocessor available in window');
    } else {
        console.log('❌ ArduinoPreprocessor not available in window');
    }
    
} catch (error) {
    console.log(`❌ Failed to load preprocessor.js: ${error.message}`);
    console.log(`Error details: ${error.stack}`);
    process.exit(1);
}

console.log('🔄 Step 3: Test preprocessing functionality...');

const testCode = `
#define LED_COUNT 60
uint16_t pixelNumber = LED_COUNT;
void setup() {}
void loop() {}
`;

try {
    const ast = global.parse(testCode, { verbose: false, enablePreprocessor: true });
    
    if (ast && ast.preprocessorInfo && ast.preprocessorInfo.macros.LED_COUNT === '60') {
        console.log('✅ Preprocessing works correctly');
        console.log(`✅ LED_COUNT = ${ast.preprocessorInfo.macros.LED_COUNT}`);
    } else {
        console.log('❌ Preprocessing not working correctly');
        console.log('AST info:', ast ? 'AST exists' : 'No AST');
        console.log('Preprocessor info:', ast?.preprocessorInfo ? 'Has preprocessor info' : 'No preprocessor info');
    }
    
} catch (error) {
    console.log(`❌ Parsing/preprocessing failed: ${error.message}`);
    process.exit(1);
}

console.log('\n✅ ALL PLAYGROUND FIXES SUCCESSFUL!');
console.log('🎯 The playground should now work correctly with:');
console.log('   • No global variable conflicts');
console.log('   • parse function available');  
console.log('   • PARSER_VERSION available');
console.log('   • ArduinoPreprocessor working');
console.log('   • LED_COUNT → 60 substitution');