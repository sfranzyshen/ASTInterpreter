/**
 * Direct test of our CompactAST format with the C++ interpreter
 */

#include "ASTInterpreter.hpp"
#include "CommandProtocol.hpp"
#include <fstream>
#include <iostream>
#include <memory>

using namespace arduino_interpreter;

class TestCommandListener : public CommandListener {
public:
    int commandCount = 0;
    
    void onCommand(const Command& command) override {
        std::cout << "Command " << ++commandCount << ": " << command.toString() << std::endl;
    }
    
    void onError(const std::string& error) override {
        std::cout << "Error: " << error << std::endl;
    }
};

int main(int argc, char* argv[]) {
    std::cout << "Direct C++ AST Interpreter Test\n";
    std::cout << "===============================\n\n";
    
    const char* filename = (argc > 1) ? argv[1] : "simple_test.ast";
    
    try {
        // Read the AST file
        std::ifstream file(filename, std::ios::binary | std::ios::ate);
        if (!file) {
            std::cerr << "Failed to open file: " << filename << std::endl;
            return 1;
        }
        
        std::streamsize size = file.tellg();
        file.seekg(0, std::ios::beg);
        
        std::vector<uint8_t> buffer(size);
        if (!file.read(reinterpret_cast<char*>(buffer.data()), size)) {
            std::cerr << "Failed to read file" << std::endl;
            return 1;
        }
        
        std::cout << "Loaded " << size << " bytes from " << filename << std::endl;
        
        // Create interpreter with the AST data
        InterpreterOptions options;
        options.verbose = true;
        options.debug = true;
        options.maxLoopIterations = 3;
        
        ASTInterpreter interpreter(buffer.data(), size, options);
        TestCommandListener listener;
        interpreter.setCommandListener(&listener);
        
        std::cout << "\nStarting interpreter...\n";
        std::cout << "Initial state: " << executionStateToString(interpreter.getState()) << std::endl;
        
        // Start execution
        bool started = interpreter.start();
        std::cout << "Start result: " << (started ? "SUCCESS" : "FAILED") << std::endl;
        std::cout << "State after start: " << executionStateToString(interpreter.getState()) << std::endl;
        
        // If running, tick a few times
        if (interpreter.getState() == ExecutionState::RUNNING) {
            std::cout << "\nTicking interpreter...\n";
            for (int i = 0; i < 10; ++i) {
                interpreter.tick();
                auto state = interpreter.getState();
                std::cout << "Tick " << i+1 << ": " << executionStateToString(state) << std::endl;
                if (state != ExecutionState::RUNNING) {
                    break;
                }
            }
        }
        
        std::cout << "\nFinal state: " << executionStateToString(interpreter.getState()) << std::endl;
        std::cout << "Total commands: " << listener.commandCount << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "Exception: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}