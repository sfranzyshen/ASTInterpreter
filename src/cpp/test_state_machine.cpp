/**
 * Simple test for C++ interpreter state machine functionality
 */

#include "ASTInterpreter.hpp"
#include "CommandProtocol.hpp"
#include <iostream>
#include <memory>

using namespace arduino_interpreter;

class TestCommandListener : public CommandListener {
public:
    void onCommand(const Command& command) override {
        std::cout << "Command: " << command.toString() << std::endl;
        
        // Simulate mock responses for external data functions
        if (command.getTypeString() == "ANALOG_READ_REQUEST") {
            // Simulate analog read response after a delay
            auto requestId = command.getValue("requestId");
            // For testing, we'll just print this out - in real usage, 
            // the parent application would call resumeWithValue()
            std::cout << "Mock response needed for: " << commandValueToString(requestId) << std::endl;
        }
    }
    
    void onError(const std::string& error) override {
        std::cout << "Error: " << error << std::endl;
    }
};

int main() {
    std::cout << "C++ State Machine Test\n";
    std::cout << "======================\n\n";
    
    try {
        // Create a null AST for testing basic functionality
        arduino_ast::ASTNodePtr nullAst = nullptr;
        
        InterpreterOptions options;
        options.verbose = true;
        options.debug = true;
        options.maxLoopIterations = 3;
        
        ASTInterpreter interpreter(std::move(nullAst), options);
        TestCommandListener listener;
        interpreter.setCommandListener(&listener);
        
        std::cout << "Testing interpreter state transitions...\n";
        
        // Test state transitions
        std::cout << "Initial state: " << executionStateToString(interpreter.getState()) << std::endl;
        
        // Test start (should fail with null AST but show state changes)
        std::cout << "\nTesting start()...\n";
        bool started = interpreter.start();
        std::cout << "Start result: " << (started ? "success" : "failed") << std::endl;
        std::cout << "State after start: " << executionStateToString(interpreter.getState()) << std::endl;
        
        // Test tick method
        std::cout << "\nTesting tick()...\n";
        interpreter.tick();
        std::cout << "State after tick: " << executionStateToString(interpreter.getState()) << std::endl;
        
        // Test resumeWithValue (should fail when not waiting)
        std::cout << "\nTesting resumeWithValue() when not waiting...\n";
        bool resumed = interpreter.resumeWithValue("test_123", static_cast<int32_t>(42));
        std::cout << "Resume result: " << (resumed ? "success" : "failed") << std::endl;
        std::cout << "State after resume attempt: " << executionStateToString(interpreter.getState()) << std::endl;
        
        // Test pause/resume functionality
        std::cout << "\nTesting pause()...\n";
        interpreter.pause();
        std::cout << "State after pause: " << executionStateToString(interpreter.getState()) << std::endl;
        
        std::cout << "\nTesting resume()...\n";
        interpreter.resume();
        std::cout << "State after resume: " << executionStateToString(interpreter.getState()) << std::endl;
        
        // Test stop
        std::cout << "\nTesting stop()...\n";
        interpreter.stop();
        std::cout << "Final state: " << executionStateToString(interpreter.getState()) << std::endl;
        
        std::cout << "\nState machine test completed successfully!\n";
        
    } catch (const std::exception& e) {
        std::cerr << "Test failed with exception: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}