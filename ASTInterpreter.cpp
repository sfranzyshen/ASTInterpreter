/**
 * ASTInterpreter.cpp - C++ Arduino AST Interpreter Implementation
 * 
 * Core interpreter implementation that executes AST nodes and generates
 * command streams matching JavaScript ASTInterpreter.js exactly.
 * 
 * Version: 1.0
 */

#include "ASTInterpreter.hpp"
#include <iostream>
#include <sstream>
#include <cmath>
#include <algorithm>
// Arduino-compatible headers only - no std::thread for embedded systems
#include <chrono>
#include <random>

using ::EnhancedCommandValue;
using arduino_interpreter::EnhancedScopeManager;
using arduino_interpreter::MemberAccessHelper;

// Disable debug output for command stream parity testing
class NullStream {
public:
    template<typename T>
    NullStream& operator<<(const T&) { return *this; }
    NullStream& operator<<(std::ostream& (*)(std::ostream&)) { return *this; }
};

static NullStream nullStream;
#define DEBUG_OUT std::cout  // Temporarily enable debug for diagnosis

namespace arduino_interpreter {

// =============================================================================
// CONSTRUCTOR AND INITIALIZATION
// =============================================================================

ASTInterpreter::ASTInterpreter(arduino_ast::ASTNodePtr ast, const InterpreterOptions& options)
    : ast_(std::move(ast)), options_(options), state_(ExecutionState::IDLE),
      commandListener_(nullptr), responseHandler_(nullptr),
      setupCalled_(false), inLoop_(false), currentLoopIteration_(0),
      maxLoopIterations_(options.maxLoopIterations), currentFunction_(nullptr),
      shouldBreak_(false), shouldContinue_(false), shouldReturn_(false),
      currentSwitchValue_(std::monostate{}), inSwitchFallthrough_(false),
      suspendedNode_(nullptr), lastExpressionResult_(std::monostate{}),
      // Initialize performance tracking variables
      totalExecutionTime_(0), functionExecutionTime_(0),
      commandsGenerated_(0), errorsGenerated_(0), functionsExecuted_(0),
      userFunctionsExecuted_(0), arduinoFunctionsExecuted_(0),
      loopsExecuted_(0), totalLoopIterations_(0), maxLoopDepth_(0),
      currentLoopDepth_(0), variablesAccessed_(0), variablesModified_(0),
      arrayAccessCount_(0), structAccessCount_(0),
      peakVariableMemory_(0), currentVariableMemory_(0),
      peakCommandMemory_(0), currentCommandMemory_(0),
      pinOperations_(0), analogReads_(0), digitalReads_(0),
      analogWrites_(0), digitalWrites_(0), serialOperations_(0),
      recursionDepth_(0), maxRecursionDepth_(0),
      timeoutOccurrences_(0), memoryAllocations_(0) {
    
    initializeInterpreter();
}

ASTInterpreter::ASTInterpreter(const uint8_t* compactAST, size_t size, const InterpreterOptions& options)
    : options_(options), state_(ExecutionState::IDLE),
      commandListener_(nullptr), responseHandler_(nullptr),
      setupCalled_(false), inLoop_(false), currentLoopIteration_(0),
      maxLoopIterations_(options.maxLoopIterations), currentFunction_(nullptr),
      shouldBreak_(false), shouldContinue_(false), shouldReturn_(false),
      currentSwitchValue_(std::monostate{}), inSwitchFallthrough_(false),
      suspendedNode_(nullptr), lastExpressionResult_(std::monostate{}),
      // Initialize performance tracking variables
      totalExecutionTime_(0), functionExecutionTime_(0),
      commandsGenerated_(0), errorsGenerated_(0), functionsExecuted_(0),
      userFunctionsExecuted_(0), arduinoFunctionsExecuted_(0),
      loopsExecuted_(0), totalLoopIterations_(0), maxLoopDepth_(0),
      currentLoopDepth_(0), variablesAccessed_(0), variablesModified_(0),
      arrayAccessCount_(0), structAccessCount_(0),
      peakVariableMemory_(0), currentVariableMemory_(0),
      peakCommandMemory_(0), currentCommandMemory_(0),
      pinOperations_(0), analogReads_(0), digitalReads_(0),
      analogWrites_(0), digitalWrites_(0), serialOperations_(0),
      recursionDepth_(0), maxRecursionDepth_(0),
      timeoutOccurrences_(0), memoryAllocations_(0) {
    
    DEBUG_OUT << "ASTInterpreter constructor: Creating CompactASTReader..." << std::endl;
    
    // Parse compact AST
    arduino_ast::CompactASTReader reader(compactAST, size);
    DEBUG_OUT << "ASTInterpreter constructor: Parsing AST..." << std::endl;
    ast_ = reader.parse();
    
    DEBUG_OUT << "ASTInterpreter constructor: AST parsed, initializing interpreter..." << std::endl;
    initializeInterpreter();
    DEBUG_OUT << "ASTInterpreter constructor: Initialization complete" << std::endl;
}

ASTInterpreter::~ASTInterpreter() {
    stop();
}

void ASTInterpreter::initializeInterpreter() {
    scopeManager_ = std::make_unique<ScopeManager>();
    enhancedScopeManager_ = std::make_unique<EnhancedScopeManager>();
    libraryInterface_ = std::make_unique<ArduinoLibraryInterface>(this);  // Legacy
    libraryRegistry_ = std::make_unique<ArduinoLibraryRegistry>(this);   // New system
    
    // Initialize loop iteration counter to 0 (will be incremented before each iteration)
    currentLoopIteration_ = 0;
    
    // Initialize Arduino constants
    scopeManager_->setVariable("HIGH", Variable(static_cast<int32_t>(1), "int", true));
    scopeManager_->setVariable("LOW", Variable(static_cast<int32_t>(0), "int", true));
    scopeManager_->setVariable("INPUT", Variable(static_cast<int32_t>(0), "int", true));
    scopeManager_->setVariable("OUTPUT", Variable(static_cast<int32_t>(1), "int", true));
    scopeManager_->setVariable("INPUT_PULLUP", Variable(static_cast<int32_t>(2), "int", true));
    scopeManager_->setVariable("LED_BUILTIN", Variable(static_cast<int32_t>(13), "int", true));
    
    debugLog("Interpreter initialized with " + std::to_string(maxLoopIterations_) + " max loop iterations");
}

// =============================================================================
// EXECUTION CONTROL
// =============================================================================

bool ASTInterpreter::start() {
    if (state_ == ExecutionState::RUNNING) {
        return false; // Already running
    }
    
    if (!ast_) {
        emitError("No AST to execute");
        return false;
    }
    
    state_ = ExecutionState::RUNNING;
    executionStart_ = std::chrono::steady_clock::now();
    totalExecutionStart_ = std::chrono::steady_clock::now();
    
    // Emit VERSION_INFO first, then PROGRAM_START (matches JavaScript order)
    emitSystemCommand(CommandType::VERSION_INFO, options_.version);
    emitSystemCommand(CommandType::PROGRAM_START, "Program execution started");
    
    try {
        executeProgram();
        
        if (state_ == ExecutionState::RUNNING) {
            state_ = ExecutionState::COMPLETE;
            emitSystemCommand(CommandType::PROGRAM_END, "Program execution completed");
        }
        
        // Calculate total execution time
        auto now = std::chrono::steady_clock::now();
        totalExecutionTime_ += std::chrono::duration_cast<std::chrono::milliseconds>(now - totalExecutionStart_);
        
        // Always emit final PROGRAM_END when stopped (matches JavaScript behavior)
        emitSystemCommand(CommandType::PROGRAM_END, "Program execution stopped");
        
        return true;
        
    } catch (const std::exception& e) {
        state_ = ExecutionState::ERROR;
        emitError(e.what());
        return false;
    }
}

void ASTInterpreter::stop() {
    if (state_ == ExecutionState::RUNNING || state_ == ExecutionState::PAUSED) {
        state_ = ExecutionState::IDLE;
        resetControlFlow();
        debugLog("Interpreter stopped");
    }
}

void ASTInterpreter::pause() {
    if (state_ == ExecutionState::RUNNING) {
        state_ = ExecutionState::PAUSED;
        debugLog("Interpreter paused");
    }
}

void ASTInterpreter::resume() {
    if (state_ == ExecutionState::PAUSED) {
        state_ = ExecutionState::RUNNING;
        debugLog("Interpreter resumed");
    }
}

bool ASTInterpreter::step() {
    if (state_ != ExecutionState::PAUSED) {
        return false;
    }
    
    state_ = ExecutionState::STEPPING;
    // Execute single step logic would go here
    state_ = ExecutionState::PAUSED;
    
    return true;
}

// =============================================================================
// MAIN EXECUTION METHODS
// =============================================================================

void ASTInterpreter::executeProgram() {
    if (!ast_) return;
    
    debugLog("Starting program execution");
    
    // First pass: collect function definitions
    executeFunctions();
    
    // Execute setup() if found
    executeSetup();
    
    // Execute loop() continuously
    executeLoop();
}

void ASTInterpreter::executeFunctions() {
    DEBUG_OUT << "executeFunctions: Starting to collect function definitions..." << std::endl;
    if (!ast_) {
        DEBUG_OUT << "executeFunctions: ERROR - ast_ is null!" << std::endl;
        return;
    }
    DEBUG_OUT << "executeFunctions: AST is valid, calling accept..." << std::endl;
    
    // Visit AST to collect function definitions
    ast_->accept(*this);
    
    DEBUG_OUT << "executeFunctions: accept() completed successfully" << std::endl;
}

void ASTInterpreter::executeSetup() {
    // MEMORY SAFE: Look up function in AST instead of storing raw pointer
    if (userFunctionNames_.count("setup") > 0) {
        auto* setupFunc = findFunctionInAST("setup");
        if (setupFunc) {
            debugLog("Executing setup() function");
            emitSystemCommand(CommandType::SETUP_START, "Entering setup()");
            
            scopeManager_->pushScope();
            currentFunction_ = setupFunc;
            
            // Execute the function BODY, not the function definition
            if (auto* funcDef = dynamic_cast<const arduino_ast::FuncDefNode*>(setupFunc)) {
                const auto* body = funcDef->getBody();
                if (body) {
                    const_cast<arduino_ast::ASTNode*>(body)->accept(*this);
                } else {
                    debugLog("Setup function has no body");
                }
            } else {
                debugLog("Setup function is not a FuncDefNode");
            }
            
            currentFunction_ = nullptr;
            scopeManager_->popScope();
            
            setupCalled_ = true;
            emitSystemCommand(CommandType::SETUP_END, "Exiting setup()");
        }
    } else {
        debugLog("No setup() function found");
    }
}

void ASTInterpreter::executeLoop() {
    // MEMORY SAFE: Look up function in AST instead of storing raw pointer
    if (userFunctionNames_.count("loop") > 0) {
        auto* loopFunc = findFunctionInAST("loop");
        if (loopFunc) {
            debugLog("Starting loop() execution");
            
            // Emit main loop start command
            emitCommand(CommandFactory::createLoopStart("main", 0));
            
            while (state_ == ExecutionState::RUNNING && currentLoopIteration_ < maxLoopIterations_) {
                // Increment iteration counter BEFORE processing (to match JS 1-based counting)
                currentLoopIteration_++;
                
                // Emit loop iteration start command
                emitCommand(CommandFactory::createLoopStart("loop", currentLoopIteration_));
                
                // Emit function call start command
                emitCommand(CommandFactory::createFunctionCall("loop"));
                
                scopeManager_->pushScope();
                currentFunction_ = loopFunc;
                
                try {
                    // Execute the function BODY, not the function definition
                    if (auto* funcDef = dynamic_cast<const arduino_ast::FuncDefNode*>(loopFunc)) {
                        const auto* body = funcDef->getBody();
                        if (body) {
                            const_cast<arduino_ast::ASTNode*>(body)->accept(*this);
                        } else {
                            debugLog("Loop function has no body");
                        }
                    } else {
                        debugLog("Loop function is not a FuncDefNode");
                    }
                } catch (const std::exception& e) {
                    emitError("Error in loop(): " + std::string(e.what()));
                    break;
                }
                
                currentFunction_ = nullptr;
                scopeManager_->popScope();
                
                // Emit function call end command
                emitCommand(CommandFactory::createFunctionCall("loop"));
                
                // Handle step delay - for Arduino, delays should be handled by parent application
                // The tick() method should return quickly and let the parent handle timing
                // Note: stepDelay is available in options_ if parent needs it
                
                // Process any pending requests
                processResponseQueue();
            } // End while loop
        }
        
        // Emit main loop end command (JavaScript emits LOOP_END instead of LOOP_LIMIT_REACHED)
        emitCommand(CommandFactory::createLoopEnd("main", currentLoopIteration_));
    } else {
        debugLog("No loop() function found");
    }
}

// =============================================================================
// VISITOR IMPLEMENTATIONS - CORE NODES
// =============================================================================

void ASTInterpreter::visit(arduino_ast::ProgramNode& node) {
    DEBUG_OUT << "visit(ProgramNode): Starting to visit ProgramNode" << std::endl;
    debugLog("Visiting ProgramNode");
    
    DEBUG_OUT << "visit(ProgramNode): Getting children..." << std::endl;
    const auto& children = node.getChildren();
    DEBUG_OUT << "visit(ProgramNode): Found " << children.size() << " children" << std::endl;
    
    for (size_t i = 0; i < children.size(); ++i) {
        DEBUG_OUT << "visit(ProgramNode): Processing child " << i << std::endl;
        if (state_ != ExecutionState::RUNNING) {
            DEBUG_OUT << "visit(ProgramNode): State changed, breaking" << std::endl;
            break;
        }
        
        const auto& child = children[i];
        if (!child) {
            DEBUG_OUT << "visit(ProgramNode): ERROR - child " << i << " is null!" << std::endl;
            continue;
        }
        
        DEBUG_OUT << "visit(ProgramNode): Calling accept on child " << i << std::endl;
        child->accept(*this);
        DEBUG_OUT << "visit(ProgramNode): Child " << i << " accept completed" << std::endl;
    }
    
    DEBUG_OUT << "visit(ProgramNode): All children processed" << std::endl;
}

void ASTInterpreter::visit(arduino_ast::ErrorNode& node) {
    emitError("Parse error: " + node.getMessage());
}

void ASTInterpreter::visit(arduino_ast::CommentNode& node) {
    // Comments are ignored during execution
}

void ASTInterpreter::visit(arduino_ast::CompoundStmtNode& node) {
    debugLog("Visiting CompoundStmtNode");
    
    const auto& children = node.getChildren();
    DEBUG_OUT << "CompoundStmtNode has " << children.size() << " children" << std::endl;
    
    for (size_t i = 0; i < children.size(); ++i) {
        if (state_ != ExecutionState::RUNNING || shouldBreak_ || shouldContinue_ || shouldReturn_) {
            break;
        }
        
        const auto& child = children[i];
        DEBUG_OUT << "Processing compound child " << i << ": " << (child ? arduino_ast::nodeTypeToString(child->getType()) : "null") << std::endl;
        
        if (child) {
            child->accept(*this);
        }
    }
}

void ASTInterpreter::visit(arduino_ast::ExpressionStatement& node) {
    if (node.getExpression()) {
        evaluateExpression(const_cast<arduino_ast::ASTNode*>(node.getExpression()));
    }
}

// =============================================================================
// VISITOR IMPLEMENTATIONS - CONTROL FLOW
// =============================================================================

void ASTInterpreter::visit(arduino_ast::IfStatement& node) {
    if (!node.getCondition()) return;
    
    CommandValue conditionValue = evaluateExpression(const_cast<arduino_ast::ASTNode*>(node.getCondition()));
    bool result = convertToBool(conditionValue);
    
    std::string branch = result ? "then" : "else";
    emitCommand(CommandFactory::createIfStatement(conditionValue, result, branch));
    
    if (result && node.getConsequent()) {
        const_cast<arduino_ast::ASTNode*>(node.getConsequent())->accept(*this);
    } else if (!result && node.getAlternate()) {
        const_cast<arduino_ast::ASTNode*>(node.getAlternate())->accept(*this);
    }
}

void ASTInterpreter::visit(arduino_ast::WhileStatement& node) {
    if (!node.getCondition() || !node.getBody()) return;
    
    std::string loopType = "while";
    uint32_t iteration = 0;
    
    while (state_ == ExecutionState::RUNNING && iteration < maxLoopIterations_) {
        CommandValue conditionValue = evaluateExpression(const_cast<arduino_ast::ASTNode*>(node.getCondition()));
        bool shouldContinueLoop = convertToBool(conditionValue);
        
        if (!shouldContinueLoop) break;
        
        emitCommand(CommandFactory::createLoopStart(loopType, iteration));
        
        scopeManager_->pushScope();
        shouldBreak_ = false;
        shouldContinue_ = false;
        
        const_cast<arduino_ast::ASTNode*>(node.getBody())->accept(*this);
        
        scopeManager_->popScope();
        
        emitCommand(CommandFactory::createLoopEnd(loopType, iteration));
        
        if (shouldBreak_) {
            shouldBreak_ = false;
            break;
        }
        
        if (shouldContinue_) {
            shouldContinue_ = false;
        }
        
        iteration++;
    }
    
    if (iteration >= maxLoopIterations_) {
        emitSystemCommand(CommandType::LOOP_LIMIT_REACHED, 
                        "While loop limit reached: " + std::to_string(maxLoopIterations_));
    }
}

void ASTInterpreter::visit(arduino_ast::DoWhileStatement& node) {
    if (!node.getBody() || !node.getCondition()) return;
    
    std::string loopType = "do-while";
    uint32_t iteration = 0;
    
    do {
        emitCommand(CommandFactory::createLoopStart(loopType, iteration));
        
        scopeManager_->pushScope();
        shouldBreak_ = false;
        shouldContinue_ = false;
        
        const_cast<arduino_ast::ASTNode*>(node.getBody())->accept(*this);
        
        scopeManager_->popScope();
        
        emitCommand(CommandFactory::createLoopEnd(loopType, iteration));
        
        if (shouldBreak_) {
            shouldBreak_ = false;
            break;
        }
        
        if (shouldContinue_) {
            shouldContinue_ = false;
        }
        
        CommandValue conditionValue = evaluateExpression(const_cast<arduino_ast::ASTNode*>(node.getCondition()));
        bool shouldContinueLoop = convertToBool(conditionValue);
        
        if (!shouldContinueLoop) break;
        
        iteration++;
        
    } while (state_ == ExecutionState::RUNNING && iteration < maxLoopIterations_);
    
    if (iteration >= maxLoopIterations_) {
        emitSystemCommand(CommandType::LOOP_LIMIT_REACHED, 
                        "Do-while loop limit reached: " + std::to_string(maxLoopIterations_));
    }
}

void ASTInterpreter::visit(arduino_ast::ForStatement& node) {
    std::string loopType = "for";
    uint32_t iteration = 0;
    
    scopeManager_->pushScope();
    
    // Execute initializer
    if (node.getInitializer()) {
        const_cast<arduino_ast::ASTNode*>(node.getInitializer())->accept(*this);
    }
    
    while (state_ == ExecutionState::RUNNING && iteration < maxLoopIterations_) {
        // Check condition
        bool shouldContinueLoop = true;
        if (node.getCondition()) {
            CommandValue conditionValue = evaluateExpression(const_cast<arduino_ast::ASTNode*>(node.getCondition()));
            shouldContinueLoop = convertToBool(conditionValue);
        }
        
        if (!shouldContinueLoop) break;
        
        emitCommand(CommandFactory::createLoopStart(loopType, iteration));
        
        shouldBreak_ = false;
        shouldContinue_ = false;
        
        // Execute body
        if (node.getBody()) {
            const_cast<arduino_ast::ASTNode*>(node.getBody())->accept(*this);
        }
        
        emitCommand(CommandFactory::createLoopEnd(loopType, iteration));
        
        if (shouldBreak_) {
            shouldBreak_ = false;
            break;
        }
        
        // Execute increment
        if (node.getIncrement()) {
            const_cast<arduino_ast::ASTNode*>(node.getIncrement())->accept(*this);
        }
        
        if (shouldContinue_) {
            shouldContinue_ = false;
        }
        
        iteration++;
    }
    
    scopeManager_->popScope();
    
    if (iteration >= maxLoopIterations_) {
        emitSystemCommand(CommandType::LOOP_LIMIT_REACHED, 
                        "For loop limit reached: " + std::to_string(maxLoopIterations_));
    }
}

void ASTInterpreter::visit(arduino_ast::ReturnStatement& node) {
    shouldReturn_ = true;
    
    if (node.getReturnValue()) {
        returnValue_ = evaluateExpression(const_cast<arduino_ast::ASTNode*>(node.getReturnValue()));
    } else {
        returnValue_ = std::monostate{};
    }
}

void ASTInterpreter::visit(arduino_ast::BreakStatement& node) {
    shouldBreak_ = true;
    emitSystemCommand(CommandType::BREAK_STATEMENT, "break");
}

void ASTInterpreter::visit(arduino_ast::ContinueStatement& node) {
    shouldContinue_ = true;
    emitSystemCommand(CommandType::CONTINUE_STATEMENT, "continue");
}

// =============================================================================
// VISITOR IMPLEMENTATIONS - EXPRESSIONS
// =============================================================================

void ASTInterpreter::visit(arduino_ast::BinaryOpNode& node) {
    // Binary operations are handled by evaluateExpression
    // This visitor method is called when binary ops are statements
}

void ASTInterpreter::visit(arduino_ast::UnaryOpNode& node) {
    // Unary operations are handled by evaluateExpression
}

void ASTInterpreter::visit(arduino_ast::FuncCallNode& node) {
    if (!node.getCallee()) return;
    
    // Get function name
    std::string functionName;
    if (const auto* identifier = dynamic_cast<const arduino_ast::IdentifierNode*>(node.getCallee())) {
        functionName = identifier->getName();
    }
    
    // Evaluate arguments
    std::vector<CommandValue> args;
    for (const auto& arg : node.getArguments()) {
        args.push_back(evaluateExpression(arg.get()));
    }
    
    // Check for user-defined function first - MEMORY SAFE
    if (userFunctionNames_.count(functionName) > 0) {
        auto* userFunc = findFunctionInAST(functionName);
        if (userFunc) {
            // Execute user-defined function
            executeUserFunction(functionName, dynamic_cast<const arduino_ast::FuncDefNode*>(userFunc), args);
        }
    } else {
        // Fall back to Arduino/built-in functions
        // Store current node in case function suspends execution
        const arduino_ast::ASTNode* previousSuspendedNode = suspendedNode_;
        
        executeArduinoFunction(functionName, args);
        
        // If function suspended (state changed to WAITING_FOR_RESPONSE), set the suspended node
        if (state_ == ExecutionState::WAITING_FOR_RESPONSE && suspendedNode_ == nullptr) {
            suspendedNode_ = &node;
            debugLog("FuncCallNode: Set suspended node for async function: " + functionName);
        }
    }
}

void ASTInterpreter::visit(arduino_ast::ConstructorCallNode& node) {
    if (!node.getCallee()) return;
    
    // Get constructor name
    std::string constructorName;
    if (const auto* identifier = dynamic_cast<const arduino_ast::IdentifierNode*>(node.getCallee())) {
        constructorName = identifier->getName();
    }
    
    // Evaluate arguments
    std::vector<CommandValue> args;
    for (const auto& arg : node.getArguments()) {
        args.push_back(evaluateExpression(arg.get()));
    }
    
    // Handle constructor calls as library function calls
    // Arduino constructors are typically handled by the library system
    debugLog("ConstructorCallNode: Calling constructor: " + constructorName);
    
    // Execute as Arduino/library function
    const arduino_ast::ASTNode* previousSuspendedNode = suspendedNode_;
    
    executeArduinoFunction(constructorName, args);
    
    // If function suspended (state changed to WAITING_FOR_RESPONSE), set the suspended node
    if (state_ == ExecutionState::WAITING_FOR_RESPONSE && suspendedNode_ == nullptr) {
        suspendedNode_ = &node;
        debugLog("ConstructorCallNode: Set suspended node for async constructor: " + constructorName);
    }
}

void ASTInterpreter::visit(arduino_ast::MemberAccessNode& node) {
    debugLog("Visiting MemberAccessNode");
    
    try {
        // COMPLETE IMPLEMENTATION: Struct member access support
        
        if (!node.getObject() || !node.getProperty()) {
            emitError("Invalid member access: missing object or property");
            lastExpressionResult_ = std::monostate{};
            return;
        }
        
        // Get object - support both simple identifiers and nested member access
        EnhancedCommandValue objectValue;
        std::string objectName;
        
        if (const auto* identifier = dynamic_cast<const arduino_ast::IdentifierNode*>(node.getObject())) {
            // Simple identifier: obj.member
            objectName = identifier->getName();
            Variable* objectVar = scopeManager_->getVariable(objectName);
            if (objectVar) {
                objectValue = upgradeCommandValue(objectVar->value);
            } else {
                emitError("Object variable '" + objectName + "' not found");
                lastExpressionResult_ = std::monostate{};
                return;
            }
        } else if (const auto* nestedAccess = dynamic_cast<const arduino_ast::MemberAccessNode*>(node.getObject())) {
            // Nested member access: obj.member.submember
            debugLog("Handling nested member access");
            
            // Recursively evaluate the nested access first
            const_cast<arduino_ast::MemberAccessNode*>(nestedAccess)->accept(*this);
            objectValue = upgradeCommandValue(lastExpressionResult_);
            objectName = "nested_object"; // Placeholder name for nested access
        } else {
            emitError("Unsupported object expression in member access");
            lastExpressionResult_ = std::monostate{};
            return;
        }
        
        // Get property name
        std::string propertyName;
        if (const auto* propIdentifier = dynamic_cast<const arduino_ast::IdentifierNode*>(node.getProperty())) {
            propertyName = propIdentifier->getName();
        } else {
            emitError("Property must be an identifier");
            lastExpressionResult_ = std::monostate{};
            return;
        }
        
        std::string accessOp = node.getAccessOperator();
        debugLog("Member access: " + objectName + accessOp + propertyName);
        
        // Handle different types of member access operations
        EnhancedCommandValue result;
        
        if (accessOp == ".") {
            // Struct member access (obj.member)
            if (isStructType(objectValue)) {
                auto structPtr = std::get<std::shared_ptr<ArduinoStruct>>(objectValue);
                if (structPtr && structPtr->hasMember(propertyName)) {
                    result = structPtr->getMember(propertyName);
                } else {
                    emitError("Struct member '" + propertyName + "' not found");
                    lastExpressionResult_ = std::monostate{};
                    return;
                }
            } else {
                // Use enhanced member access system for other object types
                result = MemberAccessHelper::getMemberValue(enhancedScopeManager_.get(), objectName, propertyName);
            }
        } else if (accessOp == "->") {
            // Pointer member access (ptr->member)
            if (isPointerType(objectValue)) {
                auto pointerPtr = std::get<std::shared_ptr<ArduinoPointer>>(objectValue);
                if (pointerPtr && !pointerPtr->isNull()) {
                    EnhancedCommandValue derefValue = pointerPtr->dereference();
                    if (isStructType(derefValue)) {
                        auto structPtr = std::get<std::shared_ptr<ArduinoStruct>>(derefValue);
                        if (structPtr && structPtr->hasMember(propertyName)) {
                            result = structPtr->getMember(propertyName);
                        } else {
                            emitError("Struct member '" + propertyName + "' not found in dereferenced pointer");
                            lastExpressionResult_ = std::monostate{};
                            return;
                        }
                    } else {
                        emitError("Cannot access member of non-struct through pointer");
                        lastExpressionResult_ = std::monostate{};
                        return;
                    }
                } else {
                    emitError("Cannot dereference null pointer");
                    lastExpressionResult_ = std::monostate{};
                    return;
                }
            } else {
                emitError("-> operator requires pointer type");
                lastExpressionResult_ = std::monostate{};
                return;
            }
        } else {
            emitError("Unsupported access operator: " + accessOp);
            lastExpressionResult_ = std::monostate{};
            return;
        }
        
        // Convert EnhancedCommandValue back to CommandValue for compatibility
        lastExpressionResult_ = downgradeCommandValue(result);
        debugLog("Member access result: " + enhancedCommandValueToString(result));
        
    } catch (const std::exception& e) {
        emitError("Member access error: " + std::string(e.what()));
        lastExpressionResult_ = std::monostate{};
    }
}

// =============================================================================
// VISITOR IMPLEMENTATIONS - LITERALS
// =============================================================================

void ASTInterpreter::visit(arduino_ast::NumberNode& node) {
    // Numbers are handled by evaluateExpression
}

void ASTInterpreter::visit(arduino_ast::StringLiteralNode& node) {
    // Strings are handled by evaluateExpression
}

void ASTInterpreter::visit(arduino_ast::IdentifierNode& node) {
    // Identifiers are handled by evaluateExpression
}

// =============================================================================
// VISITOR IMPLEMENTATIONS - DECLARATIONS
// =============================================================================

void ASTInterpreter::visit(arduino_ast::VarDeclNode& node) {
    debugLog("Declaring variable");
    
    // Get type information from TypeNode
    const auto* typeNode = node.getVarType();
    std::string typeName = "int"; // Default fallback
    debugLog(std::string("TypeNode pointer: ") + (typeNode ? "valid" : "null"));
    if (typeNode) {
        debugLog("TypeNode type: " + std::to_string(static_cast<int>(typeNode->getType())));
        try {
            typeName = typeNode->getValueAs<std::string>();
            debugLog("TypeNode value read as string: '" + typeName + "'");
        } catch (const std::exception& e) {
            debugLog("ERROR reading TypeNode value: " + std::string(e.what()));
            typeName = "int"; // fallback
        }
        if (typeName.empty()) {
            debugLog("TypeNode value is empty, using default 'int'");
            typeName = "int";
        }
    } else {
        debugLog("TypeNode is null, using default 'int'");
    }
    
    // Process declarations
    debugLog("VarDeclNode has " + std::to_string(node.getDeclarations().size()) + " declarations");
    for (size_t i = 0; i < node.getDeclarations().size(); ++i) {
        const auto& declarator = node.getDeclarations()[i];
        debugLog("Processing declaration " + std::to_string(i));
        if (!declarator) {
            debugLog("Declaration " + std::to_string(i) + " is null");
            continue;
        }
        debugLog("Declaration " + std::to_string(i) + " type: " + std::to_string(static_cast<int>(declarator->getType())));
        
        if (auto* declNode = dynamic_cast<arduino_ast::DeclaratorNode*>(declarator.get())) {
            std::string varName = declNode->getName();
            
            debugLog("=== DEBUGGING DECLARATOR NODE ===");
            debugLog("Variable name: " + varName);
            debugLog("DeclaratorNode children count: " + std::to_string(declNode->getChildren().size()));
            
            // Debug: Print each child node type
            const auto& children = declNode->getChildren();
            for (size_t i = 0; i < children.size(); ++i) {
                if (children[i]) {
                    debugLog("Child " + std::to_string(i) + " type: " + std::to_string(static_cast<int>(children[i]->getType())));
                } else {
                    debugLog("Child " + std::to_string(i) + " is null");
                }
            }
            
            // Initialize with default value first
            CommandValue initialValue;
            if (typeName == "int" || typeName == "unsigned int" || typeName == "byte") {
                initialValue = 0;
            } else if (typeName == "float" || typeName == "double") {
                initialValue = 0.0;
            } else if (typeName == "bool") {
                initialValue = false;
            } else if (typeName == "String" || typeName == "char*") {
                initialValue = std::string("");
            } else {
                initialValue = 0; // Default to 0 for unknown types
            }
            
            debugLog("Default value set: " + commandValueToString(initialValue));
            
            // Check for initializer in children
            // In the CompactAST format, initializers should be stored as the first child
            if (!children.empty()) {
                // Evaluate the initializer expression
                debugLog("Processing initializer for variable: " + varName);
                debugLog("Initializer node type: " + std::to_string(static_cast<int>(children[0]->getType())));
                debugLog("About to call evaluateExpression...");
                initialValue = evaluateExpression(const_cast<arduino_ast::ASTNode*>(children[0].get()));
                debugLog("evaluateExpression returned: " + commandValueToString(initialValue));
                debugLog("Variable " + varName + " initialized with value: " + commandValueToString(initialValue));
            } else {
                debugLog("No initializer found for variable: " + varName);
            }
            
            debugLog("=== END DEBUGGING ===");
            
            // Convert initialValue to the declared type
            CommandValue typedValue = convertToType(initialValue, typeName);
            debugLog("Type conversion: " + commandValueToString(initialValue) + " -> " + commandValueToString(typedValue) + " (" + typeName + ")");
            
            // Parse variable modifiers from type name
            bool isConst = typeName.find("const") != std::string::npos;
            bool isStatic = typeName.find("static") != std::string::npos;
            bool isReference = typeName.find("&") != std::string::npos;
            
            // Extract clean type name without modifiers
            std::string cleanTypeName = typeName;
            if (isConst) {
                size_t pos = cleanTypeName.find("const");
                if (pos != std::string::npos) {
                    cleanTypeName.erase(pos, 5); // Remove "const"
                }
            }
            if (isStatic) {
                size_t pos = cleanTypeName.find("static");
                if (pos != std::string::npos) {
                    cleanTypeName.erase(pos, 6); // Remove "static"
                }
            }
            if (isReference) {
                size_t pos = cleanTypeName.find("&");
                if (pos != std::string::npos) {
                    cleanTypeName.erase(pos, 1); // Remove "&"
                }
            }
            
            // Trim whitespace
            cleanTypeName.erase(0, cleanTypeName.find_first_not_of(" \t"));
            cleanTypeName.erase(cleanTypeName.find_last_not_of(" \t") + 1);
            
            // Check for template types (e.g., "vector<int>")
            std::string templateType = "";
            if (cleanTypeName.find("<") != std::string::npos && cleanTypeName.find(">") != std::string::npos) {
                templateType = cleanTypeName;
                // Extract base type (e.g., "vector" from "vector<int>")
                size_t templateStart = cleanTypeName.find("<");
                cleanTypeName = cleanTypeName.substr(0, templateStart);
            }
            
            // Create enhanced variable with modifiers
            bool isGlobal = scopeManager_->isGlobalScope();
            Variable var(typedValue, cleanTypeName, isConst, isReference, isStatic, isGlobal);
            
            if (!templateType.empty()) {
                var.templateType = templateType;
            }
            
            debugLog("Enhanced variable attributes: const=" + std::to_string(isConst) + 
                    ", static=" + std::to_string(isStatic) + 
                    ", reference=" + std::to_string(isReference) + 
                    ", global=" + std::to_string(isGlobal) + 
                    ", template=" + templateType);
            
            // Handle reference variables
            if (isReference && !children.empty()) {
                // For reference variables, try to find the target variable
                if (auto* identifierNode = dynamic_cast<arduino_ast::IdentifierNode*>(children[0].get())) {
                    std::string targetName = identifierNode->getName();
                    if (scopeManager_->createReference(varName, targetName)) {
                        debugLog("Created reference variable: " + varName + " -> " + targetName);
                    } else {
                        emitError("Cannot create reference to undefined variable: " + targetName);
                    }
                    return;
                }
            }
            
            // Store variable using enhanced scope manager
            if (!templateType.empty()) {
                scopeManager_->setTemplateVariable(varName, var, templateType);
            } else {
                scopeManager_->setVariable(varName, var);
            }
            
            debugLog("Declared variable: " + varName + " (" + typeName + ") = " + commandValueToString(typedValue));
        } else {
            debugLog("Declaration " + std::to_string(i) + " is not a DeclaratorNode, skipping");
        }
    }
}

void ASTInterpreter::visit(arduino_ast::FuncDefNode& node) {
    DEBUG_OUT << "visit(FuncDefNode): Starting to visit FuncDefNode" << std::endl;
    
    auto declarator = node.getDeclarator();
    DEBUG_OUT << "visit(FuncDefNode): Declarator pointer: " << (declarator ? "valid" : "null") << std::endl;
    
    if (!declarator) {
        DEBUG_OUT << "visit(FuncDefNode): No declarator found, returning" << std::endl;
        return;
    }
    
    // Extract function name
    std::string functionName;
    
    // Try DeclaratorNode first (more likely)
    if (const auto* declNode = dynamic_cast<const arduino_ast::DeclaratorNode*>(declarator)) {
        functionName = declNode->getName();
        DEBUG_OUT << "visit(FuncDefNode): Found DeclaratorNode with name: " << functionName << std::endl;
    }
    // Fallback to IdentifierNode
    else if (const auto* identifier = dynamic_cast<const arduino_ast::IdentifierNode*>(declarator)) {
        functionName = identifier->getName();
        DEBUG_OUT << "visit(FuncDefNode): Found IdentifierNode with name: " << functionName << std::endl;
    } else {
        DEBUG_OUT << "visit(FuncDefNode): Declarator is not DeclaratorNode or IdentifierNode" << std::endl;
    }
    
    if (!functionName.empty()) {
        // MEMORY SAFE: Store function name instead of raw pointer
        userFunctionNames_.insert(functionName);
        DEBUG_OUT << "visit(FuncDefNode): Registered function: " << functionName << std::endl;
        debugLog("Registered function: " + functionName);
    } else {
        DEBUG_OUT << "visit(FuncDefNode): Function name is empty" << std::endl;
    }
}

void ASTInterpreter::visit(arduino_ast::TypeNode& node) {
    // Type nodes are handled during declaration processing
}

void ASTInterpreter::visit(arduino_ast::DeclaratorNode& node) {
    // Declarator nodes are handled during declaration processing
    debugLog("Visiting DeclaratorNode: " + node.getName());
}

void ASTInterpreter::visit(arduino_ast::ParamNode& node) {
    // Parameter nodes are handled during function definition processing
    debugLog("Visiting ParamNode");
}

void ASTInterpreter::visit(arduino_ast::EmptyStatement& node) {
    // Empty statements do nothing - just continue execution
    debugLog("Visiting EmptyStatement");
}

void ASTInterpreter::visit(arduino_ast::AssignmentNode& node) {
    debugLog("Visiting AssignmentNode");
    
    try {
        // Evaluate right-hand side first
        CommandValue rightValue = evaluateExpression(const_cast<arduino_ast::ASTNode*>(node.getRight()));
        
        // Handle left-hand side
        const auto* leftNode = node.getLeft();
        std::string op = node.getOperator();
        
        if (leftNode && leftNode->getType() == arduino_ast::ASTNodeType::IDENTIFIER) {
            // Simple variable assignment
            std::string varName = leftNode->getValueAs<std::string>();
            
            // Handle different assignment operators
            if (op == "=") {
                Variable var(rightValue);
                scopeManager_->setVariable(varName, var);
            } else if (op == "+=" || op == "-=" || op == "*=" || op == "/=" || op == "%=" || op == "&=" || op == "|=" || op == "^=") {
                // Compound assignment - get existing value
                Variable* existingVar = scopeManager_->getVariable(varName);
                CommandValue leftValue = existingVar ? existingVar->value : CommandValue(0);
                
                // Perform the operation
                std::string baseOp;
                if (op.length() >= 2) {
                    baseOp = op.substr(0, op.length() - 1); // Remove the '=' to get base operator
                }
                CommandValue newValue = evaluateBinaryOperation(baseOp, leftValue, rightValue);
                
                Variable var(newValue);
                scopeManager_->setVariable(varName, var);
            }
            
        } else if (leftNode && leftNode->getType() == arduino_ast::ASTNodeType::ARRAY_ACCESS) {
            // Array element assignment (e.g., arr[i] = value)
            debugLog("Performing array element assignment");
            
            const auto* arrayAccessNode = dynamic_cast<const arduino_ast::ArrayAccessNode*>(leftNode);
            if (!arrayAccessNode || !arrayAccessNode->getArray() || !arrayAccessNode->getIndex()) {
                emitError("Invalid array access in assignment");
                return;
            }
            
            // Get array name (support simple identifier arrays)
            std::string arrayName;
            if (const auto* identifier = dynamic_cast<const arduino_ast::IdentifierNode*>(arrayAccessNode->getArray())) {
                arrayName = identifier->getName();
            } else {
                emitError("Complex array expressions not supported in assignment");
                return;
            }
            
            // Evaluate index expression
            CommandValue indexValue = evaluateExpression(const_cast<arduino_ast::ASTNode*>(arrayAccessNode->getIndex()));
            int32_t index = convertToInt(indexValue);
            
            debugLog("Array element assignment: " + arrayName + "[" + std::to_string(index) + "] = " + commandValueToString(rightValue));
            
            // Get array variable
            Variable* arrayVar = scopeManager_->getVariable(arrayName);
            if (!arrayVar) {
                emitError("Array variable '" + arrayName + "' not found");
                return;
            }
            
            // Use enhanced array access system for proper array element assignment
            EnhancedCommandValue enhancedRightValue = std::visit([](auto&& arg) -> EnhancedCommandValue {
                return arg;  // Direct conversion for shared types
            }, rightValue);
            MemberAccessHelper::setArrayElement(enhancedScopeManager_.get(), arrayName, static_cast<size_t>(index), enhancedRightValue);
            debugLog("Array element assignment completed: " + arrayName + "[" + std::to_string(index) + "] = " + enhancedCommandValueToString(enhancedRightValue));
            
        } else if (leftNode && leftNode->getType() == arduino_ast::ASTNodeType::MEMBER_ACCESS) {
            // Member access assignment (e.g., obj.field = value)  
            debugLog("Performing struct member assignment");
            
            const auto* memberAccessNode = dynamic_cast<const arduino_ast::MemberAccessNode*>(leftNode);
            if (!memberAccessNode || !memberAccessNode->getObject() || !memberAccessNode->getProperty()) {
                emitError("Invalid member access in assignment");
                return;
            }
            
            // Get object name (support simple identifier objects)
            std::string objectName;
            if (const auto* identifier = dynamic_cast<const arduino_ast::IdentifierNode*>(memberAccessNode->getObject())) {
                objectName = identifier->getName();
            } else {
                emitError("Complex object expressions not supported in assignment");
                return;
            }
            
            // Get property name
            std::string propertyName;
            if (const auto* propIdentifier = dynamic_cast<const arduino_ast::IdentifierNode*>(memberAccessNode->getProperty())) {
                propertyName = propIdentifier->getName();
            } else {
                emitError("Property must be an identifier");
                return;
            }
            
            std::string accessOp = memberAccessNode->getAccessOperator();
            debugLog("Struct member assignment: " + objectName + accessOp + propertyName + " = " + commandValueToString(rightValue));
            
            // Get object variable
            Variable* objectVar = scopeManager_->getVariable(objectName);
            if (!objectVar) {
                emitError("Object variable '" + objectName + "' not found");
                return;
            }
            
            // Use enhanced member access system for proper struct member assignment
            EnhancedCommandValue enhancedRightValue = std::visit([](auto&& arg) -> EnhancedCommandValue {
                return arg;  // Direct conversion for shared types
            }, rightValue);
            MemberAccessHelper::setMemberValue(enhancedScopeManager_.get(), objectName, propertyName, enhancedRightValue);
            debugLog("Member assignment completed: " + objectName + "." + propertyName + " = " + enhancedCommandValueToString(enhancedRightValue));
            
        } else if (leftNode && leftNode->getType() == arduino_ast::ASTNodeType::UNARY_OP) {
            // Handle pointer dereferencing assignment (*ptr = value)
            debugLog("Performing pointer dereference assignment");
            
            const auto* unaryOpNode = dynamic_cast<const arduino_ast::UnaryOpNode*>(leftNode);
            if (!unaryOpNode || unaryOpNode->getOperator() != "*") {
                emitError("Only dereference operator (*) supported in unary assignment");
                return;
            }
            
            // Get the pointer variable
            const auto* operandNode = unaryOpNode->getOperand();
            if (!operandNode || operandNode->getType() != arduino_ast::ASTNodeType::IDENTIFIER) {
                emitError("Pointer dereference requires simple variable identifier");
                return;
            }
            
            std::string pointerName = operandNode->getValueAs<std::string>();
            debugLog("Pointer dereference assignment: *" + pointerName + " = " + commandValueToString(rightValue));
            
            // Get pointer variable
            Variable* pointerVar = scopeManager_->getVariable(pointerName);
            if (!pointerVar) {
                emitError("Pointer variable '" + pointerName + "' not found");
                return;
            }
            
            // For now, simulate pointer dereferencing by creating a shadow variable
            // In a full implementation, this would update the memory location pointed to
            std::string dereferenceVarName = "*" + pointerName;
            Variable dereferenceVar(rightValue);
            scopeManager_->setVariable(dereferenceVarName, dereferenceVar);
            debugLog("Pointer dereference assignment completed: *" + pointerName + " = " + commandValueToString(rightValue));
            
        } else if (leftNode && leftNode->getType() == arduino_ast::ASTNodeType::ARRAY_ACCESS) {
            // Check if this is a multi-dimensional array access (nested array access)
            const auto* outerArrayAccessNode = dynamic_cast<const arduino_ast::ArrayAccessNode*>(leftNode);
            if (outerArrayAccessNode && outerArrayAccessNode->getArray() && 
                outerArrayAccessNode->getArray()->getType() == arduino_ast::ASTNodeType::ARRAY_ACCESS) {
                
                // Multi-dimensional array assignment (e.g., arr[i][j] = value)
                debugLog("Performing multi-dimensional array element assignment");
                
                const auto* innerArrayAccessNode = dynamic_cast<const arduino_ast::ArrayAccessNode*>(outerArrayAccessNode->getArray());
                
                // Get array name from the innermost access
                std::string arrayName;
                if (const auto* identifier = dynamic_cast<const arduino_ast::IdentifierNode*>(innerArrayAccessNode->getArray())) {
                    arrayName = identifier->getName();
                } else {
                    emitError("Complex multi-dimensional array expressions not supported");
                    return;
                }
                
                // Evaluate both indices
                CommandValue firstIndexValue = evaluateExpression(const_cast<arduino_ast::ASTNode*>(innerArrayAccessNode->getIndex()));
                CommandValue secondIndexValue = evaluateExpression(const_cast<arduino_ast::ASTNode*>(outerArrayAccessNode->getIndex()));
                int32_t firstIndex = convertToInt(firstIndexValue);
                int32_t secondIndex = convertToInt(secondIndexValue);
                
                debugLog("Multi-dimensional array assignment: " + arrayName + "[" + std::to_string(firstIndex) + "][" + std::to_string(secondIndex) + "] = " + commandValueToString(rightValue));
                
                // Get array variable
                Variable* arrayVar = scopeManager_->getVariable(arrayName);
                if (!arrayVar) {
                    emitError("Multi-dimensional array variable '" + arrayName + "' not found");
                    return;
                }
                
                // Use enhanced array access system for multi-dimensional arrays
                EnhancedCommandValue enhancedRightValue = std::visit([](auto&& arg) -> EnhancedCommandValue {
                    return arg;  // Direct conversion for shared types
                }, rightValue);
                
                // For multi-dimensional arrays, we simulate using a flattened index approach
                // In a full implementation, this would properly handle 2D array structures
                std::vector<size_t> indices = {static_cast<size_t>(firstIndex), static_cast<size_t>(secondIndex)};
                
                // Try to set multi-dimensional element using enhanced system
                try {
                    MemberAccessHelper::setArrayElement(enhancedScopeManager_.get(), arrayName, static_cast<size_t>(firstIndex * 100 + secondIndex), enhancedRightValue);
                    debugLog("Multi-dimensional array assignment completed");
                } catch (const std::exception& e) {
                    // Fall back to composite variable name simulation
                    std::string compositeVarName = arrayName + "_" + std::to_string(firstIndex) + "_" + std::to_string(secondIndex);
                    Variable compositeVar(rightValue);
                    scopeManager_->setVariable(compositeVarName, compositeVar);
                    debugLog("Multi-dimensional array assignment completed using composite naming: " + compositeVarName);
                }
                
                // This was already handled above, but the condition was duplicated
                return;
            }
            
        } else {
            emitError("Unsupported assignment target");
        }
    } catch (const std::exception& e) {
        emitError("Assignment error: " + std::string(e.what()));
    }
}

void ASTInterpreter::visit(arduino_ast::CharLiteralNode& node) {
    debugLog("Visiting CharLiteralNode");
    // Character literals are typically handled as string values in JavaScript compatibility
    // Store the character value for later use
    std::string charValue = node.getCharValue();
    // Note: In the context of an interpreter, this would typically return the value
    // but since we're using the visitor pattern, the result is stored in context
}

void ASTInterpreter::visit(arduino_ast::PostfixExpressionNode& node) {
    debugLog("Visiting PostfixExpressionNode");
    
    try {
        const auto* operand = node.getOperand();
        std::string op = node.getOperator();
        
        if (operand && operand->getType() == arduino_ast::ASTNodeType::IDENTIFIER) {
            std::string varName = operand->getValueAs<std::string>();
            Variable* var = scopeManager_->getVariable(varName);
            
            if (var) {
                CommandValue currentValue = var->value;
                CommandValue newValue = currentValue;
                
                // Apply postfix operation
                if (op == "++") {
                    if (std::holds_alternative<int32_t>(currentValue)) {
                        newValue = std::get<int32_t>(currentValue) + 1;
                    } else if (std::holds_alternative<double>(currentValue)) {
                        newValue = std::get<double>(currentValue) + 1.0;
                    }
                } else if (op == "--") {
                    if (std::holds_alternative<int32_t>(currentValue)) {
                        newValue = std::get<int32_t>(currentValue) - 1;
                    } else if (std::holds_alternative<double>(currentValue)) {
                        newValue = std::get<double>(currentValue) - 1.0;
                    }
                }
                
                // Update variable with new value
                var->setValue(newValue);
                
                // For postfix, return the original value (though in visitor pattern, this is contextual)
                // The original value was in currentValue
            }
        }
    } catch (const std::exception& e) {
        emitError("Postfix expression error: " + std::string(e.what()));
    }
}

void ASTInterpreter::visit(arduino_ast::SwitchStatement& node) {
    debugLog("Visiting SwitchStatement");
    
    try {
        // Evaluate switch condition
        CommandValue condition = evaluateExpression(const_cast<arduino_ast::ASTNode*>(node.getCondition()));
        
        // Set switch condition for case matching
        currentSwitchValue_ = condition;
        bool foundMatch = false;
        bool fallThrough = false;
        
        // Process switch body
        if (node.getBody()) {
            // Reset break flag for this switch
            shouldBreak_ = false;
            
            // Execute switch body - cases will check currentSwitchValue_
            const_cast<arduino_ast::ASTNode*>(node.getBody())->accept(*this);
        }
        
        // Clear switch context
        currentSwitchValue_ = std::monostate{};
    } catch (const std::exception& e) {
        emitError("Switch statement error: " + std::string(e.what()));
    }
}

void ASTInterpreter::visit(arduino_ast::CaseStatement& node) {
    debugLog("Visiting CaseStatement");
    
    try {
        // Check if this case matches the current switch value or if we're in fall-through mode
        bool shouldExecute = inSwitchFallthrough_;
        
        if (!shouldExecute && !std::holds_alternative<std::monostate>(currentSwitchValue_)) {
            // Evaluate case value and compare with switch condition
            if (node.getLabel()) {
                CommandValue caseValue = evaluateExpression(const_cast<arduino_ast::ASTNode*>(node.getLabel()));
                // Compare values for equality
                shouldExecute = (std::visit([](auto&& a, auto&& b) -> bool {
                    using T = std::decay_t<decltype(a)>;
                    using U = std::decay_t<decltype(b)>;
                    if constexpr (std::is_same_v<T, U>) {
                        return a == b;
                    } else if constexpr ((std::is_arithmetic_v<T> && std::is_arithmetic_v<U>)) {
                        return static_cast<double>(a) == static_cast<double>(b);
                    }
                    return false;
                }, currentSwitchValue_, caseValue));
                
                if (shouldExecute) {
                    debugLog("Case matched switch value");
                    inSwitchFallthrough_ = true; // Enable fall-through for subsequent cases
                }
            }
        }
        
        // Execute case body if this case matches or we're in fall-through
        if (shouldExecute && node.getBody()) {
            const_cast<arduino_ast::ASTNode*>(node.getBody())->accept(*this);
            
            // If break was encountered, exit fall-through mode
            if (shouldBreak_) {
                inSwitchFallthrough_ = false;
                shouldBreak_ = false; // Reset break flag after handling
            }
        }
    
    } catch (const std::exception& e) {
        emitError("Case statement error: " + std::string(e.what()));
    }
}

void ASTInterpreter::visit(arduino_ast::RangeBasedForStatement& node) {
    debugLog("Visiting RangeBasedForStatement");
    
    try {
        // COMPLETE IMPLEMENTATION: Range-based for loop execution
        
        // Get loop variable name
        std::string varName = "item"; // Default name
        if (const auto* variable = node.getVariable()) {
            if (const auto* identifier = dynamic_cast<const arduino_ast::IdentifierNode*>(variable)) {
                varName = identifier->getName();
            } else if (const auto* varDecl = dynamic_cast<const arduino_ast::VarDeclNode*>(variable)) {
                // Handle variable declaration in for loop
                const auto& declarations = varDecl->getDeclarations();
                if (!declarations.empty()) {
                    if (const auto* declNode = dynamic_cast<const arduino_ast::DeclaratorNode*>(declarations[0].get())) {
                        varName = declNode->getName();
                    }
                }
            }
        }
        
        debugLog("Range-based for loop variable: " + varName);
        
        // Evaluate iterable collection
        CommandValue collection = std::monostate{};
        if (const auto* iterable = node.getIterable()) {
            collection = evaluateExpression(const_cast<arduino_ast::ASTNode*>(iterable));
            debugLog("Iterable collection evaluated: " + commandValueToString(collection));
        }
        
        // Create new scope for loop
        scopeManager_->pushScope();
        
        // Determine collection size and iterate
        std::vector<CommandValue> items;
        
        // Handle different collection types - ENHANCED IMPLEMENTATION
        if (std::holds_alternative<std::string>(collection)) {
            // String iteration - iterate over characters
            std::string str = std::get<std::string>(collection);
            debugLog("String iteration over: '" + str + "'");
            for (char c : str) {
                items.push_back(std::string(1, c));
            }
        } else if (std::holds_alternative<int32_t>(collection)) {
            // Numeric range iteration - supports different patterns
            int32_t count = std::get<int32_t>(collection);
            debugLog("Numeric range iteration: 0 to " + std::to_string(count - 1));
            
            // Limit range to prevent infinite loops and memory issues
            int32_t maxItems = std::min(count, static_cast<int32_t>(1000));
            for (int32_t i = 0; i < maxItems; ++i) {
                items.push_back(i);
            }
            
            if (count > 1000) {
                debugLog("Range truncated to 1000 items for safety");
            }
        } else if (std::holds_alternative<double>(collection)) {
            // Double values - treat as range size
            double dcount = std::get<double>(collection);
            int32_t count = static_cast<int32_t>(dcount);
            debugLog("Double range iteration: 0 to " + std::to_string(count - 1));
            
            int32_t maxItems = std::min(count, static_cast<int32_t>(1000));
            for (int32_t i = 0; i < maxItems; ++i) {
                items.push_back(static_cast<double>(i));
            }
        } else {
            // Check if it's an enhanced data type (Array, String object)
            EnhancedCommandValue enhancedCollection = upgradeCommandValue(collection);
            
            if (isArrayType(enhancedCollection)) {
                // Array iteration - iterate over array elements
                auto arrayPtr = std::get<std::shared_ptr<ArduinoArray>>(enhancedCollection);
                if (arrayPtr) {
                    size_t arraySize = arrayPtr->size();
                    debugLog("Array iteration over " + std::to_string(arraySize) + " elements");
                    
                    for (size_t i = 0; i < arraySize && i < 1000; ++i) {
                        EnhancedCommandValue element = arrayPtr->getElement(i);
                        items.push_back(downgradeCommandValue(element));
                    }
                }
            } else if (isStringType(enhancedCollection)) {
                // Enhanced String iteration - iterate over characters
                auto stringPtr = std::get<std::shared_ptr<ArduinoString>>(enhancedCollection);
                if (stringPtr) {
                    std::string str = stringPtr->c_str();
                    debugLog("Enhanced String iteration over: '" + str + "'");
                    for (char c : str) {
                        items.push_back(std::string(1, c));
                    }
                }
            } else {
                // For other types, create single-element collection
                debugLog("Single-element iteration over: " + commandValueToString(collection));
                items.push_back(collection);
            }
        }
        
        debugLog("Range-based for loop: iterating over " + std::to_string(items.size()) + " items");
        
        // Reset control flow state
        resetControlFlow();
        
        // Execute loop body for each item
        int iteration = 0;
        for (const auto& item : items) {
            if (iteration++ > maxLoopIterations_) {
                debugLog("Range-based for loop exceeded max iterations");
                break;
            }
            
            // Set loop variable to current item
            Variable loopVar(item, "auto");
            scopeManager_->setVariable(varName, loopVar);
            
            debugLog("Range-based for iteration " + std::to_string(iteration) + 
                    ": " + varName + " = " + commandValueToString(item));
            
            // Execute loop body
            if (const auto* body = node.getBody()) {
                const_cast<arduino_ast::ASTNode*>(body)->accept(*this);
                
                // Handle control flow
                if (shouldBreak_) {
                    debugLog("Range-based for loop: break encountered");
                    shouldBreak_ = false;
                    break;
                } else if (shouldContinue_) {
                    debugLog("Range-based for loop: continue encountered");
                    shouldContinue_ = false;
                    continue;
                } else if (shouldReturn_) {
                    debugLog("Range-based for loop: return encountered");
                    break;
                }
            }
        }
        
        // Clean up scope
        scopeManager_->popScope();
        
        debugLog("Range-based for loop completed");
        
    } catch (const std::exception& e) {
        emitError("Range-based for statement error: " + std::string(e.what()));
    }
}

void ASTInterpreter::visit(arduino_ast::ArrayAccessNode& node) {
    debugLog("Visiting ArrayAccessNode");
    
    try {
        // COMPLETE IMPLEMENTATION: Array access support
        
        if (!node.getArray() || !node.getIndex()) {
            emitError("Invalid array access: missing array or index");
            lastExpressionResult_ = std::monostate{};
            return;
        }
        
        // Get array name (for now, support simple identifier arrays)
        std::string arrayName;
        if (const auto* identifier = dynamic_cast<const arduino_ast::IdentifierNode*>(node.getArray())) {
            arrayName = identifier->getName();
        } else {
            emitError("Complex array expressions not yet supported");
            lastExpressionResult_ = std::monostate{};
            return;
        }
        
        // Evaluate index expression
        CommandValue indexValue = evaluateExpression(const_cast<arduino_ast::ASTNode*>(node.getIndex()));
        int32_t index = convertToInt(indexValue);
        
        debugLog("Array access: " + arrayName + "[" + std::to_string(index) + "]");
        
        // Get array variable using enhanced scope system
        EnhancedVariable* arrayVar = enhancedScopeManager_->getVariable(arrayName);
        
        if (!arrayVar) {
            emitError("Array variable '" + arrayName + "' not found");
            lastExpressionResult_ = std::monostate{};
            return;
        }
        
        EnhancedCommandValue arrayValue = arrayVar->value;
        
        EnhancedCommandValue result;
        
        if (isArrayType(arrayValue)) {
            // Enhanced array access with bounds checking
            auto arrayPtr = std::get<std::shared_ptr<ArduinoArray>>(arrayValue);
            if (arrayPtr) {
                size_t idx = static_cast<size_t>(index);
                if (idx < arrayPtr->size()) {
                    result = arrayPtr->getElement(idx);
                } else {
                    emitError("Array index " + std::to_string(index) + " out of bounds (size: " + std::to_string(arrayPtr->size()) + ")");
                    lastExpressionResult_ = std::monostate{};
                    return;
                }
            } else {
                emitError("Null array pointer");
                lastExpressionResult_ = std::monostate{};
                return;
            }
        } else {
            // Fall back to legacy array access system for basic arrays
            result = MemberAccessHelper::getArrayElement(enhancedScopeManager_.get(), arrayName, static_cast<size_t>(index));
        }
        
        // Convert EnhancedCommandValue back to CommandValue for compatibility
        lastExpressionResult_ = downgradeCommandValue(result);
        debugLog("Array access result: " + enhancedCommandValueToString(result));
        
    } catch (const std::exception& e) {
        emitError("Array access error: " + std::string(e.what()));
        lastExpressionResult_ = std::monostate{};
    }
}

void ASTInterpreter::visit(arduino_ast::TernaryExpressionNode& node) {
    debugLog("Visiting TernaryExpressionNode - START");
    
    // Initialize result to a known value
    lastExpressionResult_ = std::monostate{};
    debugLog("Initialized lastExpressionResult_ to monostate");
    
    try {
        debugLog("About to evaluate ternary condition...");
        // Check condition node type
        auto* conditionNode = node.getCondition();
        if (conditionNode) {
            debugLog("Condition node type: " + std::to_string(static_cast<int>(conditionNode->getType())));
        } else {
            debugLog("Condition node is null!");
        }
        
        // Evaluate condition
        CommandValue condition = evaluateExpression(const_cast<arduino_ast::ASTNode*>(node.getCondition()));
        debugLog("Ternary condition evaluated successfully");
        debugLog("Ternary condition value: " + commandValueToString(condition));
        
        // Execute true or false expression based on condition and store result
        CommandValue result = std::monostate{};
        bool conditionResult = convertToBool(condition);
        debugLog("Ternary condition bool: " + std::string(conditionResult ? "true" : "false"));
        
        if (conditionResult) {
            debugLog("Taking true branch");
            if (node.getTrueExpression()) {
                result = evaluateExpression(const_cast<arduino_ast::ASTNode*>(node.getTrueExpression()));
                debugLog("True expression result: " + commandValueToString(result));
            }
        } else {
            debugLog("Taking false branch");
            if (node.getFalseExpression()) {
                result = evaluateExpression(const_cast<arduino_ast::ASTNode*>(node.getFalseExpression()));
                debugLog("False expression result: " + commandValueToString(result));
            }
        }
        
        debugLog("Final ternary result: " + commandValueToString(result));
        
        // Store result for expression evaluation
        lastExpressionResult_ = result;
    } catch (const std::exception& e) {
        debugLog("Exception in ternary expression: " + std::string(e.what()));
        emitError("Ternary expression error: " + std::string(e.what()));
        lastExpressionResult_ = std::monostate{};
    }
}

void ASTInterpreter::visit(arduino_ast::ConstantNode& node) {
    debugLog("Visiting ConstantNode");
    
    // Constants are handled similarly to identifiers
    std::string constantValue = node.getConstantValue();
    
    // Handle common Arduino constants
    if (constantValue == "HIGH") {
        // Store HIGH constant value
    } else if (constantValue == "LOW") {
        // Store LOW constant value
    } else if (constantValue == "INPUT" || constantValue == "OUTPUT" || constantValue == "INPUT_PULLUP") {
        // Handle pin mode constants
    }
    // TODO: Store constant value for expression evaluation
}

void ASTInterpreter::visit(arduino_ast::ArrayInitializerNode& node) {
    debugLog("Visiting ArrayInitializerNode");
    
    try {
        // Process array initializer elements
        for (const auto& child : node.getChildren()) {
            if (child) {
                child->accept(*this);
            }
        }
    } catch (const std::exception& e) {
        emitError("Array initializer error: " + std::string(e.what()));
    }
}

void ASTInterpreter::visit(arduino_ast::FunctionPointerDeclaratorNode& node) {
    debugLog("Visiting FunctionPointerDeclaratorNode");
    // Function pointer declarators are typically handled during declaration processing
}

void ASTInterpreter::visit(arduino_ast::CommaExpression& node) {
    debugLog("Visiting CommaExpression");
    // Comma expressions evaluate left-to-right and return the rightmost value
    // For now, just traverse all children
    for (const auto& child : node.getChildren()) {
        if (child) {
            child->accept(*this);
        }
    }
}

void ASTInterpreter::visit(arduino_ast::StructDeclaration& node) {
    debugLog("Visiting StructDeclaration");
    // Struct declarations define types - just traverse children for now
    for (const auto& child : node.getChildren()) {
        if (child) {
            child->accept(*this);
        }
    }
}

void ASTInterpreter::visit(arduino_ast::TypedefDeclaration& node) {
    debugLog("Visiting TypedefDeclaration");
    // Typedef declarations define type aliases - just traverse children for now
    for (const auto& child : node.getChildren()) {
        if (child) {
            child->accept(*this);
        }
    }
}

void ASTInterpreter::visit(arduino_ast::StructType& node) {
    debugLog("Visiting StructType");
    // Struct types are type specifiers - just traverse children for now
    for (const auto& child : node.getChildren()) {
        if (child) {
            child->accept(*this);
        }
    }
}

// =============================================================================
// EXPRESSION EVALUATION
// =============================================================================

CommandValue ASTInterpreter::evaluateExpression(arduino_ast::ASTNode* expr) {
    if (!expr) return std::monostate{};
    
    auto nodeType = expr->getType();
    debugLog("evaluateExpression: NodeType = " + std::to_string(static_cast<int>(nodeType)));
    
    switch (nodeType) {
        case arduino_ast::ASTNodeType::NUMBER_LITERAL:
            if (auto* numNode = dynamic_cast<arduino_ast::NumberNode*>(expr)) {
                double value = numNode->getNumber();
                debugLog("evaluateExpression: NumberNode value = " + std::to_string(value));
                return value;
            }
            break;
            
        case arduino_ast::ASTNodeType::STRING_LITERAL:
            if (auto* strNode = dynamic_cast<arduino_ast::StringLiteralNode*>(expr)) {
                return strNode->getString();
            }
            break;
            
        case arduino_ast::ASTNodeType::IDENTIFIER:
            if (auto* idNode = dynamic_cast<arduino_ast::IdentifierNode*>(expr)) {
                std::string name = idNode->getName();
                debugLog("evaluateExpression: Looking up identifier '" + name + "'");
                Variable* var = scopeManager_->getVariable(name);
                if (var) {
                    debugLog("evaluateExpression: Found variable '" + name + "' with value: " + commandValueToString(var->value));
                    return var->value;
                } else {
                    debugLog("evaluateExpression: Variable '" + name + "' not found in scope");
                    emitError("Undefined variable: " + name);
                    return std::monostate{};
                }
            }
            break;
            
        case arduino_ast::ASTNodeType::BINARY_OP:
            if (auto* binNode = dynamic_cast<arduino_ast::BinaryOpNode*>(expr)) {
                CommandValue left = evaluateExpression(const_cast<arduino_ast::ASTNode*>(binNode->getLeft()));
                CommandValue right = evaluateExpression(const_cast<arduino_ast::ASTNode*>(binNode->getRight()));
                return evaluateBinaryOperation(binNode->getOperator(), left, right);
            }
            break;
            
        case arduino_ast::ASTNodeType::UNARY_OP:
            if (auto* unaryNode = dynamic_cast<arduino_ast::UnaryOpNode*>(expr)) {
                CommandValue operand = evaluateExpression(const_cast<arduino_ast::ASTNode*>(unaryNode->getOperand()));
                return evaluateUnaryOperation(unaryNode->getOperator(), operand);
            }
            break;
            
        case arduino_ast::ASTNodeType::FUNC_CALL:
            if (auto* funcNode = dynamic_cast<arduino_ast::FuncCallNode*>(expr)) {
                std::string functionName;
                if (const auto* identifier = dynamic_cast<const arduino_ast::IdentifierNode*>(funcNode->getCallee())) {
                    functionName = identifier->getName();
                }
                
                std::vector<CommandValue> args;
                for (const auto& arg : funcNode->getArguments()) {
                    args.push_back(evaluateExpression(arg.get()));
                }
                
                return executeArduinoFunction(functionName, args);
            }
            break;
            
        case arduino_ast::ASTNodeType::ARRAY_ACCESS:
            // Handle array access by calling visitor and returning result
            expr->accept(*this);
            return lastExpressionResult_;
            
        case arduino_ast::ASTNodeType::MEMBER_ACCESS:
            // Handle member access by calling visitor and returning result
            expr->accept(*this);
            return lastExpressionResult_;
            
        case arduino_ast::ASTNodeType::TERNARY_EXPR:
            // Handle ternary expression by calling visitor and returning result
            debugLog("evaluateExpression: Calling ternary expression visitor");
            expr->accept(*this);
            debugLog("evaluateExpression: Ternary visitor completed, result: " + commandValueToString(lastExpressionResult_));
            return lastExpressionResult_;
            
        case arduino_ast::ASTNodeType::CONSTANT:
            if (auto* constNode = dynamic_cast<arduino_ast::ConstantNode*>(expr)) {
                std::string value = constNode->getConstantValue();
                debugLog("evaluateExpression: ConstantNode value = '" + value + "'");
                
                // Handle boolean constants
                if (value == "true") {
                    debugLog("evaluateExpression: Returning boolean true");
                    return true;
                } else if (value == "false") {
                    debugLog("evaluateExpression: Returning boolean false");
                    return false;
                } else {
                    // Handle other constants (HIGH, LOW, etc.)
                    debugLog("evaluateExpression: Returning string constant: " + value);
                    return value;
                }
            }
            break;
            
        default:
            debugLog("Unhandled expression type: " + arduino_ast::nodeTypeToString(nodeType));
            break;
    }
    
    return std::monostate{};
}

// =============================================================================
// BINARY OPERATION EVALUATION
// =============================================================================

CommandValue ASTInterpreter::evaluateBinaryOperation(const std::string& op, const CommandValue& left, const CommandValue& right) {
    // Arithmetic operations
    if (op == "+") {
        if (isNumeric(left) && isNumeric(right)) {
            return convertToDouble(left) + convertToDouble(right);
        } else {
            // String concatenation
            return convertToString(left) + convertToString(right);
        }
    } else if (op == "-") {
        return convertToDouble(left) - convertToDouble(right);
    } else if (op == "*") {
        return convertToDouble(left) * convertToDouble(right);
    } else if (op == "/") {
        double rightVal = convertToDouble(right);
        if (rightVal == 0.0) {
            emitError("Division by zero");
            return std::monostate{};
        }
        return convertToDouble(left) / rightVal;
    } else if (op == "%") {
        int32_t leftVal = convertToInt(left);
        int32_t rightVal = convertToInt(right);
        if (rightVal == 0) {
            emitError("Modulo by zero");
            return std::monostate{};
        }
        return leftVal % rightVal;
    }
    
    // Comparison operations
    else if (op == "==") {
        return commandValuesEqual(left, right);
    } else if (op == "!=") {
        return !commandValuesEqual(left, right);
    } else if (op == "<") {
        return convertToDouble(left) < convertToDouble(right);
    } else if (op == "<=") {
        return convertToDouble(left) <= convertToDouble(right);
    } else if (op == ">") {
        return convertToDouble(left) > convertToDouble(right);
    } else if (op == ">=") {
        return convertToDouble(left) >= convertToDouble(right);
    }
    
    // Logical operations
    else if (op == "&&") {
        return convertToBool(left) && convertToBool(right);
    } else if (op == "||") {
        return convertToBool(left) || convertToBool(right);
    }
    
    // Assignment operations
    else if (op == "=") {
        // Assignment would be handled differently in a full implementation
        return right;
    }
    
    emitError("Unknown binary operator: " + op);
    return std::monostate{};
}

// =============================================================================
// ARDUINO FUNCTION EXECUTION
// =============================================================================

CommandValue ASTInterpreter::executeUserFunction(const std::string& name, const arduino_ast::FuncDefNode* funcDef, const std::vector<CommandValue>& args) {
    debugLog("Executing user-defined function: " + name);
    
    // Track user function call statistics
    auto userFunctionStart = std::chrono::steady_clock::now();
    functionsExecuted_++;
    userFunctionsExecuted_++;
    functionCallCounters_[name]++;
    
    // Track recursion depth
    recursionDepth_++;
    if (recursionDepth_ > maxRecursionDepth_) {
        maxRecursionDepth_ = recursionDepth_;
    }
    
    // Check for recursion depth limit to prevent stack overflow
    static std::vector<std::string> callStack;
    const size_t MAX_RECURSION_DEPTH = 100; // Prevent infinite recursion
    
    callStack.push_back(name);
    if (callStack.size() > MAX_RECURSION_DEPTH) {
        emitError("Maximum recursion depth exceeded in function: " + name);
        callStack.pop_back();
        return std::monostate{};
    }
    
    // Count recursive calls of the same function
    size_t recursiveCallCount = 0;
    for (const auto& funcName : callStack) {
        if (funcName == name) recursiveCallCount++;
    }
    
    debugLog("Function " + name + " call depth: " + std::to_string(callStack.size()) + 
             ", recursive calls: " + std::to_string(recursiveCallCount));
    
    // Create new scope for function execution
    scopeManager_->pushScope();
    
    // Handle function parameters - COMPLETE IMPLEMENTATION
    const auto& parameters = funcDef->getParameters();
    if (!parameters.empty()) {
        debugLog("Processing " + std::to_string(parameters.size()) + " function parameters");
        
        // Check parameter count - allow fewer args if defaults are available
        size_t requiredParams = 0;
        for (const auto& param : parameters) {
            const auto* paramNode = dynamic_cast<const arduino_ast::ParamNode*>(param.get());
            if (paramNode && paramNode->getChildren().empty()) { // No default value
                requiredParams++;
            }
        }
        
        if (args.size() < requiredParams || args.size() > parameters.size()) {
            emitError("Function " + name + " expects " + std::to_string(requiredParams) + 
                     "-" + std::to_string(parameters.size()) + " arguments, got " + std::to_string(args.size()));
            scopeManager_->popScope();
            return std::monostate{};
        }
        
        // Process each parameter
        for (size_t i = 0; i < parameters.size(); ++i) {
            const auto* paramNode = dynamic_cast<const arduino_ast::ParamNode*>(parameters[i].get());
            if (paramNode) {
                // Get parameter name from declarator
                const auto* declarator = paramNode->getDeclarator();
                if (const auto* declNode = dynamic_cast<const arduino_ast::DeclaratorNode*>(declarator)) {
                    std::string paramName = declNode->getName();
                    
                    // Get parameter type from ParamNode
                    std::string paramType = "auto";
                    const auto* typeNode = paramNode->getParamType();
                    if (typeNode) {
                        try {
                            paramType = typeNode->getValueAs<std::string>();
                        } catch (...) {
                            paramType = "auto"; // Fallback
                        }
                    }
                    
                    CommandValue paramValue;
                    
                    // Use provided argument or default value
                    if (i < args.size()) {
                        // Use provided argument
                        paramValue = args[i];
                        if (paramType != "auto") {
                            paramValue = convertToType(args[i], paramType);
                        }
                        debugLog("Parameter: " + paramName + " = " + commandValueToString(args[i]) + " (provided)");
                    } else {
                        // Use default value from parameter node children
                        const auto& children = paramNode->getChildren();
                        if (!children.empty()) {
                            CommandValue defaultValue = evaluateExpression(const_cast<arduino_ast::ASTNode*>(children[0].get()));
                            paramValue = paramType != "auto" ? convertToType(defaultValue, paramType) : defaultValue;
                            debugLog("Parameter: " + paramName + " = " + commandValueToString(defaultValue) + " (default)");
                        } else {
                            // No default value provided - use type default
                            if (paramType == "int" || paramType == "int32_t") {
                                paramValue = static_cast<int32_t>(0);
                            } else if (paramType == "double" || paramType == "float") {
                                paramValue = 0.0;
                            } else if (paramType == "bool") {
                                paramValue = false;
                            } else if (paramType == "String" || paramType == "string") {
                                paramValue = std::string("");
                            } else {
                                paramValue = std::monostate{};
                            }
                            debugLog("Parameter: " + paramName + " = " + commandValueToString(paramValue) + " (type default)");
                        }
                    }
                    
                    // Create parameter variable
                    Variable paramVar(paramValue, paramType);
                    scopeManager_->setVariable(paramName, paramVar);
                    
                } else {
                    debugLog("Parameter " + std::to_string(i) + " has no declarator name");
                }
            } else {
                debugLog("Parameter " + std::to_string(i) + " is not a ParamNode");
            }
        }
    } else {
        debugLog("Function " + name + " has no parameters");
    }
    
    CommandValue result = std::monostate{};
    resetControlFlow();
    
    // Execute function body
    if (funcDef->getBody()) {
        const_cast<arduino_ast::ASTNode*>(funcDef->getBody())->accept(*this);
    }
    
    // Handle return value
    if (shouldReturn_) {
        result = returnValue_;
        shouldReturn_ = false;
        returnValue_ = std::monostate{};
    }
    
    // Clean up scope and call stack
    scopeManager_->popScope();
    callStack.pop_back();
    
    // Complete user function timing tracking
    auto userFunctionEnd = std::chrono::steady_clock::now();
    auto userDuration = std::chrono::duration_cast<std::chrono::microseconds>(userFunctionEnd - userFunctionStart);
    functionExecutionTimes_[name] += userDuration;
    
    // Update recursion depth tracking
    recursionDepth_--;
    
    debugLog("User function " + name + " completed with result: " + commandValueToString(result));
    return result;
}

CommandValue ASTInterpreter::executeArduinoFunction(const std::string& name, const std::vector<CommandValue>& args) {
    debugLog("Executing Arduino function: " + name);
    
    // Track function call statistics
    auto functionStart = std::chrono::steady_clock::now();
    functionsExecuted_++;
    arduinoFunctionsExecuted_++;
    functionCallCounters_[name]++;
    
    // If we're resuming from a suspended state and this is the function we were waiting for,
    // return the result from the external response
    if (!suspendedFunction_.empty() && suspendedFunction_ == name && 
        std::holds_alternative<int32_t>(lastExpressionResult_)) {
        debugLog("Returning cached result for suspended function: " + name);
        CommandValue result = lastExpressionResult_;
        lastExpressionResult_ = std::monostate{}; // Clear it after use
        return result;
    }
    
    // Pin operations
    if (name == "pinMode") {
        auto result = handlePinOperation(name, args);
        // Update pin operation statistics
        pinOperations_++;
        // Complete function timing
        auto functionEnd = std::chrono::steady_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(functionEnd - functionStart);
        functionExecutionTimes_[name] += duration;
        return result;
    } else if (name == "digitalWrite") {
        auto result = handlePinOperation(name, args);
        pinOperations_++;
        digitalWrites_++;
        auto functionEnd = std::chrono::steady_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(functionEnd - functionStart);
        functionExecutionTimes_[name] += duration;
        return result;
    } else if (name == "digitalRead") {
        auto result = handlePinOperation(name, args);
        pinOperations_++;
        digitalReads_++;
        auto functionEnd = std::chrono::steady_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(functionEnd - functionStart);
        functionExecutionTimes_[name] += duration;
        return result;
    } else if (name == "analogWrite") {
        auto result = handlePinOperation(name, args);
        pinOperations_++;
        analogWrites_++;
        auto functionEnd = std::chrono::steady_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(functionEnd - functionStart);
        functionExecutionTimes_[name] += duration;
        return result;
    } else if (name == "analogRead") {
        auto result = handlePinOperation(name, args);
        pinOperations_++;
        analogReads_++;
        auto functionEnd = std::chrono::steady_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(functionEnd - functionStart);
        functionExecutionTimes_[name] += duration;
        return result;
    }
    
    // Timing operations
    else if (name == "delay") {
        return handleTimingOperation(name, args);
    } else if (name == "delayMicroseconds") {
        return handleTimingOperation(name, args);
    } else if (name == "millis") {
        return handleTimingOperation(name, args);
    } else if (name == "micros") {
        return handleTimingOperation(name, args);
    }
    
    // Serial operations  
    else if (name == "Serial.begin" || name == "Serial.print" || name == "Serial.println") {
        auto result = handleSerialOperation(name, args);
        serialOperations_++;
        auto functionEnd = std::chrono::steady_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(functionEnd - functionStart);
        functionExecutionTimes_[name] += duration;
        return result;
    }
    
    // Character classification functions (Arduino ctype.h equivalents)
    else if (name == "isDigit" && args.size() >= 1) {
        char c = static_cast<char>(convertToInt(args[0]));
        return static_cast<int32_t>(c >= '0' && c <= '9');
    } else if (name == "isAlpha" && args.size() >= 1) {
        char c = static_cast<char>(convertToInt(args[0]));
        return static_cast<int32_t>((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z'));
    } else if (name == "isPunct" && args.size() >= 1) {
        char c = static_cast<char>(convertToInt(args[0]));
        // Arduino punctuation: !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~
        return static_cast<int32_t>((c >= '!' && c <= '/') || (c >= ':' && c <= '@') || 
                                   (c >= '[' && c <= '`') || (c >= '{' && c <= '~'));
    } else if (name == "isAlphaNumeric" && args.size() >= 1) {
        char c = static_cast<char>(convertToInt(args[0]));
        return static_cast<int32_t>((c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z'));
    } else if (name == "isSpace" && args.size() >= 1) {
        char c = static_cast<char>(convertToInt(args[0]));
        return static_cast<int32_t>(c == ' ' || c == '\t' || c == '\n' || c == '\v' || c == '\f' || c == '\r');
    } else if (name == "isUpperCase" && args.size() >= 1) {
        char c = static_cast<char>(convertToInt(args[0]));
        return static_cast<int32_t>(c >= 'A' && c <= 'Z');
    } else if (name == "isLowerCase" && args.size() >= 1) {
        char c = static_cast<char>(convertToInt(args[0]));
        return static_cast<int32_t>(c >= 'a' && c <= 'z');
    } else if (name == "isHexadecimalDigit" && args.size() >= 1) {
        char c = static_cast<char>(convertToInt(args[0]));
        return static_cast<int32_t>((c >= '0' && c <= '9') || (c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f'));
    } else if (name == "isAscii" && args.size() >= 1) {
        char c = static_cast<char>(convertToInt(args[0]));
        return static_cast<int32_t>(c >= 0 && c <= 127);
    } else if (name == "isWhitespace" && args.size() >= 1) {
        char c = static_cast<char>(convertToInt(args[0]));
        return static_cast<int32_t>(c == ' ' || c == '\t' || c == '\n' || c == '\v' || c == '\f' || c == '\r');
    } else if (name == "isControl" && args.size() >= 1) {
        char c = static_cast<char>(convertToInt(args[0]));
        return static_cast<int32_t>((c >= 0 && c <= 31) || c == 127);
    } else if (name == "isGraph" && args.size() >= 1) {
        char c = static_cast<char>(convertToInt(args[0]));
        return static_cast<int32_t>(c > 32 && c <= 126);
    } else if (name == "isPrintable" && args.size() >= 1) {
        char c = static_cast<char>(convertToInt(args[0]));
        return static_cast<int32_t>(c >= 32 && c <= 126);
    }
    
    // Advanced expression operators
    else if (name == "typeof" && args.size() >= 1) {
        // Return type name as string based on the argument value
        return std::visit([](auto&& arg) -> CommandValue {
            using T = std::decay_t<decltype(arg)>;
            if constexpr (std::is_same_v<T, std::monostate>) {
                return std::string("undefined");
            } else if constexpr (std::is_same_v<T, bool>) {
                return std::string("boolean");
            } else if constexpr (std::is_same_v<T, int32_t>) {
                return std::string("number");
            } else if constexpr (std::is_same_v<T, double>) {
                return std::string("number");
            } else if constexpr (std::is_same_v<T, std::string>) {
                return std::string("string");
            } else {
                return std::string("object");
            }
        }, args[0]);
    } else if (name == "sizeof" && args.size() >= 1) {
        // Return size in bytes based on the argument type
        return std::visit([](auto&& arg) -> CommandValue {
            using T = std::decay_t<decltype(arg)>;
            if constexpr (std::is_same_v<T, std::monostate>) {
                return static_cast<int32_t>(0);
            } else if constexpr (std::is_same_v<T, bool>) {
                return static_cast<int32_t>(sizeof(bool));
            } else if constexpr (std::is_same_v<T, int32_t>) {
                return static_cast<int32_t>(sizeof(int32_t));
            } else if constexpr (std::is_same_v<T, double>) {
                return static_cast<int32_t>(sizeof(double));
            } else if constexpr (std::is_same_v<T, std::string>) {
                return static_cast<int32_t>(arg.length() + 1);
            } else {
                return static_cast<int32_t>(sizeof(void*));
            }
        }, args[0]);
    }
    
    // Cast operators (function-style casts)
    else if (name == "int" && args.size() >= 1) {
        return static_cast<int32_t>(convertToInt(args[0]));
    } else if (name == "float" && args.size() >= 1) {
        return convertToDouble(args[0]);
    } else if (name == "double" && args.size() >= 1) {
        return convertToDouble(args[0]);  
    } else if (name == "bool" && args.size() >= 1) {
        return convertToBool(args[0]);
    } else if (name == "char" && args.size() >= 1) {
        return static_cast<int32_t>(static_cast<char>(convertToInt(args[0])));
    } else if (name == "byte" && args.size() >= 1) {
        return static_cast<int32_t>(static_cast<uint8_t>(convertToInt(args[0])) & 0xFF);
    }
    
    // Arduino String constructor and methods
    else if (name == "String") {
        // String constructor - create new ArduinoString object
        std::string initialValue = "";
        if (args.size() > 0) {
            initialValue = std::visit([](auto&& arg) -> std::string {
                using T = std::decay_t<decltype(arg)>;
                if constexpr (std::is_same_v<T, std::string>) {
                    return arg;
                } else if constexpr (std::is_same_v<T, int32_t>) {
                    return std::to_string(arg);
                } else if constexpr (std::is_same_v<T, double>) {
                    return std::to_string(arg);
                } else if constexpr (std::is_same_v<T, bool>) {
                    return arg ? "true" : "false";
                } else {
                    return "";
                }
            }, args[0]);
        }
        
        auto arduinoString = createString(initialValue);
        EnhancedCommandValue enhancedResult = arduinoString;
        // Convert back to basic CommandValue for compatibility
        return downgradeCommandValue(enhancedResult);
    }
    
    // Dynamic memory allocation operators
    else if (name == "new" && args.size() >= 1) {
        // new operator - allocate new object/array
        std::string typeName = std::visit([](auto&& arg) -> std::string {
            using T = std::decay_t<decltype(arg)>;
            if constexpr (std::is_same_v<T, std::string>) {
                return arg;
            } else {
                return "int";  // Default to int for numeric size
            }
        }, args[0]);
        
        if (typeName == "int" || typeName == "float" || typeName == "double" || typeName == "char" || typeName == "byte") {
            // Allocate primitive type - return pointer address simulation
            static int allocationCounter = 1000;
            std::string pointerAddress = "&allocated_" + std::to_string(allocationCounter++);
            return pointerAddress;
        } else {
            // Allocate struct/object type - create new struct
            auto newStruct = createStruct(typeName);
            EnhancedCommandValue enhancedResult = newStruct;
            return downgradeCommandValue(enhancedResult);
        }
    } else if (name == "delete" && args.size() >= 1) {
        // delete operator - deallocate object/array (simulation)
        debugLog("delete operator called - memory deallocation simulated");
        return std::monostate{};
    } else if (name == "malloc" && args.size() >= 1) {
        // malloc - allocate raw memory (simulation)
        int32_t size = convertToInt(args[0]);
        static int mallocCounter = 2000;
        std::string pointerAddress = "&malloc_" + std::to_string(mallocCounter++) + "_size_" + std::to_string(size);
        debugLog("malloc(" + std::to_string(size) + ") -> " + pointerAddress);
        return pointerAddress;
    } else if (name == "free" && args.size() >= 1) {
        // free - deallocate raw memory (simulation)
        debugLog("free() called - memory deallocation simulated");
        return std::monostate{};
    }
    
    // Library functions
    else if (libraryInterface_->hasFunction(name)) {
        return libraryInterface_->callFunction(name, args);
    }
    
    // No matching Arduino function found
    
    // Complete function timing tracking before error
    auto functionEnd = std::chrono::steady_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(functionEnd - functionStart);
    functionExecutionTimes_[name] += duration;
    
    emitError("Unknown function: " + name);
    return std::monostate{};
}

CommandValue ASTInterpreter::handlePinOperation(const std::string& function, const std::vector<CommandValue>& args) {
    if (function == "pinMode" && args.size() >= 2) {
        int32_t pin = convertToInt(args[0]);
        int32_t modeVal = convertToInt(args[1]);
        
        PinMode mode = static_cast<PinMode>(modeVal);
        emitCommand(CommandFactory::createPinMode(pin, mode));
        
        return std::monostate{};
        
    } else if (function == "digitalWrite" && args.size() >= 2) {
        int32_t pin = convertToInt(args[0]);
        int32_t value = convertToInt(args[1]);
        
        DigitalValue digitalVal = static_cast<DigitalValue>(value);
        emitCommand(CommandFactory::createDigitalWrite(pin, digitalVal));
        
        return std::monostate{};
        
    } else if (function == "digitalRead" && args.size() >= 1) {
        // CONTINUATION PATTERN: Check if we're returning a cached response
        if (state_ == ExecutionState::RUNNING && lastExpressionResult_.index() != 0) {
            // We have a cached response from the continuation system
            CommandValue result = lastExpressionResult_;
            lastExpressionResult_ = std::monostate{}; // Clear the cache
            debugLog("HandlePinOperation: Returning cached digitalRead result: " + commandValueToString(result));
            return result;
        }
        
        // First call - initiate the request using continuation system
        int32_t pin = convertToInt(args[0]);
        requestDigitalRead(pin);
        
        // Return placeholder value - execution will be suspended
        debugLog("HandlePinOperation: digitalRead request initiated, suspending execution");
        return std::monostate{};
        
    } else if (function == "analogWrite" && args.size() >= 2) {
        int32_t pin = convertToInt(args[0]);
        int32_t value = convertToInt(args[1]);
        
        emitCommand(CommandFactory::createAnalogWrite(pin, value));
        
        return std::monostate{};
        
    } else if (function == "analogRead" && args.size() >= 1) {
        // CONTINUATION PATTERN: Check if we're returning a cached response
        if (state_ == ExecutionState::RUNNING && lastExpressionResult_.index() != 0) {
            // We have a cached response from the continuation system
            CommandValue result = lastExpressionResult_;
            lastExpressionResult_ = std::monostate{}; // Clear the cache
            debugLog("HandlePinOperation: Returning cached analogRead result: " + commandValueToString(result));
            return result;
        }
        
        // First call - initiate the request using continuation system
        int32_t pin = convertToInt(args[0]);
        requestAnalogRead(pin);
        
        // Return placeholder value - execution will be suspended
        // The tick() method will handle continuation and provide the real result
        debugLog("HandlePinOperation: analogRead request initiated, suspending execution");
        return std::monostate{};
    }
    
    emitError("Invalid arguments for " + function);
    return std::monostate{};
}

CommandValue ASTInterpreter::handleTimingOperation(const std::string& function, const std::vector<CommandValue>& args) {
    if (function == "delay" && args.size() >= 1) {
        uint32_t ms = static_cast<uint32_t>(convertToInt(args[0]));
        emitCommand(CommandFactory::createDelay(ms));
        return std::monostate{};
        
    } else if (function == "delayMicroseconds" && args.size() >= 1) {
        uint32_t us = static_cast<uint32_t>(convertToInt(args[0]));
        emitCommand(CommandFactory::createDelayMicroseconds(us));
        return std::monostate{};
        
    } else if (function == "millis") {
        // CONTINUATION PATTERN: Check if we're returning a cached response
        if (state_ == ExecutionState::RUNNING && lastExpressionResult_.index() != 0) {
            // We have a cached response from the continuation system
            CommandValue result = lastExpressionResult_;
            lastExpressionResult_ = std::monostate{}; // Clear the cache
            debugLog("HandleTimingOperation: Returning cached millis result: " + commandValueToString(result));
            return result;
        }
        
        // First call - initiate the request using continuation system
        requestMillis();
        
        // Return placeholder value - execution will be suspended
        debugLog("HandleTimingOperation: millis request initiated, suspending execution");
        return std::monostate{};
        
    } else if (function == "micros") {
        // CONTINUATION PATTERN: Check if we're returning a cached response
        if (state_ == ExecutionState::RUNNING && lastExpressionResult_.index() != 0) {
            // We have a cached response from the continuation system
            CommandValue result = lastExpressionResult_;
            lastExpressionResult_ = std::monostate{}; // Clear the cache
            debugLog("HandleTimingOperation: Returning cached micros result: " + commandValueToString(result));
            return result;
        }
        
        // First call - initiate the request using continuation system
        requestMicros();
        
        // Return placeholder value - execution will be suspended
        debugLog("HandleTimingOperation: micros request initiated, suspending execution");
        return std::monostate{};
    }
    
    emitError("Invalid arguments for " + function);
    return std::monostate{};
}

CommandValue ASTInterpreter::handleSerialOperation(const std::string& function, const std::vector<CommandValue>& args) {
    debugLog("Serial operation: " + function + " with " + std::to_string(args.size()) + " args");
    
    // Handle different Serial methods
    if (function == "begin") {
        // Serial.begin(baudRate) - Initialize serial communication
        int32_t baudRate = args.size() > 0 ? convertToInt(args[0]) : 9600;
        emitCommand(CommandFactory::createSerialBegin(baudRate));
        return std::monostate{};
    }
    
    else if (function == "print") {
        // Serial.print(data) or Serial.print(data, format)
        if (args.size() == 0) return std::monostate{};
        
        std::string output;
        int32_t format = args.size() > 1 ? convertToInt(args[1]) : 10; // Default DEC
        
        // Handle different data types and formatting
        const CommandValue& data = args[0];
        if (std::holds_alternative<int32_t>(data)) {
            int32_t value = std::get<int32_t>(data);
            switch (format) {
                case 16: // HEX
                    output = std::to_string(value); // Will be formatted by parent app
                    emitCommand(CommandFactory::createSerialPrint(output, "HEX"));
                    break;
                case 2: // BIN
                    output = std::to_string(value);
                    emitCommand(CommandFactory::createSerialPrint(output, "BIN"));
                    break;
                case 8: // OCT
                    output = std::to_string(value);
                    emitCommand(CommandFactory::createSerialPrint(output, "OCT"));
                    break;
                default: // DEC
                    output = std::to_string(value);
                    emitCommand(CommandFactory::createSerialPrint(output, "DEC"));
                    break;
            }
        } else if (std::holds_alternative<double>(data)) {
            double value = std::get<double>(data);
            int32_t places = args.size() > 2 ? convertToInt(args[2]) : 2; // Default 2 decimal places
            output = std::to_string(value);
            emitCommand(CommandFactory::createSerialPrint(output, "FLOAT"));
        } else if (std::holds_alternative<std::string>(data)) {
            output = std::get<std::string>(data);
            emitCommand(CommandFactory::createSerialPrint(output, "STRING"));
        } else if (std::holds_alternative<bool>(data)) {
            output = std::get<bool>(data) ? "1" : "0";
            emitCommand(CommandFactory::createSerialPrint(output, "BOOL"));
        } else {
            output = commandValueToString(data);
            emitCommand(CommandFactory::createSerialPrint(output, "AUTO"));
        }
        return std::monostate{};
    }
    
    else if (function == "println") {
        // Serial.println(data) or Serial.println(data, format) - print with newline
        if (args.size() == 0) {
            emitCommand(CommandFactory::createSerialPrintln("", "NEWLINE"));
        } else {
            // First do the print operation
            handleSerialOperation("print", args);
            // Then add newline
            emitCommand(CommandFactory::createSerialPrintln("", "NEWLINE"));
        }
        return std::monostate{};
    }
    
    else if (function == "write") {
        // Serial.write(data) - Write binary data
        if (args.size() > 0) {
            int32_t byte = convertToInt(args[0]);
            emitCommand(CommandFactory::createSerialWrite(byte));
        }
        return std::monostate{};
    }
    
    // External methods that require hardware/parent app response
    else if (function == "available") {
        // Serial.available() - Check bytes in receive buffer
        std::string requestId = generateRequestId("serialAvailable");
        emitCommand(CommandFactory::createSerialRequest("available", requestId));
        return waitForResponse(requestId);
    }
    
    else if (function == "read") {
        // Serial.read() - Read single byte from buffer
        std::string requestId = generateRequestId("serialRead");
        emitCommand(CommandFactory::createSerialRequest("read", requestId));
        return waitForResponse(requestId);
    }
    
    else if (function == "peek") {
        // Serial.peek() - Look at next byte without removing it
        std::string requestId = generateRequestId("serialPeek");
        emitCommand(CommandFactory::createSerialRequest("peek", requestId));
        return waitForResponse(requestId);
    }
    
    else if (function == "readString") {
        // Serial.readString() - Read characters into String
        std::string requestId = generateRequestId("serialReadString");
        emitCommand(CommandFactory::createSerialRequest("readString", requestId));
        return waitForResponse(requestId);
    }
    
    else if (function == "readStringUntil") {
        // Serial.readStringUntil(char) - Read until character found
        if (args.size() > 0) {
            char terminator = static_cast<char>(convertToInt(args[0]));
            std::string requestId = generateRequestId("serialReadStringUntil");
            emitCommand(CommandFactory::createSerialRequestWithChar("readStringUntil", terminator, requestId));
            return waitForResponse(requestId);
        }
        return std::string("");
    }
    
    else if (function == "parseInt") {
        // Serial.parseInt() - Parse integer from serial input
        std::string requestId = generateRequestId("serialParseInt");
        emitCommand(CommandFactory::createSerialRequest("parseInt", requestId));
        return waitForResponse(requestId);
    }
    
    else if (function == "parseFloat") {
        // Serial.parseFloat() - Parse float from serial input
        std::string requestId = generateRequestId("serialParseFloat");
        emitCommand(CommandFactory::createSerialRequest("parseFloat", requestId));
        return waitForResponse(requestId);
    }
    
    else if (function == "setTimeout") {
        // Serial.setTimeout(time) - Set timeout for parse functions
        if (args.size() > 0) {
            int32_t timeout = convertToInt(args[0]);
            emitCommand(CommandFactory::createSerialTimeout(timeout));
        }
        return std::monostate{};
    }
    
    else if (function == "flush") {
        // Serial.flush() - Wait for transmission to complete
        emitCommand(CommandFactory::createSerialFlush());
        return std::monostate{};
    }
    
    // Multiple Serial port support
    else if (function.find("Serial1.") == 0 || function.find("Serial2.") == 0 || function.find("Serial3.") == 0) {
        std::string portName = function.substr(0, function.find('.'));
        std::string methodName = function.substr(function.find('.') + 1);
        
        // Delegate to specific serial port handler
        return handleMultipleSerialOperation(portName, methodName, args);
    }
    
    // Default: emit as generic serial command
    emitCommand(CommandFactory::createFunctionCall(function));
    return std::monostate{};
}

CommandValue ASTInterpreter::handleMultipleSerialOperation(const std::string& portName, const std::string& methodName, const std::vector<CommandValue>& args) {
    debugLog("Multiple Serial operation: " + portName + "." + methodName);
    
    // Handle multiple serial ports (Serial1, Serial2, Serial3)
    // Each port maintains separate state and buffers
    
    if (methodName == "begin") {
        int32_t baudRate = args.size() > 0 ? convertToInt(args[0]) : 9600;
        emitCommand(CommandFactory::createMultiSerialBegin(portName, baudRate));
        return std::monostate{};
    }
    else if (methodName == "print") {
        if (args.size() > 0) {
            std::string output = convertToString(args[0]);
            std::string format = args.size() > 1 ? convertToString(args[1]) : "DEC";
            emitCommand(CommandFactory::createMultiSerialPrint(portName, output, format));
        }
        return std::monostate{};
    }
    else if (methodName == "println") {
        if (args.size() == 0) {
            emitCommand(CommandFactory::createMultiSerialPrintln(portName, "", "NEWLINE"));
        } else {
            handleMultipleSerialOperation(portName, "print", args);
            emitCommand(CommandFactory::createMultiSerialPrintln(portName, "", "NEWLINE"));
        }
        return std::monostate{};
    }
    else if (methodName == "available") {
        std::string requestId = generateRequestId("multiSerial" + portName + "Available");
        emitCommand(CommandFactory::createMultiSerialRequest(portName, "available", requestId));
        return waitForResponse(requestId);
    }
    else if (methodName == "read") {
        std::string requestId = generateRequestId("multiSerial" + portName + "Read");
        emitCommand(CommandFactory::createMultiSerialRequest(portName, "read", requestId));
        return waitForResponse(requestId);
    }
    
    // Default: emit as generic multi-serial command
    emitCommand(CommandFactory::createMultiSerialCommand(portName, methodName));
    return std::monostate{};
}

std::string ASTInterpreter::generateRequestId(const std::string& prefix) {
    static uint32_t counter = 0;
    return prefix + "_" + std::to_string(++counter) + "_" + std::to_string(std::chrono::steady_clock::now().time_since_epoch().count());
}

CommandValue ASTInterpreter::waitForResponse(const std::string& requestId) {
    // Set up the interpreter to wait for a response with this ID
    waitingForRequestId_ = requestId;
    previousExecutionState_ = state_;
    state_ = ExecutionState::WAITING_FOR_RESPONSE;
    
    debugLog("Waiting for response with ID: " + requestId);
    return std::monostate{}; // Will be replaced when response arrives
}

// =============================================================================
// UTILITY METHODS
// =============================================================================

int32_t ASTInterpreter::convertToInt(const CommandValue& value) {
    return std::visit([](const auto& v) -> int32_t {
        using T = std::decay_t<decltype(v)>;
        if constexpr (std::is_same_v<T, int32_t>) {
            return v;
        } else if constexpr (std::is_same_v<T, double>) {
            return static_cast<int32_t>(v);
        } else if constexpr (std::is_same_v<T, bool>) {
            return v ? 1 : 0;
        } else if constexpr (std::is_same_v<T, std::string>) {
            try {
                return std::stoi(v);
            } catch (...) {
                return 0;
            }
        }
        return 0;
    }, value);
}


double ASTInterpreter::convertToDouble(const CommandValue& value) {
    return std::visit([](const auto& v) -> double {
        using T = std::decay_t<decltype(v)>;
        if constexpr (std::is_same_v<T, double>) {
            return v;
        } else if constexpr (std::is_same_v<T, int32_t>) {
            return static_cast<double>(v);
        } else if constexpr (std::is_same_v<T, bool>) {
            return v ? 1.0 : 0.0;
        } else if constexpr (std::is_same_v<T, std::string>) {
            try {
                return std::stod(v);
            } catch (...) {
                return 0.0;
            }
        }
        return 0.0;
    }, value);
}

std::string ASTInterpreter::convertToString(const CommandValue& value) {
    return commandValueToString(value);
}

bool ASTInterpreter::convertToBool(const CommandValue& value) {
    return std::visit([](const auto& v) -> bool {
        using T = std::decay_t<decltype(v)>;
        if constexpr (std::is_same_v<T, bool>) {
            return v;
        } else if constexpr (std::is_same_v<T, int32_t>) {
            return v != 0;
        } else if constexpr (std::is_same_v<T, double>) {
            return v != 0.0;
        } else if constexpr (std::is_same_v<T, std::string>) {
            return !v.empty();
        } else if constexpr (std::is_same_v<T, std::monostate>) {
            return false;
        }
        return false;
    }, value);
}

bool ASTInterpreter::isNumeric(const CommandValue& value) {
    return std::holds_alternative<int32_t>(value) || std::holds_alternative<double>(value);
}

// =============================================================================
// COMMAND EMISSION
// =============================================================================

void ASTInterpreter::emitCommand(CommandPtr command) {
    if (commandListener_) {
        commandListener_->onCommand(*command);
    }
    
    // Update performance statistics
    commandsGenerated_++;
    
    // Track command type frequency
    std::string commandType = command->getTypeString();
    commandTypeCounters_[commandType]++;
    
    // Update memory tracking
    size_t commandSize = sizeof(*command) + command->toString().length();
    currentCommandMemory_ += commandSize;
    if (currentCommandMemory_ > peakCommandMemory_) {
        peakCommandMemory_ = currentCommandMemory_;
    }
    
    debugLog("Emitted: " + command->toString());
}

void ASTInterpreter::emitError(const std::string& message, const std::string& type) {
    auto errorCmd = CommandFactory::createError(message, type);
    emitCommand(std::move(errorCmd));
    
    // Track error statistics
    errorsGenerated_++;
    
    if (commandListener_) {
        commandListener_->onError(message);
    }
}

void ASTInterpreter::emitSystemCommand(CommandType type, const std::string& message) {
    auto sysCmd = CommandFactory::createSystemCommand(type, message);
    emitCommand(std::move(sysCmd));
}

// =============================================================================
// HELPER METHODS
// =============================================================================

void ASTInterpreter::enterLoop(const std::string& loopType) {
    inLoop_ = true;
    // Note: currentLoopIteration_ is incremented in executeLoop() to match JS behavior
}

void ASTInterpreter::exitLoop(const std::string& loopType) {
    // Loop management logic
}

bool ASTInterpreter::checkLoopLimit() {
    return currentLoopIteration_ < maxLoopIterations_;
}

void ASTInterpreter::resetControlFlow() {
    shouldBreak_ = false;
    shouldContinue_ = false; 
    shouldReturn_ = false;
    returnValue_ = std::monostate{};
    
    // Reset switch statement state
    currentSwitchValue_ = std::monostate{};
    inSwitchFallthrough_ = false;
}

void ASTInterpreter::processResponseQueue() {
    // Process all queued responses
    while (!responseQueue_.empty()) {
        auto [requestId, value] = responseQueue_.front();
        responseQueue_.pop();
        
        // Store the response value for consumption
        pendingResponseValues_[requestId] = value;
        
        debugLog("Processed queued response: " + requestId + " = " + commandValueToString(value));
    }
}

void ASTInterpreter::queueResponse(const std::string& requestId, const CommandValue& value) {
    responseQueue_.push({requestId, value});
}

bool ASTInterpreter::isWaitingForResponse() const {
    return state_ == ExecutionState::WAITING_FOR_RESPONSE && !waitingForRequestId_.empty();
}

bool ASTInterpreter::hasResponse(const std::string& requestId) const {
    return pendingResponseValues_.find(requestId) != pendingResponseValues_.end();
}

CommandValue ASTInterpreter::consumeResponse(const std::string& requestId) {
    auto it = pendingResponseValues_.find(requestId);
    if (it != pendingResponseValues_.end()) {
        CommandValue value = it->second;
        pendingResponseValues_.erase(it);
        return value;
    }
    return std::monostate{}; // No response available
}

// =============================================================================
// EXTERNAL DATA FUNCTION REQUESTS (CONTINUATION PATTERN)
// =============================================================================

void ASTInterpreter::requestAnalogRead(int32_t pin) {
    // Generate unique request ID
    auto now = std::chrono::steady_clock::now();
    auto duration = now.time_since_epoch();
    auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(duration).count();
    auto requestId = "analogRead_" + std::to_string(millis) + "_" + std::to_string(rand() % 1000000);
    
    // Set suspension state
    previousExecutionState_ = state_;
    state_ = ExecutionState::WAITING_FOR_RESPONSE;
    waitingForRequestId_ = requestId;
    suspendedFunction_ = "analogRead";
    
    // Emit request command
    auto cmd = CommandFactory::createAnalogReadRequest(pin);
    emitCommand(std::move(cmd));
    
    debugLog("Requested analogRead(" + std::to_string(pin) + ") with ID: " + requestId);
}

void ASTInterpreter::requestDigitalRead(int32_t pin) {
    auto now = std::chrono::steady_clock::now();
    auto duration = now.time_since_epoch();
    auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(duration).count();
    auto requestId = "digitalRead_" + std::to_string(millis) + "_" + std::to_string(rand() % 1000000);
    
    previousExecutionState_ = state_;
    state_ = ExecutionState::WAITING_FOR_RESPONSE;
    waitingForRequestId_ = requestId;
    suspendedFunction_ = "digitalRead";
    
    auto cmd = CommandFactory::createDigitalReadRequest(pin);
    emitCommand(std::move(cmd));
    
    debugLog("Requested digitalRead(" + std::to_string(pin) + ") with ID: " + requestId);
}

void ASTInterpreter::requestMillis() {
    auto now = std::chrono::steady_clock::now();
    auto duration = now.time_since_epoch();
    auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(duration).count();
    auto requestId = "millis_" + std::to_string(millis) + "_" + std::to_string(rand() % 1000000);
    
    previousExecutionState_ = state_;
    state_ = ExecutionState::WAITING_FOR_RESPONSE;
    waitingForRequestId_ = requestId;
    suspendedFunction_ = "millis";
    
    auto cmd = CommandFactory::createMillisRequest();
    emitCommand(std::move(cmd));
    
    debugLog("Requested millis() with ID: " + requestId);
}

void ASTInterpreter::requestMicros() {
    auto now = std::chrono::steady_clock::now();
    auto duration = now.time_since_epoch();
    auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(duration).count();
    auto requestId = "micros_" + std::to_string(millis) + "_" + std::to_string(rand() % 1000000);
    
    previousExecutionState_ = state_;
    state_ = ExecutionState::WAITING_FOR_RESPONSE;
    waitingForRequestId_ = requestId;
    suspendedFunction_ = "micros";
    
    auto cmd = CommandFactory::createMicrosRequest();
    emitCommand(std::move(cmd));
    
    debugLog("Requested micros() with ID: " + requestId);
}

bool ASTInterpreter::handleResponse(const std::string& requestId, const CommandValue& value) {
    debugLog("handleResponse called: " + requestId + " = " + commandValueToString(value));
    
    // Queue the response for processing by the next tick()
    queueResponse(requestId, value);
    
    // If we're currently waiting for this specific response, trigger immediate processing
    if (state_ == ExecutionState::WAITING_FOR_RESPONSE && waitingForRequestId_ == requestId) {
        debugLog("handleResponse: Response matches waiting request, immediate processing");
        return true;
    }
    
    return false;
}

void ASTInterpreter::debugLog(const std::string& message) {
    if (options_.debug) {
        DEBUG_OUT << "[DEBUG] " << message << std::endl;
    }
}

void ASTInterpreter::verboseLog(const std::string& message) {
    if (options_.verbose) {
        DEBUG_OUT << "[VERBOSE] " << message << std::endl;
    }
}

void ASTInterpreter::logExecutionState(const std::string& context) {
    if (options_.debug) {
        DEBUG_OUT << "[STATE] " << context << " - State: " << executionStateToString(state_) << std::endl;
    }
}

// =============================================================================
// ARDUINO LIBRARY INTERFACE IMPLEMENTATION
// =============================================================================

void ArduinoLibraryInterface::registerStandardFunctions() {
    // Register standard Arduino functions
    registerFunction("map", [this](const std::vector<CommandValue>& args) -> CommandValue {
        if (args.size() != 5) return std::monostate{};
        
        double value = interpreter_->convertToDouble(args[0]);
        double fromLow = interpreter_->convertToDouble(args[1]);
        double fromHigh = interpreter_->convertToDouble(args[2]);
        double toLow = interpreter_->convertToDouble(args[3]);
        double toHigh = interpreter_->convertToDouble(args[4]);
        
        double result = (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;
        return static_cast<int32_t>(result);
    });
    
    registerFunction("constrain", [this](const std::vector<CommandValue>& args) -> CommandValue {
        if (args.size() != 3) return std::monostate{};
        
        double value = interpreter_->convertToDouble(args[0]);
        double minVal = interpreter_->convertToDouble(args[1]);
        double maxVal = interpreter_->convertToDouble(args[2]);
        
        if (value < minVal) return static_cast<int32_t>(minVal);
        if (value > maxVal) return static_cast<int32_t>(maxVal);
        return static_cast<int32_t>(value);
    });
}

CommandValue ArduinoLibraryInterface::callFunction(const std::string& name, const std::vector<CommandValue>& args) {
    auto it = functions_.find(name);
    if (it != functions_.end()) {
        return it->second(args);
    }
    return std::monostate{};
}

void ArduinoLibraryInterface::registerFunction(const std::string& name, 
                                              std::function<CommandValue(const std::vector<CommandValue>&)> func) {
    functions_[name] = std::move(func);
}

bool ArduinoLibraryInterface::hasFunction(const std::string& name) const {
    return functions_.find(name) != functions_.end();
}

// =============================================================================
// UTILITY FUNCTION IMPLEMENTATIONS
// =============================================================================

std::unique_ptr<ASTInterpreter> createInterpreterFromCompactAST(
    const uint8_t* data, size_t size, const InterpreterOptions& options) {
    return std::make_unique<ASTInterpreter>(data, size, options);
}

// =============================================================================
// MISSING FUNCTION IMPLEMENTATIONS (Stubs for linking)
// =============================================================================

ASTInterpreter::MemoryStats ASTInterpreter::getMemoryStats() const {
    MemoryStats stats;
    
    // Calculate actual memory usage from scope managers
    if (scopeManager_) {
        stats.variableCount = scopeManager_->getVariableCount();
        stats.variableMemory = currentVariableMemory_;
    } else {
        stats.variableCount = 0;
        stats.variableMemory = 0;
    }
    
    // Pending requests from response system
    stats.pendingRequests = static_cast<uint32_t>(pendingResponseValues_.size());
    
    // Memory tracking values
    stats.peakVariableMemory = peakVariableMemory_;
    stats.peakCommandMemory = peakCommandMemory_;
    stats.commandMemory = currentCommandMemory_;
    stats.memoryAllocations = memoryAllocations_;
    
    // AST memory estimation (approximate)
    stats.astMemory = ast_ ? sizeof(*ast_) : 0;  // Basic estimation
    
    // Total memory calculation
    stats.totalMemory = stats.variableMemory + stats.astMemory + stats.commandMemory;
    
    return stats;
}

ASTInterpreter::ExecutionStats ASTInterpreter::getExecutionStats() const {
    ExecutionStats stats;
    
    // Timing information
    stats.totalExecutionTime = totalExecutionTime_;
    stats.functionExecutionTime = functionExecutionTime_;
    
    // Command statistics
    stats.commandsGenerated = commandsGenerated_;
    stats.errorsGenerated = errorsGenerated_;
    
    // Function execution statistics
    stats.functionsExecuted = functionsExecuted_;
    stats.userFunctionsExecuted = userFunctionsExecuted_;
    stats.arduinoFunctionsExecuted = arduinoFunctionsExecuted_;
    
    // Loop statistics
    stats.loopsExecuted = loopsExecuted_;
    stats.totalLoopIterations = totalLoopIterations_;
    stats.maxLoopDepth = maxLoopDepth_;
    
    // Variable access statistics
    stats.variablesAccessed = variablesAccessed_;
    stats.variablesModified = variablesModified_;
    stats.arrayAccessCount = arrayAccessCount_;
    stats.structAccessCount = structAccessCount_;
    
    // Recursion statistics
    stats.maxRecursionDepth = maxRecursionDepth_;
    
    return stats;
}

ASTInterpreter::HardwareStats ASTInterpreter::getHardwareStats() const {
    HardwareStats stats;
    
    stats.pinOperations = pinOperations_;
    stats.analogReads = analogReads_;
    stats.digitalReads = digitalReads_;
    stats.analogWrites = analogWrites_;
    stats.digitalWrites = digitalWrites_;
    stats.serialOperations = serialOperations_;
    stats.timeoutOccurrences = timeoutOccurrences_;
    
    return stats;
}

ASTInterpreter::FunctionCallStats ASTInterpreter::getFunctionCallStats() const {
    FunctionCallStats stats;
    
    stats.callCounts = functionCallCounters_;
    stats.executionTimes = functionExecutionTimes_;
    
    // Find most called function
    uint32_t maxCalls = 0;
    for (const auto& pair : functionCallCounters_) {
        if (pair.second > maxCalls) {
            maxCalls = pair.second;
            stats.mostCalledFunction = pair.first;
        }
    }
    
    // Find slowest function
    std::chrono::microseconds maxTime{0};
    for (const auto& pair : functionExecutionTimes_) {
        if (pair.second > maxTime) {
            maxTime = pair.second;
            stats.slowestFunction = pair.first;
        }
    }
    
    return stats;
}

ASTInterpreter::VariableAccessStats ASTInterpreter::getVariableAccessStats() const {
    VariableAccessStats stats;
    
    stats.accessCounts = variableAccessCounters_;
    stats.modificationCounts = variableModificationCounters_;
    
    // Find most accessed variable
    uint32_t maxAccess = 0;
    for (const auto& pair : variableAccessCounters_) {
        if (pair.second > maxAccess) {
            maxAccess = pair.second;
            stats.mostAccessedVariable = pair.first;
        }
    }
    
    // Find most modified variable
    uint32_t maxMod = 0;
    for (const auto& pair : variableModificationCounters_) {
        if (pair.second > maxMod) {
            maxMod = pair.second;
            stats.mostModifiedVariable = pair.first;
        }
    }
    
    return stats;
}

void ASTInterpreter::resetStatistics() {
    // Reset timing
    totalExecutionTime_ = std::chrono::milliseconds{0};
    functionExecutionTime_ = std::chrono::milliseconds{0};
    
    // Reset command statistics
    commandsGenerated_ = 0;
    errorsGenerated_ = 0;
    commandTypeCounters_.clear();
    
    // Reset function statistics
    functionsExecuted_ = 0;
    userFunctionsExecuted_ = 0;
    arduinoFunctionsExecuted_ = 0;
    functionCallCounters_.clear();
    functionExecutionTimes_.clear();
    
    // Reset loop statistics
    loopsExecuted_ = 0;
    totalLoopIterations_ = 0;
    loopTypeCounters_.clear();
    maxLoopDepth_ = 0;
    currentLoopDepth_ = 0;
    
    // Reset variable statistics
    variablesAccessed_ = 0;
    variablesModified_ = 0;
    arrayAccessCount_ = 0;
    structAccessCount_ = 0;
    variableAccessCounters_.clear();
    variableModificationCounters_.clear();
    
    // Reset memory statistics
    peakVariableMemory_ = 0;
    currentVariableMemory_ = 0;
    peakCommandMemory_ = 0;
    currentCommandMemory_ = 0;
    memoryAllocations_ = 0;
    
    // Reset hardware statistics
    pinOperations_ = 0;
    analogReads_ = 0;
    digitalReads_ = 0;
    analogWrites_ = 0;
    digitalWrites_ = 0;
    serialOperations_ = 0;
    
    // Reset error statistics
    recursionDepth_ = 0;
    maxRecursionDepth_ = 0;
    timeoutOccurrences_ = 0;
}

CommandValue ASTInterpreter::evaluateUnaryOperation(const std::string& op, const CommandValue& operand) {
    // Handle different unary operators
    if (op == "-") {
        // Unary minus
        return -convertToInt(operand);
    } else if (op == "+") {
        // Unary plus 
        return convertToInt(operand);
    } else if (op == "!") {
        // Logical NOT
        return !convertToBool(operand);
    } else if (op == "~") {
        // Bitwise NOT
        return ~convertToInt(operand);
    } else if (op == "++" || op == "--") {
        // Note: Increment/decrement need variable context, not just value
        // These should be handled at a higher level with variable access
        emitError("Increment/decrement operators require variable context");
        return std::monostate{};
    } else if (op == "*") {
        // Pointer dereference - for now, simulate by looking up dereferenced variable
        // In a full implementation, this would follow the pointer to read memory
        if (std::holds_alternative<std::string>(operand)) {
            std::string pointerName = std::get<std::string>(operand);
            std::string dereferenceVarName = "*" + pointerName;
            Variable* derefVar = scopeManager_->getVariable(dereferenceVarName);
            if (derefVar) {
                return derefVar->value;
            } else {
                // Return default value if dereferenced location not found
                return std::monostate{};
            }
        } else {
            emitError("Pointer dereference requires pointer variable");
            return std::monostate{};
        }
    } else if (op == "&") {
        // Address-of operator - return a simulated address (pointer to variable)
        if (std::holds_alternative<std::string>(operand)) {
            std::string varName = std::get<std::string>(operand);
            // Simulate address by returning a unique identifier for the variable
            return std::string("&" + varName);
        } else {
            emitError("Address-of operator requires variable name");
            return std::monostate{};
        }
    } else {
        emitError("Unknown unary operator: " + op);
        return std::monostate{};
    }
}

// =============================================================================
// STATE MACHINE EXECUTION METHODS
// =============================================================================

void ASTInterpreter::tick() {
    // Only proceed if we're in RUNNING or WAITING_FOR_RESPONSE state
    if (state_ != ExecutionState::RUNNING && state_ != ExecutionState::WAITING_FOR_RESPONSE) {
        return;
    }
    
    // Prevent re-entry
    static bool inTick = false;
    if (inTick) {
        return;
    }
    inTick = true;
    
    try {
        // Process any queued responses first
        processResponseQueue();
        
        // CONTINUATION PATTERN: Handle resumption from WAITING_FOR_RESPONSE state
        if (state_ == ExecutionState::WAITING_FOR_RESPONSE && !waitingForRequestId_.empty()) {
            // Check if we have the response we're waiting for
            if (hasResponse(waitingForRequestId_)) {
                debugLog("Tick: Resuming execution - response available");
                debugLog("  - Function: " + suspendedFunction_);
                debugLog("  - Request ID: " + waitingForRequestId_);
                
                // Consume the response and store for the function to use
                lastExpressionResult_ = consumeResponse(waitingForRequestId_);
                debugLog("  - Response value: " + commandValueToString(lastExpressionResult_));
                
                // Restore previous execution state
                state_ = previousExecutionState_;
                previousExecutionState_ = ExecutionState::IDLE;
                
                // Clear suspension context - the function can now return the result
                waitingForRequestId_.clear();
                suspendedNode_ = nullptr;
                suspendedFunction_.clear();
                
                debugLog("Tick: Execution resumed, function can return result");
            } else {
                // Still waiting for response, cannot proceed
                inTick = false;
                return;
            }
        }
        
        // Normal execution flow - this mimics the JavaScript executeControlledProgram
        if (!setupCalled_) {
            // Execute setup() function if we haven't already - MEMORY SAFE
            if (userFunctionNames_.count("setup") > 0) {
                auto* setupFunc = findFunctionInAST("setup");
                if (setupFunc) {
                    debugLog("Tick: Executing setup() function");
                    emitSystemCommand(CommandType::SETUP_START, "Entering setup()");
                    
                    scopeManager_->pushScope();
                    currentFunction_ = setupFunc;
                    
                    try {
                        // Execute the function BODY, not the function definition
                        if (auto* funcDef = dynamic_cast<const arduino_ast::FuncDefNode*>(setupFunc)) {
                            const auto* body = funcDef->getBody();
                            if (body) {
                                const_cast<arduino_ast::ASTNode*>(body)->accept(*this);
                            } else {
                                debugLog("Tick: Setup function has no body");
                            }
                        } else {
                            debugLog("Tick: Setup function is not a FuncDefNode");
                        }
                } catch (const std::exception& e) {
                    emitError("Error in setup(): " + std::string(e.what()));
                    state_ = ExecutionState::ERROR;
                    inTick = false;
                    return;
                }
                
                currentFunction_ = nullptr;
                scopeManager_->popScope();
                setupCalled_ = true;
                
                emitSystemCommand(CommandType::SETUP_END, "Exiting setup()");
            } else {
                setupCalled_ = true; // Mark as called even if not found
            }
        } else {
            // Execute loop() function iterations - MEMORY SAFE
            if (userFunctionNames_.count("loop") > 0 && currentLoopIteration_ < maxLoopIterations_) {
                auto* loopFunc = findFunctionInAST("loop");
                if (loopFunc) {
                    debugLog("Tick: Executing loop() iteration " + std::to_string(currentLoopIteration_ + 1));
                    
                    // Increment iteration counter BEFORE processing (to match JS 1-based counting)
                    currentLoopIteration_++;
                    
                    // Emit loop iteration start command
                    emitCommand(CommandFactory::createLoopStart("loop", currentLoopIteration_));
                    
                    // Emit function call start command
                    emitCommand(CommandFactory::createFunctionCall("loop"));
                    
                    scopeManager_->pushScope();
                    currentFunction_ = loopFunc;
                
                    try {
                        // Execute the function BODY, not the function definition
                        if (auto* funcDef = dynamic_cast<const arduino_ast::FuncDefNode*>(loopFunc)) {
                            const auto* body = funcDef->getBody();
                            if (body) {
                                const_cast<arduino_ast::ASTNode*>(body)->accept(*this);
                            } else {
                                debugLog("Tick: Loop function has no body");
                            }
                        } else {
                            debugLog("Tick: Loop function is not a FuncDefNode");
                        }
                } catch (const std::exception& e) {
                    emitError("Error in loop(): " + std::string(e.what()));
                    state_ = ExecutionState::ERROR;
                    inTick = false;
                    return;
                }
                
                currentFunction_ = nullptr;
                scopeManager_->popScope();
                
                // Handle step delay - for Arduino, delays should be handled by parent application
                // The tick() method should return quickly and let the parent handle timing
                // Note: stepDelay is available in options_ if parent needs it
                
                // Process any pending requests
                processResponseQueue();
                }
            } else if (currentLoopIteration_ >= maxLoopIterations_) {
                // Loop limit reached
                debugLog("Tick: Loop limit reached, completing execution");
                state_ = ExecutionState::COMPLETE;
                emitSystemCommand(CommandType::PROGRAM_END, "Program execution completed");
            }
        }
    }
    } catch (const std::exception& e) {
        emitError("Tick execution error: " + std::string(e.what()));
        state_ = ExecutionState::ERROR;
    }
    
    inTick = false;
}

bool ASTInterpreter::resumeWithValue(const std::string& requestId, const CommandValue& value) {
    // Check if this is the response we are waiting for
    if (state_ != ExecutionState::WAITING_FOR_RESPONSE || 
        requestId != waitingForRequestId_) {
        return false; // Not the response we need
    }
    
    debugLog("ResumeWithValue: Received response for " + requestId + 
             " with value " + commandValueToString(value));
    
    // Store the value as the result of the suspended operation
    lastExpressionResult_ = value;
    
    // Clear the waiting state
    waitingForRequestId_.clear();
    suspendedNode_ = nullptr;
    suspendedFunction_.clear();
    
    // Resume execution
    state_ = ExecutionState::RUNNING;
    
    // Note: Don't call tick() here - let the external caller handle execution continuation
    // This prevents double execution that was happening in the JavaScript version
    
    return true;
}

// =============================================================================
// MISSING VISITOR METHODS FOR NEW NODE TYPES
// =============================================================================

void ASTInterpreter::visit(arduino_ast::ArrayDeclaratorNode& node) {
    debugLog("Visit: ArrayDeclaratorNode (stub implementation)");
    (void)node; // Suppress unused parameter warning
    // TODO: Implement array declarator handling if needed
}

void ASTInterpreter::visit(arduino_ast::PointerDeclaratorNode& node) {
    debugLog("Visit: PointerDeclaratorNode (stub implementation)");
    (void)node; // Suppress unused parameter warning
    // TODO: Implement pointer declarator handling if needed
}

// =============================================================================
// TYPE CONVERSION UTILITIES
// =============================================================================

CommandValue ASTInterpreter::convertToType(const CommandValue& value, const std::string& typeName) {
    debugLog("convertToType: Converting to type '" + typeName + "'");
    
    // Handle conversion from any CommandValue type to the target type
    if (typeName == "int" || typeName == "unsigned int" || typeName == "byte") {
        // Convert to integer
        if (std::holds_alternative<double>(value)) {
            int intValue = static_cast<int>(std::get<double>(value));
            debugLog("convertToType: double " + std::to_string(std::get<double>(value)) + " -> int " + std::to_string(intValue));
            return intValue;
        } else if (std::holds_alternative<bool>(value)) {
            int intValue = std::get<bool>(value) ? 1 : 0;
            debugLog(std::string("convertToType: bool ") + (std::get<bool>(value) ? "true" : "false") + " -> int " + std::to_string(intValue));
            return intValue;
        } else if (std::holds_alternative<int>(value)) {
            debugLog("convertToType: int value unchanged");
            return value; // Already int
        }
    } else if (typeName == "float" || typeName == "double") {
        // Convert to float/double
        if (std::holds_alternative<int>(value)) {
            double doubleValue = static_cast<double>(std::get<int>(value));
            debugLog("convertToType: int " + std::to_string(std::get<int>(value)) + " -> double " + std::to_string(doubleValue));
            return doubleValue;
        } else if (std::holds_alternative<bool>(value)) {
            double doubleValue = std::get<bool>(value) ? 1.0 : 0.0;
            debugLog(std::string("convertToType: bool ") + (std::get<bool>(value) ? "true" : "false") + " -> double " + std::to_string(doubleValue));
            return doubleValue;
        } else if (std::holds_alternative<double>(value)) {
            debugLog("convertToType: double value unchanged");
            return value; // Already double
        }
    } else if (typeName == "bool") {
        // Convert to bool
        if (std::holds_alternative<int>(value)) {
            bool boolValue = std::get<int>(value) != 0;
            debugLog("convertToType: int " + std::to_string(std::get<int>(value)) + " -> bool " + (boolValue ? "true" : "false"));
            return boolValue;
        } else if (std::holds_alternative<double>(value)) {
            bool boolValue = std::get<double>(value) != 0.0;
            debugLog("convertToType: double " + std::to_string(std::get<double>(value)) + " -> bool " + (boolValue ? "true" : "false"));
            return boolValue;
        } else if (std::holds_alternative<bool>(value)) {
            debugLog("convertToType: bool value unchanged");
            return value; // Already bool
        }
    } else if (typeName == "String" || typeName == "char*") {
        // Convert to string
        if (std::holds_alternative<std::string>(value)) {
            debugLog("convertToType: string value unchanged");
            return value; // Already string
        } else if (std::holds_alternative<int>(value)) {
            std::string stringValue = std::to_string(std::get<int>(value));
            debugLog("convertToType: int " + std::to_string(std::get<int>(value)) + " -> string '" + stringValue + "'");
            return stringValue;
        } else if (std::holds_alternative<double>(value)) {
            std::string stringValue = std::to_string(std::get<double>(value));
            debugLog("convertToType: double " + std::to_string(std::get<double>(value)) + " -> string '" + stringValue + "'");
            return stringValue;
        } else if (std::holds_alternative<bool>(value)) {
            std::string stringValue = std::get<bool>(value) ? "true" : "false";
            debugLog(std::string("convertToType: bool ") + (std::get<bool>(value) ? "true" : "false") + " -> string '" + stringValue + "'");
            return stringValue;
        }
    }
    
    debugLog("convertToType: No conversion rule found, returning original value");
    return value; // Return unchanged if no conversion rule
}

// =============================================================================
// MEMORY SAFE AST TRAVERSAL
// =============================================================================

arduino_ast::ASTNode* ASTInterpreter::findFunctionInAST(const std::string& functionName) {
    // Recursively search AST tree for function definition with given name
    std::function<arduino_ast::ASTNode*(arduino_ast::ASTNode*)> searchNode = 
        [&](arduino_ast::ASTNode* node) -> arduino_ast::ASTNode* {
        if (!node) return nullptr;
        
        // Check if this is a FuncDefNode with matching name
        if (node->getType() == arduino_ast::ASTNodeType::FUNC_DEF) {
            auto* funcDefNode = dynamic_cast<arduino_ast::FuncDefNode*>(node);
            if (funcDefNode) {
                auto* declarator = funcDefNode->getDeclarator();
                if (auto* declNode = dynamic_cast<const arduino_ast::DeclaratorNode*>(declarator)) {
                    if (declNode->getName() == functionName) {
                        return node;
                    }
                } else if (auto* identifier = dynamic_cast<const arduino_ast::IdentifierNode*>(declarator)) {
                    if (identifier->getName() == functionName) {
                        return node;
                    }
                }
            }
        }
        
        // Search children recursively
        for (auto& child : node->getChildren()) {
            if (auto* result = searchNode(child.get())) {
                return result;
            }
        }
        
        return nullptr;
    };
    
    return searchNode(ast_.get());
}

} // namespace arduino_interpreter