#!/usr/bin/env node

/**
 * Comprehensive AST Node Type Analysis
 * Compares JavaScript and C++ implementations to identify differences
 */

const fs = require('fs');
const path = require('path');

// Read and analyze JavaScript implementation
function extractJavaScriptNodeTypes() {
    const jsFile = '/mnt/d/Devel/ASTInterpreter/src/javascript/ASTInterpreter.js';
    const content = fs.readFileSync(jsFile, 'utf8');
    
    const nodeTypes = new Set();
    
    // Extract from case statements
    const caseRegex = /case\s+['"]([^'"]+)['"][\s]*:/g;
    let match;
    while ((match = caseRegex.exec(content)) !== null) {
        const nodeType = match[1];
        // Filter to get only Node types and key statement types
        if (nodeType.endsWith('Node') || 
            ['IfStatement', 'WhileStatement', 'DoWhileStatement', 'ForStatement', 
             'ReturnStatement', 'BreakStatement', 'ContinueStatement', 'SwitchStatement',
             'CaseStatement', 'EmptyStatement', 'RangeBasedForStatement', 'ExpressionStatement',
             'StructDeclaration', 'EnumDeclaration', 'UnionDeclaration', 'TypedefDeclaration',
             'ClassDeclaration', 'ConstructorDeclaration', 'MemberFunctionDeclaration',
             'TemplateDeclaration', 'PreprocessorDirective', 'StructType', 'EnumType',
             'EnumMember', 'UnionType', 'LambdaExpression', 'MultipleStructMembers',
             'StructMember', 'TemplateTypeParameter', 'CastExpression', 'TernaryExpression',
             'NewExpression', 'CommaExpression', 'RangeExpression', 'SizeofExpression'].includes(nodeType)) {
            nodeTypes.add(nodeType);
        }
    }
    
    // Also search for specific patterns that might be handled differently
    const switchRegex = /switch\s*\([^)]*node\.type[^)]*\)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
    while ((match = switchRegex.exec(content)) !== null) {
        const switchBody = match[1];
        const caseMatcher = /case\s+['"]([^'"]+)['"][\s]*:/g;
        let caseMatch;
        while ((caseMatch = caseMatcher.exec(switchBody)) !== null) {
            const nodeType = caseMatch[1];
            if (nodeType.endsWith('Node') || 
                ['IfStatement', 'WhileStatement', 'DoWhileStatement', 'ForStatement', 
                 'ReturnStatement', 'BreakStatement', 'ContinueStatement', 'SwitchStatement',
                 'CaseStatement', 'EmptyStatement', 'RangeBasedForStatement', 'ExpressionStatement',
                 'StructDeclaration', 'EnumDeclaration', 'UnionDeclaration', 'TypedefDeclaration',
                 'ClassDeclaration', 'ConstructorDeclaration', 'MemberFunctionDeclaration',
                 'TemplateDeclaration', 'PreprocessorDirective', 'StructType', 'EnumType',
                 'EnumMember', 'UnionType', 'LambdaExpression', 'MultipleStructMembers',
                 'StructMember', 'TemplateTypeParameter', 'CastExpression', 'TernaryExpression',
                 'NewExpression', 'CommaExpression', 'RangeExpression', 'SizeofExpression'].includes(nodeType)) {
                nodeTypes.add(nodeType);
            }
        }
    }
    
    return nodeTypes;
}

// Read and analyze C++ implementation
function extractCppNodeTypes() {
    const cppFile = '/mnt/d/Devel/ASTInterpreter/src/cpp/ASTNodes.hpp';
    const content = fs.readFileSync(cppFile, 'utf8');
    
    const nodeTypes = new Set();
    
    // Extract from enum ASTNodeType
    const enumRegex = /enum\s+class\s+ASTNodeType\s*:[^{]*\{([^}]+)\}/;
    const enumMatch = content.match(enumRegex);
    if (enumMatch) {
        const enumBody = enumMatch[1];
        const enumValueRegex = /(\w+)\s*=\s*0x[0-9A-Fa-f]+/g;
        let match;
        while ((match = enumValueRegex.exec(enumBody)) !== null) {
            nodeTypes.add(match[1]);
        }
    }
    
    // Extract from class definitions (class ClassName : public ASTNode)
    const classRegex = /class\s+(\w+)\s*:\s*public\s+ASTNode/g;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
        nodeTypes.add(match[1]);
    }
    
    // Extract from visitor pattern virtual void visit declarations
    const visitorRegex = /virtual\s+void\s+visit\(\s*(\w+)&\s+node\)/g;
    while ((match = visitorRegex.exec(content)) !== null) {
        nodeTypes.add(match[1]);
    }
    
    return { enumTypes: extractEnumTypes(content), classTypes: extractClassTypes(content), visitorTypes: extractVisitorTypes(content) };
}

function extractEnumTypes(content) {
    const nodeTypes = new Set();
    const enumRegex = /enum\s+class\s+ASTNodeType\s*:[^{]*\{([^}]+)\}/;
    const enumMatch = content.match(enumRegex);
    if (enumMatch) {
        const enumBody = enumMatch[1];
        const enumValueRegex = /(\w+)\s*=\s*0x[0-9A-Fa-f]+/g;
        let match;
        while ((match = enumValueRegex.exec(enumBody)) !== null) {
            nodeTypes.add(match[1]);
        }
    }
    return nodeTypes;
}

function extractClassTypes(content) {
    const nodeTypes = new Set();
    const classRegex = /class\s+(\w+)\s*:\s*public\s+ASTNode/g;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
        nodeTypes.add(match[1]);
    }
    return nodeTypes;
}

function extractVisitorTypes(content) {
    const nodeTypes = new Set();
    const visitorRegex = /virtual\s+void\s+visit\(\s*(\w+)&\s+node\)/g;
    let match;
    while ((match = visitorRegex.exec(content)) !== null) {
        nodeTypes.add(match[1]);
    }
    return nodeTypes;
}

// Map C++ enum names to equivalent JavaScript names
function mapCppToJsNames(cppTypes) {
    const mapping = {
        // Enum -> JavaScript naming
        'PROGRAM': 'ProgramNode',
        'ERROR_NODE': 'ErrorNode', 
        'COMMENT': 'CommentNode',
        'COMPOUND_STMT': 'CompoundStmtNode',
        'EXPRESSION_STMT': 'ExpressionStatement',
        'IF_STMT': 'IfStatement',
        'WHILE_STMT': 'WhileStatement', 
        'DO_WHILE_STMT': 'DoWhileStatement',
        'FOR_STMT': 'ForStatement',
        'RANGE_FOR_STMT': 'RangeBasedForStatement',
        'SWITCH_STMT': 'SwitchStatement',
        'CASE_STMT': 'CaseStatement',
        'RETURN_STMT': 'ReturnStatement',
        'BREAK_STMT': 'BreakStatement',
        'CONTINUE_STMT': 'ContinueStatement',
        'EMPTY_STMT': 'EmptyStatement',
        'VAR_DECL': 'VarDeclNode',
        'FUNC_DEF': 'FuncDefNode',
        'FUNC_DECL': 'FuncDeclNode',
        'STRUCT_DECL': 'StructDeclaration',
        'ENUM_DECL': 'EnumDeclaration',
        'CLASS_DECL': 'ClassDeclaration',
        'TYPEDEF_DECL': 'TypedefDeclaration',
        'TEMPLATE_DECL': 'TemplateDeclaration',
        'BINARY_OP': 'BinaryOpNode',
        'UNARY_OP': 'UnaryOpNode',
        'ASSIGNMENT': 'AssignmentNode',
        'FUNC_CALL': 'FuncCallNode',
        'MEMBER_ACCESS': 'MemberAccessNode',
        'ARRAY_ACCESS': 'ArrayAccessNode',
        'CAST_EXPR': 'CastExpression',
        'SIZEOF_EXPR': 'SizeofExpression',
        'TERNARY_EXPR': 'TernaryExpression',
        'NAMESPACE_ACCESS': 'NamespaceAccessNode',
        'CPP_CAST': 'CppCastNode',
        'FUNCTION_STYLE_CAST': 'FunctionStyleCastNode',
        'NUMBER_LITERAL': 'NumberNode',
        'STRING_LITERAL': 'StringLiteralNode',
        'CHAR_LITERAL': 'CharLiteralNode',
        'IDENTIFIER': 'IdentifierNode',
        'CONSTANT': 'ConstantNode',
        'ARRAY_INIT': 'ArrayInitializerNode',
        'WIDE_CHAR_LITERAL': 'WideCharLiteralNode',
        'DESIGNATED_INITIALIZER': 'DesignatedInitializerNode',
        'TYPE_NODE': 'TypeNode',
        'DECLARATOR_NODE': 'DeclaratorNode',
        'PARAM_NODE': 'ParamNode',
        'POSTFIX_EXPRESSION': 'PostfixExpressionNode',
        'STRUCT_TYPE': 'StructType',
        'FUNCTION_POINTER_DECLARATOR': 'FunctionPointerDeclaratorNode',
        'COMMA_EXPRESSION': 'CommaExpression',
        'ARRAY_DECLARATOR': 'ArrayDeclaratorNode',
        'POINTER_DECLARATOR': 'PointerDeclaratorNode',
        'CONSTRUCTOR_CALL': 'ConstructorCallNode',
        'UNKNOWN': 'Unknown'
    };
    
    const mapped = new Set();
    for (const cppType of cppTypes) {
        if (mapping[cppType]) {
            mapped.add(mapping[cppType]);
        } else {
            mapped.add(cppType); // Keep as-is if no mapping
        }
    }
    return mapped;
}

// Main analysis
function main() {
    console.log('='.repeat(80));
    console.log('COMPREHENSIVE AST NODE TYPE ANALYSIS');
    console.log('='.repeat(80));
    
    // Extract JavaScript node types
    const jsTypes = extractJavaScriptNodeTypes();
    console.log(`\nJavaScript Node Types (${jsTypes.size} total):`);
    console.log('-'.repeat(50));
    Array.from(jsTypes).sort().forEach(type => console.log(`  ${type}`));
    
    // Extract C++ node types
    const cppData = extractCppNodeTypes();
    const cppEnumTypes = cppData.enumTypes;
    const cppClassTypes = cppData.classTypes; 
    const cppVisitorTypes = cppData.visitorTypes;
    
    console.log(`\nC++ Enum Types (${cppEnumTypes.size} total):`);
    console.log('-'.repeat(50));
    Array.from(cppEnumTypes).sort().forEach(type => console.log(`  ${type}`));
    
    console.log(`\nC++ Class Types (${cppClassTypes.size} total):`);
    console.log('-'.repeat(50));
    Array.from(cppClassTypes).sort().forEach(type => console.log(`  ${type}`));
    
    console.log(`\nC++ Visitor Types (${cppVisitorTypes.size} total):`);
    console.log('-'.repeat(50));
    Array.from(cppVisitorTypes).sort().forEach(type => console.log(`  ${type}`));
    
    // Map C++ types to JS naming convention
    const mappedCppTypes = mapCppToJsNames(cppEnumTypes);
    console.log(`\nC++ Types Mapped to JS Convention (${mappedCppTypes.size} total):`);
    console.log('-'.repeat(50));
    Array.from(mappedCppTypes).sort().forEach(type => console.log(`  ${type}`));
    
    // Comparison analysis
    console.log('\n' + '='.repeat(80));
    console.log('COMPARISON ANALYSIS');
    console.log('='.repeat(80));
    
    const jsOnlyTypes = new Set([...jsTypes].filter(type => !mappedCppTypes.has(type)));
    const cppOnlyTypes = new Set([...mappedCppTypes].filter(type => !jsTypes.has(type)));
    const sharedTypes = new Set([...jsTypes].filter(type => mappedCppTypes.has(type)));
    
    console.log(`\nJavaScript-Only Node Types (${jsOnlyTypes.size} total):`);
    console.log('-'.repeat(50));
    if (jsOnlyTypes.size === 0) {
        console.log('  (none)');
    } else {
        Array.from(jsOnlyTypes).sort().forEach(type => console.log(`  ${type}`));
    }
    
    console.log(`\nC++-Only Node Types (${cppOnlyTypes.size} total):`);
    console.log('-'.repeat(50));
    if (cppOnlyTypes.size === 0) {
        console.log('  (none)');
    } else {
        Array.from(cppOnlyTypes).sort().forEach(type => console.log(`  ${type}`));
    }
    
    console.log(`\nShared Node Types (${sharedTypes.size} total):`);
    console.log('-'.repeat(50));
    Array.from(sharedTypes).sort().forEach(type => console.log(`  ${type}`));
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`JavaScript Implementation: ${jsTypes.size} node types`);
    console.log(`C++ Implementation: ${mappedCppTypes.size} node types`);
    console.log(`Shared Types: ${sharedTypes.size}`);
    console.log(`JavaScript-Only: ${jsOnlyTypes.size}`);
    console.log(`C++-Only: ${cppOnlyTypes.size}`);
    
    if (cppOnlyTypes.size > 0) {
        console.log('\n' + '='.repeat(80));
        console.log('RECOMMENDATIONS');
        console.log('='.repeat(80));
        console.log('The following C++ node types should be evaluated:');
        Array.from(cppOnlyTypes).sort().forEach(type => {
            console.log(`  - ${type}: Check if needed in JavaScript or remove from C++`);
        });
    }
    
    return {
        jsTypes: Array.from(jsTypes).sort(),
        cppTypes: Array.from(mappedCppTypes).sort(),
        jsOnly: Array.from(jsOnlyTypes).sort(),
        cppOnly: Array.from(cppOnlyTypes).sort(),
        shared: Array.from(sharedTypes).sort()
    };
}

// Run analysis
if (require.main === module) {
    const results = main();
    
    // Write detailed results to file
    const output = {
        timestamp: new Date().toISOString(),
        summary: {
            jsCount: results.jsTypes.length,
            cppCount: results.cppTypes.length,
            sharedCount: results.shared.length,
            jsOnlyCount: results.jsOnly.length,
            cppOnlyCount: results.cppOnly.length
        },
        details: results
    };
    
    fs.writeFileSync('/mnt/d/Devel/ASTInterpreter/ast_node_analysis.json', JSON.stringify(output, null, 2));
    console.log('\nDetailed analysis saved to: ast_node_analysis.json');
}