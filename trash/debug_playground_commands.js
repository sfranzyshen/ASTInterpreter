const { parse } = require('./parser.js');
const { ArduinoInterpreter } = require('./interpreter.js');

console.log('🔍 DEBUGGING PLAYGROUND COMMAND ISSUE');
console.log('=====================================');

const testCode = `void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);  
  delay(1000);
}`;

console.log('📝 Test Code:');
console.log(testCode);
console.log('\n🔧 Parsing...');

const ast = parse(testCode, { enablePreprocessor: true });
console.log('✅ Parse successful');

console.log('\n🎯 Creating interpreter...');
const interpreter = new ArduinoInterpreter(ast, {
    verbose: false,
    debug: false, 
    stepDelay: 0,
    maxLoopIterations: 2 // Just 2 iterations to see commands
});

console.log('\n📡 Setting up command capture...');
let commandCount = 0;
const commands = [];

interpreter.onCommand = (command) => {
    commandCount++;
    commands.push(command);
    
    console.log(`\n📥 COMMAND ${commandCount}:`);
    console.log('  Type:', command.type);
    console.log('  Message:', command.message); 
    console.log('  Full command:', JSON.stringify(command, null, 2));
};

interpreter.onError = (error) => {
    console.error('❌ ERROR:', error);
};

console.log('\n🚀 Starting execution...');
const result = interpreter.start();

if (!result) {
    console.log('❌ Failed to start interpreter');
} else {
    console.log('✅ Interpreter started successfully');
    
    // Wait a bit for execution
    setTimeout(() => {
        console.log(`\n📊 EXECUTION SUMMARY:`);
        console.log(`Total commands captured: ${commandCount}`);
        console.log(`Commands array length: ${commands.length}`);
        
        if (commands.length === 0) {
            console.log('⚠️  NO COMMANDS CAPTURED!');
            console.log('This explains why the playground shows no commands.');
        }
        
        interpreter.stop();
    }, 100);
}