/**
 * ASTNodes.hpp - C++ AST Node Definitions for Arduino Interpreter
 * 
 * Cross-platform compatible AST node definitions that match the JavaScript parser
 * output. Designed for ESP32-S3 memory constraints and host development.
 * 
 * Version: 1.0
 * Compatible with: ArduinoParser.js v5.1.0
 * Format: Compact AST Binary Format Specification v1.0
 */

#pragma once

#include <cstdint>
#include <string>
#include <vector>
#include <memory>
#include <variant>
#include <map>

namespace arduino_ast {

// =============================================================================
// FORWARD DECLARATIONS
// =============================================================================

class ASTNode;
class ASTVisitor;

using ASTNodePtr = std::unique_ptr<ASTNode>;
using ASTNodeVector = std::vector<ASTNodePtr>;

// =============================================================================
// ENUMS AND TYPES
// =============================================================================

/**
 * AST Node Types - Must match JavaScript nodeTypeMap exactly
 */
enum class ASTNodeType : uint8_t {
    // Program structure
    PROGRAM = 0x01,
    ERROR_NODE = 0x02,
    COMMENT = 0x03,
    
    // Statements
    COMPOUND_STMT = 0x10,
    EXPRESSION_STMT = 0x11,
    IF_STMT = 0x12,
    WHILE_STMT = 0x13,
    DO_WHILE_STMT = 0x14,
    FOR_STMT = 0x15,
    RANGE_FOR_STMT = 0x16,
    SWITCH_STMT = 0x17,
    CASE_STMT = 0x18,
    RETURN_STMT = 0x19,
    BREAK_STMT = 0x1A,
    CONTINUE_STMT = 0x1B,
    EMPTY_STMT = 0x1C,
    
    // Declarations
    VAR_DECL = 0x20,
    FUNC_DEF = 0x21,
    FUNC_DECL = 0x22,
    STRUCT_DECL = 0x23,
    ENUM_DECL = 0x24,
    CLASS_DECL = 0x25,
    TYPEDEF_DECL = 0x26,
    TEMPLATE_DECL = 0x27,
    
    // Expressions
    BINARY_OP = 0x30,
    UNARY_OP = 0x31,
    ASSIGNMENT = 0x32,
    FUNC_CALL = 0x33,
    MEMBER_ACCESS = 0x34,
    ARRAY_ACCESS = 0x35,
    CAST_EXPR = 0x36,
    SIZEOF_EXPR = 0x37,
    TERNARY_EXPR = 0x38,
    
    // Literals and identifiers
    NUMBER_LITERAL = 0x40,
    STRING_LITERAL = 0x41,
    CHAR_LITERAL = 0x42,
    IDENTIFIER = 0x43,
    CONSTANT = 0x44,
    ARRAY_INIT = 0x45,
    
    // Types and parameters
    TYPE_NODE = 0x50,
    DECLARATOR_NODE = 0x51,
    PARAM_NODE = 0x52,
    POSTFIX_EXPRESSION = 0x53,
    STRUCT_TYPE = 0x54,
    FUNCTION_POINTER_DECLARATOR = 0x55,
    COMMA_EXPRESSION = 0x56,
    ARRAY_DECLARATOR = 0x57,
    POINTER_DECLARATOR = 0x58,
    
    // Unknown/Invalid
    UNKNOWN = 0xFF
};

/**
 * Node flags for additional properties
 */
enum class ASTNodeFlags : uint8_t {
    NONE = 0x00,
    HAS_CHILDREN = 0x01,
    HAS_VALUE = 0x02,
    HAS_METADATA = 0x04,
    IS_POINTER = 0x08,
    IS_REFERENCE = 0x10,
    IS_CONST = 0x20,
    RESERVED1 = 0x40,
    RESERVED2 = 0x80
};

inline ASTNodeFlags operator|(ASTNodeFlags a, ASTNodeFlags b) {
    return static_cast<ASTNodeFlags>(static_cast<uint8_t>(a) | static_cast<uint8_t>(b));
}

inline bool operator&(ASTNodeFlags a, ASTNodeFlags b) {
    return (static_cast<uint8_t>(a) & static_cast<uint8_t>(b)) != 0;
}

/**
 * Value types for cross-platform compatibility
 */
enum class ValueType : uint8_t {
    VOID_VAL = 0x00,
    BOOL_VAL = 0x01,
    INT8_VAL = 0x02,
    UINT8_VAL = 0x03,
    INT16_VAL = 0x04,
    UINT16_VAL = 0x05,
    INT32_VAL = 0x06,
    UINT32_VAL = 0x07,
    INT64_VAL = 0x08,
    UINT64_VAL = 0x09,
    FLOAT32_VAL = 0x0A,
    FLOAT64_VAL = 0x0B,
    STRING_VAL = 0x0C,
    ARRAY_VAL = 0x0D,
    NULL_VAL = 0x0E,
    OPERATOR_VAL = 0x0F
};

/**
 * Type-safe value container matching JavaScript values
 */
using ASTValue = std::variant<
    std::monostate,     // VOID_VAL
    bool,               // BOOL_VAL
    int8_t,             // INT8_VAL
    uint8_t,            // UINT8_VAL
    int16_t,            // INT16_VAL
    uint16_t,           // UINT16_VAL
    int32_t,            // INT32_VAL
    uint32_t,           // UINT32_VAL
    int64_t,            // INT64_VAL
    uint64_t,           // UINT64_VAL
    float,              // FLOAT32_VAL
    double,             // FLOAT64_VAL
    std::string         // STRING_VAL
>;

// =============================================================================
// BASE AST NODE
// =============================================================================

/**
 * Base class for all AST nodes
 * Designed for minimal memory footprint on embedded systems
 */
class ASTNode {
public:
    explicit ASTNode(ASTNodeType type) 
        : nodeType_(type), flags_(ASTNodeFlags::NONE) {}
    
    virtual ~ASTNode() = default;
    
    // Core properties
    ASTNodeType getType() const { return nodeType_; }
    ASTNodeFlags getFlags() const { return flags_; }
    void setFlags(ASTNodeFlags flags) { flags_ = flags; }
    void addFlag(ASTNodeFlags flag) { flags_ = flags_ | flag; }
    bool hasFlag(ASTNodeFlags flag) const { return flags_ & flag; }
    
    // Value access
    const ASTValue& getValue() const { return value_; }
    void setValue(const ASTValue& value) { 
        value_ = value; 
        addFlag(ASTNodeFlags::HAS_VALUE);
    }
    
    template<typename T>
    T getValueAs() const {
        if (std::holds_alternative<T>(value_)) {
            return std::get<T>(value_);
        }
        return T{};
    }
    
    // Children management
    const ASTNodeVector& getChildren() const { return children_; }
    void addChild(ASTNodePtr child) { 
        children_.push_back(std::move(child));
        addFlag(ASTNodeFlags::HAS_CHILDREN);
    }
    void reserveChildren(size_t count) { children_.reserve(count); }
    
    // Visitor pattern
    virtual void accept(ASTVisitor& visitor) = 0;
    
    // Debug support
    virtual std::string toString() const;
    
private:
    ASTNodeType nodeType_;
    ASTNodeFlags flags_;
    ASTValue value_;
    ASTNodeVector children_;
};

// =============================================================================
// PROGRAM STRUCTURE NODES
// =============================================================================

class ProgramNode : public ASTNode {
public:
    ProgramNode() : ASTNode(ASTNodeType::PROGRAM) {}
    void accept(ASTVisitor& visitor) override;
};

class ErrorNode : public ASTNode {
public:
    explicit ErrorNode(const std::string& message) : ASTNode(ASTNodeType::ERROR_NODE) {
        setValue(message);
    }
    
    std::string getMessage() const { return getValueAs<std::string>(); }
    void accept(ASTVisitor& visitor) override;
};

class CommentNode : public ASTNode {
public:
    explicit CommentNode(const std::string& text) : ASTNode(ASTNodeType::COMMENT) {
        setValue(text);
    }
    
    std::string getText() const { return getValueAs<std::string>(); }
    void accept(ASTVisitor& visitor) override;
};

// =============================================================================
// STATEMENT NODES
// =============================================================================

class CompoundStmtNode : public ASTNode {
public:
    CompoundStmtNode() : ASTNode(ASTNodeType::COMPOUND_STMT) {}
    void accept(ASTVisitor& visitor) override;
};

class ExpressionStatement : public ASTNode {
private:
    ASTNodePtr expression_;
    
public:
    ExpressionStatement() : ASTNode(ASTNodeType::EXPRESSION_STMT) {}
    
    void setExpression(ASTNodePtr expr) { expression_ = std::move(expr); }
    const ASTNode* getExpression() const { return expression_.get(); }
    
    void accept(ASTVisitor& visitor) override;
};

class IfStatement : public ASTNode {
private:
    ASTNodePtr condition_;
    ASTNodePtr consequent_;
    ASTNodePtr alternate_;
    
public:
    IfStatement() : ASTNode(ASTNodeType::IF_STMT) {}
    
    void setCondition(ASTNodePtr cond) { condition_ = std::move(cond); }
    void setConsequent(ASTNodePtr cons) { consequent_ = std::move(cons); }
    void setAlternate(ASTNodePtr alt) { alternate_ = std::move(alt); }
    
    const ASTNode* getCondition() const { return condition_.get(); }
    const ASTNode* getConsequent() const { return consequent_.get(); }
    const ASTNode* getAlternate() const { return alternate_.get(); }
    
    void accept(ASTVisitor& visitor) override;
};

class WhileStatement : public ASTNode {
private:
    ASTNodePtr condition_;
    ASTNodePtr body_;
    
public:
    WhileStatement() : ASTNode(ASTNodeType::WHILE_STMT) {}
    
    void setCondition(ASTNodePtr cond) { condition_ = std::move(cond); }
    void setBody(ASTNodePtr body) { body_ = std::move(body); }
    
    const ASTNode* getCondition() const { return condition_.get(); }
    const ASTNode* getBody() const { return body_.get(); }
    
    void accept(ASTVisitor& visitor) override;
};

class DoWhileStatement : public ASTNode {
private:
    ASTNodePtr body_;
    ASTNodePtr condition_;
    
public:
    DoWhileStatement() : ASTNode(ASTNodeType::DO_WHILE_STMT) {}
    
    void setBody(ASTNodePtr body) { body_ = std::move(body); }
    void setCondition(ASTNodePtr cond) { condition_ = std::move(cond); }
    
    const ASTNode* getBody() const { return body_.get(); }
    const ASTNode* getCondition() const { return condition_.get(); }
    
    void accept(ASTVisitor& visitor) override;
};

class ForStatement : public ASTNode {
private:
    ASTNodePtr initializer_;
    ASTNodePtr condition_;
    ASTNodePtr increment_;
    ASTNodePtr body_;
    
public:
    ForStatement() : ASTNode(ASTNodeType::FOR_STMT) {}
    
    void setInitializer(ASTNodePtr init) { initializer_ = std::move(init); }
    void setCondition(ASTNodePtr cond) { condition_ = std::move(cond); }
    void setIncrement(ASTNodePtr inc) { increment_ = std::move(inc); }
    void setBody(ASTNodePtr body) { body_ = std::move(body); }
    
    const ASTNode* getInitializer() const { return initializer_.get(); }
    const ASTNode* getCondition() const { return condition_.get(); }
    const ASTNode* getIncrement() const { return increment_.get(); }
    const ASTNode* getBody() const { return body_.get(); }
    
    void accept(ASTVisitor& visitor) override;
};

class ReturnStatement : public ASTNode {
private:
    ASTNodePtr returnValue_;
    
public:
    ReturnStatement() : ASTNode(ASTNodeType::RETURN_STMT) {}
    
    void setReturnValue(ASTNodePtr value) { returnValue_ = std::move(value); }
    const ASTNode* getReturnValue() const { return returnValue_.get(); }
    
    void accept(ASTVisitor& visitor) override;
};

class BreakStatement : public ASTNode {
public:
    BreakStatement() : ASTNode(ASTNodeType::BREAK_STMT) {}
    void accept(ASTVisitor& visitor) override;
};

class ContinueStatement : public ASTNode {
public:
    ContinueStatement() : ASTNode(ASTNodeType::CONTINUE_STMT) {}
    void accept(ASTVisitor& visitor) override;
};

// =============================================================================
// EXPRESSION NODES
// =============================================================================

class BinaryOpNode : public ASTNode {
private:
    std::string operator_;
    ASTNodePtr left_;
    ASTNodePtr right_;
    
public:
    BinaryOpNode() : ASTNode(ASTNodeType::BINARY_OP) {}
    
    void setOperator(const std::string& op) { operator_ = op; }
    void setLeft(ASTNodePtr left) { left_ = std::move(left); }
    void setRight(ASTNodePtr right) { right_ = std::move(right); }
    
    const std::string& getOperator() const { return operator_; }
    const ASTNode* getLeft() const { return left_.get(); }
    const ASTNode* getRight() const { return right_.get(); }
    
    void accept(ASTVisitor& visitor) override;
};

class UnaryOpNode : public ASTNode {
private:
    std::string operator_;
    ASTNodePtr operand_;
    bool isPrefix_;
    
public:
    UnaryOpNode() : ASTNode(ASTNodeType::UNARY_OP), isPrefix_(true) {}
    
    void setOperator(const std::string& op) { operator_ = op; }
    void setOperand(ASTNodePtr operand) { operand_ = std::move(operand); }
    void setPrefix(bool prefix) { isPrefix_ = prefix; }
    
    const std::string& getOperator() const { return operator_; }
    const ASTNode* getOperand() const { return operand_.get(); }
    bool isPrefix() const { return isPrefix_; }
    
    void accept(ASTVisitor& visitor) override;
};

class FuncCallNode : public ASTNode {
private:
    ASTNodePtr callee_;
    std::vector<ASTNodePtr> arguments_;
    
public:
    FuncCallNode() : ASTNode(ASTNodeType::FUNC_CALL) {}
    
    void setCallee(ASTNodePtr callee) { callee_ = std::move(callee); }
    void addArgument(ASTNodePtr arg) { arguments_.push_back(std::move(arg)); }
    void reserveArguments(size_t count) { arguments_.reserve(count); }
    
    const ASTNode* getCallee() const { return callee_.get(); }
    const std::vector<ASTNodePtr>& getArguments() const { return arguments_; }
    
    void accept(ASTVisitor& visitor) override;
};

class MemberAccessNode : public ASTNode {
private:
    ASTNodePtr object_;
    ASTNodePtr property_;
    std::string accessOperator_; // "." or "->"
    
public:
    MemberAccessNode() : ASTNode(ASTNodeType::MEMBER_ACCESS) {}
    
    void setObject(ASTNodePtr obj) { object_ = std::move(obj); }
    void setProperty(ASTNodePtr prop) { property_ = std::move(prop); }
    void setAccessOperator(const std::string& op) { accessOperator_ = op; }
    
    const ASTNode* getObject() const { return object_.get(); }
    const ASTNode* getProperty() const { return property_.get(); }
    const std::string& getAccessOperator() const { return accessOperator_; }
    
    void accept(ASTVisitor& visitor) override;
};

// =============================================================================
// LITERAL NODES
// =============================================================================

class NumberNode : public ASTNode {
public:
    explicit NumberNode(double value) : ASTNode(ASTNodeType::NUMBER_LITERAL) {
        setValue(value);
    }
    
    double getNumber() const { return getValueAs<double>(); }
    void accept(ASTVisitor& visitor) override;
};

class StringLiteralNode : public ASTNode {
public:
    explicit StringLiteralNode(const std::string& value) : ASTNode(ASTNodeType::STRING_LITERAL) {
        setValue(value);
    }
    
    std::string getString() const { return getValueAs<std::string>(); }
    void accept(ASTVisitor& visitor) override;
};

class IdentifierNode : public ASTNode {
public:
    explicit IdentifierNode(const std::string& name) : ASTNode(ASTNodeType::IDENTIFIER) {
        setValue(name);
    }
    
    std::string getName() const { return getValueAs<std::string>(); }
    void accept(ASTVisitor& visitor) override;
};

// =============================================================================
// DECLARATION NODES
// =============================================================================

class VarDeclNode : public ASTNode {
private:
    ASTNodePtr varType_;
    std::vector<ASTNodePtr> declarations_;
    
public:
    VarDeclNode() : ASTNode(ASTNodeType::VAR_DECL) {}
    
    void setVarType(ASTNodePtr type) { varType_ = std::move(type); }
    void addDeclaration(ASTNodePtr decl) { declarations_.push_back(std::move(decl)); }
    
    const ASTNode* getVarType() const { return varType_.get(); }
    const std::vector<ASTNodePtr>& getDeclarations() const { return declarations_; }
    
    void accept(ASTVisitor& visitor) override;
};

class FuncDefNode : public ASTNode {
private:
    ASTNodePtr returnType_;
    ASTNodePtr declarator_;
    std::vector<ASTNodePtr> parameters_;
    ASTNodePtr body_;
    
public:
    FuncDefNode() : ASTNode(ASTNodeType::FUNC_DEF) {}
    
    void setReturnType(ASTNodePtr type) { returnType_ = std::move(type); }
    void setDeclarator(ASTNodePtr decl) { declarator_ = std::move(decl); }
    void addParameter(ASTNodePtr param) { parameters_.push_back(std::move(param)); }
    void setBody(ASTNodePtr body) { body_ = std::move(body); }
    
    const ASTNode* getReturnType() const { return returnType_.get(); }
    const ASTNode* getDeclarator() const { return declarator_.get(); }
    const std::vector<ASTNodePtr>& getParameters() const { return parameters_; }
    const ASTNode* getBody() const { return body_.get(); }
    
    void accept(ASTVisitor& visitor) override;
};

class TypeNode : public ASTNode {
private:
    std::vector<ASTNodePtr> templateArgs_;
    
public:
    explicit TypeNode(const std::string& typeName) : ASTNode(ASTNodeType::TYPE_NODE) {
        setValue(typeName);
    }
    
    std::string getTypeName() const { return getValueAs<std::string>(); }
    void addTemplateArg(ASTNodePtr arg) { templateArgs_.push_back(std::move(arg)); }
    const std::vector<ASTNodePtr>& getTemplateArgs() const { return templateArgs_; }
    
    void accept(ASTVisitor& visitor) override;
};

class DeclaratorNode : public ASTNode {
public:
    explicit DeclaratorNode(const std::string& name = "") : ASTNode(ASTNodeType::DECLARATOR_NODE) {
        setValue(name);
    }
    
    std::string getName() const { return getValueAs<std::string>(); }
    void accept(ASTVisitor& visitor) override;
};

class ParamNode : public ASTNode {
private:
    ASTNodePtr paramType_;
    ASTNodePtr declarator_;
    
public:
    ParamNode() : ASTNode(ASTNodeType::PARAM_NODE) {}
    
    void setParamType(ASTNodePtr type) { paramType_ = std::move(type); }
    void setDeclarator(ASTNodePtr decl) { declarator_ = std::move(decl); }
    
    const ASTNode* getParamType() const { return paramType_.get(); }
    const ASTNode* getDeclarator() const { return declarator_.get(); }
    
    void accept(ASTVisitor& visitor) override;
};

// Missing node types that cause C++ interpreter errors
class EmptyStatement : public ASTNode {
public:
    EmptyStatement() : ASTNode(ASTNodeType::EMPTY_STMT) {}
    void accept(ASTVisitor& visitor) override;
};

class AssignmentNode : public ASTNode {
private:
    ASTNodePtr left_;
    ASTNodePtr right_;
    std::string operator_;

public:
    AssignmentNode() : ASTNode(ASTNodeType::ASSIGNMENT) {}
    
    void setLeft(ASTNodePtr left) { left_ = std::move(left); }
    void setRight(ASTNodePtr right) { right_ = std::move(right); }
    void setOperator(const std::string& op) { 
        operator_ = op;
        setValue(op);
    }
    
    const ASTNode* getLeft() const { return left_.get(); }
    const ASTNode* getRight() const { return right_.get(); }
    std::string getOperator() const { return operator_; }
    
    void accept(ASTVisitor& visitor) override;
};

class CharLiteralNode : public ASTNode {
public:
    explicit CharLiteralNode(const std::string& value) : ASTNode(ASTNodeType::CHAR_LITERAL) {
        setValue(value);
    }
    
    std::string getCharValue() const { return getValueAs<std::string>(); }
    void accept(ASTVisitor& visitor) override;
};

class PostfixExpressionNode : public ASTNode {
private:
    ASTNodePtr operand_;
    std::string operator_;

public:
    PostfixExpressionNode() : ASTNode(ASTNodeType::POSTFIX_EXPRESSION) {}
    
    void setOperand(ASTNodePtr operand) { operand_ = std::move(operand); }
    void setOperator(const std::string& op) { 
        operator_ = op;
        setValue(op);
    }
    
    const ASTNode* getOperand() const { return operand_.get(); }
    std::string getOperator() const { return operator_; }
    
    void accept(ASTVisitor& visitor) override;
};

// Additional missing statement types
class SwitchStatement : public ASTNode {
private:
    ASTNodePtr condition_;
    ASTNodePtr body_;

public:
    SwitchStatement() : ASTNode(ASTNodeType::SWITCH_STMT) {}
    
    void setCondition(ASTNodePtr condition) { condition_ = std::move(condition); }
    void setBody(ASTNodePtr body) { body_ = std::move(body); }
    
    const ASTNode* getCondition() const { return condition_.get(); }
    const ASTNode* getBody() const { return body_.get(); }
    
    void accept(ASTVisitor& visitor) override;
};

class CaseStatement : public ASTNode {
private:
    ASTNodePtr label_;
    ASTNodePtr body_;

public:
    CaseStatement() : ASTNode(ASTNodeType::CASE_STMT) {}
    
    void setLabel(ASTNodePtr label) { label_ = std::move(label); }
    void setBody(ASTNodePtr body) { body_ = std::move(body); }
    
    const ASTNode* getLabel() const { return label_.get(); }
    const ASTNode* getBody() const { return body_.get(); }
    
    void accept(ASTVisitor& visitor) override;
};

class RangeBasedForStatement : public ASTNode {
private:
    ASTNodePtr variable_;
    ASTNodePtr iterable_;
    ASTNodePtr body_;

public:
    RangeBasedForStatement() : ASTNode(ASTNodeType::RANGE_FOR_STMT) {}
    
    void setVariable(ASTNodePtr variable) { variable_ = std::move(variable); }
    void setIterable(ASTNodePtr iterable) { iterable_ = std::move(iterable); }
    void setBody(ASTNodePtr body) { body_ = std::move(body); }
    
    const ASTNode* getVariable() const { return variable_.get(); }
    const ASTNode* getIterable() const { return iterable_.get(); }
    const ASTNode* getBody() const { return body_.get(); }
    
    void accept(ASTVisitor& visitor) override;
};

// Additional missing expression types
class ArrayAccessNode : public ASTNode {
private:
    ASTNodePtr array_;
    ASTNodePtr index_;

public:
    ArrayAccessNode() : ASTNode(ASTNodeType::ARRAY_ACCESS) {}
    
    void setArray(ASTNodePtr array) { array_ = std::move(array); }
    void setIndex(ASTNodePtr index) { index_ = std::move(index); }
    
    const ASTNode* getArray() const { return array_.get(); }
    const ASTNode* getIndex() const { return index_.get(); }
    
    void accept(ASTVisitor& visitor) override;
};

class TernaryExpressionNode : public ASTNode {
private:
    ASTNodePtr condition_;
    ASTNodePtr trueExpression_;
    ASTNodePtr falseExpression_;

public:
    TernaryExpressionNode() : ASTNode(ASTNodeType::TERNARY_EXPR) {}
    
    void setCondition(ASTNodePtr condition) { condition_ = std::move(condition); }
    void setTrueExpression(ASTNodePtr trueExpr) { trueExpression_ = std::move(trueExpr); }
    void setFalseExpression(ASTNodePtr falseExpr) { falseExpression_ = std::move(falseExpr); }
    
    const ASTNode* getCondition() const { return condition_.get(); }
    const ASTNode* getTrueExpression() const { return trueExpression_.get(); }
    const ASTNode* getFalseExpression() const { return falseExpression_.get(); }
    
    void accept(ASTVisitor& visitor) override;
};

// Additional missing literal types
class ConstantNode : public ASTNode {
public:
    explicit ConstantNode(const std::string& value) : ASTNode(ASTNodeType::CONSTANT) {
        setValue(value);
    }
    
    std::string getConstantValue() const { return getValueAs<std::string>(); }
    void accept(ASTVisitor& visitor) override;
};

class ArrayInitializerNode : public ASTNode {
public:
    ArrayInitializerNode() : ASTNode(ASTNodeType::ARRAY_INIT) {}
    void accept(ASTVisitor& visitor) override;
};

// Function pointer declarator
class FunctionPointerDeclaratorNode : public ASTNode {
public:
    FunctionPointerDeclaratorNode() : ASTNode(ASTNodeType::FUNCTION_POINTER_DECLARATOR) {}
    void accept(ASTVisitor& visitor) override;
};

// Final missing node types
class StructDeclaration : public ASTNode {
public:
    StructDeclaration() : ASTNode(ASTNodeType::STRUCT_DECL) {}
    void accept(ASTVisitor& visitor) override;
};

class TypedefDeclaration : public ASTNode {
public:
    TypedefDeclaration() : ASTNode(ASTNodeType::TYPEDEF_DECL) {}
    void accept(ASTVisitor& visitor) override;
};

class CommaExpression : public ASTNode {
public:
    CommaExpression() : ASTNode(ASTNodeType::COMMA_EXPRESSION) {}
    void accept(ASTVisitor& visitor) override;
};

class ArrayDeclaratorNode : public ASTNode {
public:
    ArrayDeclaratorNode() : ASTNode(ASTNodeType::ARRAY_DECLARATOR) {}
    void accept(ASTVisitor& visitor) override;
};

class PointerDeclaratorNode : public ASTNode {
public:
    PointerDeclaratorNode() : ASTNode(ASTNodeType::POINTER_DECLARATOR) {}
    void accept(ASTVisitor& visitor) override;
};

// Struct type node
class StructType : public ASTNode {
public:
    StructType() : ASTNode(ASTNodeType::STRUCT_TYPE) {}
    void accept(ASTVisitor& visitor) override;
};

// =============================================================================
// VISITOR PATTERN
// =============================================================================

/**
 * Base visitor class for traversing AST
 */
class ASTVisitor {
public:
    virtual ~ASTVisitor() = default;
    
    // Program structure
    virtual void visit(ProgramNode& node) = 0;
    virtual void visit(ErrorNode& node) = 0;
    virtual void visit(CommentNode& node) = 0;
    
    // Statements
    virtual void visit(CompoundStmtNode& node) = 0;
    virtual void visit(ExpressionStatement& node) = 0;
    virtual void visit(IfStatement& node) = 0;
    virtual void visit(WhileStatement& node) = 0;
    virtual void visit(DoWhileStatement& node) = 0;
    virtual void visit(ForStatement& node) = 0;
    virtual void visit(RangeBasedForStatement& node) = 0;
    virtual void visit(SwitchStatement& node) = 0;
    virtual void visit(CaseStatement& node) = 0;
    virtual void visit(ReturnStatement& node) = 0;
    virtual void visit(BreakStatement& node) = 0;
    virtual void visit(ContinueStatement& node) = 0;
    
    // Expressions
    virtual void visit(BinaryOpNode& node) = 0;
    virtual void visit(UnaryOpNode& node) = 0;
    virtual void visit(FuncCallNode& node) = 0;
    virtual void visit(MemberAccessNode& node) = 0;
    virtual void visit(AssignmentNode& node) = 0;
    virtual void visit(PostfixExpressionNode& node) = 0;
    virtual void visit(ArrayAccessNode& node) = 0;
    virtual void visit(TernaryExpressionNode& node) = 0;
    virtual void visit(CommaExpression& node) = 0;
    
    // Literals
    virtual void visit(NumberNode& node) = 0;
    virtual void visit(StringLiteralNode& node) = 0;
    virtual void visit(CharLiteralNode& node) = 0;
    virtual void visit(IdentifierNode& node) = 0;
    virtual void visit(ConstantNode& node) = 0;
    virtual void visit(ArrayInitializerNode& node) = 0;
    
    // Statements 
    virtual void visit(EmptyStatement& node) = 0;
    
    // Declarations
    virtual void visit(VarDeclNode& node) = 0;
    virtual void visit(FuncDefNode& node) = 0;
    virtual void visit(TypeNode& node) = 0;
    virtual void visit(DeclaratorNode& node) = 0;
    virtual void visit(ParamNode& node) = 0;
    virtual void visit(FunctionPointerDeclaratorNode& node) = 0;
    virtual void visit(ArrayDeclaratorNode& node) = 0;
    virtual void visit(PointerDeclaratorNode& node) = 0;
    virtual void visit(StructDeclaration& node) = 0;
    virtual void visit(TypedefDeclaration& node) = 0;
    virtual void visit(StructType& node) = 0;
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Factory function to create AST nodes by type
 */
ASTNodePtr createNode(ASTNodeType type);

/**
 * Convert node type enum to string for debugging
 */
std::string nodeTypeToString(ASTNodeType type);

/**
 * Convert value type enum to string for debugging
 */
std::string valueTypeToString(ValueType type);

/**
 * Memory usage estimation for nodes
 */
size_t estimateNodeMemoryUsage(const ASTNode* node);

} // namespace arduino_ast