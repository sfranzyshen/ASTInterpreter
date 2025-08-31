const { parse } = require('./ArduinoParser.js');
const { ArduinoInterpreter } = require('./ArduinoInterpreter.js');

// Test code with HIGH/LOW values
const testCode = `
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}
`;

console.log('Testing digitalWrite with HIGH/LOW values...\n');

// Parse the code with preprocessor enabled
const ast = parse(testCode, { enablePreprocessor: true });
console.log('Parsing completed.\n');

// Check if preprocessor worked correctly
if (ast.preprocessorInfo && ast.preprocessorInfo.macros) {
  console.log('Preprocessor macros:');
  console.log(`HIGH = ${ast.preprocessorInfo.macros.HIGH}`);
  console.log(`LOW = ${ast.preprocessorInfo.macros.LOW}`);
  console.log(`LED_BUILTIN = ${ast.preprocessorInfo.macros.LED_BUILTIN}`);
  console.log('');
}

// Create interpreter
const interpreter = new ArduinoInterpreter(ast, {
  verbose: true,
  maxLoopIterations: 1
});

// Run the interpreter
interpreter.start();