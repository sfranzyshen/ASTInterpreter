# Arduino Interpreter Project - QWEN Context

## Project Overview

This is a complete Arduino/C++ code interpreter system implemented in JavaScript that runs in both browser and Node.js environments. The system transforms Arduino/C++ source code into executable command streams through a sophisticated multi-stage processing pipeline.

### Core Architecture

The Arduino Interpreter uses a clean, modular architecture that processes Arduino code through four distinct stages:

```
Arduino Code → Platform Context → Preprocessor → Parser → AST → Interpreter → Command Stream
     ↓              ↓              ↓           ↓      ↓          ↓              ↓
  Raw C++      ESP32 Defines    Macro        Clean  Abstract   Hardware    Structured
  Source       Pin Mappings     Expansion    Code   Syntax     Simulation  Commands
  Code         Libraries        Conditionals        Tree       Events      for Parent App
```

### Processing Pipeline

1. **Platform Emulation** - Provides Arduino platform context (ESP32 Nano by default)
2. **Preprocessing** - Handles macros, includes, and conditional compilation 
3. **Parsing** - Generates clean Abstract Syntax Tree from preprocessed code
4. **Interpretation** - Executes AST with hardware simulation and command emission

This clean architecture ensures complete separation of concerns, with preprocessing happening entirely before parsing, eliminating preprocessor pollution from the AST and interpreter. The result is a clean, maintainable system with full Arduino compatibility.

## Core Modules

### `platform_emulation.js` - Platform Context
- **Purpose**: Provides Arduino platform-specific definitions and capabilities
- **Default Platform**: ESP32 Nano (Arduino Nano ESP32)
- **Features**: Pin mappings, hardware defines, library support, switchable platforms
- **Output**: Platform context with defines like `ESP32`, `WIFI_SUPPORT`, `BLUETOOTH_SUPPORT`

### `preprocessor.js` - Arduino Preprocessor  
- **Purpose**: Complete C++ preprocessing with Arduino-specific extensions
- **Input**: Raw Arduino/C++ source code + platform context
- **Features**: 
  - Macro expansion (`#define LED_COUNT 60`, `#define AREA(r) (3.14 * r * r)`)
  - Library activation from includes (`#include <Adafruit_NeoPixel.h>`)
  - Conditional compilation (`#ifdef ESP32`, `#if defined(WIFI_SUPPORT)`)
  - Complete directive removal for clean parser input
  - Function-like macro expansion with parameter substitution
- **Output**: Clean C++ code ready for parsing + metadata (active libraries, macros)

The preprocessor integrates seamlessly with the parser and interpreter, running transparently before tokenization to expand macros and activate libraries without changing the core parsing logic. This enables full Arduino compatibility with standard `#define` macros and `#include` directives.

### `parser.js` - Arduino C++ Parser
- **Purpose**: Lexical analysis and Abstract Syntax Tree generation
- **Input**: Clean preprocessed C++ code (no preprocessor directives)
- **Features**:
  - Complete Arduino/C++ language support
  - Enhanced error handling and recovery
  - Support for Arduino-specific constructs and libraries
  - Template support (`std::vector<int>`, `ClassName<Type>`)
  - Namespace support (`std::vector`, `rtttl::isPlaying`)
- **Output**: Abstract Syntax Tree (AST) with clean structure

### `interpreter.js` - AST Interpreter & Hardware Simulator
- **Purpose**: Executes AST and simulates Arduino hardware behavior
- **Input**: Abstract Syntax Tree + configuration options
- **Features**:
  - Variable management and scope handling  
  - Arduino function simulation (`pinMode`, `digitalWrite`, `analogRead`)
  - Hardware simulation (pins, timing, serial communication)
  - Library interface support (NeoPixel, Servo, Wire, SPI)
  - Request-response pattern for external data functions
  - Loop control and execution flow management
- **Output**: Structured command stream for parent application integration

## Command Stream Architecture

The interpreter generates a clean, structured command stream that parent applications can easily process:

```javascript
// Example command stream output
{ type: 'PIN_MODE', pin: 13, mode: 'OUTPUT' }
{ type: 'DIGITAL_WRITE', pin: 13, value: 1 }
{ type: 'DELAY', duration: 1000 }
{ type: 'ANALOG_READ_REQUEST', pin: 'A0', requestId: 'req_001' }
{ type: 'SERIAL_PRINT', data: 'Hello World', newline: true }
```

Commands contain only primitive data types (no nested objects) for maximum compatibility with parent applications, embedded systems, and serialization protocols.

### Request-Response Pattern

The interpreter uses a request-response pattern for external data functions like `analogRead()`, `digitalRead()`, and `millis()`. When these functions are called, the interpreter emits a request command with a unique ID, then waits for the parent application to provide the actual value:

```javascript
// Mock response handlers for testing
interpreter.responseHandler = (request) => {
    setTimeout(() => {
        let mockValue;
        switch (request.type) {
            case 'analogRead': mockValue = Math.floor(Math.random() * 1024); break;
            case 'digitalRead': mockValue = Math.random() > 0.5 ? 1 : 0; break;
            case 'millis': mockValue = Date.now() % 100000; break;
            case 'micros': mockValue = Date.now() * 1000 % 1000000; break;
        }
        interpreter.handleResponse(request.id, mockValue);
    }, Math.random() * 10);
};
```

This allows parent applications to provide realistic hardware values from actual sensors, simulated environments, or test data.

## Test Structure

### Test Data Files
- `examples.js` - 79 Arduino examples for testing
- `old_test.js` - 54 comprehensive test cases with descriptive names
- `neopixel.js` - 2 NeoPixel-specific test cases

### Test Harnesses
#### Interpreter Tests (Full Execution Simulation)
- `test_interpreter_examples.js` - Tests examples.js (100.0% success rate)
- `test_interpreter_old_test.js` - Tests old_test.js (100.0% success rate)
- `test_interpreter_neopixel.js` - Tests neopixel.js (100.0% success rate)

#### Parser Tests (Fast Parsing Validation)
- `test_parser_examples.js` - Parse Arduino examples
- `test_parser_old_test.js` - Parse comprehensive tests
- `test_parser_neopixel.js` - Parse NeoPixel tests

#### Semantic Accuracy Tests (Behavior Validation)
- `test_semantic_accuracy_examples.js` - Validate command stream correctness
- `test_semantic_accuracy.js` - Advanced semantic validation
- `command_stream_validator.js` - External validation framework

## Development Guidelines

### Critical Safety Rules
1. **Always** use `maxLoopIterations: 3` when creating interpreters
2. **Always** suppress console output with `console.log = () => {}` during testing
3. **Always** parse code first with preprocessor before creating interpreter
4. **Never** use `new ArduinoInterpreter(code)` - always parse to AST first

### Essential Test Pattern
```javascript
// Proven safe pattern with preprocessor:
const ast = parse(code, { enablePreprocessor: true });
const interpreter = new ArduinoInterpreter(ast, { 
    verbose: false, debug: false, stepDelay: 0, maxLoopIterations: 3 
});

const originalConsoleLog = console.log;
console.log = () => {};  // Suppress debug spam
const result = interpreter.start();
console.log = originalConsoleLog;  // Always restore
```

### Preprocessor Usage Example
To test macro substitution and library activation:

```javascript
const codeWithMacros = `
#define LED_COUNT 60
uint16_t pixelNumber = LED_COUNT;
void setup() {}
void loop() {}
`;

// ESSENTIAL: Enable preprocessor for #define macros
const ast = parse(codeWithMacros, { enablePreprocessor: true });

// Verify macro substitution
if (ast.preprocessorInfo.macros.LED_COUNT === '60') {
    console.log('✅ LED_COUNT macro = 60');
}

// Code with #include library activation
const codeWithIncludes = `
#include <Adafruit_NeoPixel.h>
void setup() { int order = NEO_GRB; }
void loop() {}
`;

const ast2 = parse(codeWithIncludes, { enablePreprocessor: true });
// Library constants automatically available as macros
```

### Complete Usage Example
Here's a complete example showing how to use all components together:

```javascript
const { PlatformEmulation } = require('./platform_emulation.js');
const { parse } = require('./parser.js');
const { ArduinoInterpreter } = require('./interpreter.js');

// 1. Set up platform context (ESP32 Nano by default)
const platform = new PlatformEmulation('ESP32_NANO');

// 2. Parse Arduino code with preprocessing
const arduinoCode = `
#define LED_PIN 13
void setup() {
  pinMode(LED_PIN, OUTPUT);
}
void loop() {
  digitalWrite(LED_PIN, HIGH);
  delay(1000);
}`;

const ast = parse(arduinoCode, { 
  enablePreprocessor: true,
  platformContext: platform 
});

// 3. Create interpreter with hardware simulation
const interpreter = new ArduinoInterpreter(ast, {
  maxLoopIterations: 3,  // Prevent infinite loops in testing
  verbose: false
});

// 4. Handle command stream
interpreter.onCommand = (command) => {
  console.log('Arduino Command:', command);
  // Process commands in your application
};

// 5. Start execution
interpreter.start();
```

### Running Tests
```bash
# Interpreter Tests (full execution simulation)
node test_interpreter_examples.js    # Arduino examples (100.0% success)
node test_interpreter_old_test.js    # Comprehensive tests (100.0% success)
node test_interpreter_neopixel.js    # NeoPixel tests (100.0% success)

# Parser Tests (fast parsing validation)  
node test_parser_examples.js         # Parse Arduino examples
node test_parser_old_test.js         # Parse comprehensive tests

# Semantic Accuracy Tests (behavior validation)
node test_semantic_accuracy_examples.js  # Arduino examples (100% accuracy)
node test_semantic_accuracy.js           # Comprehensive tests (100% accuracy)
```

## Project Status

**🏆 Production Ready** - 100% test coverage across all components

| Component | Version | Test Suite | Success Rate | Tests |
|-----------|---------|------------|--------------|-------|
| **Parser** | v5.0.0 | Arduino Examples | 100% ✅ | 79/79 |
| **Interpreter** | v6.3.0 | Comprehensive Tests | 100% ✅ | 54/54 |
| **Preprocessor** | v1.2.0 | NeoPixel Tests | 100% ✅ | 2/2 |
| **Platform Emulation** | v1.0.0 | **Total Coverage** | **100% ✅** | **135/135** |

### Test Coverage
- **Execution Success**: 100% - All 135 test cases execute without errors
- **Semantic Accuracy**: 100% - All outputs match expected Arduino behavior
- **Library Support**: Complete - NeoPixel, Servo, Wire, SPI, EEPROM libraries
- **Language Features**: Full C++ support including templates, namespaces, pointers

## AI Agent System

The project includes a sophisticated 13-agent hybrid system with specialized AI subagents:

### Core JavaScript Automation Agents
Located in the `agents/core/` directory:
- **ParserAgent** - Handles parsing and preprocessor operations
- **InterpreterAgent** - Manages code execution and hardware simulation
- **TestHarnessAgent** - Runs comprehensive test suites
- **SemanticAnalysisAgent** - Validates behavioral correctness
- **BuildManagerAgent** - Coordinates build and deployment processes

### Claude Code Subagents
Located in `.claude/agents/` directory:
- **parser-specialist** - Expert in Arduino C++ parsing and AST generation
- **interpreter-specialist** - Expert in code execution and hardware simulation
- **test-diagnostician** - Expert in test failure analysis and quality assessment
- **architecture-reviewer** - Expert in system design and integration strategies

### Agent Integration
The `agents/subagent_integration.js` file provides utilities for JavaScript automation agents to coordinate with Claude Code subagents, enabling a hybrid approach that combines the efficiency of JavaScript automation with the specialized expertise of AI specialists.

## Interactive Development Tools

- `interpreter_playground.html` - Interactive interpreter with test selection
- `parser_playground.html` - Interactive parser testing environment