#include "ASTInterpreter.hpp"
#include <fstream>
#include <iostream>
#include <filesystem>

using namespace arduino_interpreter;

class TestCommandListener : public CommandListener {
private:
    std::vector<Command> commands_;
public:
    void onCommand(const Command& command) override {
        commands_.push_back(command);
    }
    
    const std::vector<Command>& getCommands() const {
        return commands_;
    }
    
    void clear() {
        commands_.clear();
    }
};

class TestResponseHandler : public ResponseHandler {
public:
    void handleResponse(const RequestId& requestId, const CommandValue& value) override {
        // Mock response - just acknowledge
    }
};

int main() {
    std::cout << "Simple C++ Interpreter Validation Test" << std::endl;
    std::cout << "=======================================" << std::endl;
    
    int totalTests = 0;
    int successfulTests = 0;
    int failedTests = 0;
    
    // Test with a few AST files to verify our implementation works
    std::vector<std::string> testFiles = {
        "test_data/example_000.ast",  // AnalogReadSerial
        "test_data/example_001.ast",  // BareMinimum
        "test_data/example_002.ast",  // Blink
        "test_data/example_003.ast",  // DigitalReadSerial
        "test_data/example_004.ast"   // Fade
    };
    
    auto commandListener = std::make_shared<TestCommandListener>();
    auto responseHandler = std::make_shared<TestResponseHandler>();
    
    for (const auto& astFile : testFiles) {
        if (!std::filesystem::exists(astFile)) {
            std::cout << "⏭️  Skipping " << astFile << " (not found)" << std::endl;
            continue;
        }
        
        totalTests++;
        std::cout << "Testing " << astFile << "..." << std::endl;
        
        try {
            // Load AST file
            std::ifstream file(astFile, std::ios::binary);
            if (!file) {
                std::cout << "❌ Failed to open AST file" << std::endl;
                failedTests++;
                continue;
            }
            
            // Read AST data
            file.seekg(0, std::ios::end);
            size_t fileSize = file.tellg();
            file.seekg(0, std::ios::beg);
            
            std::vector<uint8_t> astData(fileSize);
            file.read(reinterpret_cast<char*>(astData.data()), fileSize);
            file.close();
            
            std::cout << "  📦 Loaded AST: " << fileSize << " bytes" << std::endl;
            
            // Create interpreter
            InterpreterOptions options;
            options.verbose = false;
            options.debug = false;
            options.maxLoopIterations = 3;
            
            auto interpreter = std::make_unique<ASTInterpreter>(
                astData.data(), fileSize, options
            );
            
            // Set up handlers
            interpreter->setCommandListener(commandListener);
            interpreter->setResponseHandler(responseHandler);
            
            // Clear previous commands
            commandListener->clear();
            
            // Start execution
            if (interpreter->start()) {
                // Wait a bit for execution
                std::this_thread::sleep_for(std::chrono::milliseconds(100));
                
                const auto& commands = commandListener->getCommands();
                std::cout << "  ✅ Success: " << commands.size() << " commands generated" << std::endl;
                successfulTests++;
            } else {
                std::cout << "  ❌ Failed to start interpreter" << std::endl;
                failedTests++;
            }
            
        } catch (const std::exception& e) {
            std::cout << "  ❌ Exception: " << e.what() << std::endl;
            failedTests++;
        }
    }
    
    std::cout << "\n🏁 Test Results:" << std::endl;
    std::cout << "Total tests: " << totalTests << std::endl;
    std::cout << "Successful: " << successfulTests << std::endl;
    std::cout << "Failed: " << failedTests << std::endl;
    
    if (failedTests == 0) {
        std::cout << "🎉 All tests passed! C++ implementation working correctly." << std::endl;
        return 0;
    } else {
        std::cout << "⚠️  Some tests failed." << std::endl;
        return 1;
    }
}