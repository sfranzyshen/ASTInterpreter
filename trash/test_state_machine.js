/**
 * Test script for the new state machine architecture
 */

const { ArduinoInterpreter } = require('./ArduinoInterpreter.js');
const { parse } = require('./ArduinoParser.js');

// Simple test program that uses analogRead
const testCode = `
void setup() {
    Serial.begin(9600);
}

void loop() {
    int sensorValue = analogRead(A0);
    Serial.print("Sensor: ");
    Serial.println(sensorValue);
    delay(1000);
}
`;

console.log("Testing state machine architecture...");

try {
    // Parse the test code
    const ast = parse(testCode);
    console.log("✓ Code parsed successfully");
    
    // Create interpreter
    const interpreter = new ArduinoInterpreter(ast, {
        verbose: true,
        debug: false,
        maxLoopIterations: 2 // Only run 2 loop iterations
    });
    
    let commandCount = 0;
    let executionCompleted = false;
    
    // Set up command handler
    interpreter.onCommand = (command) => {
        commandCount++;
        console.log(`Command ${commandCount}:`, command.type, command);
        
        // Handle external data requests with state machine
        if (command.type === 'ANALOG_READ_REQUEST') {
            const mockValue = 512; // Mock sensor reading
            console.log(`Responding to ${command.requestId} with value ${mockValue}`);
            interpreter.resumeWithValue(command.requestId, mockValue);
        }
        
        if (command.type === 'PROGRAM_END' || command.type === 'LOOP_LIMIT_REACHED') {
            executionCompleted = true;
            console.log("✓ Execution completed");
        }
        
        if (command.type === 'ERROR') {
            console.error("✗ Execution error:", command.message);
            executionCompleted = true;
        }
    };
    
    // Start execution
    interpreter.start();
    interpreter.tick(); // Start the state machine
    
    // Wait for completion (with timeout)
    const startTime = Date.now();
    const timeout = 10000; // 10 second timeout
    
    function checkCompletion() {
        if (executionCompleted) {
            console.log(`✓ Test completed in ${Date.now() - startTime}ms`);
            console.log(`Total commands: ${commandCount}`);
            console.log(`Final state: ${interpreter.state}`);
        } else if (Date.now() - startTime > timeout) {
            console.error("✗ Test timed out");
            console.log(`Final state: ${interpreter.state}`);
            console.log(`Total commands: ${commandCount}`);
        } else {
            // Check again in 100ms
            setTimeout(checkCompletion, 100);
        }
    }
    
    checkCompletion();
    
} catch (error) {
    console.error("✗ Test failed:", error.message);
    console.error(error.stack);
}