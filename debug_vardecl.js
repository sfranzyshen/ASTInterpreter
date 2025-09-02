#!/usr/bin/env node

/**
 * Debug VarDeclNode structure specifically
 */

const { parse } = require('./ArduinoParser.js');

const code = `
void setup() {
    int x = 1;
}
`;

try {
    const ast = parse(code);
    
    function findVarDecl(node) {
        if (node && node.type === 'VarDeclNode') {
            console.log('🎯 Found VarDeclNode:');
            console.log('  type:', node.type);
            console.log('  varType:', JSON.stringify(node.varType, null, 2));
            console.log('  declarations length:', node.declarations ? node.declarations.length : 'undefined');
            
            if (node.declarations) {
                node.declarations.forEach((decl, i) => {
                    console.log(`\n  Declaration [${i}]:`);
                    console.log('    type:', decl.type || 'MISSING TYPE');
                    console.log('    keys:', Object.keys(decl));
                    console.log('    full object:', JSON.stringify(decl, null, 4));
                });
            }
            return;
        }
        
        if (node && node.children) {
            node.children.forEach(findVarDecl);
        }
        if (node && node.body) {
            findVarDecl(node.body);
        }
    }
    
    findVarDecl(ast);
    
} catch (error) {
    console.error('❌ Debug failed:', error.message);
}