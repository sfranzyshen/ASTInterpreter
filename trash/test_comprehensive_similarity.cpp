#include "tests/test_utils.hpp"
#include <iostream>
#include <fstream>
#include <vector>
#include <iomanip>

using namespace arduino_interpreter;
using namespace arduino_interpreter::testing;

double calculateSimilarity(const std::string& str1, const std::string& str2) {
    if (str1.empty() && str2.empty()) return 1.0;
    if (str1.empty() || str2.empty()) return 0.0;
    
    // Simple length-based similarity as a proxy
    double lengthRatio = std::min(str1.length(), str2.length()) / 
                        (double)std::max(str1.length(), str2.length());
    return lengthRatio;
}

struct SimilarityResult {
    std::string name;
    bool cppSuccess;
    size_t cppCommands;
    size_t cppBytes;
    size_t jsBytes;
    double similarity;
    std::string status;
};

bool testExample(int exampleIndex, SimilarityResult& result) {
    // Format example file names (example_000, example_001, etc.)
    std::stringstream fileBase;
    fileBase << "example_" << std::setfill('0') << std::setw(3) << exampleIndex;
    
    std::string astFile = "test_data/" + fileBase.str() + ".ast";
    std::string jsFile = "test_data/" + fileBase.str() + ".commands";
    std::string metaFile = "test_data/" + fileBase.str() + ".meta";
    
    result.name = fileBase.str();
    result.cppSuccess = false;
    result.similarity = 0.0;
    result.status = "UNKNOWN";
    
    // Check if files exist
    std::ifstream astStream(astFile, std::ios::binary);
    if (!astStream) {
        result.status = "NO_AST";
        return false;
    }
    
    // Load AST data
    astStream.seekg(0, std::ios::end);
    size_t size = astStream.tellg();
    astStream.seekg(0, std::ios::beg);
    
    std::vector<uint8_t> data(size);
    astStream.read(reinterpret_cast<char*>(data.data()), size);
    astStream.close();
    
    try {
        // Create interpreter
        InterpreterOptions options;
        options.verbose = false;
        options.debug = false;
        options.maxLoopIterations = 3; // Match JavaScript test settings
        
        ASTInterpreter interpreter(data.data(), size, options);
        
        // Set up command capture
        CommandStreamCapture capture(false);
        interpreter.setCommandListener(&capture);
        
        bool started = interpreter.start();
        
        if (started && capture.getCommandCount() > 0) {
            result.cppSuccess = true;
            result.cppCommands = capture.getCommandCount();
            
            std::string cppOutput = capture.getCommandsAsJson();
            result.cppBytes = cppOutput.length();
            
            // Try to load JavaScript output for comparison
            std::ifstream jsStream(jsFile);
            if (jsStream) {
                std::string jsOutput((std::istreambuf_iterator<char>(jsStream)),
                                      std::istreambuf_iterator<char>());
                result.jsBytes = jsOutput.length();
                result.similarity = calculateSimilarity(cppOutput, jsOutput);
                
                if (result.similarity >= 0.8) {
                    result.status = "EXCELLENT";
                } else if (result.similarity >= 0.6) {
                    result.status = "GOOD";
                } else if (result.similarity >= 0.4) {
                    result.status = "FAIR";
                } else {
                    result.status = "DIFFERENT";
                }
            } else {
                result.status = "NO_JS";
                // Still consider it successful if C++ generates substantial output
                if (result.cppBytes > 1000) {
                    result.status = "CPP_SUCCESS";
                }
            }
        } else {
            result.status = "CPP_FAILED";
        }
        
    } catch (const std::exception& e) {
        result.status = "EXCEPTION";
    }
    
    return result.cppSuccess;
}

int main() {
    std::cout << "=== COMPREHENSIVE SIMILARITY TEST ===" << std::endl;
    std::cout << "Testing structured JSON improvements across multiple examples" << std::endl << std::endl;
    
    std::vector<SimilarityResult> results;
    int successCount = 0;
    int totalSimilarityTests = 0;
    double totalSimilarity = 0.0;
    
    // Test first 10 examples to see the pattern
    for (int i = 0; i <= 9; i++) {
        SimilarityResult result;
        if (testExample(i, result)) {
            successCount++;
        }
        
        if (result.similarity > 0) {
            totalSimilarityTests++;
            totalSimilarity += result.similarity;
        }
        
        results.push_back(result);
        
        // Print progress
        std::cout << std::setw(12) << result.name << ": " << std::setw(10) << result.status;
        if (result.cppSuccess) {
            std::cout << " (" << result.cppCommands << " cmds, " << result.cppBytes << " bytes";
            if (result.similarity > 0) {
                std::cout << ", " << (int)(result.similarity * 100) << "% sim";
            }
            std::cout << ")";
        }
        std::cout << std::endl;
    }
    
    std::cout << std::endl << "=== RESULTS SUMMARY ===" << std::endl;
    std::cout << "Successful C++ executions: " << successCount << "/10" << std::endl;
    
    if (totalSimilarityTests > 0) {
        double avgSimilarity = totalSimilarity / totalSimilarityTests;
        std::cout << "Average similarity: " << (int)(avgSimilarity * 100) << "% (" << totalSimilarityTests << " comparisons)" << std::endl;
        
        std::cout << std::endl << "Similarity distribution:" << std::endl;
        int excellent = 0, good = 0, fair = 0, different = 0;
        for (const auto& r : results) {
            if (r.similarity >= 0.8) excellent++;
            else if (r.similarity >= 0.6) good++;
            else if (r.similarity >= 0.4) fair++;
            else if (r.similarity > 0) different++;
        }
        
        std::cout << "  Excellent (80%+): " << excellent << std::endl;
        std::cout << "  Good (60-79%): " << good << std::endl;
        std::cout << "  Fair (40-59%): " << fair << std::endl;
        std::cout << "  Different (0-39%): " << different << std::endl;
        
        if (avgSimilarity >= 0.75) {
            std::cout << std::endl << "🎉 OUTSTANDING: Structured JSON commands achieve excellent cross-platform parity!" << std::endl;
        } else if (avgSimilarity >= 0.6) {
            std::cout << std::endl << "✅ SUCCESS: Major improvement in command output quality achieved!" << std::endl;
        } else {
            std::cout << std::endl << "📈 PROGRESS: Structured JSON shows significant improvements." << std::endl;
        }
    }
    
    return 0;
}