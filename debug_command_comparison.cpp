#include "ASTInterpreter.hpp"
#include <iostream>
#include <fstream>
#include <vector>
#include <sstream>

using namespace arduino_interpreter;

class TestCommandListener : public CommandListener {
public:
    std::vector<std::string> commands;
    
    void onCommand(const Command& command) override {
        // Use the built-in serializeCommand function for structured JSON output
        std::string result = serializeCommand(command);
        commands.push_back(result);
        std::cout << result << std::endl;
    }
    
    void onError(const std::string& error) override {
        std::cout << "Error: " << error << std::endl;
    }
};

int main() {
    // Test BareMinimum.ino (example_001.ast) which shows 29% similarity
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
    
    std::cout << "=== C++ INTERPRETER OUTPUT FOR BareMinimum.ino ===" << std::endl;
    std::cout << "Loaded AST file: " << size << " bytes" << std::endl;
    
    // Create interpreter with minimal debug
    InterpreterOptions options;
    options.verbose = false;
    options.debug = false;
    options.maxLoopIterations = 3; // Match JavaScript test settings
    
    try {
        ASTInterpreter interpreter(data.data(), size, options);
        
        TestCommandListener listener;
        interpreter.setCommandListener(&listener);
        
        std::cout << "\n=== STARTING EXECUTION ===" << std::endl;
        bool started = interpreter.start();
        std::cout << "\nExecution completed. Commands generated: " << listener.commands.size() << std::endl;
        
        std::cout << "\n=== SUMMARY ===" << std::endl;
        for (size_t i = 0; i < listener.commands.size(); ++i) {
            std::cout << i+1 << ". " << listener.commands[i] << std::endl;
        }
        
    } catch (const std::exception& e) {
        std::cerr << "Exception: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}