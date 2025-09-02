const { Parser, parse, exportCompactAST } = require('./ArduinoParser.js');
const fs = require('fs');

/**
 * Debug CompactAST format - analyze the binary structure byte by byte
 */

console.log('=== CompactAST Format Debug ===');

// Very simple test code
const testCode = `int x = 13;`;

try {
    console.log('Parsing code:', testCode);
    const ast = parse(testCode);
    
    console.log('AST structure:');
    console.log(JSON.stringify(ast, null, 2));
    
    console.log('\nGenerating CompactAST...');
    const buffer = exportCompactAST(ast);
    
    console.log(`\nBinary analysis of ${buffer.byteLength} bytes:`);
    const view = new DataView(buffer);
    
    // Header analysis
    console.log('--- HEADER (16 bytes) ---');
    const magic = view.getUint32(0, true);
    const version = view.getUint16(4, true);
    const flags = view.getUint16(6, true);
    const nodeCount = view.getUint32(8, true);
    const stringTableSize = view.getUint32(12, true);
    
    console.log(`Magic: 0x${magic.toString(16)} (${magic === 0x41535450 ? 'VALID' : 'INVALID'})`);
    console.log(`Version: 0x${version.toString(16)}`);
    console.log(`Flags: 0x${flags.toString(16)}`);
    console.log(`Node Count: ${nodeCount}`);
    console.log(`String Table Size: ${stringTableSize} bytes`);
    
    // String table analysis
    let offset = 16;
    console.log('\n--- STRING TABLE ---');
    const stringCount = view.getUint32(offset, true);
    offset += 4;
    console.log(`String Count: ${stringCount}`);
    
    for (let i = 0; i < stringCount; i++) {
        const stringLength = view.getUint16(offset, true);
        offset += 2;
        
        let stringValue = '';
        for (let j = 0; j < stringLength; j++) {
            stringValue += String.fromCharCode(view.getUint8(offset));
            offset++;
        }
        
        // Skip null terminator
        offset++;
        
        console.log(`String ${i}: "${stringValue}" (length: ${stringLength})`);
    }
    
    // Node table analysis (nodes start directly after string table)
    console.log('\n--- NODE TABLE ---');
    console.log(`Node data starts at offset: ${offset}`);
    const nodeTableStart = offset;
    let nodeIndex = 0;
    
    // Parse nodes until we reach the end of the buffer or have parsed all expected nodes
    while (offset < buffer.byteLength && nodeIndex < nodeCount) {
        console.log(`\n--- NODE ${nodeIndex} ---`);
        const nodeType = view.getUint8(offset);
        offset++;
        
        const flags = view.getUint8(offset);
        offset++;
        
        const dataSize = view.getUint16(offset, true);
        offset += 2;
        
        console.log(`Node Type: 0x${nodeType.toString(16).padStart(2, '0')} (${nodeType})`);
        console.log(`Flags: 0x${flags.toString(16).padStart(2, '0')} (${flags})`);
        console.log(`Data Size: ${dataSize} bytes`);
        
        if (dataSize > 0) {
            console.log('Raw data:');
            let dataHex = '';
            for (let i = 0; i < Math.min(dataSize, 20); i++) {
                const byte = view.getUint8(offset + i);
                dataHex += `0x${byte.toString(16).padStart(2, '0')} `;
                
                // Check for value type markers
                if (i === 0) {
                    console.log(`  Byte 0: 0x${byte.toString(16).padStart(2, '0')} (${byte}) - ${byte >= 0x01 && byte <= 0x0F ? 'Possible Value Type' : 'Not Value Type'}`);
                }
            }
            console.log(`  Hex: ${dataHex}`);
        }
        
        offset += dataSize;
        nodeIndex++;
    }
    
    // Write debug file
    fs.writeFileSync('debug_format.ast', Buffer.from(buffer));
    console.log('\n✅ Debug file written: debug_format.ast');
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
}