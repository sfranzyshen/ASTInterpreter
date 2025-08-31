#!/bin/bash
# Test script to verify the patch works correctly

echo "Testing Arduino Interpreter Numeric Value Display Fix"
echo "=================================================="

# Test 1: Check that the ArduinoInterpreter.js changes are in place
echo "Test 1: Checking ArduinoInterpreter.js changes..."
if grep -q "pinState.value = numericValue; // Store the numeric value" ArduinoInterpreter.js && \
   grep -q "value: numericValue, // Emit the numeric value, not the string" ArduinoInterpreter.js && \
   grep -q "this.pinStates.set(pin, { mode: numericMode, value: 0 });" ArduinoInterpreter.js && \
   grep -q "mode: numericMode," ArduinoInterpreter.js; then
    echo "✅ ArduinoInterpreter.js changes are correctly applied"
else
    echo "❌ ArduinoInterpreter.js changes are missing or incorrect"
fi

# Test 2: Check that the interpreter_playground.html changes are in place
echo "Test 2: Checking interpreter_playground.html changes..."
if grep -q "// Display numeric values directly instead of symbolic names" interpreter_playground.html && \
   grep -q "content += \`pinMode(\${command.pin}, \${command.mode})\`;" interpreter_playground.html && \
   grep -q "content += \`digitalWrite(\${command.pin}, \${command.value})\`;" interpreter_playground.html; then
    echo "✅ interpreter_playground.html changes are correctly applied"
else
    echo "❌ interpreter_playground.html changes are missing or incorrect"
fi

# Test 3: Check that the old patterns are no longer present
echo "Test 3: Checking that old patterns are removed..."
if ! grep -q "value === 1 ? 'HIGH'" interpreter_playground.html && \
   ! grep -q "modeNames = {0: 'INPUT', 1: 'OUTPUT', 2: 'INPUT_PULLUP'};" interpreter_playground.html; then
    echo "✅ Old patterns have been successfully removed"
else
    echo "❌ Old patterns are still present"
fi

echo "=================================================="
echo "Test complete. Please verify the output above."