# Next Session Instructions - Cross-Platform Parity Project

## 🎉 CURRENT STATUS: MAJOR BREAKTHROUGH ACHIEVED
**3 EXACT MATCHES** out of 135 tests (Tests 1, 2, 3 are 100% identical)

## IMMEDIATE NEXT STEPS

### 1. Continue Systematic Test Fixing
Start with Test 4 using the established methodology:

```bash
# Run single test comparison
./single_test_compare 4

# Identify field ordering issues
# Implement fixes in src/cpp/FlexibleCommand.hpp
# Rebuild and validate until perfect match achieved
```

### 2. Key Tools Available
- `single_test_compare <test_number>` - Primary debugging tool
- `debug_difference.cpp` - Character-level analysis
- `debug_normalized.cpp` - Full normalization testing

### 3. Proven Methodology
1. Run single test comparison to identify differences
2. Analyze first character difference to identify field ordering issue
3. Add command-type-specific ordering to `FlexibleCommand.hpp`
4. Rebuild with: `g++ -std=c++17 -I. -Ilibs/CompactAST/src <tool>.cpp libarduino_ast_interpreter.a -o <tool>`
5. Validate exact match before proceeding to next test

## TECHNICAL PATTERNS ESTABLISHED

### Field Ordering Rules (in FlexibleCommand.hpp)
```cpp
if (cmdType == "FUNCTION_CALL") {
    // Function-specific patterns
    if (functionName == "Serial.begin") {
        jsOrder = {"type", "function", "arguments", "baudRate", "timestamp", "message"};
    } else if (functionName == "Serial.println") {
        jsOrder = {"type", "function", "arguments", "data", "timestamp", "message"};
    } else {
        jsOrder = {"type", "function", "message", "iteration", "completed", "timestamp"};
    }
} else if (cmdType == "VAR_SET") {
    jsOrder = {"type", "variable", "value", "timestamp"};
} else if (cmdType == "PIN_MODE") {
    jsOrder = {"type", "pin", "mode", "timestamp"};
} else if (cmdType == "DIGITAL_READ_REQUEST") {
    jsOrder = {"type", "pin", "requestId", "timestamp"};
} else if (cmdType == "DELAY") {
    jsOrder = {"type", "duration", "actualDelay", "timestamp"};
}
```

### Arguments Array Formatting
Already fixed to use JavaScript pretty-print style with newlines and indentation.

## SUCCESS VALIDATION
When a test achieves perfect match, you'll see:
```
🎉 PERFECT MATCH! Test X is now 100% IDENTICAL!
```

## FILES TO CONTINUE MODIFYING
- `src/cpp/FlexibleCommand.hpp` - Add new command-type field ordering as discovered
- `src/cpp/ASTInterpreter.cpp` - Address any command interpretation differences
- Update documentation when significant milestones achieved

## PROGRESS TRACKING
Keep detailed records of:
- Each exact match achieved
- New command types discovered and their field ordering
- Any command interpretation fixes needed
- Version updates at major milestones

## GOAL
Achieve **135/135 exact matches** (100% cross-platform parity) by systematically applying the established methodology to each remaining test case.

---
**Last Updated**: September 10, 2025  
**Current Exact Matches**: 3/135 (Tests 1, 2, 3)  
**Next Target**: Test 4