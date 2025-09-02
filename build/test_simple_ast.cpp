#include "../CompactAST.hpp"
#include <iostream>
#include <fstream>

int main(int argc, char* argv[]) {
    if (argc != 2) {
        std::cerr << "Usage: " << argv[0] << " <ast_file>" << std::endl;
        return 1;
    }
    
    std::string filename = argv[1];
    std::ifstream file(filename, std::ios::binary);
    if (!file) {
        std::cerr << "Error: Cannot open file " << filename << std::endl;
        return 1;
    }
    
    // Read file into buffer
    file.seekg(0, std::ios::end);
    size_t size = file.tellg();
    file.seekg(0, std::ios::beg);
    
    std::vector<uint8_t> buffer(size);
    file.read(reinterpret_cast<char*>(buffer.data()), size);
    file.close();
    
    try {
        std::cout << "Testing AST file: " << filename << " (size: " << size << " bytes)" << std::endl;
        
        // Test format validation first
        bool valid = arduino_ast::isValidCompactAST(buffer.data(), size);
        std::cout << "Valid format: " << (valid ? "YES" : "NO") << std::endl;
        
        if (!valid) {
            std::cout << "Format validation failed" << std::endl;
            return 1;
        }
        
        // Test header parsing
        arduino_ast::CompactASTReader reader(buffer.data(), size);
        auto header = reader.parseHeader();
        
        std::cout << "Header parsed successfully:" << std::endl;
        std::cout << "  Magic: 0x" << std::hex << header.magic << std::dec << std::endl;
        std::cout << "  Version: 0x" << std::hex << header.version << std::dec << std::endl;
        std::cout << "  Node count: " << header.nodeCount << std::endl;
        std::cout << "  String table size: " << header.stringTableSize << std::endl;
        
        std::cout << "SUCCESS: AST format is now readable!" << std::endl;
        return 0;
        
    } catch (const std::exception& e) {
        std::cerr << "Error parsing AST: " << e.what() << std::endl;
        return 1;
    }
}