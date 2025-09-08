#!/usr/bin/env node

/**
 * Simple Variable Declaration Test Generator
 * 
 * Creates test data specifically for testing C++ VarDeclNode::visit() 
 * variable initialization functionality.
 * 
 * Output: test_simple_var.ast (CompactAST binary for C++ interpreter)
 */

const fs = require('fs');
const { parse, exportCompactAST } = require('./ArduinoParser.js');

function generateVariableTest() {
    console.log('🔧 Generating variable declaration test data...\n');
    
    // Simple variable declaration with initializer
    const testCode = `
void setup() {
    int x = 5;
    Serial.begin(9600);
    Serial.print("x = ");
    Serial.println(x);
}

void loop() {
}
`;

    try {
        console.log('📝 Test code:');
        console.log(testCode);
        console.log();
        
        // Step 1: Parse the code to AST
        console.log('🔍 Parsing code to AST...');
        const ast = parse(testCode);
        
        if (!ast || ast.type !== 'ProgramNode') {
            throw new Error('Invalid AST generated');
        }
        console.log('✅ AST generated successfully');
        
        // Step 2: Generate CompactAST binary
        console.log('📦 Exporting CompactAST binary...');
        const compactAST = exportCompactAST(ast);
        
        if (!compactAST || compactAST.byteLength === 0) {
            throw new Error('CompactAST generation failed');
        }
        console.log(`✅ CompactAST generated: ${compactAST.byteLength} bytes`);
        
        // Step 3: Write AST file
        const filename = 'test_simple_var.ast';
        console.log(`💾 Writing ${filename}...`);
        
        fs.writeFileSync(filename, Buffer.from(compactAST));
        console.log(`✅ ${filename} created successfully`);
        
        // Summary
        console.log('\n📊 GENERATION COMPLETE');
        console.log(`📁 File: ${filename}`);
        console.log(`📦 Size: ${compactAST.byteLength} bytes`);
        console.log('🎯 Ready for C++ interpreter testing');
        
        // Show AST structure for debugging
        console.log('\n🔍 AST Structure:');
        console.log('Root:', ast.type);
        if (ast.body && ast.body.length > 0) {
            console.log('Functions:', ast.body.filter(n => n.type === 'FuncDefNode').length);
            
            // Find setup function and show its variable declarations
            const setupFunc = ast.body.find(n => n.type === 'FuncDefNode' && n.name === 'setup');
            if (setupFunc && setupFunc.body && setupFunc.body.statements) {
                const varDecls = setupFunc.body.statements.filter(s => s.type === 'VarDeclNode');
                console.log('Variable declarations in setup():', varDecls.length);
                
                varDecls.forEach((varDecl, index) => {
                    console.log(`  [${index}] ${varDecl.varType} ${varDecl.varName}${varDecl.initializer ? ' = ' + (varDecl.initializer.value || '[expr]') : ''}`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    generateVariableTest();
}

module.exports = { generateVariableTest };