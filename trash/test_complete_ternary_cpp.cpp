#include "ASTInterpreter.hpp"
#include <iostream>
#include <fstream>

int main() {
    std::cout << "=== C++ Complete Ternary Expression Test ===" << std::endl;
    
    try {
        // Load the complete ternary test AST
        std::ifstream file("test_complete_ternary.ast", std::ios::binary);
        if (!file.is_open()) {
            std::cerr << "ERROR: Cannot open test_complete_ternary.ast" << std::endl;
            std::cerr << "Run 'node test_complete_ternary.js' first!" << std::endl;
            return 1;
        }
        
        // Read file contents
        std::vector<uint8_t> data((std::istreambuf_iterator<char>(file)),
                                  std::istreambuf_iterator<char>());
        file.close();
        
        std::cout << "📦 Loaded test_complete_ternary.ast (" << data.size() << " bytes)" << std::endl;
        
        // Create interpreter with debug enabled
        arduino_interpreter::InterpreterOptions opts;
        opts.debug = true;
        opts.verbose = true;
        
        arduino_interpreter::ASTInterpreter interpreter(data.data(), data.size(), opts);
        
        std::cout << "✅ Interpreter created successfully" << std::endl;
        std::cout << "🎯 Testing complete ternary with defined variables:" << std::endl;
        std::cout << "   bool condition = true;" << std::endl;
        std::cout << "   int x = condition ? 10 : 20;" << std::endl;
        std::cout << "   int y = condition ? 100 : 200;" << std::endl;
        
        // Start the interpreter 
        if (!interpreter.start()) {
            std::cerr << "ERROR: Failed to start interpreter" << std::endl;
            return 1;
        }
        
        std::cout << "\n🔍 Complete ternary test completed" << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "ERROR: " << e.what() << std::endl;
        return 1;
    }
    
    std::cout << "\n=== Test Complete ===" << std::endl;
    return 0;
}