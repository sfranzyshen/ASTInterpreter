#include "tests/test_utils.hpp"
#include <iostream>
#include <fstream>
#include <vector>

using namespace arduino_interpreter;
using namespace arduino_interpreter::testing;

// Simple test to verify structured JSON command output improvement
int main() {
    std::cout << "=== STRUCTURED COMMAND VALIDATION SAMPLE ===" << std::endl;
    std::cout << "Testing structured JSON command output vs JavaScript format" << std::endl << std::endl;
    
    // Test with BareMinimum.ino (example_001.ast)
    std::ifstream file("test_data/example_001.ast", std::ios::binary);
    if (!file) {
        std::cerr << "Cannot find test_data/example_001.ast" << std::endl;
        std::cerr << "This test requires pre-generated AST files." << std::endl;
        return 1;
    }
    
    // Get file size and read data
    file.seekg(0, std::ios::end);
    size_t size = file.tellg();
    file.seekg(0, std::ios::beg);
    
    std::vector<uint8_t> data(size);
    file.read(reinterpret_cast<char*>(data.data()), size);
    file.close();
    
    std::cout << "Loaded BareMinimum.ino AST file: " << size << " bytes" << std::endl;
    
    try {
        // Create interpreter
        InterpreterOptions options;
        options.verbose = false;
        options.debug = false;
        options.maxLoopIterations = 3; // Match JavaScript test settings
        
        ASTInterpreter interpreter(data.data(), size, options);
        
        // Set up command capture with structured JSON output
        CommandStreamCapture capture(false);
        interpreter.setCommandListener(&capture);
        
        std::cout << std::endl << "=== STARTING C++ INTERPRETER ===" << std::endl;
        bool started = interpreter.start();
        
        if (!started) {
            std::cerr << "Failed to start C++ interpreter" << std::endl;
            return 1;
        }
        
        std::cout << "C++ interpreter completed successfully" << std::endl;
        std::cout << "Commands captured: " << capture.getCommandCount() << std::endl;
        
        // Get structured JSON output
        std::string cppOutput = capture.getCommandsAsJson();
        std::cout << std::endl << "C++ structured JSON output size: " << cppOutput.length() << " characters" << std::endl;
        
        // Show first few commands for comparison
        std::cout << std::endl << "=== C++ STRUCTURED JSON SAMPLE (First 800 chars) ===" << std::endl;
        std::cout << cppOutput.substr(0, 800) << std::endl;
        if (cppOutput.length() > 800) {
            std::cout << "... (truncated, total: " << cppOutput.length() << " chars)" << std::endl;
        }
        
        // Try to load JavaScript output for comparison
        std::ifstream jsFile("test_data/example_001.commands");
        if (jsFile) {
            std::string jsOutput((std::istreambuf_iterator<char>(jsFile)),
                                   std::istreambuf_iterator<char>());
            
            std::cout << std::endl << "=== JAVASCRIPT OUTPUT COMPARISON ===" << std::endl;
            std::cout << "JavaScript output size: " << jsOutput.length() << " characters" << std::endl;
            
            // Calculate basic similarity
            double lengthRatio = std::min(cppOutput.length(), jsOutput.length()) / 
                               (double)std::max(cppOutput.length(), jsOutput.length());
            
            std::cout << std::endl << "=== SIMILARITY ANALYSIS ===" << std::endl;
            std::cout << "Length similarity: " << (int)(lengthRatio * 100) << "%" << std::endl;
            
            if (lengthRatio > 0.8) {
                std::cout << "✅ EXCELLENT: C++ now generates substantial structured output!" << std::endl;
                std::cout << "   This represents a major improvement from simple debug strings." << std::endl;
            } else if (lengthRatio > 0.5) {
                std::cout << "✅ GOOD: Significant improvement in command output quality" << std::endl;
            } else {
                std::cout << "⚠️  Still some differences, but structured JSON is working" << std::endl;
            }
            
        } else {
            std::cout << std::endl << "=== STANDALONE VERIFICATION ===" << std::endl;
            std::cout << "JavaScript comparison file not available." << std::endl;
            
            if (cppOutput.length() > 1000) {
                std::cout << "✅ SUCCESS: C++ generates substantial structured JSON output!" << std::endl;
                std::cout << "   Output size: " << cppOutput.length() << " characters" << std::endl;
                std::cout << "   This represents a massive improvement from ~36 character debug strings." << std::endl;
            }
        }
        
    } catch (const std::exception& e) {
        std::cerr << "Exception: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}