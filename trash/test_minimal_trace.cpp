/**
 * Test C++ execution trace for minimal test case
 */

#include "ASTInterpreter.hpp"
#include "ExecutionTracer.hpp"
#include <iostream>
#include <fstream>
#include <vector>

using namespace arduino_interpreter;

class TraceCommandListener : public CommandListener {
private:
    int& commandCount_;
    
public:
    TraceCommandListener(int& commandCount) : commandCount_(commandCount) {}
    
    void onCommand(const Command& command) override {
        commandCount_++;
        std::cout << "C++ COMMAND: " << command.toString() << std::endl;
        TRACE_COMMAND(commandTypeToString(command.type), command.toString());
    }
    
    void onError(const std::string& error) override {
        std::cout << "C++ ERROR: " << error << std::endl;
        TRACE("ERROR", error);
    }
};

int main() {
    std::cout << "=== C++ Execution Trace for Minimal Test ===" << std::endl;
    
    try {
        // Read binary AST file
        std::ifstream file("minimal_test.ast", std::ios::binary);
        if (!file.is_open()) {
            std::cerr << "ERROR: Could not open minimal_test.ast" << std::endl;
            return 1;
        }
        
        // Get file size
        file.seekg(0, std::ios::end);
        size_t fileSize = file.tellg();
        file.seekg(0, std::ios::beg);
        
        // Read file data
        std::vector<uint8_t> astData(fileSize);
        file.read(reinterpret_cast<char*>(astData.data()), fileSize);
        file.close();
        
        std::cout << "Loaded AST file: " << fileSize << " bytes" << std::endl;
        
        // Enable execution tracing
        TRACE_ENABLE();
        TRACE_CONTEXT("MinimalTest");
        TRACE_CLEAR();
        
        std::cout << "\n=== Creating C++ Interpreter ===" << std::endl;
        
        // Create interpreter from binary AST
        InterpreterOptions options;
        options.maxLoopIterations = 3;
        options.debug = false;
        options.verbose = false;
        
        ASTInterpreter interpreter(astData.data(), fileSize, options);
        
        std::cout << "\n=== Starting Execution ===" << std::endl;
        
        // Track command generation
        int commandCount = 0;
        TraceCommandListener listener(commandCount);
        interpreter.setCommandListener(&listener);
        
        // Start execution
        bool startResult = interpreter.start();
        if (!startResult) {
            std::cerr << "ERROR: Failed to start interpreter" << std::endl;
            TRACE_SAVE("cpp_execution_trace_error.txt");
            return 1;
        }
        
        std::cout << "\n=== Execution Results ===" << std::endl;
        std::cout << "Commands generated: " << commandCount << std::endl;
        
        // Save execution trace
        TRACE_SAVE("cpp_execution_trace.txt");
        std::cout << "C++ trace saved to: cpp_execution_trace.txt" << std::endl;
        
        // Print trace summary
        TRACE_SUMMARY();
        
        return 0;
        
    } catch (const std::exception& e) {
        std::cerr << "Exception: " << e.what() << std::endl;
        TRACE_SAVE("cpp_execution_trace_exception.txt");
        return 1;
    }
}