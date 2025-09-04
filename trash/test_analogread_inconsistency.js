#!/usr/bin/env node
/**
 * Test analogRead's architectural inconsistency
 * Check if setting unused state machine context causes issues
 */

const { parse } = require('./ArduinoParser.js');
const { ASTInterpreter } = require('./ASTInterpreter.js');

console.log('🔍 Testing analogRead Architectural Inconsistency');
console.log('================================================');

const testCode = `
void setup() {
  Serial.begin(9600);
}

void loop() {
  int val1 = analogRead(A0);
  int val2 = analogRead(A1);
  Serial.println(val1);
  Serial.println(val2);
  delay(100);
}
`;

async function testAnalogReadInconsistency() {
    const ast = parse(testCode);
    const interpreter = new ASTInterpreter(ast, { 
        verbose: false,
        debug: false,
        maxLoopIterations: 2
    });
    
    let commandCount = 0;
    let analogReadRequests = 0;
    let stateHistory = [];
    let suspendedFunctionHistory = [];
    
    // Monitor state changes
    const originalState = interpreter.state;
    Object.defineProperty(interpreter, 'state', {
        get() { return this._state; },
        set(value) { 
            stateHistory.push(value);
            this._state = value; 
        }
    });
    interpreter.state = originalState;
    
    interpreter.onCommand = (command) => {
        commandCount++;
        console.log(`📡 Command ${commandCount}: ${command.type}`);
        
        if (command.type === 'ANALOG_READ_REQUEST') {
            analogReadRequests++;
            console.log(`   🔍 State during analogRead: ${interpreter.state}`);
            console.log(`   🔍 suspendedFunction: ${interpreter.suspendedFunction}`);
            console.log(`   🔍 waitingForRequestId: ${interpreter.waitingForRequestId}`);
            
            suspendedFunctionHistory.push(interpreter.suspendedFunction);
            
            // Respond after short delay (simulating playground)
            setTimeout(() => {
                const mockValue = Math.floor(Math.random() * 1024);
                console.log(`   📤 Sending response: ${mockValue}`);
                interpreter.resumeWithValue(command.requestId, mockValue);
            }, 5);
        }
    };
    
    interpreter.onError = (error) => {
        console.log(`❌ Error: ${error}`);
    };
    
    const startResult = interpreter.start();
    if (!startResult) {
        console.log('❌ Failed to start interpreter');
        return;
    }
    
    // Wait for execution to complete
    await new Promise(resolve => {
        const checkCompletion = () => {
            if (interpreter.state === 'IDLE' || commandCount > 50) {
                resolve();
            } else {
                setTimeout(checkCompletion, 100);
            }
        };
        setTimeout(checkCompletion, 100);
    });
    
    console.log('\n🎯 ANALYSIS RESULTS:');
    console.log('====================');
    console.log(`Total commands: ${commandCount}`);
    console.log(`analogRead requests: ${analogReadRequests}`);
    console.log(`State transitions: ${stateHistory.join(' → ')}`);
    console.log(`suspendedFunction history: ${suspendedFunctionHistory.join(', ')}`);
    
    // Check for inconsistencies
    const hasWaitingForResponse = stateHistory.includes('WAITING_FOR_RESPONSE');
    const hasSuspendedFunctions = suspendedFunctionHistory.some(f => f === 'analogRead');
    
    console.log('\n🔍 INCONSISTENCY CHECK:');
    console.log('========================');
    console.log(`Sets WAITING_FOR_RESPONSE state: ${hasWaitingForResponse ? '✅' : '❌'}`);
    console.log(`Sets suspendedFunction: ${hasSuspendedFunctions ? '✅' : '❌'}`);
    console.log(`Uses async/await pattern: ✅ (hardcoded - from code analysis)`);
    
    if (hasWaitingForResponse && hasSuspendedFunctions) {
        console.log('\n⚠️  ARCHITECTURAL INCONSISTENCY CONFIRMED:');
        console.log('   analogRead sets state machine variables but uses async/await');
        console.log('   This creates unused state machine context');
    }
    
    // Check if execution worked despite inconsistency
    const executionWorked = analogReadRequests >= 2 && commandCount > 10;
    console.log(`\nExecution success: ${executionWorked ? '✅' : '❌'}`);
    
    return {
        executionWorked,
        hasInconsistency: hasWaitingForResponse && hasSuspendedFunctions,
        analogReadRequests,
        commandCount
    };
}

testAnalogReadInconsistency().then(result => {
    console.log('\n🏆 FINAL CONCLUSION:');
    console.log('=====================');
    if (result.executionWorked && result.hasInconsistency) {
        console.log('analogRead WORKS despite architectural inconsistency');
        console.log('The unused state machine context does not break functionality');
        console.log('BUT it creates confusion and maintenance issues');
    } else if (!result.executionWorked) {
        console.log('analogRead has FUNCTIONAL issues beyond architecture');
    } else {
        console.log('analogRead is architecturally consistent (unexpected)');
    }
}).catch(error => {
    console.log(`❌ Test failed: ${error.message}`);
});