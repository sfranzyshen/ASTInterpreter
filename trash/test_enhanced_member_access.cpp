#include "EnhancedInterpreter.hpp"
#include <iostream>

using namespace arduino_interpreter;

int main() {
    std::cout << "=== Enhanced Member Access Test ===\n" << std::endl;
    
    // Create enhanced scope manager
    EnhancedScopeManager scopeManager;
    
    std::cout << "1. Testing struct member access:" << std::endl;
    
    // Test setting struct members
    MemberAccessHelper::setMemberValue(&scopeManager, "person", "name", std::string("Arduino"));
    MemberAccessHelper::setMemberValue(&scopeManager, "person", "age", int32_t(25));
    MemberAccessHelper::setMemberValue(&scopeManager, "person", "active", true);
    
    // Test getting struct members
    auto name = MemberAccessHelper::getMemberValue(&scopeManager, "person", "name");
    auto age = MemberAccessHelper::getMemberValue(&scopeManager, "person", "age");
    auto active = MemberAccessHelper::getMemberValue(&scopeManager, "person", "active");
    
    std::cout << "   person.name = " << enhancedCommandValueToString(name) << std::endl;
    std::cout << "   person.age = " << enhancedCommandValueToString(age) << std::endl;
    std::cout << "   person.active = " << enhancedCommandValueToString(active) << std::endl;
    
    // Check if person is now a struct
    auto personVar = scopeManager.getVariable("person");
    if (personVar && personVar->isStruct()) {
        std::cout << "   ✅ person is properly stored as struct" << std::endl;
        auto structPtr = std::get<std::shared_ptr<ArduinoStruct>>(personVar->value);
        std::cout << "   Full struct: " << structPtr->toString() << std::endl;
    } else {
        std::cout << "   ⚠️  person not stored as struct (using compatibility mode)" << std::endl;
    }
    
    std::cout << "\n2. Testing array element access:" << std::endl;
    
    // Test setting array elements
    MemberAccessHelper::setArrayElement(&scopeManager, "numbers", 0, int32_t(10));
    MemberAccessHelper::setArrayElement(&scopeManager, "numbers", 1, int32_t(20));
    MemberAccessHelper::setArrayElement(&scopeManager, "numbers", 2, int32_t(30));
    
    // Test getting array elements  
    auto elem0 = MemberAccessHelper::getArrayElement(&scopeManager, "numbers", 0);
    auto elem1 = MemberAccessHelper::getArrayElement(&scopeManager, "numbers", 1);
    auto elem2 = MemberAccessHelper::getArrayElement(&scopeManager, "numbers", 2);
    auto elem5 = MemberAccessHelper::getArrayElement(&scopeManager, "numbers", 5); // Out of bounds
    
    std::cout << "   numbers[0] = " << enhancedCommandValueToString(elem0) << std::endl;
    std::cout << "   numbers[1] = " << enhancedCommandValueToString(elem1) << std::endl;
    std::cout << "   numbers[2] = " << enhancedCommandValueToString(elem2) << std::endl;
    std::cout << "   numbers[5] = " << enhancedCommandValueToString(elem5) << " (out of bounds)" << std::endl;
    
    // Check if numbers is now an array
    auto numbersVar = scopeManager.getVariable("numbers");
    if (numbersVar && numbersVar->isArray()) {
        std::cout << "   ✅ numbers is properly stored as array" << std::endl;
        auto arrayPtr = std::get<std::shared_ptr<ArduinoArray>>(numbersVar->value);
        std::cout << "   Full array: " << arrayPtr->toString() << std::endl;
    } else {
        std::cout << "   ⚠️  numbers not stored as array (using compatibility mode)" << std::endl;
    }
    
    std::cout << "\n3. Testing mixed access patterns:" << std::endl;
    
    // Test struct with array member
    auto dataArray = createArray("int", {3});
    dataArray->setElement(0, int32_t(100));
    dataArray->setElement(1, int32_t(200));
    dataArray->setElement(2, int32_t(300));
    
    MemberAccessHelper::setMemberValue(&scopeManager, "data", "values", dataArray);
    MemberAccessHelper::setMemberValue(&scopeManager, "data", "count", int32_t(3));
    
    auto values = MemberAccessHelper::getMemberValue(&scopeManager, "data", "values");
    auto count = MemberAccessHelper::getMemberValue(&scopeManager, "data", "count");
    
    std::cout << "   data.values = " << enhancedCommandValueToString(values) << std::endl;
    std::cout << "   data.count = " << enhancedCommandValueToString(count) << std::endl;
    
    std::cout << "\n4. Testing Serial object simulation:" << std::endl;
    
    // Test built-in Serial object
    auto available = MemberAccessHelper::getMemberValue(&scopeManager, "Serial", "available");
    std::cout << "   Serial.available = " << enhancedCommandValueToString(available) << std::endl;
    
    std::cout << "\n5. Debugging scope contents:" << std::endl;
    scopeManager.debugPrintScopes();
    
    std::cout << "\n✅ Enhanced member access test completed!" << std::endl;
    
    return 0;
}