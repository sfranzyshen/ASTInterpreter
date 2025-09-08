#include <iostream>
#include <fstream>
#include <iomanip>

int main() {
    std::ifstream file("test_continuation.ast", std::ios::binary);
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
    
    // Test magic number reading
    uint32_t magic = *reinterpret_cast<uint32_t*>(buffer);
    std::cout << "\nMagic as uint32_t: 0x" << std::hex << magic << std::dec << std::endl;
    
    return 0;
}