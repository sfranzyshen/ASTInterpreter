#include "ASTInterpreter.hpp"
#include <iostream>
#include <fstream>

int main() {
    std::cout << "=== C++ Variable Initializer Test ===" << std::endl;
    
    try {
        // Load the test AST
        std::ifstream file("test_simple_var.ast", std::ios::binary);
        if (!file.is_open()) {
            std::cerr << "ERROR: Cannot open test_simple_var.ast" << std::endl;
            std::cerr << "Run 'node generate_var_test.js' first!" << std::endl;
            return 1;
        }
        
        // Read file contents
        std::vector<uint8_t> data((std::istreambuf_iterator<char>(file)),
                                  std::istreambuf_iterator<char>());
        file.close();
        
        std::cout << "📦 Loaded test_simple_var.ast (" << data.size() << " bytes)" << std::endl;
        
        // Create interpreter with CompactAST buffer and debug enabled
        arduino_interpreter::InterpreterOptions opts;
        opts.debug = true;
        opts.verbose = true;
        
        arduino_interpreter::ASTInterpreter interpreter(data.data(), data.size(), opts);
        
        std::cout << "✅ Interpreter created successfully" << std::endl;
        std::cout << "🎯 Starting interpreter to test variable initialization..." << std::endl;
        
        // Start the interpreter (this will run setup and start loop)
        if (!interpreter.start()) {
            std::cerr << "ERROR: Failed to start interpreter" << std::endl;
            return 1;
        }
        
        std::cout << "\n🔍 Variable initialization should be visible in debug output above" << std::endl;
        std::cout << "✅ Variable initialization test completed" << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "ERROR: " << e.what() << std::endl;
        return 1;
    }
    
    std::cout << "\n=== Test Complete ===" << std::endl;
    return 0;
}