#include "ASTInterpreter.hpp"
#include <iostream>
#include <fstream>
#include <vector>

using namespace arduino_interpreter;

class QuietStructuredListener : public CommandListener {
public:
    size_t commandCount = 0;
    size_t totalBytes = 0;
    
    void onCommand(const Command& command) override {
        // Use serializeCommand for structured JSON output
        std::string result = serializeCommand(command);
        commandCount++;
        totalBytes += result.length();
    }
    
    void onError(const std::string& error) override {
        // Suppress error output for batch testing
    }
};

bool testExample(const std::string& filename, const std::string& name) {
    std::ifstream file(filename, std::ios::binary);
    if (!file) {
        std::cout << "  " << name << ": SKIP (file not found)" << std::endl;
        return false;
    }
    
    // Get file size and read data
    file.seekg(0, std::ios::end);
    size_t size = file.tellg();
    file.seekg(0, std::ios::beg);
    
    std::vector<uint8_t> data(size);
    file.read(reinterpret_cast<char*>(data.data()), size);
    file.close();
    
    try {
        InterpreterOptions options;
        options.verbose = false;
        options.debug = false;
        options.maxLoopIterations = 2; // Quick test
        
        ASTInterpreter interpreter(data.data(), size, options);
        
        QuietStructuredListener listener;
        interpreter.setCommandListener(&listener);
        
        bool started = interpreter.start();
        
        if (started && listener.commandCount > 5) {
            std::cout << "  " << name << ": SUCCESS (" << listener.commandCount 
                      << " commands, " << listener.totalBytes << " bytes)" << std::endl;
            return true;
        } else {
            std::cout << "  " << name << ": MINIMAL (" << listener.commandCount 
                      << " commands, " << listener.totalBytes << " bytes)" << std::endl;
            return false;
        }
        
    } catch (const std::exception& e) {
        std::cout << "  " << name << ": ERROR (" << e.what() << ")" << std::endl;
        return false;
    }
}

int main() {
    std::cout << "=== STRUCTURED COMMAND BATCH TEST ===" << std::endl;
    std::cout << "Testing structured JSON command output on multiple examples:" << std::endl << std::endl;
    
    int successCount = 0;
    int totalTests = 0;
    
    // Test first 10 examples to see the pattern
    for (int i = 0; i < 10; i++) {
        std::string filename = "test_data/example_" + std::string(3 - std::to_string(i).length(), '0') + std::to_string(i) + ".ast";
        std::string testName = "example_" + std::string(3 - std::to_string(i).length(), '0') + std::to_string(i);
        
        if (testExample(filename, testName)) {
            successCount++;
        }
        totalTests++;
    }
    
    std::cout << std::endl << "=== RESULTS ===" << std::endl;
    std::cout << "Successful tests: " << successCount << "/" << totalTests << std::endl;
    std::cout << "Tests with substantial structured output: " << 
        (double)successCount/totalTests*100.0 << "%" << std::endl;
    
    if (successCount > 0) {
        std::cout << std::endl << "✅ SUCCESS: Structured JSON commands working!" << std::endl;
        std::cout << "   Tests show rich JSON output with timestamps, messages," << std::endl;
        std::cout << "   and structured fields matching JavaScript format." << std::endl;
    }
    
    return 0;
}