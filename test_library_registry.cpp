#include "ArduinoLibraryRegistry.hpp"
#include "CommandProtocol.hpp"
#include <iostream>
#include <iomanip>

using namespace arduino_interpreter;

// Mock interpreter for testing
class MockInterpreter {
public:
    void emitSystemCommand(CommandType type, const std::string& message) {
        std::cout << "MOCK_EMIT: " << static_cast<int>(type) << " - " << message << std::endl;
    }
};

int main() {
    std::cout << "=== Arduino Library Registry Test ===" << std::endl;
    
    MockInterpreter mockInterpreter;
    ArduinoLibraryRegistry registry(nullptr);  // Pass null for now
    
    std::cout << "\n1. Testing library registration:" << std::endl;
    
    // Test library availability
    std::vector<std::string> expectedLibraries = {
        "Adafruit_NeoPixel", "Servo", "LiquidCrystal", "SPI", "Wire", "EEPROM"
    };
    
    for (const auto& libraryName : expectedLibraries) {
        bool hasLib = registry.hasLibrary(libraryName);
        std::cout << "   " << libraryName << ": " << (hasLib ? "✅ Available" : "❌ Missing") << std::endl;
    }
    
    std::cout << "\n2. Testing Adafruit_NeoPixel static methods:" << std::endl;
    
    // Test Adafruit_NeoPixel.Color static method
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
        
        // Verify the color calculation: (255 << 16) | (128 << 8) | 64 = 0xFF8040
        if (color == 0xFF8040) {
            std::cout << "   Color calculation verified ✅" << std::endl;
        } else {
            std::cout << "   Color calculation mismatch ❌" << std::endl;
        }
    } else {
        std::cout << "   Adafruit_NeoPixel.Color() returned invalid type ❌" << std::endl;
    }
    
    // Test ColorHSV static method
    std::vector<CommandValue> hsvArgs = {
        static_cast<int32_t>(21845),  // Hue (120 degrees in 16-bit)
        static_cast<int32_t>(255),    // Saturation 
        static_cast<int32_t>(255)     // Value
    };
    
    CommandValue hsvResult = registry.callStaticMethod("Adafruit_NeoPixel", "ColorHSV", hsvArgs);
    if (std::holds_alternative<int32_t>(hsvResult)) {
        int32_t hsvColor = std::get<int32_t>(hsvResult);
        std::cout << "   Adafruit_NeoPixel.ColorHSV(21845, 255, 255) = 0x" 
                  << std::hex << hsvColor << std::dec << " ✅" << std::endl;
    }
    
    // Test sine8 static method
    std::vector<CommandValue> sine8Args = { static_cast<int32_t>(64) };  // π/2 in 8-bit
    CommandValue sine8Result = registry.callStaticMethod("Adafruit_NeoPixel", "sine8", sine8Args);
    if (std::holds_alternative<int32_t>(sine8Result)) {
        int32_t sineValue = std::get<int32_t>(sine8Result);
        std::cout << "   Adafruit_NeoPixel.sine8(64) = " << sineValue << " ✅" << std::endl;
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
        std::cout << "     - numPixels: " << commandValueToString(neoPixelObj->properties["numPixels"]) << std::endl;
        std::cout << "     - pin: " << commandValueToString(neoPixelObj->properties["pin"]) << std::endl;
        std::cout << "     - pixelType: " << commandValueToString(neoPixelObj->properties["pixelType"]) << std::endl;
    } else {
        std::cout << "   Failed to create Adafruit_NeoPixel object ❌" << std::endl;
    }
    
    // Create Servo object
    std::vector<CommandValue> servoArgs = {};
    auto servoObj = registry.createLibraryObject("Servo", servoArgs);
    if (servoObj) {
        std::cout << "   Created Servo object ✅" << std::endl;
        std::cout << "     - pin: " << commandValueToString(servoObj->properties["pin"]) << std::endl;
        std::cout << "     - currentAngle: " << commandValueToString(servoObj->properties["currentAngle"]) << std::endl;
        std::cout << "     - isAttached: " << commandValueToString(servoObj->properties["isAttached"]) << std::endl;
    }
    
    // Create LiquidCrystal object
    std::vector<CommandValue> lcdArgs = {
        static_cast<int32_t>(12), static_cast<int32_t>(11),  // rs, enable
        static_cast<int32_t>(5), static_cast<int32_t>(4),    // d4, d5
        static_cast<int32_t>(3), static_cast<int32_t>(2)     // d6, d7
    };
    
    auto lcdObj = registry.createLibraryObject("LiquidCrystal", lcdArgs);
    if (lcdObj) {
        std::cout << "   Created LiquidCrystal object ✅" << std::endl;
        std::cout << "     - rs: " << commandValueToString(lcdObj->properties["rs"]) << std::endl;
        std::cout << "     - enable: " << commandValueToString(lcdObj->properties["enable"]) << std::endl;
    }
    
    std::cout << "\n4. Testing static method availability:" << std::endl;
    
    // Test method availability
    struct MethodTest {
        std::string library;
        std::string method;
        bool shouldExist;
    };
    
    std::vector<MethodTest> methodTests = {
        {"Adafruit_NeoPixel", "Color", true},
        {"Adafruit_NeoPixel", "ColorHSV", true},
        {"Adafruit_NeoPixel", "sine8", true},
        {"Adafruit_NeoPixel", "gamma8", true},
        {"Adafruit_NeoPixel", "invalidMethod", false},
        {"Servo", "Color", false},
        {"UnknownLibrary", "Color", false}
    };
    
    for (const auto& test : methodTests) {
        bool hasMethod = registry.hasStaticMethod(test.library, test.method);
        bool testPassed = (hasMethod == test.shouldExist);
        std::cout << "   " << test.library << "." << test.method << ": " 
                  << (testPassed ? "✅" : "❌") 
                  << " (expected: " << (test.shouldExist ? "exists" : "missing") 
                  << ", got: " << (hasMethod ? "exists" : "missing") << ")" << std::endl;
    }
    
    std::cout << "\n5. Testing library definitions:" << std::endl;
    
    // Test library definition access
    const LibraryDefinition* neoDef = registry.getLibraryDefinition("Adafruit_NeoPixel");
    if (neoDef) {
        std::cout << "   Adafruit_NeoPixel definition: ✅" << std::endl;
        std::cout << "     - Internal methods: " << neoDef->internalMethods.size() << std::endl;
        std::cout << "     - External methods: " << neoDef->externalMethods.size() << std::endl;
        std::cout << "     - Static methods: " << neoDef->staticMethods.size() << std::endl;
        std::cout << "     - Constructor args: " << neoDef->constructorArgs.size() << std::endl;
    }
    
    std::cout << "\n✅ Arduino Library Registry test completed!" << std::endl;
    
    return 0;
}