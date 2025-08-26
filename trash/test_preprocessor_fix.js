#!/usr/bin/env node

/**
 * Test the preprocessor fix for defined() expressions
 */

const { ArduinoPreprocessor } = require('./preprocessor.js');
const { PlatformEmulation } = require('./platform_emulation.js');

// Test case: The problematic AVR code
const testCode = `
#include <Adafruit_NeoPixel.h>
#ifdef __AVR__
 #include <avr/power.h> // Required for 16 MHz Adafruit Trinket
#endif

void setup() {
#if defined(__AVR_ATtiny85__) && (F_CPU == 16000000)
  clock_prescale_set(clock_div_1);
#endif
  strip.begin();
  strip.setBrightness(50);  
  strip.show();
}
`;

console.log('🧪 Testing Preprocessor Fix for defined() expressions\n');
console.log('📝 Input Code:');
console.log(testCode);

// Initialize ESP32_NANO platform (should NOT define AVR macros)
const platform = new PlatformEmulation('ESP32_NANO');
console.log(`\n🎯 Platform: ${platform.currentPlatform.displayName}`);
console.log('📍 Platform defines:', Object.keys(platform.getDefines()));

// Create preprocessor with platform context and verbose output
const preprocessor = new ArduinoPreprocessor({
    verbose: true,
    debug: false,
    platformContext: platform
});

console.log('\n🔧 Preprocessing with verbose output:');
console.log('=' .repeat(60));

try {
    const result = preprocessor.preprocess(testCode);
    
    console.log('=' .repeat(60));
    console.log('\n✅ Preprocessed Code:');
    console.log('---');
    console.log(result.processedCode || result);
    console.log('---');
    
    // Check if the problematic line was removed
    const processedCode = result.processedCode || result;
    const hasClock_prescale_set = processedCode.includes('clock_prescale_set');
    
    console.log(`\n🔍 Analysis:`);
    console.log(`   Contains "clock_prescale_set": ${hasClock_prescale_set}`);
    console.log(`   Expected: false (should be removed on ESP32)`);
    console.log(`   Result: ${hasClock_prescale_set ? '❌ FAILED' : '✅ SUCCESS'}`);
    
} catch (error) {
    console.error('❌ Preprocessing failed:', error);
}