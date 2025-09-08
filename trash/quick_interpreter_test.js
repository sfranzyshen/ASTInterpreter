/**
 * Quick test of all 79 Arduino examples - finishes fast
 */

const { Parser, parse } = require('./parser.js');
const { ASTInterpreter } = require('./interpreter.js');
const examples = require('./trash/extracted_examples.js');

console.log('🧪 Quick Arduino Interpreter Test - All 79 Examples');
console.log('===================================================');

let passed = 0;
let failed = 0;
let results = [];

const startTime = Date.now();

for (let i = 0; i < examples.length; i++) {
    const example = examples[i];
    const testName = example.name || `Test ${i + 1}`;
    
    try {
        // Parse the code
        const ast = parse(example.code);
        if (!ast) {
            throw new Error('Parse failed');
        }
        
        // Create interpreter with strict limits
        const interpreter = new ASTInterpreter(ast, { 
            verbose: false,
            debug: false,
            stepDelay: 0,
            maxLoopIterations: 3,
            executionTimeout: 100  // 100ms max per test
        });
        
        let loopCount = 0;
        let completed = false;
        
        // Track execution with timeout
        const timeout = setTimeout(() => {
            completed = true;
        }, 100);
        
        interpreter.onCommand = (cmd) => {
            if (cmd.type === 'FUNCTION_CALL' && cmd.function === 'loop' && cmd.completed) {
                loopCount++;
            }
            if (cmd.type === 'PROGRAM_END' || cmd.type === 'LOOP_END') {
                completed = true;
                clearTimeout(timeout);
            }
        };
        
        // Execute with timeout protection
        const result = interpreter.start();
        
        // Wait briefly for completion
        const waitStart = Date.now();
        while (!completed && (Date.now() - waitStart) < 100) {
            // Short wait
        }
        
        clearTimeout(timeout);
        
        const success = result !== false && loopCount >= 2;
        
        if (success) {
            passed++;
            console.log(`✅ ${testName} (${loopCount} iterations)`);
        } else {
            failed++;
            console.log(`❌ ${testName} (${loopCount} iterations)`);
        }
        
        results.push({
            name: testName,
            passed: success,
            loopCount: loopCount
        });
        
    } catch (error) {
        failed++;
        console.log(`❌ ${testName} (ERROR: ${error.message})`);
        results.push({
            name: testName,
            passed: false,
            error: error.message
        });
    }
}

const endTime = Date.now();
const duration = ((endTime - startTime) / 1000).toFixed(2);

console.log('\n' + '='.repeat(50));
console.log('📊 FINAL RESULTS - ALL 79 EXAMPLES');
console.log('='.repeat(50));
console.log(`Total Tests: ${examples.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed / examples.length) * 100).toFixed(1)}%`);
console.log(`⏱️  Duration: ${duration}s`);

console.log('\n🎯 Test completed - NO MORE RUNNING AWAY!');