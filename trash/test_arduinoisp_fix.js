const { parse } = require('./parser.js');
const { examplesFiles } = require('./examples.js');

console.log('🔍 TESTING ARDUINOISP FIX');
console.log('=========================');

const arduinoISP = examplesFiles.find(ex => ex.name === 'ArduinoISP.ino');

console.log('🔧 Parsing ArduinoISP with enhanced preprocessor...');
try {
    const ast = parse(arduinoISP.content, { enablePreprocessor: true });
    
    console.log('✅ Parse successful');
    console.log('AST children:', ast.children ? ast.children.length : 'No children');
    
    if (ast.children) {
        let setupFound = false, loopFound = false;
        let funcCount = 0;
        
        console.log('\n📋 Functions found:');
        for (let i = 0; i < Math.min(ast.children.length, 30); i++) {
            const child = ast.children[i];
            if (child.type === 'FuncDefNode') {
                funcCount++;
                console.log(`  [${funcCount}] ${child.name}${child.parameters ? '(' + child.parameters.length + ' params)' : '()'}`);
                if (child.name === 'setup') setupFound = true;
                if (child.name === 'loop') loopFound = true;
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`Total AST nodes: ${ast.children.length}`);
        console.log(`Functions found: ${funcCount}`);
        console.log(`setup() found: ${setupFound ? '✅' : '❌'}`);
        console.log(`loop() found: ${loopFound ? '✅' : '❌'}`);
        
        if (setupFound && loopFound) {
            console.log('\n🎉 SUCCESS! ArduinoISP should now execute properly');
        } else {
            console.log('\n⚠️  Still missing setup() or loop() - may need more macro definitions');
        }
    }
    
} catch (error) {
    console.log(`❌ Parse error: ${error.message}`);
}