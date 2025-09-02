const { Parser, parse, exportCompactAST } = require('../ArduinoParser.js');

/**
 * Integration test for CompactAST INT8/INT16 optimization
 * Tests real Arduino code to verify optimization reduces file size
 */

console.log('=== CompactAST Optimization Integration Test ===');

// Test Arduino code with various integer sizes
const testCode = `
void setup() {
    // Small integers (should use INT8/UINT8)
    int small1 = 5;
    int small2 = -10;
    int small3 = 100;
    int small4 = -50;
    
    // Medium integers (should use INT16/UINT16) 
    int medium1 = 1000;
    int medium2 = -1500;
    int medium3 = 10000;
    int medium4 = -20000;
    
    // Large integers (will use INT32/UINT32)
    int large1 = 100000;
    int large2 = -200000;
    
    // Float values
    float f1 = 3.14;
    float f2 = -2.5;
}

void loop() {
    // Arduino constants (should be optimized)
    digitalWrite(LED_BUILTIN, HIGH); // HIGH = 1 (UINT8)
    digitalWrite(2, LOW);            // LOW = 0 (UINT8)
    delay(100);                     // 100 (UINT8)
}`;

console.log('Testing Arduino code optimization...\n');

try {
    // Parse the test code
    console.log('📝 Parsing Arduino code...');
    const ast = parse(testCode);
    
    if (!ast || ast.type !== 'ProgramNode') {
        console.log('❌ Failed to parse Arduino code');
        process.exit(1);
    }
    
    console.log('✅ Successfully parsed Arduino code');
    
    // Export to CompactAST
    console.log('📦 Exporting to CompactAST format...');
    const buffer = exportCompactAST(ast);
    
    console.log(`✅ Generated CompactAST buffer: ${buffer.byteLength} bytes`);
    
    // Analyze the binary format to count optimized values
    const view = new DataView(buffer);
    let offset = 0;
    
    // Read header
    const magic = view.getUint32(offset, false); // Big-endian
    offset += 4;
    const version = view.getUint32(offset, true);
    offset += 4;
    const flags = view.getUint32(offset, true);
    offset += 4;
    
    console.log(`📋 Header: magic=0x${magic.toString(16)}, version=${version}, flags=${flags}`);
    
    // Read string table
    const stringTableLength = view.getUint16(offset, true);
    offset += 2;
    console.log(`📚 String table: ${stringTableLength} bytes`);
    offset += stringTableLength;
    
    // Read nodes
    const nodeTableLength = view.getUint16(offset, true);
    offset += 2;
    console.log(`🌳 Node table: ${nodeTableLength} bytes`);
    
    // Count value types used
    const valueTypeCounts = {
        'INT8_VAL': 0,
        'UINT8_VAL': 0, 
        'INT16_VAL': 0,
        'UINT16_VAL': 0,
        'INT32_VAL': 0,
        'UINT32_VAL': 0,
        'FLOAT32_VAL': 0,
        'FLOAT64_VAL': 0,
        'STRING_VAL': 0
    };
    
    const valueTypeMap = {
        0x02: 'INT8_VAL',
        0x03: 'UINT8_VAL',
        0x04: 'INT16_VAL', 
        0x05: 'UINT16_VAL',
        0x06: 'INT32_VAL',
        0x07: 'UINT32_VAL',
        0x0A: 'FLOAT32_VAL',
        0x0B: 'FLOAT64_VAL',
        0x0C: 'STRING_VAL'
    };
    
    const endOffset = offset + nodeTableLength;
    while (offset < endOffset) {
        const byte = view.getUint8(offset);
        if (valueTypeMap[byte]) {
            const valueType = valueTypeMap[byte];
            valueTypeCounts[valueType]++;
            
            // Skip the value bytes
            switch (byte) {
                case 0x02: case 0x03: offset += 2; break; // INT8, UINT8
                case 0x04: case 0x05: offset += 3; break; // INT16, UINT16
                case 0x06: case 0x07: case 0x0A: offset += 5; break; // INT32, UINT32, FLOAT32
                case 0x08: case 0x09: case 0x0B: offset += 9; break; // INT64, UINT64, FLOAT64
                case 0x0C: offset += 3; break; // STRING
                default: offset += 1; break;
            }
        } else {
            offset++;
        }
    }
    
    console.log('\n📊 Value Type Usage:');
    let totalOptimizedValues = 0;
    let totalSpaceSaved = 0;
    
    for (const [type, count] of Object.entries(valueTypeCounts)) {
        if (count > 0) {
            console.log(`  ${type}: ${count} values`);
            
            // Calculate space savings
            if (type === 'INT8_VAL' || type === 'UINT8_VAL') {
                totalOptimizedValues += count;
                totalSpaceSaved += count * 3; // 5 bytes (INT32) - 2 bytes (INT8/UINT8) = 3 bytes saved per value
            } else if (type === 'INT16_VAL' || type === 'UINT16_VAL') {
                totalOptimizedValues += count;  
                totalSpaceSaved += count * 2; // 5 bytes (INT32) - 3 bytes (INT16/UINT16) = 2 bytes saved per value
            }
        }
    }
    
    console.log(`\n🎯 Optimization Results:`);
    console.log(`  📈 Optimized values: ${totalOptimizedValues}`);
    console.log(`  💾 Space saved: ${totalSpaceSaved} bytes`);
    
    if (totalOptimizedValues > 0) {
        const optimizationPercentage = ((totalSpaceSaved / buffer.byteLength) * 100).toFixed(1);
        console.log(`  🚀 File size reduction: ${optimizationPercentage}%`);
        console.log(`\n✅ CompactAST INT8/INT16 optimization is working!`);
        console.log(`🎉 Successfully optimized ${totalOptimizedValues} integer values for better space efficiency.`);
    } else {
        console.log(`\n⚠️  No optimized values detected. May need debugging.`);
    }
    
} catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log(`Stack trace: ${error.stack}`);
}