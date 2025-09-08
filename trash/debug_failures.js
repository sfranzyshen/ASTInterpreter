const { parse } = require('./parser.js');
const { ASTInterpreter } = require('./interpreter.js');
const { examplesFiles } = require('./examples.js');

console.log('🔍 FINDING MISSING FUNCTIONS');
console.log('============================');

// Test each example until we find the first failure
async function testExamples() {
for (let i = 0; i < examplesFiles.length; i++) {
    const example = examplesFiles[i];
    console.log(`\n[${i+1}/${examplesFiles.length}] Testing: ${example.name}`);
    
    try {
        const ast = parse(example.content, { enablePreprocessor: true });
        const interpreter = new ASTInterpreter(ast, {
            verbose: false,
            debug: false,
            stepDelay: 0,
            maxLoopIterations: 2
        });
        
        let errorFound = false;
        interpreter.onError = (error) => {
            console.log(`❌ ERROR in ${example.name}:`);
            console.log(`   ${error}`);
            errorFound = true;
        };
        
        // Add response handlers
        interpreter.responseHandler = (request) => {
            setTimeout(() => {
                let mockValue = 0;
                switch (request.type) {
                    case 'analogRead': mockValue = Math.floor(Math.random() * 1024); break;
                    case 'digitalRead': mockValue = Math.random() > 0.5 ? 1 : 0; break;
                    case 'millis': mockValue = Date.now() % 100000; break;
                    case 'micros': mockValue = Date.now() * 1000 % 1000000; break;
                    default: mockValue = 0;
                }
                interpreter.handleResponse(request.id, mockValue);
            }, 1);
        };
        
        const started = interpreter.start();
        if (!started) {
            console.log(`❌ Failed to start: ${example.name}`);
            continue;
        }
        
        // Wait a short time to see if error occurs
        await new Promise(resolve => {
            setTimeout(() => {
                interpreter.stop();
                if (!errorFound) {
                    console.log(`✅ PASSED: ${example.name}`);
                }
                resolve();
            }, 200);
        });
        
        // If we found an error, stop here to examine it
        if (errorFound) {
            break;
        }
        
    } catch (error) {
        console.log(`❌ EXCEPTION in ${example.name}: ${error.message}`);
        break;
    }
}
}

testExamples().catch(console.error);