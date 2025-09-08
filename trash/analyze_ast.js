const { parse } = require('./ArduinoParser.js');

const code = 'void setup() { digitalWrite(13, HIGH); } void loop() {}';
const ast = parse(code);

function analyzeNode(node, depth = 0) {
    if (!node) return;
    
    const indent = '  '.repeat(depth);
    console.log(`${indent}Node: ${node.type || node.nodeType || 'unknown'}`);
    
    if (node.value !== undefined) {
        console.log(`${indent}  Value: ${node.value}`);
    }
    
    // Traverse children
    if (node.children) {
        for (let child of node.children) {
            analyzeNode(child, depth + 1);
        }
    }
    if (node.statements) {
        for (let stmt of node.statements) {
            analyzeNode(stmt, depth + 1);
        }
    }
    if (node.body) analyzeNode(node.body, depth + 1);
    if (node.expression) analyzeNode(node.expression, depth + 1);
    if (node.arguments) {
        for (let arg of node.arguments) {
            analyzeNode(arg, depth + 1);
        }
    }
    if (node.callee) analyzeNode(node.callee, depth + 1);
}

console.log('=== AST Structure Analysis ===');
analyzeNode(ast);