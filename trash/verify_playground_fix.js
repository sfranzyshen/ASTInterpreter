const { Parser, parse } = require('./ArduinoParser.js');
const { ArduinoInterpreter } = require('./ArduinoInterpreter.js');

/**
 * Verify the playground fix by simulating browser-like behavior
 */

console.log('=== Playground Fix Verification ===');

const testCode = `
void setup() {
  Serial.begin(9600);
}

void loop() {
  int value = analogRead(A0);
  Serial.println(value);
  delay(100);
}
`;

async function verifyPlaygroundFix() {
    try {
        console.log('1. Testing with setTimeout (playground pattern)...');
        await testWithTimeout();
        
        console.log('\\n2. Testing without setTimeout (race condition test)...');
        await testWithoutTimeout();
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    }
}

async function testWithTimeout() {
    const ast = parse(testCode);
    const interpreter = new ArduinoInterpreter(ast, {
        verbose: false,
        maxLoopIterations: 1
    });
    
    let analogRequests = 0;
    let timeoutErrors = 0;
    
    interpreter.onCommand = (command) => {
        if (command.type === 'ANALOG_READ_REQUEST') {
            analogRequests++;
            // Simulate playground pattern with setTimeout
            setTimeout(() => {
                interpreter.resumeWithValue(command.requestId, 789);
            }, 1);
        }
        
        if (command.type === 'ERROR' && command.message.includes('timeout')) {
            timeoutErrors++;
        }
    };
    
    interpreter.onError = (error) => {
        if (error.message && error.message.includes('timeout')) {
            timeoutErrors++;
        }
    };
    
    interpreter.start();
    
    // Wait for completion
    await new Promise(resolve => {
        const check = () => {
            if (interpreter.getState() === 'IDLE' || interpreter.getState() === 'COMPLETE') {
                resolve();
            } else {
                setTimeout(check, 100);
            }
        };
        setTimeout(check, 100);
    });
    
    console.log(`   Requests: ${analogRequests}, Timeouts: ${timeoutErrors}`);
    
    if (timeoutErrors === 0 && analogRequests > 0) {
        console.log('   ✅ WITH setTimeout: SUCCESS - No timeouts');
        return true;
    } else {
        console.log('   ❌ WITH setTimeout: FAILED - Timeouts detected');
        return false;
    }
}

async function testWithoutTimeout() {
    const ast = parse(testCode);
    const interpreter = new ArduinoInterpreter(ast, {
        verbose: false,
        maxLoopIterations: 1
    });
    
    let analogRequests = 0;
    let timeoutErrors = 0;
    
    interpreter.onCommand = (command) => {
        if (command.type === 'ANALOG_READ_REQUEST') {
            analogRequests++;
            // Simulate old synchronous pattern (potential race condition)
            interpreter.resumeWithValue(command.requestId, 456);
        }
        
        if (command.type === 'ERROR' && command.message.includes('timeout')) {
            timeoutErrors++;
        }
    };
    
    interpreter.onError = (error) => {
        if (error.message && error.message.includes('timeout')) {
            timeoutErrors++;
        }
    };
    
    interpreter.start();
    
    // Wait for completion
    await new Promise(resolve => {
        const check = () => {
            if (interpreter.getState() === 'IDLE' || interpreter.getState() === 'COMPLETE') {
                resolve();
            } else {
                setTimeout(check, 100);
            }
        };
        setTimeout(check, 100);
    });
    
    console.log(`   Requests: ${analogRequests}, Timeouts: ${timeoutErrors}`);
    
    if (timeoutErrors === 0 && analogRequests > 0) {
        console.log('   ✅ WITHOUT setTimeout: SUCCESS - No race condition detected');
        return true;
    } else {
        console.log('   ⚠️  WITHOUT setTimeout: Race condition may exist');
        return false;
    }
}

verifyPlaygroundFix();