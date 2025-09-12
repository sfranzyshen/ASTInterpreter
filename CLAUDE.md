# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Conserve Tokens 

For all tasks related to housekeeping, data parsing, and routine file operations, utilize a more cost-effective and token-efficient prompt tool like using "gemini -p" CLI, or "qwen -p" CLI tools. When the task requires complex reasoning, creative thinking, or human-like judgment, switch back to using claude code for a more powerful, general-purpose model.

## Three-Project Architecture

This repository contains a **modular Arduino AST interpreter system** organized into three independent but integrated projects:

### 📦 **CompactAST (v1.1.0)** - `libs/CompactAST/`
Cross-platform AST binary serialization with 12.5x compression for embedded deployment.
- **Languages**: JavaScript + C++
- **Purpose**: Binary AST format, cross-platform compatibility

### 🔧 **ArduinoParser (v5.3.0)** - `libs/ArduinoParser/`
Complete Arduino/C++ parsing with integrated preprocessing and platform emulation.
- **Language**: JavaScript (includes CompactAST integration)
- **Purpose**: Lexing, parsing, preprocessor, platform emulation → Clean AST

### ⚡ **ASTInterpreter (v7.2.0)** - `src/javascript/` + `src/cpp/`
Arduino execution engine and hardware simulation.
- **Languages**: JavaScript + C++
- **Purpose**: AST execution, command stream generation, hardware simulation

### Integration Flow
```
Arduino Code → ArduinoParser → Clean AST → ASTInterpreter → Command Stream
```

**Key Benefits**: Independent development, future submodule extraction, maintained integration.

## Current File Structure

```
ASTInterpreter_Arduino/
├── libs/                                # Independent library modules
│   ├── CompactAST/src/CompactAST.js    # Binary AST serialization (v1.1.0)
│   └── ArduinoParser/src/ArduinoParser.js # Complete parser (v5.3.0)
├── src/
│   ├── javascript/
│   │   ├── ASTInterpreter.js           # Main interpreter (v7.2.0)
│   │   ├── ArduinoParser.js            # Node.js compatibility wrapper
│   │   └── generate_test_data.js       # Test data generator
│   └── cpp/                            # C++ implementations
├── tests/parser/                       # Parser test harnesses
├── playgrounds/                        # Interactive development tools
├── examples.js, old_test.js, neopixel.js # Test data (135 total tests)
├── docs/                               # Documentation
└── CMakeLists.txt                      # C++ build system
```

## Usage Patterns

### Node.js (Recommended)
```javascript
// Load ArduinoParser (includes CompactAST integration)
const { parse, exportCompactAST, PlatformEmulation } = require('./libs/ArduinoParser/src/ArduinoParser.js');

// Or use compatibility wrapper
const parser = require('./src/javascript/ArduinoParser.js');

// Full system usage
const ast = parse('int x = 5; void setup() { Serial.begin(9600); }');
const { ASTInterpreter } = require('./src/javascript/ASTInterpreter.js');
const interpreter = new ASTInterpreter(ast);
```

### Browser
```html
<!-- Load ArduinoParser (includes CompactAST functionality) -->
<script src="libs/ArduinoParser/src/ArduinoParser.js"></script>
<script src="src/javascript/ASTInterpreter.js"></script>
```

### Test Harnesses
```javascript
// Updated import paths after reorganization
const { parse } = require('../../libs/ArduinoParser/src/ArduinoParser.js');
const { ASTInterpreter } = require('../../src/javascript/ASTInterpreter.js');
```

## Testing

### Running Tests
```bash
# Parser tests (fast, no execution)
cd tests/parser && node test_parser_examples.js    # 79 Arduino examples
cd tests/parser && node test_parser_old_test.js    # 54 comprehensive tests
cd tests/parser && node test_parser_neopixel.js    # 2 NeoPixel tests

# Test data generation
cd src/javascript && node generate_test_data.js --selective

# Interactive development
open playgrounds/parser_playground.html
open playgrounds/interpreter_playground.html
```

### Test Results Summary
- **Parser Tests**: 100% success rate (135/135 tests)
- **Interpreter Tests**: 100% execution success, 100% semantic accuracy
- **Cross-Platform**: JavaScript ↔ C++ validation ready

## Gemini CLI for Large Codebase Analysis

When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive context window. Use `gemini -p` to leverage Google Gemini's large context capacity.

### File and Directory Inclusion Syntax

Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the gemini command:

### Examples:

**Single file analysis:**
```bash
gemini -p "@src/main.py Explain this file's purpose and structure"
```

**Multiple files:**
```bash
gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"
```

**Entire directory:**
```bash
gemini -p "@src/ Summarize the architecture of this codebase"
```

**Multiple directories:**
```bash
gemini -p "@src/ @tests/ Analyze test coverage for the source code"
```

**Current directory and subdirectories:**
```bash
gemini -p "@./ Give me an overview of this entire project"

# Or use --all_files flag:
gemini --all_files -p "Analyze the project structure and dependencies"
```

### When to Use Gemini CLI

Use `gemini -p` when:
- Analyzing entire codebases or large directories
- Comparing multiple large files
- Need to understand project-wide patterns or architecture
- Current context window is insufficient for the task
- Working with files totaling more than 100KB
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the entire codebase

### Important Notes

- Paths in `@` syntax are relative to your current working directory when invoking gemini
- The CLI will include file contents directly in the context
- No need for --yolo flag for read-only analysis
- Gemini's context window can handle entire codebases that would overflow Claude's context

## Critical Project Directives

### CRITICAL SAFETY DIRECTIVES
**MANDATORY**: Follow these safety rules at ALL times:

#### NO DESTRUCTIVE COMMANDS
- **NEVER use rm commands** (rm, rm -f, rm -rf) - they permanently delete files
- **ALWAYS move files to trash/ folder** instead of deleting them
- Use `mv filename trash/` for safe file cleanup
- The trash/ folder exists for safe file storage

#### NO GIT AVAILABLE
**IMPORTANT**: This project has NO WORKING GIT repository.
- NEVER use git commands (git status, git diff, git log, git commit, etc.)
- All git commands will fail and waste tokens
- Use file timestamps and content analysis for version tracking

### EFFICIENCY REQUIREMENTS
**MANDATORY**: Follow these rules to prevent token waste:

1. **Follow Direct Instructions Exactly**
   - Execute user instructions precisely as stated
   - No "clever alternatives" or assumptions
   - Ask for clarification if unclear, don't guess

2. **Use Proven Patterns**
   - ALWAYS use existing test harnesses as templates
   - NEVER create new testing approaches without using existing patterns
   - Build on working code, don't rebuild from scratch

3. **Minimize File Re-reading**
   - Remember file contents within sessions
   - Only re-read files if content has definitely changed
   - Use targeted searches (Grep/Glob) for specific lookups

4. **Testing Requirements**
   - ALWAYS set `maxLoopIterations: 3` for interpreter testing to prevent infinite loops
   - ALWAYS use proper timeouts (5-10 seconds)
   - NEVER let tests run indefinitely

5. **Cross-Platform Testing Methodology**
   - ALWAYS use the systematic validation approach developed in this project
   - Use `validate_cross_platform` tool for automated comparison
   - Follow "fix first failure → move to next" methodology
   - Use proper normalization for timestamps, pins, request IDs, field ordering

These directives override default behaviors and apply to ALL sessions.

## Cross-Platform Testing Methodology

### **Primary Testing Tool: `validate_cross_platform`**

The comprehensive automated validation system built for systematic cross-platform testing:

```bash
cd /mnt/d/Devel/ASTInterpreter/build

# Test single example
./validate_cross_platform 0 0    # Test only example 0

# Test range of examples  
./validate_cross_platform 0 10   # Test examples 0-10
./validate_cross_platform 5 20   # Test examples 5-20

# Test large range
./validate_cross_platform 0 50   # Test examples 0-50
```

**Key Features:**
- **Automated normalization**: Handles timestamps, pin numbers, request IDs, field ordering
- **Stops on first difference**: Allows systematic "fix first failure → move to next" approach
- **Detailed diff output**: Saves debug files for analysis
- **Success rate reporting**: Provides exact match statistics

### **Manual Testing Commands**

#### **Extract C++ Command Stream:**
```bash
cd /mnt/d/Devel/ASTInterpreter/build
./extract_cpp_commands <N>  # Extract C++ commands for test N
```

#### **View JavaScript Reference:**
```bash  
cd /mnt/d/Devel/ASTInterpreter
cat test_data/example_<NNN>.commands  # View JS reference output
```

#### **Compare Outputs Manually:**
```bash
cd /mnt/d/Devel/ASTInterpreter/build

# Extract both outputs
./extract_cpp_commands 4 2>/dev/null | sed -n '/^\[/,/^\]/p' > test4_cpp.json
cat ../test_data/example_004.commands > test4_js.json

# Compare with diff
diff test4_cpp.json test4_js.json
```

### **Systematic Testing Process**

#### **1. Run Validation Range:**
```bash
./validate_cross_platform 0 20  # Test first 20 examples
```

#### **2. Analyze First Failure:**
When tool stops on first functional difference, examine the debug files:
```bash
# Check exact differences
diff test<N>_cpp_debug.json test<N>_js_debug.json

# Analyze the specific issue
head -20 test<N>_cpp_debug.json
head -20 test<N>_js_debug.json  
```

#### **3. Fix the Issue:**
- **Execution differences**: Fix C++ interpreter logic
- **Field ordering**: Add normalization patterns
- **Data format**: Align mock values and response formats
- **Pin mapping**: Handle platform-specific pin assignments

#### **4. Verify Fix:**
```bash
./validate_cross_platform <N> <N>  # Test single fixed example
```

#### **5. Continue Systematic Testing:**
```bash  
./validate_cross_platform 0 <N+10>  # Test expanded range
```

### **Build and Maintenance**

#### **Rebuild Tools:**
```bash
cd /mnt/d/Devel/ASTInterpreter/build
make validate_cross_platform     # Build validation tool
make extract_cpp_commands       # Build extraction tool
```

#### **Clean Debug Files:**
```bash
rm test*_debug.json  # Clean up debug output files
```

### **Advanced Normalization**

The validation tool includes sophisticated normalization:

- **Timestamps**: All normalized to `"timestamp": 0`
- **Pin Numbers**: A0 pin differences (14 vs 36) normalized to `"pin": 0` 
- **Request IDs**: Different formats normalized to `"requestId": "normalized"`
- **Field Ordering**: Common patterns like DIGITAL_WRITE reordered consistently
- **Whitespace**: Consistent spacing around colons and commas

### **Success Metrics**

**Current Achievement (September 12, 2025):**
- **85.7% Success Rate**: 6/7 tests show exact matches after systematic bug fixes
- **Major Breakthroughs**: AssignmentNode, statement execution order, millis() function, mock value consistency
- **Systematic Approach**: Methodology proven effective for rapid issue resolution
- **Production Ready**: Core Arduino operations achieve cross-platform parity

**Expected Outcomes:**
- **90%+ success rate** on basic Arduino programs (Tests 0-20) 
- **Systematic resolution** of remaining execution differences
- **Production-ready parity** for common Arduino operations

## Reorganization Lessons Learned

### Import Path Management
After the three-project extraction, all import paths required updates:
- **ArduinoParser → CompactAST**: `../../CompactAST/src/CompactAST.js`
- **Tools → ArduinoParser**: `../../libs/ArduinoParser/src/ArduinoParser.js`  
- **Test Harnesses**: Updated to use libs/ paths

**Golden Rule**: Always verify relative paths after filesystem restructuring.

### Browser Loading Pattern
**CORRECT**: Load only ArduinoParser (includes CompactAST integration)
```html
<script src="libs/ArduinoParser/src/ArduinoParser.js"></script>
```

**WRONG**: Loading both libraries causes duplicate `exportCompactAST` declarations
```html
<script src="libs/CompactAST/src/CompactAST.js"></script>
<script src="libs/ArduinoParser/src/ArduinoParser.js"></script>
```

### Version Information
**Current Versions** (September 12, 2025):
- CompactAST: v1.6.0 (enhanced field ordering + const variable support)
- ArduinoParser: v5.6.0 (comprehensive cross-platform validation support)  
- ASTInterpreter: v7.7.0 (🎉 BREAKTHROUGH CONTINUES: Multiple critical bug fixes - 85.7% exact match success rate)

## Production Status

**🎉 BREAKTHROUGH CONTINUES** (September 12, 2025):
- **✅ ADDITIONAL CRITICAL BUGS FIXED**: AssignmentNode, statement execution order, millis() function
- **✅ 6 EXACT MATCHES** out of 7 tests achieved (85.7% success rate on tests 1-7)
- **✅ Enhanced validation system** with improved normalization and systematic methodology
- **✅ Comprehensive testing documentation** created with step-by-step process
- **✅ Mock value synchronization** between JavaScript and C++ platforms
- **✅ Decimal formatting normalization** and advanced field ordering support

**✅ PRODUCTION READY CORE FUNCTIONALITY**:
- **Async Operations**: ✅ analogRead(), digitalRead() work correctly in both platforms
- **Serial Operations**: ✅ Serial.begin(), Serial.println() execute identically
- **Timing Operations**: ✅ delay() functions work correctly
- **GPIO Operations**: ✅ digitalWrite(), pinMode() have cross-platform parity
- **Execution Context**: ✅ Loop body statements execute in proper sequence
- **15x performance improvement** - full test suite completes in ~14 seconds
- **Modular architecture** ready for future submodule extraction
- **Perfect integration** between all three projects
- **Interactive development** tools (playgrounds) fully functional
- **Comprehensive validation tools** for systematic debugging and testing

## Cross-Platform Parity Progress

**BREAKTHROUGH PROGRESS**: Multiple critical bugs systematically resolved through comprehensive testing methodology.

**EXACT MATCHES ACHIEVED**: 6/7 tests validated (85.7% success rate)
- ✅ Test 1 (BareMinimum.ino): 100% identical
- ✅ Test 2: 100% identical  
- ✅ Test 3: 100% identical
- ✅ Test 4 (Fade.ino): 100% identical ⭐ NEWLY FIXED
- ✅ Test 5: 100% identical ⭐ NEWLY FIXED
- ✅ Test 6: 100% identical ⭐ NEWLY FIXED
- 🔄 Test 7 (BlinkWithoutDelay.ino): In progress - conditional evaluation differences

**SYSTEMATIC VALIDATION**: Comprehensive automated validation system ready to test all 135 tests systematically with `./build/validate_cross_platform` tool.

The three-project architecture provides a solid foundation for independent development while maintaining seamless integration across the Arduino AST interpreter ecosystem.