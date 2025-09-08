#include "ASTInterpreter.hpp"
#include <iostream>
#include <fstream>
#include <vector>

using namespace arduino_interpreter;

class StructuredCommandListener : public CommandListener {
public:
    std::vector<std::string> commands;
    
    void onCommand(const Command& command) override {
        // Use serializeCommand for structured JSON output
        std::string result = serializeCommand(command);
        commands.push_back(result);
        std::cout << result << std::endl;
    }
    
    void onError(const std::string& error) override {
        std::cout << "Error: " << error << std::endl;
    }
};

int main() {
    // Test with DigitalReadSerial.ino - has function calls but simpler than AnalogReadSerial
    std::cout << "=== STRUCTURED COMMAND TEST - DigitalReadSerial.ino ===" << std::endl;
    
    std::ifstream file("test_data/example_003.ast", std::ios::binary);
    if (!file) {
        std::cerr << "Cannot open example_003.ast" << std::endl;
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
    
    // Create interpreter with limited iterations for testing
    InterpreterOptions options;
    options.verbose = false;
    options.debug = false;
    options.maxLoopIterations = 2; // Short test
    
    try {
        ASTInterpreter interpreter(data.data(), size, options);
        
        StructuredCommandListener listener;
        interpreter.setCommandListener(&listener);
        
        std::cout << "\n=== STARTING EXECUTION ===\n" << std::endl;
        bool started = interpreter.start();
        
        std::cout << "\n=== EXECUTION COMPLETED ===\n" << std::endl;
        std::cout << "Commands generated: " << listener.commands.size() << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "Exception: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}