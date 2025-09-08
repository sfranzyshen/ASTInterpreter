#include "ASTInterpreter.hpp"
#include <iostream>
#include <fstream>
#include <vector>

using namespace arduino_interpreter;

class TestCommandListener : public CommandListener {
public:
    std::vector<std::string> commands;
    
    void onCommand(const CommandPtr& command) override {
        // Convert command to string representation
        std::string cmdStr = "Command: " + std::to_string(static_cast<int>(command->type));
        if (!command->message.empty()) {
            cmdStr += " - " + command->message;
        }
        commands.push_back(cmdStr);
        std::cout << cmdStr << std::endl;
    }
    
    void onError(const std::string& error) override {
        std::cout << "Error: " << error << std::endl;
    }
};

int main() {
    // Read a simple test AST file
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
    
    // Create interpreter
    InterpreterOptions options;
    options.verbose = true;
    options.debug = true;
    
    try {
        ASTInterpreter interpreter(data.data(), size, options);
        
        TestCommandListener listener;
        interpreter.setCommandListener(&listener);
        
        std::cout << "Starting interpreter..." << std::endl;
        bool started = interpreter.start();
        std::cout << "Start result: " << (started ? "SUCCESS" : "FAILED") << std::endl;
        
        std::cout << "\nTotal commands emitted: " << listener.commands.size() << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "Exception: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}