#!/usr/bin/env node

/**
 * Quick test to demonstrate the Serial boolean conversion issue
 */

const { parse } = require('./parser.js');
const { ASTInterpreter } = require('./interpreter.js');

console.log('🔍 Testing Serial Boolean Conversion Issue');
console.log('==========================================');

const testCode = `
void setup() {
  Serial.begin(9600);
  while (!Serial) {
    ; // This should NOT be an infinite loop
  }
  Serial.println("Setup complete");
}

void loop() {
  // Empty loop
}
`;

console.log('Test Code:');
console.log(testCode);
console.log('\n--- Execution Results ---');

try {
    const ast = parse(testCode);
    const interpreter = new ASTInterpreter(ast, { 
        verbose: true,  // Enable verbose to see error messages
        debug: true,    // Enable debug to see detailed execution
        stepDelay: 0,
        maxLoopIterations: 3
    });
    
    let commandCount = 0;
    let hasSerialError = false;
    let hasInfiniteLoop = false;
    
    interpreter.onCommand = (command) => {
        commandCount++;
        console.log(`Command ${commandCount}: ${command.type} - ${command.message || ''}`);
        
        if (command.type === 'ERROR' && command.message.includes('Undefined variable: Serial')) {
            hasSerialError = true;
            console.log('  ⚠️  FOUND THE ISSUE: Serial treated as undefined variable!');
        }
        
        if (command.type === 'LOOP_LIMIT_REACHED') {
            hasInfiniteLoop = true;
            console.log('  🔥 INFINITE LOOP DETECTED!');
        }
        
        // Stop after reasonable number of commands to avoid hanging
        if (commandCount > 50) {
            console.log('  ⏹️  Stopping execution (too many commands)');
            interpreter.stop();
        }
    };
    
    interpreter.onError = (error) => {
        console.log(`Error: ${error}`);
    };
    
    const startResult = interpreter.start();
    if (!startResult) {
        console.log('❌ Failed to start interpreter');
        process.exit(1);
    }
    
    // Wait a bit for execution
    setTimeout(() => {
        interpreter.stop();
        
        console.log('\n--- Analysis Results ---');
        console.log(`Total commands executed: ${commandCount}`);
        console.log(`Serial undefined error detected: ${hasSerialError ? 'YES' : 'NO'}`);
        console.log(`Infinite loop detected: ${hasInfiniteLoop ? 'YES' : 'NO'}`);
        
        if (hasSerialError && hasInfiniteLoop) {
            console.log('\n✅ CONFIRMED: Serial boolean conversion issue causes infinite loop');
            console.log('   Problem: Serial is treated as undefined variable (returns 0)');
            console.log('   Result: !Serial becomes !0 which is true, causing infinite loop');
        } else {
            console.log('\n❓ Issue not reproduced as expected');
        }
    }, 1000);
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
}