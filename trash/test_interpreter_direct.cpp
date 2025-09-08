/**
 * Direct C++ interpreter test with state machine validation
 */

#include <iostream>
#include <fstream>
#include <vector>
#include "ASTInterpreter.hpp"
#include "CommandProtocol.hpp"

using namespace arduino_interpreter;

class TestCommandListener : public CommandListener {
public:
    int commandCount = 0;
    std::vector<std::string> commands;
    
    void onCommand(const Command& command) override {
        commandCount++;
        std::string cmdStr = "Command " + std::to_string(commandCount) + ": " + command.toString();
        commands.push_back(cmdStr);
        std::cout << cmdStr << std::endl;
    }
    
    void onError(const std::string& error) override {
        std::cout << "ERROR: " << error << std::endl;
    }
};

class TestResponseHandler : public ResponseHandler {
public:
    void handleResponse(const std::string& requestId, const CommandValue& value) override {
        std::cout << "Response for " << requestId << ": ";
        // Print value based on type
        std::visit([](const auto& val) {
            using T = std::decay_t<decltype(val)>;
            if constexpr (std::is_same_v<T, std::monostate>) {
                std::cout << "(void)";
            } else if constexpr (std::is_same_v<T, bool>) {
                std::cout << (val ? "true" : "false");
            } else {
                std::cout << val;
            }
        }, value);
        std::cout << std::endl;
    }
};

int main(int argc, char* argv[]) {
    if (argc != 2) {
        std::cout << "Usage: " << argv[0] << " <ast_file>" << std::endl;
        return 1;
    }
    
    std::cout << "🚀 C++ Interpreter Direct Test" << std::endl;
    std::cout << "Loading: " << argv[1] << std::endl << std::endl;
    
    try {
        // Load AST file
        std::ifstream file(argv[1], std::ios::binary);
        if (!file) {
            std::cout << "❌ ERROR: Cannot open file " << argv[1] << std::endl;
            return 1;
        }
        
        // Read file into buffer
        std::vector<uint8_t> buffer((std::istreambuf_iterator<char>(file)),
                                   std::istreambuf_iterator<char>());
        file.close();
        
        std::cout << "📁 File loaded: " << buffer.size() << " bytes" << std::endl;
        
        // Create interpreter
        ASTInterpreterOptions options;
        options.verbose = false;
        options.debug = true;
        options.maxLoopIterations = 3;
        options.stepDelay = 0;
        
        ASTInterpreter interpreter(buffer.data(), buffer.size(), options);
        
        // Set up listeners
        TestCommandListener listener;
        TestResponseHandler responseHandler;
        interpreter.setCommandListener(&listener);
        interpreter.setResponseHandler(&responseHandler);
        
        std::cout << "⚡ Starting interpreter..." << std::endl;
        std::cout << "Initial state: " << executionStateToString(interpreter.getState()) << std::endl;
        
        // Start execution
        bool started = interpreter.start();
        std::cout << "Start result: " << (started ? "SUCCESS" : "FAILED") << std::endl;
        std::cout << "State after start: " << executionStateToString(interpreter.getState()) << std::endl;
        
        // Simulate some ticks to test state machine
        if (interpreter.getState() == ExecutionState::RUNNING) {
            std::cout << "\n🔄 Ticking interpreter..." << std::endl;
            for (int i = 0; i < 10; ++i) {
                interpreter.tick();
                auto state = interpreter.getState();
                std::cout << "Tick " << (i+1) << ": " << executionStateToString(state) << std::endl;
                
                // If waiting for response, simulate providing one
                if (state == ExecutionState::WAITING_FOR_RESPONSE) {
                    std::cout << "📡 Simulating response (value: 512)..." << std::endl;
                    interpreter.resumeWithValue("mock_request", CommandValue(512));
                }
                
                if (state != ExecutionState::RUNNING && state != ExecutionState::WAITING_FOR_RESPONSE) {
                    break;
                }
            }
        }
        
        std::cout << "\n📊 Final Results:" << std::endl;
        std::cout << "   Final state: " << executionStateToString(interpreter.getState()) << std::endl;
        std::cout << "   Total commands: " << listener.commandCount << std::endl;
        
        if (listener.commandCount > 0) {
            std::cout << "\n📝 Commands emitted:" << std::endl;
            for (const auto& cmd : listener.commands) {
                std::cout << "   " << cmd << std::endl;
            }
        }
        
        return 0;
        
    } catch (const std::exception& e) {
        std::cout << "❌ ERROR: " << e.what() << std::endl;
        return 1;
    }
}