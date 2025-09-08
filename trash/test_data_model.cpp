#include "ArduinoDataTypes.hpp"
#include <iostream>

int main() {
    std::cout << "=== Arduino Data Model Classes Test ===\n" << std::endl;
    
    using namespace arduino_interpreter;
    
    // Test ArduinoStruct
    std::cout << "1. Testing ArduinoStruct:" << std::endl;
    auto person = createStruct("Person");
    person->setMember("name", std::string("Arduino"));
    person->setMember("age", int32_t(25));
    person->setMember("active", true);
    
    std::cout << "   Struct: " << person->toString() << std::endl;
    std::cout << "   Name: " << enhancedCommandValueToString(person->getMember("name")) << std::endl;
    std::cout << "   Age: " << enhancedCommandValueToString(person->getMember("age")) << std::endl;
    std::cout << "   Active: " << enhancedCommandValueToString(person->getMember("active")) << std::endl;
    std::cout << "   Has 'email': " << (person->hasMember("email") ? "true" : "false") << std::endl;
    
    // Test ArduinoArray
    std::cout << "\n2. Testing ArduinoArray:" << std::endl;
    auto numbers = createArray("int", {5});  // int[5]
    numbers->setElement(0, int32_t(10));
    numbers->setElement(1, int32_t(20));
    numbers->setElement(2, int32_t(30));
    
    std::cout << "   Array: " << numbers->toString() << std::endl;
    std::cout << "   Element[0]: " << enhancedCommandValueToString(numbers->getElement(0)) << std::endl;
    std::cout << "   Element[1]: " << enhancedCommandValueToString(numbers->getElement(1)) << std::endl;
    std::cout << "   Array size: " << numbers->size() << std::endl;
    
    // Test multi-dimensional array
    auto matrix = createArray("int", {2, 3});  // int[2][3]
    matrix->setElement({0, 0}, int32_t(1));
    matrix->setElement({0, 1}, int32_t(2));
    matrix->setElement({1, 2}, int32_t(6));
    
    std::cout << "   Matrix: " << matrix->toString() << std::endl;
    std::cout << "   Matrix[0][0]: " << enhancedCommandValueToString(matrix->getElement({0, 0})) << std::endl;
    std::cout << "   Matrix[1][2]: " << enhancedCommandValueToString(matrix->getElement({1, 2})) << std::endl;
    
    // Test ArduinoString
    std::cout << "\n3. Testing ArduinoString:" << std::endl;
    auto str = createString("Hello Arduino");
    std::cout << "   String: " << str->toString() << std::endl;
    std::cout << "   Length: " << str->length() << std::endl;
    std::cout << "   Substring(0, 5): \"" << str->substring(0, 5).toString() << "\"" << std::endl;
    std::cout << "   Index of 'Arduino': " << str->indexOf("Arduino") << std::endl;
    std::cout << "   Starts with 'Hello': " << (str->startsWith("Hello") ? "true" : "false") << std::endl;
    std::cout << "   Upper case: \"" << str->toUpperCase().toString() << "\"" << std::endl;
    
    // Test concatenation
    auto greeting = *str + ArduinoString(" World!");
    std::cout << "   Concatenated: \"" << greeting.toString() << "\"" << std::endl;
    
    // Test type conversion utilities
    std::cout << "\n4. Testing Type Utilities:" << std::endl;
    EnhancedCommandValue testValue = person;
    std::cout << "   Is struct: " << (isStructType(testValue) ? "true" : "false") << std::endl;
    std::cout << "   Is array: " << (isArrayType(testValue) ? "true" : "false") << std::endl;
    std::cout << "   Is string: " << (isStringType(testValue) ? "true" : "false") << std::endl;
    
    EnhancedCommandValue arrayValue = numbers;
    std::cout << "   Array is array: " << (isArrayType(arrayValue) ? "true" : "false") << std::endl;
    std::cout << "   Array is struct: " << (isStructType(arrayValue) ? "true" : "false") << std::endl;
    
    // Test upgrade/downgrade functions
    std::cout << "\n5. Testing Value Conversion:" << std::endl;
    std::variant<std::monostate, bool, int32_t, double, std::string> basicValue = int32_t(42);
    auto enhanced = upgradeCommandValue(basicValue);
    auto downgraded = downgradeCommandValue(enhanced);
    std::cout << "   Basic → Enhanced → Basic: " << std::get<int32_t>(downgraded) << std::endl;
    
    // Test complex type downgrade
    auto downgradedStruct = downgradeCommandValue(person);
    std::cout << "   Struct downgraded to: " << std::get<std::string>(downgradedStruct) << std::endl;
    
    std::cout << "\n✅ All data model tests completed successfully!" << std::endl;
    
    return 0;
}