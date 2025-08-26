#!/usr/bin/env node

/**
 * Quick Semantic Diagnostic Test
 * 
 * Focused test to identify and demonstrate common semantic accuracy issues
 */

console.log('🔍 Quick Semantic Diagnostic Test');
console.log('=================================');

const { PlatformEmulation } = require('./platform_emulation.js');
const { ArduinoPreprocessor } = require('./preprocessor.js');
const { parse } = require('./parser.js');
const { ArduinoInterpreter } = require('./interpreter.js');
const { CommandStreamValidator } = require('./command_stream_validator.js');

// Initialize platform emulation and preprocessor
const platformEmulation = new PlatformEmulation('ESP32_NANO');
const preprocessor = new ArduinoPreprocessor({
    defines: platformEmulation.getDefines(),
    libraries: platformEmulation.getLibraries()
});
console.log(`🎯 Platform: ${platformEmulation.currentPlatform.displayName}`);
console.log('🔧 Preprocessor initialized with platform context');

// Test cases that demonstrate semantic issues
const diagnosticTests = [
    {
        name: "Serial_Boolean_Test",
        code: `
void setup() {
    Serial.begin(9600);
    while (!Serial) {
        ; // Should not loop infinitely
    }
    Serial.println("Ready");
}

void loop() {
    // Empty loop
}
`
    },
    {
        name: "Invalid_Delay_Test", 
        code: `
void setup() {
    pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
    digitalWrite(LED_BUILTIN, HIGH);
    delay(); // Invalid - no argument
    digitalWrite(LED_BUILTIN, LOW);  
    delay(1000); // Valid
}
`
    },
    {
        name: "Pin_Configuration_Test",
        code: `
void setup() {
    // Missing pinMode
}

void loop() {
    digitalWrite(13, HIGH); // Should warn - pin not configured
    delay(1000);
    digitalWrite(13, LOW);
    delay(1000);
}
`
    },
    {
        name: "Perfect_Test",
        code: `
void setup() {
    Serial.begin(9600);
    pinMode(13, OUTPUT);
}

void loop() {
    digitalWrite(13, HIGH);
    delay(1000);
    digitalWrite(13, LOW);
    delay(1000);
}
`
    }
];

// Test a single diagnostic case
async function testDiagnostic(test) {
    return new Promise((resolve) => {
        console.log(`\n🧪 Testing: ${test.name}`);
        
        try {
            // Step 1: Preprocess code with platform context
            const preprocessResult = preprocessor.preprocess(test.code);
            
            // Step 2: Parse preprocessed code
            const ast = parse(preprocessResult.processedCode);
            const interpreter = new ArduinoInterpreter(ast, { 
                verbose: false, 
                debug: false, 
                stepDelay: 0, 
                maxLoopIterations: 3
            });
            
            const validator = new CommandStreamValidator();
            
            let executionCompleted = false;
            let commandCount = 0;
            
            interpreter.onCommand = (command) => {
                commandCount++;
                validator.captureCommand(command);
                
                // Handle request-response pattern for external data functions
                switch (command.type) {
                    case 'ANALOG_READ_REQUEST':
                        const analogValue = Math.floor(Math.random() * 1024);
                        setTimeout(() => {
                            interpreter.handleResponse(command.requestId, analogValue);
                        }, 1);
                        break;
                        
                    case 'DIGITAL_READ_REQUEST':  
                        const digitalState = Math.random() > 0.5 ? 1 : 0;
                        setTimeout(() => {
                            interpreter.handleResponse(command.requestId, digitalState);
                        }, 1);
                        break;
                        
                    case 'MILLIS_REQUEST':
                        setTimeout(() => {
                            interpreter.handleResponse(command.requestId, Date.now());
                        }, 1);
                        break;
                        
                    case 'MICROS_REQUEST':
                        setTimeout(() => {
                            interpreter.handleResponse(command.requestId, Date.now() * 1000);
                        }, 1);
                        break;
                        
                    case 'LIBRARY_METHOD_REQUEST':
                        let responseValue = 0;
                        switch (command.method) {
                            case 'numPixels': responseValue = 60; break;
                            case 'getBrightness': responseValue = 255; break;
                            case 'getPixelColor': responseValue = 0; break;
                            case 'canShow': responseValue = true; break;
                            default: responseValue = 0; break;
                        }
                        setTimeout(() => {
                            interpreter.handleResponse(command.requestId, responseValue);
                        }, 1);
                        break;
                }
                
                if (command.type === 'PROGRAM_END' || command.type === 'ERROR' || command.type === 'LOOP_LIMIT_REACHED') {
                    executionCompleted = true;
                }
            };
            
            interpreter.onError = (error) => {
                executionCompleted = true;
                validator.captureCommand({
                    type: 'ERROR',
                    message: typeof error === 'string' ? error : error.message
                });
            };
            
            // Suppress console
            const originalLog = console.log;
            const originalError = console.error;
            console.log = () => {};
            console.error = () => {};
            
            const startResult = interpreter.start();
            
            // Restore console for our output
            console.log = originalLog;
            console.error = originalError;
            
            if (!startResult) {
                resolve({ success: false, error: 'Failed to start', validator: validator });
                return;
            }
            
            // Wait for completion
            const timeout = setTimeout(() => {
                if (!executionCompleted) {
                    executionCompleted = true;
                    interpreter.stop();
                    validator.captureCommand({ type: 'TIMEOUT' });
                }
            }, 3000);
            
            const checkCompletion = () => {
                if (executionCompleted) {
                    clearTimeout(timeout);
                    resolve({ 
                        success: true, 
                        commandCount: commandCount,
                        validator: validator 
                    });
                } else {
                    setTimeout(checkCompletion, 50);
                }
            };
            
            checkCompletion();
            
        } catch (error) {
            resolve({ success: false, error: error.message, validator: new CommandStreamValidator() });
        }
    });
}

// Run diagnostic tests
async function runDiagnostics() {
    console.log('\n🔬 DIAGNOSTIC ANALYSIS:');
    
    for (const test of diagnosticTests) {
        const result = await testDiagnostic(test);
        const report = result.validator.generateReport();
        
        console.log(`\n📊 ${test.name}:`);
        console.log(`   Execution: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`   Commands: ${result.commandCount || 0}`);
        console.log(`   Semantic Accuracy: ${report.summary.semanticAccuracy.percentage}%`);
        console.log(`   Errors: ${report.summary.errors}`);
        console.log(`   Warnings: ${report.summary.warnings}`);
        
        if (report.issues.errors.length > 0) {
            console.log('   🔴 Error Details:');
            report.issues.errors.forEach(error => {
                console.log(`      • [${error.type}] ${error.message}`);
            });
        }
        
        if (report.issues.warnings.length > 0) {
            console.log('   🟡 Warning Details:');
            report.issues.warnings.forEach(warning => {
                console.log(`      • [${warning.type}] ${warning.message}`);
            });
        }
        
        // Show hardware state for context
        if (test.name === "Serial_Boolean_Test") {
            console.log(`   🔌 Serial State: ${report.hardware.serial.initialized ? 'Initialized' : 'Not Initialized'}`);
            console.log(`   🔄 Loop Iterations: ${report.execution.loopIterations}`);
            console.log(`   ♾️  Infinite Loop: ${report.execution.infiniteLoopDetected ? 'YES' : 'NO'}`);
        }
    }
    
    console.log('\n🎯 Diagnostic complete! Use these results to identify semantic issues.');
}

runDiagnostics().catch(error => {
    console.error('❌ Diagnostic failed:', error.message);
    process.exit(1);
});