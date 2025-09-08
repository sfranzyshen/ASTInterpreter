#!/usr/bin/env node

/**
 * Semantic Accuracy Test Suite - Arduino Examples
 * 
 * Tests all 79 Arduino examples for semantic accuracy using the CommandStreamValidator
 * This focuses on correctness of behavior, not just execution success.
 */

console.log('🎯 Arduino Examples Semantic Accuracy Test Suite');
console.log('==============================================');

// Load dependencies
const { Parser, parse, PlatformEmulation, ArduinoPreprocessor } = require('../../libs/ArduinoParser/src/ArduinoParser.js');
const { ASTInterpreter } = require('../../src/javascript/ASTInterpreter.js');
const { CommandStreamValidator } = require('../../src/javascript/command_stream_validator.js');

// Load test data
let testFiles;
try {
    const examplesData = require('../../examples.js');
    testFiles = examplesData.examplesFiles || examplesData;
} catch (error) {
    console.error('❌ Failed to load examples.js:', error.message);
    process.exit(1);
}

console.log('✅ Dependencies loaded:', testFiles.length, 'Arduino examples');

// Initialize platform emulation and preprocessor
const platformEmulation = new PlatformEmulation('ESP32_NANO');
const preprocessor = new ArduinoPreprocessor({
    defines: platformEmulation.getDefines(),
    libraries: platformEmulation.getLibraries()
});
console.log(`🎯 Platform: ${platformEmulation.currentPlatform.displayName}`);
console.log('🔧 Preprocessor initialized with platform context');

let totalTests = 0;
let semanticFailures = [];
let executionFailures = [];
let perfectTests = [];

// Test a single example with semantic validation
function testSemanticAccuracy(test, index) {
    return new Promise((resolve) => {
        const testName = test.name || `Example ${index + 1}`;
        const code = test.content || test.code;
        
        if (!code) {
            resolve({
                success: false,
                name: testName,
                error: 'No code content',
                semanticAccuracy: 0,
                executionSuccess: false
            });
            return;
        }
        
        console.log(`[${index+1}/${testFiles.length}] Analyzing: ${testName}`);
        
        try {
            // Step 1: Preprocess code with platform context
            const preprocessResult = preprocessor.preprocess(code);
            
            // Step 2: Parse preprocessed code
            const ast = parse(preprocessResult.processedCode);
            
            // Step 3: Create interpreter with proven settings
            const interpreter = new ASTInterpreter(ast, { 
                verbose: false, 
                debug: false, 
                stepDelay: 0, 
                maxLoopIterations: 3
            });
            
            // Step 4: Create semantic validator
            const validator = new CommandStreamValidator({
                validateSerial: true,
                validateTiming: true,
                validatePins: true,
                validateVariables: true,
                validateLoops: true,
                maxExpectedLoopIterations: 3
            });
            
            // Step 4: Set up tracking
            let executionCompleted = false;
            let executionError = null;
            let commandCount = 0;
            
            // Capture commands for semantic validation
            interpreter.onCommand = (command) => {
                commandCount++;
                validator.captureCommand(command);
                
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
            
            interpreter.onError = (error) => {
                executionError = error;
                executionCompleted = true;
                
                // Also capture error for semantic analysis
                validator.captureCommand({
                    type: 'ERROR',
                    message: typeof error === 'string' ? error : error.message,
                    error: error
                });
            };
            
            // Step 5: Execute with console suppression
            const originalConsoleLog = console.log;
            const originalConsoleError = console.error;
            console.log = () => {};
            console.error = () => {}; // Also suppress error messages for clean analysis
            
            const startResult = interpreter.start();
            if (!startResult) {
                console.log = originalConsoleLog;
                console.error = originalConsoleError;
                throw new Error('Failed to start interpreter');
            }
            
            // Step 6: Wait for completion with timeout
            const timeoutDuration = 10000; // 10 seconds for Arduino examples
            const timeout = setTimeout(() => {
                if (!executionCompleted) {
                    executionError = `Execution timeout (${timeoutDuration/1000} seconds)`;
                    executionCompleted = true;
                    interpreter.stop();
                    
                    validator.captureCommand({
                        type: 'TIMEOUT',
                        message: executionError
                    });
                }
            }, timeoutDuration);
            
            // Step 7: Check completion periodically
            const checkCompletion = () => {
                if (executionCompleted) {
                    console.log = originalConsoleLog;
                    console.error = originalConsoleError;
                    clearTimeout(timeout);
                    
                    // Generate semantic analysis report
                    const report = validator.generateReport();
                    const executionSuccess = !executionError;
                    const semanticAccuracy = report.summary.semanticAccuracy.percentage;
                    
                    // Determine test classification
                    let classification = '';
                    if (executionSuccess && semanticAccuracy >= 95) {
                        classification = '✅ PERFECT';
                        perfectTests.push({
                            name: testName,
                            accuracy: semanticAccuracy,
                            commands: commandCount
                        });
                    } else if (executionSuccess && semanticAccuracy >= 70) {
                        classification = '⚠️  SEMANTIC ISSUES';
                        semanticFailures.push({
                            name: testName,
                            accuracy: semanticAccuracy,
                            errors: report.summary.errors,
                            warnings: report.summary.warnings,
                            report: report
                        });
                    } else if (executionSuccess) {
                        classification = '❌ POOR SEMANTICS';
                        semanticFailures.push({
                            name: testName,
                            accuracy: semanticAccuracy,
                            errors: report.summary.errors,
                            warnings: report.summary.warnings,
                            report: report
                        });
                    } else {
                        classification = '💥 EXECUTION FAILED';
                        executionFailures.push({
                            name: testName,
                            error: executionError,
                            accuracy: semanticAccuracy,
                            report: report
                        });
                    }
                    
                    console.log(`  ${classification} (${semanticAccuracy}% semantic accuracy, ${commandCount} commands)`);
                    
                    resolve({
                        success: executionSuccess,
                        name: testName,
                        error: executionError,
                        semanticAccuracy: semanticAccuracy,
                        executionSuccess: executionSuccess,
                        commandCount: commandCount,
                        report: report,
                        classification: classification
                    });
                } else {
                    setTimeout(checkCompletion, 100);
                }
            };
            
            checkCompletion();
            
        } catch (error) {
            resolve({
                success: false,
                name: testName,
                error: error.message,
                semanticAccuracy: 0,
                executionSuccess: false,
                commandCount: 0
            });
        }
    });
}

// Run all semantic accuracy tests
async function runSemanticTests() {
    console.log('\n🔬 STARTING ARDUINO EXAMPLES SEMANTIC ACCURACY ANALYSIS');
    console.log('======================================================');
    
    const startTime = Date.now();
    let totalAccuracy = 0;
    
    for (let i = 0; i < testFiles.length; i++) {
        const result = await testSemanticAccuracy(testFiles[i], i);
        totalTests++;
        totalAccuracy += result.semanticAccuracy || 0;
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    const averageAccuracy = totalTests > 0 ? (totalAccuracy / totalTests).toFixed(1) : 0;
    
    // Generate comprehensive report
    console.log('\n' + '='.repeat(70));
    console.log('📊 ARDUINO EXAMPLES SEMANTIC ACCURACY ANALYSIS RESULTS');
    console.log('='.repeat(70));
    console.log(`📈 Overall Semantic Accuracy: ${averageAccuracy}%`);
    console.log(`✅ Perfect Tests: ${perfectTests.length} (${((perfectTests.length / totalTests) * 100).toFixed(1)}%)`);
    console.log(`⚠️  Semantic Issues: ${semanticFailures.length} (${((semanticFailures.length / totalTests) * 100).toFixed(1)}%)`);
    console.log(`💥 Execution Failures: ${executionFailures.length} (${((executionFailures.length / totalTests) * 100).toFixed(1)}%)`);
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`⏱️  Analysis Duration: ${duration}s`);
    
    if (perfectTests.length > 0) {
        console.log('\n🏆 PERFECT TESTS (95%+ Semantic Accuracy):');
        const displayCount = Math.min(perfectTests.length, 15);
        perfectTests.slice(0, displayCount).forEach((test, idx) => {
            console.log(`  ${idx + 1}. ${test.name}: ${test.accuracy}% (${test.commands} commands)`);
        });
        if (perfectTests.length > 15) {
            console.log(`  ... and ${perfectTests.length - 15} more perfect tests`);
        }
    }
    
    if (semanticFailures.length > 0) {
        console.log('\n⚠️  SEMANTIC ACCURACY ISSUES:');
        const displayCount = Math.min(semanticFailures.length, 10);
        semanticFailures.slice(0, displayCount).forEach((test, idx) => {
            console.log(`  ${idx + 1}. ${test.name}: ${test.accuracy}% (${test.errors} errors, ${test.warnings} warnings)`);
        });
        if (semanticFailures.length > 10) {
            console.log(`  ... and ${semanticFailures.length - 10} more tests with semantic issues`);
        }
    }
    
    if (executionFailures.length > 0) {
        console.log('\n💥 EXECUTION FAILURES:');
        const displayCount = Math.min(executionFailures.length, 8);
        executionFailures.slice(0, displayCount).forEach((test, idx) => {
            const errorMsg = typeof test.error === 'string' ? test.error : test.error?.message || 'Unknown error';
            console.log(`  ${idx + 1}. ${test.name}: ${errorMsg.substring(0, 50)}...`);
        });
        if (executionFailures.length > 8) {
            console.log(`  ... and ${executionFailures.length - 8} more execution failures`);
        }
    }
    
    // Provide detailed analysis for worst semantic accuracy cases
    if (semanticFailures.length > 0) {
        console.log('\n🔍 DETAILED ANALYSIS - WORST SEMANTIC ACCURACY:');
        const worstCases = semanticFailures
            .sort((a, b) => a.accuracy - b.accuracy)
            .slice(0, 5);
            
        worstCases.forEach((test, idx) => {
            console.log(`\n${idx + 1}. ${test.name} (${test.accuracy}% accuracy):`);
            
            if (test.report.issues.errors.length > 0) {
                console.log('   Errors:');
                test.report.issues.errors.slice(0, 3).forEach(error => {
                    console.log(`     • [${error.type}] ${error.message}`);
                });
            }
            
            if (test.report.issues.warnings.length > 0) {
                console.log('   Warnings:');
                test.report.issues.warnings.slice(0, 3).forEach(warning => {
                    console.log(`     • [${warning.type}] ${warning.message}`);
                });
            }
        });
    }
    
    console.log('\n🎯 Arduino examples semantic accuracy analysis completed!');
    console.log('Use this data to identify and fix semantic correctness issues in the examples.');
}

// Start the semantic analysis
runSemanticTests().catch(error => {
    console.error('❌ Semantic analysis failed:', error.message);
    process.exit(1);
});