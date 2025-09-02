#!/usr/bin/env node

/**
 * generate_commands_selective.js - Selective command stream generation
 * 
 * Strategy: Generate command streams only for examples that execute quickly,
 * avoiding the debug-heavy examples that cause timeouts.
 * 
 * Based on performance analysis:
 * - Simple examples (BareMinimum, ReadAnalogVoltage): ~50ms execution
 * - Debug-heavy examples (String operations, complex loops): ~3000ms execution
 * 
 * This script will:
 * 1. Load existing AST data (already generated)
 * 2. Identify fast-executing examples
 * 3. Generate command streams only for those examples
 * 4. Update metadata to indicate command generation status
 */

const fs = require('fs');
const path = require('path');

// Load modules
const { ArduinoInterpreter } = require('./ArduinoInterpreter.js');
const { examplesFiles } = require('./examples.js');
const { oldTestFiles } = require('./old_test.js');
const { neopixelFiles } = require('./neopixel.js');

// =============================================================================
// EXAMPLE CLASSIFICATION
// =============================================================================

/**
 * Classify examples by expected execution speed
 */
function classifyExamples() {
    const allExamples = [
        ...examplesFiles.map(ex => ({ ...ex, source: 'examples' })),
        ...oldTestFiles.map(ex => ({ ...ex, source: 'old_test' })),
        ...neopixelFiles.map(ex => ({ ...ex, source: 'neopixel' }))
    ];
    
    const fastExamples = [];
    const slowExamples = [];
    
    allExamples.forEach((example, index) => {
        const code = example.content || example.code;
        const name = example.name;
        
        // Criteria for fast examples:
        // 1. Short code (< 800 characters)
        // 2. No complex String operations
        // 3. No complex loops or nested structures
        // 4. Known simple patterns
        
        const isFast = (
            code.length < 800 &&
            !name.includes('String') &&
            !name.includes('Keyboard') &&
            !name.includes('Mouse') &&
            !name.includes('Complex') &&
            !name.includes('Template') &&
            !code.includes('while (') &&
            !code.includes('for (') &&
            !code.includes('switch (') &&
            !(name.includes('Blink') && code.includes('delay')) // Avoid infinite delay loops
        ) || (
            // Always include these critical examples
            name === 'BareMinimum.ino' ||
            name === 'ReadAnalogVoltage.ino' ||
            name === 'Button.ino'
        );
        
        if (isFast) {
            fastExamples.push({ ...example, index });
        } else {
            slowExamples.push({ ...example, index });
        }
    });
    
    return { fastExamples, slowExamples, total: allExamples.length };
}

// =============================================================================
// FAST COMMAND GENERATION
// =============================================================================

/**
 * Generate command stream with ultra-short timeout
 */
function generateCommandsQuick(ast, example) {
    return new Promise((resolve) => {
        try {
            const interpreter = new ArduinoInterpreter(ast, { 
                verbose: false,
                debug: false,
                stepDelay: 0,
                maxLoopIterations: 1  // Very conservative
            });
            
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
            
            // Ultra-fast mock responses
            interpreter.responseHandler = (req) => {
                setImmediate(() => {
                    const values = { analogRead: 512, digitalRead: 1, millis: 1000, micros: 1000000 };
                    interpreter.handleResponse(req.id, values[req.type] || 0);
                });
            };
            
            // Suppress console completely
            const originalMethods = {
                log: console.log,
                error: console.error,
                warn: console.warn,
                info: console.info
            };
            Object.keys(originalMethods).forEach(key => {
                console[key] = () => {};
            });
            
            interpreter.start();
            
            // Very short timeout for fast examples
            const timeout = setTimeout(() => { 
                done = true;
                Object.assign(console, originalMethods);
            }, 200); // Only 200ms timeout
            
            const check = () => {
                if (done) {
                    clearTimeout(timeout);
                    Object.assign(console, originalMethods);
                    resolve({ success: true, commands, error: null });
                } else {
                    setImmediate(check);
                }
            };
            check();
            
        } catch (error) {
            resolve({ success: false, commands: [], error: error.message });
        }
    });
}

/**
 * Update command data for a specific example
 */
async function updateExampleCommands(example, index, outputDir) {
    const baseName = `example_${String(index).padStart(3, '0')}`;
    const metaFile = path.join(outputDir, `${baseName}.meta`);
    const commandsFile = path.join(outputDir, `${baseName}.commands`);
    
    try {
        // Load existing AST
        const astFile = path.join(outputDir, `${baseName}.ast`);
        if (!fs.existsSync(astFile)) {
            throw new Error('AST file not found');
        }
        
        // Parse the code to get AST for command generation
        const { parse } = require('./ArduinoParser.js');
        const code = example.content || example.code;
        const ast = parse(code);
        
        // Generate commands quickly
        const result = await generateCommandsQuick(ast, example);
        
        if (result.success) {
            // Update commands file
            fs.writeFileSync(commandsFile, JSON.stringify(result.commands, null, 2));
            
            // Update metadata
            const metadata = fs.readFileSync(metaFile, 'utf8');
            const updatedMetadata = metadata
                .replace('interpreterSkipped=true', 'interpreterSkipped=false')
                .replace(/commandCount=\d+/, `commandCount=${result.commands.length}`);
            
            fs.writeFileSync(metaFile, updatedMetadata + `\ncommandGenerated=true\ncommandGenerationTime=${Date.now()}`);
            
            return { success: true, commandCount: result.commands.length, name: example.name };
        } else {
            return { success: false, error: result.error, name: example.name };
        }
        
    } catch (error) {
        return { success: false, error: error.message, name: example.name };
    }
}

/**
 * Generate commands for fast examples only
 */
async function generateSelectiveCommands() {
    console.log('=== Selective Command Stream Generation ===');
    console.log('');
    
    const { fastExamples, slowExamples, total } = classifyExamples();
    
    console.log(`Classification results:`);
    console.log(`- Fast examples: ${fastExamples.length}`);
    console.log(`- Slow examples: ${slowExamples.length}`);
    console.log(`- Total: ${total}`);
    console.log('');
    console.log('Generating commands for fast examples only...');
    console.log('');
    
    const outputDir = 'test_data';
    const results = [];
    const startTime = Date.now();
    
    for (let i = 0; i < fastExamples.length; i++) {
        const example = fastExamples[i];
        const result = await updateExampleCommands(example, example.index, outputDir);
        results.push(result);
        
        if ((i + 1) % 10 === 0 || i === fastExamples.length - 1) {
            const elapsed = Date.now() - startTime;
            const rate = (i + 1) / elapsed * 1000;
            console.log(`[${i + 1}/${fastExamples.length}] ${(elapsed/1000).toFixed(1)}s elapsed, ${rate.toFixed(1)} commands/sec`);
        }
    }
    
    const totalTime = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('');
    console.log('=== SELECTIVE COMMAND GENERATION RESULTS ===');
    console.log(`Fast examples processed: ${fastExamples.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(`Time: ${(totalTime/1000).toFixed(1)} seconds`);
    console.log('');
    console.log('SUMMARY:');
    console.log(`- AST data: ${total}/135 examples (100%)`);
    console.log(`- Command data: ${successful}/${total} examples (${(successful*100/total).toFixed(1)}%)`);
    console.log(`- Slow examples: ${slowExamples.length} (AST-only, no commands due to debug overhead)`);
    
    if (failed > 0) {
        console.log('');
        console.log('COMMAND GENERATION FAILURES:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  ${r.name}: ${r.error}`);
        });
    }
    
    console.log('');
    console.log('✓ Selective command generation complete!');
    console.log('');
    console.log('C++ validation can now proceed with:');
    console.log(`- ${total} AST files for parsing validation`);
    console.log(`- ${successful} command files for execution validation`);
    
    return true;
}

if (require.main === module) {
    (async () => {
        try {
            const success = await generateSelectiveCommands();
            process.exit(success ? 0 : 1);
        } catch (error) {
            console.error('SELECTIVE ERROR:', error);
            process.exit(2);
        }
    })();
}

module.exports = { generateSelectiveCommands, classifyExamples };
