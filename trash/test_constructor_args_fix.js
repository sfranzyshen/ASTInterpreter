#!/usr/bin/env node

/**
 * Test to verify constructor arguments are properly captured
 */

const { Parser, parse } = require('./parser.js');
const { ArduinoInterpreter } = require('./interpreter.js');

console.log('🔧 Testing Constructor Arguments Fix');
console.log('===================================');

const testCode = `
#include <Adafruit_NeoPixel.h>

#define LED_PIN    6
#define LED_COUNT 60

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  // Empty
}

void loop() {
  // Empty
}
`;

try {
    // Parse and create interpreter
    const ast = parse(testCode);
    const interpreter = new ArduinoInterpreter(ast, { 
        verbose: false,
        stepDelay: 0,
        maxLoopIterations: 1
    });
    
    // Capture commands specifically for LIBRARY_OBJECT_INSTANTIATION
    let libraryInstantiationCommand = null;
    interpreter.onCommand = (command) => {
        if (command.type === 'LIBRARY_OBJECT_INSTANTIATION') {
            libraryInstantiationCommand = command;
        }
    };
    
    // Suppress console during execution
    const originalLog = console.log;
    console.log = () => {};
    
    interpreter.start();
    
    // Restore console
    console.log = originalLog;
    
    // Wait a moment for execution to complete
    setTimeout(() => {
        if (libraryInstantiationCommand) {
            console.log('\n✅ LIBRARY_OBJECT_INSTANTIATION command found:');
            console.log('===============================================');
            console.log(`Library: ${libraryInstantiationCommand.library}`);
            console.log(`Variable Name: ${libraryInstantiationCommand.variableName}`);
            console.log(`Constructor Args: [${(libraryInstantiationCommand.constructorArgs || []).join(', ')}]`);
            console.log(`Constructor Args Length: ${(libraryInstantiationCommand.constructorArgs || []).length}`);
            
            if (libraryInstantiationCommand.constructorArgs && libraryInstantiationCommand.constructorArgs.length === 3) {
                console.log('\n🎯 SUCCESS: Constructor arguments properly captured!');
                console.log(`Expected format: 🔧 Creating Adafruit_NeoPixel strip(${libraryInstantiationCommand.constructorArgs.join(', ')})`);
            } else {
                console.log('\n❌ FAILED: Constructor arguments not captured properly');
            }
        } else {
            console.log('\n❌ FAILED: No LIBRARY_OBJECT_INSTANTIATION command found');
        }
    }, 100);
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
}