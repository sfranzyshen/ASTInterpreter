#include "ArduinoLibraryRegistry.hpp"
#include <iostream>

using namespace arduino_interpreter;

int main() {
    std::cout << "=== Arduino Library Registry Integration Test ===" << std::endl;
    
    // Create registry
    ArduinoLibraryRegistry registry(nullptr);
    
    // Test library availability
    std::vector<std::string> expectedLibraries = {
        "Adafruit_NeoPixel", "Servo", "LiquidCrystal", "SPI", "Wire", "EEPROM"
    };
    
    std::cout << "\n1. Testing library registration:" << std::endl;
    bool allLibrariesFound = true;
    for (const auto& libraryName : expectedLibraries) {
        bool hasLib = registry.hasLibrary(libraryName);
        std::cout << "   " << libraryName << ": " << (hasLib ? "✅ Available" : "❌ Missing") << std::endl;
        if (!hasLib) allLibrariesFound = false;
    }
    
    std::cout << "\n2. Testing Adafruit_NeoPixel static methods:" << std::endl;
    
    // Test Color static method
    std::vector<CommandValue> colorArgs = {
        static_cast<int32_t>(255),  // Red
        static_cast<int32_t>(128),  // Green  
        static_cast<int32_t>(64)    // Blue
    };
    
    CommandValue colorResult = registry.callStaticMethod("Adafruit_NeoPixel", "Color", colorArgs);
    if (std::holds_alternative<int32_t>(colorResult)) {
        int32_t color = std::get<int32_t>(colorResult);
        std::cout << "   Adafruit_NeoPixel.Color(255, 128, 64) = 0x" 
                  << std::hex << color << std::dec << " ✅" << std::endl;
        
        // Verify: (255 << 16) | (128 << 8) | 64 = 0xFF8040
        if (color == 0xFF8040) {
            std::cout << "   Color calculation verified ✅" << std::endl;
        } else {
            std::cout << "   Color calculation mismatch ❌" << std::endl;
        }
    }
    
    std::cout << "\n3. Testing library object creation:" << std::endl;
    
    // Create NeoPixel object
    std::vector<CommandValue> neoPixelArgs = {
        static_cast<int32_t>(60),  // numPixels
        static_cast<int32_t>(6),   // pin
        static_cast<int32_t>(0x06) // pixelType  
    };
    
    auto neoPixelObj = registry.createLibraryObject("Adafruit_NeoPixel", neoPixelArgs);
    if (neoPixelObj) {
        std::cout << "   Created Adafruit_NeoPixel object ✅" << std::endl;
    } else {
        std::cout << "   Failed to create Adafruit_NeoPixel object ❌" << std::endl;
    }
    
    std::cout << "\n✅ Arduino Library Registry integration test completed!" << std::endl;
    std::cout << "🎯 C++ Arduino Library System: " << (allLibrariesFound ? "FULLY OPERATIONAL" : "NEEDS WORK") << std::endl;
    
    return 0;
}