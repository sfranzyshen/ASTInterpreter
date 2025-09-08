#include "ASTInterpreter.hpp"
#include <iostream>
#include <fstream>

int main() {
    std::cout << "=== C++ Variable Declaration Type Test ===\n" << std::endl;
    
    try {
        // Try vardecl_test.ast which should have multiple variable types
        std::ifstream file("vardecl_test.ast", std::ios::binary);
        if (!file.is_open()) {
            std::cerr << "ERROR: Cannot open vardecl_test.ast" << std::endl;
            std::cerr << "Trying number_types_test.ast instead..." << std::endl;
            
            // Fallback to number_types_test.ast
            file.open("number_types_test.ast", std::ios::binary);
            if (!file.is_open()) {
                std::cerr << "ERROR: Cannot open any test AST file" << std::endl;
                return 1;
            }
        }
        
        std::vector<uint8_t> data((std::istreambuf_iterator<char>(file)),
                                  std::istreambuf_iterator<char>());
        file.close();
        
        std::cout << "📦 Loaded test AST (" << data.size() << " bytes)" << std::endl;
        
        // Create interpreter with debug enabled
        arduino_interpreter::InterpreterOptions opts;
        opts.debug = true;
        opts.verbose = true;
        
        arduino_interpreter::ASTInterpreter interpreter(data.data(), data.size(), opts);
        
        std::cout << "✅ Interpreter created successfully" << std::endl;
        std::cout << "🔍 Testing type conversions on AST variables..." << std::endl;
        
        // Start the interpreter to trigger variable declarations
        if (!interpreter.start()) {
            std::cerr << "ERROR: Failed to start interpreter" << std::endl;
            return 1;
        }
        
        std::cout << "\n✅ Type conversion test completed" << std::endl;
        std::cout << "📋 Summary: Look for 'convertToType:' lines in debug output above" << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "ERROR: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}