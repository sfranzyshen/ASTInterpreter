// Test to verify the display changes in the playground
const testCommands = [
  {type: 'PIN_MODE', pin: 13, mode: 1, timestamp: Date.now()},
  {type: 'DIGITAL_WRITE', pin: 13, value: 1, timestamp: Date.now()},
  {type: 'DIGITAL_WRITE', pin: 13, value: 0, timestamp: Date.now()}
];

// Simulate the old display logic
function oldDisplayCommand(command) {
  switch (command.type) {
    case 'PIN_MODE':
      const modeNames = {0: 'INPUT', 1: 'OUTPUT', 2: 'INPUT_PULLUP'};
      const modeName = modeNames[command.mode] || command.mode;
      return `pinMode(${command.pin}, ${modeName})`;
    case 'DIGITAL_WRITE':
      const valueName = command.value === 1 ? 'HIGH' : (command.value === 0 ? 'LOW' : command.value);
      return `digitalWrite(${command.pin}, ${valueName})`;
    default:
      return 'Unknown command';
  }
}

// Simulate the new display logic
function newDisplayCommand(command) {
  switch (command.type) {
    case 'PIN_MODE':
      return `pinMode(${command.pin}, ${command.mode})`;
    case 'DIGITAL_WRITE':
      return `digitalWrite(${command.pin}, ${command.value})`;
    default:
      return 'Unknown command';
  }
}

console.log('Testing display changes:\n');

testCommands.forEach((command, index) => {
  console.log(`Command ${index + 1}:`);
  console.log(`  Old display: ${oldDisplayCommand(command)}`);
  console.log(`  New display: ${newDisplayCommand(command)}`);
  console.log('');
});