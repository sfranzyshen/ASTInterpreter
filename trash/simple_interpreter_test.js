/**
 * Simple single test to understand interpreter behavior
 */

const { Parser, parse } = require('./parser.js');
const { ASTInterpreter } = require('./interpreter.js');

// Simple test code
const testCode = `
void setup() {
    // Setup runs once
}

void loop() {
    // Loop runs repeatedly
}
`;

console.log('🧪 Simple Interpreter Test');
console.log('==========================');

try {
    console.log('1. Parsing code...');
    const ast = parse(testCode);
    console.log('   ✅ Parse successful');
    
    console.log('2. Creating interpreter...');
    const interpreter = new ASTInterpreter(ast, { 
        verbose: false,
        debug: false,
        stepDelay: 0,
        maxLoopIterations: 2
    });
    console.log('   ✅ Interpreter created');
    
    console.log('3. Setting up tracking...');
    let loopCount = 0;
    let executionComplete = false;
    let errorOccurred = false;
    
    interpreter.onCommand = (command) => {
        if (command.type === 'FUNCTION_CALL' && command.function === 'loop' && command.completed) {
            loopCount++;
            console.log(`   📍 Loop iteration ${loopCount} completed`);
        }
        if (command.type === 'LOOP_END' && command.limitReached) {
            executionComplete = true;
            console.log(`   🏁 Loop limit reached after ${command.iterations} iterations`);
        }
        if (command.type === 'PROGRAM_END') {
            console.log('   🏁 Program ended');
        }
        if (command.type === 'ERROR') {
            errorOccurred = true;
            console.log('   ❌ Error occurred:', command.message);
        }
    };
    
    console.log('4. Starting execution...');
    const result = interpreter.start();
    console.log('   ✅ Start result:', result);
    
    // Wait a moment for execution
    setTimeout(() => {
        console.log('\n📊 RESULTS:');
        console.log(`   Loop iterations: ${loopCount}`);
        console.log(`   Execution complete: ${executionComplete}`);
        console.log(`   Error occurred: ${errorOccurred}`);
        console.log(`   Start result: ${result}`);
        
        const success = result !== false && loopCount >= 2 && !errorOccurred;
        console.log(`   🎯 Test ${success ? 'PASSED' : 'FAILED'}`);
        
        process.exit(0);
    }, 500);
    
} catch (error) {
    console.log('❌ Test failed:', error.message);
    process.exit(1);
}