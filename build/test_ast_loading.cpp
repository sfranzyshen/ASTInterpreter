#include "../CompactAST.hpp"
#include <iostream>
#include <fstream>

int main() {
    std::string filename = "test_data/example_000.ast";
    
    try {
        // Read file
        std::ifstream file(filename, std::ios::binary);
        if (!file) {
            std::cerr << "Cannot open " << filename << std::endl;
            return 1;
        }
        
        file.seekg(0, std::ios::end);
        size_t size = file.tellg();
        file.seekg(0, std::ios::beg);
        
        std::vector<uint8_t> buffer(size);
        file.read(reinterpret_cast<char*>(buffer.data()), size);
        file.close();
        
        std::cout << "Loading AST file: " << filename << " (" << size << " bytes)" << std::endl;
        
        // Test validation
        if (!arduino_ast::isValidCompactAST(buffer.data(), size)) {
            std::cerr << "Invalid AST format" << std::endl;
            return 1;
        }
        std::cout << "✓ Format validation passed" << std::endl;
        
        // Test header parsing
        arduino_ast::CompactASTReader reader(buffer.data(), size);
        auto header = reader.parseHeader();
        
        std::cout << "✓ Header parsed successfully:" << std::endl;
        std::cout << "  Magic: 0x" << std::hex << header.magic << std::dec 
                  << " (expected: 0x" << std::hex << 0x41535450 << std::dec << ")" << std::endl;
        std::cout << "  Version: 0x" << std::hex << header.version << std::dec << std::endl;
        std::cout << "  Nodes: " << header.nodeCount << std::endl;
        std::cout << "  String table: " << header.stringTableSize << " bytes" << std::endl;
        
        // Test string table parsing
        reader.parseStringTableInternal();
        std::cout << "✓ String table parsed successfully" << std::endl;
        
        std::cout << "SUCCESS: AST can be loaded with corrected endianness!" << std::endl;
        return 0;
        
    } catch (const std::exception& e) {
        std::cerr << "ERROR: " << e.what() << std::endl;
        return 1;
    }
}