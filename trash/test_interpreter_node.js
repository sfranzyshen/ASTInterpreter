#!/usr/bin/env node

console.log('🚀 Arduino Interpreter Test');
console.log('============================');

const fs = require('fs');

// Load parser (Node.js style - now works!)
console.log('📖 Loading parser...');
const { Parser, parse, prettyPrintAST } = require('./parser.js');
console.log('✅ Parser loaded');

// Load interpreter (Node.js style)
console.log('📖 Loading interpreter...');
const { ArduinoInterpreter } = require('./interpreter.js');
console.log('✅ Interpreter loaded');

// Load examples
console.log('📖 Loading examples...');
const examples = require('./extracted_examples.js');
console.log('✅ Examples loaded:', examples.length, 'total');

console.log('\n🧪 TESTING INTERPRETER');
console.log('========================');

let successes = 0;
let failures = [];

// Test all examples to see our Phase 4 improvements
const testCount = examples.length;
const examplesToTest = examples;

// Helper function to test a single example
function testExample(example, index) {
    return new Promise((resolve) => {
        console.log(`\n[${index+1}/${testCount}] Testing: ${example.name}`);
        
        try {
            // Step 1: Parse the code
            const ast = parse(example.code);
            console.log('  ✅ Parsed successfully');
            
            // Step 2: Create interpreter with limited loop iterations
            const interpreter = new ArduinoInterpreter(ast, { 
                verbose: false, // Disable verbose to reduce output
                stepDelay: 0, // No delay for fast testing
                maxLoopIterations: 3 // Limit loop() to 3 iterations for testing
            });
            console.log('  ✅ Interpreter created');
            
            // Step 3: Set up error and completion tracking
            let executionCompleted = false;
            let executionError = null;
            let commandCount = 0;
            
            // Track commands emitted during execution
            interpreter.onCommand = (command) => {
                commandCount++;
                if (command.type === 'PROGRAM_END' || command.type === 'ERROR' || command.type === 'LOOP_LIMIT_REACHED') {
                    executionCompleted = true;
                    if (command.type === 'ERROR') {
                        executionError = command.message;
                    }
                }
            };
            
            // Track errors
            interpreter.onError = (error) => {
                executionError = error;
                executionCompleted = true;
            };
            
            // Step 4: Silence console output during execution
            const originalConsoleLog = console.log;
            console.log = () => {}; // Suppress debug output
            
            // Start execution
            const startResult = interpreter.start();
            if (!startResult) {
                console.log = originalConsoleLog; // Restore console
                throw new Error('Failed to start interpreter');
            }
            
            // Restore console for our output
            console.log = originalConsoleLog;
            console.log('  ✅ Execution started');
            
            // Suppress console again
            console.log = () => {};
            
            // Step 5: Wait for execution to complete or timeout
            // Some examples like Blink.ino have delay(1000) calls that need more time
            const timeoutDuration = example.name.includes('Blink') || 
                                  example.name.includes('HackingButtons') ? 10000 : 5000;
            const timeout = setTimeout(() => {
                if (!executionCompleted) {
                    executionError = `Execution timeout (${timeoutDuration/1000} seconds)`;
                    executionCompleted = true;
                    interpreter.stop();
                }
            }, timeoutDuration);
            
            // Check completion periodically
            const checkCompletion = () => {
                if (executionCompleted) {
                    console.log = originalConsoleLog; // Restore console
                    clearTimeout(timeout);
                    
                    if (executionError) {
                        let errorStr;
                        if (typeof executionError === 'string') {
                            errorStr = executionError;
                        } else if (executionError instanceof Error) {
                            errorStr = executionError.message;
                        } else if (executionError && typeof executionError === 'object') {
                            errorStr = JSON.stringify(executionError);
                        } else {
                            errorStr = String(executionError);
                        }
                        console.log('  ❌ EXECUTION FAILED:', errorStr.substring(0, 120) + '...');
                        resolve({
                            success: false,
                            name: example.name,
                            error: errorStr,
                            commandCount
                        });
                    } else {
                        console.log(`  ✅ SUCCESS (${commandCount} commands emitted)`);
                        resolve({
                            success: true,
                            name: example.name,
                            commandCount
                        });
                    }
                } else {
                    setTimeout(checkCompletion, 100); // Check every 100ms
                }
            };
            
            checkCompletion();
            
        } catch (error) {
            console.log = originalConsoleLog || console.log; // Restore console if needed
            console.log('  ❌ SETUP FAILED:', error.message.substring(0, 80) + '...');
            resolve({
                success: false,
                name: example.name,
                error: error.message,
                commandCount: 0
            });
        }
    });
}

// Run tests sequentially to avoid interference
async function runAllTests() {
    for (let i = 0; i < testCount; i++) {
        const result = await testExample(examples[i], i);
        
        if (result.success) {
            successes++;
        } else {
            failures.push({
                name: result.name,
                error: result.error
            });
        }
    }
    
    // Print final results
    console.log('\n📊 RESULTS');
    console.log('===========');
    console.log('Successes:', successes);
    console.log('Failures:', failures.length);
    console.log('Success Rate:', Math.round(successes / testCount * 100) + '%');

    if (failures.length > 0) {
        console.log('\n❌ Failed Examples:');
        failures.forEach(f => console.log('  -', f.name + ':', f.error.substring(0, 60) + '...'));
    }

    console.log('\n🎯 Analysis:');
    if (successes === testCount) {
        console.log('✅ All examples executed successfully!');
        console.log('✅ Arduino interpreter is working correctly');
    } else {
        console.log('❌ Some examples failed execution');
        console.log('💡 Check error messages above for debugging');
    }
}

// Start the test suite
runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
});