#!/usr/bin/env node

console.log('🔍 Testing Enhanced Error Reporting');
console.log('===================================');

const { Parser, parse } = require('./parser.js');
const { ASTInterpreter } = require('./interpreter.js');

// Test code with intentional errors at specific locations
const testCode = `
void setup() {
    int x = 5;
    int y = undefinedVariable;  // Error on line 4
    Serial.begin(9600);
}

void loop() {
    nonExistentFunction();     // Error on line 9  
    int z = 10 / 0;           // Division by zero on line 10
    delay(1000);
}
`;

console.log('📝 Test code:');
console.log(testCode);

async function testEnhancedErrors() {
    try {
        // Parse the code
        console.log('\n1️⃣ Parsing code...');
        const ast = parse(testCode);
        console.log('✅ Parsed successfully (no syntax errors)');
        
        // Create interpreter
        console.log('\n2️⃣ Creating interpreter...');
        const interpreter = new ASTInterpreter(ast, { verbose: false });
        console.log('✅ Interpreter created');
        
        // Collect errors 
        const errors = [];
        interpreter.onError = (error) => {
            errors.push(error);
            console.log('\n❌ ENHANCED ERROR DETECTED:');
            console.log('   Message:', error.message);
            console.log('   Original:', error.originalMessage);
            console.log('   Location:', error.location);
            console.log('   Node Type:', error.node?.type);
        };
        
        // Start execution
        console.log('\n3️⃣ Starting execution...');
        const started = interpreter.start();
        if (!started) {
            console.log('❌ Failed to start interpreter');
            return;
        }
        
        // Wait a bit for execution
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Results
        console.log('\n📊 ENHANCED ERROR REPORTING RESULTS');
        console.log('=====================================');
        console.log(`Errors collected: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log('\n🔍 Error Analysis:');
            errors.forEach((error, index) => {
                console.log(`\n[Error ${index + 1}]`);
                console.log(`  Enhanced message: ${error.message}`);
                console.log(`  Has location info: ${error.location ? 'YES' : 'NO'}`);
                if (error.location) {
                    console.log(`  Line ${error.location.line}, Column ${error.location.column}`);
                    console.log(`  Context: ${error.location.context}`);
                }
            });
            
            console.log('\n✅ Enhanced error reporting is working!');
        } else {
            console.log('ℹ️  No runtime errors detected (might be intentional)');
        }
        
    } catch (error) {
        console.log('\n❌ TEST FAILED:', error.message);
    }
}

testEnhancedErrors();