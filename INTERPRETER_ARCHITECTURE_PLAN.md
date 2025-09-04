# Interpreter Architecture

This document describes the architecture of the AST interpreter component of the project. The interpreter's role is to execute an Abstract Syntax Tree (AST) and translate it into a series of hardware-level commands. 

This component has two parallel implementations with a shared design:

-   **`ASTInterpreter.js`**: A mature, feature-rich interpreter for Node.js and browser environments.
-   **`ASTInterpreter.cpp`**: A C++ implementation designed for performance and portability, intended to match the behavior of the JavaScript version.

## Core Responsibilities

The interpreter is responsible for the following tasks:

1.  **AST Traversal**: It walks the nodes of the AST provided by the parser.
    -   The C++ version uses the classic Visitor design pattern.
    -   The JavaScript version uses an asynchronous traversal method.

2.  **Execution Flow Control**: It correctly simulates the Arduino program lifecycle by executing the `setup()` function once, followed by the `loop()` function continuously, up to a configurable limit.

3.  **State Management**: It manages the program's state, including global and local variables, using a stack-based scope manager (`ScopeManager`). This ensures that variables are created and accessed according to C++ scoping rules.

4.  **Hardware & Library Simulation**: It simulates calls to standard Arduino functions (`pinMode`, `digitalWrite`, `delay`) and library functions (`Servo.write`, `NeoPixel.show`) by generating commands.

5.  **Command Generation**: Its primary output is a stream of simple, serializable JSON objects that represent hardware actions. This decouples the interpreter from the hardware itself.

## Key Architectural Components

-   **Interpreter Class (`ASTInterpreter` / `ASTInterpreter`)**: The main engine that orchestrates the entire execution process.

-   **Scope Manager**: A stack-based data structure that holds all declared variables. When a new scope (e.g., a function call) is entered, a new map is pushed onto the stack. When the scope is exited, the map is popped.

-   **Command Protocol**: A defined set of command objects that represent all possible hardware interactions. This is the public API of the interpreter.

-   **Library Interface**: A mechanism for handling calls to library functions. 
    -   In JavaScript, this is a rich, data-driven system (`ARDUINO_LIBRARIES`) that can simulate dozens of methods from popular libraries.
    -   In C++, this is the `ArduinoLibraryInterface` class, which provides a basic framework for this functionality.

-   **Hybrid Asynchronous Execution**: The JavaScript interpreter uses a sophisticated hybrid approach combining two patterns:
    -   **State Machine Pattern**: Used by `digitalRead`, `millis`, `micros` - returns `{type: 'EXECUTION_PAUSED', requestId}` and pauses execution
    -   **Async/Await Pattern**: Used by `analogRead` - uses `await waitForResponse(requestId, 5000)` for timeout handling
    -   **State Preservation**: The `previousExecutionState` mechanism ensures step/resume debugging works correctly across both patterns
    -   **Race Condition Prevention**: Browser environments use 1ms setTimeout delays to prevent Promise resolution timing issues

## Recent Architectural Improvements (September 2025)

### JavaScript Interpreter v6.4.0 Enhancements

**Step/Resume State Preservation System**:
- **Problem**: After fixing browser race conditions with setTimeout delays, step functionality broke - step operations would continue execution like resume
- **Root Cause**: `resumeWithValue()` always set state to `RUNNING`, bypassing step control after external data responses
- **Solution**: Added `previousExecutionState` tracking system
  - Modified `arduinoDigitalRead()`, `arduinoAnalogRead()`, `arduinoMillis()`, `arduinoMicros()` to save previous state
  - Updated `resumeWithValue()` to restore appropriate state (STEPPING → PAUSED, RUNNING → RUNNING)
  - Maintains debugging workflow integrity across hybrid async patterns

**Browser Compatibility Improvements**:
- **Race Condition Fix**: Added 1ms setTimeout delays in playground response handlers
- **Promise Timing**: Prevents synchronous `resumeWithValue()` calls before async `waitForResponse()` setup
- **Cross-Platform Behavior**: Ensures consistent behavior between Node.js and browser environments

**Architecture Preservation**:
- Maintained hybrid state machine + async/await patterns
- Preserved all existing command stream compatibility
- Enhanced debugging capabilities without breaking production workflows
