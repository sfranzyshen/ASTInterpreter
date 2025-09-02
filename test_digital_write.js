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

console.log('Testing digitalWrite with HIGH/LOW values...\\n');

// Parse the code
const ast = parse(testCode, { enablePreprocessor: true });
console.log('Parsing completed.\\n');

// Create interpreter
const interpreter = new ArduinoInterpreter(ast, {
  verbose: false,
  maxLoopIterations: 3
});

// Capture commands
const commands = [];

interpreter.onCommand = (command) => {
  commands.push(command);
};

// Run the interpreter
interpreter.start();

// Now print all commands
console.log('All emitted commands:');
commands.forEach((command, index) => {
  console.log(`${index + 1}. ${JSON.stringify(command)}`);
});

console.log('\\n--- Test Results ---');
const digitalWriteCommands = commands.filter(cmd => cmd.type === 'DIGITAL_WRITE');
console.log(`Found ${digitalWriteCommands.length} digitalWrite commands:`);

digitalWriteCommands.forEach((cmd, index) => {
  console.log(`${index + 1}. Pin: ${cmd.pin}, Value: ${cmd.value} (type: ${typeof cmd.value})`);
});

// Check if values are numeric
const allNumeric = digitalWriteCommands.every(cmd => typeof cmd.value === 'number');
console.log(`\\nAll values are numeric: ${allNumeric}`);

if (allNumeric) {
  console.log('✅ SUCCESS: digitalWrite values are correctly emitted as numbers!');
} else {
  console.log('❌ FAILURE: digitalWrite values are not correctly emitted as numbers.');
}