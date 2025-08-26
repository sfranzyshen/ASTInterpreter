const { parse } = require('./parser.js');
const { ArduinoInterpreter } = require('./interpreter.js');
const { neopixelFiles } = require('./neopixel.js');

console.log('🔍 DEBUGGING NEOPIXEL CIRCULAR REFERENCE');
console.log('=========================================');

const test = neopixelFiles.find(f => f.name.includes('nodelay')) || neopixelFiles[0];
console.log(`Testing: ${test.name}`);

try {
    const ast = parse(test.content, { enablePreprocessor: true });
    const interpreter = new ArduinoInterpreter(ast, {
        verbose: false,
        debug: false,
        stepDelay: 0,
        maxLoopIterations: 1
    });
    
    interpreter.onCommand = (command) => {
        console.log(`\n📡 COMMAND: ${command.type}`);
        
        // Check if command contains circular references
        try {
            JSON.stringify(command);
            console.log('   ✅ No circular reference');
        } catch (error) {
            console.log(`   ❌ CIRCULAR REFERENCE: ${error.message}`);
            console.log(`   Command keys:`, Object.keys(command));
            
            // Check each property for circular refs
            for (const [key, value] of Object.entries(command)) {
                try {
                    JSON.stringify(value);
                    console.log(`   ${key}: ✅ OK`);
                } catch (err) {
                    console.log(`   ${key}: ❌ CIRCULAR (${err.message})`);
                    if (value && typeof value === 'object') {
                        console.log(`   ${key} type:`, value.constructor.name);
                        console.log(`   ${key} keys:`, Object.keys(value));
                    }
                }
            }
        }
    };
    
    const result = interpreter.start();
    console.log('\n🚀 Started:', result);
    
} catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
}