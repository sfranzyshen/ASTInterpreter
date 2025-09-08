#!/usr/bin/env node

/**
 * Test step/resume functionality with ALL external data functions
 */

const { parse } = require('./ArduinoParser.js');
const { ASTInterpreter } = require('./ASTInterpreter.js');

console.log('🎮 STEP/RESUME TEST FOR ALL EXTERNAL FUNCTIONS');
console.log('==============================================');

async function testStepResume(functionName, testCode) {
    console.log(`\n📋 Testing step/resume with ${functionName}:`);
    console.log('-------------------------------------------');
    
    const ast = parse(testCode);
    const interpreter = new ASTInterpreter(ast, { 
        verbose: false,
        stepDelay: 0,
        maxLoopIterations: 2
    });
    
    let requests = [];
    let stateTransitions = [];
    
    interpreter.onCommand = (command) => {
        console.log(`📡 ${command.type}${command.requestId ? ' (' + command.requestId + ')' : ''}`);
        
        if (command.type.endsWith('_REQUEST')) {
            requests.push({
                type: command.type,
                requestId: command.requestId,
                currentState: interpreter.state,
                previousState: interpreter.previousExecutionState
            });
            
            console.log(`   🎯 State: ${interpreter.state}, Previous: ${interpreter.previousExecutionState}`);
            
            // Mock response
            let mockValue = command.type === 'DIGITAL_READ_REQUEST' ? 1 : 
                           command.type === 'ANALOG_READ_REQUEST' ? 512 :
                           command.type === 'MILLIS_REQUEST' ? 1000 :
                           command.type === 'MICROS_REQUEST' ? 1000000 : 0;
            
            setTimeout(() => {
                console.log(`   📤 Responding...`);
                console.log(`   🎯 State before resumeWithValue: ${interpreter.state}`);
                interpreter.resumeWithValue(command.requestId, mockValue);
                console.log(`   🎯 State after resumeWithValue: ${interpreter.state}`);
            }, 1);
        }
    };
    
    interpreter.onStateChange = (newState, oldState) => {
        stateTransitions.push({ from: oldState, to: newState });
        console.log(`🔄 State: ${oldState} → ${newState}`);
    };
    
    // Test sequence: Start → Pause → Step → Step → Resume
    console.log('1. Starting interpreter...');
    await interpreter.start();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('2. Pausing...');
    interpreter.pause();
    await new Promise(resolve => setTimeout(resolve, 50));
    
    console.log('3. Single step (should pause after external data response)...');
    interpreter.step();
    await new Promise(resolve => setTimeout(resolve, 200)); // Wait for external data response
    
    console.log('4. Another step...');
    interpreter.step();
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('5. Resuming...');
    interpreter.resume();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    interpreter.stop();
    
    console.log('\n📊 Results:');
    console.log(`   Requests: ${requests.length}`);
    console.log(`   State transitions: ${stateTransitions.map(t => `${t.from}→${t.to}`).join(', ')}`);
    
    // Check if step/resume worked correctly
    const hasStepToPaused = stateTransitions.some(t => t.from === 'STEPPING' && t.to === 'PAUSED');
    const hasWaitingToProperState = stateTransitions.some(t => t.from === 'WAITING_FOR_RESPONSE' && (t.to === 'PAUSED' || t.to === 'RUNNING'));
    
    console.log(`   Step→Paused transitions: ${hasStepToPaused ? '✅' : '❌'}`);
    console.log(`   Proper resume from waiting: ${hasWaitingToProperState ? '✅' : '❌'}`);
    
    return { hasStepToPaused, hasWaitingToProperState, requests: requests.length };
}

async function runAllStepTests() {
    const tests = [
        {
            name: 'digitalRead',
            code: `void setup() {} void loop() { int val = digitalRead(2); Serial.println(val); delay(100); }`
        },
        {
            name: 'analogRead', 
            code: `void setup() {} void loop() { int val = analogRead(A0); Serial.println(val); delay(100); }`
        },
        {
            name: 'millis',
            code: `void setup() {} void loop() { unsigned long val = millis(); Serial.println(val); delay(100); }`
        },
        {
            name: 'micros',
            code: `void setup() {} void loop() { unsigned long val = micros(); Serial.println(val); delay(100); }`
        }
    ];
    
    let results = {};
    for (const test of tests) {
        results[test.name] = await testStepResume(test.name, test.code);
    }
    
    console.log('\n🎯 STEP/RESUME SUMMARY:');
    console.log('=======================');
    
    for (const [name, result] of Object.entries(results)) {
        const working = result.hasStepToPaused && result.hasWaitingToProperState && result.requests > 0;
        console.log(`${name}: ${working ? '✅ WORKS' : '❌ ISSUES'} (${result.requests} requests)`);
    }
    
    return results;
}

runAllStepTests().catch(console.error);