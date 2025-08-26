#!/usr/bin/env node

/**
 * Test to reproduce undefined command entries
 */

const { Parser, parse } = require('./parser.js');
const { ArduinoInterpreter } = require('./interpreter.js');

console.log('🔍 Testing Undefined Command Entries');
console.log('====================================');

const testCode = `
void loop() {
  unsigned long currentMillis = millis();
  if( true || (currentMillis - 1000) >= 100) {
    bool patternComplete = false;
    unsigned long patternPrevious = currentMillis;
    int patternCurrent = 0;
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
    
    // Capture all commands to see what we get
    const capturedCommands = [];
    interpreter.onCommand = (command) => {
        capturedCommands.push(command);
    };
    
    // Mock response handler for millis() 
    interpreter.responseHandler = (request) => {
        setTimeout(() => {
            interpreter.handleResponse(request.id, Date.now());
        }, 1);
    };
    
    // Suppress console during execution
    const originalLog = console.log;
    console.log = () => {};
    
    interpreter.start();
    
    // Restore console
    console.log = originalLog;
    
    // Wait for execution to complete
    setTimeout(() => {
        console.log('\n📋 CAPTURED COMMANDS:');
        console.log('=====================');
        
        capturedCommands.forEach((cmd, idx) => {
            console.log(`${idx + 1}. Type: ${cmd.type}`);
            if (cmd.type === undefined || cmd.type === null) {
                console.log(`   ❌ UNDEFINED TYPE: ${JSON.stringify(cmd, null, 2)}`);
            } else if (!cmd.type) {
                console.log(`   ❌ EMPTY TYPE: ${JSON.stringify(cmd, null, 2)}`);
            }
            
            // Check if this command would produce "undefined" in display
            if (cmd.type && typeof cmd.type === 'string') {
                // Simulate basic display logic
                let wouldShowUndefined = false;
                
                switch (cmd.type) {
                    case 'VAR_SET':
                        if (cmd.variable === undefined || cmd.value === undefined) {
                            wouldShowUndefined = true;
                        }
                        break;
                    case 'FUNCTION_CALL':
                        if (cmd.function === undefined) {
                            wouldShowUndefined = true;
                        }
                        break;
                    default:
                        // Check if command has essential fields
                        if (Object.values(cmd).some(v => v === undefined)) {
                            wouldShowUndefined = true;
                        }
                        break;
                }
                
                if (wouldShowUndefined) {
                    console.log(`   ⚠️  WOULD SHOW UNDEFINED: ${JSON.stringify(cmd, null, 2)}`);
                }
            }
        });
        
        console.log(`\n📊 Total commands captured: ${capturedCommands.length}`);
        console.log('✅ Analysis completed');
        
    }, 200);
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
}