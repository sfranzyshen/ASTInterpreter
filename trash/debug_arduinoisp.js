const { parse } = require('./parser.js');
const { ArduinoInterpreter } = require('./interpreter.js');
const { examplesFiles } = require('./examples.js');

console.log('🔍 DEBUGGING ARDUINOISP IMMEDIATE COMPLETION');
console.log('=============================================');

// Find ArduinoISP example
const arduinoISP = examplesFiles.find(ex => ex.name === 'ArduinoISP.ino');
if (!arduinoISP) {
    console.log('❌ ArduinoISP example not found');
    process.exit(1);
}

console.log('📄 ArduinoISP found, analyzing...');
console.log('Code length:', arduinoISP.content.length, 'characters');
console.log('First 200 chars:', arduinoISP.content.substring(0, 200));

console.log('\n🔧 Parsing with preprocessor...');
try {
    const parseResult = parse(arduinoISP.content, { enablePreprocessor: true, debug: true });
    const ast = parseResult;
    
    console.log('✅ Parse successful');
    console.log('AST type:', ast.type);
    console.log('AST children:', ast.children ? ast.children.length : 'No children');
    
    // Look for setup and loop functions
    if (ast.children) {
        console.log('\n📋 Top-level declarations:');
        let setupFound = false, loopFound = false;
        for (let i = 0; i < Math.min(ast.children.length, 20); i++) {
            const child = ast.children[i];
            console.log(`  [${i}] ${child.type}${child.name ? ' "' + child.name + '"' : ''}${child.returnType ? ' returns ' + child.returnType : ''}`);
            if (child.type === 'FuncDefNode') {
                console.log(`    → Body: ${child.body ? child.body.children?.length || 'No children' : 'No body'} statements`);
                if (child.name === 'setup') setupFound = true;
                if (child.name === 'loop') loopFound = true;
            }
        }
        console.log(`\n📊 Function Summary:`);
        console.log(`setup() found: ${setupFound}`);
        console.log(`loop() found: ${loopFound}`);
    }
    
    console.log('\n🎯 Creating interpreter...');
    const interpreter = new ArduinoInterpreter(ast, {
        verbose: false,
        debug: false,
        stepDelay: 0,
        maxLoopIterations: 1 // Only 1 iteration to see what happens
    });
    
    let setupExecuted = false;
    let loopExecuted = false;
    let commandCount = 0;
    
    interpreter.onCommand = (command) => {
        commandCount++;
        console.log(`📡 [${commandCount}] ${command.type}${command.message ? ': ' + command.message : ''}`);
        
        if (command.type === 'SETUP_START') setupExecuted = true;
        if (command.type === 'LOOP_START') loopExecuted = true;
        if (command.type === 'PROGRAM_END' || command.type === 'ERROR') {
            console.log(`\n📊 EXECUTION SUMMARY:`);
            console.log(`Setup executed: ${setupExecuted}`);
            console.log(`Loop executed: ${loopExecuted}`);
            console.log(`Total commands: ${commandCount}`);
        }
    };
    
    interpreter.onError = (error) => {
        console.log(`❌ INTERPRETER ERROR: ${error}`);
    };
    
    // Add mock response handler for external data functions
    interpreter.responseHandler = (request) => {
        console.log(`📥 Mock response for ${request.type}: ${request.id}`);
        setTimeout(() => {
            let mockValue = 0;
            switch (request.type) {
                case 'analogRead': mockValue = 512; break;
                case 'digitalRead': mockValue = 0; break;
                case 'millis': mockValue = 1000; break;
                case 'micros': mockValue = 1000000; break;
                default: mockValue = 0;
            }
            interpreter.handleResponse(request.id, mockValue);
        }, 1);
    };
    
    console.log('\n🚀 Starting execution...');
    const started = interpreter.start();
    console.log('Start result:', started);
    
    if (!started) {
        console.log('❌ Failed to start interpreter');
    }
    
} catch (error) {
    console.log(`❌ PARSE ERROR: ${error.message}`);
    console.log('Stack:', error.stack);
}