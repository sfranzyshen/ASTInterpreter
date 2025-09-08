#!/usr/bin/env node

const { Parser, parse } = require('./parser.js');

const testCode = `
#define LED_COUNT 60
#define LED_PIN 6
Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);
`;

console.log('🔍 Debugging constructor arguments parsing:');
console.log('==========================================');

try {
    const ast = parse(testCode);
    console.log('\n📋 AST Structure:');
    
    // Find the variable declaration
    function findVarDecl(node) {
        if (!node) return null;
        
        if (node.type === 'VarDeclNode') {
            return node;
        }
        
        if (node.children) {
            for (const child of node.children) {
                const result = findVarDecl(child);
                if (result) return result;
            }
        }
        
        return null;
    }
    
    const varDecl = findVarDecl(ast);
    if (varDecl) {
        console.log('Variable Declaration Node:');
        console.log('- varType:', varDecl.varType?.value);
        console.log('- declarations length:', varDecl.declarations?.length);
        
        if (varDecl.declarations && varDecl.declarations.length > 0) {
            const decl = varDecl.declarations[0];
            console.log('\nFirst Declaration:');
            console.log('- declarator value:', decl.declarator?.value);
            console.log('- initializer type:', decl.initializer?.type);
            console.log('- initializer callee:', decl.initializer?.callee?.value);
            
            if (decl.initializer?.arguments) {
                console.log('- arguments length:', decl.initializer.arguments.length);
                decl.initializer.arguments.forEach((arg, idx) => {
                    console.log(`  arg[${idx}]:`, {
                        type: arg.type,
                        value: arg.value
                    });
                });
            }
        }
    } else {
        console.log('❌ No variable declaration found in AST');
    }
    
} catch (error) {
    console.error('❌ Parse error:', error.message);
}