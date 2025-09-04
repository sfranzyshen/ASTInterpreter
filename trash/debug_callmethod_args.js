#!/usr/bin/env node

/**
 * Debug what arguments are being passed to callMethod
 */

const { Parser, parse } = require('./parser.js');
const { ASTInterpreter } = require('./interpreter.js');

// Monkey patch the ArduinoObject callMethod to see what arguments it receives
const originalCallMethod = require('./interpreter.js').ASTInterpreter.prototype.executeMemberAccess;

console.log('🔍 Debugging callMethod Arguments');
console.log('=================================');

const testCode = `
#include <Adafruit_NeoPixel.h>
Adafruit_NeoPixel strip(60, 6, 82);

void setup() {
  uint32_t color = strip.Color(255, 0, 0);
}

void loop() {}
`;

// Patch the ArduinoObject.callMethod to log arguments
class DebugArduinoObject {
    constructor(className, constructorArgs = [], interpreter = null) {
        this.className = className;
        this.constructorArgs = constructorArgs;
        this.interpreter = interpreter;
        this.objectId = `${className}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Set up library info
        const ARDUINO_LIBRARIES = {
            'Adafruit_NeoPixel': {
                staticMethods: ['Color', 'numPixels'],
                internalMethods: {},
                externalMethods: ['begin', 'show', 'setBrightness']
            }
        };
        this.libraryInfo = ARDUINO_LIBRARIES[className];
    }
    
    callMethod(methodName, args = [], variableName = null) {
        console.log(`🎯 callMethod called with:`);
        console.log(`   methodName: ${methodName}`);
        console.log(`   args: [${args.join(', ')}]`);
        console.log(`   variableName: ${variableName || 'NULL/UNDEFINED'}`);
        console.log(`   variableName type: ${typeof variableName}`);
        
        // Simulate the Color method
        if (methodName === 'Color') {
            return 65280; // Red color
        }
        
        return 0;
    }
}

try {
    const ast = parse(testCode);
    const interpreter = new ASTInterpreter(ast, { 
        verbose: false,
        stepDelay: 0,
        maxLoopIterations: 1
    });
    
    // Patch the createObject method to return our debug object
    const originalCreateObject = interpreter.createObject.bind(interpreter);
    interpreter.createObject = function(className, constructorArgs, variableName) {
        if (className === 'Adafruit_NeoPixel') {
            return new DebugArduinoObject(className, constructorArgs, this);
        }
        return originalCreateObject(className, constructorArgs, variableName);
    };
    
    // Suppress console during execution (except our debug output)
    const originalLog = console.log;
    console.log = (...args) => {
        if (args[0] && args[0].includes('🎯')) {
            originalLog(...args); // Allow our debug output
        }
    };
    
    interpreter.start();
    
    // Restore console
    console.log = originalLog;
    
    console.log('\n✅ Debug test completed');
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
}