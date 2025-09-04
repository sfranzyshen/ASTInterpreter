/**
 * CommandProtocol.hpp - C++ Command Protocol for Arduino AST Interpreter
 * 
 * Command types and structures that exactly match the JavaScript ArduinoInterpreter.js
 * implementation. Ensures identical command stream output for cross-platform compatibility.
 * 
 * Version: 1.0
 * Compatible with: ArduinoInterpreter.js v6.3.0
 */

#pragma once

#include <cstdint>
#include <string>
#include <variant>
#include <vector>
#include <memory>
#include <functional>
#include <chrono>

namespace arduino_interpreter {

// =============================================================================
// COMMAND TYPES - MUST MATCH JAVASCRIPT EXACTLY
// =============================================================================

/**
 * Command types matching JavaScript COMMAND_TYPES exactly
 */
enum class CommandType {
    // Pin operations
    PIN_MODE,
    DIGITAL_WRITE,
    DIGITAL_READ,
    ANALOG_WRITE,
    ANALOG_READ,
    
    // Request-response pattern for external data
    ANALOG_READ_REQUEST,
    DIGITAL_READ_REQUEST,
    MILLIS_REQUEST,
    MICROS_REQUEST,
    LIBRARY_METHOD_REQUEST,
    
    // Timing
    DELAY,
    DELAY_MICROSECONDS,
    
    // Variable operations
    VAR_SET,
    VAR_GET,
    
    // Control flow
    FUNCTION_CALL,
    FUNCTION_CALL_WITH_ARGS,
    LOOP_START,
    LOOP_END,
    LOOP_LIMIT_REACHED,
    CONDITION_EVAL,
    
    // Object-oriented programming
    CONSTRUCTOR_CALL,
    
    // Control flow statements
    IF_STATEMENT,
    SWITCH_STATEMENT,
    SWITCH_CASE,
    FOR_LOOP,
    WHILE_LOOP,
    DO_WHILE_LOOP,
    BREAK_STATEMENT,
    CONTINUE_STATEMENT,
    
    // System
    SETUP_START,
    SETUP_END,
    PROGRAM_START,
    PROGRAM_END,
    VERSION_INFO,
    ERROR
};

/**
 * Execution states matching JavaScript EXECUTION_STATE
 */
enum class ExecutionState {
    IDLE,
    RUNNING,
    PAUSED,
    STEPPING,
    ERROR,
    COMPLETE,
    WAITING_FOR_RESPONSE
};

/**
 * Pin modes matching JavaScript PIN_MODES
 */
enum class PinMode {
    INPUT,
    OUTPUT,
    INPUT_PULLUP,
    INPUT_PULLDOWN,
    OUTPUT_OPENDRAIN
};

/**
 * Digital values matching JavaScript DIGITAL_VALUES
 */
enum class DigitalValue {
    LOW = 0,
    HIGH = 1
};

// =============================================================================
// COMMAND VALUE TYPES
// =============================================================================

/**
 * Type-safe value container for command parameters
 * Must handle JavaScript's dynamic typing in a C++ context
 */
// Forward declaration for recursive type
struct CommandValueArray;

using CommandValue = std::variant<
    std::monostate,     // void/undefined
    bool,               // boolean
    int32_t,            // integer (Arduino pins, values)
    double,             // floating point numbers
    std::string         // strings and identifiers
    // TODO: Add array support later with proper recursive handling
>;

/**
 * Request ID for async operations
 * Matches JavaScript's requestId format: "operation_timestamp_random"
 */
struct RequestId {
    std::string operation;
    uint64_t timestamp;
    uint32_t randomId;
    
    std::string toString() const {
        return operation + "_" + std::to_string(timestamp) + "_" + std::to_string(randomId);
    }
    
    static RequestId generate(const std::string& op) {
        auto now = std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()
        ).count();
        
        return RequestId{
            op,
            static_cast<uint64_t>(now),
            static_cast<uint32_t>(rand())
        };
    }
};

// =============================================================================
// COMMAND STRUCTURES
// =============================================================================

// Forward declaration  
std::string commandTypeToString(CommandType type);

/**
 * Base command structure
 */
struct Command {
    CommandType type;
    std::chrono::steady_clock::time_point timestamp;
    
    explicit Command(CommandType t) 
        : type(t), timestamp(std::chrono::steady_clock::now()) {}
    
    virtual ~Command() = default;
    virtual std::string toString() const;
    virtual CommandValue getValue([[maybe_unused]] const std::string& key) const { return std::monostate{}; }
    
    std::string getTypeString() const {
        return commandTypeToString(type);
    }
};

using CommandPtr = std::unique_ptr<Command>;

/**
 * Pin operation commands
 */
struct PinModeCommand : public Command {
    int32_t pin;
    PinMode mode;
    
    PinModeCommand(int32_t p, PinMode m) 
        : Command(CommandType::PIN_MODE), pin(p), mode(m) {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

struct DigitalWriteCommand : public Command {
    int32_t pin;
    DigitalValue value;
    
    DigitalWriteCommand(int32_t p, DigitalValue v) 
        : Command(CommandType::DIGITAL_WRITE), pin(p), value(v) {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

struct AnalogWriteCommand : public Command {
    int32_t pin;
    int32_t value; // 0-255 for PWM
    
    AnalogWriteCommand(int32_t p, int32_t v) 
        : Command(CommandType::ANALOG_WRITE), pin(p), value(v) {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

/**
 * Request-response commands for external data
 */
struct AnalogReadRequestCommand : public Command {
    int32_t pin;
    RequestId requestId;
    
    AnalogReadRequestCommand(int32_t p) 
        : Command(CommandType::ANALOG_READ_REQUEST), pin(p), 
          requestId(RequestId::generate("analogRead")) {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

struct DigitalReadRequestCommand : public Command {
    int32_t pin;
    RequestId requestId;
    
    DigitalReadRequestCommand(int32_t p) 
        : Command(CommandType::DIGITAL_READ_REQUEST), pin(p),
          requestId(RequestId::generate("digitalRead")) {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

struct MillisRequestCommand : public Command {
    RequestId requestId;
    
    MillisRequestCommand() 
        : Command(CommandType::MILLIS_REQUEST),
          requestId(RequestId::generate("millis")) {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

struct MicrosRequestCommand : public Command {
    RequestId requestId;
    
    MicrosRequestCommand() 
        : Command(CommandType::MICROS_REQUEST),
          requestId(RequestId::generate("micros")) {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

/**
 * Timing commands
 */
struct DelayCommand : public Command {
    uint32_t duration; // milliseconds
    
    explicit DelayCommand(uint32_t d) 
        : Command(CommandType::DELAY), duration(d) {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

struct DelayMicrosecondsCommand : public Command {
    uint32_t duration; // microseconds
    
    explicit DelayMicrosecondsCommand(uint32_t d) 
        : Command(CommandType::DELAY_MICROSECONDS), duration(d) {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

/**
 * Variable operation commands
 */
struct VarSetCommand : public Command {
    std::string name;
    CommandValue value;
    
    VarSetCommand(const std::string& n, const CommandValue& v) 
        : Command(CommandType::VAR_SET), name(n), value(v) {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

struct VarGetCommand : public Command {
    std::string name;
    CommandValue result;
    
    explicit VarGetCommand(const std::string& n) 
        : Command(CommandType::VAR_GET), name(n) {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

/**
 * Function call commands
 */
struct FunctionCallCommand : public Command {
    std::string functionName;
    // TODO: Restore arguments when recursive CommandValue is fixed
    // std::vector<CommandValue> arguments;
    
    FunctionCallCommand(const std::string& name /* , const std::vector<CommandValue>& args = {} */) 
        : Command(CommandType::FUNCTION_CALL), functionName(name) /* , arguments(args) */ {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

/**
 * Control flow commands
 */
struct IfStatementCommand : public Command {
    CommandValue condition;
    bool result;
    std::string branch; // "then" or "else"
    
    IfStatementCommand(const CommandValue& cond, bool res, const std::string& br) 
        : Command(CommandType::IF_STATEMENT), condition(cond), result(res), branch(br) {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

struct SwitchStatementCommand : public Command {
    CommandValue discriminant;
    
    explicit SwitchStatementCommand(const CommandValue& disc) 
        : Command(CommandType::SWITCH_STATEMENT), discriminant(disc) {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

struct SwitchCaseCommand : public Command {
    CommandValue caseValue;
    bool matched;
    
    SwitchCaseCommand(const CommandValue& val, bool match) 
        : Command(CommandType::SWITCH_CASE), caseValue(val), matched(match) {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

struct LoopStartCommand : public Command {
    std::string loopType; // "for", "while", "do-while"
    uint32_t iteration;
    
    LoopStartCommand(const std::string& type, uint32_t iter = 0) 
        : Command(CommandType::LOOP_START), loopType(type), iteration(iter) {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

struct LoopEndCommand : public Command {
    std::string loopType;
    uint32_t iteration;
    
    LoopEndCommand(const std::string& type, uint32_t iter) 
        : Command(CommandType::LOOP_END), loopType(type), iteration(iter) {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

/**
 * System commands
 */
struct SystemCommand : public Command {
    std::string message;
    
    SystemCommand(CommandType type, const std::string& msg) 
        : Command(type), message(msg) {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

struct ErrorCommand : public Command {
    std::string errorMessage;
    std::string errorType;
    
    ErrorCommand(const std::string& msg, const std::string& type = "RuntimeError") 
        : Command(CommandType::ERROR), errorMessage(msg), errorType(type) {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

/**
 * Library method commands for Arduino libraries
 */
struct LibraryCommand : public Command {
    std::string libraryName;
    std::string methodName;
    std::string objectId;
    std::vector<std::string> args;
    
    LibraryCommand() : Command(CommandType::LIBRARY_METHOD_REQUEST) {}
    
    std::string toString() const override;
    CommandValue getValue(const std::string& key) const override;
};

// =============================================================================
// COMMAND LISTENER INTERFACE
// =============================================================================

/**
 * Command listener interface matching JavaScript onCommand callback
 */
class CommandListener {
public:
    virtual ~CommandListener() = default;
    virtual void onCommand(const Command& command) = 0;
    virtual void onError(const std::string& error) = 0;
};

/**
 * Response handler interface for request-response pattern
 */
class ResponseHandler {
public:
    virtual ~ResponseHandler() = default;
    virtual void handleResponse(const RequestId& requestId, const CommandValue& value) = 0;
    virtual bool waitForResponse(const RequestId& requestId, CommandValue& result, uint32_t timeoutMs = 5000) = 0;
};

// =============================================================================
// COMMAND FACTORY
// =============================================================================

/**
 * Factory class for creating commands with proper typing
 */
class CommandFactory {
public:
    // Pin operations
    static CommandPtr createPinMode(int32_t pin, PinMode mode);
    static CommandPtr createDigitalWrite(int32_t pin, DigitalValue value);
    static CommandPtr createAnalogWrite(int32_t pin, int32_t value);
    
    // Request commands
    static CommandPtr createAnalogReadRequest(int32_t pin);
    static CommandPtr createDigitalReadRequest(int32_t pin);
    static CommandPtr createMillisRequest();
    static CommandPtr createMicrosRequest();
    
    // Timing
    static CommandPtr createDelay(uint32_t milliseconds);
    static CommandPtr createDelayMicroseconds(uint32_t microseconds);
    
    // Variables
    static CommandPtr createVarSet(const std::string& name, const CommandValue& value);
    static CommandPtr createVarGet(const std::string& name);
    
    // Functions
    static CommandPtr createFunctionCall(const std::string& name /* , const std::vector<CommandValue>& args = {} */);
    
    // Control flow
    static CommandPtr createIfStatement(const CommandValue& condition, bool result, const std::string& branch);
    static CommandPtr createSwitchStatement(const CommandValue& discriminant);
    static CommandPtr createSwitchCase(const CommandValue& caseValue, bool matched);
    static CommandPtr createLoopStart(const std::string& type, uint32_t iteration = 0);
    static CommandPtr createLoopEnd(const std::string& type, uint32_t iteration);
    
    // System
    static CommandPtr createSystemCommand(CommandType type, const std::string& message);
    static CommandPtr createError(const std::string& message, const std::string& type = "RuntimeError");
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert command type to string for debugging
 */
std::string commandTypeToString(CommandType type);

/**
 * Convert execution state to string
 */
std::string executionStateToString(ExecutionState state);

/**
 * Convert pin mode to string
 */
std::string pinModeToString(PinMode mode);

/**
 * Convert command value to string for debugging
 */
std::string commandValueToString(const CommandValue& value);

/**
 * Compare two command values for equality
 */
bool commandValuesEqual(const CommandValue& a, const CommandValue& b);

/**
 * Serialize command to JSON-like format for cross-platform comparison
 */
std::string serializeCommand(const Command& command);

/**
 * Stream operator for ExecutionState enum
 */
inline std::ostream& operator<<(std::ostream& os, ExecutionState state) {
    os << executionStateToString(state);
    return os;
}

} // namespace arduino_interpreter