const { Parser, parse, exportCompactAST } = require('../ArduinoParser.js');

/**
 * Test CompactAST INT8/INT16 value type optimization
 * This test verifies that small integer values are encoded using the most space-efficient types
 */

console.log('=== CompactAST INT8/INT16 Optimization Test ===');

// Test small integer values that should be optimized
const testCases = [
    { code: 'int a = 5;', expectedType: 'UINT8_VAL', expectedBytes: 2, description: 'Small positive int (5)' },
    { code: 'int b = -10;', expectedType: 'INT8_VAL', expectedBytes: 2, description: 'Small negative int (-10)' },
    { code: 'int c = 200;', expectedType: 'UINT8_VAL', expectedBytes: 2, description: 'Medium positive int (200)' },
    { code: 'int d = -100;', expectedType: 'INT8_VAL', expectedBytes: 2, description: 'Medium negative int (-100)' },
    { code: 'int e = 1000;', expectedType: 'UINT16_VAL', expectedBytes: 3, description: 'Large positive int (1000)' },
    { code: 'int f = -1000;', expectedType: 'INT16_VAL', expectedBytes: 3, description: 'Large negative int (-1000)' },
    { code: 'int g = 70000;', expectedType: 'UINT32_VAL', expectedBytes: 5, description: 'Very large positive int (70000)' },
    { code: 'int h = -70000;', expectedType: 'INT32_VAL', expectedBytes: 5, description: 'Very large negative int (-70000)' }
];

const valueTypeMap = {
    0x01: 'BOOL_VAL',
    0x02: 'INT8_VAL', 
    0x03: 'UINT8_VAL',
    0x04: 'INT16_VAL',
    0x05: 'UINT16_VAL', 
    0x06: 'INT32_VAL',
    0x07: 'UINT32_VAL',
    0x08: 'INT64_VAL',
    0x09: 'UINT64_VAL',
    0x0A: 'FLOAT32_VAL',
    0x0B: 'FLOAT64_VAL',
    0x0C: 'STRING_VAL'
};

function analyzeValueTypes(buffer) {
    const view = new DataView(buffer);
    const valueTypes = [];
    let offset = 0;
    
    // Skip header (12 bytes)
    offset = 12;
    
    // Skip string table length
    const stringTableLength = view.getUint16(offset, true);
    offset += 2 + stringTableLength;
    
    // Skip node table length  
    const nodeTableLength = view.getUint16(offset, true);
    offset += 2;
    
    // Scan through nodes looking for value types
    const endOffset = offset + nodeTableLength;
    while (offset < endOffset) {
        const nodeType = view.getUint8(offset);
        offset++; // Skip node type
        
        const dataSize = view.getUint16(offset, true);
        offset += 2; // Skip data size
        
        const nodeEndOffset = offset + dataSize;
        
        // Scan node data for value type markers
        while (offset < nodeEndOffset) {
            const byte = view.getUint8(offset);
            if (valueTypeMap[byte]) {
                const valueType = valueTypeMap[byte];
                let valueBytes = 0;
                
                // Determine value size
                switch (byte) {
                    case 0x01: case 0x02: case 0x03: valueBytes = 1; break; // BOOL, INT8, UINT8
                    case 0x04: case 0x05: valueBytes = 2; break; // INT16, UINT16
                    case 0x06: case 0x07: case 0x0A: valueBytes = 4; break; // INT32, UINT32, FLOAT32
                    case 0x08: case 0x09: case 0x0B: valueBytes = 8; break; // INT64, UINT64, FLOAT64
                    case 0x0C: valueBytes = 2; break; // STRING (string index)
                    default: valueBytes = 0;
                }
                
                valueTypes.push({ 
                    type: valueType, 
                    totalBytes: 1 + valueBytes, 
                    offset: offset 
                });
                offset += 1 + valueBytes;
            } else {
                offset++;
            }
        }
        
        offset = nodeEndOffset; // Move to next node
    }
    
    return valueTypes;
}

// Run tests
let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
    try {
        console.log(`\n--- Test ${index + 1}: ${testCase.description} ---`);
        
        // Parse the test code
        const ast = parse(testCase.code);
        if (!ast || ast.type !== 'ProgramNode') {
            console.log(`❌ Failed to parse: ${testCase.code}`);
            return;
        }
        
        // Export to CompactAST
        const buffer = exportCompactAST(ast);
        console.log(`Generated CompactAST buffer: ${buffer.byteLength} bytes`);
        
        // Analyze value types in the buffer
        const valueTypes = analyzeValueTypes(buffer);
        console.log(`Found value types:`, valueTypes.map(vt => `${vt.type}(${vt.totalBytes}B)`).join(', '));
        
        // Check if expected value type was found
        const foundExpectedType = valueTypes.some(vt => vt.type === testCase.expectedType && vt.totalBytes === testCase.expectedBytes);
        
        if (foundExpectedType) {
            console.log(`✅ PASS: Found expected ${testCase.expectedType} (${testCase.expectedBytes} bytes)`);
            passedTests++;
        } else {
            console.log(`❌ FAIL: Expected ${testCase.expectedType} (${testCase.expectedBytes} bytes), but not found`);
        }
        
    } catch (error) {
        console.log(`❌ ERROR in test ${index + 1}: ${error.message}`);
    }
});

console.log(`\n=== Test Results ===`);
console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
console.log(`📊 Success Rate: ${(passedTests/totalTests*100).toFixed(1)}%`);

if (passedTests === totalTests) {
    console.log(`🎉 CompactAST INT8/INT16 optimization is working perfectly!`);
    console.log(`📈 Space efficiency improvements:`);
    console.log(`   - Values 0-255: Use UINT8_VAL (2 bytes vs 5 bytes) = 60% space savings`);
    console.log(`   - Values -128-127: Use INT8_VAL (2 bytes vs 5 bytes) = 60% space savings`);
    console.log(`   - Values 256-65535: Use UINT16_VAL (3 bytes vs 5 bytes) = 40% space savings`);
    console.log(`   - Values -32768-32767: Use INT16_VAL (3 bytes vs 5 bytes) = 40% space savings`);
} else {
    console.log(`⚠️  Some optimization tests failed. Review implementation.`);
}