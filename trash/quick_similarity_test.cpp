#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>

// Quick similarity test for first 10 examples
int main() {
    std::cout << "=== Quick Similarity Test (First 10 Examples) ===" << std::endl;
    
    int totalSimilarity = 0;
    int validTests = 0;
    
    for (int i = 0; i < 10; i++) {
        std::string prefix = i < 10 ? "00" : (i < 100 ? "0" : "");
        std::string base = "/mnt/d/Devel/ASTInterpreter_Arduino/test_data/example_" + prefix + std::to_string(i);
        std::string astPath = base + ".ast";
        std::string jsPath = base + ".commands";
        std::string metaPath = base + ".meta";
        
        // Get test name
        std::ifstream metaFile(metaPath);
        std::string testName = "example_" + std::to_string(i);
        if (metaFile.is_open()) {
            std::string line;
            if (std::getline(metaFile, line) && line.substr(0, 5) == "name=") {
                testName = line.substr(5);
            }
            metaFile.close();
        }
        
        // Count JavaScript commands
        int jsCommands = 0;
        std::ifstream jsFile(jsPath);
        if (jsFile.is_open()) {
            std::string line;
            while (std::getline(jsFile, line)) {
                if (line.find("\"type\":") != std::string::npos) {
                    jsCommands++;
                }
            }
            jsFile.close();
        }
        
        // Count C++ commands
        int cppCommands = 0;
        std::string command = "./basic_interpreter_example " + astPath + " 2>/dev/null | grep -c '^\\[COMMAND\\]'";
        FILE* pipe = popen(command.c_str(), "r");
        if (pipe) {
            char buffer[128];
            if (fgets(buffer, sizeof(buffer), pipe) != nullptr) {
                cppCommands = std::atoi(buffer);
            }
            pclose(pipe);
        }
        
        if (jsCommands > 0 && cppCommands > 0) {
            int similarity = std::min(cppCommands, jsCommands) * 100 / std::max(cppCommands, jsCommands);
            std::cout << "[" << (i+1) << "/10] " << testName << ": " 
                     << cppCommands << " C++ vs " << jsCommands << " JS commands = " 
                     << similarity << "% similarity" << std::endl;
            totalSimilarity += similarity;
            validTests++;
        }
    }
    
    if (validTests > 0) {
        std::cout << "Average Similarity: " << (totalSimilarity / validTests) << "%" << std::endl;
    }
    
    return 0;
}
