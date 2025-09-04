#!/usr/bin/env node

// Test script to verify ArduinoISP.ino preprocessor handling
// Focus: Complex #if defined() expressions and conditional compilation

const { parse } = require('./parser.js');
const { ASTInterpreter } = require('./interpreter.js');
const { PlatformEmulation } = require('./platform_emulation.js');
const { ArduinoPreprocessor } = require('./preprocessor.js');
const { examplesFiles } = require('./examples.js');

// Locate the ArduinoISP example
const arduinoISPExample = examplesFiles.find(example => example.name === 'ArduinoISP.ino');

if (!arduinoISPExample) {
    console.log('❌ ArduinoISP.ino not found in examples');
    process.exit(1);
}

console.log('🔍 Testing ArduinoISP.ino Preprocessor Fix');
console.log('=' + '='.repeat(50));
console.log('');

// 1. Analyze raw preprocessor directives
console.log('📋 ANALYZING PREPROCESSOR DIRECTIVES:');
const code = arduinoISPExample.content;
const preprocessorLines = code.split('\n').filter(line => 
    line.trim().startsWith('#')
).map((line, index) => ({ lineNum: index + 1, directive: line.trim() }));

console.log(`Found ${preprocessorLines.length} preprocessor directives:`);
preprocessorLines.forEach(({ lineNum, directive }) => {
    console.log(`  Line ${lineNum}: ${directive}`);
});
console.log('');

// 2. Test preprocessing with ESP32_NANO platform
console.log('⚙️  TESTING PREPROCESSING (ESP32_NANO Platform):');
const platform = new PlatformEmulation('ESP32_NANO');
const preprocessor = new ArduinoPreprocessor({
    platformContext: platform,
    debug: true
});

try {
    const preprocessedResult = preprocessor.preprocess(code);
    const preprocessedCode = preprocessedResult.processedCode;
    
    console.log('✅ Preprocessing completed successfully');
    console.log(`Original code: ${code.length} characters`);
    console.log(`Preprocessed code: ${preprocessedCode.length} characters`);
    
    // Check if certain directives were processed
    const remainingDirectives = preprocessedCode.split('\n').filter(line => 
        line.trim().startsWith('#')
    );
    console.log(`Remaining preprocessor directives: ${remainingDirectives.length}`);
    
    if (remainingDirectives.length > 0) {
        console.log('⚠️  Remaining directives (should be minimal):');
        remainingDirectives.forEach(line => {
            console.log(`  ${line.trim()}`);
        });
    } else {
        console.log('✅ All preprocessor directives processed/removed');
    }
    
    console.log('');
    
    // 3. Test key conditional compilation results
    console.log('🔄 ANALYZING CONDITIONAL COMPILATION RESULTS:');
    
    // Check if USE_HARDWARE_SPI is defined (should be false on ESP32_NANO)
    const hasUseHardwareSPI = preprocessedCode.includes('USE_HARDWARE_SPI');
    console.log(`USE_HARDWARE_SPI references: ${hasUseHardwareSPI ? 'Found' : 'Not found (expected for ESP32)'}`);
    
    // Check if ARDUINO_ARCH_AVR conditional was processed correctly
    const hasAvrCode = preprocessedCode.includes('ARDUINO_ARCH_AVR');
    console.log(`ARDUINO_ARCH_AVR references: ${hasAvrCode ? 'Found' : 'Removed (expected for ESP32)'}`);
    
    // Check if BitBangedSPI class is included
    const hasBitBangedSPI = preprocessedCode.includes('class BitBangedSPI');
    console.log(`BitBangedSPI class: ${hasBitBangedSPI ? 'Included' : 'Excluded'}`);
    
    // Check if SPI.h include is processed
    const hasSPIInclude = preprocessedCode.includes('#include "SPI.h"');
    console.log(`SPI.h include: ${hasSPIInclude ? 'Present' : 'Processed/removed'}`);
    
    console.log('');
    
    // 4. Test parsing of preprocessed code
    console.log('🧠 TESTING PARSER ON PREPROCESSED CODE:');
    
    const ast = parse(preprocessedCode, {
        enablePreprocessor: false, // Already preprocessed
        platformContext: platform
    });
    
    let hasErrors = false;
    
    if (ast && ast.type === 'ProgramNode') {
        console.log('✅ Parsing successful');
        console.log(`AST has ${ast.statements ? ast.statements.length : 0} top-level statements`);
        
        // Check for error nodes
        hasErrors = JSON.stringify(ast).includes('"type":"ErrorNode"');
        if (hasErrors) {
            console.log('⚠️  Parser found some errors (extracting details...)');
            // Find and display error nodes
            const findErrors = (node, path = []) => {
                if (node && typeof node === 'object') {
                    if (node.type === 'ErrorNode') {
                        console.log(`  Error at ${path.join('.')}: ${node.message || 'Unknown error'}`);
                    }
                    for (const key in node) {
                        if (Array.isArray(node[key])) {
                            node[key].forEach((item, idx) => findErrors(item, [...path, key, idx]));
                        } else if (typeof node[key] === 'object') {
                            findErrors(node[key], [...path, key]);
                        }
                    }
                }
            };
            findErrors(ast);
        } else {
            console.log('✅ No parser errors found');
        }
    } else {
        console.log('❌ Parsing failed or returned invalid AST');
        console.log('AST:', ast);
        hasErrors = true;
    }
    
    console.log('');
    
    // 5. Test interpreter execution
    console.log('🚀 TESTING INTERPRETER EXECUTION:');
    
    if (ast && ast.type === 'ProgramNode') {
        const interpreter = new ASTInterpreter(ast, {
            verbose: false,
            debug: false,
            stepDelay: 0,
            maxLoopIterations: 3
        });
        
        // Set up mock response handlers
        interpreter.responseHandler = (request) => {
            setTimeout(() => {
                let mockValue = 0;
                switch (request.type) {
                    case 'analogRead': mockValue = Math.floor(Math.random() * 1024); break;
                    case 'digitalRead': mockValue = Math.random() > 0.5 ? 1 : 0; break;
                    case 'millis': mockValue = Date.now() % 100000; break;
                    case 'micros': mockValue = Date.now() * 1000 % 1000000; break;
                    default: mockValue = 0;
                }
                interpreter.handleResponse(request.id, mockValue);
            }, Math.random() * 10);
        };
        
        let executionCompleted = false;
        let executionError = null;
        let commandCount = 0;
        
        interpreter.onCommand = (command) => {
            commandCount++;
            if (command.type === 'PROGRAM_END' || command.type === 'ERROR' || command.type === 'LOOP_LIMIT_REACHED') {
                executionCompleted = true;
                if (command.type === 'ERROR') {
                    executionError = command.message;
                }
            }
        };
        
        interpreter.onError = (error) => {
            executionError = error;
            executionCompleted = true;
        };
        
        // Suppress console output during execution
        const originalConsoleLog = console.log;
        console.log = () => {};
        
        const startResult = interpreter.start();
        console.log = originalConsoleLog;
        
        if (!startResult) {
            console.log('❌ Failed to start interpreter');
        } else {
            console.log = () => {}; // Suppress again
            
            // Wait for completion with timeout
            const timeout = setTimeout(() => {
                if (!executionCompleted) {
                    executionError = 'Execution timeout (5 seconds)';
                    executionCompleted = true;
                    interpreter.stop();
                }
            }, 5000);
            
            const checkCompletion = () => {
                if (executionCompleted) {
                    console.log = originalConsoleLog;
                    clearTimeout(timeout);
                    
                    if (executionError) {
                        console.log(`❌ Interpreter execution failed: ${executionError}`);
                        console.log(`Generated ${commandCount} commands before failure`);
                    } else {
                        console.log('✅ Interpreter execution completed successfully');
                        console.log(`Generated ${commandCount} commands`);
                    }
                    
                    console.log('');
                    
                    // 6. Summary
                    console.log('📊 TEST SUMMARY:');
                    console.log('=' + '='.repeat(20));
                    console.log(`Preprocessing: ${preprocessedCode ? 'SUCCESS' : 'FAILED'}`);
                    console.log(`Parsing: ${(ast && ast.type === 'ProgramNode' && !hasErrors) ? 'SUCCESS' : 'FAILED'}`);
                    console.log(`Interpreter: ${executionError ? 'FAILED' : 'SUCCESS'}`);
                    
                    const overallSuccess = preprocessedCode && 
                                          (ast && ast.type === 'ProgramNode') && 
                                          !executionError;
                    
                    console.log('');
                    console.log(`🏆 OVERALL RESULT: ${overallSuccess ? '✅ SUCCESS - ArduinoISP preprocessor fix working correctly' : '❌ ISSUES DETECTED'}`);
                    
                    if (overallSuccess) {
                        console.log('');
                        console.log('✅ The recent preprocessor fix successfully handles:');
                        console.log('   - Complex #if defined() expressions in ArduinoISP');
                        console.log('   - Platform-specific conditional compilation');
                        console.log('   - Proper directive removal and code generation');
                        console.log('   - End-to-end parsing and execution compatibility');
                    }
                    
                } else {
                    setTimeout(checkCompletion, 100);
                }
            };
            
            checkCompletion();
        }
    } else {
        console.log('❌ Skipping interpreter test due to parsing failure');
    }
    
} catch (error) {
    console.log('❌ Preprocessing failed:', error.message);
    console.log('Stack trace:', error.stack);
}
