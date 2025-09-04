#!/usr/bin/env node

/**
 * Debug variable names in NeoPixel method calls
 */

const { Parser, parse } = require('./parser.js');
const { ASTInterpreter } = require('./interpreter.js');

console.log('🔍 Debugging Variable Names in Method Calls');
console.log('===========================================');

const testCode = `
#include <Adafruit_NeoPixel.h>

#define LED_COUNT 60
#define LED_PIN 6

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  uint32_t color = strip.Color(255, 0, 0);
  uint16_t pixels = strip.numPixels();
}

void loop() {
  // Empty
}
`;

try {
    const ast = parse(testCode);
    const interpreter = new ASTInterpreter(ast, { 
        verbose: false,
        stepDelay: 0,
        maxLoopIterations: 1
    });
    
    // Capture all commands to see what we get
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
    
    // Wait for execution to complete
    setTimeout(() => {
        console.log('\n📋 RELEVANT COMMANDS FOUND:');
        console.log('============================');
        
        capturedCommands.forEach((cmd, idx) => {
            if (cmd.type === 'LIBRARY_METHOD_INTERNAL' || 
                cmd.type === 'LIBRARY_STATIC_METHOD_CALL') {
                console.log(`\n${idx + 1}. ${cmd.type}:`);
                console.log(`   Library: ${cmd.library}`);
                console.log(`   Method: ${cmd.method}`);
                console.log(`   Variable Name: ${cmd.variableName || 'undefined'}`);
                console.log(`   Args: [${(cmd.args || []).join(', ')}]`);
                console.log(`   Result: ${cmd.result || cmd.calculatedValue || 'none'}`);
            }
        });
        
        // Check if we have the right commands
        const colorCommands = capturedCommands.filter(cmd => 
            (cmd.type === 'LIBRARY_METHOD_INTERNAL' || cmd.type === 'LIBRARY_STATIC_METHOD_CALL') && 
            cmd.method === 'Color'
        );
        
        const numPixelsCommands = capturedCommands.filter(cmd => 
            (cmd.type === 'LIBRARY_METHOD_INTERNAL' || cmd.type === 'LIBRARY_STATIC_METHOD_CALL') && 
            cmd.method === 'numPixels'
        );
        
        console.log('\n🎯 ANALYSIS:');
        console.log('===========');
        console.log(`Color commands found: ${colorCommands.length}`);
        console.log(`numPixels commands found: ${numPixelsCommands.length}`);
        
        if (colorCommands.length > 0) {
            const colorCmd = colorCommands[0];
            console.log(`Color command variableName: ${colorCmd.variableName || 'MISSING'}`);
        }
        
        if (numPixelsCommands.length > 0) {
            const numPixelsCmd = numPixelsCommands[0];
            console.log(`numPixels command variableName: ${numPixelsCmd.variableName || 'MISSING'}`);
        }
        
    }, 200);
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
}