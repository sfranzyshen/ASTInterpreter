#!/usr/bin/env node

/**
 * Test the EXACT code from neopixel.js that the playground is running
 */

const { ArduinoPreprocessor } = require('./preprocessor.js');
const { PlatformEmulation } = require('./platform_emulation.js');
const { parse } = require('./parser.js');

// This is the EXACT code from neopixel.js first example
const exactPlaygroundCode = `#include <Adafruit_NeoPixel.h>
#ifdef __AVR__
 #include <avr/power.h> // Required for 16 MHz Adafruit Trinket
#endif

// Which pin on the Arduino is connected to the NeoPixels?
// On a Trinket or Gemma we suggest changing this to 1:
#define LED_PIN    6

// How many NeoPixels are attached to the Arduino?
#define LED_COUNT 60

// Declare our NeoPixel strip object:
Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  // These lines are specifically to support the Adafruit Trinket 5V 16 MHz.
  // Any other board, you can remove this part (but no harm leaving it):
#if defined(__AVR_ATtiny85__) && (F_CPU == 16000000)
  clock_prescale_set(clock_div_1);
#endif
  // END of Trinket-specific code.

  strip.begin();           // INITIALIZE NeoPixel strip object (REQUIRED)
  strip.show();            // Turn OFF all pixels ASAP
  strip.setBrightness(50); // Set BRIGHTNESS to about 1/5 (max = 255)
}`;

console.log('🧪 Testing EXACT playground code reproduction');
console.log('==================================================');

// Initialize ESP32_NANO platform (same as playground)
const platform = new PlatformEmulation('ESP32_NANO');
console.log(`🎯 Platform: ${platform.currentPlatform.displayName}`);

// Create preprocessor with platform context and verbose output
const preprocessor = new ArduinoPreprocessor({
    verbose: true,
    debug: false,
    platformContext: platform
});

console.log('\n🔧 Preprocessing with verbose output:');
console.log('=' .repeat(60));

try {
    const result = preprocessor.preprocess(exactPlaygroundCode);
    
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
    console.log(`   Preprocessor result: ${hasClock_prescale_set ? '❌ FAILED' : '✅ SUCCESS'}`);
    
    if (hasClock_prescale_set) {
        console.log('\n❌ REPRODUCING THE BUG! The code still contains clock_prescale_set');
        console.log('   This means the playground and Node.js are giving DIFFERENT results!');
        
        // Let's also parse it to see if it makes it to the AST
        console.log('\n🌳 Parsing the preprocessed code to AST...');
        const ast = parse(processedCode);
        const astString = JSON.stringify(ast, null, 2);
        const astHasClock_prescale_set = astString.includes('clock_prescale_set');
        console.log(`   AST contains "clock_prescale_set": ${astHasClock_prescale_set}`);
        
    } else {
        console.log('\n✅ SUCCESS! The fix is working correctly.');
        console.log('   The playground issue might be a different cause.');
    }
    
} catch (error) {
    console.error('❌ Preprocessing failed:', error);
}