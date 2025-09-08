/**
 * Generate binary AST for C++ execution trace testing
 */

const fs = require('fs');
const { Parser, parse, prettyPrintAST, exportCompactAST } = require('./ArduinoParser.js');

// Read minimal test case
const testCode = fs.readFileSync('minimal_test.ino', 'utf8');
console.log('=== Minimal Test Code ===');
console.log(testCode);
console.log('\n');

try {
    // Parse the code
    console.log('=== Parsing Phase ===');
    const ast = parse(testCode);
    console.log('Parsing successful');
    
    // Export as CompactAST for C++
    console.log('\n=== Generating CompactAST ===');
    const compactAST = exportCompactAST(ast);
    
    // Save binary AST (convert ArrayBuffer to Buffer for Node.js)
    const buffer = Buffer.from(compactAST);
    fs.writeFileSync('minimal_test.ast', buffer);
    console.log(`Binary AST saved: minimal_test.ast (${buffer.length} bytes)`);
    
    // Also show the AST structure
    console.log('\n=== AST Pretty Print ===');
    console.log(prettyPrintAST(ast));
    
} catch (error) {
    console.error('AST generation failed:', error);
}