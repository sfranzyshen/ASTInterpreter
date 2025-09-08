#include "tests/test_utils.hpp"
#include <iostream>
#include <fstream>
#include <vector>

using namespace arduino_interpreter;
using namespace arduino_interpreter::testing;

int main() {
    std::cout << "=== DEBUGGING COMMAND STREAM IN VALIDATION CONTEXT ===" << std::endl;
    
    // Test with BareMinimum.ino (example_001.ast) using the same method as validation
    std::ifstream file("test_data/example_001.ast", std::ios::binary);
    if (!file) {
        std::cerr << "Cannot open example_001.ast" << std::endl;
        return 1;
    }
    
    // Get file size and read data  
    file.seekg(0, std::ios::end);
    size_t size = file.tellg();
    file.seekg(0, std::ios::beg);
    
    std::vector<uint8_t> data(size);
    file.read(reinterpret_cast<char*>(data.data()), size);
    file.close();
    
    std::cout << "Loaded AST file: " << size << " bytes" << std::endl;
    
    try {
        // Create interpreter using same method as validation
        InterpreterOptions options;
        options.verbose = false;
        options.debug = false;
        options.maxLoopIterations = 3;
        
        ASTInterpreter interpreter(data.data(), size, options);
        
        // Use EXACTLY the same execution method as validation
        TestResult result = executeWithTimeout(interpreter, 5000);
        
        std::cout << "\\n=== VALIDATION-STYLE EXECUTION RESULTS ===" << std::endl;
        std::cout << "Success: " << (result.success ? "true" : "false") << std::endl;
        std::cout << "Command Count: " << result.commandCount << std::endl;
        std::cout << "Command Stream Length: " << result.commandStream.length() << " characters" << std::endl;
        std::cout << "Error: " << (result.error.empty() ? "none" : result.error) << std::endl;
        
        std::cout << "\\n=== COMMAND STREAM SAMPLE (First 800 chars) ===" << std::endl;
        std::cout << result.commandStream.substr(0, 800) << std::endl;
        if (result.commandStream.length() > 800) {
            std::cout << "... (truncated, total: " << result.commandStream.length() << " chars)" << std::endl;
        }
        
        // Try to load JavaScript output for comparison  
        std::ifstream jsFile("test_data/example_001.commands");
        if (jsFile) {
            std::string jsOutput((std::istreambuf_iterator<char>(jsFile)),
                                   std::istreambuf_iterator<char>());
            
            std::cout << "\\n=== COMPARISON WITH JAVASCRIPT ===" << std::endl;
            std::cout << "JavaScript length: " << jsOutput.length() << " characters" << std::endl;
            std::cout << "C++ length: " << result.commandStream.length() << " characters" << std::endl;
            
            double lengthRatio = std::min(result.commandStream.length(), jsOutput.length()) / 
                               (double)std::max(result.commandStream.length(), jsOutput.length());
            std::cout << "Length similarity: " << (int)(lengthRatio * 100) << "%" << std::endl;
            
            if (lengthRatio > 0.7) {
                std::cout << "✅ SUCCESS: Structured JSON is working in validation context!" << std::endl;
            } else {
                std::cout << "❌ ISSUE: Command stream still too short - structured JSON may not be working properly" << std::endl;
            }
        }
        
    } catch (const std::exception& e) {
        std::cerr << "Exception: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}