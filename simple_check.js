// Simple check for any remaining conversions of numeric values to symbolic names
const fs = require('fs');

// Read the interpreter playground file
const playgroundContent = fs.readFileSync('/mnt/d/Devel/ArduinoInterpreter/interpreter_playground.html', 'utf8');

// Check for the specific patterns we're interested in
console.log('Checking interpreter_playground.html for remaining conversions...\n');

// Check for HIGH conversion
if (playgroundContent.includes("value === 1 ? 'HIGH'")) {
  console.log('❌ Found HIGH conversion pattern');
} else {
  console.log('✅ No HIGH conversion pattern found');
}

// Check for LOW conversion
if (playgroundContent.includes("value === 0 ? 'LOW'")) {
  console.log('❌ Found LOW conversion pattern');
} else {
  console.log('✅ No LOW conversion pattern found');
}

// Check for modeNames object
if (playgroundContent.includes('modeNames')) {
  console.log('❌ Found modeNames object');
} else {
  console.log('✅ No modeNames object found');
}

console.log('\nCheck complete.');