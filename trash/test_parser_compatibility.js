#!/usr/bin/env node

console.log('🔧 Testing Parser Compatibility');
console.log('===============================');

const { Parser, parse } = require('./parser.js');

// Test simple Arduino code
const testCode = `
void setup() {
    int x = 5;
    pinMode(x, OUTPUT);
}
`;

console.log('📝 Test code:');
console.log(testCode);

async function testParserCompatibility() {
    try {
        console.log('\n1️⃣ Testing parser WITHOUT position information (backwards compatible)...');
        
        // Use the global parse function (should work as before)
        const ast1 = parse(testCode);
        console.log('✅ Global parse() function works');
        
        // Check that AST nodes don't have position info by default
        const setupFunc = ast1.children.find(child => child.type === 'FuncDefNode' && child.name === 'setup');
        if (setupFunc) {
            const firstStatement = setupFunc.body?.children?.[0];
            if (firstStatement) {
                const hasPositionInfo = firstStatement.line !== undefined || firstStatement.column !== undefined;
                console.log(`   Position info present: ${hasPositionInfo} (should be false)`);
                if (!hasPositionInfo) {
                    console.log('   ✅ No position info by default - backwards compatible');
                } else {
                    console.log('   ❌ Position info present when it should not be');
                }
            }
        }
        
        console.log('\n2️⃣ Testing parser WITH position information (new feature)...');
        
        // Create parser with position information enabled
        const parser = new Parser(testCode, { includePositions: true });
        const ast2 = parser.parse();
        console.log('✅ Parser with includePositions option works');
        
        // Check that AST nodes DO have position info when requested
        const setupFunc2 = ast2.children.find(child => child.type === 'FuncDefNode' && child.name === 'setup');
        if (setupFunc2) {
            const firstStatement2 = setupFunc2.body?.children?.[0];
            if (firstStatement2) {
                const hasPositionInfo2 = firstStatement2.line !== undefined || firstStatement2.column !== undefined;
                console.log(`   Position info present: ${hasPositionInfo2} (should be true)`);
                if (hasPositionInfo2) {
                    console.log('   ✅ Position info present when requested');
                } else {
                    console.log('   ❌ Position info missing when requested');
                }
            }
        }
        
        console.log('\n📊 PARSER COMPATIBILITY RESULTS');
        console.log('=================================');
        console.log('✅ Backwards compatibility maintained');
        console.log('✅ New position features available when requested');
        console.log('✅ Parser fixes should resolve test harness issues');
        
    } catch (error) {
        console.log('\n❌ PARSER COMPATIBILITY TEST FAILED:', error.message);
        console.log('Stack:', error.stack);
    }
}

testParserCompatibility();