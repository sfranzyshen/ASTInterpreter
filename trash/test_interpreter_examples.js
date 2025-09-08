/**
 * Node.js Interpreter Test Script for examples.js
 * Tests ASTInterpreter against all 79 Arduino examples
 */

const { Parser, parse } = require('./parser.js');
const { ASTInterpreter } = require('./interpreter.js');
const examples = require('./trash/extracted_examples.js');

console.log('🧪 Arduino Interpreter Test Suite - Examples.js');
console.log('================================================');
console.log(`Testing interpreter against ${examples.length} Arduino examples\n`);

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
        const interpreter = new ASTInterpreter(ast, { 
            verbose: false,
            debug: false,
            stepDelay: 0,
            maxLoopIterations: 3  // Limit loop() to 3 iterations to prevent infinite loops
        });
        
        // Track execution status
        let executionCompleted = false;
        let executionError = null;
        let loopIterations = 0;
        
        try {
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
            stack: error.stack,
            code: example.code.substring(0, 100) + '...'
        });
    }
}

async function runAllTests() {
    for (let i = 0; i < examples.length; i++) {
        const example = examples[i];
        const testName = example.name || `Test ${i + 1}`;
        await runTest(example, testName);
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${examples.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / examples.length) * 100).toFixed(1)}%`);
    console.log(`⏱️  Duration: ${duration}s`);

    if (errors.length > 0) {
        console.log('\n🔍 FAILURE DETAILS:');
        console.log('-'.repeat(30));
        errors.slice(0, 10).forEach((err, idx) => {  // Show first 10 errors
            console.log(`${idx + 1}. ${err.name}`);
            console.log(`   Error: ${err.error}`);
            if (err.loopIterations !== undefined) {
                console.log(`   Loop Iterations: ${err.loopIterations}`);
            }
            console.log(`   Code: ${err.code}`);
            console.log('');
        });
        
        if (errors.length > 10) {
            console.log(`... and ${errors.length - 10} more errors`);
        }
    }

    console.log('\n🎯 Test completed successfully');

    // Export results for potential use by other scripts
    module.exports = {
        total: examples.length,
        passed,
        failed,
        successRate: ((passed / examples.length) * 100).toFixed(1),
        duration,
        errors
    };
}

// Run the tests
runAllTests().catch(console.error);