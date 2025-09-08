#!/usr/bin/env node

/**
 * Focused test: What happens when we step THROUGH an external data function call
 */

const { parse } = require('./ArduinoParser.js');
const { ASTInterpreter } = require('./ASTInterpreter.js');

console.log('🎯 FOCUSED: STEP THROUGH EXTERNAL DATA FUNCTION CALL');
console.log('===================================================');

async function testStepThroughExternal(functionName, testCode) {
    console.log(`\n📋 Testing step-through with ${functionName}:`);
    console.log('--------------------------------------------');
    
    const ast = parse(testCode);
    const interpreter = new ASTInterpreter(ast, { 
        verbose: false,
        stepDelay: 0,
        maxLoopIterations: 10 // Allow more iterations
    });
    
    let stepCount = 0;
    let externalDataRequest = null;
    let stateBeforeExternal = null;
    let stateAfterExternal = null;
    
    interpreter.onCommand = (command) => {
        console.log(`📡 ${command.type}${command.requestId ? ' (' + command.requestId + ')' : ''}`);
        
        if (command.type.endsWith('_REQUEST')) {
            externalDataRequest = {
                type: command.type,
                requestId: command.requestId,
                stateWhenRequested: interpreter.state,
                previousStateWhenRequested: interpreter.previousExecutionState
            };
            
            console.log(`   🎯 REQUEST State: ${interpreter.state}, Previous: ${interpreter.previousExecutionState}`);
            
            // Mock response
            let mockValue = command.type === 'DIGITAL_READ_REQUEST' ? 1 : 
                           command.type === 'ANALOG_READ_REQUEST' ? 512 :
                           command.type === 'MILLIS_REQUEST' ? 1000 :
                           command.type === 'MICROS_REQUEST' ? 1000000 : 0;
            
            setTimeout(() => {
                stateBeforeExternal = interpreter.state;
                console.log(`   📤 BEFORE resumeWithValue: state=${interpreter.state}, previous=${interpreter.previousExecutionState}`);
                
                const success = interpreter.resumeWithValue(command.requestId, mockValue);
                
                stateAfterExternal = interpreter.state;
                console.log(`   📤 AFTER resumeWithValue: state=${interpreter.state}, success=${success}`);
            }, 1);
        }
    };
    
    interpreter.onStateChange = (newState, oldState) => {
        console.log(`🔄 State: ${oldState} → ${newState}`);
    };
    
    // Manual step-through process
    console.log('1. Setting to STEPPING mode...');
    interpreter.setState('STEPPING');
    
    console.log('2. Manually calling interpretAST()...');
    try {
        await interpreter.interpretAST();
        console.log('   interpretAST() completed normally');
    } catch (error) {
        if (error.name === 'ExecutionPausedError') {
            console.log(`   interpretAST() paused for external data: ${error.requestId}`);
        } else {
            console.log(`   interpretAST() error: ${error.message}`);
        }
    }
    
    // Wait for external data response to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('\n📊 Analysis:');
    console.log(`   External request made: ${externalDataRequest ? 'YES' : 'NO'}`);
    if (externalDataRequest) {
        console.log(`   Request type: ${externalDataRequest.type}`);
        console.log(`   State when requested: ${externalDataRequest.stateWhenRequested}`);
        console.log(`   Previous state when requested: ${externalDataRequest.previousStateWhenRequested}`);
        console.log(`   State before resumeWithValue: ${stateBeforeExternal}`);
        console.log(`   State after resumeWithValue: ${stateAfterExternal}`);
        
        // The key test: if we were stepping and made an external request,
        // did we end up in PAUSED state after the response?
        const correctStepBehavior = (
            // For async/await pattern (analogRead): state is already WAITING_FOR_RESPONSE
            (externalDataRequest.stateWhenRequested === 'WAITING_FOR_RESPONSE' && 
             externalDataRequest.previousStateWhenRequested === 'STEPPING' &&
             stateAfterExternal === 'PAUSED')
        ) || (
            // For state machine pattern (digitalRead, millis, micros): state is still STEPPING when command emitted
            (externalDataRequest.stateWhenRequested === 'STEPPING' &&
             stateAfterExternal === 'PAUSED')
        );
        
        console.log(`   Correct step behavior: ${correctStepBehavior ? '✅' : '❌'}`);
        return correctStepBehavior;
    }
    
    return false;
}

async function runStepThroughTests() {
    const tests = [
        {
            name: 'digitalRead',
            code: `void setup() { int val = digitalRead(2); }`
        },
        {
            name: 'analogRead',
            code: `void setup() { int val = analogRead(A0); }`
        },
        {
            name: 'millis',
            code: `void setup() { unsigned long val = millis(); }`
        },
        {
            name: 'micros',
            code: `void setup() { unsigned long val = micros(); }`
        }
    ];
    
    let results = {};
    for (const test of tests) {
        results[test.name] = await testStepThroughExternal(test.name, test.code);
    }
    
    console.log('\n🎯 STEP-THROUGH SUMMARY:');
    console.log('========================');
    
    for (const [name, working] of Object.entries(results)) {
        console.log(`${name}: ${working ? '✅ CORRECT STEP BEHAVIOR' : '❌ STEP BEHAVIOR BROKEN'}`);
    }
    
    return results;
}

runStepThroughTests().then(results => {
    const allWorking = Object.values(results).every(r => r);
    console.log(`\n🏆 Overall: ${allWorking ? '✅ ALL FUNCTIONS HAVE CORRECT STEP BEHAVIOR' : '❌ SOME FUNCTIONS HAVE BROKEN STEP BEHAVIOR'}`);
    process.exit(allWorking ? 0 : 1);
}).catch(console.error);