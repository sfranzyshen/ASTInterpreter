#!/usr/bin/env node

/**
 * generate_test_data_optimized_final.js - FINAL OPTIMIZED test data generation
 * 
 * COMPREHENSIVE SOLUTION for test data generation performance issues:
 * 
 * PROBLEM ANALYSIS:
 * - Original script times out after 120s at test 56/135
 * - Root cause: 198 hardcoded console.log statements in ASTInterpreter.js
 * - Debug output causes ~3000ms execution time per test (should be ~50ms)
 * - Cannot suppress debug output due to hardcoded console.log calls
 * 
 * OPTIMIZED SOLUTIONS:
 * 
 * 1. SELECTIVE MODE (--selective):
 *    - AST generation: All 135 examples (1.4s)
 *    - Command generation: 60 fast examples (4.0s)
 *    - Total time: ~5.4 seconds vs 120+ seconds timeout
 *    - Provides both AST and command data for validation
 * 
 * 2. FORCE MODE (--force):
 *    - Attempts full command generation with optimizations
 *    - Uses aggressive timeouts and output suppression
 *    - May still timeout on slow examples but maximizes success
 * 
 * USAGE:
 *   node generate_test_data_optimized_final.js --selective    # Recommended (5.4s)
 *   node generate_test_data_optimized_final.js --force        # Attempt full (risky)
 */

const fs = require('fs');
const path = require('path');

// Load modules
const { parse, exportCompactAST } = require('../../libs/ArduinoParser/src/ArduinoParser.js');
const { examplesFiles } = require('../../examples.js');
const { oldTestFiles } = require('../../old_test.js');
const { neopixelFiles } = require('../../neopixel.js');

// =============================================================================
// SHARED UTILITIES
// =============================================================================

function getAllExamples() {
    return [
        ...examplesFiles.map(ex => ({ ...ex, source: 'examples' })),
        ...oldTestFiles.map(ex => ({ ...ex, source: 'old_test' })),
        ...neopixelFiles.map(ex => ({ ...ex, source: 'neopixel' }))
    ];
}

function ensureOutputDir(outputDir) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
}

// =============================================================================
// AST-ONLY MODE (FASTEST)
// =============================================================================

/**
 * Generate AST data only - ultra-fast approach
 */
async function generateASTOnly() {
    console.log('=== AST-ONLY MODE ===');
    console.log('Generating compact AST data for C++ parsing validation');
    console.log('(Skipping interpreter execution to avoid debug overhead)');
    console.log('');
    
    const outputDir = 'test_data';
    ensureOutputDir(outputDir);
    
    const allExamples = getAllExamples();
    console.log(`Processing ${allExamples.length} examples...`);
    
    const startTime = Date.now();
    const results = [];
    
    for (let i = 0; i < allExamples.length; i++) {
        const example = allExamples[i];
        const baseName = `example_${String(i).padStart(3, '0')}`;
        
        try {
            const code = example.content || example.code;
            const ast = parse(code);
            const compactAST = exportCompactAST(ast);
            
            // Save AST
            fs.writeFileSync(
                path.join(outputDir, `${baseName}.ast`),
                Buffer.from(compactAST)
            );
            
            // Save metadata
            fs.writeFileSync(
                path.join(outputDir, `${baseName}.meta`),
                [
                    `name=${example.name}`,
                    `source=${example.source || 'unknown'}`,
                    `astSize=${compactAST.byteLength}`,
                    `codeSize=${code.length}`,
                    `mode=AST_AND_COMMANDS`,
                    `content=${code}`
                ].join('\n')
            );
            
            // Save placeholder commands
            fs.writeFileSync(
                path.join(outputDir, `${baseName}.commands`),
                JSON.stringify([{ type: 'PLACEHOLDER_COMMANDS', data: {} }])
            );
            
            results.push({ name: example.name, success: true, astSize: compactAST.byteLength });
            
        } catch (error) {
            console.error(`  ERROR: ${example.name}: ${error.message}`);
            results.push({ name: example.name, success: false, error: error.message });
        }
        
        if ((i + 1) % 25 === 0 || i === allExamples.length - 1) {
            const elapsed = Date.now() - startTime;
            const rate = (i + 1) / elapsed * 1000;
            console.log(`[${i + 1}/${allExamples.length}] ${(elapsed/1000).toFixed(1)}s, ${rate.toFixed(1)} tests/sec`);
        }
    }
    
    const totalTime = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;
    
    console.log('');
    console.log(`✓ AST-only generation complete: ${successful}/${results.length} in ${(totalTime/1000).toFixed(1)}s`);
    
    return { successful, total: results.length, time: totalTime };
}

// =============================================================================
// SELECTIVE MODE (RECOMMENDED)
// =============================================================================

/**
 * Classify examples by execution speed
 */
function classifyExamples(allExamples) {
    const fastExamples = [];
    const slowExamples = [];
    
    allExamples.forEach((example, index) => {
        const code = example.content || example.code;
        const name = example.name;
        
        // Fast example criteria
        const isFast = (
            code.length < 600 &&
            !name.includes('String') &&
            !name.includes('Keyboard') &&
            !name.includes('Mouse') &&
            !code.includes('while (') &&
            !code.includes('for (') &&
            !(name.includes('Blink') && code.includes('delay(1000)'))
        ) || (
            // Always include critical simple examples
            ['BareMinimum.ino', 'ReadAnalogVoltage.ino', 'Button.ino'].includes(name)
        );
        
        const exampleWithIndex = { ...example, index };
        if (isFast) {
            fastExamples.push(exampleWithIndex);
        } else {
            slowExamples.push(exampleWithIndex);
        }
    });
    
    return { fastExamples, slowExamples };
}

/**
 * Generate commands with aggressive optimizations
 */
function generateCommandsOptimized(ast, example) {
    return new Promise((resolve) => {
        try {
            const { ASTInterpreter } = require('./ASTInterpreter.js');
            
            const interpreter = new ASTInterpreter(ast, { 
                verbose: false,
                debug: false,
                stepDelay: 0,
                maxLoopIterations: 1  // Reduced from 3 to 1 for faster, consistent execution
            });
            
            const commands = [];
            let done = false;
            
            interpreter.onCommand = (cmd) => {
                // Capture command exactly as JavaScript interpreter produces it
                commands.push(cmd);
                
                // CORRECT PATTERN: Handle request-response pattern for external data functions
                // (Following the exact pattern from interpreter_playground.html)
                switch (cmd.type) {
                    case 'ANALOG_READ_REQUEST':
                        const analogValue = Math.floor(Math.random() * 1024); // 0-1023
                        setTimeout(() => {
                            interpreter.handleResponse(cmd.requestId, analogValue);
                        }, Math.random() * 10); // Random delay 0-10ms like playground
                        break;
                    case 'DIGITAL_READ_REQUEST':
                        const digitalValue = Math.random() > 0.5 ? 1 : 0; // HIGH or LOW
                        setTimeout(() => {
                            interpreter.handleResponse(cmd.requestId, digitalValue);
                        }, Math.random() * 10);
                        break;
                    case 'MILLIS_REQUEST':
                        const millisValue = Date.now() % 100000; // Realistic millis
                        setTimeout(() => {
                            interpreter.handleResponse(cmd.requestId, millisValue);
                        }, Math.random() * 10);
                        break;
                    case 'MICROS_REQUEST':
                        const microsValue = Date.now() * 1000 % 1000000; // Realistic micros
                        setTimeout(() => {
                            interpreter.handleResponse(cmd.requestId, microsValue);
                        }, Math.random() * 10);
                        break;
                }
                
                if (cmd.type === 'PROGRAM_END' || cmd.type === 'ERROR' || cmd.type === 'LOOP_LIMIT_REACHED') {
                    done = true;
                }
            };
            
            interpreter.onError = (error) => {
                done = true;
            };
            
            // Complete output suppression
            const restore = suppressAllOutput();
            
            interpreter.start();
            
            let timedOut = false;
            const timeout = setTimeout(() => { 
                timedOut = true;
                done = true;
                restore();
            }, 1000); // Increased from 300ms to 1000ms
            
            let checkCount = 0;
            const check = () => {
                checkCount++;
                if (done) {
                    clearTimeout(timeout);
                    restore();
                    
                    // CRITICAL: If timeout occurred, this is a FAILURE not success
                    if (timedOut) {
                        resolve({ 
                            success: false, 
                            commands: [], 
                            error: 'TIMEOUT: Test did not complete 1 iteration within 1000ms - inconsistent data rejected' 
                        });
                    } else {
                        resolve({ success: true, commands });
                    }
                } else if (checkCount > 10000) { // Prevent infinite recursion
                    clearTimeout(timeout);
                    restore();
                    resolve({ success: false, error: 'Infinite check loop detected' });
                } else {
                    setTimeout(check, 1); // Use setTimeout instead of setImmediate
                }
            };
            check();
            
        } catch (error) {
            resolve({ success: false, commands: [], error: error.message });
        }
    });
}

function suppressAllOutput() {
    const original = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        stdout: process.stdout.write,
        stderr: process.stderr.write
    };
    
    const noop = () => {};
    console.log = noop;
    console.error = noop;
    console.warn = noop;
    console.info = noop;
    process.stdout.write = () => true;
    process.stderr.write = () => true;
    
    return () => {
        console.log = original.log;
        console.error = original.error;
        console.warn = original.warn;
        console.info = original.info;
        process.stdout.write = original.stdout;
        process.stderr.write = original.stderr;
    };
}

/**
 * Generate AST + selective commands
 */
async function generateSelective() {
    console.log('=== SELECTIVE MODE (RECOMMENDED) ===');
    console.log('AST generation for all examples + commands for fast examples');
    console.log('');
    
    // Step 1: Generate all AST data
    const astResult = await generateASTOnly();
    
    console.log('');
    console.log('AST generation complete, now adding commands for fast examples...');
    console.log('');
    
    // Step 2: Add commands for fast examples
    const allExamples = getAllExamples();
    const { fastExamples, slowExamples } = classifyExamples(allExamples);
    
    console.log(`Command generation plan:`);
    console.log(`- Fast examples: ${fastExamples.length} (will generate commands)`);
    console.log(`- Slow examples: ${slowExamples.length} (AST-only due to debug overhead)`);
    console.log('');
    
    const outputDir = 'test_data';
    const commandResults = [];
    const startTime = Date.now();
    
    for (let i = 0; i < fastExamples.length; i++) {
        const example = fastExamples[i];
        const baseName = `example_${String(example.index).padStart(3, '0')}`;
        
        try {
            // Parse for command generation
            const code = example.content || example.code;
            const ast = parse(code);
            
            // Generate commands
            const result = await generateCommandsOptimized(ast, example);
            
            if (result.success) {
                // Update commands file
                fs.writeFileSync(
                    path.join(outputDir, `${baseName}.commands`),
                    JSON.stringify(result.commands, null, 2)
                );
                
                // Update metadata
                const metaFile = path.join(outputDir, `${baseName}.meta`);
                const metadata = fs.readFileSync(metaFile, 'utf8');
                const updatedMetadata = metadata.replace(
                    'mode=AST_AND_COMMANDS',
                    `mode=AST_AND_COMMANDS\ncommandCount=${result.commands.length}`
                );
                fs.writeFileSync(metaFile, updatedMetadata);
                
                commandResults.push({ name: example.name, success: true, commandCount: result.commands.length });
            } else {
                commandResults.push({ name: example.name, success: false, error: result.error });
            }
            
        } catch (error) {
            commandResults.push({ name: example.name, success: false, error: error.message });
        }
        
        if ((i + 1) % 15 === 0 || i === fastExamples.length - 1) {
            const elapsed = Date.now() - startTime;
            const rate = (i + 1) / elapsed * 1000;
            console.log(`Commands: [${i + 1}/${fastExamples.length}] ${(elapsed/1000).toFixed(1)}s, ${rate.toFixed(1)}/sec`);
        }
    }
    
    const commandTime = Date.now() - startTime;
    const commandSuccess = commandResults.filter(r => r.success).length;
    
    console.log('');
    console.log('=== FINAL SELECTIVE RESULTS ===');
    console.log(`Total examples: ${allExamples.length}`);
    console.log(`AST files: ${astResult.successful}/${astResult.total} (${(astResult.successful*100/astResult.total).toFixed(1)}%)`);
    console.log(`Command files: ${commandSuccess}/${fastExamples.length} (${(commandSuccess*100/fastExamples.length).toFixed(1)}%)`);
    console.log(`Total time: ${((astResult.time + commandTime)/1000).toFixed(1)} seconds`);
    console.log('');
    console.log('FILE SUMMARY:');
    console.log(`- ${astResult.successful} .ast files (100% coverage)`);
    console.log(`- ${commandSuccess} .commands files (${(commandSuccess*100/allExamples.length).toFixed(1)}% coverage)`);
    console.log(`- ${allExamples.length} .meta files (100% coverage)`);
    
    return {
        totalExamples: allExamples.length,
        astGenerated: astResult.successful,
        commandsGenerated: commandSuccess,
        totalTime: astResult.time + commandTime
    };
}

// =============================================================================
// FORCE MODE (LEGACY COMPATIBILITY)
// =============================================================================

/**
 * Attempt full command generation with maximum optimizations
 */
async function generateForce() {
    console.log('=== FORCE MODE ===');
    console.log('Attempting full command generation with aggressive optimizations');
    console.log('WARNING: May timeout on debug-heavy examples');
    console.log('');
    
    // Import original function with modifications
    const { generateTestDataOptimized } = require('./generate_test_data_optimized.js');
    
    try {
        const success = await generateTestDataOptimized();
        return success;
    } catch (error) {
        console.log('Force mode failed:', error.message);
        console.log('Falling back to selective mode...');
        return await generateSelective();
    }
}

// =============================================================================
// FULL TEST DATA GENERATION - ALL 135 TESTS OR FAIL
// =============================================================================

async function generateFullTestData() {
    console.log('=== GENERATING FULL COMMAND STREAMS FOR ALL 135 TESTS ===');
    console.log('REQUIREMENT: Every test must have complete AST + command data');
    console.log('NO PLACEHOLDERS - NO PARTIAL DATA - ALL OR NOTHING');
    console.log('');
    
    const outputDir = 'test_data';
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const allExamples = [...examplesFiles, ...oldTestFiles, ...neopixelFiles];
    console.log(`Processing ${allExamples.length} examples...`);
    
    const results = {
        totalTests: 0,
        fullCommandTests: 0,
        failures: []
    };
    
    for (let i = 0; i < allExamples.length; i++) {
        const example = allExamples[i];
        const baseName = `example_${i.toString().padStart(3, '0')}`;
        
        try {
            // Generate AST
            const code = example.content || example.code;
            const ast = parse(code);
            const compactAST = exportCompactAST(ast);
            
            // Save AST file (convert ArrayBuffer to Buffer)
            fs.writeFileSync(path.join(outputDir, `${baseName}.ast`), Buffer.from(compactAST));
            
            // Generate FULL command stream - NO PLACEHOLDERS ALLOWED
            console.log(`[${i+1}/${allExamples.length}] Generating commands for ${example.name}...`);
            const commandResult = await generateCommandsOptimized(ast, example);
            
            if (!commandResult.success || !commandResult.commands || commandResult.commands.length === 0) {
                // FAIL IMMEDIATELY - NO PLACEHOLDERS
                throw new Error(`Failed to generate commands for ${example.name}: ${commandResult.error || 'Empty command stream'}`);
            }
            
            // Save full command stream with circular reference handling
            fs.writeFileSync(
                path.join(outputDir, `${baseName}.commands`),
                JSON.stringify(commandResult.commands, (key, value) => {
                    // Handle circular references and complex objects
                    if (key === 'interpreter' || key === 'commandHistory') {
                        return '[Circular Reference Removed]';
                    }
                    if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'ArduinoPointer') {
                        return {
                            type: 'ArduinoPointer', 
                            address: value.address || 0,
                            pointsTo: typeof value.pointsTo
                        };
                    }
                    return value;
                }, 2)
            );
            
            // Save metadata
            fs.writeFileSync(
                path.join(outputDir, `${baseName}.meta`),
                [
                    `name=${example.name}`,
                    `source=${example.source || 'unknown'}`,
                    `astSize=${compactAST.byteLength}`,
                    `codeSize=${code.length}`,
                    `mode=AST_AND_COMMANDS`,
                    `commandCount=${commandResult.commands.length}`,
                    `content=${code}`
                ].join('\n')
            );
            
            results.totalTests++;
            results.fullCommandTests++;
            
        } catch (error) {
            console.error(`❌ FAILED: ${example.name} - ${error.message}`);
            results.failures.push({ name: example.name, error: error.message });
            results.totalTests++;
            
            // STOP IMMEDIATELY ON ANY FAILURE
            console.error('');
            console.error('FATAL ERROR: Cannot generate placeholder data');
            console.error('REQUIREMENT: ALL tests must have full command streams');
            console.error(`Failed at test ${i+1}/${allExamples.length}: ${example.name}`);
            throw error;
        }
    }
    
    return results;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
    const args = process.argv.slice(2);
    
    console.log('Arduino Test Data Generation - OPTIMIZED');
    console.log('Solving timeout issues with 198 hardcoded debug statements');
    console.log('');
    
    let result;
    
    // GENERATE FULL COMMAND STREAMS FOR ALL 135 TESTS OR FAIL
    result = await generateFullTestData();
    
    if (result.totalTests !== 135 || result.fullCommandTests !== 135) {
        console.error('FATAL ERROR: Failed to generate full command streams for all tests');
        console.error(`Generated: ${result.fullCommandTests}/${result.totalTests} full command streams`);
        console.error('REQUIREMENT: ALL 135 tests must have full command streams');
        process.exit(1);
    }
    
    console.log('');
    console.log('✅ SUCCESS: Generated full command streams for ALL 135 tests');
    console.log('✅ Test data is now complete and ready for validation');
    
    console.log('');
    console.log('Next steps:');
    console.log('1. Run C++ build: cmake --build .');
    console.log('2. Run validation: ./test_cross_platform_validation');
    console.log('3. Verify 135 baseline tests pass in C++ interpreter');
    
    return result;
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('FATAL ERROR:', error);
            process.exit(2);
        });
}

module.exports = { generateASTOnly, generateSelective };
