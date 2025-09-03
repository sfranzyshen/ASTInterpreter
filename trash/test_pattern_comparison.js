#!/usr/bin/env node
/**
 * Compare state machine vs async/await patterns directly
 * Test why digitalRead fails but analogRead works
 */

const { parse } = require('./ArduinoParser.js');
const { ArduinoInterpreter } = require('./ArduinoInterpreter.js');

console.log('🔍 State Machine vs Async/Await Pattern Comparison');
console.log('==================================================');

// Test both patterns with identical code structures
const analogReadCode = `
void setup() {
  Serial.begin(9600);
}
void loop() {
  int val = analogRead(A0);
  Serial.println(val);
  delay(100);
}`;

const digitalReadCode = `
void setup() {
  Serial.begin(9600);
  pinMode(2, INPUT);
}
void loop() {
  int val = digitalRead(2);
  Serial.println(val);
  delay(100);
}`;

async function testPattern(code, patternName, expectedPattern) {
    console.log(`\n📋 Testing ${patternName}:`);
    console.log('----------------------------');
    
    const ast = parse(code);
    const interpreter = new ArduinoInterpreter(ast, { 
        verbose: false,
        debug: false,
        maxLoopIterations: 1
    });
    
    let commandCount = 0;
    let requestsSent = 0;
    let responsesGiven = 0;
    let executionStopped = false;
    let lastCommand = null;
    
    interpreter.onCommand = (command) => {
        commandCount++;
        lastCommand = command;
        console.log(`📡 Command ${commandCount}: ${command.type}`);
        
        if (command.type.endsWith('_READ_REQUEST')) {
            requestsSent++;
            console.log(`   🔍 Request: ${command.type} (${command.requestId})`);
            console.log(`   🔍 Interpreter state: ${interpreter.state}`);
            
            // Simulate different response methods
            setTimeout(() => {
                responsesGiven++;
                console.log(`   📤 Sending response with resumeWithValue...`);
                
                const mockValue = expectedPattern === 'analog' ? 
                    Math.floor(Math.random() * 1024) : 
                    Math.random() > 0.5 ? 1 : 0;
                    
                const result = interpreter.resumeWithValue(command.requestId, mockValue);
                console.log(`   📥 resumeWithValue result: ${result}`);
                console.log(`   🔍 State after response: ${interpreter.state}`);
            }, 10);
        }
        
        if (command.type === 'PROGRAM_END' || command.type === 'ERROR') {
            executionStopped = true;
        }
    });
    
    interpreter.onError = (error) => {
        console.log(`❌ Error: ${error}`);
        executionStopped = true;
    };
    
    const startTime = Date.now();
    const startResult = interpreter.start();
    if (!startResult) {
        console.log('❌ Failed to start interpreter');
        return { success: false };
    }
    
    // Wait for execution to complete or timeout
    await new Promise(resolve => {
        const checkCompletion = () => {
            const elapsed = Date.now() - startTime;
            
            if (executionStopped || elapsed > 3000) {
                resolve();
            } else {
                setTimeout(checkCompletion, 100);
            }
        };
        setTimeout(checkCompletion, 100);
    });
    
    const finalExecutionStopped = executionStopped || lastCommand?.type === 'PROGRAM_END';
    
    console.log(`   ✅ Commands emitted: ${commandCount}`);
    console.log(`   ✅ Requests sent: ${requestsSent}`);
    console.log(`   ✅ Responses given: ${responsesGiven}`);
    console.log(`   ✅ Execution completed: ${finalExecutionStopped ? '✅' : '❌'}`);
    console.log(`   ✅ Final state: ${interpreter.state}`);
    
    return {
        success: finalExecutionStopped,
        commandCount,
        requestsSent,
        responsesGiven,
        patternName,
        finalState: interpreter.state
    };
}

async function runComparison() {
    const analogResult = await testPattern(analogReadCode, 'analogRead (Async/Await)', 'analog');
    const digitalResult = await testPattern(digitalReadCode, 'digitalRead (State Machine)', 'digital');
    
    console.log('\n🎯 PATTERN COMPARISON RESULTS:');
    console.log('===============================');
    
    console.log(`analogRead:  ${analogResult.success ? '✅' : '❌'} (${analogResult.commandCount} cmds, ${analogResult.requestsSent} req, ${analogResult.responsesGiven} resp)`);
    console.log(`digitalRead: ${digitalResult.success ? '✅' : '❌'} (${digitalResult.commandCount} cmds, ${digitalResult.requestsSent} req, ${digitalResult.responsesGiven} resp)`);
    
    if (analogResult.success && !digitalResult.success) {
        console.log('\n🔍 ANALYSIS: asyncRead works, digitalRead fails');
        console.log('The async/await pattern naturally continues execution after Promise resolution');
        console.log('The state machine pattern stops execution with ExecutionPausedError and needs restart');
        
        console.log('\n💡 SOLUTION NEEDED:');
        console.log('resumeWithValue() must restart execution for state machine functions');
        console.log('OR convert digitalRead/millis/micros to async/await pattern like analogRead');
        
    } else if (!analogResult.success && digitalResult.success) {
        console.log('\n🔍 ANALYSIS: digitalRead works, analogRead fails (unexpected)');
        
    } else if (!analogResult.success && !digitalResult.success) {
        console.log('\n🔍 ANALYSIS: Both patterns fail - fundamental issue');
        
    } else {
        console.log('\n🔍 ANALYSIS: Both patterns work - issue may be elsewhere');
    }
    
    return { analogResult, digitalResult };
}

// Run the comparison
runComparison().catch(error => {
    console.log(`❌ Comparison failed: ${error.message}`);
    console.log(error.stack);
});