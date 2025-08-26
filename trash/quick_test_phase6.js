#!/usr/bin/env node

console.log('🔬 Quick Phase 6A Test - Library Objects');
console.log('=========================================');

const { Parser, parse } = require('./parser.js');
const { ArduinoInterpreter } = require('./interpreter.js');
const examples = require('./extracted_examples.js');

// Test the 3 previously failing examples that should now work with ArduinoLibraryObject
const criticalTests = [
    'p13_TouchSensorLamp.ino',  // CapacitiveSensor library
    'p05_ServoMoodIndicator.ino', // Servo library  
    'p11_CrystalBall.ino'  // LiquidCrystal library
];

async function quickTest() {
    let successes = 0;
    const results = [];
    
    for (const testName of criticalTests) {
        const example = examples.find(ex => ex.name === testName);
        if (!example) {
            console.log(`❌ Example not found: ${testName}`);
            continue;
        }
        
        console.log(`\nTesting: ${testName}`);
        try {
            // Parse
            const ast = parse(example.code);
            console.log('  ✅ Parsed successfully');
            
            // Create interpreter
            const interpreter = new ArduinoInterpreter(ast, { 
                verbose: false,
                stepDelay: 0,
                maxLoopIterations: 2  // Very fast for testing
            });
            console.log('  ✅ Interpreter created');
            
            // Quick execution test
            let completed = false;
            let error = null;
            
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
                throw new Error('Failed to start interpreter');
            }
            console.log('  ✅ Execution started');
            
            // Wait for completion with short timeout
            let timeoutReached = false;
            const timeout = setTimeout(() => {
                timeoutReached = true;
                completed = true;
                interpreter.stop();
            }, 2000);  // 2 second timeout
            
            while (!completed && !timeoutReached) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            clearTimeout(timeout);
            
            if (error) {
                console.log(`  ❌ FAILED: ${error}`);
                results.push({ name: testName, success: false, error });
            } else {
                console.log('  ✅ SUCCESS');
                successes++;
                results.push({ name: testName, success: true });
            }
            
        } catch (error) {
            console.log(`  ❌ SETUP FAILED: ${error.message}`);
            results.push({ name: testName, success: false, error: error.message });
        }
    }
    
    console.log('\n📊 PHASE 6A RESULTS');
    console.log('===================');
    console.log(`Successes: ${successes}/${criticalTests.length}`);
    console.log(`Success Rate: ${Math.round(successes / criticalTests.length * 100)}%`);
    
    if (successes === criticalTests.length) {
        console.log('🎉 All critical library object tests passed!');
        console.log('✅ Phase 6A: Advanced object property access - COMPLETE');
    } else {
        console.log('❌ Some critical tests still failing:');
        results.forEach(r => {
            if (!r.success) {
                console.log(`  - ${r.name}: ${r.error?.substring(0, 80)}...`);
            }
        });
    }
}

quickTest().catch(console.error);