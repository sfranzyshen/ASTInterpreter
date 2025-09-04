#!/usr/bin/env node

/**
 * Simple script to capture JavaScript interpreter command stream output
 * for comparison with C++ implementation
 */

const { parse } = require('./ArduinoParser.js');
const { ASTInterpreter } = require('./ASTInterpreter.js');

// Simple Arduino code
const simpleCode = `
void setup() {
    pinMode(13, OUTPUT);
}

void loop() {
    digitalWrite(13, HIGH);
    delay(1000);
}
`;

console.log('Testing simple Arduino code:');
console.log(simpleCode);
console.log('\n=== JAVASCRIPT INTERPRETER COMMANDS ===');

try {
    // Parse code
    const ast = parse(simpleCode);
    
    // Create interpreter
    const interpreter = new ASTInterpreter(ast, {
        verbose: false,
        debug: false,
        stepDelay: 0,
        maxLoopIterations: 2
    });
    
    // Capture commands
    const commands = [];
    interpreter.onCommand = (command) => {
        commands.push(command);
        console.log(JSON.stringify(command, null, 2));
    };
    
    // Set up response handler for external data functions
    interpreter.responseHandler = (request) => {
        setTimeout(() => {
            let mockValue = 0;
            switch (request.type) {
                case 'analogRead': mockValue = Math.floor(Math.random() * 1024); break;
                case 'digitalRead': mockValue = Math.random() > 0.5 ? 1 : 0; break;
                case 'millis': mockValue = Date.now() % 100000; break;
                case 'micros': mockValue = Date.now() * 1000 % 1000000; break;
            }
            interpreter.handleResponse(request.id, mockValue);
        }, Math.random() * 10);
    };
    
    // Start execution
    const started = interpreter.start();
    
    if (!started) {
        console.error('Failed to start interpreter');
        process.exit(1);
    }
    
    // Wait for completion
    setTimeout(() => {
        console.log('\n=== SUMMARY ===');
        console.log(`Total commands: ${commands.length}`);
        console.log(`First command type: ${commands[0] ? commands[0].type : 'None'}`);
        console.log(`Last command type: ${commands[commands.length-1] ? commands[commands.length-1].type : 'None'}`);
        
        // Save commands to file for C++ comparison
        require('fs').writeFileSync('js_command_stream.json', JSON.stringify(commands, null, 2));
        console.log('Commands saved to js_command_stream.json');
        
        process.exit(0);
    }, 2000);
    
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}