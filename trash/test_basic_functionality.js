#!/usr/bin/env node

console.log('🔧 Testing Basic Interpreter Functionality');
console.log('==========================================');

const { Parser, parse } = require('./parser.js');
const { ArduinoInterpreter } = require('./interpreter.js');

// Test simple Arduino code with basic functions
const testCode = `
void setup() {
    pinMode(13, OUTPUT);
    Serial.begin(9600);
}

void loop() {
    digitalWrite(13, HIGH);
    delay(1000);
    digitalWrite(13, LOW);
    delay(1000);
}
`;

console.log('📝 Test code (classic Arduino Blink):');
console.log(testCode);

async function testBasicFunctionality() {
    try {
        console.log('\n1️⃣ Parsing...');
        const ast = parse(testCode);
        console.log('✅ Parsed successfully');
        
        console.log('\n2️⃣ Creating interpreter...');
        const interpreter = new ArduinoInterpreter(ast, { 
            verbose: false,
            maxLoopIterations: 2  // Just run loop twice for testing
        });
        console.log('✅ Interpreter created');
        
        console.log('\n3️⃣ Testing basic Arduino functions...');
        
        // Track function calls
        let functionsCalled = [];
        let errors = [];
        
        // Override emitCommand to track what functions are called
        const originalEmitCommand = interpreter.emitCommand;
        interpreter.emitCommand = function(command) {
            if (command.type === 'DIGITAL_WRITE' || command.type === 'PIN_MODE' || command.type === 'DELAY') {
                functionsCalled.push(command.type);
            }
            return originalEmitCommand.call(this, command);
        };
        
        interpreter.onError = (error) => {
            errors.push(error);
            console.log(`❌ ERROR: ${error.message || error}`);
        };
        
        // Start execution
        const started = interpreter.start();
        if (!started) {
            console.log('❌ Failed to start interpreter');
            return;
        }
        console.log('✅ Execution started');
        
        // Wait for execution
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\n📊 BASIC FUNCTIONALITY RESULTS');
        console.log('================================');
        console.log(`Errors: ${errors.length}`);
        console.log(`Functions called: ${functionsCalled.length}`);
        console.log(`Function types: ${[...new Set(functionsCalled)].join(', ')}`);
        
        if (errors.length === 0) {
            console.log('✅ No errors - basic functionality working');
        } else {
            console.log('❌ Errors detected:');
            errors.slice(0, 3).forEach(err => {
                console.log(`  - ${err.message || err}`);
            });
        }
        
        if (functionsCalled.includes('PIN_MODE') && functionsCalled.includes('DIGITAL_WRITE') && functionsCalled.includes('DELAY')) {
            console.log('✅ Core Arduino functions working (pinMode, digitalWrite, delay)');
        } else {
            console.log('❌ Some core Arduino functions not working');
        }
        
        console.log('\n🎯 Analysis:');
        if (errors.length === 0 && functionsCalled.length > 0) {
            console.log('✅ Basic interpreter functionality RESTORED');
            console.log('✅ Ready for full compatibility testing');
        } else {
            console.log('❌ Basic functionality still has issues');
        }
        
    } catch (error) {
        console.log('\n❌ BASIC FUNCTIONALITY TEST FAILED:', error.message);
        console.log('Stack:', error.stack);
    }
}

testBasicFunctionality();