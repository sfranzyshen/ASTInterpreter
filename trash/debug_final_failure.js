#!/usr/bin/env node

console.log('🔍 Debugging Final Failure - ArduinoISP.ino');
console.log('==============================================');

const { Parser, parse } = require('./parser.js');
const { ASTInterpreter } = require('./interpreter.js');
const examples = require('./extracted_examples.js');

const example = examples.find(ex => ex.name === 'ArduinoISP.ino');
if (!example) {
    console.log('❌ Example not found');
    process.exit(1);
}

console.log('📄 Example found, analyzing...');
console.log('Code length:', example.code.length);

async function debugExample() {
try {
    // Parse
    console.log('1️⃣ Parsing...');
    const ast = parse(example.code);
    console.log('✅ Parsed successfully');
    
    // Create interpreter 
    console.log('2️⃣ Creating interpreter...');
    const interpreter = new ASTInterpreter(ast, { 
        verbose: true, // Enable verbose for debugging
        stepDelay: 0,
        maxLoopIterations: 1
    });
    console.log('✅ Interpreter created');
    
    // Track errors and execution
    console.log('3️⃣ Setting up error tracking...');
    let completed = false;
    let error = null;
    let commandCount = 0;
    
    interpreter.onError = (err) => {
        error = err;
        completed = true;
        console.log('❌ ERROR DETECTED:', err);
    };
    
    interpreter.onCommand = (cmd) => {
        commandCount++;
        if (cmd.type === 'PROGRAM_END' || cmd.type === 'LOOP_LIMIT_REACHED') {
            completed = true;
        }
        if (cmd.type === 'ERROR') {
            error = cmd.message;
            completed = true;
            console.log('❌ COMMAND ERROR:', cmd.message);
        }
    };
    
    // Start execution 
    console.log('4️⃣ Starting execution...');
    const started = interpreter.start();
    if (!started) {
        console.log('❌ Failed to start interpreter');
        process.exit(1);
    }
    console.log('✅ Execution started');
    
    // Wait for completion
    console.log('5️⃣ Waiting for completion...');
    let timeoutReached = false;
    const timeout = setTimeout(() => {
        timeoutReached = true;
        completed = true;
        interpreter.stop();
        console.log('⏰ Execution timeout reached');
    }, 5000);
    
    while (!completed && !timeoutReached) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    clearTimeout(timeout);
    
    console.log('\n📊 DEBUG RESULTS');
    console.log('=================');
    console.log('Commands emitted:', commandCount);
    console.log('Completed:', completed);
    console.log('Error:', error);
    console.log('Timeout reached:', timeoutReached);
    
    if (error) {
        console.log('\n❌ FAILURE ANALYSIS:');
        if (typeof error === 'object') {
            console.log('Error object:', JSON.stringify(error, null, 2));
        } else {
            console.log('Error message:', error);
        }
    } else {
        console.log('\n✅ Should have succeeded!');
    }
    
} catch (error) {
    console.log('❌ SETUP ERROR:', error.message);
    console.log('Stack:', error.stack);
}
}

debugExample().catch(console.error);