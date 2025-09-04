#!/usr/bin/env node

/**
 * Simple test for step/resume with analogRead - focused test
 */

const { parse } = require('./ArduinoParser.js');
const { ASTInterpreter } = require('./ASTInterpreter.js');

// Very simple test - just analogRead in setup
const testCode = `
void setup() {
  int value = analogRead(A0);
  Serial.println(value);
}

void loop() {
  // Empty loop
}
`;

console.log('🔧 Simple Step/Resume Test');
console.log('===========================');

async function testSimple() {
    const ast = parse(testCode);
    const interpreter = new ASTInterpreter(ast, { 
        verbose: false,
        stepDelay: 0,
        maxLoopIterations: 1
    });
    
    let requestsSeen = [];
    let stateHistory = [];
    
    interpreter.onCommand = (command) => {
        console.log(`📡 Command: ${command.type}${command.requestId ? ` (${command.requestId})` : ''}`);
        
        if (command.type === 'ANALOG_READ_REQUEST') {
            requestsSeen.push(command.requestId);
            console.log(`   🔍 Received analogRead request: ${command.requestId}`);
            console.log(`   🎯 Current interpreter state: ${interpreter.state}`);
            console.log(`   🎯 Previous state was: ${interpreter.previousExecutionState}`);
            
            // Respond after 1ms delay (like playground)
            setTimeout(() => {
                console.log(`   📤 Responding to analogRead with value 750`);
                console.log(`   🎯 State before resumeWithValue: ${interpreter.state}`);
                interpreter.resumeWithValue(command.requestId, 750);
                console.log(`   🎯 State after resumeWithValue: ${interpreter.state}`);
            }, 1);
        }
    };
    
    interpreter.onStateChange = (newState, oldState) => {
        stateHistory.push({ from: oldState, to: newState });
        console.log(`🔄 State: ${oldState} → ${newState}`);
    };
    
    console.log('\n1. Starting in STEP mode...');
    interpreter.setState('STEPPING');
    
    console.log('2. Running interpretAST...');
    try {
        await interpreter.interpretAST();
        console.log('3. interpretAST completed normally');
    } catch (error) {
        if (error.name === 'ExecutionPausedError') {
            console.log(`3. interpretAST paused for request: ${error.requestId}`);
        } else {
            console.log(`3. interpretAST error: ${error.message}`);
        }
    }
    
    // Wait for any async responses
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log(`\n📊 Final state: ${interpreter.state}`);
    console.log(`📊 Requests seen: ${requestsSeen.length}`);
    console.log(`📊 State transitions: ${stateHistory.map(h => `${h.from}→${h.to}`).join(', ')}`);
    
    // The key test: if we were in STEPPING and got a response, we should end up PAUSED
    const hadRequestResponse = stateHistory.some(h => h.from === 'WAITING_FOR_RESPONSE' && h.to === 'PAUSED');
    console.log(`\n✅ Test result: ${hadRequestResponse ? 'SUCCESS - Returns to PAUSED after request' : 'FAILED - Did not return to PAUSED'}`);
    
    return hadRequestResponse;
}

testSimple().then(success => {
    console.log(`\n🎯 Overall result: ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
});