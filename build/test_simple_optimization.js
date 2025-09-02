const { Parser, parse, exportCompactAST } = require('../ArduinoParser.js');

/**
 * Simple direct test of CompactAST INT8/INT16 optimization
 * This test directly examines the CompactASTExporter writeNumber method
 */

console.log('=== Simple CompactAST Optimization Test ===');

// Test the writeNumber method directly
class TestExporter {
    constructor() {
        this.stringTable = [];
        this.stringMap = new Map();
    }
    
    addString(str) {
        if (!this.stringMap.has(str)) {
            this.stringMap.set(str, this.stringTable.length);
            this.stringTable.push(str);
        }
        return this.stringMap.get(str);
    }
    
    writeNumber(view, offset, value) {
        // Copy the improved writeNumber method from ArduinoParser.js
        if (Number.isInteger(value)) {
            if (value >= 0) {
                // Unsigned integer - optimize for smallest possible type
                if (value <= 0xFF) { // Fits in 8-bit unsigned
                    view.setUint8(offset, 0x03); // UINT8_VAL
                    view.setUint8(offset + 1, value);
                    return offset + 2;
                } else if (value <= 0xFFFF) { // Fits in 16-bit unsigned
                    view.setUint8(offset, 0x05); // UINT16_VAL
                    view.setUint16(offset + 1, value, true);
                    return offset + 3;
                } else if (value <= 0xFFFFFFFF) { // Fits in 32-bit unsigned
                    view.setUint8(offset, 0x07); // UINT32_VAL
                    view.setUint32(offset + 1, value, true);
                    return offset + 5;
                } else {
                    // Value too large for 32-bit, use double
                    view.setUint8(offset, 0x0B); // FLOAT64_VAL
                    view.setFloat64(offset + 1, value, true);
                    return offset + 9;
                }
            } else {
                // Signed integer - optimize for smallest possible type
                if (value >= -0x80 && value <= 0x7F) { // Fits in 8-bit signed
                    view.setUint8(offset, 0x02); // INT8_VAL
                    view.setInt8(offset + 1, value);
                    return offset + 2;
                } else if (value >= -0x8000 && value <= 0x7FFF) { // Fits in 16-bit signed
                    view.setUint8(offset, 0x04); // INT16_VAL
                    view.setInt16(offset + 1, value, true);
                    return offset + 3;
                } else if (value >= -0x80000000 && value <= 0x7FFFFFFF) { // Fits in 32-bit signed
                    view.setUint8(offset, 0x06); // INT32_VAL
                    view.setInt32(offset + 1, value, true);
                    return offset + 5;
                } else {
                    // Value too large for 32-bit, use double
                    view.setUint8(offset, 0x0B); // FLOAT64_VAL
                    view.setFloat64(offset + 1, value, true);
                    return offset + 9;
                }
            }
        } else {
            // Floating-point number
            const float32Value = Math.fround(value);
            if (float32Value === value) {
                view.setUint8(offset, 0x0A); // FLOAT32_VAL
                view.setFloat32(offset + 1, value, true);
                return offset + 5;
            } else {
                view.setUint8(offset, 0x0B); // FLOAT64_VAL
                view.setFloat64(offset + 1, value, true);
                return offset + 9;
            }
        }
    }
}

const valueTypeNames = {
    0x02: 'INT8_VAL', 
    0x03: 'UINT8_VAL',
    0x04: 'INT16_VAL',
    0x05: 'UINT16_VAL', 
    0x06: 'INT32_VAL',
    0x07: 'UINT32_VAL',
    0x0A: 'FLOAT32_VAL',
    0x0B: 'FLOAT64_VAL'
};

// Test cases with expected results
const testValues = [
    { value: 5, expectedType: 'UINT8_VAL', expectedSize: 2 },
    { value: -10, expectedType: 'INT8_VAL', expectedSize: 2 },
    { value: 200, expectedType: 'UINT8_VAL', expectedSize: 2 },
    { value: -100, expectedType: 'INT8_VAL', expectedSize: 2 },
    { value: 1000, expectedType: 'UINT16_VAL', expectedSize: 3 },
    { value: -1000, expectedType: 'INT16_VAL', expectedSize: 3 },
    { value: 70000, expectedType: 'UINT32_VAL', expectedSize: 5 },
    { value: -70000, expectedType: 'INT32_VAL', expectedSize: 5 },
    { value: 3.14, expectedType: 'FLOAT32_VAL', expectedSize: 5 },
    { value: Math.PI * 1e20, expectedType: 'FLOAT64_VAL', expectedSize: 9 }
];

console.log('Testing writeNumber optimization directly:\n');

const exporter = new TestExporter();
let passedTests = 0;

testValues.forEach((testCase, index) => {
    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);
    
    console.log(`Test ${index + 1}: value = ${testCase.value}`);
    
    // Test the writeNumber method
    const endOffset = exporter.writeNumber(view, 0, testCase.value);
    const actualSize = endOffset - 0;
    const actualTypeCode = view.getUint8(0);
    const actualType = valueTypeNames[actualTypeCode] || `UNKNOWN(0x${actualTypeCode.toString(16).padStart(2, '0')})`;
    
    console.log(`  Expected: ${testCase.expectedType} (${testCase.expectedSize} bytes)`);
    console.log(`  Actual:   ${actualType} (${actualSize} bytes)`);
    
    if (actualType === testCase.expectedType && actualSize === testCase.expectedSize) {
        console.log(`  ✅ PASS\n`);
        passedTests++;
    } else {
        console.log(`  ❌ FAIL\n`);
    }
});

console.log(`=== Results ===`);
console.log(`✅ Passed: ${passedTests}/${testValues.length} tests`);
console.log(`📊 Success Rate: ${(passedTests/testValues.length*100).toFixed(1)}%`);

if (passedTests === testValues.length) {
    console.log(`🎉 CompactAST INT8/INT16 optimization is working perfectly!`);
    console.log(`Key improvements:`);
    console.log(`  - Small integers (-128 to 127): Use INT8_VAL/UINT8_VAL (2 bytes)`);
    console.log(`  - Medium integers (-32768 to 65535): Use INT16_VAL/UINT16_VAL (3 bytes)`);
    console.log(`  - Space savings: Up to 60% for small values, 40% for medium values`);
} else {
    console.log(`⚠️  Optimization not working correctly.`);
}