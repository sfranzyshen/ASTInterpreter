#include <iostream>
#include <fstream>
#include <vector>
#include "ASTInterpreter.hpp"
#include "CompactAST.hpp"
#include "tests/test_utils.hpp"

using namespace arduino_interpreter;
using namespace arduino_interpreter::testing;

int main() {
    std::cout << "=== DEBUG VALIDATION TEST ===" << std::endl;
    std::cout << "Testing Blink.ino (example_002.ast) with validation framework" << std::endl;
    
    // Step 1: Load AST file (same as validation test)
    std::string astFile = "test_data/example_002.ast";
    std::ifstream file(astFile, std::ios::binary);
    if (!file) {
        std::cout << "ERROR: Could not load " << astFile << std::endl;
        return 1;
    }
    
    file.seekg(0, std::ios::end);
    size_t size = file.tellg();
    file.seekg(0, std::ios::beg);
    
    std::vector<uint8_t> data(size);
    file.read(reinterpret_cast<char*>(data.data()), size);
    file.close();
    
    std::cout << "Loaded AST file: " << size << " bytes" << std::endl;
    
    // Step 2: Create interpreter (same as validation test)
    auto interpreter = createInterpreterFromBinary(data.data(), data.size());
    if (!interpreter) {
        std::cout << "ERROR: Failed to create interpreter from binary" << std::endl;
        return 1;
    }
    
    std::cout << "Interpreter created successfully" << std::endl;
    
    // Step 3: Execute with validation framework (same as validation test)
    TestResult result = executeWithTimeout(*interpreter, 5000);
    
    std::cout << "=== EXECUTION RESULTS ===" << std::endl;
    std::cout << "Success: " << (result.success ? "YES" : "NO") << std::endl;
    std::cout << "Error: " << (result.error.empty() ? "NONE" : result.error) << std::endl;
    std::cout << "Command Count: " << result.commandCount << std::endl;
    std::cout << "Command Stream Length: " << result.commandStream.length() << " characters" << std::endl;
    std::cout << "Execution Time: " << result.executionTime.count() << "ms" << std::endl;
    
    // Step 4: Show first few commands
    std::cout << std::endl << "=== FIRST 500 CHARS OF COMMAND STREAM ===" << std::endl;
    std::string preview = result.commandStream.substr(0, 500);
    std::cout << preview << std::endl;
    if (result.commandStream.length() > 500) {
        std::cout << "... (truncated)" << std::endl;
    }
    
    return 0;
}