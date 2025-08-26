#!/usr/bin/env node

const { Parser, parse } = require('./parser.js');
const { ArduinoInterpreter } = require('./interpreter.js');

const testCode = `
#include <Adafruit_NeoPixel.h>
Adafruit_NeoPixel strip(60, 6, 82);

void setup() {
  uint32_t color = strip.Color(255, 0, 0);
}

void loop() {}
`;

try {
    const ast = parse(testCode);
    const interpreter = new ArduinoInterpreter(ast, { 
        verbose: true, // Enable verbose mode to see debug output
        stepDelay: 0,
        maxLoopIterations: 1
    });
    
    interpreter.start();
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
}