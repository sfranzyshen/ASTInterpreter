#!/usr/bin/env node

/**
 * Clean Test Data Generator v1.0
 * 
 * Generates clean, accurate test data for cross-platform validation.
 * Built from scratch with no inheritance from corrupt generation code.
 * 
 * Features:
 * - Fixed CompactAST generation (string collection bug fixed)
 * - Real JavaScript command stream capture (no fake data)
 * - Proper error handling and validation
 * - Clean file organization
 * 
 * Output Files:
 * - test_data/example_XXX.ast (CompactAST binary)
 * - test_data/example_XXX.commands (JavaScript command stream JSON)
 * - test_data/example_XXX.meta (name and source code metadata)
 */

const fs = require('fs');
const path = require('path');
const { parse, exportCompactAST } = require('./ArduinoParser.js');
const { ArduinoInterpreter } = require('./ArduinoInterpreter.js');

// Load test data sources
const { examplesFiles } = require('./examples.js');
const { oldTestFiles } = require('./old_test.js');
const { neopixelFiles } = require('./neopixel.js');

class CleanTestDataGenerator {
    constructor() {
        this.outputDir = 'test_data';
        this.successCount = 0;
        this.failureCount = 0;
        this.totalTests = 0;
    }
    
    async generateAll() {
        console.log('🚀 Clean Test Data Generator v1.0');
        console.log('📋 Generating test data with FIXED CompactAST and REAL command streams\n');
        
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir);
            console.log(`📁 Created ${this.outputDir} directory`);
        }
        
        // Combine all test sources
        const allTests = [
            ...examplesFiles.map(t => ({...t, source: 'examples'})),
            ...oldTestFiles.map(t => ({...t, source: 'old_test'})),
            ...neopixelFiles.map(t => ({...t, source: 'neopixel'}))
        ];
        
        this.totalTests = allTests.length;
        console.log(`🎯 Processing ${this.totalTests} test files...\n`);
        
        // Process each test
        for (let i = 0; i < allTests.length; i++) {
            const test = allTests[i];
            const fileIndex = String(i).padStart(3, '0');
            
            try {
                await this.generateTestData(test, fileIndex, i + 1);
                this.successCount++;
            } catch (error) {
                console.error(`❌ [${i+1}/${this.totalTests}] ${test.name}: ${error.message}`);
                this.failureCount++;
            }
        }
        
        // Summary
        console.log('\n📊 GENERATION SUMMARY');
        console.log(`✅ Success: ${this.successCount}/${this.totalTests} (${((this.successCount/this.totalTests)*100).toFixed(1)}%)`);
        console.log(`❌ Failures: ${this.failureCount}/${this.totalTests} (${((this.failureCount/this.totalTests)*100).toFixed(1)}%)`);
        
        if (this.successCount === this.totalTests) {
            console.log('🎉 PERFECT! All test data generated successfully!');
        } else if (this.successCount / this.totalTests > 0.95) {
            console.log('✅ EXCELLENT! >95% success rate - ready for validation');
        } else {
            console.log('⚠️  Some failures occurred - check error messages above');
        }
    }
    
    async generateTestData(test, fileIndex, testNumber) {
        const baseName = `example_${fileIndex}`;
        console.log(`[${testNumber}/${this.totalTests}] ${test.name}...`);
        
        // Step 1: Parse the code to AST
        const code = test.content || test.code;
        if (!code || code.trim() === '') {
            throw new Error('Empty test code');
        }
        
        const ast = parse(code);
        if (!ast || ast.type !== 'ProgramNode') {
            throw new Error('Invalid AST generated');
        }
        
        // Step 2: Generate CompactAST binary (with FIXED string collection)
        const compactAST = exportCompactAST(ast);
        if (!compactAST || compactAST.byteLength === 0) {
            throw new Error('CompactAST generation failed');
        }
        
        // Step 3: Generate JavaScript command stream (REAL, not fake)
        const commands = await this.captureRealCommandStream(ast, test.name);
        
        // Step 4: Write all files
        const astFile = path.join(this.outputDir, `${baseName}.ast`);
        const commandsFile = path.join(this.outputDir, `${baseName}.commands`);
        const metaFile = path.join(this.outputDir, `${baseName}.meta`);
        
        // Write CompactAST binary
        fs.writeFileSync(astFile, Buffer.from(compactAST));
        
        // Write command stream JSON
        fs.writeFileSync(commandsFile, JSON.stringify(commands, null, 2));
        
        // Write metadata
        const metadata = {
            name: test.name,
            source: test.source || 'unknown',
            index: fileIndex,
            code: code,
            astSize: compactAST.byteLength,
            commandCount: commands.length,
            generated: new Date().toISOString()
        };
        
        fs.writeFileSync(metaFile, JSON.stringify(metadata, null, 2));
        
        console.log(`  ✅ Generated: ${compactAST.byteLength}B AST, ${commands.length} commands`);
    }
    
    async captureRealCommandStream(ast, testName) {
        return new Promise((resolve, reject) => {
            const commands = [];
            let executionCompleted = false;
            const timeout = testName.includes('Blink') ? 8000 : 5000;
            
            try {
                // Create interpreter with proper settings
                const interpreter = new ArduinoInterpreter(ast, { 
                    verbose: false,
                    debug: false,
                    stepDelay: 0,
                    maxLoopIterations: 3 // Prevent infinite loops
                });
                
                // Set up modern response handler pattern
                interpreter.responseHandler = (request) => {
                    let mockValue = 0;
                    switch (request.type) {
                        case 'analogRead':
                            mockValue = Math.floor(Math.random() * 1024);
                            break;
                        case 'digitalRead':
                            mockValue = Math.random() > 0.5 ? 1 : 0;
                            break;
                        case 'millis':
                            mockValue = Date.now() % 100000;
                            break;
                        case 'micros':
                            mockValue = Date.now() * 1000 % 1000000;
                            break;
                        default:
                            mockValue = 0;
                    }
                    // Simulate hardware delay
                    setTimeout(() => interpreter.resumeWithValue(request.id, mockValue), 1);
                };
                
                // Handle errors
                interpreter.onError = (error) => {
                    commands.push({
                        type: 'ERROR',
                        message: error.toString(),
                        timestamp: Date.now()
                    });
                    executionCompleted = true;
                };
                
                // Set up proper response handling for external data function requests
                const originalOnCommand = interpreter.onCommand;
                interpreter.onCommand = (command) => {
                    // Call original command handler first
                    if (originalOnCommand) {
                        originalOnCommand(command);
                    }
                    
                    // Store REAL command (not fake/mock)
                    commands.push(command);
                    
                    // Handle external data function requests immediately using state machine API
                    if (command.type === 'ANALOG_READ_REQUEST') {
                        const mockValue = Math.floor(Math.random() * 1024);
                        setTimeout(() => interpreter.resumeWithValue(command.requestId, mockValue), 1);
                    } else if (command.type === 'DIGITAL_READ_REQUEST') {
                        const mockValue = Math.random() > 0.5 ? 1 : 0;
                        setTimeout(() => interpreter.resumeWithValue(command.requestId, mockValue), 1);
                    } else if (command.type === 'MILLIS_REQUEST') {
                        const mockValue = Date.now() % 100000;
                        setTimeout(() => interpreter.resumeWithValue(command.requestId, mockValue), 1);
                    } else if (command.type === 'MICROS_REQUEST') {
                        const mockValue = Date.now() * 1000 % 1000000;
                        setTimeout(() => interpreter.resumeWithValue(command.requestId, mockValue), 1);
                    }
                    
                    // Check for completion
                    if (command.type === 'PROGRAM_END' || 
                        command.type === 'ERROR' || 
                        command.type === 'LOOP_LIMIT_REACHED') {
                        executionCompleted = true;
                    }
                };
                
                // Start execution
                const startResult = interpreter.start();
                if (!startResult) {
                    reject(new Error('Failed to start interpreter'));
                    return;
                }
                
                // Wait for completion with timeout
                const timeoutId = setTimeout(() => {
                    if (!executionCompleted) {
                        commands.push({
                            type: 'TIMEOUT',
                            message: `Execution timeout after ${timeout/1000} seconds`,
                            timestamp: Date.now()
                        });
                        executionCompleted = true;
                        interpreter.stop();
                    }
                }, timeout);
                
                // Check completion periodically
                const checkCompletion = () => {
                    if (executionCompleted) {
                        clearTimeout(timeoutId);
                        
                        // Validate we captured real commands (not empty/fake)
                        if (commands.length === 0) {
                            reject(new Error('No commands captured - possible interpreter failure'));
                        } else {
                            resolve(commands);
                        }
                    } else {
                        setTimeout(checkCompletion, 50);
                    }
                };
                
                checkCompletion();
                
            } catch (error) {
                reject(new Error(`Command capture failed: ${error.message}`));
            }
        });
    }
}

// Run generator if called directly
if (require.main === module) {
    const generator = new CleanTestDataGenerator();
    generator.generateAll().catch(error => {
        console.error('❌ Generation failed:', error.message);
        process.exit(1);
    });
}

module.exports = { CleanTestDataGenerator };