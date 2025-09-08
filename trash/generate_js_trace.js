/**
 * Generate JavaScript execution trace for minimal test case
 */

const fs = require('fs');
const { Parser, parse, prettyPrintAST } = require('./ArduinoParser.js');
const { ASTInterpreter } = require('./ASTInterpreter.js');

// Read minimal test case
const testCode = fs.readFileSync('minimal_test.ino', 'utf8');
console.log('=== Minimal Test Code ===');
console.log(testCode);
console.log('\n');

try {
    // Parse the code
    console.log('=== Parsing Phase ===');
    const ast = parse(testCode);
    console.log('Parsing successful');
    
    // Create JavaScript interpreter with tracing enabled
    console.log('\n=== Interpretation Phase ===');
    const interpreter = new ASTInterpreter(ast, { 
        verbose: false,
        debug: false,
        stepDelay: 0,
        maxLoopIterations: 3
    });
    
    // Collect execution trace
    const jsTrace = [];
    
    // Override console.log to capture trace
    const originalConsoleLog = console.log;
    console.log = (...args) => {
        const message = args.join(' ');
        if (message.includes('visit(') || message.includes('evaluateExpression') || 
            message.includes('executeArduinoFunction') || message.includes('Declared variable')) {
            jsTrace.push(message);
        }
        originalConsoleLog(...args);
    };
    
    let commandCount = 0;
    let executionCompleted = false;
    
    interpreter.onCommand = (command) => {
        commandCount++;
        jsTrace.push(`COMMAND: ${command.type} - ${JSON.stringify(command)}`);
        if (command.type === 'PROGRAM_END' || command.type === 'ERROR' || command.type === 'LOOP_LIMIT_REACHED') {
            executionCompleted = true;
        }
    };
    
    interpreter.onError = (error) => {
        jsTrace.push(`ERROR: ${error}`);
        executionCompleted = true;
    };
    
    // Start execution
    const startResult = interpreter.start();
    if (!startResult) {
        throw new Error('Failed to start interpreter');
    }
    
    // Wait for completion (simplified for synchronous minimal test)
    const startTime = Date.now();
    while (!executionCompleted && (Date.now() - startTime) < 5000) {
        // Simple busy wait for minimal test
        // In a real scenario, this would be handled by the interpreter's event loop
    }
    
    // Restore console.log
    console.log = originalConsoleLog;
    
    console.log(`\n=== JavaScript Execution Summary ===`);
    console.log(`Commands generated: ${commandCount}`);
    console.log(`Execution completed: ${executionCompleted}`);
    console.log(`Trace entries: ${jsTrace.length}`);
    
    // Save JavaScript trace
    fs.writeFileSync('js_execution_trace.txt', jsTrace.join('\n'));
    console.log('\nJavaScript trace saved to: js_execution_trace.txt');
    
    console.log('\n=== First 20 Trace Entries ===');
    jsTrace.slice(0, 20).forEach((entry, index) => {
        console.log(`${index + 1}: ${entry}`);
    });
    
} catch (error) {
    console.error('JavaScript execution failed:', error);
}