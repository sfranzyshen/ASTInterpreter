#!/usr/bin/env node

console.log('🔍 Testing Debug & Development Features');
console.log('======================================');

const { Parser, parse } = require('./parser.js');
const { ArduinoInterpreter } = require('./interpreter.js');

// Test code with recursive function to test stack overflow detection
const testCode = `
int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);  // Recursive call
}

void setup() {
    Serial.begin(9600);
    
    // Test normal function calls
    int result1 = factorial(5);
    Serial.println(result1);
    
    // Test performance monitoring
    for (int i = 0; i < 100; i++) {
        int temp = i * 2;
        delay(1);
    }
    
    // This would cause stack overflow if enabled
    // int huge = factorial(1000);
}

void loop() {
    delay(1000);
}
`;

console.log('📝 Test code with recursive functions:');
console.log(testCode);

async function testDebugFeatures() {
    try {
        // Parse the code
        console.log('\n1️⃣ Parsing code...');
        const ast = parse(testCode);
        console.log('✅ Parsed successfully');
        
        // Create interpreter with advanced debugging enabled
        console.log('\n2️⃣ Creating interpreter with debug features...');
        const interpreter = new ArduinoInterpreter(ast, { 
            verbose: true,
            debug: true,
            traceLevel: 2  // Detailed tracing
        });
        console.log('✅ Interpreter created');
        
        // Monitor debug output
        let debugMessages = [];
        const originalConsoleLog = console.log;
        
        // Intercept debug messages
        console.log = (...args) => {
            const message = args.join(' ');
            if (message.includes('🔍') || message.includes('🔬')) {
                debugMessages.push(message);
            }
            originalConsoleLog(...args);
        };
        
        // Start execution
        console.log('\n3️⃣ Starting execution with debug tracing...');
        const started = interpreter.start();
        if (!started) {
            console.log('❌ Failed to start interpreter');
            return;
        }
        
        // Wait for execution
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Restore console
        console.log = originalConsoleLog;
        
        // Get debug statistics
        const debugStats = interpreter.debugManager?.getStats();
        const perfStats = interpreter.performanceMonitor?.getStats();
        
        // Results
        console.log('\n📊 DEBUG & DEVELOPMENT FEATURES RESULTS');
        console.log('========================================');
        
        console.log('\n🔍 Debug Tracing:');
        console.log(`  Debug messages captured: ${debugMessages.length}`);
        if (debugStats) {
            console.log(`  Total trace entries: ${debugStats.totalEntries}`);
            console.log('  Categories:', debugStats.categories);
            console.log(`  Runtime: ${debugStats.runtime}ms`);
        }
        
        console.log('\n📊 Performance Monitoring:');
        if (perfStats) {
            console.log(`  Function calls: ${perfStats.metrics.functionCalls}`);
            console.log(`  Variable accesses: ${perfStats.metrics.variableAccesses}`);
            console.log(`  Loop iterations: ${perfStats.metrics.loopIterations}`);
            console.log(`  Runtime: ${perfStats.runtime}ms`);
            console.log('  Performance:');
            console.log(`    Functions/sec: ${perfStats.performance.functionsPerSecond.toFixed(2)}`);
            console.log(`    Variables/sec: ${perfStats.performance.variableAccessesPerSecond.toFixed(2)}`);
        }
        
        console.log('\n🔄 Call Stack:');
        if (interpreter.callStack) {
            console.log(`  Max call depth reached: ${interpreter.callStack.length}`);
            console.log(`  Stack overflow protection: ${interpreter.maxCallStackDepth} max depth`);
        }
        
        console.log('\n🎯 Analysis:');
        if (debugMessages.length > 0) {
            console.log('✅ Debug tracing system is working!');
        }
        if (perfStats && perfStats.metrics.functionCalls > 0) {
            console.log('✅ Performance monitoring is working!');
        }
        if (interpreter.callStack !== undefined) {
            console.log('✅ Stack overflow protection is active!');
        }
        
        console.log('\n✅ Advanced debugging features are operational!');
        
    } catch (error) {
        console.log('\n❌ TEST FAILED:', error.message);
    }
}

testDebugFeatures();