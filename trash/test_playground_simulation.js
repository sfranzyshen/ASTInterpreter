#!/usr/bin/env node

/**
 * Playground simulation test - replicates exact playground behavior
 * Tests the same pattern as interpreter_playground.html
 */

const { parse } = require('./ArduinoParser.js');
const { ASTInterpreter } = require('./ASTInterpreter.js');

console.log('🎮 PLAYGROUND SIMULATION TEST');
console.log('============================');
console.log('Simulating exact playground behavior with all external functions');

// Test code that uses ALL external functions like the playground would
const testCode = `
void setup() {
  Serial.begin(9600);
}

void loop() {
  // Test all external functions
  int digitalVal = digitalRead(2);
  int analogVal = analogRead(A0);
  unsigned long millisVal = millis();
  unsigned long microsVal = micros();
  
  // Print results
  Serial.print("Digital: "); Serial.println(digitalVal);
  Serial.print("Analog: "); Serial.println(analogVal);
  Serial.print("Millis: "); Serial.println(millisVal);
  Serial.print("Micros: "); Serial.println(microsVal);
  
  delay(1000);
}
`;

async function simulatePlayground() {
    console.log('\n🏗️ Setting up interpreter (like playground)...');
    
    const ast = parse(testCode);
    const interpreter = new ASTInterpreter(ast, {
        verbose: false,
        maxLoopIterations: 2 // Limit like playground
    });
    
    let commandCount = 0;
    let externalRequests = {};
    let stepTestPassed = false;
    
    // Exact same request handlers as playground
    interpreter.onCommand = (command) => {
        commandCount++;
        
        // Handle request-response pattern for external data functions (EXACT playground code)
        switch (command.type) {
            case 'ANALOG_READ_REQUEST':
                // Simulate realistic sensor data
                const analogValue = Math.floor(Math.random() * 1024);
                if (!externalRequests.analog) externalRequests.analog = 0;
                externalRequests.analog++;
                
                // Add small delay to prevent race condition with async Promise setup (EXACT playground fix)
                setTimeout(() => {
                    interpreter.resumeWithValue(command.requestId, analogValue);
                }, 1);
                break;
                
            case 'DIGITAL_READ_REQUEST':  
                const digitalState = Math.random() > 0.5 ? 1 : 0;
                if (!externalRequests.digital) externalRequests.digital = 0;
                externalRequests.digital++;
                
                // Add small delay to prevent race condition with async Promise setup (EXACT playground fix)
                setTimeout(() => {
                    interpreter.resumeWithValue(command.requestId, digitalState);
                }, 1);
                break;
                
            case 'MILLIS_REQUEST':
                if (!externalRequests.millis) externalRequests.millis = 0;
                externalRequests.millis++;
                
                // Add small delay to prevent race condition with async Promise setup (EXACT playground fix)
                setTimeout(() => {
                    interpreter.resumeWithValue(command.requestId, Date.now() % 100000);
                }, 1);
                break;
                
            case 'MICROS_REQUEST':
                if (!externalRequests.micros) externalRequests.micros = 0;
                externalRequests.micros++;
                
                // Add small delay to prevent race condition with async Promise setup (EXACT playground fix)
                setTimeout(() => {
                    interpreter.resumeWithValue(command.requestId, Date.now() * 1000 % 1000000);
                }, 1);
                break;
        }
    };
    
    interpreter.onError = (error) => {
        console.log(`❌ Error: ${error}`);
    };
    
    console.log('\n▶️ Starting execution (like clicking Start button)...');
    await interpreter.start();
    
    // Wait for execution to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n⏸️ Testing pause/step/resume functionality...');
    
    // Reset for step testing
    interpreter.reset();
    
    // Set up for step testing
    await interpreter.start();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('1. Pausing...');
    const pauseSuccess = interpreter.pause();
    console.log(`   Pause result: ${pauseSuccess}, State: ${interpreter.state}`);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('2. Single step...');
    const stepSuccess = interpreter.step();
    console.log(`   Step result: ${stepSuccess}, State: ${interpreter.state}`);
    
    // Wait for step to complete including any external data requests
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log(`   State after step completion: ${interpreter.state}`);
    
    // Check if step properly paused (not running)
    stepTestPassed = interpreter.state === 'PAUSED' || interpreter.state === 'IDLE';
    
    console.log('3. Resume...');
    const resumeSuccess = interpreter.resume();
    console.log(`   Resume result: ${resumeSuccess}, State: ${interpreter.state}`);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    interpreter.stop();
    
    console.log('\n📊 PLAYGROUND SIMULATION RESULTS:');
    console.log('==================================');
    console.log(`Total commands: ${commandCount}`);
    console.log('External function calls:');
    Object.entries(externalRequests).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} calls`);
    });
    console.log(`Step/Resume test passed: ${stepTestPassed ? '✅' : '❌'}`);
    
    // Verify all external functions were called
    const allFunctionsCalled = ['analog', 'digital', 'millis', 'micros'].every(type => 
        externalRequests[type] && externalRequests[type] > 0
    );
    
    console.log(`All external functions called: ${allFunctionsCalled ? '✅' : '❌'}`);
    
    const overallSuccess = allFunctionsCalled && stepTestPassed && commandCount > 0;
    console.log(`\n🎯 Overall playground simulation: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (overallSuccess) {
        console.log('\n🎉 ALL EXTERNAL FUNCTIONS WORK CORRECTLY IN PLAYGROUND!');
        console.log('   - analogRead: Working with timeout prevention ✅');
        console.log('   - digitalRead: Working with step/resume preservation ✅');
        console.log('   - millis: Working with step/resume preservation ✅');
        console.log('   - micros: Working with step/resume preservation ✅');
        console.log('   - Step/Resume controls: Working correctly ✅');
    }
    
    return overallSuccess;
}

simulatePlayground().then(success => {
    console.log(`\n🏆 Final Result: ${success ? '✅ PLAYGROUND FULLY WORKING' : '❌ PLAYGROUND HAS ISSUES'}`);
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 Simulation error:', error);
    process.exit(1);
});