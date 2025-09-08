#!/usr/bin/env node

console.log('🔍 Diagnosing Compatibility Issues');
console.log('==================================');

const { Parser, parse } = require('./parser.js');
const { ASTInterpreter } = require('./interpreter.js');
const examples = require('./extracted_examples.js');

// Test a simple, known-working example first
const simpleExample = examples.find(ex => ex.name === 'BareMinimum.ino');

console.log('📝 Testing simple example first:');
console.log('Example:', simpleExample.name);
console.log('Code length:', simpleExample.code.length);

async function diagnoseIssues() {
    try {
        // Parse the code
        console.log('\n1️⃣ Parsing...');
        const ast = parse(simpleExample.code);
        console.log('✅ Parsed successfully');
        
        // Create interpreter
        console.log('\n2️⃣ Creating interpreter...');
        const interpreter = new ASTInterpreter(ast, { 
            verbose: false,
            debug: false,
            maxLoopIterations: 1
        });
        console.log('✅ Interpreter created');
        
        // Monitor all errors in detail
        let errorCount = 0;
        let errorDetails = [];
        
        interpreter.onError = (error) => {
            errorCount++;
            console.log('\n❌ DETAILED ERROR ANALYSIS:');
            console.log('  Type of error:', typeof error);
            console.log('  Error object:', error);
            console.log('  Error message:', error.message);
            console.log('  Error toString():', error.toString());
            console.log('  Error JSON:', JSON.stringify(error, null, 2));
            
            errorDetails.push({
                type: typeof error,
                message: error.message,
                string: error.toString(),
                json: JSON.stringify(error)
            });
        };
        
        interpreter.onCommand = (command) => {
            if (command.type === 'ERROR') {
                console.log('\n📍 ERROR COMMAND:', command);
            }
        };
        
        // Start execution
        console.log('\n3️⃣ Starting execution...');
        const started = interpreter.start();
        if (!started) {
            console.log('❌ Failed to start interpreter');
            return;
        }
        
        // Wait for execution
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Results
        console.log('\n📊 DIAGNOSTIC RESULTS');
        console.log('======================');
        console.log(`Total errors: ${errorCount}`);
        console.log(`Error details collected: ${errorDetails.length}`);
        
        if (errorCount === 0) {
            console.log('✅ No errors detected in simple example');
            console.log('🔍 Issue might be with error handling in the test framework');
        } else {
            console.log('\n🔍 Error Analysis:');
            errorDetails.forEach((error, index) => {
                console.log(`\n[Error ${index + 1}]:`);
                console.log(`  Type: ${error.type}`);
                console.log(`  Message: ${error.message}`);
                console.log(`  String: ${error.string}`);
                console.log(`  JSON length: ${error.json.length}`);
            });
        }
        
    } catch (error) {
        console.log('\n❌ DIAGNOSTIC FAILED:', error.message);
        console.log('Stack:', error.stack);
    }
}

diagnoseIssues();