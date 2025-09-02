#!/usr/bin/env node

/**
 * Debug AST structure to understand variable declarations
 */

const { parse } = require('./ArduinoParser.js');

console.log('🔍 Debugging AST Structure');

const code = `
void setup() {
    int x = 1;
}
`;

try {
    const ast = parse(code);
    
    function printNode(node, indent = 0) {
        const spaces = '  '.repeat(indent);
        if (!node) {
            console.log(`${spaces}(null)`);
            return;
        }
        
        console.log(`${spaces}${node.type || 'NO_TYPE'}: ${JSON.stringify(node, null, 2).substring(0, 100)}...`);
        
        if (node.children) {
            console.log(`${spaces}  children: ${node.children.length}`);
            node.children.forEach(child => printNode(child, indent + 2));
        }
        
        // Check VarDeclNode declarations
        if (node.type === 'VarDeclNode' && node.declarations) {
            console.log(`${spaces}  declarations: ${node.declarations.length}`);
            node.declarations.forEach((decl, i) => {
                console.log(`${spaces}    [${i}]: type=${decl.type || 'NO_TYPE'}, keys=[${Object.keys(decl).join(', ')}]`);
                if (decl.declarator) {
                    console.log(`${spaces}      declarator: ${JSON.stringify(decl.declarator)}`);
                }
                if (decl.initializer) {
                    console.log(`${spaces}      initializer: ${JSON.stringify(decl.initializer)}`);
                }
            });
        }
    }
    
    printNode(ast);
    
} catch (error) {
    console.error('❌ Debug failed:', error.message);
}