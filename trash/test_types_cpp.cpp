#include "ASTInterpreter.hpp"
#include <iostream>
#include <fstream>

int main() {
    std::cout << "=== C++ Type System Test ===\n" << std::endl;
    
    try {
        // Use an existing working AST file that has mixed types
        std::ifstream file("test_complete_ternary.ast", std::ios::binary);
        if (!file.is_open()) {
            std::cerr << "ERROR: Cannot open test_complete_ternary.ast" << std::endl;
            std::cerr << "Run 'node test_complete_ternary.js' first!" << std::endl;
            return 1;
        }
        
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
        std::cout << "🔍 Testing type system on existing AST..." << std::endl;
        
        // Start the interpreter to trigger variable declarations
        if (!interpreter.start()) {
            std::cerr << "ERROR: Failed to start interpreter" << std::endl;
            return 1;
        }
        
        std::cout << "\n✅ Type system test completed - check debug output above" << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "ERROR: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}