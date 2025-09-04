const { parse } = require('./parser.js');
const { ASTInterpreter } = require('./interpreter.js');
const { examplesFiles } = require('./examples.js');

// Find the ColorMixingLamp test
const test = examplesFiles.find(ex => ex.name === 'p04_ColorMixingLamp.ino');
if (!test) {
    console.log('❌ Test not found');
    process.exit(1);
}

console.log('🔍 DEBUGGING p04_ColorMixingLamp.ino');
console.log('=====================================');

const ast = parse(test.content, { enablePreprocessor: true });
const interpreter = new ASTInterpreter(ast, {
    verbose: false,
    debug: false, 
    stepDelay: 0,
    maxLoopIterations: 1 // Just 1 iteration to see the error
});

let errorFound = false;
interpreter.onCommand = (command) => {
    // Look for analogWrite commands
    if (command.type === 'ANALOG_WRITE') {
        console.log('📡 ANALOG_WRITE command:', command);
    }
};

interpreter.onError = (error) => {
    console.log('❌ ERROR FOUND:', error);
    errorFound = true;
};

// Mock response handler for analogRead calls
interpreter.responseHandler = (request) => {
    setTimeout(() => {
        let mockValue = 0;
        switch (request.type) {
            case 'analogRead':
                // Use a high but valid sensor value that could cause issues
                mockValue = 1020; // Near max but valid (0-1023)
                break;
            default:
                mockValue = 0;
        }
        console.log(`📥 Mock response: ${request.type} = ${mockValue}`);
        interpreter.handleResponse(request.id, mockValue);
    }, 1);
};

const result = interpreter.start();
console.log('🚀 Interpreter started:', result);

setTimeout(() => {
    if (!errorFound) {
        console.log('✅ No error found - test may have been fixed');
    }
    interpreter.stop();
}, 1000);