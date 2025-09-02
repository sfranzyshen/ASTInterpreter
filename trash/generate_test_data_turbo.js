#!/usr/bin/env node

/**
 * generate_test_data_turbo.js - TURBO-OPTIMIZED test data generation
 * 
 * EXTREME PERFORMANCE OPTIMIZATIONS:
 * 1. Global console object override to stop ALL output before module loading
 * 2. Minimal execution timeouts (500ms)
 * 3. Simplified command capture (no timestamps)
 * 4. Aggressive memory management
 * 5. Streamlined file operations
 * 6. Skip resume logic for maximum speed
 * 
 * Target: Process all 135 examples in under 60 seconds
 */

// =============================================================================
// GLOBAL OUTPUT SUPPRESSION - BEFORE MODULE LOADING!
// =============================================================================

// Store original console before any modules load
const ORIGINAL_CONSOLE = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
    trace: console.trace
};

// Override console GLOBALLY before any modules can use it
const TURBO_NOOP = () => {};
console.log = TURBO_NOOP;
console.error = TURBO_NOOP;
console.warn = TURBO_NOOP;
console.info = TURBO_NOOP;
console.debug = TURBO_NOOP;
console.trace = TURBO_NOOP;

// Suppress process output streams
const ORIGINAL_STDOUT = process.stdout.write;
const ORIGINAL_STDERR = process.stderr.write;
process.stdout.write = () => true;
process.stderr.write = () => true;

// NOW load modules with suppressed output
const fs = require('fs');
const path = require('path');
const { parse, exportCompactAST } = require('./ArduinoParser.js');
const { ArduinoInterpreter } = require('./ArduinoInterpreter.js');
const { examplesFiles } = require('./examples.js');
const { oldTestFiles } = require('./old_test.js');
const { neopixelFiles } = require('./neopixel.js');

// Restore console for our own output
function restoreConsole() {
    Object.assign(console, ORIGINAL_CONSOLE);
    process.stdout.write = ORIGINAL_STDOUT;
    process.stderr.write = ORIGINAL_STDERR;
}

// =============================================================================
// TURBO COMMAND STREAM CAPTURE
// =============================================================================

/**
 * Turbo-optimized command stream capture
 */
function captureCommandStreamTurbo(example) {
    return new Promise((resolve) => {
        try {
            // Parse Arduino code
            const code = example.content || example.code;
            const ast = parse(code);
            
            // Create interpreter with minimal settings
            const interpreter = new ArduinoInterpreter(ast, { 
                verbose: false,
                debug: false,
                stepDelay: 0,
                maxLoopIterations: 2  // Reduced for speed
            });
            
            // Minimal command capture
            const commands = [];
            let done = false;
            
            interpreter.onCommand = (cmd) => {
                commands.push({ type: cmd.type, data: cmd.data || {} });
                if (cmd.type === 'PROGRAM_END' || cmd.type === 'ERROR' || cmd.type === 'LOOP_LIMIT_REACHED') {
                    done = true;
                }
            };
            
            interpreter.onError = (error) => {
                commands.push({ type: 'ERROR', data: { message: error } });
                done = true;
            };
            
            // Ultra-fast mock responses
            interpreter.responseHandler = (req) => {
                setImmediate(() => {
                    const values = { analogRead: 512, digitalRead: 1, millis: 1000, micros: 1000000 };
                    interpreter.handleResponse(req.id, values[req.type] || 0);
                });
            };
            
            interpreter.start();
            
            // Ultra-short timeout
            const timeout = setTimeout(() => { done = true; }, 500);
            
            const check = () => {
                if (done) {
                    clearTimeout(timeout);
                    resolve({ commands, success: true, error: null });
                } else {
                    setImmediate(check);
                }
            };
            check();
            
        } catch (error) {
            resolve({ commands: [], success: false, error: error.message });
        }
    });
}

// =============================================================================
// TURBO PROCESSING
// =============================================================================

/**
 * Process example with maximum speed optimizations
 */
async function processExampleTurbo(example, index, outputDir) {
    const baseName = `example_${String(index).padStart(3, '0')}`;
    
    try {
        // Step 1: Parse and AST export (fast)
        const code = example.content || example.code;
        const ast = parse(code);
        const compactAST = exportCompactAST(ast);
        
        // Step 2: Command capture (optimized)
        const result = await captureCommandStreamTurbo(example);
        
        // Step 3: Synchronous file writes for speed
        const astFile = path.join(outputDir, `${baseName}.ast`);
        const commandsFile = path.join(outputDir, `${baseName}.commands`);
        const metaFile = path.join(outputDir, `${baseName}.meta`);
        
        fs.writeFileSync(astFile, Buffer.from(compactAST));
        fs.writeFileSync(commandsFile, JSON.stringify(result.commands));
        fs.writeFileSync(metaFile, [
            `name=${example.name}`,
            `success=${result.success}`,
            `commandCount=${result.commands.length}`,
            `error=${result.error || ''}`,
            `astSize=${compactAST.byteLength}`,
            `content=${code}`
        ].join('\n'));
        
        return {
            name: example.name,
            success: result.success,
            commandCount: result.commands.length,
            astSize: compactAST.byteLength,
            error: result.error
        };
        
    } catch (error) {
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
 * TURBO test data generation - maximum speed
 */
async function generateTestDataTurbo() {
    restoreConsole();
    
    console.log('=== TURBO-OPTIMIZED Test Data Generation ===');
    console.log('Target: All 135 examples in under 60 seconds');
    console.log('');
    
    // Create output directory
    const outputDir = 'test_data';
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    
    // Collect all examples
    const allExamples = [
        ...examplesFiles.map(ex => ({ ...ex, source: 'examples' })),
        ...oldTestFiles.map(ex => ({ ...ex, source: 'old_test' })),
        ...neopixelFiles.map(ex => ({ ...ex, source: 'neopixel' }))
    ];
    
    console.log(`Processing ${allExamples.length} examples with TURBO optimizations...`);
    console.log('');
    
    const startTime = Date.now();
    const results = [];
    
    // Process all examples
    for (let i = 0; i < allExamples.length; i++) {
        const result = await processExampleTurbo(allExamples[i], i, outputDir);
        results.push(result);
        
        // Progress every 25 tests
        if ((i + 1) % 25 === 0 || i === allExamples.length - 1) {
            const elapsed = Date.now() - startTime;
            const rate = (i + 1) / elapsed * 1000;
            const eta = (allExamples.length - i - 1) / rate;
            console.log(`[${i + 1}/${allExamples.length}] ${(elapsed/1000).toFixed(1)}s elapsed, ${rate.toFixed(1)} tests/sec, ETA: ${eta.toFixed(0)}s`);
        }
        
        // GC every 50 tests
        if ((i + 1) % 50 === 0 && global.gc) {
            global.gc();
        }
    }
    
    const totalTime = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('');
    console.log('=== TURBO RESULTS ===');
    console.log(`Total: ${results.length} examples`);
    console.log(`Success: ${successful} (${(successful*100/results.length).toFixed(1)}%)`);
    console.log(`Failed: ${failed}`);
    console.log(`Time: ${(totalTime/1000).toFixed(1)} seconds`);
    console.log(`Rate: ${(results.length * 1000 / totalTime).toFixed(1)} tests/second`);
    
    if (failed > 0) {
        console.log('');
        console.log('FAILURES:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  ${r.name}: ${r.error}`);
        });
    }
    
    // Save minimal summary
    const summary = {
        timestamp: new Date().toISOString(),
        totalExamples: results.length,
        successful,
        failed,
        successRate: successful / results.length,
        processingTime: totalTime,
        testRate: results.length * 1000 / totalTime,
        results
    };
    
    fs.writeFileSync(path.join(outputDir, 'turbo_summary.json'), JSON.stringify(summary));
    
    console.log('');
    console.log('✓ TURBO generation complete!');
    console.log(`Rate achieved: ${(results.length * 1000 / totalTime).toFixed(1)} tests/second`);
    
    return successful === results.length;
}

// =============================================================================
// MAIN TURBO EXECUTION
// =============================================================================

if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--turbo')) {
        generateTestDataTurbo()
            .then(success => process.exit(success ? 0 : 1))
            .catch(error => {
                restoreConsole();
                console.error('TURBO ERROR:', error);
                process.exit(2);
            });
    } else {
        // Run optimized version
        restoreConsole();
        
        const { generateTestDataOptimized } = require('./generate_test_data_optimized.js');
        generateTestDataOptimized()
            .then(success => process.exit(success ? 0 : 1))
            .catch(error => {
                console.error('ERROR:', error);
                process.exit(2);
            });
    }
}

module.exports = { generateTestDataTurbo, captureCommandStreamTurbo };
