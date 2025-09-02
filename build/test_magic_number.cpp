#include <iostream>
#include <fstream>
#include <cstring>

#if __BYTE_ORDER__ == __ORDER_BIG_ENDIAN__
#include <byteswap.h>
#define CONVERT_FROM_BIG_ENDIAN32(x) (x)
#else  
#define CONVERT_FROM_BIG_ENDIAN32(x) __builtin_bswap32(x)
#endif

static constexpr uint32_t COMPACT_AST_MAGIC = 0x41535450; // 'ASTP'

int main(int argc, char* argv[]) {
    if (argc != 2) {
        std::cerr << "Usage: " << argv[0] << " <ast_file>" << std::endl;
        return 1;
    }
    
    std::ifstream file(argv[1], std::ios::binary);
    if (!file) {
        std::cerr << "Error: Cannot open file " << argv[1] << std::endl;
        return 1;
    }
    
    // Read magic number
    uint32_t magic;
    file.read(reinterpret_cast<char*>(&magic), 4);
    
    std::cout << "Raw magic bytes: 0x" << std::hex << magic << std::dec << std::endl;
    
    // Apply endianness conversion (big-endian to native)
    magic = CONVERT_FROM_BIG_ENDIAN32(magic);
    
    std::cout << "Converted magic: 0x" << std::hex << magic << std::dec << std::endl;
    std::cout << "Expected magic: 0x" << std::hex << COMPACT_AST_MAGIC << std::dec << std::endl;
    
    if (magic == COMPACT_AST_MAGIC) {
        std::cout << "SUCCESS: Magic number matches!" << std::endl;
        return 0;
    } else {
        std::cout << "FAIL: Magic number mismatch" << std::endl;
        return 1;
    }
}