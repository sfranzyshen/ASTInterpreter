#!/usr/bin/env node

/**
 * Debug performance issues in test data generation
 */

const { parse, exportCompactAST } = require('./ArduinoParser.js');
const { ArduinoInterpreter } = require('./ArduinoInterpreter.js');
const { examplesFiles } = require('./examples.js');

/**
 * Quick test of a single example with timing
 */
async function quickTest(index) {
    const example = examplesFiles[index];
    const start = Date.now();
    
    try {
        // Step 1: Parse (measure parsing time)
        const parseStart = Date.now();
        const ast = parse(example.content);
        const parseTime = Date.now() - parseStart;
        
        // Step 2: Compact AST (measure AST export time)
        const astStart = Date.now();
        const compactAST = exportCompactAST(ast);
        const astTime = Date.now() - astStart;
        
        // Step 3: Interpreter execution (measure execution time)
        const execStart = Date.now();
        const interpreter = new ArduinoInterpreter(ast, { 
            maxLoopIterations: 3, 
            stepDelay: 0,
            verbose: false,
            debug: false
        });
        
        let completed = false;
        let commandCount = 0;
        
        interpreter.onCommand = (cmd) => {
            commandCount++;
            if (cmd.type === 'PROGRAM_END' || cmd.type === 'ERROR' || cmd.type === 'LOOP_LIMIT_REACHED') {
                completed = true;
            }
        };
        
        // Mock response handler
        interpreter.responseHandler = (req) => {
            setTimeout(() => interpreter.handleResponse(req.id, 512), 1);
        };
        
        const originalLog = console.log;
        console.log = () => {};
        
        interpreter.start();
        
        // Wait for completion with timeout
        await new Promise(resolve => {
            const timeout = setTimeout(() => { completed = true; resolve(); }, 3000);
            const check = () => {
                if (completed) {
                    clearTimeout(timeout);
                    resolve();
                } else {
                    setTimeout(check, 50);
                }
            };
            check();
        });
        
        console.log = originalLog;
        const execTime = Date.now() - execStart;
        const totalTime = Date.now() - start;
        
        console.log(`[${index}] ${example.name}:`);
        console.log(`  Parse: ${parseTime}ms, AST: ${astTime}ms, Exec: ${execTime}ms, Total: ${totalTime}ms`);
        console.log(`  Commands: ${commandCount}, AST Size: ${compactAST.byteLength} bytes`);
        
        return { index, name: example.name, parseTime, astTime, execTime, totalTime, commandCount, astSize: compactAST.byteLength };
        
    } catch (error) {
        const totalTime = Date.now() - start;
        console.log(`[${index}] ${example.name}: ${totalTime}ms ERROR: ${error.message}`);
        return { index, name: example.name, parseTime: 0, astTime: 0, execTime: 0, totalTime, commandCount: 0, astSize: 0, error: error.message };
    }
}

/**
 * Test examples around the timeout point
 */
async function analyzePerformance() {
    console.log('=== Performance Analysis Around Timeout Point ===');
    console.log('');
    
    const results = [];
    
    // Test examples 50-65 to see the pattern
    for (let i = 50; i < Math.min(examplesFiles.length, 66); i++) {
        const result = await quickTest(i);
        results.push(result);
    }
    
    console.log('');
    console.log('=== PERFORMANCE SUMMARY ===');
    
    const avgParse = results.reduce((sum, r) => sum + r.parseTime, 0) / results.length;
    const avgAST = results.reduce((sum, r) => sum + r.astTime, 0) / results.length;
    const avgExec = results.reduce((sum, r) => sum + r.execTime, 0) / results.length;
    const avgTotal = results.reduce((sum, r) => sum + r.totalTime, 0) / results.length;
    
    console.log(`Average Parse Time: ${avgParse.toFixed(1)}ms`);
    console.log(`Average AST Export Time: ${avgAST.toFixed(1)}ms`);
    console.log(`Average Execution Time: ${avgExec.toFixed(1)}ms`);
    console.log(`Average Total Time: ${avgTotal.toFixed(1)}ms`);
    
    // Identify slow examples
    const slowExamples = results.filter(r => r.totalTime > avgTotal * 2);
    if (slowExamples.length > 0) {
        console.log('');
        console.log('SLOW EXAMPLES (>2x average):');
        slowExamples.forEach(r => {
            console.log(`  ${r.name}: ${r.totalTime}ms (exec: ${r.execTime}ms)`);
        });
    }
    
    return results;
}

if (require.main === module) {
    analyzePerformance().catch(console.error);
}

module.exports = { quickTest, analyzePerformance };
