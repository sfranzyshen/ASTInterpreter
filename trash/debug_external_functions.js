#!/usr/bin/env node

/**
 * Debug external functions to isolate the issue
 */

const { parse } = require('./ArduinoParser.js');
const { ArduinoInterpreter } = require('./ArduinoInterpreter.js');

console.log('🔍 EXTERNAL FUNCTION DEBUG TEST');
console.log('================================');

async function testSingleFunction(functionName, testCode) {
    console.log(`\n📋 Testing ${functionName}:`);
    console.log('----------------------------');
    
    try {
        const ast = parse(testCode);
        const interpreter = new ArduinoInterpreter(ast, { 
            verbose: false,
            stepDelay: 0,
            maxLoopIterations: 1 // Only one loop iteration
        });
        
        let requests = 0;
        let responses = 0;
        let completed = false;
        let error = null;
        
        interpreter.onCommand = (command) => {
            console.log(`📡 ${command.type}${command.requestId ? ' (' + command.requestId + ')' : ''}`);
            
            if (command.type.endsWith('_REQUEST')) {
                requests++;
                console.log(`   🎯 State: ${interpreter.state}, Previous: ${interpreter.previousExecutionState}`);
                
                // Mock response based on function type
                let mockValue;
                if (command.type === 'DIGITAL_READ_REQUEST') mockValue = 1;
                else if (command.type === 'ANALOG_READ_REQUEST') mockValue = 512;
                else if (command.type === 'MILLIS_REQUEST') mockValue = 1000;
                else if (command.type === 'MICROS_REQUEST') mockValue = 1000000;
                else mockValue = 0;
                
                setTimeout(() => {
                    responses++;
                    console.log(`   📤 Responding with: ${mockValue}`);
                    const success = interpreter.resumeWithValue(command.requestId, mockValue);
                    console.log(`   🎯 New state: ${interpreter.state}, Success: ${success}`);
                }, 1);
            }
            
            if (command.type === 'PROGRAM_END' || command.type === 'ERROR') {
                completed = true;
            }
            
            if (command.type === 'ERROR') {
                error = command.message;
            }
        };
        
        interpreter.onError = (err) => {
            error = err;
            completed = true;
        };
        
        await interpreter.start();
        
        // Wait for completion
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log(`   ✅ Requests: ${requests}, Responses: ${responses}`);
        console.log(`   ✅ Completed: ${completed}, Error: ${error || 'none'}`);
        
        return { requests, responses, completed, error };
        
    } catch (err) {
        console.log(`   ❌ Exception: ${err.message}`);
        return { requests: 0, responses: 0, completed: false, error: err.message };
    }
}

async function runTests() {
    const tests = [
        {
            name: 'digitalRead',
            code: `void setup() {} void loop() { int val = digitalRead(2); Serial.println(val); }`
        },
        {
            name: 'analogRead', 
            code: `void setup() {} void loop() { int val = analogRead(A0); Serial.println(val); }`
        },
        {
            name: 'millis',
            code: `void setup() {} void loop() { unsigned long val = millis(); Serial.println(val); }`
        },
        {
            name: 'micros',
            code: `void setup() {} void loop() { unsigned long val = micros(); Serial.println(val); }`
        }
    ];
    
    let results = {};
    for (const test of tests) {
        results[test.name] = await testSingleFunction(test.name, test.code);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    
    for (const [name, result] of Object.entries(results)) {
        const success = result.requests > 0 && result.responses === result.requests && !result.error;
        console.log(`${name}: ${success ? '✅' : '❌'} (${result.requests} req, ${result.responses} resp, error: ${result.error || 'none'})`);
    }
    
    return results;
}

runTests().catch(console.error);