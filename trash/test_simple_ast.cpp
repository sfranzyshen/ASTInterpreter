/**
 * Minimal test to check CompactAST reading only
 */

#include <iostream>
#include <fstream>
#include <vector>
#include "CompactAST.hpp"

using namespace arduino_ast;

int main(int argc, char* argv[]) {
    if (argc != 2) {
        std::cout << "Usage: " << argv[0] << " <ast_file>" << std::endl;
        return 1;
    }
    
    std::cout << "🎯 Simple AST Reader Test" << std::endl;
    std::cout << "Loading: " << argv[1] << std::endl << std::endl;
    
    try {
        // Load AST file
        std::ifstream file(argv[1], std::ios::binary);
        if (!file) {
            std::cout << "❌ ERROR: Cannot open file " << argv[1] << std::endl;
            return 1;
        }
        
        // Read file into buffer
        std::vector<uint8_t> buffer((std::istreambuf_iterator<char>(file)),
                                   std::istreambuf_iterator<char>());
        file.close();
        
        std::cout << "📁 File loaded: " << buffer.size() << " bytes" << std::endl;
        
        // Create reader and parse
        CompactASTReader reader(buffer.data(), buffer.size());
        
        // Parse header
        auto header = reader.parseHeader();
        std::cout << "📋 Header:" << std::endl;
        std::cout << "   Magic: 0x" << std::hex << header.magic << std::dec << std::endl;
        std::cout << "   Version: 0x" << std::hex << header.version << std::dec << std::endl;
        std::cout << "   Node count: " << header.nodeCount << std::endl;
        std::cout << "   String table size: " << header.stringTableSize << " bytes" << std::endl;
        
        // Parse full AST
        std::cout << std::endl << "🚀 Parsing AST..." << std::endl;
        auto ast = reader.parse();
        std::cout << "✅ AST parsed successfully!" << std::endl;
        std::cout << "   Root node type: " << static_cast<int>(ast->getType()) << std::endl;
        
        return 0;
        
    } catch (const std::exception& e) {
        std::cout << "❌ ERROR: " << e.what() << std::endl;
        return 1;
    }
}