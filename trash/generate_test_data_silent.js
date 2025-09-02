#!/usr/bin/env node

/**
 * generate_test_data_silent.js - SILENT test data generation using process redirection
 * 
 * SOLUTION: Use child_process to run interpreter in isolated environment
 * where all output is redirected to /dev/null, completely bypassing the
 * 198 hardcoded console.log statements in ArduinoInterpreter.js
 * 
 * This is the only way to achieve true silence with the current interpreter.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Load modules that don't produce debug output
const { parse, exportCompactAST } = require('./ArduinoParser.js');
const { examplesFiles } = require('./examples.js');
const { oldTestFiles } = require('./old_test.js');
const { neopixelFiles } = require('./neopixel.js');

// =============================================================================
// ISOLATED INTERPRETER EXECUTION
// =============================================================================

/**
 * Create isolated interpreter execution script
 */
function createInterpreterScript(example, scriptPath) {
    const scriptContent = `
// Isolated interpreter execution for: ${example.name}
const { ArduinoInterpreter } = require('./ArduinoInterpreter.js');

// Parse the AST (passed as argument)
const astData = process.argv[2];
const ast = JSON.parse(astData);

// Create interpreter
const interpreter = new ArduinoInterpreter(ast, { 
    verbose: false,
    debug: false,
    stepDelay: 0,
    maxLoopIterations: 2
});

// Capture commands
const commands = [];
let done = false;

interpreter.onCommand = (cmd) => {
    commands.push({ type: cmd.type, data: cmd.data || {} });
    if (cmd.type === 'PROGRAM_END' || cmd.type === 'ERROR' || cmd.type === 'LOOP_LIMIT_REACHED') {
        done = true;
    }
};

interpreter.onError = (error) => {
    commands.push({ type: 'ERROR', data: { message: error.toString() } });
    done = true;
};

// Mock response handler
interpreter.responseHandler = (req) => {
    setImmediate(() => {
        const values = { analogRead: 512, digitalRead: 1, millis: 1000, micros: 1000000 };
        interpreter.handleResponse(req.id, values[req.type] || 0);
    });
};

// Start and wait
interpreter.start();

const timeout = setTimeout(() => { done = true; }, 1000);

const check = () => {
    if (done) {
        clearTimeout(timeout);
        // Output results to stdout as JSON
        process.stdout.write(JSON.stringify({
            success: true,
            commands: commands,
            commandCount: commands.length
        }));
        process.exit(0);
    } else {
        setImmediate(check);
    }
};

check();
    `;
    
    fs.writeFileSync(scriptPath, scriptContent);
}

/**
 * Run interpreter in isolated process with output redirection
 */
function runIsolatedInterpreter(ast, example) {
    return new Promise((resolve) => {
        const scriptPath = '/tmp/isolated_interpreter.js';
        createInterpreterScript(example, scriptPath);
        
        const child = spawn('node', [scriptPath, JSON.stringify(ast)], {
            stdio: ['ignore', 'pipe', 'ignore'], // Redirect stderr to /dev/null
            timeout: 2000
        });
        
        let output = '';
        
        child.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        child.on('close', (code) => {
            try {
                if (output.trim()) {
                    const result = JSON.parse(output.trim());
                    resolve(result);
                } else {
                    resolve({ success: false, commands: [], commandCount: 0, error: 'No output' });
                }
            } catch (error) {
                resolve({ success: false, commands: [], commandCount: 0, error: 'Parse error' });
            }
            
            // Cleanup
            try {
                fs.unlinkSync(scriptPath);
            } catch (e) {
                // Ignore cleanup errors
            }
        });
        
        child.on('error', (error) => {
            resolve({ success: false, commands: [], commandCount: 0, error: error.message });
        });
    });
}

// =============================================================================
// SILENT PROCESSING
// =============================================================================

/**
 * Process example using isolated execution
 */
async function processExampleSilent(example, index, outputDir) {
    const baseName = `example_${String(index).padStart(3, '0')}`;
    
    try {
        // Step 1: Parse and generate AST (fast, no debug output)
        const code = example.content || example.code;
        const ast = parse(code);
        const compactAST = exportCompactAST(ast);
        
        // Step 2: Run interpreter in isolated process
        const result = await runIsolatedInterpreter(ast, example);
        
        // Step 3: Save files
        fs.writeFileSync(
            path.join(outputDir, `${baseName}.ast`),
            Buffer.from(compactAST)
        );
        
        fs.writeFileSync(
            path.join(outputDir, `${baseName}.commands`),
            JSON.stringify(result.commands)
        );
        
        fs.writeFileSync(
            path.join(outputDir, `${baseName}.meta`),
            [
                `name=${example.name}`,
                `success=${result.success}`,
                `commandCount=${result.commandCount}`,
                `error=${result.error || ''}`,
                `astSize=${compactAST.byteLength}`,
                `content=${code}`
            ].join('\n')
        );
        
        return {
            name: example.name,
            success: result.success,
            commandCount: result.commandCount,
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
 * Generate test data using silent processing
 */
async function generateTestDataSilent() {
    console.log('=== SILENT Test Data Generation ===');
    console.log('Using isolated process execution to bypass debug output');
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
    
    console.log(`Processing ${allExamples.length} examples...`);
    console.log('');
    
    const startTime = Date.now();
    const results = [];
    
    for (let i = 0; i < allExamples.length; i++) {
        const result = await processExampleSilent(allExamples[i], i, outputDir);
        results.push(result);
        
        // Progress reporting
        if ((i + 1) % 20 === 0 || i === allExamples.length - 1) {
            const elapsed = Date.now() - startTime;
            const rate = (i + 1) / elapsed * 1000;
            const eta = (allExamples.length - i - 1) / rate;
            console.log(`[${i + 1}/${allExamples.length}] ${(elapsed/1000).toFixed(1)}s elapsed, ${rate.toFixed(1)} tests/sec, ETA: ${eta.toFixed(0)}s`);
        }
    }
    
    const totalTime = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('');
    console.log('=== SILENT GENERATION RESULTS ===');
    console.log(`Total: ${results.length} examples`);
    console.log(`Success: ${successful} (${(successful*100/results.length).toFixed(1)}%)`);
    console.log(`Failed: ${failed}`);
    console.log(`Time: ${(totalTime/1000).toFixed(1)} seconds`);
    console.log(`Rate: ${(results.length * 1000 / totalTime).toFixed(1)} tests/second`);
    
    // Save summary
    const summary = {
        timestamp: new Date().toISOString(),
        totalExamples: results.length,
        successful,
        failed,
        successRate: successful / results.length,
        processingTime: totalTime,
        testRate: results.length * 1000 / totalTime,
        method: 'isolated_process',
        results
    };
    
    fs.writeFileSync(path.join(outputDir, 'silent_summary.json'), JSON.stringify(summary));
    
    if (failed > 0) {
        console.log('');
        console.log('FAILURES:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  ${r.name}: ${r.error}`);
        });
    }
    
    console.log('');
    console.log('✓ Silent generation complete!');
    
    return successful === results.length;
}

if (require.main === module) {
    generateTestDataSilent()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error('SILENT ERROR:', error);
            process.exit(2);
        });
}

module.exports = { generateTestDataSilent };
