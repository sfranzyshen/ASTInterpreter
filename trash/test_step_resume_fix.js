#!/usr/bin/env node

/**
 * Test the step/resume fix for external data requests
 * Verifies that stepping mode is properly preserved when handling analogRead/digitalRead
 */

const { parse } = require('./ArduinoParser.js');
const { ArduinoInterpreter } = require('./ArduinoInterpreter.js');

// Test code that uses analogRead - this should trigger the external data request pattern
const testCode = `
void setup() {
  Serial.begin(9600);
}

void loop() {
  int value = analogRead(A0);
  Serial.println(value);
  delay(1000);
}
`;

console.log('🧪 Testing Step/Resume Fix for External Data Requests');
console.log('====================================================');

async function testStepResumeLogic() {
    try {
        // Parse the test code
        const ast = parse(testCode);
        const interpreter = new ArduinoInterpreter(ast, { 
            verbose: false,
            stepDelay: 0,
            maxLoopIterations: 2
        });
        
        let commandCount = 0;
        let stateChanges = [];
        
        // Track all commands and state changes
        interpreter.onCommand = (command) => {
            commandCount++;
            console.log(`Command ${commandCount}: ${command.type}${command.pin !== undefined ? ` (pin ${command.pin})` : ''}`);
            
            // Handle request-response pattern with 1ms delay (like the playground fix)
            if (command.type === 'ANALOG_READ_REQUEST') {
                setTimeout(() => {
                    interpreter.resumeWithValue(command.requestId, 512); // Mock analog value
                }, 1);
            } else if (command.type === 'DIGITAL_READ_REQUEST') {
                setTimeout(() => {
                    interpreter.resumeWithValue(command.requestId, 1); // Mock digital value
                }, 1);
            } else if (command.type === 'MILLIS_REQUEST') {
                setTimeout(() => {
                    interpreter.resumeWithValue(command.requestId, Date.now() % 10000); // Mock millis value
                }, 1);
            }
        };
        
        // Track state changes
        interpreter.onStateChange = (newState, oldState) => {
            stateChanges.push({ from: oldState, to: newState, time: Date.now() });
            console.log(`State change: ${oldState} → ${newState}`);
        };
        
        console.log('\n1. Starting interpreter...');
        await interpreter.start();
        
        // Let it run a bit to reach loop phase
        await new Promise(resolve => setTimeout(resolve, 50));
        
        console.log('\n2. Pausing execution...');
        const pauseResult = interpreter.pause();
        console.log(`Pause result: ${pauseResult}, Current state: ${interpreter.state}`);
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        console.log('\n3. Testing STEP operation (should stay in stepping mode after analogRead)...');
        const stepResult = interpreter.step();
        console.log(`Step result: ${stepResult}, Current state: ${interpreter.state}`);
        
        // Wait for step to complete (including any external data requests)
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`After step completion, Current state: ${interpreter.state}`);
        
        console.log('\n4. Testing another STEP operation...');
        const step2Result = interpreter.step();
        console.log(`Step 2 result: ${step2Result}, Current state: ${interpreter.state}`);
        
        // Wait for second step
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`After step 2 completion, Current state: ${interpreter.state}`);
        
        console.log('\n5. Testing RESUME operation...');
        const resumeResult = interpreter.resume();
        console.log(`Resume result: ${resumeResult}, Current state: ${interpreter.state}`);
        
        // Wait a bit for resume to take effect
        await new Promise(resolve => setTimeout(resolve, 100));
        
        interpreter.stop();
        
        console.log('\n📊 TEST RESULTS:');
        console.log(`Total commands: ${commandCount}`);
        console.log('State changes:', stateChanges.map(sc => `${sc.from}→${sc.to}`).join(', '));
        
        // Verify expected behavior
        const hasAnalogRequests = stateChanges.some(sc => sc.to === 'WAITING_FOR_RESPONSE');
        const returnsToProperState = stateChanges.some(sc => sc.from === 'WAITING_FOR_RESPONSE' && sc.to === 'PAUSED');
        
        console.log(`\n✅ Found analog requests: ${hasAnalogRequests}`);
        console.log(`✅ Returns to proper state after requests: ${returnsToProperState}`);
        
        if (hasAnalogRequests && returnsToProperState) {
            console.log('\n🎉 SUCCESS: Step/Resume fix working correctly!');
            console.log('   - External data requests are handled properly');
            console.log('   - Stepping mode is preserved after analogRead responses');
            return true;
        } else {
            console.log('\n❌ ISSUE: Step/Resume fix may not be working correctly');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

// Run the test
testStepResumeLogic().then(success => {
    if (success) {
        console.log('\n🏆 All tests passed - Step/Resume fix is working!');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some issues detected - may need further investigation');
        process.exit(1);
    }
}).catch(error => {
    console.error('💥 Test suite error:', error);
    process.exit(1);
});