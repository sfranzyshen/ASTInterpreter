#include <iostream>
#include <fstream>
#include <iomanip>
#include <cstring>

int main() {
    std::ifstream file("test_data/example_001.ast", std::ios::binary);
    if (!file) {
        std::cout << "Cannot open file" << std::endl;
        return 1;
    }
    
    // Read first 16 bytes
    unsigned char buffer[16];
    file.read(reinterpret_cast<char*>(buffer), 16);
    
    std::cout << "First 16 bytes from file:" << std::endl;
    for (int i = 0; i < 16; i++) {
        std::cout << "  [" << i << "] = 0x" << std::hex << (int)buffer[i] << std::dec;
        if (buffer[i] >= 32 && buffer[i] <= 126) {
            std::cout << " ('" << (char)buffer[i] << "')";
        }
        std::cout << std::endl;
    }
    
    // Test magic number reading different ways
    uint32_t magic1;
    std::memcpy(&magic1, buffer, 4);
    std::cout << "\nMagic as uint32_t (raw): 0x" << std::hex << magic1 << std::dec << " (" << magic1 << ")" << std::endl;
    
    // Little-endian conversion (on little-endian system should be no-op)
    uint32_t magic2 = magic1; // Already little-endian on x86_64
    std::cout << "Magic after little-endian conversion: 0x" << std::hex << magic2 << std::dec << " (" << magic2 << ")" << std::endl;
    
    // Expected ASTP magic (corrected for little-endian reading)
    uint32_t expected = 0x50545341;
    std::cout << "Expected ASTP magic: 0x" << std::hex << expected << std::dec << " (" << expected << ")" << std::endl;
    
    std::cout << "Match? " << (magic1 == expected ? "YES" : "NO") << std::endl;
    
    return 0;
}