#!/usr/bin/env node
/**
 * Test the specific problematic examples reported by user
 */

const { parse } = require('./ArduinoParser.js');
const { ASTInterpreter } = require('./ASTInterpreter.js');

console.log('🔧 Testing Problematic Examples');
console.log('================================');

const blinkWithoutDelayCode = `// 02.Digital BlinkWithoutDelay.ino

// constants won't change.
const int ledPin = LED_BUILTIN;

// Variables will change:
int ledState = LOW;

// Generally, you should use "unsigned long" for variables that hold time
// The value will quickly become too large for an int to store
unsigned long previousMillis = 0;

// constants won't change:
const long interval = 1000;

void setup() {
  // set the digital pin as output:
  pinMode(ledPin, OUTPUT);
}

void loop() {
  // here is where you'd put code that needs to be running all the time.
  // check to see if it's time to blink the LED;
  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= interval) {
    // save the last time you blinked the LED
    previousMillis = currentMillis;

    // if the LED is off turn it on and vice-versa:
    if (ledState == LOW) {
      ledState = HIGH;
    } else {
      ledState = LOW;
    }

    // set the LED with the ledState of the variable:
    digitalWrite(ledPin, ledState);
  }
}`;

const calibrationCode = `// 03.Analog Calibration.ino

// These constants won't change:
const int sensorPin = A0;
const int ledPin = 9;

// variables:
int sensorValue = 0;
int sensorMin = 1023;
int sensorMax = 0;


void setup() {
  // turn on LED to signal the start of the calibration period:
  pinMode(13, OUTPUT);
  digitalWrite(13, HIGH);

  // calibrate during the first five seconds
  while (millis() < 5000) {
    sensorValue = analogRead(sensorPin);

    // record the maximum sensor value
    if (sensorValue > sensorMax) {
      sensorMax = sensorValue;
    }

    // record the minimum sensor value
    if (sensorValue < sensorMin) {
      sensorMin = sensorValue;
    }
  }

  // signal the end of the calibration period
  digitalWrite(13, LOW);
}

void loop() {
  // read the sensor:
  sensorValue = analogRead(sensorPin);

  // in case the sensor value is outside the range seen during calibration
  sensorValue = constrain(sensorValue, sensorMin, sensorMax);

  // apply the calibration to the sensor reading
  sensorValue = map(sensorValue, sensorMin, sensorMax, 0, 255);

  // fade the LED using the calibrated value:
  analogWrite(ledPin, sensorValue);
}`;

async function testExample(code, name) {
    console.log(`\n📋 Testing ${name}:`);
    console.log('---------------------------');
    
    let ast;
    try {
        ast = parse(code);
        console.log('✅ Parsing successful');
    } catch (error) {
        console.log(`❌ Parse error: ${error.message}`);
        return { success: false, stage: 'parse', error: error.message };
    }
    
    const interpreter = new ASTInterpreter(ast, { 
        verbose: false,
        debug: false,
        maxLoopIterations: 2  // Keep it short to avoid infinite loops
    });
    
    let commandCount = 0;
    let errors = [];
    let finished = false;
    
    interpreter.onCommand = (command) => {
        commandCount++;
        console.log(`📡 ${commandCount}: ${command.type}`);
        
        // Handle external data requests
        if (command.type === 'ANALOG_READ_REQUEST') {
            setTimeout(() => {
                interpreter.resumeWithValue(command.requestId, Math.floor(Math.random() * 1024));
            }, 10);
        } else if (command.type === 'MILLIS_REQUEST') {
            setTimeout(() => {
                // Simulate time progression
                interpreter.resumeWithValue(command.requestId, Date.now() % 100000);
            }, 10);
        }
        
        if (command.type === 'PROGRAM_END' || command.type === 'ERROR') {
            finished = true;
        }
    };
    
    interpreter.onError = (error) => {
        console.log(`❌ Error: ${error}`);
        errors.push(error);
        finished = true;
    };
    
    const startTime = Date.now();
    const startResult = interpreter.start();
    
    if (!startResult) {
        console.log('❌ Failed to start interpreter');
        return { success: false, stage: 'start', error: 'Failed to start' };
    }
    
    // Wait for completion or timeout
    await new Promise(resolve => {
        const checkCompletion = () => {
            const elapsed = Date.now() - startTime;
            
            if (finished || elapsed > 5000) {  // 5 second timeout
                resolve();
            } else {
                setTimeout(checkCompletion, 100);
            }
        };
        setTimeout(checkCompletion, 100);
    });
    
    const success = finished && errors.length === 0;
    const timedOut = Date.now() - startTime >= 5000;
    
    console.log(`✅ Commands: ${commandCount}`);
    console.log(`✅ Errors: ${errors.length}`);
    console.log(`✅ Finished: ${finished}`);
    console.log(`✅ Timed out: ${timedOut}`);
    
    if (errors.length > 0) {
        console.log(`❌ Errors found:`);
        errors.forEach(error => console.log(`   - ${error}`));
    }
    
    return {
        success,
        commandCount,
        errors: errors.length,
        finished,
        timedOut,
        stage: 'execution'
    };
}

async function runTests() {
    const blinkResult = await testExample(blinkWithoutDelayCode, 'BlinkWithoutDelay.ino');
    const calibrationResult = await testExample(calibrationCode, 'Calibration.ino');
    
    console.log('\n🎯 RESULTS SUMMARY:');
    console.log('==================');
    console.log(`BlinkWithoutDelay: ${blinkResult.success ? '✅' : '❌'} (${blinkResult.commandCount} cmds, ${blinkResult.errors} errors)`);
    console.log(`Calibration: ${calibrationResult.success ? '✅' : '❌'} (${calibrationResult.commandCount} cmds, ${calibrationResult.errors} errors)`);
    
    if (!blinkResult.success || !calibrationResult.success) {
        console.log('\n💡 DIAGNOSIS:');
        if (!blinkResult.success && blinkResult.errors > 0) {
            console.log('- BlinkWithoutDelay has duplicate declaration errors (likely restart issue)');
        }
        if (!calibrationResult.success && calibrationResult.timedOut) {
            console.log('- Calibration timed out (likely infinite loop with millis())');
        }
    }
}

runTests().catch(console.error);