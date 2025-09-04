#include "EnhancedInterpreter.hpp"
#include <iostream>

using namespace arduino_interpreter;

int main() {
    std::cout << "=== Simple Enhanced Member Access Integration Test ===" << std::endl;
    
    // Create enhanced scope manager
    EnhancedScopeManager scopeManager;
    
    std::cout << "1. Testing struct member access integration:" << std::endl;
    
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
    
    std::cout << "\n2. Testing array element access integration:" << std::endl;
    
    // Test setting array elements
    MemberAccessHelper::setArrayElement(&scopeManager, "numbers", 0, int32_t(10));
    MemberAccessHelper::setArrayElement(&scopeManager, "numbers", 1, int32_t(20));
    MemberAccessHelper::setArrayElement(&scopeManager, "numbers", 2, int32_t(30));
    
    // Test getting array elements  
    auto elem0 = MemberAccessHelper::getArrayElement(&scopeManager, "numbers", 0);
    auto elem1 = MemberAccessHelper::getArrayElement(&scopeManager, "numbers", 1);
    auto elem2 = MemberAccessHelper::getArrayElement(&scopeManager, "numbers", 2);
    
    std::cout << "   numbers[0] = " << enhancedCommandValueToString(elem0) << std::endl;
    std::cout << "   numbers[1] = " << enhancedCommandValueToString(elem1) << std::endl;
    std::cout << "   numbers[2] = " << enhancedCommandValueToString(elem2) << std::endl;
    
    std::cout << "\n✅ Simple integration test completed!" << std::endl;
    
    return 0;
}