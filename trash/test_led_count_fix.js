#!/usr/bin/env node

/**
 * Simple Direct Test of LED_COUNT Fix
 * Tests that the preprocessing pipeline correctly substitutes LED_COUNT with 60
 */

console.log('🎯 Testing LED_COUNT Substitution Fix');
console.log('=====================================');

const { parse } = require('./parser.js');
const { ArduinoInterpreter } = require('./interpreter.js');

const testCode = `
#define LED_COUNT 60
uint16_t pixelNumber = LED_COUNT;

void setup() {
    Serial.println(pixelNumber);
}

void loop() {
}
`;

console.log('🔄 Step 1: Parse with preprocessor enabled...');

const ast = parse(testCode, { verbose: true, enablePreprocessor: true });

if (!ast) {
    console.log('❌ Parsing failed');
    process.exit(1);
}

console.log('✅ Parsing successful');

if (ast.preprocessorInfo && ast.preprocessorInfo.macros.LED_COUNT === '60') {
    console.log('✅ LED_COUNT macro correctly defined as 60');
} else {
    console.log('❌ LED_COUNT macro not found or incorrect');
    process.exit(1);
}

console.log('🔄 Step 2: Create interpreter and test variable resolution...');

const interpreter = new ArduinoInterpreter(ast, {
    verbose: false,
    debug: false,
    stepDelay: 0,
    maxLoopIterations: 3
});

console.log(`LED_COUNT in macros: ${interpreter.macros.get('LED_COUNT')}`);

let pixelNumberValue = null;

interpreter.onCommand = (command) => {
    if (command.type === 'VAR_SET' && command.variable === 'pixelNumber') {
        pixelNumberValue = command.value;
        let displayValue = pixelNumberValue;
        if (typeof displayValue === 'object' && displayValue !== null && displayValue.value !== undefined) {
            displayValue = displayValue.value;
        }
        console.log(`🎯 pixelNumber = ${displayValue} (type: ${typeof displayValue})`);
    }
};

console.log('🔄 Step 3: Start interpreter...');

// Suppress console during execution
const originalConsoleLog = console.log;
console.log = () => {};

const result = interpreter.start();

// Restore console  
console.log = originalConsoleLog;

if (!result) {
    console.log('❌ Interpreter failed to start');
    process.exit(1);
}

// Wait for completion
setTimeout(() => {
    console.log('🔄 Step 4: Check results...');
    
    if (pixelNumberValue !== null) {
        let actualValue = pixelNumberValue;
        if (typeof actualValue === 'object' && actualValue !== null && actualValue.value !== undefined) {
            actualValue = actualValue.value;
        }
        
        if (actualValue === 60) {
            console.log('🎉 SUCCESS: pixelNumber = 60');
            console.log('✅ LED_COUNT substitution is working correctly!');
            console.log('✅ The "pixelNumber = undefined" issue is FIXED!');
        } else {
            console.log(`❌ FAILED: pixelNumber = ${actualValue} (should be 60)`);
            process.exit(1);
        }
    } else {
        console.log('❌ FAILED: pixelNumber value was not captured');
        process.exit(1);
    }
    
    console.log('\n🏆 The playground integration should now work correctly!');
    console.log('   Open interpreter_playground.html and test the NeoPixel examples.');
    
}, 200);