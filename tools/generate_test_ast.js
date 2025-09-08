const fs = require('fs');
const { Parser, exportCompactAST } = require('./ArduinoParser.js');

// Simple test code  
const code = 'int x = 5; void setup() { Serial.println(x); } void loop() { delay(1000); }';

console.log('Parsing Arduino code...');
const parser = new Parser(code);
const ast = parser.parse();

if (ast && !ast.parseError) {
    console.log('Parsing successful, generating binary AST...');
    console.log('Root node type:', ast.type);
    console.log('Root node structure:', JSON.stringify(ast, null, 2).substring(0, 200) + '...');
    const binaryAST = exportCompactAST(ast);
    fs.writeFileSync('test_continuation.ast', Buffer.from(binaryAST));
    console.log('Binary AST written to test_continuation.ast');
    console.log('Binary size:', binaryAST.length, 'bytes');
} else {
    console.log('Parse error:', ast?.parseError || 'Unknown error');
}