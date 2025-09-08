#include <iostream>
#include <cstring>

int main() {
    // Simulate the parsing with manual byte offsets
    unsigned char test_data[] = {
        // Header (16 bytes)
        0x41, 0x53, 0x54, 0x50,  // ASTP
        0x00, 0x01, 0x00, 0x00,  // version
        0x0f, 0x00, 0x00, 0x00,  // node count  
        0x24, 0x00, 0x00, 0x00,  // string table size
        
        // String table starts at offset 16
        0x05, 0x00, 0x00, 0x00,  // string count = 5 (offset 16-19)
        
        // String 0: "int" (offset 20-25)
        0x03, 0x00,              // length = 3 (offset 20-21)
        'i', 'n', 't', 0x00,     // "int\0" (offset 22-25)
        
        // String 1: "x" (offset 26-29) 
        0x01, 0x00,              // length = 1 (offset 26-27)
        'x', 0x00,               // "x\0" (offset 28-29)
        
        // String 2: "void" (offset 30-36)
        0x04, 0x00,              // length = 4 (offset 30-31)  
        'v', 'o', 'i', 'd', 0x00, // "void\0" (offset 32-36)
        
        // String 3: "setup" (offset 37-44)
        0x05, 0x00,              // length = 5 (offset 37-38)
        's', 'e', 't', 'u', 'p', 0x00, // "setup\0" (offset 39-44)
        
        // String 4: "loop" (offset 45-51)  
        0x04, 0x00,              // length = 4 (offset 45-46)
        'l', 'o', 'o', 'p', 0x00, // "loop\0" (offset 47-51)
        
        // 4-byte alignment: 52 % 4 == 0, so no padding needed
        
        // Node data starts at offset 52
        0x01,  // node type = 1 (PROGRAM)
        0x01,  // flags = 1
        0x06, 0x00,  // data size = 6
    };
    
    size_t position = 16; // Start after header
    
    // Parse string count
    uint32_t stringCount = *reinterpret_cast<uint32_t*>(test_data + position);
    position += 4;
    std::cout << "String count: " << stringCount << " (position now: " << position << ")" << std::endl;
    
    // Parse each string
    for (uint32_t i = 0; i < stringCount; i++) {
        uint16_t stringLength = *reinterpret_cast<uint16_t*>(test_data + position);
        position += 2;
        std::cout << "String " << i << " length: " << stringLength << " (position: " << position << ")" << std::endl;
        
        std::string str(reinterpret_cast<const char*>(test_data + position), stringLength);
        position += stringLength;
        position++; // null terminator
        std::cout << "  String: \"" << str << "\" (position now: " << position << ")" << std::endl;
    }
    
    // 4-byte alignment
    while (position % 4 != 0) position++;
    std::cout << "After alignment, position: " << position << std::endl;
    
    // Read first node
    std::cout << "First node type at position " << position << ": " << (int)test_data[position] << std::endl;
    
    return 0;
}