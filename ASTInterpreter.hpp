/**
 * ASTInterpreter.hpp - C++ Arduino AST Interpreter Core
 * 
 * Main interpreter class that executes parsed AST nodes and generates command streams
 * identical to the JavaScript ASTInterpreter.js implementation. Designed for
 * ESP32-S3 memory constraints and cross-platform compatibility.
 * 
 * Version: 1.0
 * Compatible with: ASTInterpreter.js v6.3.0
 * Command Protocol: CommandProtocol.hpp v1.0
 */

#pragma once

#include "ASTNodes.hpp"
#include "CommandProtocol.hpp"
#include "CompactAST.hpp"
#include "EnhancedInterpreter.hpp"
#include "ArduinoLibraryRegistry.hpp"
#include <memory>
#include <unordered_map>
#include <stack>
#include <vector>
#include <string>
#include <functional>
#include <chrono>
#include <queue>

namespace arduino_interpreter {

// =============================================================================
// FORWARD DECLARATIONS
// =============================================================================

class ASTInterpreter;
class ScopeManager;
class ArduinoLibraryInterface;
class EnhancedScopeManager;

// =============================================================================
// INTERPRETER CONFIGURATION
// =============================================================================

/**
 * Interpreter configuration options matching JavaScript implementation
 */
struct InterpreterOptions {
    bool verbose = false;           // Debug output
    bool debug = false;             // Detailed debug output
    uint32_t stepDelay = 0;         // Delay between steps (ms)
    uint32_t maxLoopIterations = 1000;  // Prevent infinite loops
    uint32_t requestTimeout = 5000; // Request timeout (ms)
    bool enableSerial = true;       // Enable Serial commands
    bool enablePins = true;         // Enable pin operations
    std::string version = "1.0.0";  // Interpreter version
};

/**
 * Variable representation matching JavaScript dynamic typing
 */
struct Variable {
    CommandValue value;
    std::string type;
    bool isConst = false;
    bool isReference = false;
    
    Variable() : value(std::monostate{}), type("undefined") {}
    
    template<typename T>
    Variable(const T& val, const std::string& t = "", bool c = false) 
        : value(val), type(t), isConst(c) {}
    
    template<typename T>
    T getValue() const {
        if (std::holds_alternative<T>(value)) {
            return std::get<T>(value);
        }
        return T{};
    }
    
    void setValue(const CommandValue& val) {
        if (!isConst) {
            value = val;
        }
    }
    
    std::string toString() const {
        return commandValueToString(value) + " (" + type + ")";
    }
};

// =============================================================================
// SCOPE MANAGEMENT
// =============================================================================

/**
 * Variable scope management matching JavaScript scope stack
 */
class ScopeManager {
private:
    std::vector<std::unordered_map<std::string, Variable>> scopes_;
    
public:
    ScopeManager() {
        pushScope(); // Global scope
    }
    
    void pushScope() {
        scopes_.emplace_back();
    }
    
    void popScope() {
        if (scopes_.size() > 1) { // Keep global scope
            scopes_.pop_back();
        }
    }
    
    void setVariable(const std::string& name, const Variable& var) {
        scopes_.back()[name] = var;
    }
    
    Variable* getVariable(const std::string& name) {
        // Search from current scope backwards
        for (auto it = scopes_.rbegin(); it != scopes_.rend(); ++it) {
            auto found = it->find(name);
            if (found != it->end()) {
                return &found->second;
            }
        }
        return nullptr;
    }
    
    bool hasVariable(const std::string& name) const {
        for (auto it = scopes_.rbegin(); it != scopes_.rend(); ++it) {
            if (it->find(name) != it->end()) {
                return true;
            }
        }
        return false;
    }
    
    size_t getScopeDepth() const { return scopes_.size(); }
    
    void clear() {
        scopes_.clear();
        pushScope(); // Global scope
    }
};

// =============================================================================
// REQUEST-RESPONSE SYSTEM
// =============================================================================


// =============================================================================
// MAIN AST INTERPRETER CLASS
// =============================================================================

/**
 * Main Arduino AST Interpreter class
 * Executes AST nodes and generates command streams
 */
class ASTInterpreter : public arduino_ast::ASTVisitor {
private:
    // Core state
    arduino_ast::ASTNodePtr ast_;
    InterpreterOptions options_;
    ExecutionState state_;
    
    // Managers
    std::unique_ptr<ScopeManager> scopeManager_;
    std::unique_ptr<EnhancedScopeManager> enhancedScopeManager_;
    std::unique_ptr<ArduinoLibraryInterface> libraryInterface_;  // Legacy - to be deprecated
    std::unique_ptr<ArduinoLibraryRegistry> libraryRegistry_;    // New comprehensive system
    
    // Command handling
    CommandListener* commandListener_;
    ResponseHandler* responseHandler_;
    std::queue<CommandPtr> commandQueue_;
    
    // Execution control
    bool setupCalled_;
    bool inLoop_;
    uint32_t currentLoopIteration_;
    uint32_t maxLoopIterations_;
    std::chrono::steady_clock::time_point executionStart_;
    
    // Function tracking
    arduino_ast::ASTNode* currentFunction_;
    std::unordered_map<std::string, arduino_ast::ASTNode*> userFunctions_;
    
    // Control flow
    bool shouldBreak_;
    bool shouldContinue_;
    bool shouldReturn_;
    CommandValue returnValue_;
    
    // Switch statement state management
    CommandValue currentSwitchValue_;
    bool inSwitchFallthrough_ = false;
    
    // State machine properties for non-blocking execution
    arduino_ast::ASTNode* suspendedNode_;
    std::string waitingForRequestId_;
    std::string suspendedFunction_;
    CommandValue lastExpressionResult_;

public:
    /**
     * Constructor with AST root node
     */
    explicit ASTInterpreter(arduino_ast::ASTNodePtr ast, 
                           const InterpreterOptions& options = InterpreterOptions{});
    
    /**
     * Constructor with compact binary AST
     */
    explicit ASTInterpreter(const uint8_t* compactAST, size_t size,
                           const InterpreterOptions& options = InterpreterOptions{});
    
    ~ASTInterpreter();
    
    // Non-copyable, movable
    ASTInterpreter(const ASTInterpreter&) = delete;
    ASTInterpreter& operator=(const ASTInterpreter&) = delete;
    ASTInterpreter(ASTInterpreter&&) = default;
    ASTInterpreter& operator=(ASTInterpreter&&) = default;
    
    // =============================================================================
    // EXECUTION CONTROL
    // =============================================================================
    
    /**
     * Start interpreter execution
     * @return true if started successfully
     */
    bool start();
    
    /**
     * Stop interpreter execution
     */
    void stop();
    
    /**
     * Pause execution (can be resumed)
     */
    void pause();
    
    /**
     * Resume paused execution
     */
    void resume();
    
    /**
     * Execute single step (for debugging)
     */
    bool step();
    
    /**
     * State machine execution loop
     */
    void tick();
    
    /**
     * Resume execution with external data response
     * @param requestId The request ID that this response is for
     * @param value The value to resume execution with
     * @return true if the response was accepted
     */
    bool resumeWithValue(const std::string& requestId, const CommandValue& value);
    
    /**
     * Check if interpreter is running
     */
    bool isRunning() const { return state_ == ExecutionState::RUNNING; }
    
    /**
     * Get current execution state
     */
    ExecutionState getState() const { return state_; }
    
    // =============================================================================
    // EVENT HANDLERS
    // =============================================================================
    
    /**
     * Set command listener for receiving commands
     */
    void setCommandListener(CommandListener* listener) { commandListener_ = listener; }
    
    /**
     * Set response handler for request-response operations
     */
    void setResponseHandler(ResponseHandler* handler) { responseHandler_ = handler; }
    
    /**
     * Handle response from external system
     */
    bool handleResponse(const std::string& requestId, const CommandValue& value);
    
    // =============================================================================
    // VISITOR PATTERN IMPLEMENTATION
    // =============================================================================
    
    void visit(arduino_ast::ProgramNode& node) override;
    void visit(arduino_ast::ErrorNode& node) override;
    void visit(arduino_ast::CommentNode& node) override;
    
    void visit(arduino_ast::CompoundStmtNode& node) override;
    void visit(arduino_ast::ExpressionStatement& node) override;
    void visit(arduino_ast::IfStatement& node) override;
    void visit(arduino_ast::WhileStatement& node) override;
    void visit(arduino_ast::DoWhileStatement& node) override;
    void visit(arduino_ast::ForStatement& node) override;
    void visit(arduino_ast::RangeBasedForStatement& node) override;
    void visit(arduino_ast::SwitchStatement& node) override;
    void visit(arduino_ast::CaseStatement& node) override;
    void visit(arduino_ast::ReturnStatement& node) override;
    void visit(arduino_ast::BreakStatement& node) override;
    void visit(arduino_ast::ContinueStatement& node) override;
    
    void visit(arduino_ast::BinaryOpNode& node) override;
    void visit(arduino_ast::UnaryOpNode& node) override;
    void visit(arduino_ast::FuncCallNode& node) override;
    void visit(arduino_ast::MemberAccessNode& node) override;
    void visit(arduino_ast::AssignmentNode& node) override;
    void visit(arduino_ast::PostfixExpressionNode& node) override;
    void visit(arduino_ast::ArrayAccessNode& node) override;
    void visit(arduino_ast::TernaryExpressionNode& node) override;
    void visit(arduino_ast::CommaExpression& node) override;
    
    void visit(arduino_ast::NumberNode& node) override;
    void visit(arduino_ast::StringLiteralNode& node) override;
    void visit(arduino_ast::CharLiteralNode& node) override;
    void visit(arduino_ast::IdentifierNode& node) override;
    void visit(arduino_ast::ConstantNode& node) override;
    void visit(arduino_ast::ArrayInitializerNode& node) override;
    
    void visit(arduino_ast::EmptyStatement& node) override;
    
    void visit(arduino_ast::VarDeclNode& node) override;
    void visit(arduino_ast::FuncDefNode& node) override;
    void visit(arduino_ast::TypeNode& node) override;
    void visit(arduino_ast::DeclaratorNode& node) override;
    void visit(arduino_ast::ParamNode& node) override;
    void visit(arduino_ast::FunctionPointerDeclaratorNode& node) override;
    void visit(arduino_ast::ArrayDeclaratorNode& node) override;
    void visit(arduino_ast::PointerDeclaratorNode& node) override;
    void visit(arduino_ast::StructDeclaration& node) override;
    void visit(arduino_ast::TypedefDeclaration& node) override;
    void visit(arduino_ast::StructType& node) override;
    
    // =============================================================================
    // UTILITY METHODS
    // =============================================================================
    
    /**
     * Get memory usage statistics
     */
    struct MemoryStats {
        size_t totalMemory;
        size_t variableMemory;
        size_t astMemory;
        size_t commandMemory;
        uint32_t variableCount;
        uint32_t pendingRequests;
    };
    
    MemoryStats getMemoryStats() const;
    
    /**
     * Get execution statistics
     */
    struct ExecutionStats {
        std::chrono::milliseconds executionTime;
        uint32_t commandsGenerated;
        uint32_t functionsExecuted;
        uint32_t loopsExecuted;
        uint32_t variablesAccessed;
    };
    
    ExecutionStats getExecutionStats() const;
    
    // =============================================================================
    // TYPE CONVERSION UTILITIES (Public for ArduinoLibraryInterface)
    // =============================================================================
    
    int32_t convertToInt(const CommandValue& value);
    double convertToDouble(const CommandValue& value);
    std::string convertToString(const CommandValue& value);
    bool convertToBool(const CommandValue& value);
    bool isNumeric(const CommandValue& value);
    
private:
    // =============================================================================
    // INTERNAL EXECUTION METHODS
    // =============================================================================
    
    void initializeInterpreter();
    void executeProgram();
    void executeSetup();
    void executeLoop();
    void executeFunctions();
    
    // Expression evaluation
    CommandValue evaluateExpression(arduino_ast::ASTNode* expr);
    CommandValue evaluateBinaryOperation(const std::string& op, const CommandValue& left, const CommandValue& right);
    CommandValue evaluateUnaryOperation(const std::string& op, const CommandValue& operand);
    CommandValue evaluateComparison(const std::string& op, const CommandValue& left, const CommandValue& right);
    CommandValue evaluateLogical(const std::string& op, const CommandValue& left, const CommandValue& right);
    
    // Arduino function handling
    CommandValue executeArduinoFunction(const std::string& name, const std::vector<CommandValue>& args);
    CommandValue executeUserFunction(const std::string& name, const arduino_ast::FuncDefNode* funcDef, const std::vector<CommandValue>& args);
    CommandValue handlePinOperation(const std::string& function, const std::vector<CommandValue>& args);
    CommandValue handleTimingOperation(const std::string& function, const std::vector<CommandValue>& args);
    CommandValue handleSerialOperation(const std::string& function, const std::vector<CommandValue>& args);
    
    // Command emission
    void emitCommand(CommandPtr command);
    void emitError(const std::string& message, const std::string& type = "RuntimeError");
    void emitSystemCommand(CommandType type, const std::string& message);
    
    // Request handling
    CommandValue waitForResponse(const RequestId& requestId);
    void processRequestQueue();
    
    // Control flow helpers
    void enterLoop(const std::string& loopType);
    void exitLoop(const std::string& loopType);
    bool checkLoopLimit();
    void resetControlFlow();
    
    // Memory management
    void cleanupExpiredRequests();
    void optimizeMemoryUsage();
    
    // Debug and logging
    void debugLog(const std::string& message);
    void verboseLog(const std::string& message);
    void logExecutionState(const std::string& context);
    
    // Type conversion utilities
    CommandValue convertToType(const CommandValue& value, const std::string& typeName);
};

// =============================================================================
// ARDUINO LIBRARY INTERFACE
// =============================================================================

/**
 * Interface for Arduino library functions
 * Handles library method calls and object management
 */
class ArduinoLibraryInterface {
private:
    ASTInterpreter* interpreter_;
    std::unordered_map<std::string, std::function<CommandValue(const std::vector<CommandValue>&)>> functions_;
    
public:
    explicit ArduinoLibraryInterface(ASTInterpreter* interpreter) : interpreter_(interpreter) {
        registerStandardFunctions();
    }
    
    /**
     * Call library function
     */
    CommandValue callFunction(const std::string& name, const std::vector<CommandValue>& args);
    
    /**
     * Register custom function
     */
    void registerFunction(const std::string& name, 
                         std::function<CommandValue(const std::vector<CommandValue>&)> func);
    
    /**
     * Check if function exists
     */
    bool hasFunction(const std::string& name) const;
    
private:
    void registerStandardFunctions();
    void registerArduinoCoreFunctions();
    void registerMathFunctions();
    void registerStringFunctions();
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create interpreter from JavaScript-generated compact AST
 */
std::unique_ptr<ASTInterpreter> createInterpreterFromCompactAST(
    const uint8_t* data, size_t size, 
    const InterpreterOptions& options = InterpreterOptions{});

/**
 * Cross-platform compatibility helpers
 */
namespace compat {
    /**
     * Convert JavaScript number to appropriate C++ type
     */
    CommandValue convertJSNumber(double jsNumber);
    
    /**
     * Handle JavaScript-style type coercion
     */
    bool jsTypeCoercionToBool(const CommandValue& value);
    double jsTypeCoercionToNumber(const CommandValue& value);
    std::string jsTypeCoercionToString(const CommandValue& value);
}

} // namespace arduino_interpreter