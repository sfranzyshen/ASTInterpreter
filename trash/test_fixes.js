#!/usr/bin/env node

console.log('🔧 Testing Fixes for Phase 6.4');
console.log('===============================');

const { Parser, parse } = require('./parser.js');
const { ASTInterpreter } = require('./interpreter.js');
const examples = require('./extracted_examples.js');

// Test the examples that were failing with specific error types
const testExamples = [
    'AnalogReadSerial.ino',  // "Cannot access 'funcName'" error
    'Fade.ino',              // "Invalid left operand type 'object'" error
    'p05_ServoMoodIndicator.ino',  // Previously working library example
    'BareMinimum.ino'        // Simple example that should always work
];

async function testFixes() {
    console.log(`\n🧪 Testing ${testExamples.length} specific examples...\n`);
    
    let successes = 0;
    let failures = [];
    
    for (const exampleName of testExamples) {
        const example = examples.find(ex => ex.name === exampleName);
        if (!example) {
            console.log(`❌ ${exampleName}: Example not found`);
            continue;
        }
        
        process.stdout.write(`[${exampleName}] `);
        
        try {
            // Parse
            const ast = parse(example.code);
            
            // Create interpreter
            const interpreter = new ASTInterpreter(ast, { 
                verbose: false,
                debug: false,
                maxLoopIterations: 1
            });
            
            // Track errors
            let error = null;
            interpreter.onError = (err) => {
                error = err;
            };
            
            // Start execution
            const started = interpreter.start();
            if (!started) {
                throw new Error('Failed to start');
            }
            
            // Quick execution test
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (error) {
                let errorMsg = 'Unknown error';
                if (typeof error === 'string') {
                    errorMsg = error;
                } else if (error && error.message) {
                    errorMsg = error.message;
                } else if (error && typeof error.toString === 'function') {
                    errorMsg = error.toString();
                }
                
                console.log(`❌ FAILED: ${errorMsg.substring(0, 60)}...`);
                failures.push({ name: exampleName, error: errorMsg });
            } else {
                console.log('✅ SUCCESS');
                successes++;
            }
            
        } catch (error) {
            console.log(`❌ SETUP ERROR: ${error.message}`);
            failures.push({ name: exampleName, error: error.message });
        }
    }
    
    console.log('\n📊 FIXES TEST RESULTS');
    console.log('======================');
    console.log(`Successes: ${successes}/${testExamples.length}`);
    console.log(`Success Rate: ${Math.round(successes / testExamples.length * 100)}%`);
    
    if (failures.length > 0) {
        console.log('\n❌ Still Failing:');
        failures.forEach(f => {
            console.log(`  - ${f.name}: ${f.error.substring(0, 80)}...`);
        });
    }
    
    console.log('\n🎯 Analysis:');
    if (successes === testExamples.length) {
        console.log('✅ All targeted fixes are working!');
        console.log('🚀 Ready for full compatibility test');
    } else if (successes > testExamples.length / 2) {
        console.log('⭐ Most fixes are working, some issues remain');
    } else {
        console.log('❌ Major issues still present, need more fixes');
    }
}

testFixes().catch(console.error);