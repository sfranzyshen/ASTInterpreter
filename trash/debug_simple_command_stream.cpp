/**
 * debug_simple_command_stream.cpp - Debug C++ Command Stream Generation
 * 
 * Simple test to see exactly what command stream the C++ interpreter produces
 * for BareMinimum.ino compared to JavaScript's 17 commands.
 */

#include "tests/test_utils.hpp"
#include <iostream>
#include <fstream>

using namespace arduino_interpreter;
using namespace arduino_interpreter::testing;

int main() {
    std::cout << "=== C++ Command Stream Debug ===" << std::endl;
    
    try {
        // Load BareMinimum.ino AST data (example_001.ast)
        std::string astFile = "test_data/example_001.ast";
        std::ifstream astStream(astFile, std::ios::binary);
        if (!astStream) {
            std::cerr << "ERROR: Cannot load " << astFile << std::endl;
            return 1;
        }
        
        // Read AST data
        astStream.seekg(0, std::ios::end);
        size_t size = astStream.tellg();
        astStream.seekg(0, std::ios::beg);
        
        std::vector<uint8_t> compactAST(size);
        astStream.read(reinterpret_cast<char*>(compactAST.data()), size);
        
        std::cout << "Loaded AST data: " << size << " bytes" << std::endl;
        
        // Create C++ interpreter
        auto interpreter = createInterpreterFromBinary(compactAST.data(), compactAST.size());
        if (!interpreter) {
            std::cerr << "ERROR: Failed to create interpreter" << std::endl;
            return 1;
        }
        
        std::cout << "Created C++ interpreter successfully" << std::endl;
        
        std::cout << "Starting C++ interpreter execution..." << std::endl;
        
        // Execute with timeout (this calls start() internally and sets up its own capture)
        auto result = executeWithTimeout(*interpreter, 5000);
        
        std::cout << "Execution completed!" << std::endl;
        std::cout << "Success: " << (result.success ? "YES" : "NO") << std::endl;
        std::cout << "Error: " << result.error << std::endl;
        std::cout << "Command count: " << result.commandCount << std::endl;
        
        std::cout << "\n=== C++ Command Stream ===" << std::endl;
        std::cout << result.commandStream << std::endl;
        
        // Compare with JavaScript expectations
        std::cout << "\n=== Comparison ===" << std::endl;
        std::cout << "JavaScript expects: 17 commands" << std::endl;
        std::cout << "C++ produced: " << result.commandCount << " commands" << std::endl;
        
        if (result.commandCount != 17) {
            std::cout << "❌ COMMAND COUNT MISMATCH!" << std::endl;
        } else {
            std::cout << "✅ Command count matches!" << std::endl;
        }
        
    } catch (const std::exception& e) {
        std::cerr << "EXCEPTION: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}