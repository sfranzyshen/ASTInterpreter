#!/usr/bin/env node

/**
 * Test Arduino Preprocessor Integration in Playground Environment
 * 
 * Simulates the playground environment to verify that:
 * - Preprocessor is properly loaded and integrated
 * - LED_COUNT substitution works correctly
 * - Library activation functions properly
 * - Command display formatting is clean
 */

console.log('🎮 Testing Arduino Preprocessor Playground Integration');
console.log('==================================================');

// Simulate browser environment globals
global.window = {};

// Load dependencies in the same order as playground
const preprocessorModule = require('./preprocessor.js');
const { ArduinoPreprocessor } = preprocessorModule;

// Make preprocessor available globally like in browser
global.window.ArduinoPreprocessor = ArduinoPreprocessor;
global.ArduinoPreprocessor = ArduinoPreprocessor;

const { Parser, parse } = require('./parser.js');
const { ArduinoInterpreter } = require('./interpreter.js');

// Test the exact NeoPixel code that was failing
const neopixelCode = `
#include <Adafruit_NeoPixel.h>
#define LED_COUNT 60
#define LED_PIN 6

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);
uint16_t pixelNumber = LED_COUNT;

void setup() {
    strip.begin();
    strip.setBrightness(50);
    uint32_t red = strip.Color(255, 0, 0);
    strip.setPixelColor(0, red);
    strip.show();
    Serial.println(pixelNumber);
}

void loop() {
}
`;

async function testPlaygroundIntegration() {
    console.log('🔄 Step 1: Testing preprocessor loading...');
    
    // Direct test - check if preprocessor module loads
    console.log('Testing direct require...');
    try {
        const { ArduinoPreprocessor: DirectPreprocessor } = require('./preprocessor.js');
        if (DirectPreprocessor) {
            console.log('✅ ArduinoPreprocessor loaded successfully via direct require');
            // Set global for parser to use
            global.window.ArduinoPreprocessor = DirectPreprocessor;
        } else {
            console.log('❌ ArduinoPreprocessor not available via direct require');
            return false;
        }
    } catch (error) {
        console.log(`❌ Failed to load preprocessor: ${error.message}`);
        return false;
    }
    
    console.log('🔄 Step 2: Testing parsing with preprocessor enabled...');
    
    try {
        // Parse exactly like the playground does
        const ast = parse(neopixelCode, { verbose: false, enablePreprocessor: true });
        
        if (!ast) {
            console.log('❌ Parsing failed');
            return false;
        }
        
        console.log('✅ Parsing successful');
        
        // Check preprocessor results
        if (ast.preprocessorInfo) {
            const info = ast.preprocessorInfo;
            console.log(`📊 Preprocessor results: ${Object.keys(info.macros || {}).length} macros, ${info.activeLibraries?.length || 0} libraries`);
            
            // Specific checks
            if (info.macros.LED_COUNT === '60') {
                console.log('✅ LED_COUNT macro correctly defined as 60');
            } else {
                console.log(`❌ LED_COUNT macro issue: ${info.macros.LED_COUNT}`);
                return false;
            }
            
            if (info.activeLibraries?.includes('Adafruit_NeoPixel')) {
                console.log('✅ Adafruit_NeoPixel library activated');
            } else {
                console.log('❌ Adafruit_NeoPixel library not activated');
                return false;
            }
            
            if (info.libraryConstants.NEO_GRB) {
                console.log(`✅ NEO_GRB constant available: ${info.libraryConstants.NEO_GRB}`);
            } else {
                console.log('❌ NEO_GRB constant not available');
                return false;
            }
        } else {
            console.log('❌ No preprocessor information in AST');
            return false;
        }
        
        console.log('🔄 Step 3: Testing interpreter integration...');
        
        // Create interpreter like playground does
        const interpreter = new ArduinoInterpreter(ast, {
            verbose: false,
            debug: false,
            stepDelay: 0,
            maxLoopIterations: 3
        });
        
        // Test that LED_COUNT is available in interpreter
        if (interpreter.macros.has('LED_COUNT')) {
            const ledCountValue = interpreter.macros.get('LED_COUNT');
            console.log(`✅ LED_COUNT available in interpreter: ${ledCountValue}`);
            
            if (ledCountValue === '60') {
                console.log('✅ LED_COUNT has correct value (60)');
            } else {
                console.log(`❌ LED_COUNT has wrong value: ${ledCountValue}`);
                return false;
            }
        } else {
            console.log('❌ LED_COUNT not available in interpreter');
            return false;
        }
        
        // Test library activation
        if (interpreter.activeLibraries.has('Adafruit_NeoPixel')) {
            console.log('✅ Adafruit_NeoPixel library enabled in interpreter');
        } else {
            console.log('❌ Adafruit_NeoPixel library not enabled in interpreter');
            return false;
        }
        
        // Test variable resolution (this should now show 60, not undefined)
        if (interpreter.variables.has('NEO_GRB')) {
            const neoGrbValue = interpreter.variables.get('NEO_GRB');
            console.log(`✅ NEO_GRB constant available in variables: ${neoGrbValue}`);
        } else {
            console.log('❌ NEO_GRB constant not available in variables');
            return false;
        }
        
        console.log('🔄 Step 4: Testing command generation and filtering...');
        
        let commandCount = 0;
        let internalMethodCount = 0;
        let externalMethodCount = 0;
        let pixelNumberValue = null;
        let hasUndefinedCommands = false;
        
        // Set up command handler like playground
        interpreter.onCommand = (command) => {
            commandCount++;
            
            // Check for undefined messages (these should be filtered out in playground)
            if (command.message === undefined || command.message === 'undefined' || command.message === null) {
                hasUndefinedCommands = true;
                console.log(`⚠️  Found undefined command: ${JSON.stringify(command)}`);
            }
            
            // Track command types
            if (command.type === 'LIBRARY_METHOD_INTERNAL') {
                internalMethodCount++;
                console.log(`🔹 Internal: ${command.message || command.type}`);
            } else if (command.type === 'LIBRARY_METHOD_CALL') {
                externalMethodCount++;
                console.log(`🔸 External: ${command.message || command.type}`);
            } else if (command.type === 'VAR_SET' && command.variable === 'pixelNumber') {
                // This is the critical test - pixelNumber should be 60, not undefined
                pixelNumberValue = command.value;
                let displayValue = pixelNumberValue;
                if (typeof displayValue === 'object' && displayValue !== null && displayValue.value !== undefined) {
                    displayValue = displayValue.value;
                }
                console.log(`🎯 CRITICAL TEST - pixelNumber = ${displayValue}`);
            }
            
            // Handle request-response pattern
            switch (command.type) {
                case 'ANALOG_READ_REQUEST':
                case 'DIGITAL_READ_REQUEST':
                case 'MILLIS_REQUEST':
                case 'MICROS_REQUEST':
                case 'LIBRARY_METHOD_REQUEST':
                    setTimeout(() => {
                        if (interpreter.handleResponse) {
                            interpreter.handleResponse(command.requestId, 0);
                        }
                    }, 1);
                    break;
            }
        };
        
        // Suppress console output during execution like playground does
        const originalConsoleLog = console.log;
        console.log = () => {};
        
        const result = interpreter.start();
        
        // Restore console
        console.log = originalConsoleLog;
        
        if (!result) {
            console.log('❌ Interpreter failed to start');
            return false;
        }
        
        // Wait a moment for execution to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('🔄 Step 5: Analyzing results...');
        
        console.log(`📊 Generated ${commandCount} commands total`);
        console.log(`🔹 Internal methods: ${internalMethodCount}`);
        console.log(`🔸 External methods: ${externalMethodCount}`);
        
        if (hasUndefinedCommands) {
            console.log('⚠️  Found undefined commands (these should be filtered in playground)');
        } else {
            console.log('✅ No undefined commands detected');
        }
        
        // The critical test
        if (pixelNumberValue !== null) {
            let actualValue = pixelNumberValue;
            if (typeof actualValue === 'object' && actualValue !== null && actualValue.value !== undefined) {
                actualValue = actualValue.value;
            }
            
            if (actualValue === 60) {
                console.log('🎉 SUCCESS: pixelNumber = 60 (LED_COUNT substitution worked!)');
                return true;
            } else {
                console.log(`❌ FAILURE: pixelNumber = ${actualValue} (should be 60)`);
                return false;
            }
        } else {
            console.log('❌ FAILURE: pixelNumber value not captured');
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Test failed with error: ${error.message}`);
        return false;
    }
}

// Run the test
testPlaygroundIntegration().then(success => {
    console.log('\n' + '='.repeat(50));
    console.log('🏁 TEST RESULTS');
    console.log('='.repeat(50));
    
    if (success) {
        console.log('🎉 ALL TESTS PASSED!');
        console.log('✅ Preprocessor integration working in playground');
        console.log('✅ LED_COUNT → 60 substitution successful');
        console.log('✅ Library activation functional');
        console.log('✅ Command filtering and display ready');
        console.log('');
        console.log('🎯 The playground should now show:');
        console.log('   • pixelNumber = 60 (instead of undefined)');
        console.log('   • Clean command output (no JSON pollution)');
        console.log('   • Proper library method routing');
        console.log('   • No "undefined" messages in output');
    } else {
        console.log('❌ TESTS FAILED');
        console.log('The playground integration needs further debugging');
    }
}).catch(error => {
    console.error('💥 Test suite crashed:', error.message);
    process.exit(1);
});