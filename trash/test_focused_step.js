#!/usr/bin/env node

/**
 * Focused test: manually control interpreter to step through analogRead
 */

const { parse } = require('./ArduinoParser.js');
const { ASTInterpreter } = require('./ASTInterpreter.js');

const testCode = `
void setup() {
  int val = analogRead(A0);  // This should trigger request-response
  Serial.println(val);
}

void loop() {
}
`;

async function focusedTest() {
    console.log('🎯 Focused Step Test - analogRead during step execution');
    console.log('======================================================');
    
    const ast = parse(testCode);
    const interpreter = new ASTInterpreter(ast, { 
        verbose: false,
        stepDelay: 0,
        maxLoopIterations: 1
    });
    
    let currentStep = 0;
    let stepResultFound = false;
    
    interpreter.onCommand = (command) => {
        console.log(`[${currentStep}] 📡 ${command.type}${command.requestId ? ' (' + command.requestId + ')' : ''}`);
        
        if (command.type === 'ANALOG_READ_REQUEST') {
            console.log(`[${currentStep}]    🎯 State during request: ${interpreter.state}`);
            console.log(`[${currentStep}]    🎯 Previous state was: ${interpreter.previousExecutionState}`);
            
            // Respond with delay like playground
            setTimeout(() => {
                console.log(`[${currentStep}]    📤 Responding to analogRead...`);
                console.log(`[${currentStep}]    🎯 State before response: ${interpreter.state}`);
                interpreter.resumeWithValue(command.requestId, 512);
                console.log(`[${currentStep}]    🎯 State after response: ${interpreter.state}`);
                
                // THIS is the key test: after analogRead response during stepping,
                // state should be PAUSED (not RUNNING)
                if (interpreter.previousExecutionState === 'STEPPING' && interpreter.state === 'PAUSED') {
                    stepResultFound = true;
                    console.log(`[${currentStep}]    ✅ SUCCESS: Step state preserved!`);
                } else if (interpreter.previousExecutionState === 'STEPPING' && interpreter.state === 'RUNNING') {
                    console.log(`[${currentStep}]    ❌ ISSUE: Step became Running!`);
                } else {
                    console.log(`[${currentStep}]    ℹ️  Different scenario: ${interpreter.previousExecutionState} → ${interpreter.state}`);
                }
            }, 1);
        }
    };
    
    interpreter.onStateChange = (newState, oldState) => {
        console.log(`[${currentStep}] 🔄 ${oldState} → ${newState}`);
    };
    
    // Manual step-by-step execution
    console.log('\n1. Setting to STEPPING mode');
    interpreter.setState('STEPPING');
    
    console.log('\n2. Manually stepping through execution...');
    
    try {
        currentStep = 1;
        console.log(`\nStep ${currentStep}: Starting interpretAST()`);
        await interpreter.interpretAST();
        
        // Wait for any async responses
        await new Promise(resolve => setTimeout(resolve, 100));
        
    } catch (error) {
        if (error.name === 'ExecutionPausedError') {
            console.log(`Step ${currentStep}: Execution paused for: ${error.requestId}`);
        } else {
            console.log(`Step ${currentStep}: Error: ${error.message}`);
        }
    }
    
    console.log(`\n🎯 Final state: ${interpreter.state}`);
    console.log(`🎯 Step preservation test: ${stepResultFound ? '✅ PASSED' : '❌ FAILED'}`);
    
    return stepResultFound;
}

focusedTest().then(success => {
    console.log(`\n🏆 Final result: ${success ? '✅ STEP PRESERVATION WORKS!' : '❌ Step preservation failed'}`);
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 Test error:', error);
    process.exit(1);
});