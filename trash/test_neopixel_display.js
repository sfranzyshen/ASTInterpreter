#!/usr/bin/env node

/**
 * Quick test to verify NeoPixel display improvements
 * Tests the new command format with variableName and constructorArgs
 */

const { Parser, parse } = require('./parser.js');
const { ASTInterpreter } = require('./interpreter.js');

console.log('🎯 Testing NeoPixel Display Improvements');
console.log('=======================================');

const testCode = `
#include <Adafruit_NeoPixel.h>

#define LED_PIN    6
#define LED_COUNT 60

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  strip.begin();
  strip.setBrightness(50);
  strip.show();
}

void loop() {
  // Empty loop for this test
}
`;

try {
    // Parse and create interpreter
    const ast = parse(testCode);
    const interpreter = new ASTInterpreter(ast, { 
        verbose: false,
        stepDelay: 0,
        maxLoopIterations: 1
    });
    
    // Capture commands to analyze their structure
    const capturedCommands = [];
    interpreter.onCommand = (command) => {
        capturedCommands.push(command);
    };
    
    // Suppress console during execution
    const originalLog = console.log;
    console.log = () => {};
    
    interpreter.start();
    
    // Restore console
    console.log = originalLog;
    
    // Wait a moment for execution to complete
    setTimeout(() => {
        console.log('\n📋 CAPTURED COMMANDS:');
        console.log('=====================');
        
        capturedCommands.forEach((cmd, idx) => {
            if (cmd.type === 'LIBRARY_OBJECT_INSTANTIATION') {
                console.log(`${idx + 1}. ${cmd.type}:`);
                console.log(`   - library: ${cmd.library}`);
                console.log(`   - variableName: ${cmd.variableName || 'undefined'}`);
                console.log(`   - constructorArgs: [${(cmd.constructorArgs || []).join(', ')}]`);
            } else if (cmd.type === 'LIBRARY_METHOD_CALL') {
                console.log(`${idx + 1}. ${cmd.type}:`);
                console.log(`   - library: ${cmd.library}`);
                console.log(`   - variableName: ${cmd.variableName || 'undefined'}`);
                console.log(`   - method: ${cmd.method}`);
                console.log(`   - args: [${(cmd.args || []).join(', ')}]`);
            }
        });
        
        console.log('\n✅ Command structure test completed!');
    }, 100);
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
}