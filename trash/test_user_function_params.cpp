#include "ASTInterpreter.hpp"
#include "CompactAST.hpp"
#include <iostream>
#include <memory>

// Test user-defined function with parameters
const unsigned char testUserFunctionAST[] = {
    0x50, 0x54, 0x53, 0x41,  // Magic number
    0x01, 0x00,              // Version
    0x00, 0x00, 0x00, 0x20,  // Size (32 bytes)
    // Simple function: int add(int a, int b) { return a + b; }
    // Program node
    0x01,                    // PROGRAM
    0x02,                    // 2 children
    // Function definition node
    0x12,                    // FUNC_DEF
    // Return type
    0x2A,                    // TYPE_NODE
    0x00,                    // INT type
    // Function name
    0x23,                    // IDENTIFIER
    0x03, 'a', 'd', 'd',     // name "add"
    // Parameters
    0x03,                    // 3 parameters total
    // Param 1
    0x34,                    // PARAM_NODE
    0x2A,                    // TYPE_NODE 
    0x00,                    // INT type
    0x23,                    // IDENTIFIER
    0x01, 'a',               // name "a"
    // Param 2
    0x34,                    // PARAM_NODE
    0x2A,                    // TYPE_NODE
    0x00,                    // INT type
    0x23,                    // IDENTIFIER
    0x01, 'b',               // name "b"
    // Function body - return statement
    0x0C,                    // RETURN_STATEMENT
    0x15,                    // BINARY_OP
    0x00,                    // ADD operator
    0x23,                    // IDENTIFIER "a"
    0x01, 'a',
    0x23,                    // IDENTIFIER "b"
    0x01, 'b'
};

class TestCommandListener : public arduino_interpreter::CommandListener {
public:
    void onCommand(const arduino_interpreter::Command& command) override {
        std::cout << "Command received: " << (int)command.type << std::endl;
    }
};

class TestResponseHandler : public arduino_interpreter::ResponseHandler {
public:
    void handleResponse(const arduino_interpreter::RequestId& requestId, 
                       const arduino_interpreter::CommandValue& value) override {
        // Mock response handler
    }
};

int main() {
    std::cout << "Testing user-defined function parameters..." << std::endl;
    
    try {
        // Create interpreter
        arduino_interpreter::InterpreterOptions options;
        options.verbose = true;
        options.debug = true;
        
        auto interpreter = std::make_unique<arduino_interpreter::ASTInterpreter>(
            testUserFunctionAST, sizeof(testUserFunctionAST), options
        );
        
        // Set up handlers
        auto commandListener = std::make_shared<TestCommandListener>();
        auto responseHandler = std::make_shared<TestResponseHandler>();
        
        interpreter->setCommandListener(commandListener);
        interpreter->setResponseHandler(responseHandler);
        
        // Start execution
        if (interpreter->start()) {
            std::cout << "✅ User function parameter test completed successfully" << std::endl;
            return 0;
        } else {
            std::cout << "❌ Failed to start interpreter" << std::endl;
            return 1;
        }
        
    } catch (const std::exception& e) {
        std::cout << "❌ Exception: " << e.what() << std::endl;
        return 1;
    }
}