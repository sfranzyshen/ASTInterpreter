#include "ASTInterpreter.hpp"
#include <iostream>
#include <fstream>

int main() {
    std::cout << "=== C++ Ternary Expression Test ===" << std::endl;
    
    try {
        // Load the ternary test AST
        std::ifstream file("test_ternary.ast", std::ios::binary);
        if (!file.is_open()) {
            std::cerr << "ERROR: Cannot open test_ternary.ast" << std::endl;
            std::cerr << "Run 'node test_ternary_fix.js' first!" << std::endl;
            return 1;
        }
        
        // Read file contents
        std::vector<uint8_t> data((std::istreambuf_iterator<char>(file)),
                                  std::istreambuf_iterator<char>());
        file.close();
        
        std::cout << "📦 Loaded test_ternary.ast (" << data.size() << " bytes)" << std::endl;
        
        // Create interpreter with debug enabled
        arduino_interpreter::InterpreterOptions opts;
        opts.debug = true;
        opts.verbose = true;
        
        arduino_interpreter::ASTInterpreter interpreter(data.data(), data.size(), opts);
        
        std::cout << "✅ Interpreter created successfully" << std::endl;
        std::cout << "🎯 Starting interpreter to test ternary expression..." << std::endl;
        
        // Start the interpreter (this will run setup and start loop)
        if (!interpreter.start()) {
            std::cerr << "ERROR: Failed to start interpreter" << std::endl;
            return 1;
        }
        
        std::cout << "\n🔍 Ternary expression test completed" << std::endl;
        std::cout << "✅ Look for 'x = 10' in the debug output above" << std::endl;
        std::cout << "✅ If x = 10, ternary expressions are working correctly!" << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "ERROR: " << e.what() << std::endl;
        return 1;
    }
    
    std::cout << "\n=== Test Complete ===" << std::endl;
    return 0;
}