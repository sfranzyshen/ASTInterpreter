#!/usr/bin/env node

/**
 * Debug which specific commands are displaying as undefined
 */

const { Parser, parse } = require('./parser.js');
const { ArduinoInterpreter } = require('./interpreter.js');

console.log('🔍 Debugging Undefined Command Display');
console.log('=====================================');

// Simplified version of the strandtest_nodelay problematic code
const testCode = `
#include <Adafruit_NeoPixel.h>
Adafruit_NeoPixel strip(60, 6, 82);

bool patternComplete = false;
unsigned long patternPrevious = 0;
int patternCurrent = 0;

void loop() {
  unsigned long currentMillis = millis();
  if( patternComplete || (currentMillis - patternPrevious) >= 100) {
    patternComplete = false;
    patternPrevious = currentMillis;
    patternCurrent++;
    if(patternCurrent >= 7)
      patternCurrent = 0;
  }
}
`;

try {
    const ast = parse(testCode);
    const interpreter = new ArduinoInterpreter(ast, { 
        verbose: false,
        stepDelay: 0,
        maxLoopIterations: 1
    });
    
    // Capture all commands and simulate the playground display logic
    const capturedCommands = [];
    interpreter.onCommand = (command) => {
        capturedCommands.push(command);
        
        // Simulate the playground displayCommand logic
        const displayResult = simulateDisplayCommand(command);
        if (displayResult === 'undefined' || displayResult.trim() === '' || displayResult.includes('undefined')) {
            console.log(`❌ UNDEFINED DISPLAY DETECTED:`);
            console.log(`   Command Type: ${command.type}`);
            console.log(`   Command: ${JSON.stringify(command, null, 2)}`);
            console.log(`   Display Result: "${displayResult}"`);
            console.log('');
        }
    });
    
    // Set up mock response handlers for async functions like millis()
    interpreter.onCommand = (originalOnCommand => (command) => {
        originalOnCommand(command);
        
        // Handle async requests
        if (command.type === 'MILLIS_REQUEST') {
            setTimeout(() => {
                interpreter.handleResponse(command.requestId, Date.now());
            }, 1);
        }
    })(interpreter.onCommand);
    
    // Suppress console during execution
    const originalLog = console.log;
    console.log = (...args) => {
        // Allow our debug output
        if (args[0] && (args[0].includes('❌') || args[0].includes('🔍'))) {
            originalLog(...args);
        }
    };
    
    interpreter.start();
    
    // Restore console
    console.log = originalLog;
    
    setTimeout(() => {
        console.log(`\n📊 Total commands captured: ${capturedCommands.length}`);
        console.log('✅ Analysis completed');
    }, 200);
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
}

// Simulate the playground's displayCommand function to identify issues
function simulateDisplayCommand(command) {
    if (!command || command.type === undefined) {
        return 'SKIPPED';
    }
    
    const time = command.timestamp ? new Date(command.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
    let content = `[${time}] `;
    
    switch (command.type) {
        case 'VAR_SET':
            content += `${command.variable} = ${command.value}`;
            break;
        case 'FUNCTION_CALL':
            content += `${command.function}(${command.arguments ? command.arguments.join(', ') : ''})`;
            break;
        case 'IF_STATEMENT':
            content += command.message || 'if statement';
            break;
        case 'SWITCH_STATEMENT':
            content += command.message || 'switch statement';
            break;
        case 'CONDITION_EVAL':
            content += command.message || 'condition evaluation';
            break;
        default:
            // This is where undefined might come from
            if (command.message) {
                content += command.message;
            } else if (command.type) {
                content += command.type;
            } else {
                content += 'undefined';
            }
            break;
    }
    
    return content;
}