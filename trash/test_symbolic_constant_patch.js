#!/usr/bin/env node

/**
 * Test Symbolic Constant Corruption Fix Patch
 * 
 * Verifies that pinMode() and digitalWrite() commands now contain
 * numeric values (1, 0) instead of string values ("OUTPUT", "HIGH")
 */

const { parse } = require('./ArduinoParser.js');
const { ASTInterpreter } = require('./ASTInterpreter.js');

console.log('🧪 Testing Symbolic Constant Corruption Fix Patch\n');

// Test code with symbolic constants
const testCode = `
void setup() {
    pinMode(13, OUTPUT);     // Should show: pinMode(13, 1)
    digitalWrite(13, HIGH);  // Should show: digitalWrite(13, 1)
    pinMode(12, INPUT);      // Should show: pinMode(12, 0)
    digitalWrite(12, LOW);   // Should show: digitalWrite(12, 0)
}

void loop() {}
`;

async function testPatch() {
    try {
        console.log('🔍 Parsing Arduino code with symbolic constants...');
        const ast = parse(testCode);
        
        console.log('⚡ Creating interpreter...');
        const interpreter = new ASTInterpreter(ast, { 
            verbose: false,
            stepDelay: 0,
            maxLoopIterations: 1
        });
        
        const capturedCommands = [];
        let testCompleted = false;
        
        // Capture commands
        interpreter.onCommand = (command) => {
            capturedCommands.push(command);
            
            if (command.type === 'PROGRAM_END') {
                testCompleted = true;
            }
        };
        
        console.log('🚀 Starting interpreter execution...');
        interpreter.start();
        
        // Wait for completion
        await new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (testCompleted) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 10);
        });
        
        // Analyze captured commands
        console.log('\n📊 RESULTS:');
        console.log('════════════════════════════════════════');
        
        const pinModeCommands = capturedCommands.filter(cmd => cmd.type === 'PIN_MODE');
        const digitalWriteCommands = capturedCommands.filter(cmd => cmd.type === 'DIGITAL_WRITE');
        
        console.log(`📍 Found ${pinModeCommands.length} PIN_MODE commands:`);
        pinModeCommands.forEach(cmd => {
            const modeType = typeof cmd.mode;
            const isNumeric = modeType === 'number';
            const status = isNumeric ? '✅' : '❌';
            console.log(`  ${status} pinMode(${cmd.pin}, ${cmd.mode}) [type: ${modeType}]`);
        });
        
        console.log(`\n🔌 Found ${digitalWriteCommands.length} DIGITAL_WRITE commands:`);
        digitalWriteCommands.forEach(cmd => {
            const valueType = typeof cmd.value;
            const isNumeric = valueType === 'number';
            const status = isNumeric ? '✅' : '❌';
            console.log(`  ${status} digitalWrite(${cmd.pin}, ${cmd.value}) [type: ${valueType}]`);
        });
        
        // Overall assessment
        const allPinModeNumeric = pinModeCommands.every(cmd => typeof cmd.mode === 'number');
        const allDigitalWriteNumeric = digitalWriteCommands.every(cmd => typeof cmd.value === 'number');
        
        console.log('\n🎯 PATCH ASSESSMENT:');
        console.log('════════════════════════════════════════');
        
        if (allPinModeNumeric && allDigitalWriteNumeric) {
            console.log('🎉 PATCH SUCCESS! All commands contain numeric values.');
            console.log('✅ pinMode() emits numeric mode values (0, 1, 2)');
            console.log('✅ digitalWrite() emits numeric values (0, 1)');
            console.log('✅ No more string corruption ("OUTPUT", "HIGH")');
        } else {
            console.log('❌ PATCH FAILED! Some commands still contain string values.');
            if (!allPinModeNumeric) {
                console.log('❌ pinMode() commands contain non-numeric modes');
            }
            if (!allDigitalWriteNumeric) {
                console.log('❌ digitalWrite() commands contain non-numeric values');
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run test
testPatch().then(() => {
    console.log('\n✅ Symbolic constant corruption fix patch test completed!');
}).catch(error => {
    console.error('❌ Test error:', error.message);
    process.exit(1);
});