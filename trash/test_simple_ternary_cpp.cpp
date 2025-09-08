#include "ASTInterpreter.hpp"
#include <iostream>
#include <fstream>

int main() {
    std::cout << "=== C++ Simple Ternary Expression Test ===" << std::endl;
    
    try {
        // Load the simple ternary test AST
        std::ifstream file("test_simple_ternary.ast", std::ios::binary);
        if (!file.is_open()) {
            std::cerr << "ERROR: Cannot open test_simple_ternary.ast" << std::endl;
            std::cerr << "Run 'node test_simple_ternary.js' first!" << std::endl;
            return 1;
        }
        
        // Read file contents
        std::vector<uint8_t> data((std::istreambuf_iterator<char>(file)),
                                  std::istreambuf_iterator<char>());
        file.close();
        
        std::cout << "📦 Loaded test_simple_ternary.ast (" << data.size() << " bytes)" << std::endl;
        
        // Create interpreter with debug enabled
        arduino_interpreter::InterpreterOptions opts;
        opts.debug = true;
        opts.verbose = true;
        
        arduino_interpreter::ASTInterpreter interpreter(data.data(), data.size(), opts);
        
        std::cout << "✅ Interpreter created successfully" << std::endl;
        std::cout << "🎯 Testing simple ternary: int x = condition ? 10 : 20;" << std::endl;
        
        // Start the interpreter 
        if (!interpreter.start()) {
            std::cerr << "ERROR: Failed to start interpreter" << std::endl;
            return 1;
        }
        
        std::cout << "\n🔍 Simple ternary test completed" << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "ERROR: " << e.what() << std::endl;
        return 1;
    }
    
    std::cout << "\n=== Test Complete ===" << std::endl;
    return 0;
}