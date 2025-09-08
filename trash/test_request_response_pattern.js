const { Parser, parse } = require('./ArduinoParser.js');
const { ASTInterpreter } = require('./ASTInterpreter.js');

/**
 * Test request-response pattern for external data functions
 */

console.log('=== Request-Response Pattern Test ===');

const testCode = `
void setup() {
  Serial.begin(9600);
}

void loop() {
  int sensorValue = analogRead(14);
  Serial.println(sensorValue);
  delay(1000);
}
`;

async function testRequestResponse() {
    try {
        console.log('1. Parsing test code...');
        const ast = parse(testCode);
        
        console.log('2. Creating interpreter...');
        const interpreter = new ASTInterpreter(ast, {
            verbose: true,
            debug: false,
            maxLoopIterations: 2
        });
        
        let commandCount = 0;
        let analogReadRequests = 0;
        let errors = [];
        
        console.log('3. Setting up event handlers...');
        
        interpreter.onCommand = (command) => {
            commandCount++;
            console.log(`Command ${commandCount}: ${command.type}`, command);
            
            // Handle analogRead requests
            if (command.type === 'ANALOG_READ_REQUEST') {
                analogReadRequests++;
                console.log(`   → Received analogRead request: ${command.requestId}`);
                console.log(`   → Responding with mock value 512`);
                
                // Simulate playground response with slight delay
                setTimeout(() => {
                    const success = interpreter.resumeWithValue(command.requestId, 512);
                    console.log(`   → resumeWithValue result: ${success}`);
                }, 10);
            }
            
            if (command.type === 'ERROR') {
                errors.push(command.message);
            }
        };
        
        interpreter.onError = (error) => {
            console.error('Interpreter error:', error);
            errors.push(error.message || error);
        };
        
        console.log('4. Starting interpreter...');
        const startResult = interpreter.start();
        console.log(`Start result: ${startResult}`);
        
        // Wait for execution to complete
        await new Promise(resolve => {
            let checkCount = 0;
            const checkCompletion = () => {
                checkCount++;
                const state = interpreter.getState();
                console.log(`Check ${checkCount}: State = ${state}, Commands = ${commandCount}, Requests = ${analogReadRequests}`);
                
                if (state === 'COMPLETE' || state === 'ERROR' || checkCount > 50) {
                    resolve();
                } else {
                    setTimeout(checkCompletion, 200);
                }
            };
            setTimeout(checkCompletion, 100);
        });
        
        console.log('\\n=== Test Results ===');
        console.log(`Total commands: ${commandCount}`);
        console.log(`AnalogRead requests: ${analogReadRequests}`);
        console.log(`Errors: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log('❌ ERRORS FOUND:');
            errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        } else if (analogReadRequests > 0) {
            console.log('✅ Request-response pattern working!');
        } else {
            console.log('⚠️  No analogRead requests detected');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

testRequestResponse();