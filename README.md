# ArduinoInterpreter

**A complete Arduino/C++ code interpreter system for browser and Node.js environments**

ArduinoInterpreter is a production-ready parser and interpreter that transforms Arduino/C++ source code into executable command streams through a sophisticated multi-stage processing pipeline. It provides full Arduino language support with hardware simulation, making it perfect for educational tools, code validation, and Arduino development environments.

## 🎯 Current Status (September 2, 2025)

**C++ Implementation 85% Complete - Critical Fixes Applied**

The dual-platform JavaScript + C++ Arduino interpreter system is nearly complete:

### ✅ **Recently Fixed (This Session)**
- **C++ CompactAST Type Preservation**: Fixed integer vs float semantics (5/2 = 2, not 2.5)
- **C++ State Machine Resumption**: Fixed async Arduino function resumption (analogRead, digitalRead)
- **Cross-Platform Format Compliance**: JavaScript and C++ now use identical binary AST format

### 🔄 **Remaining Tasks (Next Session)**
- **Implement C++ Function Parameters**: Complete implementation for user-defined functions.
- **Implement C++ Assignment**: Add support for `myArray[i] = value` and `myStruct.field = value`.
- **Complete C++ For Loops**: Finalize range-based for loop execution for strings and numbers.
- **Run Cross-Platform Validation**: Execute the full 135-test suite to verify JS/C++ command stream parity.
- **Cleanup Dead Code**: Remove the old `RequestManager` code from the C++ implementation.

### 📋 **For Next AI Session**
**START HERE**: Read `CLAUDE.md` lines 725-780 for complete context and specific file locations to modify.

**Build Status**: ✅ All components compile successfully (warnings only, no errors)

## Funding
We are urgently in need of funding for this project to continue the longer term goals ... We will be start a tradition funding campaign but for now we are asking for small amount donations to help keep paying for a minimal subscription to claude code ... $20 per month minimum or $100 per month maximum is what we need ... If you can help please click the button

[<img width="10%" height="10%" src="https://raw.githubusercontent.com/sfranzyshen/ArduinoInterpreter/refs/heads/main/paypal.png">](https://www.paypal.com/donate/?hosted_button_id=ZHGG4TAC94E86)

## 🚀 Architecture Overview

ArduinoInterpreter uses a clean, modular architecture that processes Arduino code in three distinct stages:

```
Arduino Code → Parser (Integrated Preprocessor & Platform Emulation) → AST → Interpreter → Command Stream
     ↓                             ↓                                   ↓         ↓              ↓
  Raw C++        Handles #define, #if, #include, Platform Defines,   Abstract   Hardware    Structured
  Source         and Library Activation Internally                   Syntax     Simulation  Commands
  Code                                                               Tree       Events      for Parent App
```

### Processing Pipeline

1. **Parsing**: The `ArduinoParser.js` module takes raw Arduino code, internally handles all preprocessing directives (`#define`, `#ifdef`, etc.) and applies platform-specific context (e.g., for ESP32 vs. Uno), and generates a clean Abstract Syntax Tree (AST).
2. **Interpretation**: The `ArduinoInterpreter.js` module executes the AST nodes, simulates Arduino hardware behavior (pins, timing, serial), and manages the program state.
3. **Command Emission**: The interpreter generates a structured stream of commands representing the program's hardware interactions.

## 🏗️ Core Modules

### [`ArduinoParser.js`](ArduinoParser.js) - Parser, Preprocessor & Platform Emulation
- **Purpose**: A comprehensive, all-in-one module that parses Arduino/C++ code. It integrates a full C++ preprocessor and Arduino platform emulation.
- **Input**: Raw Arduino/C++ source code.
- **Features**: 
  - **Integrated Preprocessing**: Handles macro expansion, conditional compilation (`#ifdef`), and library activation from `#include` directives.
  - **Integrated Platform Emulation**: Natively understands different Arduino board contexts (e.g., 'ESP32_NANO', 'ARDUINO_UNO') to apply the correct defines and library support.
  - **Complete C++ Parsing**: Supports the full language specification including templates, namespaces, classes, and pointers.
  - **Error Recovery**: Provides robust error handling for malformed code.
- **Output**: A clean Abstract Syntax Tree (AST) and metadata about the compilation (e.g., active libraries).

### [`ArduinoInterpreter.js`](ArduinoInterpreter.js) - AST Interpreter & Hardware Simulator
- **Purpose**: Executes a parsed AST and simulates Arduino hardware behavior.
- **Input**: An Abstract Syntax Tree from `ArduinoParser.js`.
- **Features**:
  - **Execution Engine**: Manages `setup()` and `loop()` execution flow.
  - **Hardware Simulation**: Simulates `pinMode`, `digitalWrite`, `analogRead`, timing functions, and serial communication.
  - **State Management**: Tracks variable state, scope, and memory.
  - **Library Interface**: Supports external libraries like Adafruit_NeoPixel, Servo, Wire, SPI, etc.
- **Output**: A structured command stream for parent application integration.

## 🎯 Command Stream Architecture

The interpreter generates a clean, structured command stream that parent applications can easily process:

```javascript
// Example command stream output
{ type: 'PIN_MODE', pin: 13, mode: 'OUTPUT' }
{ type: 'DIGITAL_WRITE', pin: 13, value: 1 }
{ type: 'DELAY', duration: 1000 }
{ type: 'ANALOG_READ_REQUEST', pin: 'A0', requestId: 'req_001' }
{ type: 'SERIAL_PRINT', data: 'Hello World', newline: true }
```

Commands contain only primitive data types for maximum compatibility with parent applications, embedded systems, and serialization protocols.

## 📊 Project Status

**🏆 Production Ready** - 100% test coverage across all components

| Component | Version | Test Suite | Success Rate | Tests |
|-----------|---------|------------|--------------|-------|
| **Parser** | v5.1.0 | Arduino Examples & NeoPixel | 100% ✅ | 81/81 |
| **Interpreter** | v6.3.0 | Comprehensive Tests | 100% ✅ | 54/54 |
| **Total Coverage** | | | **100% ✅** | **135/135** |

### Test Coverage
- **Execution Success**: 100% - All 135 test cases execute without errors
- **Semantic Accuracy**: 100% - All outputs match expected Arduino behavior
- **Library Support**: Complete - NeoPixel, Servo, Wire, SPI, EEPROM libraries
- **Language Features**: Full C++ support including templates, namespaces, pointers

## 🚀 Quick Start

### Node.js Usage

```javascript
const { parse } = require('./ArduinoParser.js');
const { ArduinoInterpreter } = require('./ArduinoInterpreter.js');

// 1. Define Arduino code
const arduinoCode = `
#define LED_PIN 13
void setup() {
  pinMode(LED_PIN, OUTPUT);
}
void loop() {
  digitalWrite(LED_PIN, HIGH);
  delay(1000);
}`;

// 2. Parse the code, specifying the target platform
const ast = parse(arduinoCode, { platform: 'ARDUINO_UNO' });

// 3. Create interpreter
const interpreter = new ArduinoInterpreter(ast, {
  maxLoopIterations: 3, // Prevent infinite loops in testing
});

// 4. Handle the command stream
interpreter.onCommand = (command) => {
  console.log('Arduino Command:', command);
  // Process commands in your application
};

// 5. Start execution
interpreter.start();
```

### Browser Usage

```html
<!DOCTYPE html>
<html>
<head>
    <script src="ArduinoParser.js"></script>
    <script src="ArduinoInterpreter.js"></script>
</head>
<body>
    <script>
        const arduinoCode = "void setup() { Serial.begin(9600); } void loop() { Serial.println('Hello'); delay(500); }";
        
        // 1. Parse the code (modules are auto-exported to window)
        const ast = parse(arduinoCode, { platform: 'ARDUINO_UNO' });
        
        // 2. Create interpreter
        const interpreter = new ArduinoInterpreter(ast);
        
        // 3. Handle commands
        interpreter.onCommand = (command) => {
            console.log(command);
            // Handle Arduino commands in your web application
        };
        
        // 4. Start!
        interpreter.start();
    </script>
</body>
</html>
```

## 🧪 Testing & Development

### Running Tests

```bash
# Interpreter Tests (full execution simulation)
node test_interpreter_examples.js    # Arduino examples (79 tests)
node test_interpreter_old_test.js    # Comprehensive cases (54 tests) 
node test_interpreter_neopixel.js    # NeoPixel library tests (2 tests)

# Parser Tests (parsing validation only)
node test_parser_examples.js         # Fast parsing validation
node test_parser_old_test.js         # Advanced language features
node test_parser_neopixel.js         # Library parsing tests

# Semantic Accuracy Tests (behavior validation)
node test_semantic_accuracy_examples.js  # Validate command stream correctness
node test_semantic_accuracy.js           # Advanced semantic validation
```

### Interactive Development

```bash
# Interactive interpreter testing (recommended)
open interpreter_playground.html

# Interactive parser testing  
open parser_playground.html
```

## 🔧 Advanced Features

### Platform Switching

Platform features and defines are handled automatically by passing a `platform` string during parsing.

```javascript
// Parse for an ESP32 Nano
const astForEsp32 = parse(code, { platform: 'ESP32_NANO' });

// Parse for an Arduino Uno
const astForUno = parse(code, { platform: 'ARDUINO_UNO' });
```

### Hardware Simulation Configuration

```javascript
const interpreter = new ArduinoInterpreter(ast, {
  maxLoopIterations: 10,      // Control loop execution
  stepDelay: 0,               // Execution timing (0 = no delay)
  verbose: false,             // Suppress debug output
});

// Handle external data requests (analogRead, digitalRead, etc.)
interpreter.responseHandler = (request) => {
  // Mock hardware responses
  const mockValue = request.type === 'analogRead' ? 
    Math.floor(Math.random() * 1024) : 
    Math.random() > 0.5 ? 1 : 0;
  
  setTimeout(() => {
    interpreter.handleResponse(request.id, mockValue);
  }, 10); // Simulate hardware delay
};
```

## 📚 Supported Arduino Features

### Language Constructs
- **Data Types**: `int`, `float`, `double`, `char`, `bool`, `String`, `byte`, etc.
- **Control Structures**: `if/else`, `for`, `while`, `do-while`, `switch/case`
- **Functions**: Definitions, calls, parameters, overloading
- **Arrays**: Single and multi-dimensional, dynamic allocation
- **Pointers**: Basic pointer operations and arithmetic
- **Structs/Classes**: Member functions, constructors, inheritance
- **Templates**: Template instantiation and specialization
- **Namespaces**: Qualified access (`std::vector`, `namespace::member`)

### Arduino Libraries
- **Built-in**: `pinMode`, `digitalWrite`, `digitalRead`, `analogRead`, `analogWrite`
- **Timing**: `delay`, `delayMicroseconds`, `millis`, `micros`
- **Serial**: `Serial.print`, `Serial.println`, `Serial.available`
- **Advanced Libraries**: Adafruit_NeoPixel, Servo, Wire (I2C), SPI, EEPROM
- **Hardware**: PWM, interrupts, timers, communication protocols

### Preprocessor Features
- **Macros**: Simple (`#define LED_PIN 13`) and function-like (`#define MAX(a,b) ((a)>(b)?(a):(b))`)
- **Includes**: Library activation (`#include <Adafruit_NeoPixel.h>`)
- **Conditionals**: `#ifdef`, `#ifndef`, `#if defined()`, `#else`, `#endif`
- **Platform Defines**: ESP32, ARDUINO, WIFI_SUPPORT, BLUETOOTH_SUPPORT


## 🔭 Other Option
The ArduinoInterpreter project is not a full Simulator for the Arduino ... The goal for this project is to be the "preprocessor, parser, and interpreter" part for a simulated Arduino environment (not provided). There are other projects that perform full "emulation" or full "simulation" of the Arduino environment ... most notably [**wokwi.com**](https://wokwi.com/) and [**Tinkercad**](https://www.tinkercad.com/things?type=circuits) ... the closet in scope to this project would be the [**ArduinoSimulator**](https://github.com/lrusso/ArduinoSimulator) project that converts Arduino sketches to a portable C++ that then gets used by '[**JSCPP**](https://github.com/felixhao28/JSCPP)' to simulate the Arduino environment within the browser (or nodejs) . While the projects have similar goals ... the complexity and inclusion of the [**JSCPP**](https://github.com/felixhao28/JSCPP) library into the [**ArduinoSimulator**](https://github.com/lrusso/ArduinoSimulator) makes it unessarly bloated code ... 

## This project began as a 30-day experiment 
This project began as a 30-day experiment using AI technologies to solve a previously unsuccessful programming challenge. The result is now available to the open source educational community under dual licensing (Source-Available License and AGPLv3), with commercial licensing available.

## 📜 Licensing

This project is dual-licensed under the [**sfranzyshen.com Source-Available License 1.0**](https://github.com/sfranzyshen/ArduinoInterpreter/blob/main/sfranzyshen_source_available_license.md) 

and **sfranzyshen.org with [GNU AGPLv3](https://github.com/sfranzyshen/ArduinoInterpreter/blob/main/gnu-agpl-v3.0.md)**.

* You may use this software under the terms of the **Source-Available License** for non-production purposes (e.g., development, testing).
* After the Change Date of **8/26/2030**, the software will automatically be governed by the **AGPLv3**.
* If you wish to use this software in a production environment before the Change Date, you must obtain a **commercial license**. Please contact us at [sfranzyshen@hotmail.com] for more details.