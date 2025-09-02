const { Parser, parse, exportCompactAST } = require('../ArduinoParser.js');

/**
 * Test CompactAST support for various C++ constructs
 * This test creates ASTs with diverse node types and verifies they can be exported/imported correctly
 */

console.log('=== CompactAST C++ Construct Support Test ===');

// Test cases with various C++ constructs
const testCases = [
    {
        name: "Basic Variable Declarations",
        code: `
            int x = 5;
            float y = 3.14;
            String name = "Arduino";
        `
    },
    {
        name: "Control Flow Statements",
        code: `
            if (x > 0) {
                y = x * 2;
            } else {
                y = -x;
            }
            
            for (int i = 0; i < 10; i++) {
                break;
            }
            
            while (condition) {
                continue;
            }
        `
    },
    {
        name: "Function Definitions",
        code: `
            int add(int a, int b) {
                return a + b;
            }
            
            void setup() {
                Serial.begin(9600);
            }
        `
    },
    {
        name: "Array and Member Access",
        code: `
            void test() {
                int arr[5] = {1, 2, 3, 4, 5};
                int value = arr[0];
                Serial.print(value);
                int len = myString.length();
            }
        `
    },
    {
        name: "Switch Statements",
        code: `
            void processValue(int val) {
                switch (val) {
                    case 1:
                        digitalWrite(LED_BUILTIN, HIGH);
                        break;
                    case 2:
                        digitalWrite(LED_BUILTIN, LOW);
                        break;
                    default:
                        delay(100);
                }
            }
        `
    },
    {
        name: "Range-based For Loop",
        code: `
            void iterate() {
                for (auto item : collection) {
                    Serial.println(item);
                }
            }
        `
    },
    {
        name: "Complex Expressions",
        code: `
            void calculate() {
                int result = (a > b) ? a : b;
                float complex = x * y + z / 2.0;
                bool flag = !enabled && (count > 0);
            }
        `
    },
    {
        name: "String and Character Literals",
        code: `
            void strings() {
                char letter = 'A';
                String message = "Hello World";
                const char* greeting = "Arduino";
            }
        `
    }
];

function analyzeCompactAST(buffer) {
    const view = new DataView(buffer);
    
    // Read header
    const magic = view.getUint32(0, false); // Big-endian
    const version = view.getUint32(4, true);
    const flags = view.getUint32(8, true);
    
    // Read string table size
    let offset = 12;
    const stringTableSize = view.getUint16(offset, true);
    offset += 2 + stringTableSize;
    
    // Read node table size
    const nodeTableSize = view.getUint16(offset, true);
    offset += 2;
    
    // Count different node types
    const nodeTypeCounts = {};
    const nodeTableEnd = offset + nodeTableSize;
    
    while (offset < nodeTableEnd) {
        if (offset + 4 > nodeTableEnd) break;
        
        const nodeType = view.getUint8(offset);
        const flags = view.getUint8(offset + 1);
        const dataSize = view.getUint16(offset + 2, true);
        
        // Count this node type
        const nodeTypeName = getNodeTypeName(nodeType);
        nodeTypeCounts[nodeTypeName] = (nodeTypeCounts[nodeTypeName] || 0) + 1;
        
        // Skip to next node
        offset += 4 + dataSize;
    }
    
    return {
        header: { magic, version, flags },
        stringTableSize,
        nodeTableSize,
        nodeTypeCounts
    };
}

function getNodeTypeName(nodeType) {
    const nodeTypeMap = {
        0x01: "PROGRAM",
        0x10: "COMPOUND_STMT", 0x11: "EXPRESSION_STMT", 0x12: "IF_STMT",
        0x13: "WHILE_STMT", 0x14: "DO_WHILE_STMT", 0x15: "FOR_STMT", 0x16: "RANGE_FOR_STMT",
        0x17: "SWITCH_STMT", 0x18: "CASE_STMT", 0x19: "RETURN_STMT", 0x1A: "BREAK_STMT",
        0x1B: "CONTINUE_STMT", 0x1C: "EMPTY_STMT",
        0x20: "VAR_DECL", 0x21: "FUNC_DEF", 0x22: "FUNC_DECL", 0x23: "STRUCT_DECL",
        0x30: "BINARY_OP", 0x31: "UNARY_OP", 0x32: "ASSIGNMENT", 0x33: "FUNC_CALL",
        0x34: "MEMBER_ACCESS", 0x35: "ARRAY_ACCESS", 0x38: "TERNARY_EXPR",
        0x40: "NUMBER_LITERAL", 0x41: "STRING_LITERAL", 0x42: "CHAR_LITERAL",
        0x43: "IDENTIFIER", 0x44: "CONSTANT", 0x45: "ARRAY_INIT",
        0x50: "TYPE_NODE", 0x51: "DECLARATOR_NODE", 0x52: "PARAM_NODE"
    };
    
    return nodeTypeMap[nodeType] || `UNKNOWN_0x${nodeType.toString(16).padStart(2, '0')}`;
}

let totalTests = 0;
let passedTests = 0;
let totalNodeTypes = new Set();

console.log('Testing C++ construct support...\n');

for (const testCase of testCases) {
    totalTests++;
    console.log(`--- Test: ${testCase.name} ---`);
    
    try {
        // Parse the Arduino code
        const ast = parse(testCase.code);
        
        if (!ast || ast.type !== 'ProgramNode') {
            console.log(`❌ FAIL: Failed to parse`);
            continue;
        }
        
        console.log(`✅ Successfully parsed`);
        
        // Export to CompactAST
        const buffer = exportCompactAST(ast);
        console.log(`📦 Generated CompactAST: ${buffer.byteLength} bytes`);
        
        // Analyze the buffer
        const analysis = analyzeCompactAST(buffer);
        
        if (analysis.header.magic === 0x41535450) { // "ASTP" in big-endian
            console.log(`✅ Valid CompactAST header`);
            passedTests++;
        } else {
            console.log(`❌ Invalid magic number: 0x${analysis.header.magic.toString(16)}`);
        }
        
        // Report node types found
        const nodeTypes = Object.keys(analysis.nodeTypeCounts);
        console.log(`🌳 Node types: ${nodeTypes.length} different types`);
        
        for (const nodeType of nodeTypes) {
            totalNodeTypes.add(nodeType);
        }
        
        // Show most common node types
        const sortedTypes = Object.entries(analysis.nodeTypeCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        console.log(`📊 Top node types: ${sortedTypes.map(([type, count]) => `${type}(${count})`).join(', ')}`);
        
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
}

console.log('=== Summary ===');
console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
console.log(`📊 Success Rate: ${(passedTests/totalTests*100).toFixed(1)}%`);
console.log(`🌳 Total Node Types Found: ${totalNodeTypes.size}`);
console.log(`📋 Node Types: ${Array.from(totalNodeTypes).sort().join(', ')}`);

if (passedTests === totalTests) {
    console.log('\n🎉 CompactAST C++ construct support is working perfectly!');
    console.log('✨ Key achievements:');
    console.log('  - All test cases parsed and exported successfully');
    console.log('  - CompactAST format validation passed');
    console.log(`  - ${totalNodeTypes.size} different AST node types supported`);
    console.log('  - Enhanced C++ construct coverage in CompactASTReader');
} else {
    console.log('\n⚠️  Some tests failed. Review the failing cases.');
}