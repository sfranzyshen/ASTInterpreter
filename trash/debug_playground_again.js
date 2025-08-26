const { parse } = require('./parser.js');
const { ArduinoInterpreter } = require('./interpreter.js');

console.log('🔍 DEBUGGING PLAYGROUND DISPLAY ISSUE');
console.log('====================================');

const testCode = `void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);  
  delay(1000);
}`;

const ast = parse(testCode, { enablePreprocessor: true });
const interpreter = new ArduinoInterpreter(ast, {
    verbose: true // This should trigger VERSION_INFO commands
});

console.log('\n📡 Commands that would be sent to playground:');
console.log('==============================================');

let commandIndex = 0;
interpreter.onCommand = (command) => {
    commandIndex++;
    
    // Simulate the NEW playground's displayCommand filter  
    const wouldBeFiltered = !command || command.type === undefined;
    
    console.log(`\n[${commandIndex}] ${command.type}`);
    console.log(`  Message: ${command.message}`);
    console.log(`  Would be filtered: ${wouldBeFiltered ? '❌ YES' : '✅ NO'}`);
    
    if (wouldBeFiltered) {
        console.log(`  🚨 FILTERED OUT - this explains missing commands!`);
    }
};

const result = interpreter.start();
console.log(`\n🚀 Started: ${result}`);

setTimeout(() => {
    interpreter.stop();
    console.log('\n📊 SUMMARY: Commands marked with ❌ are being filtered out by playground');
}, 100);