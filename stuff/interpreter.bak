// --- C Interpreter ---
const INTERPRETER_VERSION = "0.1.3"; // Version incremented for Phase 4.4: Adjust Parser.declaration_specifiers()
// Expose INTERPRETER_VERSION globally for test harnesses and all other scripts.
if (typeof window !== 'undefined') {
    window.INTERPRETER_VERSION = INTERPRETER_VERSION;
}

// Defines all the possible token types our Lexer can produce.
const TokenType = {
    // Literals
    IDENTIFIER: 'IDENTIFIER', STRING: 'STRING', NUMBER: 'NUMBER', CHAR_LITERAL: 'CHAR_LITERAL',
    
    // Punctuation
    LPAREN: 'LPAREN', RPAREN: 'RPAREN', LBRACE: 'LBRACE', RBRACE: 'RBRACE',
    LBRACKET: 'LBRACKET', RBRACKET: 'RBRACKET', COMMA: 'COMMA', DOT: 'DOT', 
    SEMICOLON: 'SEMICOLON', HASH: 'HASH', COLON: 'COLON', QUESTION: 'QUESTION',

    // Operators
    PLUS: 'PLUS', MINUS: 'MINUS', STAR: 'STAR', SLASH: 'SLASH', PERCENT: 'PERCENT',
    PLUS_PLUS: 'PLUS_PLUS', MINUS_MINUS: 'MINUS_MINUS',
    EQUAL: 'EQUAL', PLUS_EQUAL: 'PLUS_EQUAL', MINUS_EQUAL: 'MINUS_EQUAL', 
    STAR_EQUAL: 'STAR_EQUAL', SLASH_EQUAL: 'STAR_EQUAL', PERCENT_EQUAL: 'PERCENT_EQUAL',
    EQUAL_EQUAL: 'EQUAL_EQUAL', BANG: 'BANG', BANG_EQUAL: 'BANG_EQUAL',
    GREATER: 'GREATER', GREATER_EQUAL: 'GREATER_EQUAL', LESS: 'LESS', LESS_EQUAL: 'LESS_EQUAL',
    AMPERSAND: 'AMPERSAND', PIPE: 'PIPE', CARET: 'CARET', TILDE: 'TILDE',
    AMPERSAND_AMPERSAND: 'AMPERSAND_AMPERSAND', PIPE_PIPE: 'PIPE_PIPE',
    LESS_LESS: 'LESS_LESS', GREATER_GREATER: 'GREATER_GREATER',
    AMPERSAND_EQUAL: 'AMPERSAND_EQUAL', PIPE_EQUAL: 'PIPE_EQUAL', CARET_EQUAL: 'CARET_EQUAL',
    LESS_LESS_EQUAL: 'LESS_LESS_EQUAL', GREATER_GREATER_EQUAL: 'GREATER_GREATER_EQUAL',
    ARROW: 'ARROW',

    // Keywords
    BREAK: 'BREAK', CONTINUE: 'CONTINUE', DO: 'DO', WHILE: 'WHILE', ELSE: 'ELSE',
    FOR: 'FOR', GOTO: 'GOTO', IF: 'IF', RETURN: 'RETURN', SWITCH: 'SWITCH', CASE: 'CASE', DEFAULT: 'DEFAULT',
    HIGH: 'HIGH', LOW: 'LOW', LED_BUILTIN: 'LED_BUILTIN', TRUE: 'TRUE', FALSE: 'FALSE',
    INPUT: 'INPUT', OUTPUT: 'OUTPUT', INPUT_PULLUP: 'INPUT_PULLUP',
    BOOL: 'BOOL', BOOLEAN: 'BOOLEAN', BYTE: 'BYTE', CHAR: 'CHAR', DOUBLE: 'DOUBLE',
    FLOAT: 'FLOAT', INT: 'INT', LONG: 'LONG', SHORT: 'SHORT', SIZE_T: 'SIZE_T',
    STRING_KEYWORD: 'STRING_KEYWORD', UNSIGNED: 'UNSIGNED', VOID: 'VOID', WORD: 'WORD',
    CONST: 'CONST', STATIC: 'STATIC', VOLATILE: 'VOLATILE', EXTERN: 'EXTERN',
    STRUCT: 'STRUCT', TYPEDEF: 'TYPEDEF', SIZEOF: 'SIZEOF',

    EOF: 'EOF',
    TYPENAME: 'TYPENAME' // NEW: For context-sensitive tokenization
};

// Maps string keywords to their corresponding TokenType.
const KEYWORDS = {
    "break": TokenType.BREAK, "continue": TokenType.CONTINUE, "do": TokenType.DO, "while": TokenType.WHILE,
    "else": TokenType.ELSE, "for": TokenType.FOR, "goto": TokenType.GOTO, "if": TokenType.IF,
    "return": TokenType.RETURN, "switch": TokenType.SWITCH, "case": TokenType.CASE, "default": TokenType.DEFAULT,
    "HIGH": TokenType.HIGH, "LOW": TokenType.LOW, "LED_BUILTIN": TokenType.LED_BUILTIN,
    "true": TokenType.TRUE, "false": TokenType.FALSE,
    "INPUT": TokenType.INPUT, "OUTPUT": TokenType.OUTPUT, "INPUT_PULLUP": TokenType.INPUT_PULLUP,
    "bool": TokenType.BOOL, "boolean": TokenType.BOOLEAN, "byte": TokenType.BYTE, "char": TokenType.CHAR,
    "double": TokenType.DOUBLE, "float": TokenType.FLOAT, "int": TokenType.INT, "long": TokenType.LONG,
    "short": TokenType.SHORT, "size_t": TokenType.SIZE_T, "String": TokenType.STRING_KEYWORD,
    "unsigned": TokenType.UNSIGNED, "void": TokenType.VOID, "word": TokenType.WORD,
    "const": TokenType.CONST, "static": TokenType.STATIC, "volatile": TokenType.VOLATILE, "extern": TokenType.EXTERN,
    "struct": TokenType.STRUCT, "typedef": TokenType.TYPEDEF, "sizeof": TokenType.SIZEOF,
};

// Represents a single token produced by the Lexer.
class Token {
    constructor(type, value, line, suffix = null) { // Added 'suffix' parameter with default null
        this.type = type;
        this.value = value;
        this.line = line;
        this.suffix = suffix; // New property
    }
    
    toString() {
        // Updated toString to include suffix for debugging/logging
        return `Token(${this.type}, ${JSON.stringify(this.value)}, L${this.line}` + (this.suffix ? `, Suffix:'${this.suffix}'` : '') + `)`;
    }
}

// The Lexer, responsible for breaking the source code string into a stream of tokens.
class Lexer {
    constructor(text, symbolTable = null) { // NEW: Added optional symbolTable parameter
        this.text = text;
        this.pos = 0;
        this.currentChar = this.text[this.pos];
        this.line = 1;
        this.symbolTable = symbolTable; // NEW: Store the symbolTable reference
    }

    advance() {
        if (this.currentChar === '\n') {
            this.line++;
        }
        this.pos++;
        if (this.pos > this.text.length - 1) {
            this.currentChar = null; // EOF
        } else {
            this.currentChar = this.text[this.pos];
        }
    }

    peek() {
        const peekPos = this.pos + 1;
        if (peekPos > this.text.length - 1) {
            return null;
        } else {
            return this.text[peekPos];
        }
    }
    
    _isWhitespace(char) {
        return ' \t\r\n'.includes(char);
    }
    
    _isDigit(char) {
        return char >= '0' && char <= '9';
    }

    _isHexDigit(char) {
        return (char >= '0' && char <= '9') || (char >= 'a' && char <= 'f') || (char >= 'A' && char <= 'F');
    }

    _isOctalDigit(char) {
        return char >= '0' && char <= '7';
    }
    
    _isAlpha(char) {
        return (char >= 'a' && char <= 'z') ||
               (char >= 'A' && char <= 'Z') ||
               char === '_';
    }
    
    _isAlphaNumeric(char) {
        return this._isAlpha(char) || this._isDigit(char);
    }

    skipWhitespace() {
        while (this.currentChar !== null && this._isWhitespace(this.currentChar)) {
            this.advance();
        }
    }
    
    skipComment() {
        if (this.currentChar === '/' && this.peek() === '/') {
            while (this.currentChar !== null && this.currentChar !== '\n') {
                this.advance();
            }
        }
        if (this.currentChar === '/' && this.peek() === '*') {
            this.advance(); // consume /
            this.advance(); // consume *
            while (this.currentChar !== null && !(this.currentChar === '*' && this.peek() === '/')) {
                this.advance();
            }
            this.advance(); // consume *
            this.advance(); // consume /
        }
    }

    number() {
        const startPos = this.pos; // Capture starting position for column calculation
        let result = '';
        let base = 10; // Default base is decimal
        let isFloat = false;
        let suffix = null;

        if (this.currentChar === '0') {
            result += this.currentChar; this.advance();
            if (this.currentChar === 'x' || this.currentChar === 'X') { // Hexadecimal
                result += this.currentChar; this.advance();
                base = 16;
                while (this.currentChar !== null && this._isHexDigit(this.currentChar)) {
                    result += this.currentChar; this.advance();
                }
                if (result.length === 2) { // Only "0x" or "0X" without digits
                    const column = startPos - this.text.lastIndexOf('\n', startPos - 1);
                    throw new LexerError(`Invalid hexadecimal literal: '${result}'`, this.line, column);
                }
            }
            
            if (this.currentChar === 'b' || this.currentChar === 'B') { // Binary
                result += this.currentChar; this.advance();
                base = 2;
                while (this.currentChar !== null && (this.currentChar === '0' || this.currentChar === '1')) {
                    result += this.currentChar; this.advance();
                }
                if (result.length === 2) { // Only "0b" or "0B" without digits
                    const column = startPos - this.text.lastIndexOf('\n', startPos - 1);
                    throw new LexerError(`Invalid binary literal: '${result}'`, this.line, column);
                }
            } else if (this._isOctalDigit(this.currentChar)) { // Octal (starts with '0' followed by octal digit)
                base = 8;
                while (this.currentChar !== null && this._isOctalDigit(this.currentChar)) {
                    result += this.currentChar; this.advance();
                }
                // Check for invalid octal digits (8 or 9)
                if (this.currentChar !== null && (this.currentChar === '8' || this.currentChar === '9')) {
                    const invalidChar = this.currentChar;
                    result += invalidChar; this.advance(); // Consume the invalid digit
                    while (this.currentChar !== null && this._isDigit(this.currentChar)) {
                        result += this.currentChar; this.advance(); // Consume any subsequent digits
                    }
                    const column = startPos - this.text.lastIndexOf('\n', startPos - 1);
                    throw new LexerError(`Invalid digit '${invalidChar}' in octal literal: '${result}'`, this.line, column);
                }
            }
        }
        
        // If not hex/binary/octal, proceed with decimal or float parsing
        if (base === 10) {
            while (this.currentChar !== null && this._isDigit(this.currentChar)) {
                result += this.currentChar; this.advance();
            }
            if (this.currentChar === '.') {
                isFloat = true;
                result += '.'; this.advance();
                while (this.currentChar !== null && this._isDigit(this.currentChar)) {
                    result += this.currentChar; this.advance();
                }
            }
            if (this.currentChar === 'e' || this.currentChar === 'E') {
                isFloat = true;
                result += this.currentChar; this.advance();
                if (this.currentChar === '+' || this.currentChar === '-') {
                    result += this.currentChar; this.advance();
                }
                while (this.currentChar !== null && this._isDigit(this.currentChar)) {
                    result += this.currentChar; this.advance();
                }
            }
        }

        // Handle integer suffixes (U, L, LL, F, D)
        const currentSuffix = this.currentChar;
        if (currentSuffix !== null && (currentSuffix === 'u' || currentSuffix === 'U')) {
            suffix = currentSuffix.toUpperCase();
            this.advance();
        }
        if (this.currentChar !== null && (this.currentChar === 'l' || this.currentChar === 'L')) {
            suffix = (suffix || '') + this.currentChar.toUpperCase();
            this.advance();
            if (this.currentChar !== null && (this.currentChar === 'l' || this.currentChar === 'L')) {
                suffix = (suffix || '') + this.currentChar.toUpperCase();
                this.advance();
            }
        }
        if (isFloat && this.currentChar !== null && (this.currentChar === 'f' || this.currentChar === 'F' || this.currentChar === 'd' || this.currentChar === 'D')) {
            suffix = (suffix || '') + this.currentChar.toUpperCase();
            this.advance();
        }

        // After parsing the number and potential suffix, check for invalid trailing characters
        // This prevents '10myVar' from being parsed as '10' and then 'myVar' if it's an error.
        if (this.currentChar !== null && this._isAlpha(this.currentChar)) {
            const invalidPart = result + this.currentChar;
            this.advance(); // Consume the first invalid character
            while (this.currentChar !== null && this._isAlphaNumeric(this.currentChar)) {
                result += this.currentChar;
                this.advance();
            }
            const column = startPos - this.text.lastIndexOf('\n', startPos - 1);
            throw new LexerError(`Invalid numeric literal: '${invalidPart}' - cannot start identifier with digit.`, this.line, column);
        }

        // Convert the string result to a number based on its base and type
        let numericValue;
        if (isFloat) {
            numericValue = parseFloat(result);
        } else {
            numericValue = parseInt(result, base);
        }
        
        return new Token(TokenType.NUMBER, numericValue, this.line, suffix);
    }

    string() {
        let result = '';
        this.advance(); // Consume opening quote
        while (this.currentChar !== null && this.currentChar !== '"') {
            if (this.currentChar === '\\') { // Handle escape sequences
                this.advance();
                switch (this.currentChar) {
                    case 'n': result += '\n'; break;
                    case 't': result += '\t'; break;
                    case '"': result += '"'; break;
                    case '\\': result += '\\'; break;
                    default: result += this.currentChar;
                }
            } else {
                result += this.currentChar;
            }
            this.advance();
        }
        this.advance(); // Consume closing quote
        return new Token(TokenType.STRING, result, this.line);
    }

    character() {
        this.advance(); // Consume opening single quote
        let char = this.currentChar;
        if (char === '\\') { // Handle escape sequences
             this.advance();
             switch (this.currentChar) {
                case 'n': char = '\n'; break;
                case 't': char = '\t'; break;
                case "'": char = "'"; break;
                case '\\': char = '\\'; break;
                default: char = this.currentChar;
             }
        }
        this.advance(); // Consume the character
        if (this.currentChar !== "'") {
             throw new Error(`Lexer error: Unterminated character literal on line ${this.line}`);
        }
        this.advance(); // Consume closing single quote
        return new Token(TokenType.CHAR_LITERAL, char, this.line);
    }
    
    id() {
        let result = '';
        while (this.currentChar !== null && this._isAlphaNumeric(this.currentChar)) {
            result += this.currentChar; this.advance();
        }
        const tokenType = KEYWORDS[result] || TokenType.IDENTIFIER;
        return new Token(tokenType, result, this.line);
    }

    getNextToken() {
        while (this.currentChar !== null) {
            if (this._isWhitespace(this.currentChar)) { this.skipWhitespace(); continue; }
            if (this.currentChar === '/' && (this.peek() === '/' || this.peek() === '*')) { this.skipComment(); continue; }

            if (this._isDigit(this.currentChar) || (this.currentChar === '.' && this._isDigit(this.peek()))) return this.number();
            if (this.currentChar === "'") return this.character();
            if (this.currentChar === '"') return this.string();
            if (this._isAlpha(this.currentChar)) return this.id();
            
            let token;
            switch(this.currentChar) {
                case '+':
                    if (this.peek() === '+') { this.advance(); token = new Token(TokenType.PLUS_PLUS, '++', this.line); }
                    else if (this.peek() === '=') { this.advance(); token = new Token(TokenType.PLUS_EQUAL, '+=', this.line); }
                    else { token = new Token(TokenType.PLUS, '+', this.line); }
                    break;
                case '-':
                    if (this.peek() === '>') { this.advance(); token = new Token(TokenType.ARROW, '->', this.line); }
                    else if (this.peek() === '-') { this.advance(); token = new Token(TokenType.MINUS_MINUS, '--', this.line); }
                    else if (this.peek() === '=') { this.advance(); token = new Token(TokenType.MINUS_EQUAL, '-=', this.line); }
                    else { token = new Token(TokenType.MINUS, '-', this.line); }
                    break;
                case '*':
                    if (this.peek() === '=') { this.advance(); token = new Token(TokenType.STAR_EQUAL, '*=', this.line); }
                    else { token = new Token(TokenType.STAR, '*', this.line); }
                    break;
                case '/':
                    if (this.peek() === '=') { this.advance(); token = new Token(TokenType.SLASH_EQUAL, '/=', this.line); }
                    else { token = new Token(TokenType.SLASH, '/', this.line); }
                    break;
                case '%':
                    if (this.peek() === '=') { this.advance(); token = new Token(TokenType.PERCENT_EQUAL, '%=', this.line); }
                    else { token = new Token(TokenType.PERCENT, '%', this.line); }
                    break;
                case '=':
                    if (this.peek() === '=') { this.advance(); token = new Token(TokenType.EQUAL_EQUAL, '==', this.line); }
                    else { token = new Token(TokenType.EQUAL, '=', this.line); }
                    break;
                case '!':
                    if (this.peek() === '=') { this.advance(); token = new Token(TokenType.BANG_EQUAL, '!=', this.line); }
                    else { token = new Token(TokenType.BANG, '!', this.line); }
                    break;
                case '<':
                    if (this.peek() === '<') { this.advance(); if (this.peek() === '=') { this.advance(); token = new Token(TokenType.LESS_LESS_EQUAL, '<<=', this.line); } else { token = new Token(TokenType.LESS_LESS, '<<', this.line); }}
                    else if (this.peek() === '=') { this.advance(); token = new Token(TokenType.LESS_EQUAL, '<=', this.line); }
                    else { token = new Token(TokenType.LESS, '<', this.line); }
                    break;
                case '>':
                    if (this.peek() === '>') { this.advance(); if (this.peek() === '=') { this.advance(); token = new Token(TokenType.GREATER_GREATER_EQUAL, '>>=', this.line); } else { token = new Token(TokenType.GREATER_GREATER, '>>', this.line); }}
                    else if (this.peek() === '=') { this.advance(); token = new Token(TokenType.GREATER_EQUAL, '>=', this.line); }
                    else { token = new Token(TokenType.GREATER, '>', this.line); }
                    break;
                case '&':
                    if (this.peek() === '&') { this.advance(); token = new Token(TokenType.AMPERSAND_AMPERSAND, '&&', this.line); }
                    else if (this.peek() === '=') { this.advance(); token = new Token(TokenType.AMPERSAND_EQUAL, '&=', this.line); }
                    else { token = new Token(TokenType.AMPERSAND, '&', this.line); }
                    break;
                case '|':
                    if (this.peek() === '|') { this.advance(); token = new Token(TokenType.PIPE_PIPE, '||', this.line); }
                    else if (this.peek() === '=') { this.advance(); token = new Token(TokenType.PIPE_EQUAL, '|=', this.line); }
                    else { token = new Token(TokenType.PIPE, '|', this.line); }
                    break;
                case '^':
                    if (this.peek() === '=') { this.advance(); token = new Token(TokenType.CARET_EQUAL, '^=', this.line); }
                    else { token = new Token(TokenType.CARET, '^', this.line); }
                    break;
                case '~': token = new Token(TokenType.TILDE, '~', this.line); break;
                case '(': token = new Token(TokenType.LPAREN, '(', this.line); break;
                case ')': token = new Token(TokenType.RPAREN, ')', this.line); break;
                case '{': token = new Token(TokenType.LBRACE, '{', this.line); break;
                case '}': token = new Token(TokenType.RBRACE, '}', this.line); break;
                case '[': token = new Token(TokenType.LBRACKET, '[', this.line); break;
                case ']': token = new Token(TokenType.RBRACKET, ']', this.line); break;
                case ';': token = new Token(TokenType.SEMICOLON, ';', this.line); break;
                case ',': token = new Token(TokenType.COMMA, ',', this.line); break;
                case '.': token = new Token(TokenType.DOT, '.', this.line); break;
                case '#': token = new Token(TokenType.HASH, '#', this.line); break; // # is still a token for now, but preprocessor handles it
                case '?': token = new Token(TokenType.QUESTION, '?', this.line); break;
                case ':': token = new Token(TokenType.COLON, ':', this.line); break;
                default:
                    // Calculate approximate column for better error reporting
                    const column = this.pos - this.text.lastIndexOf('\n', this.pos - 1);
                    // Throw a LexerError immediately for unrecognized characters
                    throw new LexerError(`Unrecognized character '${this.currentChar}'`, this.line, column);
            }
            this.advance();
            return token;
        }
        return new Token(TokenType.EOF, 'EOF', this.line);
    }
}

// --- NEW: Preprocessor ---
class Preprocessor {
    constructor(sourceCode) {
        this.sourceCode = sourceCode;
        this.output = '';
        this.defines = {}; // To store simple macro definitions
    }

    process() {
        const lines = this.sourceCode.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith('#')) {
                if (trimmedLine.startsWith('#include')) {
                    // Basic #include handling:
                    // Extracts filename and adds a placeholder comment and mock content.
                    // In a real preprocessor, you'd read the file content here.
                    const parts = trimmedLine.split(' ');
                    if (parts.length > 1) {
                        const filename = parts[1].replace(/[<>"]/g, ''); // Remove quotes or angle brackets
                        this.output += `// --- Content from ${filename} ---\n`;
                        // Mock content for demonstration. Replace with actual file reading.
                        this.output += `int included_var = 100;\n`;
                        this.output += `// --- End of ${filename} ---\n`;
                    } else {
                        this.output += `// Preprocessor error: Malformed #include directive\n`;
                    }
                } else if (trimmedLine.startsWith('#define')) {
                    // Basic #define handling:
                    // Stores simple object-like macros. No function-like macros yet.
                    const parts = trimmedLine.substring('#define'.length).trim().split(/\s+/);
                    if (parts.length >= 2) {
                        const macroName = parts[0];
                        const macroValue = parts.slice(1).join(' ');
                        this.defines[macroName] = macroValue;
                        this.output += `// Macro '${macroName}' defined\n`;
                    } else {
                        this.output += `// Preprocessor error: Malformed #define directive\n`;
                    }
                } else {
                    // For other directives like #if, #ifdef, #pragma, etc.,
                    // we'll just add a comment for now.
                    this.output += `// Preprocessor directive skipped: ${trimmedLine}\n`;
                }
            } else {
                // Replace defined macros in the line
                let processedLine = line;
                for (const macroName in this.defines) {
                    // Simple string replacement. A real preprocessor handles token boundaries.
                    const regex = new RegExp(`\\b${macroName}\\b`, 'g');
                    processedLine = processedLine.replace(regex, this.defines[macroName]);
                }
                this.output += processedLine + '\n';
            }
        }
        return this.output;
    }
}

// Custom Error for Lexical Analysis
class LexerError extends Error {
    constructor(message, line, column = null) {
        // Construct a detailed message including line and optional column
        const detailedMessage = `Lexer Error: ${message} on line ${line}` + (column !== null ? `, column ${column}` : '');
        super(detailedMessage);
        this.name = 'LexerError'; // Set the error name
        this.line = line; // Store line number
        this.column = column; // Store column number
    }
}

// --- Abstract Syntax Tree (AST) Nodes ---
class ASTNode {}
class ProgramNode extends ASTNode { constructor(declarations) { super(); this.declarations = declarations; } }
class VarDeclNode extends ASTNode { constructor(type, identifier, value, bitfield = null) { super(); this.type = type; this.identifier = identifier; this.value = value; this.bitfield = bitfield; } }
class ArrayDeclNode extends ASTNode { constructor(type, identifier, size, elements) { super(); this.type = type; this.identifier = identifier; this.size = size; this.elements = elements; } }
class InitializerListNode extends ASTNode { constructor(initializers) { super(); this.initializers = initializers; } }
class DesignatedInitializerNode extends ASTNode { constructor(designator, value) { super(); this.designator = designator; this.value = value; } }
class ArrayAccessNode extends ASTNode { constructor(identifier, index) { super(); this.identifier = identifier; this.index = index; } }
class FuncDefNode extends ASTNode { constructor(returnType, name, params, body) { super(); this.returnType = returnType; this.name = name; this.params = params; this.body = body; } }
class ParamNode extends ASTNode { constructor(type, declarator) { super(); this.type = type; this.declarator = declarator; } }
class FuncPtrDeclNode extends ASTNode { constructor(returnType, name, params, value) { super(); this.returnType = returnType; this.name = name; this.params = params; this.value = value; } }
class ReturnNode extends ASTNode { constructor(value) { super(); this.value = value; } }
class BreakNode extends ASTNode {}
class ContinueNode extends ASTNode {}
class CompoundStmtNode extends ASTNode { constructor(statements) { super(); this.statements = statements; } }
class IfNode extends ASTNode { constructor(condition, thenBranch, elseBranch) { super(); this.condition = condition; this.thenBranch = thenBranch; this.elseBranch = elseBranch; } }
class ForNode extends ASTNode { constructor(init, condition, update, body) { super(); this.init = init; this.condition = condition; this.update = update; this.body = body; } }
class WhileNode extends ASTNode { constructor(condition, body) { super(); this.condition = condition; this.body = body; } }
class DoWhileNode extends ASTNode { constructor(condition, body) { super(); this.body = body; this.condition = condition; } }
class StructDefNode extends ASTNode { constructor(members) { super(); this.members = members; } }
class SwitchNode extends ASTNode { constructor(expression, body) { super(); this.expression = expression; this.body = body; } }
class CaseNode extends ASTNode { constructor(value, statements) { super(); this.value = value; this.statements = statements; } }
class DefaultNode extends ASTNode { constructor(statements) { super(); this.statements = statements; } }
class AssignNode extends ASTNode { constructor(left, op, right) { super(); this.left = left; this.op = op; this.right = right; } }
class CastNode extends ASTNode { constructor(type, expr) { super(); this.type = type; this.expr = expr; } }
class BinOpNode extends ASTNode { constructor(left, op, right) { super(); this.left = left; this.op = op; this.right = right; } }
class MemberAccessNode extends ASTNode { constructor(object, op, member) { super(); this.object = object; this.op = op; this.member = member; } }
class UnaryOpNode extends ASTNode { constructor(op, expr) { super(); this.op = op; this.expr = expr; } }
class PostfixOpNode extends ASTNode { constructor(expr, op) { super(); this.expr = expr; this.op = op; } }
class TernaryOpNode extends ASTNode { constructor(condition, trueExpr, falseExpr) { super(); this.condition = condition; this.trueExpr = trueExpr; this.falseExpr = falseExpr; } }
class FuncCallNode extends ASTNode { constructor(callable, args) { super(); this.callable = callable; this.args = args; } }
class TypeNode extends ASTNode { constructor(token) { super(); this.token = token; this.value = token.value; } }
class PointerNode extends ASTNode { constructor(base) { super(); this.base = base; } }
class DeclaratorNode extends ASTNode { constructor(identifier, pointer, arraySpecifiers, functionParams = null) { super(); this.identifier = identifier; this.pointer = pointer; this.arraySpecifiers = arraySpecifiers; this.functionParams = functionParams; } }
class VarNode extends ASTNode { constructor(token) { super(); this.token = token; this.value = token.value; } }
class NumberNode extends ASTNode { constructor(token) { super(); this.token = token; this.value = token.value; } }
class StringNode extends ASTNode { constructor(token) { super(); this.token = token; this.value = token.value; } }
class CharLiteralNode extends ASTNode { constructor(token) { super(); this.token = token; this.value = token.value; } }
class PreprocessorNode extends ASTNode { constructor(command) { super(); this.command = command; } }
class NoOpNode extends ASTNode {} // Represents an empty statement (just a semicolon)

// --- MOVED FROM script.js ---

// --- NEW: Semantic Analysis and Interpretation ---

// Base class for different types of errors during analysis
class SemanticError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SemanticError';
    }
}

// Represents an entry in the Symbol Table
class Symbol {
    constructor(name, type = null) {
        this.name = name;
        this.type = type;
    }
}

class BuiltinTypeSymbol extends Symbol {
    constructor(name) { super(name); }
    toString() { return `<BuiltinTypeSymbol(name='${this.name}')>`; }
}

class VarSymbol extends Symbol {
    constructor(name, type) { super(name, type); }
    toString() { return `<VarSymbol(name='${this.name}', type='${this.type}')>`; }
}

class FunctionSymbol extends Symbol {
    constructor(name, params = []) {
        super(name);
        this.params = params;
    }
}

// Manages scopes and symbols
class SymbolTable {
    constructor() {
        this.scope_stack = [{}]; // Global scope, starts with built-ins
        this.typedefNames = new Set(); // NEW: Track typedef names globally for lexer lookup
        this._initBuiltins();
    }
    _initBuiltins() {
        // Define built-in types and add them to typedefNames for lexer lookup
        this.define(new BuiltinTypeSymbol('int')); this.typedefNames.add('int');
        this.define(new BuiltinTypeSymbol('float')); this.typedefNames.add('float');
        this.define(new BuiltinTypeSymbol('void')); this.typedefNames.add('void');
        this.define(new BuiltinTypeSymbol('char')); this.typedefNames.add('char');
    }
    define(symbol) {
        console.log(`Define in scope ${this.scope_stack.length - 1}: ${symbol.name}`);
        const current_scope = this.scope_stack[this.scope_stack.length - 1];
        
        // NEW: If it's a VarSymbol and its type indicates it's a typedef, track it
        if (symbol instanceof VarSymbol && symbol.type && symbol.type.value.startsWith('typedef')) {
            this.typedefNames.add(symbol.name);
        }
        // Also track struct tags as type names (e.g., "struct MyStruct { ... }; struct MyStruct var;")
        // The parser's declaration_specifiers will pass "struct MyStruct" as the type value
        if (symbol instanceof VarSymbol && symbol.type && symbol.type.value.startsWith('struct')) {
             this.typedefNames.add(symbol.name);
        }

        current_scope[symbol.name] = symbol;
    }
    lookup(name) {
        console.log(`Lookup: ${name}`);
        for (let i = this.scope_stack.length - 1; i >= 0; i--) {
            const scope = this.scope_stack[i];
            // This lookup is primarily for semantic analysis
            if (scope[name]) {
                return scope[name];
            }
        }
        return null;
    }
    push_scope() {
        this.scope_stack.push({});
    }
    pop_scope() {
        this.scope_stack.pop();
    }

    // NEW: Helper method for Lexer to check if an identifier is a type name
    isTypeName(name) {
        return this.typedefNames.has(name) || KEYWORDS[name] === TokenType.STRUCT || KEYWORDS[name] === TokenType.ENUM; // Include struct/enum keywords as types
    }
}

// Custom Error for the Parser
class ParserError extends Error {
    constructor(message, token) {
        const detailedMessage = `Parser Error: ${message} on line ${token.line} (token: '${token.value}', type: ${token.type})`;
        super(detailedMessage);
        this.name = 'ParserError';
    }
}

// A helper function to visualize the AST
function prettyPrintAST(node, indent = '', isLast = true) {
    if (!node) return ''; 
    const marker = isLast ? '└── ' : '├── ';
    let output = indent + marker + node.constructor.name;

    const props = Object.keys(node);
    const children = [];
    const otherProps = [];

    props.forEach(prop => {
        if (node[prop] instanceof ASTNode) {
            children.push({ key: prop, value: node[prop] });
        } else if (Array.isArray(node[prop]) && node[prop].every(item => item instanceof ASTNode)) {
            node[prop].forEach((item, index) => {
                children.push({ key: `${prop}[${index}]`, value: item });
            });
        } else if (prop !== 'token') {
            otherProps.push(`${prop}: ${JSON.stringify(node[prop])}`);
        }
    });

    if (node.token) {
         output += ` (${JSON.stringify(node.token.value)})`;
    }

    if (otherProps.length > 0) {
        // output += ` { ${otherProps.join(', ')} }`;
    }

    output += '\n';

    const newIndent = indent + (isLast ? '    ' : '│   ');
    children.forEach((child, index) => {
        output += prettyPrintAST(child.value, newIndent, index === children.length - 1);
    });

    return output;
}

// The Parser, responsible for building the AST from the token stream.
class Parser {
    constructor(lexer) {
        this.lexer = lexer;
        this.currentToken = this.lexer.getNextToken();
    }

    eat(tokenType) {
        if (this.currentToken.type === tokenType) {
            this.currentToken = this.lexer.getNextToken();
        } else {
            throw new ParserError(`Expected ${tokenType} but found ${this.currentToken.type}`, this.currentToken);
        }
    }

    // --- Grammar Rules ---

    program() {
        const declarations = [];
        while (this.currentToken.type !== TokenType.EOF) {
            declarations.push(this.declaration());
        }
        return new ProgramNode(declarations);
    }
    
    declaration() {
        if (this.currentToken.type === TokenType.HASH) {
            return this.preprocessor_directive();
        }
        
        const type = this.declaration_specifiers();
        const isTypedef = type.value.startsWith('typedef');

        if ((type.value.includes('struct') || type.value.includes('enum')) && this.currentToken.type === TokenType.LBRACE) {
             const structBody = this.parse_struct_body();

             if (isTypedef) {
                const typedefName = this.declarator();
                this.eat(TokenType.SEMICOLON);
                return new VarDeclNode(type, typedefName, structBody);
             }

             if (this.currentToken.type === TokenType.SEMICOLON) {
                 this.eat(TokenType.SEMICOLON);
                 // return new StructDefNode(structBody);
				 return structBody;
             }
        }

        if (this.currentToken.type === TokenType.SEMICOLON) {
            this.eat(TokenType.SEMICOLON);
            return new NoOpNode();
        }

        const declarator = this.declarator();
        
        // If the declarator we parsed has a function signature (e.g., "myFunc()"),
        // it's either a function definition or a prototype.
        // A function POINTER VARIABLE may be followed by an =. Let the variable declaration logic handle that.
        if (declarator.functionParams !== null) {
            if (this.currentToken.type !== TokenType.EQUAL) {
                const body = this.currentToken.type === TokenType.LBRACE ? this.compound_statement() : null;
                if (body === null) {
                    this.eat(TokenType.SEMICOLON);
                }
                // *** NEW FIX IS HERE ***
                const params = declarator.functionParams;
                declarator.functionParams = null; // Clean the declarator to prevent duplication in the AST
                return new FuncDefNode(type, declarator, params, body);
            }
        }

        let bitfield = null;
        if (this.currentToken.type === TokenType.COLON) {
            this.eat(TokenType.COLON);
            bitfield = this.assignment(); // Parse the constant expression for the width
        }
        
        const declarations = [];
        let currentDeclarator = declarator;
        let value = (bitfield === null) ? this.initializer() : null; // Only parse initializer if not a bitfield
        declarations.push(new VarDeclNode(type, currentDeclarator, value, bitfield));

        while (this.currentToken.type === TokenType.COMMA) {
            this.eat(TokenType.COMMA);
            currentDeclarator = this.declarator();
            value = this.initializer();
            // Note: Bitfield would need to be parsed for each declarator in a multi-declaration list.
            declarations.push(new VarDeclNode(type, currentDeclarator, value, null));
        }
        
        this.eat(TokenType.SEMICOLON);
        return declarations[0];
    }

    declaration_specifiers() {
        let specifierToken = null;
        let specifierText = '';
        const specifierTokens = [
            TokenType.CONST, TokenType.STATIC, TokenType.EXTERN, TokenType.TYPEDEF, TokenType.VOLATILE, TokenType.VOID, 
            TokenType.INT, TokenType.FLOAT, TokenType.CHAR, TokenType.BOOLEAN, TokenType.BOOL, TokenType.LONG, 
            TokenType.SHORT, TokenType.UNSIGNED, TokenType.STRUCT, TokenType.BYTE, TokenType.STRING_KEYWORD
        ];

        while (specifierTokens.includes(this.currentToken.type)) {
            if (specifierText !== '') {
                specifierText += ' ';
            }
            specifierText += this.currentToken.value;
            specifierToken = this.currentToken;
            this.eat(this.currentToken.type);
            
            if (specifierToken.type === TokenType.STRUCT && this.currentToken.type === TokenType.IDENTIFIER) {
                specifierText += ' ' + this.currentToken.value;
                this.eat(TokenType.IDENTIFIER);
            } else if (specifierToken.type === TokenType.UNSIGNED) {
                 if (this.currentToken.type === TokenType.INT || this.currentToken.type === TokenType.LONG || this.currentToken.type === TokenType.CHAR) {
                    specifierText += ' ' + this.currentToken.value;
                    this.eat(this.currentToken.type);
                 }
            } else if (specifierToken.type === TokenType.LONG && this.currentToken.type === TokenType.LONG) {
                specifierText += ' ' + this.currentToken.value;
                this.eat(this.currentToken.type);
            }
        }
        
        specifierText = specifierText.trim();

        if (specifierText === '') {
            if (this.currentToken.type === TokenType.IDENTIFIER) {
                specifierText = this.currentToken.value;
                specifierToken = this.currentToken;
                this.eat(TokenType.IDENTIFIER);
            } else {
                throw new ParserError(`Expected type specifier`, this.currentToken);
            }
        }

        return new TypeNode(new Token(TokenType.IDENTIFIER, specifierText, specifierToken.line));
    }


    declarator() {
        let pointer = null;
        while (this.currentToken.type === TokenType.STAR) {
            this.eat(TokenType.STAR);
            pointer = new PointerNode(pointer);
        }
    
        let identifier;
        let isFunctionPointer = false;
    
        if (this.currentToken.type === TokenType.LPAREN) {
            // This could be a grouped declarator `(d)` or a function pointer `(*fp)`.
            // We need to look ahead to see if a pointer is inside.
            const startLexerState = { pos: this.lexer.pos, currentChar: this.lexer.currentChar, line: this.lexer.line };
            const startToken = this.currentToken;
            this.eat(TokenType.LPAREN);
    
            // Check if it's a function pointer, like `(*ptr)`
            if (this.currentToken.type === TokenType.STAR) {
                isFunctionPointer = true;
                identifier = this.declarator(); // Recursively parse the pointer declarator inside
            } else {
                // It's just a grouped declarator, like `(myArray)[5]`
                this.lexer.pos = startLexerState.pos; this.lexer.currentChar = startLexerState.currentChar; this.lexer.line = startLexerState.line; this.currentToken = startToken;
                this.eat(TokenType.LPAREN);
                identifier = this.declarator();
            }
            this.eat(TokenType.RPAREN);
        } else if (this.currentToken.type === TokenType.IDENTIFIER) {
            identifier = new VarNode(this.currentToken);
            this.eat(TokenType.IDENTIFIER);
        } else {
             // A declaration must have a declarator. If we find none, it's a parsing error.
             // This forces the try/catch in statement() to backtrack.
             throw new ParserError("Expected a variable name or declarator", this.currentToken);
        }
    
        const arraySpecifiers = [];
        while(this.currentToken.type === TokenType.LBRACKET) {
            this.eat(TokenType.LBRACKET);
            let size = null;
            if (this.currentToken.type !== TokenType.RBRACKET) {
                size = this.expression();
            }
            this.eat(TokenType.RBRACKET);
            arraySpecifiers.push(size);
        }
    
        let functionParams = null;
        // After parsing pointers, name, and arrays, check for a function parameter list.
        // This is where we will also find the parameters for a function pointer.
        if (this.currentToken.type === TokenType.LPAREN) {
            const startLexerState = { pos: this.lexer.pos, currentChar: this.lexer.currentChar, line: this.lexer.line };
            const startToken = this.currentToken;
            this.eat(TokenType.LPAREN);
            
            // Peek ahead to distinguish between parameter list `(int a)` and initializer `(5)`
            const typeKeywords = [TokenType.INT, TokenType.FLOAT, TokenType.CHAR, TokenType.VOID, TokenType.CONST, TokenType.STRUCT, TokenType.IDENTIFIER, TokenType.UNSIGNED, TokenType.LONG, TokenType.SHORT];
            if (typeKeywords.includes(this.currentToken.type) || this.currentToken.type === TokenType.RPAREN || this.currentToken.type === TokenType.ELLIPSIS) {
                try {
                    functionParams = this.parameter_list();
                    this.eat(TokenType.RPAREN);
                } catch (e) {
                    // If parsing parameters fails, it might be an initializer. Backtrack.
                    functionParams = null;
                    this.lexer.pos = startLexerState.pos;
                    this.lexer.currentChar = startLexerState.currentChar;
                    this.lexer.line = startLexerState.line;
                    this.currentToken = startToken;
                }
            } else {
                // If it doesn't look like a parameter list, backtrack immediately.
                this.lexer.pos = startLexerState.pos;
                this.lexer.currentChar = startLexerState.currentChar;
                this.lexer.line = startLexerState.line;
                this.currentToken = startToken;
            }
        }
    
        return new DeclaratorNode(identifier, pointer, arraySpecifiers, functionParams);
    }
    
    initializer() {
        let value = null;
        if (this.currentToken.type === TokenType.LPAREN) { // C++ style init: int x(5);
            this.eat(TokenType.LPAREN);
            value = this.expression();
            this.eat(TokenType.RPAREN);
        } 
        else if (this.currentToken.type === TokenType.EQUAL) {
            this.eat(TokenType.EQUAL);
            if (this.currentToken.type === TokenType.LBRACE) {
                value = this.initializer_list();
            } else {
                value = this.assignment();
            }
        }
        return value;
    }

    preprocessor_directive() {
        this.eat(TokenType.HASH);
        const command = this.currentToken;
        const startLine = command.line;
        while(this.currentToken.line === startLine && this.currentToken.type !== TokenType.EOF) {
            this.eat(this.currentToken.type);
        }
        return new PreprocessorNode(command.value);
    }
    
    initializer_list() {
        this.eat(TokenType.LBRACE);
        const initializers = [];
        if (this.currentToken.type !== TokenType.RBRACE) {
            do {
                if (this.currentToken.type === TokenType.COMMA) this.eat(TokenType.COMMA);
                
                // Check for designated initializer syntax: .member = value
                if (this.currentToken.type === TokenType.DOT) {
                    this.eat(TokenType.DOT);
                    const designator = new VarNode(this.currentToken);
                    this.eat(TokenType.IDENTIFIER);
                    this.eat(TokenType.EQUAL);
                    const value = this.assignment();
                    initializers.push(new DesignatedInitializerNode(designator, value));
                } else if (this.currentToken.type === TokenType.LBRACE) {
                    initializers.push(this.initializer_list());
                } else {
                    // Fallback to parsing a normal expression
                    initializers.push(this.assignment());
                }
            } while (this.currentToken.type === TokenType.COMMA);
        }
        this.eat(TokenType.RBRACE);
        return new InitializerListNode(initializers);
    }

    parse_struct_body() {
        this.eat(TokenType.LBRACE);
        const members = [];
        while(this.currentToken.type !== TokenType.RBRACE && this.currentToken.type !== TokenType.EOF) {
            members.push(this.declaration());
        }
        this.eat(TokenType.RBRACE);
        return new StructDefNode(members);
    }

    parameter_list() {
        const params = [];
        if (this.currentToken.type !== TokenType.RPAREN) {
             if (this.currentToken.type === TokenType.VOID && this.lexer.peek() === ')') {
                 this.eat(TokenType.VOID);
                 return params;
             }
            do {
                if (this.currentToken.type === TokenType.COMMA) this.eat(TokenType.COMMA);
                params.push(this.parameter());
            } while(this.currentToken.type === TokenType.COMMA);
        }
        return params;
    }

    parameter() {
        const type = this.declaration_specifiers();
        let declarator = this.declarator();
        
        return new ParamNode(type, declarator);
    }

     statement() {
         // --- Unambiguous Statement Starters ---
         if (this.currentToken.type === TokenType.HASH) return this.preprocessor_directive();
         if (this.currentToken.type === TokenType.LBRACE) return this.compound_statement();
         if (this.currentToken.type === TokenType.IF) return this.if_statement();
         if (this.currentToken.type === TokenType.FOR) return this.for_statement();
         if (this.currentToken.type === TokenType.WHILE) return this.while_statement();
         if (this.currentToken.type === TokenType.DO) return this.do_while_statement();
         if (this.currentToken.type === TokenType.RETURN) return this.return_statement();
         if (this.currentToken.type === TokenType.BREAK) { this.eat(TokenType.BREAK); this.eat(TokenType.SEMICOLON); return new BreakNode(); }
         if (this.currentToken.type === TokenType.CONTINUE) { this.eat(TokenType.CONTINUE); this.eat(TokenType.SEMICOLON); return new ContinueNode(); }
         if (this.currentToken.type === TokenType.SWITCH) return this.switch_statement();
         if (this.currentToken.type === TokenType.CASE) return this.case_statement();
         if (this.currentToken.type === TokenType.DEFAULT) return this.case_statement();
         if (this.currentToken.type === TokenType.SEMICOLON) { this.eat(TokenType.SEMICOLON); return new NoOpNode(); }
 
         // --- Handle Ambiguity between Declaration and Expression ---
         const typeAndSpecifierTokens = [
             TokenType.INT, TokenType.FLOAT, TokenType.CONST, TokenType.CHAR, TokenType.BOOL, 
             TokenType.BOOLEAN, TokenType.LONG, TokenType.SHORT, TokenType.VOID, TokenType.STRUCT, 
             TokenType.TYPEDEF, TokenType.STATIC, TokenType.EXTERN, TokenType.UNSIGNED, TokenType.VOLATILE,
             TokenType.BYTE, TokenType.STRING_KEYWORD
         ];
 
         // If it starts with a clear type keyword, it's a declaration.
         if (typeAndSpecifierTokens.includes(this.currentToken.type)) {
             return this.declaration();
         }
 
         // If it starts with an IDENTIFIER, it could be a `typedef` (declaration)
         // OR a variable in an expression. We try parsing as an expression first.
         if (this.currentToken.type === TokenType.IDENTIFIER) {
             const startLexerState = { pos: this.lexer.pos, currentChar: this.lexer.currentChar, line: this.lexer.line };
             const startToken = this.currentToken;
             try {
                 // Prioritize parsing as an expression (most common case).
                 return this.expression_statement();
             } catch (e) {
                  if (e instanceof ParserError) {
                     // If it fails as an expression, backtrack and try it as a declaration.
                     this.lexer.pos = startLexerState.pos;
                     this.lexer.currentChar = startLexerState.currentChar;
                     this.lexer.line = startLexerState.line;
                     this.currentToken = startToken;
                     return this.declaration();
                 } else {
                     throw e; // Re-throw other, unexpected errors
                 }
             }
         }
         
         // Default to parsing an expression statement if no other rule matches.
         return this.expression_statement();
     }
    
    return_statement() {
        this.eat(TokenType.RETURN);
        let value = null;
        if (this.currentToken.type !== TokenType.SEMICOLON) {
            value = this.expression();
        }
        this.eat(TokenType.SEMICOLON);
        return new ReturnNode(value);
    }

    if_statement() {
        this.eat(TokenType.IF);
        this.eat(TokenType.LPAREN);
        const condition = this.expression();
        this.eat(TokenType.RPAREN);
        const thenBranch = this.statement();
        let elseBranch = null;
        if (this.currentToken.type === TokenType.ELSE) {
            this.eat(TokenType.ELSE);
            elseBranch = this.statement();
        }
        return new IfNode(condition, thenBranch, elseBranch);
    }

    for_statement() {
        this.eat(TokenType.FOR);
        this.eat(TokenType.LPAREN);

        let init;
        if (this.currentToken.type === TokenType.SEMICOLON) {
            init = new NoOpNode();
            this.eat(TokenType.SEMICOLON);
        } else {
            const typeAndSpecifierTokens = [
                TokenType.INT, TokenType.FLOAT, TokenType.CONST, TokenType.CHAR, TokenType.BOOL, 
                TokenType.BOOLEAN, TokenType.LONG, TokenType.SHORT, TokenType.VOID, TokenType.STRUCT, 
                TokenType.TYPEDEF, TokenType.STATIC, TokenType.EXTERN, TokenType.UNSIGNED, TokenType.VOLATILE,
                TokenType.BYTE, TokenType.STRING_KEYWORD
            ];
            if (typeAndSpecifierTokens.includes(this.currentToken.type)) {
                init = this.declaration(); // Let declaration handle the semicolon
            } else {
                init = this.expression();
                this.eat(TokenType.SEMICOLON);
            }
        }

        const condition = this.currentToken.type === TokenType.SEMICOLON ? new NoOpNode() : this.expression();
        this.eat(TokenType.SEMICOLON);
        const update = this.currentToken.type === TokenType.RPAREN ? new NoOpNode() : this.expression();
        this.eat(TokenType.RPAREN);
        const body = this.statement();
        return new ForNode(init, condition, update, body);
    }

    while_statement() {
        this.eat(TokenType.WHILE);
        this.eat(TokenType.LPAREN);
        const condition = this.expression();
        this.eat(TokenType.RPAREN);
        const body = this.statement();
        return new WhileNode(condition, body);
    }

    do_while_statement() {
        this.eat(TokenType.DO);
        const body = this.statement();
        this.eat(TokenType.WHILE);
        this.eat(TokenType.LPAREN);
        const condition = this.expression();
        this.eat(TokenType.RPAREN);
        this.eat(TokenType.SEMICOLON);
        return new DoWhileNode(condition, body);
    }

    switch_statement() {
        this.eat(TokenType.SWITCH);
        this.eat(TokenType.LPAREN);
        const expression = this.expression();
        this.eat(TokenType.RPAREN);
        const body = this.compound_statement();
        return new SwitchNode(expression, body);
    }
    
    case_statement() {
        let value = null;
        if (this.currentToken.type === TokenType.CASE) {
            this.eat(TokenType.CASE);
            value = this.expression();
        } else {
            this.eat(TokenType.DEFAULT);
        }
        this.eat(TokenType.COLON);
        
        const statements = [];
        while(
            this.currentToken.type !== TokenType.CASE &&
            this.currentToken.type !== TokenType.DEFAULT &&
            this.currentToken.type !== TokenType.RBRACE &&
            this.currentToken.type !== TokenType.EOF
        ) {
            statements.push(this.statement());
        }

        if (value) {
            return new CaseNode(value, statements);
        }
        return new DefaultNode(statements);
    }


    compound_statement() {
        this.eat(TokenType.LBRACE);
        const statements = [];
        while (this.currentToken.type !== TokenType.RBRACE && this.currentToken.type !== TokenType.EOF) {
            statements.push(this.statement());
        }
        this.eat(TokenType.RBRACE);
        return new CompoundStmtNode(statements);
    }

    expression_statement() {
        const expr = this.expression();
        this.eat(TokenType.SEMICOLON);

        // An expression statement must have a side effect to be valid.
        // This check prevents simple expressions like "a * b;" from being parsed successfully,
        // which forces the parser to backtrack and correctly identify pointer declarations
        // like "MyType *myVar;" that could otherwise be mistaken for multiplication.
        if (
            !(expr instanceof AssignNode) &&
            !(expr instanceof FuncCallNode) &&
            !(expr instanceof PostfixOpNode) &&
            !(expr instanceof UnaryOpNode && (expr.op.type === TokenType.PLUS_PLUS || expr.op.type === TokenType.MINUS_MINUS))
        ) {
            // If it's just a variable, number, or simple binary op, it's not a valid statement.
            if (expr instanceof VarNode || expr instanceof NumberNode || expr instanceof BinOpNode) {
                 throw new ParserError("Expression statement has no effect; may be a pointer declaration.", expr.token || this.currentToken);
            }
        }
        return expr;
    }

    argument_expression() {
        return this.assignment();
    }

    expression() { return this.comma_expression(); }

    comma_expression() {
        let node = this.assignment();
        while (this.currentToken.type === TokenType.COMMA) {
            const op = this.currentToken;
            this.eat(TokenType.COMMA);
            node = new BinOpNode(node, op, this.assignment());
        }
        return node;
    }

    assignment() {
        const left = this.ternary();
        const assignOps = [TokenType.EQUAL, TokenType.PLUS_EQUAL, TokenType.MINUS_EQUAL, TokenType.STAR_EQUAL, TokenType.SLASH_EQUAL, TokenType.PERCENT_EQUAL, TokenType.AMPERSAND_EQUAL, TokenType.PIPE_EQUAL, TokenType.CARET_EQUAL, TokenType.LESS_LESS_EQUAL, TokenType.GREATER_GREATER_EQUAL];
        if (assignOps.includes(this.currentToken.type)) {
            const op = this.currentToken;
            this.eat(op.type);
            const right = this.assignment();
            return new AssignNode(left, op, right);
        }
        return left;
    }

    ternary() {
        let node = this.logic_or();
        if (this.currentToken.type === TokenType.QUESTION) {
            this.eat(TokenType.QUESTION);
            const trueExpr = this.expression();
            this.eat(TokenType.COLON);
            const falseExpr = this.ternary();
            node = new TernaryOpNode(node, trueExpr, falseExpr);
        }
        return node;
    }

    logic_or() {
        let node = this.logic_and();
        while (this.currentToken.type === TokenType.PIPE_PIPE) {
            const op = this.currentToken;
            this.eat(TokenType.PIPE_PIPE);
            node = new BinOpNode(node, op, this.logic_and());
        }
        return node;
    }
    
    logic_and() {
        let node = this.bitwise_or();
        while (this.currentToken.type === TokenType.AMPERSAND_AMPERSAND) {
            const op = this.currentToken;
            this.eat(TokenType.AMPERSAND_AMPERSAND);
            node = new BinOpNode(node, op, this.bitwise_or());
        }
        return node;
    }
    
    bitwise_or() {
        let node = this.bitwise_xor();
        while (this.currentToken.type === TokenType.PIPE) {
            const op = this.currentToken;
            this.eat(TokenType.PIPE);
            node = new BinOpNode(node, op, this.bitwise_xor());
        }
        return node;
    }

    bitwise_xor() {
        let node = this.bitwise_and();
        while (this.currentToken.type === TokenType.CARET) {
            const op = this.currentToken;
            this.eat(TokenType.CARET);
            node = new BinOpNode(node, op, this.bitwise_and());
        }
        return node;
    }

    bitwise_and() {
        let node = this.equality();
        while (this.currentToken.type === TokenType.AMPERSAND) {
            const op = this.currentToken;
            this.eat(TokenType.AMPERSAND);
            node = new BinOpNode(node, op, this.equality());
        }
        return node;
    }


    equality() {
        let node = this.comparison();
        while ([TokenType.EQUAL_EQUAL, TokenType.BANG_EQUAL].includes(this.currentToken.type)) {
            const op = this.currentToken;
            this.eat(op.type);
            node = new BinOpNode(node, op, this.comparison());
        }
        return node;
    }
    
    comparison() {
        let node = this.shift();
        while ([TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL].includes(this.currentToken.type)) {
            const op = this.currentToken;
            this.eat(op.type);
            node = new BinOpNode(node, op, this.shift());
        }
        return node;
    }

    shift() {
        let node = this.additive();
        while ([TokenType.LESS_LESS, TokenType.GREATER_GREATER].includes(this.currentToken.type)) {
            const op = this.currentToken;
            this.eat(op.type);
            node = new BinOpNode(node, op, this.additive());
        }
        return node;
    }

    additive() { // Formerly term()
        let node = this.multiplicative();
        while ([TokenType.PLUS, TokenType.MINUS].includes(this.currentToken.type)) {
            const op = this.currentToken;
            this.eat(op.type);
            node = new BinOpNode(node, op, this.multiplicative());
        }
        return node;
    }

    multiplicative() { // Formerly factor()
        let node = this.unary();
        while ([TokenType.STAR, TokenType.SLASH, TokenType.PERCENT].includes(this.currentToken.type)) {
            const op = this.currentToken;
            this.eat(op.type);
            node = new BinOpNode(node, op, this.unary());
        }
        return node;
    }

    unary() {
        if (this.currentToken.type === TokenType.LPAREN) {
            const startPos = this.lexer.pos;
            const startToken = this.currentToken;
            this.eat(TokenType.LPAREN);
            
            const typeKeywords = [TokenType.INT, TokenType.FLOAT, TokenType.CHAR, TokenType.VOID, TokenType.LONG, TokenType.SHORT, TokenType.UNSIGNED, TokenType.STRUCT];
            if (typeKeywords.includes(this.currentToken.type)) {
                const typeNode = this.declaration_specifiers();
                this.eat(TokenType.RPAREN);
                const expr = this.unary();
                return new CastNode(typeNode, expr);
            } else {
                this.lexer.pos = startPos - 1; this.lexer.advance(); this.currentToken = startToken;
            }
        }

        const unaryOps = [TokenType.PLUS, TokenType.MINUS, TokenType.BANG, TokenType.TILDE, TokenType.PLUS_PLUS, TokenType.MINUS_MINUS, TokenType.AMPERSAND, TokenType.STAR];
        if (unaryOps.includes(this.currentToken.type)) {
            const op = this.currentToken;
            this.eat(op.type);
            return new UnaryOpNode(op, this.unary());
        }

        return this.postfix();
    }
    
    postfix() {
        let node = this.primary();
        
        while (true) {
            if ([TokenType.PLUS_PLUS, TokenType.MINUS_MINUS].includes(this.currentToken.type)) {
                const op = this.currentToken;
                this.eat(op.type);
                node = new PostfixOpNode(node, op);
            } else if (this.currentToken.type === TokenType.LBRACKET) {
                this.eat(TokenType.LBRACKET);
                const index = this.expression();
                this.eat(TokenType.RBRACKET);
                node = new ArrayAccessNode(node, index);
            } else if (this.currentToken.type === TokenType.LPAREN) {
                this.eat(TokenType.LPAREN);
                const args = [];
                if (this.currentToken.type !== TokenType.RPAREN) {
                    args.push(this.argument_expression());
                    while (this.currentToken.type === TokenType.COMMA) {
                        this.eat(TokenType.COMMA);
                        args.push(this.argument_expression());
                    }
                }
                this.eat(TokenType.RPAREN);
                node = new FuncCallNode(node, args);
            } else if (this.currentToken.type === TokenType.DOT || this.currentToken.type === TokenType.ARROW) {
                const op = this.currentToken;
                this.eat(op.type);
                const member = new VarNode(this.currentToken);
                this.eat(TokenType.IDENTIFIER);
                node = new MemberAccessNode(node, op, member);
            }
            else {
                break;
            }
        }
        return node;
    }

    primary() {
        const token = this.currentToken;

        if (token.type === TokenType.LED_BUILTIN) {
            this.eat(TokenType.LED_BUILTIN); 
            return new NumberNode(new Token(TokenType.NUMBER, 13, token.line)); 
        }

        const valueKeywords = [TokenType.HIGH, TokenType.LOW, TokenType.TRUE, TokenType.FALSE, TokenType.INPUT, TokenType.OUTPUT, TokenType.INPUT_PULLUP];
        
        if (token.type === TokenType.NUMBER) { this.eat(TokenType.NUMBER); return new NumberNode(token); }
        if (token.type === TokenType.STRING) { this.eat(TokenType.STRING); return new StringNode(token); }
        if (token.type === TokenType.CHAR_LITERAL) { this.eat(TokenType.CHAR_LITERAL); return new CharLiteralNode(token); }
        if (valueKeywords.includes(token.type)) { this.eat(token.type); return new VarNode(token); }
        
        if (token.type === TokenType.SIZEOF) {
            this.eat(TokenType.SIZEOF);
            this.eat(TokenType.LPAREN);
            
            let node;
            const typeKeywords = [TokenType.INT, TokenType.FLOAT, TokenType.CHAR, TokenType.VOID, TokenType.LONG, TokenType.SHORT, TokenType.UNSIGNED, TokenType.STRUCT];
            if (typeKeywords.includes(this.currentToken.type)) {
                node = this.declaration_specifiers();
            } else {
                node = this.expression();
            }
            this.eat(TokenType.RPAREN);
            return new UnaryOpNode(token, node);
        }
        
        if (this.currentToken.type === TokenType.IDENTIFIER) {
            let node = new VarNode(this.currentToken);
            this.eat(TokenType.IDENTIFIER);
            return node;
        }
        if (this.currentToken.type === TokenType.LPAREN) { this.eat(TokenType.LPAREN); const node = this.expression(); this.eat(TokenType.RPAREN); return node; }

        throw new ParserError(`Unexpected token in primary expression`, this.currentToken);
    }
    
    type_specifier() {
        return this.declaration_specifiers();
    }

    parse() {
        const node = this.program();
        if (this.currentToken.type !== TokenType.EOF) {
            throw new ParserError("Did not consume entire input, unexpected token found", this.currentToken);
        }
        return node;
    }
}

// The Interpreter class will walk the AST (Visitor pattern)
class Interpreter {
    constructor(tree) {
        this.tree = tree;
        this.symbolTable = new SymbolTable();
    }

    visit(node) {
        if (node === null || typeof node === 'undefined') {
            return;
        }
        const methodName = `visit_${node.constructor.name}`;
        if (this[methodName]) {
            return this[methodName](node);
        }
        throw new Error(`No visit_${node.constructor.name} method defined.`);
    }

    visit_ProgramNode(node) {
        console.log("Entering global scope.");
        for (const declaration of node.declarations) {
            this.visit(declaration);
        }
        console.log("Leaving global scope.");
    }

    visit_FuncDefNode(node) {
        let funcName;
        if (node.name.identifier && node.name.identifier.value) {
            funcName = node.name.identifier.value;
        } else if (node.name.identifier instanceof VarNode) {
            funcName = node.name.identifier.value;
        } else if (node.name.identifier instanceof DeclaratorNode) {
            let temp = node.name.identifier;
            while(temp.identifier instanceof DeclaratorNode) {
                temp = temp.identifier;
            }
            funcName = temp.identifier.value;
        }
        else {
            console.error("Could not determine function name from declarator:", node.name);
            funcName = "unknown_function";
        }

        const funcSymbol = new FunctionSymbol(funcName);
        this.symbolTable.define(funcSymbol);

        console.log(`Entering scope for function: ${funcName}`);
        this.symbolTable.push_scope();

        if (node.params) {
            for (const param of node.params) {
                this.visit(param);
            }
        }
        
        if (node.body) { 
            this.visit(node.body);
        }

        this.symbolTable.pop_scope();
        console.log(`Leaving scope for function: ${funcName}`);
    }

    visit_ParamNode(node) {
        let paramName;
        if(node.declarator.identifier instanceof VarNode) {
            paramName = node.declarator.identifier.value;
        } else if (node.declarator.identifier instanceof DeclaratorNode) {
             let temp = node.declarator.identifier;
            while(temp.identifier instanceof DeclaratorNode) {
                temp = temp.identifier;
            }
            paramName = temp.identifier.value;
        }
        else {
            paramName = "unnamed_param_" + Math.random();
        }

        const paramTypeName = node.type.value;
        const typeSymbol = this.symbolTable.lookup(paramTypeName);
        if (!typeSymbol && !paramTypeName.startsWith('struct')) {
             throw new SemanticError(`Type not found: '${paramTypeName}'`);
        }
        const paramSymbol = new VarSymbol(paramName, typeSymbol);
        this.symbolTable.define(paramSymbol);
    }

    visit_CompoundStmtNode(node) {
        console.log("Entering new block scope.");
        this.symbolTable.push_scope();
        for(const statement of node.statements) {
            this.visit(statement);
        }
        this.symbolTable.pop_scope();
        console.log("Leaving block scope.");
    }

    visit_VarDeclNode(node) {
        const typeName = node.type.value;
        const typeSymbol = this.symbolTable.lookup(typeName);
        if (!typeSymbol && !typeName.startsWith('struct') && !typeName.startsWith('typedef') && !(node.identifier.identifier instanceof FuncDefNode)) {
             throw new SemanticError(`Type not found: '${typeName}'`);
        }
 
       if(node.identifier.identifier instanceof FuncDefNode) {
           // This is a function pointer, handle accordingly
           this.visit(node.identifier.identifier);
           return;
       }

        const varName = node.identifier.identifier.value;
        const current_scope = this.symbolTable.scope_stack[this.symbolTable.scope_stack.length - 1];
        if (current_scope[varName]) {
            throw new SemanticError(`Duplicate identifier found in same scope: '${varName}'`);
        }

        const varSymbol = new VarSymbol(varName, typeSymbol);
        this.symbolTable.define(varSymbol);

        if (node.value) {
            this.visit(node.value);
        }
    }

    visit_VarNode(node) {
        const varName = node.value;
        const symbol = this.symbolTable.lookup(varName);
        if (!symbol) {
            const arduinoConstants = ['HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP', 'TRUE', 'FALSE', 'Serial', 'NULL'];
            if (!arduinoConstants.includes(varName)) {
                 throw new SemanticError(`Identifier not found: '${varName}'`);
            }
        }
    }

    visit_AssignNode(node) {
        this.visit(node.right);
        this.visit(node.left);
    }

    // Add placeholder visitors for nodes that's don't need semantic checks yet
    visit_NoOpNode(node) { }
    visit_NumberNode(node) { }
    visit_CharLiteralNode(node) { }
    visit_StringNode(node) { }
    visit_InitializerListNode(node) { node.initializers.forEach(i => this.visit(i)); }
    visit_DesignatedInitializerNode(node) { this.visit(node.designator); this.visit(node.value); }
    visit_StructDefNode(node) { if (node.members) node.members.forEach(m => this.visit(m)); }
    visit_BinOpNode(node) { this.visit(node.left); this.visit(node.right); }
    visit_MemberAccessNode(node) { this.visit(node.object); this.visit(node.member); } 
    visit_FuncCallNode(node) { this.visit(node.callable); node.args.forEach(arg => this.visit(arg)); }
    visit_ArrayAccessNode(node) { this.visit(node.identifier); this.visit(node.index); }
    visit_IfNode(node) { this.visit(node.condition); this.visit(node.thenBranch); if (node.elseBranch) this.visit(node.elseBranch); }
    visit_ForNode(node) { this.visit(node.init); this.visit(node.condition); this.visit(node.update); this.visit(node.body); }
    visit_WhileNode(node) { this.visit(node.condition); this.visit(node.body); }
    visit_DoWhileNode(node) { this.visit(node.body); this.visit(node.condition); }
    visit_ReturnNode(node) { if(node.value) this.visit(node.value); }
    visit_BreakNode(node) { }
    visit_ContinueNode(node) { }
    visit_UnaryOpNode(node) { this.visit(node.expr); }
    visit_CastNode(node) { this.visit(node.expr); }
    visit_PostfixOpNode(node) { this.visit(node.expr); }
    visit_PreprocessorNode(node) { }
    visit_TernaryOpNode(node) { this.visit(node.condition); this.visit(node.trueExpr); this.visit(node.falseExpr); }
    visit_SwitchNode(node) { this.visit(node.expression); this.visit(node.body); }
    visit_CaseNode(node) { this.visit(node.value); node.statements.forEach(s => this.visit(s)); }
    visit_DefaultNode(node) { node.statements.forEach(s => this.visit(s)); }


    interpret() {
        this.visit(this.tree);
    }
}

// Expose core classes to the global window object for browser environments
if (typeof window !== 'undefined') {
    window.TokenType = TokenType;
    window.Token = Token;
    window.Lexer = Lexer;
    window.Parser = Parser;
    window.Preprocessor = Preprocessor;
    window.LexerError = LexerError; // Exposing LexerError
    window.ParserError = ParserError; // Exposing ParserError
    window.SemanticError = SemanticError; // Exposing SemanticError
    window.prettyPrintAST = prettyPrintAST; // Exposing AST pretty printer
    window.Interpreter = Interpreter; // Exposing Interpreter
    window.SymbolTable = SymbolTable; // Exposing SymbolTable
    window.BuiltinTypeSymbol = BuiltinTypeSymbol; // Exposing BuiltinTypeSymbol
    window.VarSymbol = VarSymbol; // Exposing VarSymbol
    window.FunctionSymbol = FunctionSymbol; // Exposing FunctionSymbol
    window.ASTNode = ASTNode; // Exposing base ASTNode
    window.ProgramNode = ProgramNode; // Exposing ProgramNode
    // ... you might want to expose other AST nodes as needed for advanced debugging or external tools
}
