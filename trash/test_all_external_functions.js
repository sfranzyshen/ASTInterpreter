#!/usr/bin/env node

/**
 * Comprehensive test of ALL external data functions
 * Tests digitalRead, analogRead, millis, micros to identify specific issues
 */

const { parse } = require('./ArduinoParser.js');
const { ArduinoInterpreter } = require('./ArduinoInterpreter.js');

// Test code that uses ALL external data functions
const testCode = `
void setup() {
  Serial.begin(9600);
}

void loop() {
  // Test digitalRead
  int digitalVal = digitalRead(2);
  Serial.print("Digital: ");
  Serial.println(digitalVal);
  
  // Test analogRead  
  int analogVal = analogRead(A0);
  Serial.print("Analog: ");
  Serial.println(analogVal);
  
  // Test millis
  unsigned long currentMillis = millis();
  Serial.print("Millis: ");
  Serial.println(currentMillis);
  
  // Test micros
  unsigned long currentMicros = micros();
  Serial.print("Micros: ");
  Serial.println(currentMicros);
  
  delay(1000);
}
`;

console.log('🧪 COMPREHENSIVE EXTERNAL FUNCTIONS TEST');
console.log('========================================');

async function testAllExternalFunctions() {
    try {
        const ast = parse(testCode);
        const interpreter = new ArduinoInterpreter(ast, { 
            verbose: false,
            stepDelay: 0,
            maxLoopIterations: 2
        });
        
        let requestsSeen = {};
        let responsesSent = {};
        let timeouts = {};
        let errors = [];
        
        interpreter.onCommand = (command) => {
            console.log(`📡 Command: ${command.type}${command.requestId ? ' (' + command.requestId + ')' : ''}`);
            
            // Track all external data requests
            if (command.type.endsWith('_REQUEST')) {
                const functionType = command.type.replace('_REQUEST', '');
                if (!requestsSeen[functionType]) requestsSeen[functionType] = 0;
                requestsSeen[functionType]++;
                
                console.log(`   🔍 Request #${requestsSeen[functionType]} for ${functionType}`);
                console.log(`   🎯 Current state: ${interpreter.state}`);
                console.log(`   🎯 Previous state: ${interpreter.previousExecutionState}`);
                
                // Handle each type of request with proper simulation
                let mockResponse;
                switch (command.type) {
                    case 'DIGITAL_READ_REQUEST':
                        mockResponse = Math.random() > 0.5 ? 1 : 0;
                        break;
                    case 'ANALOG_READ_REQUEST':
                        mockResponse = Math.floor(Math.random() * 1024);
                        break;
                    case 'MILLIS_REQUEST':
                        mockResponse = Date.now() % 100000; // Keep reasonable size
                        break;
                    case 'MICROS_REQUEST':
                        mockResponse = (Date.now() * 1000) % 1000000; // Keep reasonable size
                        break;
                    default:
                        mockResponse = 0;
                }
                
                // Use same 1ms setTimeout pattern as playground
                setTimeout(() => {
                    if (!responsesSent[functionType]) responsesSent[functionType] = 0;
                    responsesSent[functionType]++;
                    
                    console.log(`   📤 Sending response #${responsesSent[functionType]} for ${functionType}: ${mockResponse}`);
                    console.log(`   🎯 State before response: ${interpreter.state}`);
                    
                    const success = interpreter.resumeWithValue(command.requestId, mockResponse);
                    
                    console.log(`   🎯 State after response: ${interpreter.state}`);
                    console.log(`   ✅ Response success: ${success}`);
                }, 1); // Same 1ms delay as playground
            }
            
            if (command.type === 'ERROR') {
                errors.push(command.message);
                console.log(`❌ ERROR: ${command.message}`);
            }
        };
        
        interpreter.onError = (error) => {
            errors.push(error);
            console.log(`❌ INTERPRETER ERROR: ${error}`);
        };
        
        console.log('\n🚀 Starting interpreter...');
        await interpreter.start();
        
        // Wait for all async operations to complete
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        interpreter.stop();
        
        console.log('\n📊 FINAL RESULTS:');
        console.log('==================');
        console.log(`Requests seen:`, requestsSeen);
        console.log(`Responses sent:`, responsesSent);
        console.log(`Total errors: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log('\n❌ ERRORS ENCOUNTERED:');
            errors.forEach((error, idx) => {
                console.log(`${idx + 1}. ${error}`);
            });
        }
        
        // Verify all functions worked
        const expectedFunctions = ['DIGITAL_READ', 'ANALOG_READ', 'MILLIS', 'MICROS'];
        let allWorking = true;
        
        console.log('\n🔍 FUNCTION STATUS:');
        expectedFunctions.forEach(funcType => {
            const requests = requestsSeen[funcType] || 0;
            const responses = responsesSent[funcType] || 0;
            const working = requests > 0 && responses === requests;
            
            console.log(`${funcType}: ${working ? '✅' : '❌'} (${requests} requests, ${responses} responses)`);
            if (!working) allWorking = false;
        });
        
        console.log(`\n🎯 OVERALL RESULT: ${allWorking ? '✅ ALL FUNCTIONS WORKING' : '❌ SOME FUNCTIONS FAILED'}`);
        
        if (!allWorking) {
            console.log('\n🔍 ISSUES DETECTED:');
            expectedFunctions.forEach(funcType => {
                const requests = requestsSeen[funcType] || 0;
                const responses = responsesSent[funcType] || 0;
                
                if (requests === 0) {
                    console.log(`- ${funcType}: No requests generated (function not called or not working)`);
                } else if (responses !== requests) {
                    console.log(`- ${funcType}: Request/response mismatch (${requests} requests, ${responses} responses)`);
                }
            });
        }
        
        return allWorking;
        
    } catch (error) {
        console.error('❌ Test failed with exception:', error.message);
        return false;
    }
}

testAllExternalFunctions().then(success => {
    console.log(`\n🏆 Test Result: ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 Test suite error:', error);
    process.exit(1);
});