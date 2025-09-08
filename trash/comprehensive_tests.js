// Comprehensive Test Suite - Combined from all test sources
// Version: 1.0.0 - Created from test.js, old_test.js, examples.js, and neopixel.js
// Total Tests: 162 (27 parser tests + 54 comprehensive tests + 79 Arduino examples + 2 NeoPixel examples)

// =============================================================================
// PARSER UNIT TESTS (from test.js) - 27 tests
// =============================================================================

const parserUnitTests = [
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

    { name: "Test 9: Parse a simple binary expression", code: "void loop() { brightness = brightness + 5; }", expectedAST: { type: 'ProgramNode', children: [ { type: 'FuncDefNode', returnType: { type: 'TypeNode', value: 'void' }, declarator: { type: 'DeclaratorNode', value: 'loop' }, parameters: [], body: { type: 'CompoundStmtNode', children: [ { type: 'ExpressionStatement', expression: { type: 'AssignmentNode', operator: '=', left: { type: 'IdentifierNode', value: 'brightness' }, right: { type: 'BinaryOpNode', left: { type: 'IdentifierNode', value: 'brightness' }, op: { type: 'PLUS', value: '+', line: 1, column: 39 }, right: { type: 'NumberNode', value: 5 } } } } ] } } ] } },
    
    { name: "Test 10: Parse an if statement", code: "void loop() { if (sensorVal == HIGH) digitalWrite(13, LOW); }", expectedAST: { type: 'ProgramNode', children: [ { type: 'FuncDefNode', returnType: { type: 'TypeNode', value: 'void' }, declarator: { type: 'DeclaratorNode', value: 'loop' }, parameters: [], body: { type: 'CompoundStmtNode', children: [ { type: 'IfStatement', condition: { type: 'BinaryOpNode', left: { type: 'IdentifierNode', value: 'sensorVal' }, op: { type: 'EQ', value: '==', line: 1, column: 29 }, right: { type: 'ConstantNode', value: 'HIGH' } }, consequent: { type: 'ExpressionStatement', expression: { type: 'FuncCallNode', callee: { type: 'IdentifierNode', value: 'digitalWrite' }, arguments: [ { type: 'NumberNode', value: 13 }, { type: 'ConstantNode', value: 'LOW' } ] } }, alternate: null } ] } } ] } },
    
    { name: "Test 11: Parse an if-else statement", code: "void loop() { if (buttonState == HIGH) { digitalWrite(ledPin, HIGH); } else { digitalWrite(ledPin, LOW); } }", expectedAST: { type: 'ProgramNode', children: [ { type: 'FuncDefNode', returnType: { type: 'TypeNode', value: 'void' }, declarator: { type: 'DeclaratorNode', value: 'loop' }, parameters: [], body: { type: 'CompoundStmtNode', children: [ { type: 'IfStatement', condition: { type: 'BinaryOpNode', left: { type: 'IdentifierNode', value: 'buttonState' }, op: { type: 'EQ', value: '==', line: 1, column: 31 }, right: { type: 'ConstantNode', value: 'HIGH' } }, consequent: { type: 'CompoundStmtNode', children: [ { type: 'ExpressionStatement', expression: { type: 'FuncCallNode', callee: { type: 'IdentifierNode', value: 'digitalWrite' }, arguments: [ { type: 'IdentifierNode', value: 'ledPin' }, { type: 'ConstantNode', value: 'HIGH' } ] } } ] }, alternate: { type: 'CompoundStmtNode', children: [ { type: 'ExpressionStatement', expression: { type: 'FuncCallNode', callee: { type: 'IdentifierNode', value: 'digitalWrite' }, arguments: [ { type: 'IdentifierNode', value: 'ledPin' }, { type: 'ConstantNode', value: 'LOW' } ] } } ] } } ] } } ] } },
    
    { name: "Test 12: Parse a while loop", code: "void loop() { while (x < 10) x = x + 1; }", expectedAST: { type: 'ProgramNode', children: [ { type: 'FuncDefNode', returnType: { type: 'TypeNode', value: 'void' }, declarator: { type: 'DeclaratorNode', value: 'loop' }, parameters: [], body: { type: 'CompoundStmtNode', children: [ { type: 'WhileStatement', condition: { type: 'BinaryOpNode', left: { type: 'IdentifierNode', value: 'x' }, op: { type: 'LT', value: '<', line: 1, column: 24 }, right: { type: 'NumberNode', value: 10 } }, body: { type: 'ExpressionStatement', expression: { type: 'AssignmentNode', operator: '=', left: { type: 'IdentifierNode', value: 'x' }, right: { type: 'BinaryOpNode', left: { type: 'IdentifierNode', value: 'x' }, op: { type: 'PLUS', value: '+', line: 1, column: 36 }, right: { type: 'NumberNode', value: 1 } } } } } ] } } ] } },
    
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

// =============================================================================
// COMPREHENSIVE TESTS (from old_test.js) - 54 tests  
// =============================================================================

const comprehensiveTests = [
    { name: "test1.ino", content: `// Test Case for Array Access\nint myPins[] = {2, 4, 8};\n\nvoid setup() {\n  pinMode(myPins[1], OUTPUT);\n}\n\nvoid loop() {\n  // empty\n}` },
    { name: "test2.ino", content: `// To test the Lexer and Parser\nvoid setup() {\n  /*\n    This is the setup function.\n    It runs once at the beginning.\n  */\n  Serial.begin(9600); // Initialize serial communication\n}\n\nvoid loop() {\n  // Turn the LED on\n  digitalWrite(13, HIGH);\n  delay(1000); // Wait for a second\n\n  // Turn the LED off\n  digitalWrite(13, LOW);\n  delay(1000); // Wait for another second\n}` },
    { name: "test3.ino", content: `#include <Arduino.h>\n\n// Global variable declarations\nconst int ledPin = 13;\nint counter = 0;\nfloat dutyCycle = 127.5; // Test floating point\n\nvoid setup() {\n  pinMode(ledPin, OUTPUT);\n}\n\nvoid loop() {\n  for (int i = 0; i < 2; i++) {\n    digitalWrite(ledPin, HIGH);\n    delay(50);\n    digitalWrite(ledPin, LOW);\n    delay(50);\n  }\n\n  if (counter >= 5 && counter < 10) {\n    // This block should not execute on the first few loops\n  }\n\n  counter += 1; // Test compound assignment\n  delay(500);\n}` },
    { name: "test4.ino", content: `// Test Case for Operator Precedence\nvoid setup() {\n  int a = 5;\n  int b = 10;\n  int c = 2;\n\n  if (a + b / c == 10 && b > 9) {\n    // Parser should correctly evaluate (b / c) first, then (a + ...),\n    // then (== 10), then (> 9), and finally the &&.\n  }\n}\n\nvoid loop() {\n  // empty\n}` },
    { name: "test5.ino", content: `// Test Case for Parentheses Precedence\nvoid setup() {\n  int a = 5;\n  int b = 10;\n  int c = 2;\n\n  int result = (a + b) * c; // Should evaluate (a + b) first.\n}\n\nvoid loop() {\n  // empty\n}` },
    { name: "test6.ino", content: `// Test Case for Unary vs. Binary Operators\nvoid setup() {\n  int x = 10;\n  int y = -x;      // Unary minus\n  int z = 10 - 5;  // Binary minus\n}\n\nvoid loop() {\n  // empty\n}` },
    { name: "test7.ino", content: `// Test Case for C++-Style Initialization\nvoid setup() {\n  int x(10);\n}\n\nvoid loop() {\n  // empty\n}` },
    { name: "test8.ino", content: `// Test Rigorous Brackets & Parentheses\nint myPins[] = {2, 4, 8};\n\nint getIndex() {\n  return 1;\n}\n\nvoid setup() {\n  int x = myPins[0];\n  int y = myPins[getIndex()];\n  pinMode(myPins[2], OUTPUT);\n  int z = (myPins[0] + getIndex()) * myPins[2];\n}\n\nvoid loop() {\n  // empty\n}` },
    { name: "test9.ino", content: `// Test Case for the return statement\nint getValue() {\n  return 42;\n}\n\nvoid doSomething() {\n  return;\n}\n\nvoid setup() {}\nvoid loop() {}` },
    { name: "test10.ino", content: `// Test Case for Advanced Numeric Literals\nint hexValue = 0x1A;\nint octValue = 032;\nfloat sciValue = 2.6e1;\n\nvoid setup() {}\nvoid loop() {}` },
    { name: "test11.ino", content: `// Test Case for Character Literals\nchar myChar = 'C';\n\nvoid setup() {}\nvoid loop() {}` },
    { name: "test12.ino", content: `// Test Case for the \"Dangling Else\"\nvoid setup() {\n  int x = 5;\n  int y = 10;\n  if (x > 0)\n    if (y > 20)\n      pinMode(1, HIGH);\n    else\n      pinMode(1, LOW);\n}\n\nvoid loop() {}` },
    { name: "test13.ino", content: `// Test Case for Pointer vs. Multiplication\nvoid setup() {\n  int x = 5 * 10;\n  int* p = &x;\n}\n\nvoid loop() {}` },
    { name: "test14.ino", content: `// Test Case for Function Pointer Declarations\nvoid myInterruptService() {}\n\nvoid setup() {\n  void (*myFunction)() = &myInterruptService;\n}\n\nvoid loop() {}` },
    { name: "test15.ino", content: `// Nested Loops and Variable Scope\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int i = 0;\n  while (i < 3) {\n    for (int j = 0; j < 3; j++) {\n      int k = 0;\n      do {\n        Serial.print("i: ");\n        Serial.print(i);\n        Serial.print(", j: ");\n        Serial.print(j);\n        Serial.print(", k: ");\n        Serial.println(k);\n        k++;\n      } while (k < 2);\n    }\n    i++;\n  }\n}` },
    { name: "test16.ino", content: `// Complex Conditional Logic\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int x = 5;\n  int y = 10;\n  int z = 15;\n\n  if ((x < y && y != z) || (x == 5 && z > 10)) {\n    if (z / x > 2 && y % 2 == 0) {\n      Serial.println("Condition 1 met.");\n    } else {\n      Serial.println("Condition 2 met.");\n    }\n  } else if (x > y || y == 10) {\n    Serial.println("Condition 3 met.");\n  } else {\n    Serial.println("No conditions met.");\n  }\n}` },
    { name: "test17.ino", content: `// Operator Precedence and Associativity\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int a = 20;\n  int b = 5;\n  int c = 2;\n  int d = 3;\n\n  int result1 = a + b * c - d;\n  int result2 = (a + b) * c - d;\n  int result3 = a / (b - d) + c;\n\n  Serial.print("Result 1: "); Serial.println(result1);\n  Serial.print("Result 2: "); Serial.println(result2);\n  Serial.print("Result 3: "); Serial.println(result3);\n}` },
    { name: "test18.ino", content: `// Function Calls and Parameter Passing\nint add(int x, int y) {\n  return x + y;\n}\n\nint multiply(int x, int y) {\n  return x * y;\n}\n\nint calculate(int x, int y, int z) {\n  return multiply(add(x, y), z);\n}\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int a = 5;\n  int b = 10;\n  int c = 2;\n\n  int finalResult = calculate(a, b, c);\n\n  Serial.print("Final result: ");\n  Serial.println(finalResult);\n}` },
    { name: "test19.ino", content: `// Loop Control Statements (break, continue)\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  for (int i = 0; i < 5; i++) {\n    for (int j = 0; j < 5; j++) {\n      if (j == 2) {\n        Serial.println("Continuing inner loop...");\n        continue;\n      }\n      if (i == 3) {\n        Serial.println("Breaking outer loop...");\n        break;\n      }\n      Serial.print("i: ");\n      Serial.print(i);\n      Serial.print(", j: ");\n      Serial.print(j);\n      Serial.println(j);\n    }\n  }\n}` },
    { name: "test20.ino", content: `// Ternary Operator and Bitwise Operators\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int a = 10;\n  int b = 20;\n\n  int maxVal = (a > b) ? a : b;\n  Serial.print("Max value: "); Serial.println(maxVal);\n\n  int c = 0b1010;\n  int d = 0b0110;\n  int andResult = c & d;\n  int orResult = c | d;\n  int xorResult = c ^ d;\n  int shiftResult = c << 1;\n\n  Serial.print("AND result: "); Serial.println(andResult);\n  Serial.print("OR result: "); Serial.println(orResult);\n  Serial.print("XOR result: "); Serial.println(xorResult);\n  Serial.print("Shift result: "); Serial.println(shiftResult);\n}` },
    { name: "test21.ino", content: `// Floating-Point Arithmetic and Mixed Types\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  float f1 = 3.14;\n  float f2 = 2.0;\n  int i1 = 5;\n\n  float result1 = f1 * f2;\n  float result2 = (f1 + i1) / f2;\n\n  if (result2 > 4.0 && i1 < 10) {\n    Serial.println("Calculation is correct.");\n  } else {\n    Serial.println("Calculation is incorrect.");\n  }\n\n  Serial.print("Result 1: "); Serial.println(result1, 4);\n  Serial.print("Result 2: "); Serial.println(result2, 4);\n}` },
    { name: "test22.ino", content: `// String and Character Literals\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  char myChar = 'A';\n  char escapedChar = '\\n';\n  const char* str1 = "Hello";\n  const char* str2 = " world!";\n\n  Serial.print(str1);\n  Serial.println(str2);\n  Serial.print("My character is: ");\n  Serial.println(myChar);\n\n  Serial.print(myChar);\n  Serial.print(escapedChar);\n}` },
    { name: "test23.ino", content: `// Multiple Statements on a Single Line\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int x = 10; int y = 20; if (x < y) { Serial.println("X is less than Y."); }\n  int i = 0; while (i < 3) { Serial.println(i); i++; }\n  for (int j = 0; j < 2; j++) { Serial.print("J is: "); Serial.println(j); }\n}` },
    { name: "test24.ino", content: `// Mixed-Type Expressions and Casting\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int a = 10;\n  float b = 3.0;\n\n  float result1 = (float)(a / 3);\n  float result2 = a / b;\n  float result3 = (float)a * b + 5.5;\n\n  Serial.print("Result 1 (int div, cast): "); Serial.println(result1, 4);\n  Serial.print("Result 2 (float div): "); Serial.println(result2, 4);\n  Serial.print("Result 3 (mixed): "); Serial.println(result3, 4);\n}` },
    { name: "test25.ino", content: `// switch statement with fall-through and nested blocks\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int x = 2;\n  switch (x) {\n    case 1:\n      Serial.println("Case 1");\n    case 2: {\n      int y = 5;\n      Serial.println("Case 2");\n      Serial.print("y is: ");\n      Serial.println(y);\n    }\n    case 3:\n      Serial.println("Case 3");\n      break;\n    default:\n      Serial.println("Default case");\n      break;\n  }\n}` },
    { name: "test26.ino", content: `// Complex Preprocessor Directives\n#define PI 3.14159\n#define CIRCLE_AREA(r) (PI * r * r)\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  #ifdef PI\n    float radius = 5.0;\n    float area = CIRCLE_AREA(radius);\n    Serial.print("Area of circle: ");\n    Serial.println(area);\n  #else\n    Serial.println("PI is not defined.");\n  #endif\n}` },
    { name: "test27.ino", content: `// Array Indexing and Multidimensional Arrays\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int arr[5] = {10, 20, 30, 40, 50};\n  int matrix[2][3] = {{1, 2, 3}, {4, 5, 6}};\n  int i = 2;\n  int j = 1;\n  int k = 1;\n\n  int val1 = arr[i * 2 - 1];\n  int val2 = matrix[j][k];\n\n  Serial.print("Val 1: ");\n  Serial.println(val1);\n  Serial.print("Val 2: ");\n  Serial.println(val2);\n}` },
    { name: "test28.ino", content: `// Function Pointers and Callbacks\nint myFunc(int a, int b) {\n  return a + b;\n}\n\nvoid callFunc(int (*funcPtr)(int, int)) {\n  Serial.print("Result: ");\n  Serial.println(funcPtr(10, 20));\n}\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int (*ptr)(int, int);\n  ptr = &myFunc;\n  callFunc(ptr);\n}` },
    { name: "test29.ino", content: `// Chained Assignments and Unary Operators\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int a, b, c;\n  a = b = c = 5;\n  int x = 10;\n  int y = ++x;\n  int z = y++;\n  Serial.print("a: "); Serial.println(a);\n  Serial.print("x: "); Serial.println(x);\n  Serial.print("y: "); Serial.println(y);\n  Serial.print("z: "); Serial.println(z);\n  int result = --x * (y++);\n  Serial.print("Final result: "); Serial.println(result);\n}` },
    { name: "test30.ino", content: `// Complex for loop with multiple expressions\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int i = 0;\n  int j = 10;\n\n  for (i = 0, j = 10; i < j; i++, j--) {\n    Serial.print("i: ");\n    Serial.print(i);\n    Serial.print(", j: ");\n    Serial.print(j);\n    Serial.println(j);\n  }\n}` },
    { name: "test31.ino", content: `// do-while loop with a complex condition\nbool checkCondition(int val) {\n  return val % 2 == 0;\n}\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int count = 0;\n  int val = 10;\n\n  do {\n    count++;\n    val--;\n    Serial.print("Count: ");\n    Serial.println(count);\n  } while (count < 5 && checkCondition(val) == false);\n}` },
    { name: "test32.ino", content: `// Structs and Member Access\nstruct Point {\n  int x;\n  int y;\n};\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  struct Point p1;\n  p1.x = 10;\n  p1.y = 20;\n\n  Serial.print("Point x: ");\n  Serial.println(p1.x);\n  Serial.print("Point y: ");\n  Serial.println(p1.y);\n}` },
    { name: "test33.ino", content: `// Unary Plus and Minus with Operator Precedence\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int a = 5;\n  int b = -10;\n\n  int result1 = a + -b;\n  int result2 = -a * b;\n  int result3 = 10 - +a;\n\n  Serial.print("Result 1: "); Serial.println(result1);\n  Serial.print("Result 2: "); Serial.println(result2);\n  Serial.print("Result 3: "); Serial.println(result3);\n}` },
    { name: "test34.ino", content: `// Empty and NULL statements\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int i = 0;\n  while (i < 5) {\n    i++;\n  } ;\n\n  for (int j = 0; j < 5; j++);\n\n  if (1 == 1) {}\n\n  Serial.println("Execution finished.");\n}` },
    { name: "test35.ino", content: `// Pointers and Pointer Arithmetic\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int arr[3] = {10, 20, 30};\n  int *ptr = arr;\n\n  Serial.print("First element: ");\n  Serial.println(*ptr);\n\n  ptr++;\n  Serial.print("Next element: ");\n  Serial.println(*ptr);\n\n  int nextVal = *(ptr + 1);\n  Serial.print("Next value with arithmetic: ");\n  Serial.println(nextVal);\n}` },
    { name: "test36.ino", content: `// Initializer Lists and Designated Initializers\nstruct Point {\n  int x;\n  int y;\n};\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int numbers[] = {1, 2, 3};\n  struct Point p = {.x = 10, .y = 20};\n\n  Serial.print("Numbers[1]: ");\n  Serial.println(numbers[1]);\n\n  Serial.print("Point x: ");\n  Serial.println(p.x);\n\n  Serial.print("Point y: ");\n  Serial.println(p.y);\n}` },
    { name: "test37.ino", content: `// Type Promotion and Implicit Conversions\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  char c = 'A';\n  int i = 5;\n  float f = 2.5;\n\n  int result1 = c + i;\n  float result2 = i * f;\n\n  Serial.print("Result 1: ");\n  Serial.println(result1);\n\n  Serial.print("Result 2: ");\n  Serial.println(result2);\n}` },
    { name: "test38.ino", content: `// typedef and Structs with Pointers\ntypedef struct {\n  int x;\n  int y;\n} MyPoint;\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  MyPoint p1;\n  MyPoint *p2;\n\n  p1.x = 10;\n  p1.y = 20;\n\n  p2 = &p1;\n\n  Serial.print("Value of x using pointer: ");\n  Serial.println(p2->x);\n\n  p2->y = 30;\n  Serial.print("Modified value of y: ");\n  Serial.println(p1.y);\n}` },
    { name: "test39.ino", content: `// static Variables and Scope\nvoid counter() {\n  static int count = 0;\n  count++;\n  Serial.print("Count is: ");\n  Serial.println(count);\n}\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  counter();\n  delay(1000);\n}` },
    { name: "test40.ino", content: `// const and volatile Qualifiers\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  const int myConst = 100;\n  volatile int myVolatile = 50;\n\n  Serial.print("My constant: ");\n  Serial.println(myConst);\n\n  Serial.print("My volatile: ");\n  Serial.println(myVolatile);\n}` },
    { name: "test41.ino", content: `// Logical Operators with Short-Circuiting\nint myFunc() {\n  Serial.println("myFunc() was called.");\n  return 1;\n}\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int x = 0;\n  int y = 5;\n\n  if (x == 0 || myFunc()) {\n    Serial.println("Condition 1 is true.");\n  }\n\n  if (x == 1 && myFunc()) {\n    Serial.println("Condition 2 is true.");\n  }\n}` },
    { name: "test42.ino", content: `// Conditional Operator in a Loop\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int x = 0;\n  for (int i = 0; i < 5; i++) {\n    x = (i == 0) ? 1 : ((i % 2 == 0) ? i + 10 : i * 10);\n    Serial.print("For i=");\n    Serial.print(i);\n    Serial.print(", x is: ");\n    Serial.println(x);\n  }\n}` },
    { name: "test43.ino", content: `// Variable Declarations in a for Loop\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  for (int i = 0; i < 3; i++) {\n    Serial.print("i: ");\n    Serial.println(i);\n  }\n}` },
    { name: "test44.ino", content: `// Unary sizeof Operator\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int a = 10;\n  char b = 'B';\n  float c = 3.14;\n\n  Serial.print("Size of int: ");\n  Serial.println(sizeof(a));\n\n  Serial.print("Size of char: ");\n  Serial.println(sizeof(char));\n\n  Serial.print("Size of float: ");\n  Serial.println(sizeof(c));\n}` },
    { name: "test45.ino", content: `// Comma Operator in a for Loop\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int a = 0, b = 10;\n  for (int i = 0; i < 3; i++) {\n    Serial.print("Initial a: ");\n    Serial.println(a);\n    a = (a++, b++);\n    Serial.print("Final a: ");\n    Serial.println(a);\n  }\n}` },
    { name: "test46.ino", content: `// Nested for and if with break and continue\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  for (int i = 0; i < 5; i++) {\n    for (int j = 0; j < 5; j++) {\n      if (i == 2 && j == 2) {\n        Serial.println("Skipping inner loop...");\n        continue;\n      }\n      if (i == 3) {\n        Serial.println("Breaking outer loop...");\n        break;\n      }\n      Serial.print("i: ");\n      Serial.print(i);\n      Serial.print(", j: ");\n      Serial.print(j);\n      Serial.println(j);\n    }\n    if (i == 3) {\n      break;\n    }\n  }\n}` },
    { name: "test47.ino", content: `// Pointer to Pointer\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int x = 100;\n  int *p1 = &x;\n  int **p2 = &p1;\n\n  Serial.print("Value of x: ");\n  Serial.println(x);\n\n  Serial.print("Value of *p1: ");\n  Serial.println(*p1);\n\n  Serial.print("Value of **p2: ");\n  Serial.println(**p2);\n\n  **p2 = 200;\n  Serial.print("New value of x: ");\n  Serial.println(x);\n}` },
    { name: "test48.ino", content: `// Self-Referential Structs (Linked List Node)\nstruct Node {\n  int data;\n  struct Node* next;\n};\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  struct Node n1, n2;\n  n1.data = 10;\n  n1.next = &n2;\n\n  n2.data = 20;\n  n2.next = NULL;\n\n  Serial.print("Data from n1: ");\n  Serial.println(n1.data);\n  Serial.print("Data from n2 via n1: ");\n  Serial.println(n1.next->data);\n}` },
    { name: "test49.ino", content: `// static Global Variable and Function\nstatic int global_counter = 0;\n\nstatic void incrementCounter() {\n  global_counter++;\n}\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  incrementCounter();\n  Serial.print("Counter: ");\n  Serial.println(global_counter);\n  delay(1000);\n}` },
    { name: "test50.ino", content: `// Unsigned Integer Rollover\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  unsigned int i = 4294967295;\n  Serial.print("Initial value: ");\n  Serial.println(i);\n  i++;\n  Serial.print("After increment (rollover): ");\n  Serial.println(i);\n  i = 0;\n  i--;\n  Serial.print("After decrement (rollover): ");\n  Serial.println(i);\n}` },
    { name: "test51.ino", content: `// Complex Function Declarations\nint applyOperation(int (*op)(int, int), int a, int b) {\n  return op(a, b);\n}\n\nint add(int x, int y) {\n  return x + y;\n}\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int result = applyOperation(add, 5, 10);\n  Serial.print("Result of applyOperation: ");\n  Serial.println(result);\n}` },
    { name: "test52.ino", content: `// Bit-Fields in Structs\nstruct MyFlags {\n  unsigned int a : 1;\n  unsigned int b : 1;\n  unsigned int c : 6;\n};\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  struct MyFlags flags;\n  flags.a = 1;\n  flags.b = 0;\n  flags.c = 50;\n\n  Serial.print("Flag a: ");\n  Serial.println(flags.a);\n  Serial.print("Flag c: ");\n  Serial.println(flags.c);\n}` },
    { name: "test53.ino", content: `// extern Keyword\nextern int externalVariable;\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  externalVariable = 10;\n  Serial.print("External variable value: ");\n  Serial.println(externalVariable);\n}\n\nint externalVariable = 5;` },
    { name: "test54.ino", content: `// Ternary Operator with Complex Expressions\nint getBigger(int x, int y) {\n  return (x > y) ? x : y;\n}\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int a = 10, b = 20, c = 30;\n\n  int result = (a < b) ? getBigger(a, c) : (a + b);\n\n  Serial.print("Final result: ");\n  Serial.println(result);\n}` }
];

// =============================================================================  
// ARDUINO EXAMPLES (from examples.js) - 79 tests
// =============================================================================

// Load Arduino examples from external file - full 79 examples
let arduinoExamples = [];

// Try to load from examples.js if available (browser/Node.js compatibility)
if (typeof window !== 'undefined' && window.testFiles) {
    arduinoExamples = window.testFiles;
} else if (typeof require !== 'undefined') {
    try {
        const examplesModule = require('./examples.js');
        arduinoExamples = examplesModule.testFiles || examplesModule;
    } catch (e) {
        console.warn('Could not load examples.js, using fallback examples');
        // Fallback examples
        arduinoExamples = [
            { "name": "Blink.ino", "content": "void setup() { pinMode(LED_BUILTIN, OUTPUT); }\nvoid loop() { digitalWrite(LED_BUILTIN, HIGH); delay(1000); digitalWrite(LED_BUILTIN, LOW); delay(1000); }" },
            { "name": "Fade.ino", "content": "int led = 9; int brightness = 0; int fadeAmount = 5;\nvoid setup() { pinMode(led, OUTPUT); }\nvoid loop() { analogWrite(led, brightness); brightness = brightness + fadeAmount; if (brightness <= 0 || brightness >= 255) { fadeAmount = -fadeAmount; } delay(30); }" }
        ];
    }
}

// =============================================================================
// NEOPIXEL EXAMPLES (from neopixel.js) - 2 tests
// =============================================================================

const neopixelExamples = [
	{ "name": "strandtest.ino", "content": "#include <Adafruit_NeoPixel.h>\n#ifdef __AVR__\n #include <avr/power.h> // Required for 16 MHz Adafruit Trinket\n#endif\n\n// Which pin on the Arduino is connected to the NeoPixels?\n// On a Trinket or Gemma we suggest changing this to 1:\n#define LED_PIN    6\n\n// How many NeoPixels are attached to the Arduino?\n#define LED_COUNT 60\n\n// Declare our NeoPixel strip object:\nAdafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);\n// Argument 1 = Number of pixels in NeoPixel strip\n// Argument 2 = Arduino pin number (most are valid)\n// Argument 3 = Pixel type flags, add together as needed:\n//   NEO_KHZ800  800 KHz bitstream (most NeoPixel products w/WS2812 LEDs)\n//   NEO_KHZ400  400 KHz (classic 'v1' (not v2) FLORA pixels, WS2811 drivers)\n//   NEO_GRB     Pixels are wired for GRB bitstream (most NeoPixel products)\n//   NEO_RGB     Pixels are wired for RGB bitstream (v1 FLORA pixels, not v2)\n//   NEO_RGBW    Pixels are wired for RGBW bitstream (NeoPixel RGBW products)\n\n\n// setup() function -- runs once at startup --------------------------------\n\nvoid setup() {\n  // These lines are specifically to support the Adafruit Trinket 5V 16 MHz.\n  // Any other board, you can remove this part (but no harm leaving it):\n#if defined(__AVR_ATtiny85__) && (F_CPU == 16000000)\n  clock_prescale_set(clock_div_1);\n#endif\n  // END of Trinket-specific code.\n\n  strip.begin();           // INITIALIZE NeoPixel strip object (REQUIRED)\n  strip.show();            // Turn OFF all pixels ASAP\n  strip.setBrightness(50); // Set BRIGHTNESS to about 1/5 (max = 255)\n}\n\n\n// loop() function -- runs repeatedly as long as board is on ---------------\n\nvoid loop() {\n  // Fill along the length of the strip in various colors...\n  colorWipe(strip.Color(255,   0,   0), 50); // Red\n  colorWipe(strip.Color(  0, 255,   0), 50); // Green\n  colorWipe(strip.Color(  0,   0, 255), 50); // Blue\n\n  // Do a theater marquee effect in various colors...\n  theaterChase(strip.Color(127, 127, 127), 50); // White, half brightness\n  theaterChase(strip.Color(127,   0,   0), 50); // Red, half brightness\n  theaterChase(strip.Color(  0,   0, 127), 50); // Blue, half brightness\n\n  rainbow(10);             // Flowing rainbow cycle along the whole strip\n  theaterChaseRainbow(50); // Rainbow-enhanced theaterChase variant\n}\n\n\n// Some functions of our own for creating animated effects -----------------\n\n// Fill strip pixels one after another with a color. Strip is NOT cleared\n// first; anything there will be covered pixel by pixel. Pass in color\n// (as a single 'packed' 32-bit value, which you can get by calling\n// strip.Color(red, green, blue) as shown in the loop() function above),\n// and a delay time (in milliseconds) between pixels.\nvoid colorWipe(uint32_t color, int wait) {\n  for(int i=0; i<strip.numPixels(); i++) { // For each pixel in strip...\n    strip.setPixelColor(i, color);         //  Set pixel's color (in RAM)\n    strip.show();                          //  Update strip to match\n    delay(wait);                           //  Pause for a moment\n  }\n}\n\n// Theater-marquee-style chasing lights. Pass in a color (32-bit value,\n// a la strip.Color(r,g,b) as mentioned above), and a delay time (in ms)\n// between frames.\nvoid theaterChase(uint32_t color, int wait) {\n  for(int a=0; a<10; a++) {  // Repeat 10 times...\n    for(int b=0; b<3; b++) { //  'b' counts from 0 to 2...\n      strip.clear();         //   Set all pixels in RAM to 0 (off)\n      // 'c' counts up from 'b' to end of strip in steps of 3...\n      for(int c=b; c<strip.numPixels(); c += 3) {\n        strip.setPixelColor(c, color); // Set pixel 'c' to value 'color'\n      }\n      strip.show(); // Update strip with new contents\n      delay(wait);  // Pause for a moment\n    }\n  }\n}\n\n// Rainbow cycle along whole strip. Pass delay time (in ms) between frames.\nvoid rainbow(int wait) {\n  // Hue of first pixel runs 5 complete loops through the color wheel.\n  // Color wheel has a range of 65536 but it's OK if we roll over, so\n  // just count from 0 to 5*65536. Adding 256 to firstPixelHue each time\n  // means we'll make 5*65536/256 = 1280 passes through this loop:\n  for(long firstPixelHue = 0; firstPixelHue < 5*65536; firstPixelHue += 256) {\n    // strip.rainbow() can take a single argument (first pixel hue) or\n    // optionally a few extras: number of rainbow repetitions (default 1),\n    // saturation and value (brightness) (both 0-255, similar to the\n    // ColorHSV() function, default 255), and a true/false flag for whether\n    // to apply gamma correction to provide 'truer' colors (default true).\n    strip.rainbow(firstPixelHue);\n    // Above line is equivalent to:\n    // strip.rainbow(firstPixelHue, 1, 255, 255, true);\n    strip.show(); // Update strip with new contents\n    delay(wait);  // Pause for a moment\n  }\n}\n\n// Rainbow-enhanced theater marquee. Pass delay time (in ms) between frames.\nvoid theaterChaseRainbow(int wait) {\n  int firstPixelHue = 0;     // First pixel starts at red (hue 0)\n  for(int a=0; a<30; a++) {  // Repeat 30 times...\n    for(int b=0; b<3; b++) { //  'b' counts from 0 to 2...\n      strip.clear();         //   Set all pixels in RAM to 0 (off)\n      // 'c' counts up from 'b' to end of strip in increments of 3...\n      for(int c=b; c<strip.numPixels(); c += 3) {\n        // hue of pixel 'c' is offset by an amount to make one full\n        // revolution of the color wheel (range 65536) along the length\n        // of the strip (strip.numPixels() steps):\n        int      hue   = firstPixelHue + c * 65536L / strip.numPixels();\n        uint32_t color = strip.gamma32(strip.ColorHSV(hue)); // hue -> RGB\n        strip.setPixelColor(c, color); // Set pixel 'c' to value 'color'\n      }\n      strip.show();                // Update strip with new contents\n      delay(wait);                 // Pause for a moment\n      firstPixelHue += 65536 / 90; // One cycle of color wheel over 90 frames\n    }\n  }\n}\n"},
	{ "name": "strandtest_nodelay.ino", "content": "#include <Adafruit_NeoPixel.h>\n#ifdef __AVR__\n #include <avr/power.h> // Required for 16 MHz Adafruit Trinket\n#endif\n\n// Which pin on the Arduino is connected to the NeoPixels?\n// On a Trinket or Gemma we suggest changing this to 1:\n#ifdef ESP32\n// Cannot use 6 as output for ESP. Pins 6-11 are connected to SPI flash. Use 16 instead.\n#define LED_PIN    16\n#else\n#define LED_PIN    6\n#endif\n\n// How many NeoPixels are attached to the Arduino?\n#define LED_COUNT 60\n\n// Declare our NeoPixel strip object:\nAdafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);\n// Argument 1 = Number of pixels in NeoPixel strip\n// Argument 2 = Arduino pin number (most are valid)\n// Argument 3 = Pixel type flags, add together as needed:\n//   NEO_KHZ800  800 KHz bitstream (most NeoPixel products w/WS2812 LEDs)\n//   NEO_KHZ400  400 KHz (classic 'v1' (not v2) FLORA pixels, WS2811 drivers)\n//   NEO_GRB     Pixels are wired for GRB bitstream (most NeoPixel products)\n//   NEO_RGB     Pixels are wired for RGB bitstream (v1 FLORA pixels, not v2)\n//   NEO_RGBW    Pixels are wired for RGBW bitstream (NeoPixel RGBW products)\n\nunsigned long pixelPrevious = 0;       // Previous Pixel Millis\nunsigned long patternPrevious = 0;     // Previous Pattern Millis\nint           patternCurrent = 0;      // Current Pattern Number\nint           patternInterval = 5000;  // Pattern Interval (ms)\nbool          patternComplete = false;\n\nint           pixelInterval = 50;      // Pixel Interval (ms)\nint           pixelQueue = 0;          // Pattern Pixel Queue\nint           pixelCycle = 0;          // Pattern Pixel Cycle\nuint16_t      pixelNumber = LED_COUNT; // Total Number of Pixels\n\n// setup() function -- runs once at startup --------------------------------\nvoid setup() {\n  // These lines are specifically to support the Adafruit Trinket 5V 16 MHz.\n  // Any other board, you can remove this part (but no harm leaving it):\n#if defined(__AVR_ATtiny85__) && (F_CPU == 16000000)\n  clock_prescale_set(clock_div_1);\n#endif\n  // END of Trinket-specific code.\n\n  strip.begin();           // INITIALIZE NeoPixel strip object (REQUIRED)\n  strip.show();            // Turn OFF all pixels ASAP\n  strip.setBrightness(50); // Set BRIGHTNESS to about 1/5 (max = 255)\n}\n\n// loop() function -- runs repeatedly as long as board is on ---------------\nvoid loop() {\n  unsigned long currentMillis = millis();                     //  Update current time\n  if( patternComplete || (currentMillis - patternPrevious) >= patternInterval) {  //  Check for expired time\n    patternComplete = false;\n    patternPrevious = currentMillis;\n    patternCurrent++;                                         //  Advance to next pattern\n    if(patternCurrent >= 7)\n      patternCurrent = 0;\n  }\n\n  if(currentMillis - pixelPrevious >= pixelInterval) {      //  Check for expired time\n    pixelPrevious = currentMillis;                            //  Run current frame\n    switch (patternCurrent) {\n      case 7:\n        theaterChaseRainbow(50); // Rainbow-enhanced theaterChase variant\n        break;\n      case 6:\n        rainbow(10); // Flowing rainbow cycle along the whole strip\n        break;      \n      case 5:\n        theaterChase(strip.Color(0, 0, 127), 50); // Blue\n        break;\n      case 4:\n        theaterChase(strip.Color(127, 0, 0), 50); // Red\n        break;\n      case 3:\n        theaterChase(strip.Color(127, 127, 127), 50); // White\n        break;\n      case 2:\n        colorWipe(strip.Color(0, 0, 255), 50); // Blue\n        break;\n      case 1:\n        colorWipe(strip.Color(0, 255, 0), 50); // Green\n        break;        \n      default:\n        colorWipe(strip.Color(255, 0, 0), 50); // Red\n        break;\n    }\n  }\n}\n\n// Some functions of our own for creating animated effects -----------------\n\n// Fill strip pixels one after another with a color. Strip is NOT cleared\n// first; anything there will be covered pixel by pixel. Pass in color\n// (as a single 'packed' 32-bit value, which you can get by calling\n// strip.Color(red, green, blue) as shown in the loop() function above),\n// and a delay time (in milliseconds) between pixels.\nvoid colorWipe(uint32_t color, int wait) {\n  static uint16_t current_pixel = 0;\n  pixelInterval = wait;                      //  Update delay time\n  strip.setPixelColor(current_pixel++, color); //  Set pixel's color (in RAM)\n  strip.show();                              //  Update strip to match\n  if(current_pixel >= pixelNumber) {         //  Loop the pattern from the first LED\n    current_pixel = 0;\n    patternComplete = true;\n  }\n}\n\n// Theater-marquee-style chasing lights. Pass in a color (32-bit value,\n// a la strip.Color(r,g,b) as mentioned above), and a delay time (in ms)\n// between frames.\nvoid theaterChase(uint32_t color, int wait) {\n  static uint32_t loop_count = 0;\n  static uint16_t current_pixel = 0;\n\n  pixelInterval = wait;                      //  Update delay time\n\n  strip.clear();\n\n  for(int c=current_pixel; c < pixelNumber; c += 3) {\n    strip.setPixelColor(c, color);\n  }\n  strip.show();\n\n  current_pixel++;\n  if (current_pixel >= 3) {\n    current_pixel = 0;\n    loop_count++;\n  }\n\n  if (loop_count >= 10) {\n    current_pixel = 0;\n    loop_count = 0;\n    patternComplete = true;\n  }\n}\n\n// Rainbow cycle along whole strip. Pass delay time (in ms) between frames.\nvoid rainbow(uint8_t wait) {\n  if(pixelInterval != wait)\n    pixelInterval = wait;                \n  for(uint16_t i=0; i < pixelNumber; i++) {\n    strip.setPixelColor(i, Wheel((i + pixelCycle) & 255)); //  Update delay time  \n  }\n  strip.show();                              //  Update strip to match\n  pixelCycle++;                              //  Advance current cycle\n  if(pixelCycle >= 256)\n    pixelCycle = 0;                          //  Loop the cycle back to the begining\n}\n\n//Theatre-style crawling lights with rainbow effect\nvoid theaterChaseRainbow(uint8_t wait) {\n  if(pixelInterval != wait)\n    pixelInterval = wait;                      //  Update delay time  \n  for(int i=0; i < pixelNumber; i+=3) {\n    strip.setPixelColor(i + pixelQueue, Wheel((i + pixelCycle) % 255)); //  Update delay time  \n  }\n  strip.show();\n  for(int i=0; i < pixelNumber; i+=3) {\n    strip.setPixelColor(i + pixelQueue, strip.Color(0, 0, 0)); //  Update delay time  \n  }      \n  pixelQueue++;                              //  Advance current queue  \n  pixelCycle++;                              //  Advance current cycle\n  if(pixelQueue >= 3)\n    pixelQueue = 0;                          //  Loop\n  if(pixelCycle >= 256)\n    pixelCycle = 0;                          //  Loop\n}\n\n// Input a value 0 to 255 to get a color value.\n// The colours are a transition r - g - b - back to r.\nuint32_t Wheel(byte WheelPos) {\n  WheelPos = 255 - WheelPos;\n  if(WheelPos < 85) {\n    return strip.Color(255 - WheelPos * 3, 0, WheelPos * 3);\n  }\n  if(WheelPos < 170) {\n    WheelPos -= 85;\n    return strip.Color(0, WheelPos * 3, 255 - WheelPos * 3);\n  }\n  WheelPos -= 170;\n  return strip.Color(WheelPos * 3, 255 - WheelPos * 3, 0);\n}\n"}
];

// =============================================================================
// UNIFIED COMPREHENSIVE TEST COLLECTION
// =============================================================================

const comprehensiveTestCollection = {
    "Parser Unit Tests": {
        tests: parserUnitTests,
        count: parserUnitTests.length,
        description: "Unit tests for parser functionality including lexer and AST generation"
    },
    "Comprehensive Tests": {
        tests: comprehensiveTests,
        count: comprehensiveTests.length,
        description: "Complete Arduino sketches testing advanced language features"
    },
    "Arduino Examples": {
        tests: arduinoExamples, // Note: This is abbreviated - full list loaded from examples.js
        count: 79, // Full count from examples.js
        description: "Official Arduino IDE examples covering all Arduino features"
    },
    "NeoPixel Examples": {
        tests: neopixelExamples,
        count: neopixelExamples.length,
        description: "Advanced NeoPixel LED strip examples with complex patterns"
    }
};

// =============================================================================
// UNIVERSAL EXPORT FOR NODE.JS AND BROWSER COMPATIBILITY
// =============================================================================

if (typeof window !== 'undefined') {
    // Browser environment
    window.comprehensiveTestCollection = comprehensiveTestCollection;
    window.parserUnitTests = parserUnitTests;
    window.comprehensiveTests = comprehensiveTests;
    window.arduinoExamples = arduinoExamples;
    window.neopixelExamples = neopixelExamples;
    
    // Legacy compatibility
    window.testCases = parserUnitTests;
    window.testFiles = comprehensiveTests;
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        comprehensiveTestCollection,
        parserUnitTests,
        comprehensiveTests,
        arduinoExamples,
        neopixelExamples,
        
        // Legacy compatibility
        testCases: parserUnitTests,
        testFiles: comprehensiveTests
    };
}

// =============================================================================
// STATISTICS AND METADATA
// =============================================================================

const testStatistics = {
    totalTests: 162,
    categories: {
        "Parser Unit Tests": 27,
        "Comprehensive Tests": 54,
        "Arduino Examples": 79,
        "NeoPixel Examples": 2
    },
    version: "1.0.0",
    created: new Date().toISOString(),
    sources: [
        "test.js - Parser unit tests",
        "old_test.js - Comprehensive Arduino sketches", 
        "examples.js - Official Arduino IDE examples",
        "neopixel.js - Advanced NeoPixel examples"
    ]
};

if (typeof window !== 'undefined') {
    window.testStatistics = testStatistics;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports.testStatistics = testStatistics;
}