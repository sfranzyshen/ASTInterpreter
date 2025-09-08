#!/usr/bin/env node

/**
 * Debug script to replicate exact generator environment and find why
 * JavaScript interpreter produces different command formats
 */

const { ASTInterpreter } = require('./ASTInterpreter.js');
const { parse } = require('./ArduinoParser.js');

const code = `void setup() {
  // put your setup code here, to run once:
}

void loop() {
  // put your main code here, to run repeatedly:
}`;

console.log('=== REPLICATING EXACT GENERATOR ENVIRONMENT ===');

function suppressAllOutput() {
    const original = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        stdout: process.stdout.write,
        stderr: process.stderr.write
    };
    
    const noop = () => {};
    console.log = noop;
    console.error = noop;
    console.warn = noop;
    console.info = noop;
    process.stdout.write = () => true;
    process.stderr.write = () => true;
    
    return () => {
        console.log = original.log;
        console.error = original.error;
        console.warn = original.warn;
        console.info = original.info;
        process.stdout.write = original.stdout;
        process.stderr = original.stderr;
    };
}

function generateCommandsOptimized(ast) {
    return new Promise((resolve) => {
        try {
            const interpreter = new ASTInterpreter(ast, { 
                verbose: false,
                debug: false,
                stepDelay: 0,
                maxLoopIterations: 3
            });
            
            const commands = [];
            let done = false;
            
            interpreter.onCommand = (cmd) => {
                console.log('RAW COMMAND FROM INTERPRETER:', JSON.stringify(cmd, null, 2));
                // Capture command exactly as JavaScript interpreter produces it
                commands.push(cmd);
                if (cmd.type === 'PROGRAM_END' || cmd.type === 'ERROR' || cmd.type === 'LOOP_LIMIT_REACHED') {
                    done = true;
                }
            };
            
            interpreter.onError = (error) => {
                done = true;
            };
            
            interpreter.responseHandler = (req) => {
                setImmediate(() => {
                    interpreter.handleResponse(req.id, 512);
                });
            };
            
            // Complete output suppression - TEST IF THIS IS THE ISSUE!
            const restore = suppressAllOutput();
            
            interpreter.start();
            
            const timeout = setTimeout(() => { 
                done = true;
                restore();
            }, 300);
            
            const check = () => {
                if (done) {
                    clearTimeout(timeout);
                    restore();
                    resolve({ success: true, commands });
                } else {
                    setImmediate(check);
                }
            };
            check();
            
        } catch (error) {
            resolve({ success: false, commands: [], error: error.message });
        }
    });
}

async function main() {
    try {
        const ast = parse(code);
        const result = await generateCommandsOptimized(ast);
        
        console.log('\n=== GENERATOR ENVIRONMENT RESULTS ===');
        console.log('Success:', result.success);
        console.log('Command count:', result.commands.length);
        console.log('First command:');
        console.log(JSON.stringify(result.commands[0], null, 2));
        
        console.log('\n=== vs DIRECT EXECUTION ===');
        const directInterpreter = new ASTInterpreter(ast, { maxLoopIterations: 3, verbose: false, debug: false });
        let directCommands = [];
        directInterpreter.onCommand = (cmd) => { directCommands.push(cmd); };
        directInterpreter.start();
        
        setTimeout(() => {
            console.log('Direct first command:');
            console.log(JSON.stringify(directCommands[0], null, 2));
        }, 100);
        
    } catch (error) {
        console.error('ERROR:', error);
    }
}

main();