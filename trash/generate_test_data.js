#!/usr/bin/env node

/**
 * generate_test_data.js - Generate test data for cross-platform validation
 * 
 * This script loads all 135 Arduino examples from the JavaScript test suite,
 * runs them through the JavaScript interpreter to capture command streams,
 * generates compact AST data, and saves everything for C++ validation.
 * 
 * Output: test_data/ directory with:
 * - example_<index>.ast - Compact AST binary data
 * - example_<index>.commands - JavaScript command stream JSON
 * - example_<index>.meta - Example metadata (name, content)
 * 
 * Usage: node generate_test_data.js
 */

const fs = require('fs');
const path = require('path');

// Load JavaScript modules
const { parse, exportCompactAST } = require('./ArduinoParser.js');
const { ArduinoInterpreter } = require('./ArduinoInterpreter.js');

// Load test data
const { examplesFiles } = require('./examples.js');
const { oldTestFiles } = require('./old_test.js');
const { neopixelFiles } = require('./neopixel.js');

// =============================================================================
// COMMAND STREAM CAPTURE
// =============================================================================

/**
 * Capture command stream from JavaScript interpreter
 */
function captureCommandStream(example, maxLoopIterations = 3) {
    return new Promise((resolve) => {
        try {
            // Parse Arduino code
            const code = example.content || example.code;
            const ast = parse(code);
            
            // Create interpreter with test settings
            const interpreter = new ArduinoInterpreter(ast, { 
                verbose: false,
                debug: false,
                stepDelay: 0,
                maxLoopIterations: maxLoopIterations
            });
            
            // Set up command capture
            const commands = [];
            let executionCompleted = false;
            let executionError = null;
            
            interpreter.onCommand = (command) => {
                // Extract all command properties except 'type' into data field
                const { type, ...data } = command;
                commands.push({
                    type,
                    data,
                    timestamp: Date.now()
                });
                
                if (command.type === 'PROGRAM_END' || command.type === 'ERROR' || command.type === 'LOOP_LIMIT_REACHED') {
                    executionCompleted = true;
                }
            };
            
            interpreter.onError = (error) => {
                commands.push({
                    type: 'ERROR',
                    data: { message: error },
                    timestamp: Date.now()
                });
                executionError = error;
                executionCompleted = true;
            };
            
            // Set up mock response handler for external data functions
            interpreter.responseHandler = (request) => {
                setTimeout(() => {
                    let mockValue = 0;
                    switch (request.type) {
                        case 'analogRead': mockValue = Math.floor(Math.random() * 1024); break;
                        case 'digitalRead': mockValue = Math.random() > 0.5 ? 1 : 0; break;
                        case 'millis': mockValue = Date.now() % 100000; break;
                        case 'micros': mockValue = Date.now() * 1000 % 1000000; break;
                        default: mockValue = 0;
                    }
                    interpreter.handleResponse(request.id, mockValue);
                }, Math.random() * 10);
            };
            
            // Suppress console output during execution
            const originalConsoleLog = console.log;
            console.log = () => {};
            
            // Start execution
            const startResult = interpreter.start();
            if (!startResult) {
                console.log = originalConsoleLog;
                throw new Error('Failed to start interpreter');
            }
            
            // Wait for completion with timeout
            const timeoutDuration = 30000; // Extended to 30 seconds
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
                    console.log = originalConsoleLog;
                    clearTimeout(timeout);
                    
                    resolve({
                        success: !executionError,
                        commands: commands,
                        commandCount: commands.length,
                        error: executionError
                    });
                } else {
                    setTimeout(checkCompletion, 100);
                }
            };
            
            checkCompletion();
            
        } catch (error) {
            resolve({
                success: false,
                commands: [],
                commandCount: 0,
                error: error.message
            });
        }
    });
}

// =============================================================================
// TEST DATA GENERATION
// =============================================================================

/**
 * Process single test example
 */
async function processExample(example, index, outputDir) {
    const baseName = `example_${String(index).padStart(3, '0')}`;
    
    console.log(`[${index + 1}] Processing: ${example.name}`);
    
    try {
        // Step 1: Parse and generate compact AST
        const code = example.content || example.code;
        const ast = parse(code);
        const compactAST = exportCompactAST(ast);
        
        // Step 2: Capture JavaScript command stream
        const captureResult = await captureCommandStream(example);
        
        // Step 3: Save AST binary data
        const astFile = path.join(outputDir, `${baseName}.ast`);
        fs.writeFileSync(astFile, Buffer.from(compactAST));
        
        // Step 4: Save command stream JSON
        const commandsFile = path.join(outputDir, `${baseName}.commands`);
        fs.writeFileSync(commandsFile, JSON.stringify(captureResult.commands, null, 2));
        
        // Step 5: Save metadata
        const metaFile = path.join(outputDir, `${baseName}.meta`);
        const metadata = [
            `name=${example.name}`,
            `success=${captureResult.success}`,
            `commandCount=${captureResult.commandCount}`,
            `error=${captureResult.error || ''}`,
            `astSize=${compactAST.byteLength}`,
            `content=${code}`
        ].join('\\n');
        fs.writeFileSync(metaFile, metadata);
        
        return {
            name: example.name,
            success: captureResult.success,
            commandCount: captureResult.commandCount,
            astSize: compactAST.byteLength,
            error: captureResult.error
        };
        
    } catch (error) {
        console.error(`  ERROR: ${error.message}`);
        return {
            name: example.name,
            success: false,
            commandCount: 0,
            astSize: 0,
            error: error.message
        };
    }
}

/**
 * Generate all test data
 */
async function generateTestData() {
    console.log('=== Arduino AST Interpreter - Test Data Generation ===');
    console.log('');
    
    // Create output directory
    const outputDir = 'test_data';
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    
    // Collect all test examples
    const allExamples = [
        ...examplesFiles.map(ex => ({ ...ex, source: 'examples' })),
        ...oldTestFiles.map(ex => ({ ...ex, source: 'old_test' })),
        ...neopixelFiles.map(ex => ({ ...ex, source: 'neopixel' }))
    ];
    
    console.log(`Processing ${allExamples.length} test examples...`);
    console.log(`- examples.js: ${examplesFiles.length} tests`);
    console.log(`- old_test.js: ${oldTestFiles.length} tests`);
    console.log(`- neopixel.js: ${neopixelFiles.length} tests`);
    console.log('');
    
    // Process each example
    const results = [];
    for (let i = 0; i < allExamples.length; i++) {
        const result = await processExample(allExamples[i], i, outputDir);
        results.push(result);
    }
    
    // Generate summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalCommands = results.reduce((sum, r) => sum + r.commandCount, 0);
    const totalAstSize = results.reduce((sum, r) => sum + r.astSize, 0);
    
    console.log('');
    console.log('=== GENERATION RESULTS ===');
    console.log(`Total Examples: ${results.length}`);
    console.log(`Successful: ${successful} (${(successful * 100 / results.length).toFixed(1)}%)`);
    console.log(`Failed: ${failed} (${(failed * 100 / results.length).toFixed(1)}%)`);
    console.log(`Total Commands Generated: ${totalCommands}`);
    console.log(`Total AST Data Size: ${(totalAstSize / 1024).toFixed(1)} KB`);
    console.log(`Average Commands per Test: ${(totalCommands / results.length).toFixed(1)}`);
    console.log(`Average AST Size: ${(totalAstSize / results.length).toFixed(0)} bytes`);
    
    // Save summary report
    const summaryFile = path.join(outputDir, 'summary.json');
    const summary = {
        timestamp: new Date().toISOString(),
        totalExamples: results.length,
        successful: successful,
        failed: failed,
        successRate: successful / results.length,
        totalCommands: totalCommands,
        totalAstSize: totalAstSize,
        results: results
    };
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log('');
    console.log(`Test data saved to: ${outputDir}/`);
    console.log(`Summary report: ${summaryFile}`);
    
    if (failed > 0) {
        console.log('');
        console.log('FAILED EXAMPLES:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.name}: ${r.error}`);
        });
    }
    
    console.log('');
    console.log('✓ Test data generation complete!');
    console.log('Run C++ validation with: cmake --build . && ./test_cross_platform_validation');
    
    return successful === results.length;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

if (require.main === module) {
    generateTestData()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('FATAL ERROR:', error);
            process.exit(2);
        });
}

module.exports = { generateTestData, captureCommandStream };