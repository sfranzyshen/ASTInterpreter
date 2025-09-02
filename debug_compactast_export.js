const { Parser, parse, exportCompactAST } = require('./ArduinoParser.js');

/**
 * Debug CompactAST export process - step by step analysis
 */

console.log('=== CompactAST Export Debug ===');

// Simple test code
const testCode = `int x = 13;`;

try {
    console.log('1. Parsing code:', testCode);
    const ast = parse(testCode);
    
    if (!ast || ast.type !== 'ProgramNode') {
        throw new Error('Failed to parse test code');
    }
    
    console.log('2. Creating CompactAST exporter...');
    
    // Create exporter and inspect its internal state
    class DebugCompactASTExporter {
        constructor(options = {}) {
            this.options = {
                version: 0x0100,
                flags: 0x0000,
                ...options
            };
            
            // String table for deduplication
            this.stringTable = new Map();
            this.strings = [];
            
            // Node processing
            this.nodes = [];
            this.nodeMap = new Map();
            
            // Type mapping
            this.nodeTypeMap = {
                'ProgramNode': 0x01,
                'ErrorNode': 0x02,
                'CommentNode': 0x03,
                'CompoundStmtNode': 0x10,
                'ExpressionStatement': 0x11,
                'IfStatement': 0x12,
                'WhileStatement': 0x13,
                'DoWhileStatement': 0x14,
                'ForStatement': 0x15,
                'RangeBasedForStatement': 0x16,
                'SwitchStatement': 0x17,
                'CaseStatement': 0x18,
                'ReturnStatement': 0x19,
                'BreakStatement': 0x1A,
                'ContinueStatement': 0x1B,
                'EmptyStatement': 0x1C,
                'VarDeclNode': 0x20,
                'FuncDefNode': 0x21,
                'FuncDeclNode': 0x22,
                'StructDeclaration': 0x23,
                'BinaryOpNode': 0x30,
                'UnaryOpNode': 0x31,
                'AssignmentNode': 0x32,
                'FuncCallNode': 0x33,
                'MemberAccessNode': 0x34,
                'NumberNode': 0x40,
                'StringLiteralNode': 0x41,
                'CharLiteralNode': 0x42,
                'IdentifierNode': 0x43,
                'ConstantNode': 0x44,
                'TypeNode': 0x50,
                'DeclaratorNode': 0x51,
                'ParamNode': 0x52
            };
        }
        
        collectNodes(node, index = 0) {
            if (!node) return index;
            
            console.log(`  Collecting node ${index}: ${node.type} (value: ${node.value})`);
            
            // Add to node list
            this.nodes[index] = node;
            this.nodeMap.set(node, index);
            
            // Add strings to string table
            if (node.value && typeof node.value === 'string') {
                this.addString(node.value);
            }
            if (node.operator && typeof node.operator === 'string') {
                this.addString(node.operator);
            }
            if (node.name && typeof node.name === 'string') {
                this.addString(node.name);
            }
            
            let nextIndex = index + 1;
            
            // Process children
            if (node.children) {
                for (const child of node.children) {
                    nextIndex = this.collectNodes(child, nextIndex);
                }
            }
            
            // Handle nested structures
            if (node.declarations) {
                for (const decl of node.declarations) {
                    if (decl.declarator) {
                        nextIndex = this.collectNodes(decl.declarator, nextIndex);
                    }
                    if (decl.initializer) {
                        nextIndex = this.collectNodes(decl.initializer, nextIndex);
                    }
                }
            }
            
            if (node.varType) {
                nextIndex = this.collectNodes(node.varType, nextIndex);
            }
            
            return nextIndex;
        }
        
        addString(str) {
            if (!this.stringTable.has(str)) {
                const index = this.strings.length;
                this.strings.push(str);
                this.stringTable.set(str, index);
                console.log(`    Added string: "${str}" (index: ${index})`);
            }
        }
        
        export(ast) {
            console.log('3. Phase 1: Collecting nodes...');
            this.collectNodes(ast);
            
            console.log(`\\n4. Collection results:`);
            console.log(`   - Collected ${this.nodes.length} nodes`);
            console.log(`   - String table has ${this.strings.length} entries`);
            
            console.log(`\\n5. Node details:`);
            for (let i = 0; i < this.nodes.length; i++) {
                const node = this.nodes[i];
                if (node) {
                    const nodeTypeValue = this.nodeTypeMap[node.type];
                    console.log(`   Node ${i}: ${node.type} -> 0x${nodeTypeValue ? nodeTypeValue.toString(16).padStart(2, '0') : 'UNKNOWN'} (${nodeTypeValue || 'UNKNOWN'})`);
                }
            }
            
            console.log(`\\n6. String table:`);
            for (let i = 0; i < this.strings.length; i++) {
                console.log(`   String ${i}: "${this.strings[i]}"`);
            }
            
            // This would normally continue with binary generation...
            console.log(`\\n✅ Debug collection complete`);
            return null; // Don't generate binary for debug
        }
    }
    
    const exporter = new DebugCompactASTExporter();
    exporter.export(ast);
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
}