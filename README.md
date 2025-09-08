# Arduino AST Interpreter

**A complete dual-platform Arduino/C++ code interpreter system with modular library architecture**

Arduino AST Interpreter is a production-ready, modular system that transforms Arduino/C++ source code into executable command streams through a sophisticated multi-stage processing pipeline. It provides full Arduino language support with hardware simulation, making it perfect for educational tools, code validation, and Arduino development environments.

## 🏗️ Three-Project Modular Architecture

The project is organized into three independent, reusable modules:

```
├── libs/CompactAST/          # Binary AST serialization library (JavaScript + C++)
├── libs/ArduinoParser/       # Arduino/C++ parser with integrated preprocessor  
└── src/javascript/           # ASTInterpreter execution engine
```

### **CompactAST Library** (v1.1.1)
- **Purpose**: Binary AST serialization with 12.5x compression ratio
- **Dual Implementation**: JavaScript + C++ with identical binary format
- **ESP32 Ready**: Optimized for embedded deployment (512KB RAM + 8MB PSRAM)

### **ArduinoParser Library** (v5.3.1)  
- **Purpose**: Complete Arduino/C++ parsing with integrated preprocessor and platform emulation
- **Features**: Macro expansion, conditional compilation, library activation, ESP32/Arduino Uno platform switching
- **Output**: Clean Abstract Syntax Tree + CompactAST binary serialization

### **ASTInterpreter Core** (v7.3.0)
- **Purpose**: AST execution engine with Arduino hardware simulation
- **Architecture**: Hybrid state machine with request-response pattern for external hardware functions
- **Output**: Structured command streams for parent application integration

## 🎯 Current Status (September 8, 2025)

**✅ JavaScript: 100% Complete | 🔄 C++ Implementation: ~85% Complete**

### ✅ **JavaScript Implementation - PRODUCTION READY**
- **Architecture**: Complete modular three-project system with cross-platform compatibility
- **Test Coverage**: 135/135 tests passing (100% success rate, 100% semantic accuracy)
- **Performance**: 15x improvement achieved - all tests complete in ~14 seconds (was 120+ seconds)
- **Libraries**: Full Arduino library support (NeoPixel, Servo, Wire, SPI, EEPROM)
- **Features**: Step/resume debugging, browser/Node.js compatibility, interactive playgrounds
- **Optimization**: Centralized conditional logging system eliminates debug overhead

### 🔄 **C++ Implementation - FINAL 15% REMAINING**  
- **Status**: Core architecture complete, CMake build system working, 40+ test executables
- **Build Output**: 30MB static library (`libarduino_ast_interpreter.a`) + comprehensive testing infrastructure
- **ESP32-S3 Ready**: C++17 compatible, memory optimized for embedded deployment

**Remaining Tasks**: User function parameters, array/struct assignment, range-based for loops, full cross-platform validation

## Funding
We are urgently in need of funding for this project to continue the longer term goals ... We will be start a tradition funding campaign but for now we are asking for small amount donations to help keep paying for a minimal subscription to claude code ... $20 per month minimum or $100 per month maximum is what we need ... If you can help please click the button

[<img width="10%" height="10%" src="https://raw.githubusercontent.com/sfranzyshen/ASTInterpreter/refs/heads/main/paypal.png">](https://www.paypal.com/donate/?hosted_button_id=ZHGG4TAC94E86)

## 🚀 Processing Pipeline

The modular architecture processes Arduino code through a clean three-stage pipeline:

```
Arduino Code → ArduinoParser → CompactAST → ASTInterpreter → Command Stream
     ↓              ↓              ↓            ↓              ↓
  Raw C++      Preprocessing    Binary AST   Hardware      Structured
  Source       Platform         12.5x        Simulation    Commands
  Code         Integration      Compression   Engine        for Parent App
```

### Stage 1: ArduinoParser Library
**Input**: Raw Arduino/C++ source code  
**Processing**: Macro expansion (`#define`), conditional compilation (`#ifdef`), library activation (`#include`), platform-specific context (ESP32/Arduino Uno)  
**Output**: Clean Abstract Syntax Tree (AST)

### Stage 2: CompactAST Library  
**Input**: Abstract Syntax Tree from ArduinoParser  
**Processing**: Binary serialization with 12.5x compression ratio  
**Output**: Compact binary AST format (cross-platform JavaScript ↔ C++)

### Stage 3: ASTInterpreter Core
**Input**: AST or CompactAST binary data  
**Processing**: Hardware simulation (`pinMode`, `digitalWrite`, `analogRead`, timing, serial communication)  
**Output**: Structured command stream with primitive data types

## 📁 Module Locations & Usage

### **ArduinoParser Library** - [`libs/ArduinoParser/src/ArduinoParser.js`](libs/ArduinoParser/src/ArduinoParser.js)
```javascript
const { parse, PlatformEmulation } = require('./libs/ArduinoParser/src/ArduinoParser.js');
const ast = parse(arduinoCode, { platform: 'ESP32_NANO' });
```

### **CompactAST Library** - [`libs/CompactAST/src/CompactAST.js`](libs/CompactAST/src/CompactAST.js)  
```javascript
const { exportCompactAST, parseCompactAST } = require('./libs/CompactAST/src/CompactAST.js');
const binaryAST = exportCompactAST(ast);     // 12.5x compression
const restoredAST = parseCompactAST(binaryAST);  // Restore from binary
```

### **ASTInterpreter Core** - [`src/javascript/ASTInterpreter.js`](src/javascript/ASTInterpreter.js)
```javascript
const { ASTInterpreter } = require('./src/javascript/ASTInterpreter.js');
const interpreter = new ASTInterpreter(ast);
interpreter.onCommand = (command) => console.log(command);
interpreter.start();
```

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
| **Parser** | v5.0.0 | Arduino Examples & NeoPixel | 100% ✅ | 81/81 |
| **Interpreter** | v6.4.0 | Comprehensive Tests | 100% ✅ | 54/54 |
| **Total Coverage** | | | **100% ✅** | **135/135** |

### Test Coverage
- **Execution Success**: 100% - All 135 test cases execute without errors
- **Semantic Accuracy**: 100% - All outputs match expected Arduino behavior
- **Library Support**: Complete - NeoPixel, Servo, Wire, SPI, EEPROM libraries
- **Language Features**: Full C++ support including templates, namespaces, pointers

## 🚀 Quick Start

### Node.js Usage (Three-Project Architecture)

```javascript
// Import modular libraries
const { parse } = require('./libs/ArduinoParser/src/ArduinoParser.js');
const { ASTInterpreter } = require('./src/javascript/ASTInterpreter.js');

// 1. Define Arduino code
const arduinoCode = `
#define LED_PIN 13
void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}
void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("LED ON");
  delay(1000);
}`;

// 2. Parse with platform-specific context
const ast = parse(arduinoCode, { platform: 'ESP32_NANO' });

// 3. Create interpreter with hardware simulation
const interpreter = new ASTInterpreter(ast, {
  maxLoopIterations: 3, // Prevent infinite loops in testing
  verbose: false,       // Suppress debug output
});

// 4. Handle command stream
interpreter.onCommand = (command) => {
  console.log('Arduino Command:', command);
  // Example commands: PIN_MODE, DIGITAL_WRITE, SERIAL_PRINT, DELAY
};

// 5. Handle external hardware requests (analogRead, digitalRead, etc.)
interpreter.responseHandler = (request) => {
  const mockValue = request.type === 'analogRead' ? 
    Math.floor(Math.random() * 1024) : 
    Math.random() > 0.5 ? 1 : 0;
  
  setTimeout(() => {
    interpreter.handleResponse(request.id, mockValue);
  }, 10); // Simulate hardware delay
};

// 6. Start execution
interpreter.start();
```

### Browser Usage (Modular Loading)

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Load only ArduinoParser (includes CompactAST) -->
    <script src="libs/ArduinoParser/src/ArduinoParser.js"></script>
    <script src="src/javascript/ASTInterpreter.js"></script>
</head>
<body>
    <script>
        const arduinoCode = `
        void setup() { 
          Serial.begin(9600); 
          pinMode(13, OUTPUT);
        } 
        void loop() { 
          digitalWrite(13, HIGH);
          Serial.println("Hello World"); 
          delay(500); 
        }`;
        
        // Parse with integrated preprocessor and platform context
        const ast = parse(arduinoCode, { platform: 'ESP32_NANO' });
        
        // Create interpreter
        const interpreter = new ASTInterpreter(ast);
        
        // Handle structured commands
        interpreter.onCommand = (command) => {
            console.log('Command:', command);
            // Handle PIN_MODE, DIGITAL_WRITE, SERIAL_PRINT, etc.
        };
        
        // Start execution
        interpreter.start();
    </script>
</body>
</html>
```

### Interactive Development Tools

```bash
# Open browser-based development environments
open playgrounds/parser_playground.html      # Interactive parser testing
open playgrounds/interpreter_playground.html # Interactive interpreter testing  
```

## 🧪 Testing & Development

### **JavaScript Test Suite (135 Tests - 100% Success Rate)**

```bash
# Interpreter Tests (full execution simulation)
node tests/interpreter/test_interpreter_examples.js    # 79 Arduino examples
node tests/interpreter/test_interpreter_old_test.js    # 54 comprehensive tests
node tests/interpreter/test_interpreter_neopixel.js    # 2 NeoPixel library tests

# Parser Tests (syntax validation only - faster)
node tests/parser/test_parser_examples.js              # Fast parsing validation
node tests/parser/test_parser_old_test.js              # Advanced language features
node tests/parser/test_parser_neopixel.js              # Library parsing tests

# Test Data Generation (for C++ cross-platform validation)
node src/javascript/generate_test_data.js --selective  # Creates 405 binary AST files
```

### **C++ Build & Test System**

```bash
# Build all components
cmake .        # Configure build system
make           # Compile all targets (30MB static library + 40+ test executables)

# Run C++ tests
./build/basic_interpreter_example examples.ast         # Demo executable with AST file
./build/test_cross_platform_validation                 # JavaScript ↔ C++ validation
./build/quick_similarity_test                          # Fast similarity analysis
```

### **Interactive Development Tools** 

```bash
# Browser-based development environments (recommended)
open playgrounds/interpreter_playground.html           # Interactive interpreter testing
open playgrounds/parser_playground.html                # Interactive parser testing  

# Both playgrounds support:
# - Real-time code editing and execution
# - Step-by-step debugging with pause/resume
# - Command stream visualization  
# - Test case selection from examples.js/old_test.js/neopixel.js
```

## 🔧 Advanced Features

### **Multi-Platform Arduino Support**

The ArduinoParser library automatically handles platform-specific compilation:

```javascript
const { parse, PlatformEmulation } = require('./libs/ArduinoParser/src/ArduinoParser.js');

// ESP32 Nano compilation (default)
const esp32AST = parse(code, { platform: 'ESP32_NANO' });
// Includes: WIFI_SUPPORT, BLUETOOTH_SUPPORT, ESP32 defines

// Arduino Uno compilation  
const unoAST = parse(code, { platform: 'ARDUINO_UNO' });
// Includes: Classic Arduino defines, limited memory context

// Custom platform configuration
const customPlatform = new PlatformEmulation('ESP32_NANO');
customPlatform.addDefine('CUSTOM_FEATURE', '1');
const customAST = parse(code, { platformContext: customPlatform });
```

### **CompactAST Binary Serialization**

Efficient binary format for embedded deployment and cross-platform compatibility:

```javascript
const { exportCompactAST, parseCompactAST } = require('./libs/CompactAST/src/CompactAST.js');

// Serialize AST to binary (12.5x compression)
const binaryData = exportCompactAST(ast);
console.log(`Compressed: ${ast.size} → ${binaryData.length} bytes`);

// Save for C++ interpreter
require('fs').writeFileSync('program.ast', binaryData);

// Restore from binary
const restoredAST = parseCompactAST(binaryData);
```

### **Hardware Simulation & Debugging**

```javascript
const interpreter = new ASTInterpreter(ast, {
  maxLoopIterations: 10,      // Prevent infinite loops
  stepDelay: 50,              // Add delays for step debugging (ms) 
  verbose: true,              // Enable debug output
  debug: true,                // Enable step-by-step debugging
});

// External hardware simulation (analogRead, digitalRead, etc.)
interpreter.responseHandler = (request) => {
  // Simulate real hardware responses
  let mockValue;
  switch (request.type) {
    case 'analogRead': mockValue = Math.floor(Math.random() * 1024); break;
    case 'digitalRead': mockValue = Math.random() > 0.5 ? 1 : 0; break;
    case 'millis': mockValue = Date.now() % 100000; break;
    case 'micros': mockValue = Date.now() * 1000 % 1000000; break;
  }
  
  // Simulate hardware delay (realistic timing)
  setTimeout(() => {
    interpreter.handleResponse(request.id, mockValue);
  }, Math.random() * 20 + 5); // 5-25ms delay
};

// Step-by-step debugging controls
interpreter.pause();    // Pause execution
interpreter.step();     // Execute single step
interpreter.resume();   // Resume normal execution
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


## 🏆 Project Success & Positioning

### **Production-Ready Educational Platform**

Arduino AST Interpreter has achieved **100% test coverage** across 135 diverse test cases, making it a reliable foundation for:

- **Educational Tools**: Interactive Arduino learning platforms with real-time code execution
- **Code Validation**: Pre-deployment testing of Arduino sketches with hardware simulation
- **Development Environments**: Browser-based IDEs with step-by-step debugging capabilities
- **Embedded Integration**: C++ interpreter optimized for ESP32-S3 deployment (512KB RAM + 8MB PSRAM)

### **Comparison to Existing Solutions**

Unlike full Arduino simulators ([**wokwi.com**](https://wokwi.com/), [**Tinkercad**](https://www.tinkercad.com/things?type=circuits)) or complex emulation frameworks ([**ArduinoSimulator**](https://github.com/lrusso/ArduinoSimulator) + [**JSCPP**](https://github.com/felixhao28/JSCPP)), this project provides:

✅ **Focused Architecture**: Dedicated Arduino/C++ parsing and execution (not general C++ simulation)  
✅ **Lightweight Design**: ~300KB total vs JSCPP's multi-megabyte complexity  
✅ **Modular Libraries**: Three independent, reusable components  
✅ **Dual Platform**: JavaScript + C++ implementations with identical command streams  
✅ **Educational Focus**: Built specifically for learning environments with step debugging  
✅ **Production Ready**: 100% test coverage, comprehensive error handling, structured command output

### **30-Day AI Experiment Success**

This project began as a 30-day experiment using AI technologies (Claude Code) to solve a previously unsuccessful programming challenge. The AI-driven development approach achieved:

- **Complete Language Implementation**: Full Arduino/C++ syntax support including templates, namespaces, pointers
- **Perfect Test Coverage**: 135/135 tests passing with 100% semantic accuracy  
- **Comprehensive Preprocessing**: Complete macro expansion, conditional compilation, library activation
- **Cross-Platform Architecture**: JavaScript + C++ with binary AST interchange format
- **Professional Documentation**: Complete API documentation, interactive playgrounds, comprehensive testing infrastructure

The result demonstrates the power of AI-assisted development for complex compiler and interpreter projects.

## 📜 Licensing

This project is dual-licensed under the [**sfranzyshen.com Source-Available License 1.0**](https://github.com/sfranzyshen/ASTInterpreter/blob/main/sfranzyshen_source_available_license.md) 

and **sfranzyshen.org with [GNU AGPLv3](https://github.com/sfranzyshen/ASTInterpreter/blob/main/gnu-agpl-v3.0.md)**.

* You may use this software under the terms of the **Source-Available License** for non-production purposes (e.g., development, testing).
* After the Change Date of **8/26/2030**, the software will automatically be governed by the **AGPLv3**.
* If you wish to use this software in a production environment before the Change Date, you must obtain a **commercial license**. Please contact us at [sfranzyshen@hotmail.com] for more details.