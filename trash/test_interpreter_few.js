/**
 * Test just first 5 Arduino examples to get truthful feedback
 */

const { Parser, parse } = require('./parser.js');
const { ArduinoInterpreter } = require('./interpreter.js');
const examples = require('./trash/extracted_examples.js');

console.log('🧪 Arduino Interpreter Test Suite - First 5 Examples');
console.log('===================================================');

let passed = 0;
let failed = 0;
let errors = [];

const startTime = Date.now();

async function runTest(example, testName) {
    try {
        // Parse the code into AST
        const ast = parse(example.code);
        if (!ast) {
            throw new Error('Parser returned null AST');
        }
        
        // Create interpreter with AST and limited loop iterations
        const interpreter = new ArduinoInterpreter(ast, { 
            verbose: false,
            debug: false,
            stepDelay: 0,
            maxLoopIterations: 3  // Limit loop() to 3 iterations to prevent infinite loops
        });
        
        // Track execution status
        let executionCompleted = false;
        let executionError = null;
        let loopIterations = 0;
        
        // Set up command tracking to monitor execution
        interpreter.onCommand = (command) => {
            if (command.type === 'FUNCTION_CALL' && command.function === 'loop' && command.completed) {
                loopIterations++;
            }
            if (command.type === 'LOOP_END' && command.limitReached) {
                executionCompleted = true;
            }
            if (command.type === 'PROGRAM_END') {
                executionCompleted = true;
            }
            if (command.type === 'ERROR') {
                executionError = command.message;
                executionCompleted = true;
            }
        };
        
        // Set up error tracking
        interpreter.onError = (error) => {
            executionError = error;
            executionCompleted = true;
        };
        
        // Execute the interpreter
        const result = interpreter.start();
        
        // Wait a short moment for execution to complete
        if (!executionCompleted) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Determine success/failure based on actual execution
        const success = result !== false && !executionError && loopIterations >= 2;
        
        if (success) {
            console.log(`✅ PASS: ${testName} (${loopIterations} loop iterations)`);
            passed++;
        } else {
            const reason = executionError || (loopIterations < 2 ? `Only ${loopIterations} iterations` : 'Interpreter returned false');
            console.log(`❌ FAIL: ${testName} - ${reason}`);
            failed++;
            errors.push({
                name: testName,
                error: reason,
                loopIterations,
                code: example.code.substring(0, 100) + '...'
            });
        }
        
    } catch (error) {
        console.log(`❌ FAIL: ${testName} - ${error.message}`);
        failed++;
        errors.push({
            name: testName,
            error: error.message,
            loopIterations,
            code: example.code.substring(0, 100) + '...'
        });
    }
}

async function runTests() {
    // Test ALL examples
    for (let i = 0; i < examples.length; i++) {
        const example = examples[i];
        const testName = example.name || `Test ${i + 1}`;
        await runTest(example, testName);
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    const totalTests = passed + failed;

    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${totalTests > 0 ? ((passed / totalTests) * 100).toFixed(1) : 0}%`);
    console.log(`⏱️  Duration: ${duration}s`);

    if (errors.length > 0) {
        console.log('\n🔍 FAILURE DETAILS:');
        console.log('-'.repeat(30));
        errors.forEach((err, idx) => {
            console.log(`${idx + 1}. ${err.name}`);
            console.log(`   Error: ${err.error}`);
            if (err.loopIterations !== undefined) {
                console.log(`   Loop Iterations: ${err.loopIterations}`);
            }
            console.log(`   Code: ${err.code}`);
            console.log('');
        });
    }

    console.log('\n🎯 Test completed - TRUTHFUL RESULTS');
}

runTests().catch(console.error);