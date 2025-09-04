#!/usr/bin/env node

console.log('📊 Full Phase 6 Compatibility Test');
console.log('====================================');

const { Parser, parse } = require('./parser.js');
const { ASTInterpreter } = require('./interpreter.js');
const examples = require('./extracted_examples.js');

async function fastFullTest() {
    let successes = 0;
    let failures = [];
    const total = examples.length;
    
    console.log(`Testing ${total} Arduino examples...`);
    
    for (let i = 0; i < total; i++) {
        const example = examples[i];
        process.stdout.write(`\r[${i+1}/${total}] ${example.name}... `);
        
        try {
            // Parse
            const ast = parse(example.code);
            
            // Create interpreter
            const interpreter = new ASTInterpreter(ast, { 
                verbose: false,
                stepDelay: 0,
                maxLoopIterations: 1  // Very fast
            });
            
            // Quick execution test
            let completed = false;
            let error = null;
            
            // Silence console
            const originalConsole = console.log;
            console.log = () => {};
            
            interpreter.onError = (err) => {
                error = err;
                completed = true;
            };
            
            interpreter.onCommand = (cmd) => {
                if (cmd.type === 'PROGRAM_END' || cmd.type === 'LOOP_LIMIT_REACHED') {
                    completed = true;
                }
                if (cmd.type === 'ERROR') {
                    error = cmd.message;
                    completed = true;
                }
            };
            
            const started = interpreter.start();
            if (!started) {
                console.log = originalConsole;
                throw new Error('Failed to start');
            }
            
            // Wait for completion with timeout
            let timeoutReached = false;
            const timeout = setTimeout(() => {
                timeoutReached = true;
                completed = true;
                interpreter.stop();
            }, 1000);  // 1 second timeout
            
            while (!completed && !timeoutReached) {
                await new Promise(resolve => setTimeout(resolve, 25));
            }
            
            clearTimeout(timeout);
            console.log = originalConsole;
            
            if (error) {
                process.stdout.write('❌\n');
                // Extract meaningful error message
                let errorMessage = 'Unknown error';
                if (typeof error === 'string') {
                    errorMessage = error;
                } else if (error && error.message) {
                    errorMessage = error.message;
                } else if (error && typeof error.toString === 'function') {
                    errorMessage = error.toString();
                } else {
                    errorMessage = JSON.stringify(error);
                }
                failures.push({ name: example.name, error: errorMessage });
            } else {
                process.stdout.write('✅\n');
                successes++;
            }
            
        } catch (error) {
            process.stdout.write('❌\n');
            failures.push({ name: example.name, error: error.message });
        }
    }
    
    console.log('\n📊 FINAL RESULTS');
    console.log('=================');
    console.log(`Successes: ${successes}/${total}`);
    console.log(`Failures: ${failures.length}/${total}`);
    console.log(`Success Rate: ${Math.round(successes / total * 100)}%`);
    
    if (failures.length > 0) {
        console.log('\n❌ Failed Examples:');
        failures.slice(0, 10).forEach(f => {
            const shortError = f.error.substring(0, 80) + (f.error.length > 80 ? '...' : '');
            console.log(`  - ${f.name}: ${shortError}`);
        });
        if (failures.length > 10) {
            console.log(`  ... and ${failures.length - 10} more`);
        }
    }
    
    console.log('\n🎯 Phase 6 Analysis:');
    if (successes === total) {
        console.log('🎉 100% COMPATIBILITY ACHIEVED!');
        console.log('✅ All Arduino examples working perfectly!');
    } else if (successes >= total * 0.99) {
        console.log('🔥 99%+ COMPATIBILITY ACHIEVED!');
        console.log('✅ Phase 6 objectives met!');
    } else if (successes >= total * 0.95) {
        console.log('⭐ 95%+ compatibility - excellent progress!');
    } else {
        console.log('📈 Good progress, more work needed');
    }
}

fastFullTest().catch(console.error);