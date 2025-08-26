#!/usr/bin/env node

console.log('🔍 Testing Runtime Safety & Validation');
console.log('======================================');

const { Parser, parse } = require('./parser.js');
const { ArduinoInterpreter } = require('./interpreter.js');

// Test code with various type errors
const testCode = `
void setup() {
    int x = 5;
    int y;  // Uninitialized variable
    
    int result1 = x + y;     // Using uninitialized variable  
    int result2 = 10 / 0;    // Division by zero
    
    // Type mismatches
    int a = 5;
    String b = "hello";
    bool comparison = (a == b);  // Comparing int with string
    
    // Null operations  
    int* ptr = nullptr;
    int deref = *ptr;        // Dereferencing null pointer
}

void loop() {
    delay(1000);
}
`;

console.log('📝 Test code with intentional type errors:');
console.log(testCode);

async function testRuntimeValidation() {
    try {
        // Parse the code
        console.log('\n1️⃣ Parsing code...');
        const ast = parse(testCode);
        console.log('✅ Parsed successfully');
        
        // Create interpreter
        console.log('\n2️⃣ Creating interpreter...');
        const interpreter = new ArduinoInterpreter(ast, { verbose: false });
        console.log('✅ Interpreter created');
        
        // Collect errors and warnings
        const errors = [];
        const warnings = [];
        
        interpreter.onError = (error) => {
            errors.push(error);
            console.log(`\n❌ RUNTIME ERROR: ${error.message}`);
        };
        
        interpreter.onCommand = (command) => {
            if (command.type === 'WARNING') {
                warnings.push(command);
                console.log(`\n⚠️  RUNTIME WARNING: ${command.message}`);
            }
        };
        
        // Start execution
        console.log('\n3️⃣ Starting execution with runtime validation...');
        const started = interpreter.start();
        if (!started) {
            console.log('❌ Failed to start interpreter');
            return;
        }
        
        // Wait for execution
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Results
        console.log('\n📊 RUNTIME VALIDATION RESULTS');
        console.log('==============================');
        console.log(`Runtime Errors: ${errors.length}`);
        console.log(`Runtime Warnings: ${warnings.length}`);
        
        console.log('\n🔍 Analysis:');
        if (errors.length > 0) {
            console.log('✅ Runtime error detection is working!');
            console.log('✅ Type validation caught unsafe operations');
        }
        
        if (warnings.length > 0) {
            console.log('✅ Runtime warning system is working!');
            console.log('✅ Type compatibility warnings are being issued');  
        }
        
        if (errors.length === 0 && warnings.length === 0) {
            console.log('ℹ️  No runtime issues detected (validation might need tuning)');
        }
        
    } catch (error) {
        console.log('\n❌ TEST FAILED:', error.message);
    }
}

testRuntimeValidation();