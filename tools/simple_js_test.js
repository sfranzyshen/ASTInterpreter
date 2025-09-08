/**
 * Simple test to see what the JavaScript interpreter does
 */

const { parse } = require('./ArduinoParser.js');
const { ASTInterpreter } = require('./ASTInterpreter.js');

const simpleCode = `void setup() {
    int x = 5;
}

void loop() {
}`;

console.log('=== Simple JavaScript Test ===');
console.log('Code:', simpleCode);

try {
    const ast = parse(simpleCode);
    console.log('AST parsed successfully');
    
    const interpreter = new ASTInterpreter(ast, {
        verbose: true,
        debug: true,
        maxLoopIterations: 3
    });
    
    let commandCount = 0;
    
    interpreter.onCommand = (command) => {
        commandCount++;
        console.log(`Command ${commandCount}: ${command.type}`);
        console.log('  Details:', JSON.stringify(command, null, 2));
    };
    
    interpreter.onError = (error) => {
        console.log('Error:', error);
    };
    
    console.log('\nStarting interpreter...');
    const result = interpreter.start();
    console.log('Start result:', result);
    
    // Let it run briefly
    setTimeout(() => {
        console.log('\nFinal state:');
        console.log('Commands generated:', commandCount);
        console.log('State:', interpreter.state);
        console.log('Setup function found:', !!interpreter.setupFunction);
        console.log('Loop function found:', !!interpreter.loopFunction);
    }, 1000);
    
} catch (error) {
    console.error('Test failed:', error);
}