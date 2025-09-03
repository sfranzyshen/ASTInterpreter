#!/usr/bin/env node

/**
 * Comprehensive verification that both fixes work:
 * 1. setTimeout race condition fix (prevents analogRead timeouts)
 * 2. Step/resume state preservation (step doesn't become resume after analogRead)
 */

const { parse } = require('./ArduinoParser.js');
const { ArduinoInterpreter } = require('./ArduinoInterpreter.js');

// The problematic analogReadSerial.ino example
const analogReadSerial = `
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
}

void loop() {
  // read the input on analog pin 0:
  int sensorValue = analogRead(A0);
  // Convert the analog reading (which goes from 0 - 1023) to a voltage (0 - 5V):
  float voltage = sensorValue * (5.0 / 1023.0);
  // print out the value you read:
  Serial.println(voltage);
}
`;

console.log('🔧 COMPREHENSIVE VERIFICATION - Both Fixes');
console.log('==========================================');
console.log('1. Timeout prevention (setTimeout 1ms delay)');
console.log('2. Step/resume state preservation');

async function comprehensiveTest() {
    let testResults = {
        timeoutPrevention: false,
        statePreservation: false
    };
    
    try {
        const ast = parse(analogReadSerial);
        const interpreter = new ArduinoInterpreter(ast, { 
            verbose: false,
            stepDelay: 0,
            maxLoopIterations: 3
        });
        
        let requestCount = 0;
        let responsesGiven = 0;
        let stateTransitions = [];
        let hasTimeoutError = false;
        
        interpreter.onCommand = (command) => {
            if (command.type === 'ERROR') {
                if (command.message && command.message.includes('timeout')) {
                    hasTimeoutError = true;
                    console.log('❌ TIMEOUT ERROR:', command.message);
                }
            }
            
            if (command.type === 'ANALOG_READ_REQUEST') {
                requestCount++;
                console.log(`📡 analogRead request ${requestCount}: ${command.requestId}`);
                
                // Apply the playground fix: setTimeout 1ms delay
                setTimeout(() => {
                    responsesGiven++;
                    const mockValue = Math.floor(Math.random() * 1024);
                    console.log(`📤 Responding with value: ${mockValue}`);
                    interpreter.resumeWithValue(command.requestId, mockValue);
                }, 1); // This prevents the race condition
            }
        };
        
        interpreter.onStateChange = (newState, oldState) => {
            stateTransitions.push({ from: oldState, to: newState });
            console.log(`🔄 ${oldState} → ${newState}`);
        };
        
        interpreter.onError = (error) => {
            if (error && error.includes && error.includes('timeout')) {
                hasTimeoutError = true;
                console.log('❌ INTERPRETER ERROR:', error);
            }
        };
        
        // Test 1: Timeout Prevention
        console.log('\n📋 TEST 1: Timeout Prevention');
        console.log('Starting full execution to test for timeouts...');
        
        await interpreter.start();
        
        // Wait for execution to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        testResults.timeoutPrevention = !hasTimeoutError && requestCount > 0 && responsesGiven === requestCount;
        console.log(`✅ No timeouts: ${!hasTimeoutError}`);
        console.log(`✅ Requests made: ${requestCount}`);
        console.log(`✅ Responses given: ${responsesGiven}`);
        console.log(`✅ All requests answered: ${responsesGiven === requestCount}`);
        
        interpreter.stop();
        interpreter.reset();
        
        // Test 2: Step/Resume State Preservation
        console.log('\n📋 TEST 2: Step/Resume State Preservation');
        
        // Start fresh
        stateTransitions = [];
        let stepStatePreserved = false;
        
        console.log('Starting execution...');
        await interpreter.start();
        
        // Let it reach a steady state
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('Pausing...');
        interpreter.pause();
        await new Promise(resolve => setTimeout(resolve, 50));
        
        console.log('Stepping (should remain in step mode after analogRead)...');
        interpreter.step();
        
        // Wait for step to complete including any analogRead responses
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log(`Final state after step: ${interpreter.state}`);
        
        // Check if we properly returned to PAUSED after handling analogRead during stepping
        stepStatePreserved = stateTransitions.some(t => 
            t.from === 'WAITING_FOR_RESPONSE' && t.to === 'PAUSED'
        );
        
        testResults.statePreservation = stepStatePreserved;
        console.log(`✅ Step state preserved: ${stepStatePreserved}`);
        
        interpreter.stop();
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
    
    return testResults;
}

comprehensiveTest().then(results => {
    console.log('\n🎯 FINAL RESULTS');
    console.log('================');
    console.log(`Timeout Prevention: ${results.timeoutPrevention ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`State Preservation: ${results.statePreservation ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = results.timeoutPrevention && results.statePreservation;
    console.log(`\n🏆 Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
        console.log('\n🎉 SUCCESS! Both fixes are working correctly:');
        console.log('   - analogRead timeout errors are prevented');
        console.log('   - Step mode is preserved after external data responses');
        console.log('   - The playground should now work perfectly!');
    }
    
    process.exit(allPassed ? 0 : 1);
}).catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
});