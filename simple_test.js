const { parse } = require('./ArduinoParser.js');
const { ArduinoInterpreter } = require('./ArduinoInterpreter.js');

// Test code with HIGH/LOW values
const testCode = `
void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  digitalWrite(13, LOW);
}
`;

console.log('Testing digitalWrite with HIGH/LOW values...\n');

// Parse the code
const ast = parse(testCode, { enablePreprocessor: true });
console.log('Parsing completed.\n');

// Create interpreter
const interpreter = new ArduinoInterpreter(ast, {
  verbose: true,
  maxLoopIterations: 1
});

// Run the interpreter
interpreter.start();