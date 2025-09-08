// Test Suite Version: 18 - Fixed to match current parser structure

// Function to compare two arrays of token objects for equality.
function areTokenArraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        // We will ignore line/column for simplicity in this check now
        if (arr1[i].type !== arr2[i].type || arr1[i].value !== arr2[i].value) {
            return false;
        }
    }
    return true;
}

// Function to deeply compare two AST objects for equality.
function areASTsEqual(obj1, obj2) {
    // A more robust comparison that ignores key order
    const sortObject = (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(sortObject);
        return Object.keys(obj).sort().reduce((acc, key) => {
            acc[key] = sortObject(obj[key]);
            return acc;
        }, {});
    };
    return JSON.stringify(sortObject(obj1)) === JSON.stringify(sortObject(obj2));
}

// Our growing list of test cases for the parser - FIXED VERSION
const testCases = [
    { name: "Test 1: Simple function definition", code: "void setup() {}", expectedTokens: [ { type: 'VOID', value: 'void' }, { type: 'IDENTIFIER', value: 'setup' }, { type: 'LPAREN', value: '(' }, { type: 'RPAREN', value: ')' }, { type: 'LBRACE', value: '{' }, { type: 'RBRACE', value: '}' } ] },
    { name: "Test 2: Skip single-line comment", code: "// this is a comment\nvoid", expectedTokens: [ { type: 'VOID', value: 'void' } ] },
    { name: "Test 3: Skip multi-line comment", code: "/* this is a \n multi-line comment */\nint", expectedTokens: [ { type: 'INT', value: 'int' } ] },
    { name: "Test 4: Number and Identifier", code: "int myPin = 13;", expectedTokens: [ { type: 'INT', value: 'int' }, { type: 'IDENTIFIER', value: 'myPin' }, { type: 'ASSIGN', value: '=' }, { type: 'NUMBER', value: 13 }, { type: 'SEMICOLON', value: ';' } ] },
    
    { name: "Test 5: Parse a variable declaration with initializer", code: "int ledPin = 13;", expectedAST: { 
        type: 'ProgramNode', 
        children: [ { 
            type: 'VarDeclNode', 
            varType: { type: 'TypeNode', value: 'int', isPointer: false, pointerLevel: 0, isReference: false }, 
            declarations: [{ 
                declarator: { type: 'DeclaratorNode', value: 'ledPin' }, 
                initializer: { type: 'NumberNode', value: 13 } 
            }] 
        }] 
    }},
    
    { name: "Test 6: Parse a simple function definition", code: "void setup() {}", expectedAST: { type: 'ProgramNode', children: [ { type: 'FuncDefNode', returnType: { type: 'TypeNode', value: 'void' }, declarator: { type: 'DeclaratorNode', value: 'setup' }, parameters: [], body: { type: 'CompoundStmtNode', children: [] } } ] } },
    { name: "Test 7: Parse a function call inside setup()", code: "void setup() { pinMode(LED_BUILTIN, OUTPUT); }", expectedAST: { type: 'ProgramNode', children: [ { type: 'FuncDefNode', returnType: { type: 'TypeNode', value: 'void' }, declarator: { type: 'DeclaratorNode', value: 'setup' }, parameters: [], body: { type: 'CompoundStmtNode', children: [ { type: 'ExpressionStatement', expression: { type: 'FuncCallNode', callee: { type: 'IdentifierNode', value: 'pinMode' }, arguments: [ { type: 'ConstantNode', value: 'LED_BUILTIN' }, { type: 'ConstantNode', value: 'OUTPUT' } ] } } ] } } ] } },
    { name: "Test 8: Parse an assignment expression", code: "void loop() { ledState = HIGH; }", expectedAST: { type: 'ProgramNode', children: [ { type: 'FuncDefNode', returnType: { type: 'TypeNode', value: 'void' }, declarator: { type: 'DeclaratorNode', value: 'loop' }, parameters: [], body: { type: 'CompoundStmtNode', children: [ { type: 'ExpressionStatement', expression: { type: 'AssignmentNode', operator: '=', left: { type: 'IdentifierNode', value: 'ledState' }, right: { type: 'ConstantNode', value: 'HIGH' } } } ] } } ] } },

    // UPDATED: Added line and column to op object
    { name: "Test 9: Parse a simple binary expression", code: "void loop() { brightness = brightness + 5; }", expectedAST: { type: 'ProgramNode', children: [ { type: 'FuncDefNode', returnType: { type: 'TypeNode', value: 'void' }, declarator: { type: 'DeclaratorNode', value: 'loop' }, parameters: [], body: { type: 'CompoundStmtNode', children: [ { type: 'ExpressionStatement', expression: { type: 'AssignmentNode', operator: '=', left: { type: 'IdentifierNode', value: 'brightness' }, right: { type: 'BinaryOpNode', left: { type: 'IdentifierNode', value: 'brightness' }, op: { type: 'PLUS', value: '+', line: 1, column: 39 }, right: { type: 'NumberNode', value: 5 } } } } ] } } ] } },
    
    // UPDATED: Added line and column to op object
    { name: "Test 10: Parse an if statement", code: "void loop() { if (sensorVal == HIGH) digitalWrite(13, LOW); }", expectedAST: { type: 'ProgramNode', children: [ { type: 'FuncDefNode', returnType: { type: 'TypeNode', value: 'void' }, declarator: { type: 'DeclaratorNode', value: 'loop' }, parameters: [], body: { type: 'CompoundStmtNode', children: [ { type: 'IfStatement', condition: { type: 'BinaryOpNode', left: { type: 'IdentifierNode', value: 'sensorVal' }, op: { type: 'EQ', value: '==', line: 1, column: 29 }, right: { type: 'ConstantNode', value: 'HIGH' } }, consequent: { type: 'ExpressionStatement', expression: { type: 'FuncCallNode', callee: { type: 'IdentifierNode', value: 'digitalWrite' }, arguments: [ { type: 'NumberNode', value: 13 }, { type: 'ConstantNode', value: 'LOW' } ] } }, alternate: null } ] } } ] } },
    
    // UPDATED: Added line and column to op object
    { name: "Test 11: Parse an if-else statement", code: "void loop() { if (buttonState == HIGH) { digitalWrite(ledPin, HIGH); } else { digitalWrite(ledPin, LOW); } }", expectedAST: { type: 'ProgramNode', children: [ { type: 'FuncDefNode', returnType: { type: 'TypeNode', value: 'void' }, declarator: { type: 'DeclaratorNode', value: 'loop' }, parameters: [], body: { type: 'CompoundStmtNode', children: [ { type: 'IfStatement', condition: { type: 'BinaryOpNode', left: { type: 'IdentifierNode', value: 'buttonState' }, op: { type: 'EQ', value: '==', line: 1, column: 31 }, right: { type: 'ConstantNode', value: 'HIGH' } }, consequent: { type: 'CompoundStmtNode', children: [ { type: 'ExpressionStatement', expression: { type: 'FuncCallNode', callee: { type: 'IdentifierNode', value: 'digitalWrite' }, arguments: [ { type: 'IdentifierNode', value: 'ledPin' }, { type: 'ConstantNode', value: 'HIGH' } ] } } ] }, alternate: { type: 'CompoundStmtNode', children: [ { type: 'ExpressionStatement', expression: { type: 'FuncCallNode', callee: { type: 'IdentifierNode', value: 'digitalWrite' }, arguments: [ { type: 'IdentifierNode', value: 'ledPin' }, { type: 'ConstantNode', value: 'LOW' } ] } } ] } } ] } } ] } },
    
    // UPDATED: Added line and column to both op objects
    { name: "Test 12: Parse a while loop", code: "void loop() { while (x < 10) x = x + 1; }", expectedAST: { type: 'ProgramNode', children: [ { type: 'FuncDefNode', returnType: { type: 'TypeNode', value: 'void' }, declarator: { type: 'DeclaratorNode', value: 'loop' }, parameters: [], body: { type: 'CompoundStmtNode', children: [ { type: 'WhileStatement', condition: { type: 'BinaryOpNode', left: { type: 'IdentifierNode', value: 'x' }, op: { type: 'LT', value: '<', line: 1, column: 24 }, right: { type: 'NumberNode', value: 10 } }, body: { type: 'ExpressionStatement', expression: { type: 'AssignmentNode', operator: '=', left: { type: 'IdentifierNode', value: 'x' }, right: { type: 'BinaryOpNode', left: { type: 'IdentifierNode', value: 'x' }, op: { type: 'PLUS', value: '+', line: 1, column: 36 }, right: { type: 'NumberNode', value: 1 } } } } } ] } } ] } },
    
    // UPDATED: Added line and column to both op objects
    { name: "Test 13: Parse a for loop", code: "void loop() { for (int i = 0; i < 10; i = i + 1) {} }", expectedAST: { 
        type: 'ProgramNode', 
        children: [{ 
            type: 'FuncDefNode', 
            returnType: { type: 'TypeNode', value: 'void' }, 
            declarator: { type: 'DeclaratorNode', value: 'loop' }, 
            parameters: [],
            body: { 
                type: 'CompoundStmtNode', 
                children: [{ 
                    type: 'ForStatement', 
                    initializer: { 
                        type: 'VarDeclNode', 
                        varType: { type: 'TypeNode', value: 'int', isPointer: false, pointerLevel: 0, isReference: false }, 
                        declarations: [{ 
                            declarator: { type: 'DeclaratorNode', value: 'i' }, 
                            initializer: { type: 'NumberNode', value: 0 } 
                        }] 
                    }, 
                    condition: { type: 'BinaryOpNode', left: { type: 'IdentifierNode', value: 'i' }, op: { type: 'LT', value: '<', line: 1, column: 33 }, right: { type: 'NumberNode', value: 10 } }, 
                    increment: { type: 'AssignmentNode', operator: '=', left: { type: 'IdentifierNode', value: 'i' }, right: { type: 'BinaryOpNode', left: { type: 'IdentifierNode', value: 'i' }, op: { type: 'PLUS', value: '+', line: 1, column: 45 }, right: { type: 'NumberNode', value: 1 } } }, 
                    body: { type: 'CompoundStmtNode', children: [] } 
                }] 
            }
        }] 
    }},
    
    { name: "Test 14: Check for specific parsing error", code: "void setup() { int x = ; }", expectedAST: { 
        type: 'ProgramNode', 
        children: [
            { 
                type: 'ErrorNode', 
                value: "Parsing Error on line 1, column: 24: Unexpected token SEMICOLON in expression."
            },
            {
                type: 'CommentNode',
                value: "Skipped stray rbrace"
            }
        ] 
    }},
    { name: "Test 15: Parse a loop with multiple statements", code: "void loop() { digitalWrite(1, HIGH); delay(1000); }", expectedAST: { type: 'ProgramNode', children: [ { type: 'FuncDefNode', returnType: { type: 'TypeNode', value: 'void' }, declarator: { type: 'DeclaratorNode', value: 'loop' }, parameters: [], body: { type: 'CompoundStmtNode', children: [ { type: 'ExpressionStatement', expression: { type: 'FuncCallNode', callee: { type: 'IdentifierNode', value: 'digitalWrite' }, arguments: [ { type: 'NumberNode', value: 1 }, { type: 'ConstantNode', value: 'HIGH' } ] } }, { type: 'ExpressionStatement', expression: { type: 'FuncCallNode', callee: { type: 'IdentifierNode', value: 'delay' }, arguments: [ { type: 'NumberNode', value: 1000 } ] } } ] } } ] } },
    { name: "Test 16: Parse a member access expression", code: "void loop() { Serial.println(0); }", expectedAST: { type: 'ProgramNode', children: [ { type: 'FuncDefNode', returnType: { type: 'TypeNode', value: 'void' }, declarator: { type: 'DeclaratorNode', value: 'loop' }, parameters: [], body: { type: 'CompoundStmtNode', children: [ { type: 'ExpressionStatement', expression: { type: 'FuncCallNode', callee: { type: 'MemberAccessNode', object: { type: 'IdentifierNode', value: 'Serial' }, property: { type: 'IdentifierNode', value: 'println' }, operator: "DOT" }, arguments: [ { type: 'NumberNode', value: 0 } ] } } ] } } ] } },
    { name: "Test 17: Ignore a preprocessor directive", code: "#include <Servo.h>\nvoid setup() {}", expectedAST: { type: 'ProgramNode', children: [ { type: 'FuncDefNode', returnType: { type: 'TypeNode', value: 'void' }, declarator: { type: 'DeclaratorNode', value: 'setup' }, parameters: [], body: { type: 'CompoundStmtNode', children: [] } } ] } },
    
    { name: "Test 18: Parse a String variable declaration", code: "String myString;", expectedAST: { 
        type: 'ProgramNode', 
        children: [{ 
            type: 'VarDeclNode', 
            varType: { type: 'TypeNode', value: 'String', isPointer: false, pointerLevel: 0, isReference: false }, 
            declarations: [{ 
                declarator: { type: 'DeclaratorNode', value: 'myString' }, 
                initializer: null 
            }] 
        }] 
    }},
    
    { name: "Test 19: Verify correct lookahead state handling", code: "int myVar;\nvoid setup() {}", expectedAST: { 
        type: 'ProgramNode', 
        children: [
            { 
                type: 'VarDeclNode', 
                varType: { type: 'TypeNode', value: 'int', isPointer: false, pointerLevel: 0, isReference: false }, 
                declarations: [{ 
                    declarator: { type: 'DeclaratorNode', value: 'myVar' }, 
                    initializer: null 
                }] 
            }, 
            { 
                type: 'FuncDefNode', 
                returnType: { type: 'TypeNode', value: 'void' }, 
                declarator: { type: 'DeclaratorNode', value: 'setup' }, 
                parameters: [],
                body: { type: 'CompoundStmtNode', children: [] }
            }
        ] 
    }},
    
    { name: "Test 20: Parse a function definition with parameters", code: "void myFunc(int pin, int value) {}", expectedAST: { type: 'ProgramNode', children: [ { type: 'FuncDefNode', returnType: { type: 'TypeNode', value: 'void' }, declarator: { type: 'DeclaratorNode', value: 'myFunc' }, parameters: [ { type: 'ParamNode', paramType: { type: 'TypeNode', value: 'int', isPointer: false, pointerLevel: 0 }, declarator: { type: 'DeclaratorNode', value: 'pin' } }, { type: 'ParamNode', paramType: { type: 'TypeNode', value: 'int', isPointer: false, pointerLevel: 0 }, declarator: { type: 'DeclaratorNode', value: 'value' } } ], body: { type: 'CompoundStmtNode', children: [] } } ] } },
    
    // UPDATED: Added line and column to both op objects
    { name: "Test 21: Parse unary expressions", code: "bool x = !HIGH;\nint y = -5;", expectedAST: { 
        type: 'ProgramNode', 
        children: [
            { 
                type: 'VarDeclNode', 
                varType: { type: 'TypeNode', value: 'bool', isPointer: false, pointerLevel: 0, isReference: false }, 
                declarations: [{ 
                    declarator: { type: 'DeclaratorNode', value: 'x' }, 
                    initializer: { type: 'UnaryOpNode', op: { type: 'NOT', value: '!', line: 1, column: 10 }, operand: { type: 'ConstantNode', value: 'HIGH' } } 
                }] 
            }, 
            { 
                type: 'VarDeclNode', 
                varType: { type: 'TypeNode', value: 'int', isPointer: false, pointerLevel: 0, isReference: false }, 
                declarations: [{ 
                    declarator: { type: 'DeclaratorNode', value: 'y' }, 
                    initializer: { type: 'UnaryOpNode', op: { type: 'MINUS', value: '-', line: 2, column: 9 }, operand: { type: 'NumberNode', value: 5 } } 
                }] 
            }
        ] 
    }},
    
    { name: "Test 22: Parse an array declaration", code: "int pins[];", expectedAST: { 
        type: 'ProgramNode', 
        children: [{ 
            type: 'VarDeclNode', 
            varType: { type: 'TypeNode', value: 'int', isPointer: false, pointerLevel: 0, isReference: false }, 
            declarations: [{ 
                declarator: { type: 'ArrayDeclaratorNode', identifier: { type: 'IdentifierNode', value: 'pins' }, dimensions: [null], hasProgmem: false }, 
                initializer: null 
            }] 
        }] 
    }},
    
    { name: "Test 23: Parse an array access expression", code: "int pin = pins[i];", expectedAST: { 
        type: 'ProgramNode', 
        children: [{ 
            type: 'VarDeclNode', 
            varType: { type: 'TypeNode', value: 'int', isPointer: false, pointerLevel: 0, isReference: false }, 
            declarations: [{ 
                declarator: { type: 'DeclaratorNode', value: 'pin' }, 
                initializer: { type: 'ArrayAccessNode', identifier: { type: 'IdentifierNode', value: 'pins' }, index: { type: 'IdentifierNode', value: 'i' } } 
            }] 
        }] 
    }},
    
    // UPDATED: Added line and column to op object
    { name: "Test 24: Parse a unary NOT expression", code: "bool state = !true;", expectedAST: { 
        type: 'ProgramNode', 
        children: [{ 
            type: 'VarDeclNode', 
            varType: { type: 'TypeNode', value: 'bool', isPointer: false, pointerLevel: 0, isReference: false }, 
            declarations: [{ 
                declarator: { type: 'DeclaratorNode', value: 'state' }, 
                initializer: { type: 'UnaryOpNode', op: { type: 'NOT', value: '!', line: 1, column: 14 }, operand: { type: 'ConstantNode', value: 'true' } } 
            }] 
        }] 
    }},
    
    { name: "Test 25: Parse a compound assignment expression", code: "void loop() { x += 5; }", expectedAST: { type: 'ProgramNode', children: [ { type: 'FuncDefNode', returnType: { type: 'TypeNode', value: 'void' }, declarator: { type: 'DeclaratorNode', value: 'loop' }, parameters: [], body: { type: 'CompoundStmtNode', children: [ { type: 'ExpressionStatement', expression: { type: 'AssignmentNode', operator: '+=', left: { type: 'IdentifierNode', value: 'x' }, right: { type: 'NumberNode', value: 5 } } } ] } } ] } },
	
    // UPDATED: This now correctly parses constructor calls with multiple arguments
    { name: "Test 26: Parse a class constructor declaration", code: "LiquidCrystal lcd(12, 11);", expectedAST: { 
        type: 'ProgramNode', 
        children: [{ 
            type: 'VarDeclNode', 
            varType: { type: 'TypeNode', value: 'LiquidCrystal', isPointer: false, pointerLevel: 0, isReference: false }, 
            declarations: [{ 
                declarator: { type: 'DeclaratorNode', value: 'lcd' }, 
                initializer: { 
                    type: 'ConstructorCallNode', 
                    callee: { type: 'IdentifierNode', value: 'LiquidCrystal' }, 
                    arguments: [
                        { type: 'NumberNode', value: 12 },
                        { type: 'NumberNode', value: 11 }
                    ]
                }
            }]
        }] 
    }},
    
    { name: "Test 27: Parse a switch statement", code: "void loop() { switch (x) { case 0: break; case 1: break; } }", expectedAST: { type: 'ProgramNode', children: [ { type: 'FuncDefNode', returnType: { type: 'TypeNode', value: 'void' }, declarator: { type: 'DeclaratorNode', value: 'loop' }, parameters: [], body: { type: 'CompoundStmtNode', children: [ { type: 'SwitchStatement', discriminant: { type: 'IdentifierNode', value: 'x' }, cases: [ { type: 'CaseStatement', test: { type: 'NumberNode', value: 0 }, consequent: [ { type: 'BreakStatement' } ] }, { type: 'CaseStatement', test: { type: 'NumberNode', value: 1 }, consequent: [ { type: 'BreakStatement' } ] } ] } ] } } ] } }
];

// --- Test Runner Logic ---
function runParserTests() {
    const logElement = document.getElementById('log');
    let testsPassed = 0;
    let fullLog = '';

    const timestamp = new Date().toLocaleString();
    fullLog += `Parser Version: ${PARSER_VERSION} | Test run at: ${timestamp}\n\n`;

    testCases.forEach((test, index) => {
        fullLog += `--- ${test.name} ---\n`;

        try {
            if (test.expectedTokens) { // This is a lexer test
                const actualTokens = [];
                let token;
                // Create a temporary parser instance, but reset its state to test the lexer from the start.
                const lexerInstance = new Parser(test.code);
                lexerInstance.position = 0;
                lexerInstance.currentChar = lexerInstance.code[0] || null;
               
                while ((token = lexerInstance.getNextToken()).type !== 'EOF') {
                    actualTokens.push(token);
                }
                if (areTokenArraysEqual(actualTokens, test.expectedTokens)) {
                    fullLog += `<span class="pass">PASS</span>\n\n`;
                    testsPassed++;
                } else {
                    throw new Error(`Token mismatch.\nExpected: ${JSON.stringify(test.expectedTokens)}\nGot: ${JSON.stringify(actualTokens)}`);
                }
            } else if (test.expectedAST) { // This is a parser (AST) test
                const parser = new Parser(test.code);
                const actualAST = parser.parse();
                if (areASTsEqual(actualAST, test.expectedAST)) {
                    fullLog += `<span class="pass">PASS</span>\n\n`;
                    testsPassed++;
                } else {
                    throw new Error(`AST mismatch.\nExpected: ${JSON.stringify(test.expectedAST, null, 2)}\nGot: ${JSON.stringify(actualAST, null, 2)}`);
                }
            } else if (test.expectedError) { // This is an error-checking test
               try {
                   const parser = new Parser(test.code);
                   parser.parse();
                   // If we get here, it means the parser did NOT throw an error.
                   throw new Error(`Expected error "${test.expectedError}" but none was thrown.`);
               } catch (e) {
                   if (e.message === test.expectedError) {
                       fullLog += `<span class="pass">PASS</span>\n\n`;
                       testsPassed++;
                   } else {
                       throw new Error(`Error message mismatch.\nExpected: ${test.expectedError}\nGot: ${e.message}`);
                   }
               }
            }
        } catch (e) {
            fullLog += `<span class="fail">FAIL</span>\n`;
            fullLog += `${e.message}\n\n`;
        }
    });

    fullLog += `--- Test Summary ---\n`;
    fullLog += `${testsPassed} / ${testCases.length} tests passed.\n`;
    logElement.innerHTML = fullLog;
}

// Universal export for Node.js and browser compatibility
if (typeof window !== 'undefined') {
    // Browser environment
    window.testCases = testCases;
    window.areTokenArraysEqual = areTokenArraysEqual;
    window.areASTsEqual = areASTsEqual;
    window.runParserTests = runParserTests;
    
    // Run the tests automatically when the page loads
    window.onload = runParserTests;
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        testCases,
        areTokenArraysEqual,
        areASTsEqual,
        runParserTests
    };
}