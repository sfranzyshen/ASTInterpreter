#!/usr/bin/env node

/**
 * Working Arduino Interpreter Test - neopixel.js
 * Tests NeoPixel examples using the proven pattern
 */

console.log('🚀 Arduino Interpreter Test - neopixel.js');
console.log('===========================================');

// Load dependencies
const { Parser, parse, PlatformEmulation, ArduinoPreprocessor } = require('../../libs/ArduinoParser/src/ArduinoParser.js');
const { ASTInterpreter } = require('../../src/javascript/ASTInterpreter.js');

// Load neopixel.js file
let testFiles;
try {
    const neopixelData = require('../../neopixel.js');
    testFiles = neopixelData.neopixelFiles || neopixelData;
} catch (error) {
    console.error('❌ Failed to load neopixel.js:', error.message);
    process.exit(1);
}

console.log('✅ Dependencies loaded:', testFiles.length, 'tests from neopixel.js');

// Initialize platform emulation and preprocessor
const platformEmulation = new PlatformEmulation('ESP32_NANO');
const preprocessor = new ArduinoPreprocessor({
    defines: platformEmulation.getDefines(),
    libraries: platformEmulation.getLibraries()
});
console.log(`🎯 Platform: ${platformEmulation.currentPlatform.displayName}`);
console.log('🔧 Preprocessor initialized with platform context');

let successes = 0;
let failures = [];

// Test a single example using the proven pattern
function testExample(test, index) {
    return new Promise((resolve) => {
        const testName = test.name || `NeoPixel Test ${index + 1}`;
        const code = test.content || test.code;
        
        if (!code) {
            console.log(`[${index+1}/${testFiles.length}] Testing: ${testName}`);
            console.log(`  ❌ SKIPPED: No code content found`);
            resolve({
                success: false,
                name: testName,
                error: 'No code content',
                commandCount: 0
            });
            return;
        }
        
        console.log(`[${index+1}/${testFiles.length}] Testing: ${testName}`);
        
        try {
            // Step 1: Preprocess code with platform context
            const preprocessResult = preprocessor.preprocess(code);
            
            // Step 2: Parse preprocessed code
            const ast = parse(preprocessResult.processedCode);
            
            // Step 3: Create interpreter with proven settings
            const interpreter = new ASTInterpreter(ast, { 
                verbose: false, 
                stepDelay: 0, 
                maxLoopIterations: 3
            });
            
            // Step 4: Set up tracking
            let executionCompleted = false;
            let executionError = null;
            let commandCount = 0;
            
            // Track commands emitted during execution
            interpreter.onCommand = (command) => {
                commandCount++;
                
                // Handle request-response pattern for external data functions
                switch (command.type) {
                    case 'ANALOG_READ_REQUEST':
                        // Simulate realistic sensor data
                        const analogValue = Math.floor(Math.random() * 1024);
                        setTimeout(() => {
                            interpreter.handleResponse(command.requestId, analogValue);
                        }, 1); // Minimal delay to simulate async response
                        break;
                        
                    case 'DIGITAL_READ_REQUEST':  
                        const digitalState = Math.random() > 0.5 ? 1 : 0;
                        setTimeout(() => {
                            interpreter.handleResponse(command.requestId, digitalState);
                        }, 1);
                        break;
                        
                    case 'MILLIS_REQUEST':
                        setTimeout(() => {
                            interpreter.handleResponse(command.requestId, Date.now());
                        }, 1);
                        break;
                        
                    case 'MICROS_REQUEST':
                        setTimeout(() => {
                            interpreter.handleResponse(command.requestId, Date.now() * 1000);
                        }, 1);
                        break;
                        
                    case 'LIBRARY_METHOD_REQUEST':
                        // Handle library method requests (like numPixels)
                        let responseValue = 0;
                        switch (command.method) {
                            case 'numPixels': responseValue = 60; break;
                            case 'getBrightness': responseValue = 255; break;
                            case 'getPixelColor': responseValue = 0; break;
                            case 'canShow': responseValue = true; break;
                            default: responseValue = 0; break;
                        }
                        setTimeout(() => {
                            interpreter.handleResponse(command.requestId, responseValue);
                        }, 1);
                        break;
                }
                
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
            
            // Restore console temporarily 
            console.log = originalConsoleLog;
            
            // Suppress console again for execution
            console.log = () => {};
            
            // Step 5: Wait for execution to complete with timeout
            const timeoutDuration = 5000; // 5 seconds for NeoPixel tests
            const timeout = setTimeout(() => {
                if (!executionCompleted) {
                    executionError = `Execution timeout (${timeoutDuration/1000} seconds)`;
                    executionCompleted = true;
                    interpreter.stop();
                }
            }, timeoutDuration);
            
            // Check completion periodically (every 100ms)
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
                        } else if (typeof executionError === 'object' && executionError !== null) {
                            // Handle complex error objects
                            if (executionError.message) {
                                errorStr = executionError.message;
                            } else if (executionError.type) {
                                errorStr = `${executionError.type}: ${executionError.value || executionError.error || 'Unknown error'}`;
                            } else {
                                // Try to extract meaningful information from object
                                try {
                                    errorStr = JSON.stringify(executionError, null, 0);
                                    if (errorStr === '{}') {
                                        errorStr = `Error object: ${Object.keys(executionError).join(', ')}`;
                                    }
                                } catch (jsonError) {
                                    errorStr = `Complex error object (${typeof executionError})`;
                                }
                            }
                        } else {
                            errorStr = String(executionError);
                        }
                        console.log(`  ❌ FAILED: ${errorStr.substring(0, 80)}...`);
                        resolve({
                            success: false,
                            name: testName,
                            error: errorStr,
                            commandCount
                        });
                    } else {
                        console.log(`  ✅ PASSED (${commandCount} commands)`);
                        resolve({
                            success: true,
                            name: testName,
                            commandCount
                        });
                    }
                } else {
                    setTimeout(checkCompletion, 100); // Check every 100ms
                }
            };
            
            checkCompletion();
            
        } catch (error) {
            console.log(`  ❌ SETUP FAILED: ${error.message.substring(0, 60)}...`);
            resolve({
                success: false,
                name: testName,
                error: error.message,
                commandCount: 0
            });
        }
    });
}

// Run all tests sequentially 
async function runAllTests() {
    console.log('\n🧪 STARTING NEOPIXEL TESTS');
    console.log('===========================');
    
    const startTime = Date.now();
    
    for (let i = 0; i < testFiles.length; i++) {
        const result = await testExample(testFiles[i], i);
        
        if (result.success) {
            successes++;
        } else {
            failures.push(result);
        }
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    
    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL RESULTS - NEOPIXEL.JS TESTS');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${successes}`);
    console.log(`❌ Failed: ${failures.length}`);
    console.log(`📈 Success Rate: ${((successes / testFiles.length) * 100).toFixed(1)}%`);
    console.log(`⏱️  Duration: ${duration}s`);
    
    if (failures.length > 0) {
        console.log('\n🔍 FAILURE DETAILS:');
        failures.forEach((failure, idx) => {
            console.log(`${idx + 1}. ${failure.name}: ${failure.error.substring(0, 60)}...`);
        });
    }
    
    console.log('\n🎯 NeoPixel testing completed successfully!');
}

// Start the tests
runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
});