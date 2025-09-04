#!/usr/bin/env node

/**
 * Simple debug to find commands causing undefined display
 */

const { Parser, parse } = require('./parser.js');
const { ASTInterpreter } = require('./interpreter.js');

console.log('🔍 Debugging Undefined Display - Simple Version');
console.log('===============================================');

const testCode = `
int patternCurrent = 0;

void loop() {
  unsigned long currentMillis = millis();
  bool patternComplete = false;
  patternCurrent++;
  if(patternCurrent >= 7)
    patternCurrent = 0;
}
`;

try {
    const ast = parse(testCode);
    const interpreter = new ASTInterpreter(ast, { 
        verbose: false,
        stepDelay: 0,
        maxLoopIterations: 1
    });
    
    // Capture all commands
    const capturedCommands = [];
    interpreter.onCommand = (command) => {
        capturedCommands.push(command);
        
        // Handle millis requests
        if (command.type === 'MILLIS_REQUEST') {
            setTimeout(() => {
                interpreter.handleResponse(command.requestId, Date.now());
            }, 1);
        }
    };
    
    // Suppress console during execution
    const originalLog = console.log;
    console.log = () => {};
    
    interpreter.start();
    
    // Restore console
    console.log = originalLog;
    
    setTimeout(() => {
        console.log('\n📋 All Commands Captured:');
        console.log('=========================');
        
        capturedCommands.forEach((cmd, idx) => {
            console.log(`\n${idx + 1}. Type: ${cmd.type}`);
            
            // Simulate what the playground would display
            let displayContent = '';
            switch (cmd.type) {
                case 'VAR_SET':
                    displayContent = `${cmd.variable} = ${cmd.value}`;
                    break;
                case 'FUNCTION_CALL':
                    displayContent = `${cmd.function}(${(cmd.arguments || []).join(', ')})`;
                    break;
                case 'IF_STATEMENT':
                    displayContent = cmd.message || 'if statement';
                    break;
                case 'CONDITION_EVAL':
                    displayContent = cmd.message || 'condition evaluation';
                    break;
                case 'MILLIS_REQUEST':
                    displayContent = '⏳ Getting current time...';
                    break;
                default:
                    // Check what would happen in the default case
                    if (cmd.message) {
                        displayContent = cmd.message;
                    } else if (cmd.type) {
                        displayContent = cmd.type;
                    } else {
                        displayContent = 'WOULD_BE_UNDEFINED';
                    }
                    break;
            }
            
            console.log(`   Display: "${displayContent}"`);
            
            if (displayContent === 'WOULD_BE_UNDEFINED' || displayContent.includes('undefined')) {
                console.log(`   ❌ THIS WOULD DISPLAY AS UNDEFINED!`);
                console.log(`   Full Command: ${JSON.stringify(cmd, null, 4)}`);
            }
        });
        
        console.log(`\n📊 Total: ${capturedCommands.length} commands`);
        console.log('✅ Analysis complete');
        
    }, 300);
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
}