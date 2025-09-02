#include "ASTInterpreter.hpp"
#include <iostream>
#include <fstream>
#include <vector>

using namespace arduino_interpreter;

class SimpleCommandListener : public CommandListener {
public:
    void onCommand(const Command& command) override {
        commandCount_++;
        std::cout << "C++ Command " << commandCount_ << ": " << commandTypeToString(command.type);
        
        // Add details for specific command types to match expected sequence
        if (command.type == CommandType::LOOP_START) {
            if (auto* loopCmd = dynamic_cast<const LoopStartCommand*>(&command)) {
                std::cout << " (" << loopCmd->getValue("loopType").index() << ", iteration=" << commandValueToString(loopCmd->getValue("iteration")) << ")";
            }
        } else if (command.type == CommandType::FUNCTION_CALL) {
            if (auto* funcCmd = dynamic_cast<const FunctionCallCommand*>(&command)) {
                std::cout << " (" << commandValueToString(funcCmd->getValue("name")) << ")";
            }
        }
        
        std::cout << std::endl;
    }
    
    void onError(const std::string& error) override {
        std::cout << "C++ Error: " << error << std::endl;
    }
    
    int getCommandCount() const { return commandCount_; }
    
private:
    int commandCount_ = 0;
};

int main() {
    std::cout << "=== C++ Interpreter Test ===" << std::endl;
    
    // Load the test AST file
    std::ifstream file("test_simple.ast", std::ios::binary);
    if (!file) {
        std::cout << "Error: Could not open test_simple.ast" << std::endl;
        return 1;
    }
    
    std::vector<uint8_t> buffer((std::istreambuf_iterator<char>(file)),
                               std::istreambuf_iterator<char>());
    file.close();
    
    std::cout << "Loaded AST: " << buffer.size() << " bytes" << std::endl;
    
    try {
        // Create interpreter
        InterpreterOptions options;
        options.verbose = true;  // Enable debug output
        options.debug = true;    // Enable detailed debug output
        options.maxLoopIterations = 3;
        
        std::cout << "Creating ASTInterpreter..." << std::endl;
        auto interpreter = std::make_unique<ASTInterpreter>(buffer.data(), buffer.size(), options);
        
        std::cout << "Creating SimpleCommandListener..." << std::endl;
        auto listener = std::make_unique<SimpleCommandListener>();
        
        std::cout << "Setting command listener..." << std::endl;
        interpreter->setCommandListener(listener.get());
        
        std::cout << "Starting C++ interpreter..." << std::endl;
        bool success = interpreter->start();
        
        std::cout << "C++ interpreter result: " << (success ? "SUCCESS" : "FAILED") << std::endl;
        std::cout << "C++ generated " << listener->getCommandCount() << " commands" << std::endl;
        
        return success ? 0 : 1;
        
    } catch (const std::exception& e) {
        std::cout << "C++ Exception: " << e.what() << std::endl;
        return 1;
    }
}