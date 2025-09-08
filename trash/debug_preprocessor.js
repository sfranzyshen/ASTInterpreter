#!/usr/bin/env node

const { ArduinoPreprocessor } = require('./preprocessor.js');
const { PlatformEmulation } = require('./platform_emulation.js');

// Test the exact problematic condition
const testCode = `
#if defined(__AVR_ATtiny85__) && (F_CPU == 16000000)
  clock_prescale_set(clock_div_1);
#endif
`;

console.log('🔍 Debug: Exact preprocessor evaluation');

const platform = new PlatformEmulation('ESP32_NANO');
const preprocessor = new ArduinoPreprocessor({
    verbose: true,
    debug: true,
    platformContext: platform
});

console.log('\n📋 Macros after initialization:');
console.log('  defined(__AVR_ATtiny85__):', preprocessor.macros.has('__AVR_ATtiny85__'));
console.log('  F_CPU value:', preprocessor.macros.get('F_CPU'));
console.log('  F_CPU type:', typeof preprocessor.macros.get('F_CPU'));

const result = preprocessor.preprocess(testCode);
console.log('\n📄 Result:');
console.log(result.processedCode || result);
console.log('\nContains clock_prescale_set:', (result.processedCode || result).includes('clock_prescale_set'));