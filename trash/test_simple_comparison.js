#!/usr/bin/env node
/**
 * Simple comparison of analogRead vs digitalRead
 */

const { parse } = require('./ArduinoParser.js');
const { ArduinoInterpreter } = require('./ArduinoInterpreter.js');

console.log('🔍 Simple Pattern Comparison');
console.log('============================');

async function testDigitalRead() {
    console.log('\n📋 Testing digitalRead (State Machine Pattern):');
    
    const code = `
void setup() { pinMode(2, INPUT); }
void loop() { 
    int val = digitalRead(2);
    Serial.println(val);
    delay(100);
}`;

    const ast = parse(code);
    const interpreter = new ArduinoInterpreter(ast, { 
        verbose: false,
        debug: false,
        maxLoopIterations: 1
    });
    
    let commands = 0;
    let requests = 0;
    let completed = false;
    
    interpreter.onCommand = (command) => {
        commands++;
        console.log(`📡 ${commands}: ${command.type}`);
        
        if (command.type === 'DIGITAL_READ_REQUEST') {
            requests++;
            console.log(`   State: ${interpreter.state}`);
            console.log(`   Suspended: ${interpreter.suspendedFunction}`);
            
            setTimeout(() => {
                console.log(`   📤 Calling resumeWithValue...`);
                interpreter.resumeWithValue(command.requestId, 1);
                console.log(`   State after resume: ${interpreter.state}`);
            }, 10);
        }
        
        if (command.type === 'PROGRAM_END') {
            completed = true;
        }
    };
    
    interpreter.start();
    
    // Wait for completion
    await new Promise(resolve => {
        const check = () => {
            if (completed || commands > 20) {
                resolve();
            } else {
                setTimeout(check, 100);
            }
        };
        setTimeout(check, 100);
    });
    
    console.log(`   ✅ Commands: ${commands}, Requests: ${requests}, Completed: ${completed}`);
    return { success: completed, commands, requests };
}

async function testAnalogRead() {
    console.log('\n📋 Testing analogRead (Async/Await Pattern):');
    
    const code = `
void setup() { }
void loop() { 
    int val = analogRead(A0);
    Serial.println(val);
    delay(100);
}`;

    const ast = parse(code);
    const interpreter = new ArduinoInterpreter(ast, { 
        verbose: false,
        debug: false,
        maxLoopIterations: 1
    });
    
    let commands = 0;
    let requests = 0;
    let completed = false;
    
    interpreter.onCommand = (command) => {
        commands++;
        console.log(`📡 ${commands}: ${command.type}`);
        
        if (command.type === 'ANALOG_READ_REQUEST') {
            requests++;
            console.log(`   State: ${interpreter.state}`);
            
            setTimeout(() => {
                console.log(`   📤 Calling resumeWithValue...`);
                interpreter.resumeWithValue(command.requestId, 512);
                console.log(`   State after resume: ${interpreter.state}`);
            }, 10);
        }
        
        if (command.type === 'PROGRAM_END') {
            completed = true;
        }
    };
    
    interpreter.start();
    
    // Wait for completion  
    await new Promise(resolve => {
        const check = () => {
            if (completed || commands > 20) {
                resolve();
            } else {
                setTimeout(check, 100);
            }
        };
        setTimeout(check, 100);
    });
    
    console.log(`   ✅ Commands: ${commands}, Requests: ${requests}, Completed: ${completed}`);
    return { success: completed, commands, requests };
}

async function main() {
    const digitalResult = await testDigitalRead();
    const analogResult = await testAnalogRead();
    
    console.log('\n🎯 RESULTS:');
    console.log('===========');
    console.log(`digitalRead: ${digitalResult.success ? '✅' : '❌'} (${digitalResult.commands} cmds)`);
    console.log(`analogRead:  ${analogResult.success ? '✅' : '❌'} (${analogResult.commands} cmds)`);
    
    if (!digitalResult.success && analogResult.success) {
        console.log('\n💡 CONFIRMED: State machine pattern (digitalRead) fails, async pattern (analogRead) works');
    }
}

main().catch(console.error);