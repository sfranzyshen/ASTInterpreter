#!/usr/bin/env node

/**
 * Arduino Preprocessor
 * 
 * Handles C++ preprocessor directives for Arduino code:
 * - Macro substitution (#define)
 * - Library activation from includes (#include)
 * - Conditional compilation (#ifdef, #ifndef, #if)
 * - Function-like macro expansion
 * 
 * Version: 1.0.0
 * Part of Arduino Interpreter v6.0.0 architecture
 */

const PREPROCESSOR_VERSION = '1.2.0';

/**
 * Library Include Mapping
 * Maps include file names to library configuration
 */
const LIBRARY_INCLUDES = {
    'Adafruit_NeoPixel.h': {
        library: 'Adafruit_NeoPixel',
        constants: {
            'NEO_GRB': '0x52',
            'NEO_RGB': '0x20', 
            'NEO_RGBW': '0x28',
            'NEO_KHZ800': '0x0000',
            'NEO_KHZ400': '0x0100'
        },
        activate: true
    },
    'Servo.h': {
        library: 'Servo',
        constants: {},
        activate: true
    },
    'SPI.h': {
        library: 'SPI',
        constants: {
            'MSBFIRST': '1',
            'LSBFIRST': '0',
            'SPI_MODE0': '0',
            'SPI_MODE1': '1',
            'SPI_MODE2': '2',
            'SPI_MODE3': '3'
        },
        activate: true
    },
    'Wire.h': {
        library: 'Wire',
        constants: {},
        activate: true
    },
    'EEPROM.h': {
        library: 'EEPROM', 
        constants: {},
        activate: true
    },
    'avr/power.h': {
        constants: {
            'clock_div_1': '0x00',
            'clock_div_2': '0x01',
            'clock_div_4': '0x02',
            'clock_div_8': '0x03',
            'clock_div_16': '0x04',
            'clock_div_32': '0x05',
            'clock_div_64': '0x06',
            'clock_div_128': '0x07',
            'clock_div_256': '0x08'
        }
    },
    'Arduino.h': {
        constants: {
            'HIGH': '1',
            'LOW': '0',
            'INPUT': '0',
            'OUTPUT': '1', 
            'INPUT_PULLUP': '2',
            'LED_BUILTIN': '13'
        }
    }
};

/**
 * Arduino Preprocessor Class
 * Handles all preprocessor operations before code parsing
 */
class ArduinoPreprocessor {
    constructor(options = {}) {
        this.options = {
            verbose: options.verbose || false,
            debug: options.debug || false,
            platformDefines: options.platformDefines || ['ARDUINO', '__AVR__'],
            platformContext: options.platformContext || null, // Platform emulation instance
            ...options
        };
        
        // Macro storage
        this.macros = new Map();              // Simple macros: LED_COUNT -> "60"
        this.functionMacros = new Map();      // Function macros: AREA(r) -> {params: ['r'], body: '(PI * r * r)'}
        
        // Library management
        this.activeLibraries = new Set();     // ['Adafruit_NeoPixel', 'SPI']
        this.libraryConstants = new Map();    // NEO_GRB -> "0x52"
        
        // Conditional compilation stack
        this.conditionalStack = [];           // [{condition: 'ESP32', active: true, type: 'ifdef'}]
        
        // Initialize default Arduino macros
        this.initializeDefaultMacros();
        
        if (this.options.verbose) {
            console.log(`ArduinoPreprocessor v${PREPROCESSOR_VERSION} initialized`);
        }
    }
    
    /**
     * Initialize common Arduino macros and platform defines
     */
    initializeDefaultMacros() {
        // Arduino core constants
        this.macros.set('HIGH', '1');
        this.macros.set('LOW', '0');
        this.macros.set('INPUT', '0');
        this.macros.set('OUTPUT', '1');
        this.macros.set('INPUT_PULLUP', '2');
        this.macros.set('LED_BUILTIN', '13');
        this.macros.set('PI', '3.14159');
        
        // Initialize platform-specific defines
        if (this.options.platformContext) {
            // Use platform emulation for defines
            const platformDefines = this.options.platformContext.getDefines();
            Object.entries(platformDefines).forEach(([key, value]) => {
                this.macros.set(key, String(value));
            });
            
            if (this.options.verbose) {
                console.log(`🎯 Loaded ${Object.keys(platformDefines).length} platform defines from ${this.options.platformContext.currentPlatform.displayName}`);
            }
        } else {
            // Fallback to default Arduino platform macros
            this.macros.set('ARDUINO_ARCH_AVR', '1');
            this.macros.set('F_CPU', '16000000UL');  // 16MHz (standard Arduino Uno frequency)
            this.macros.set('ARDUINO_API_VERSION', '10001');
            this.macros.set('MOSI', '11');
            this.macros.set('MISO', '12');
            this.macros.set('SCK', '13');
            
            // Legacy platform defines
            this.options.platformDefines.forEach(define => {
                this.macros.set(define, '1');
            });
        }
        
        if (this.options.verbose) {
            console.log(`Initialized ${this.macros.size} default Arduino macros`);
        }
    }
    
    /**
     * Main preprocessing function
     * @param {string} sourceCode - Arduino source code
     * @returns {object} - {processedCode, activeLibraries, libraryConstants, macros}
     */
    preprocess(sourceCode) {
        if (this.options.debug) {
            console.log('Starting preprocessing...');
        }
        
        let processedCode = sourceCode;
        
        try {
            // Phase 1: Process include directives and activate libraries
            processedCode = this.processIncludes(processedCode);
            
            // Phase 2: Process #define directives
            processedCode = this.processDefines(processedCode);
            
            // Phase 3: Process conditional compilation directives
            processedCode = this.processConditionals(processedCode);
            
            // Phase 4: Perform macro substitution
            processedCode = this.performMacroSubstitution(processedCode);
            
            if (this.options.debug) {
                console.log(`Preprocessing complete. Active libraries: ${Array.from(this.activeLibraries).join(', ')}`);
                console.log(`Defined macros: ${this.macros.size} simple, ${this.functionMacros.size} function-like`);
            }
            
            return {
                processedCode,
                activeLibraries: Array.from(this.activeLibraries),
                libraryConstants: Object.fromEntries(this.libraryConstants),
                macros: Object.fromEntries(this.macros),
                functionMacros: Object.fromEntries(this.functionMacros)
            };
            
        } catch (error) {
            console.error('Preprocessing error:', error.message);
            return {
                processedCode: sourceCode, // Return original code if preprocessing fails
                activeLibraries: [],
                libraryConstants: {},
                macros: Object.fromEntries(this.macros),
                functionMacros: {},
                error: error.message
            };
        }
    }
    
    /**
     * Process #include directives and activate libraries
     */
    processIncludes(code) {
        const includeRegex = /#include\s*[<"]([^>"]+)[>"]/g;
        let processedCode = code;
        let match;
        
        // Reset regex for multiple matches
        includeRegex.lastIndex = 0;
        
        while ((match = includeRegex.exec(code)) !== null) {
            const includeFile = match[1];
            const fullInclude = match[0];
            
            if (LIBRARY_INCLUDES[includeFile]) {
                const config = LIBRARY_INCLUDES[includeFile];
                
                // Activate library if specified
                if (config.activate && config.library) {
                    this.activeLibraries.add(config.library);
                    if (this.options.verbose) {
                        console.log(`Activated library: ${config.library}`);
                    }
                }
                
                // Add library constants as macros
                Object.entries(config.constants || {}).forEach(([name, value]) => {
                    this.macros.set(name, value);
                    this.libraryConstants.set(name, value);
                });
                
                if (this.options.verbose && Object.keys(config.constants || {}).length > 0) {
                    console.log(`Added ${Object.keys(config.constants).length} constants from ${includeFile}`);
                }
            } else if (this.options.verbose) {
                console.log(`Unknown include file: ${includeFile} (ignoring)`);
            }
            
            // Remove the include directive entirely from processed code
            processedCode = processedCode.replace(fullInclude, '');
        }
        
        return processedCode;
    }
    
    /**
     * Process #define directives
     */
    processDefines(code) {
        const lines = code.split('\n');
        const processedLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            if (trimmed.startsWith('#define')) {
                this.processDefineDirective(trimmed);
                // Remove the #define line entirely for clean architecture
                // (skip adding to processedLines)
            } else if (trimmed.startsWith('#undef')) {
                this.processUndefDirective(trimmed);
                // Remove the #undef line entirely for clean architecture
                // (skip adding to processedLines)
            } else {
                processedLines.push(line);
            }
        }
        
        return processedLines.join('\n');
    }
    
    /**
     * Process a single #define directive
     */
    processDefineDirective(defineLine) {
        // Remove #define and trim
        const content = defineLine.substring(7).trim();
        
        // Check if it's a function-like macro: NAME(params) body
        const functionMacroMatch = content.match(/^([A-Z_][A-Z0-9_]*)\s*\(([^)]*)\)\s+(.+)$/i);
        
        if (functionMacroMatch) {
            // Function-like macro
            const name = functionMacroMatch[1];
            const paramsStr = functionMacroMatch[2].trim();
            const body = functionMacroMatch[3].trim();
            
            const params = paramsStr ? paramsStr.split(',').map(p => p.trim()) : [];
            
            this.functionMacros.set(name, {
                params: params,
                body: body
            });
            
            if (this.options.verbose) {
                console.log(`Defined function macro: ${name}(${params.join(', ')}) -> ${body}`);
            }
        } else {
            // Simple macro: NAME value
            const parts = content.match(/^([A-Z_][A-Z0-9_]*)\s+(.+)$/i);
            
            if (parts) {
                const name = parts[1];
                const value = parts[2].trim();
                
                this.macros.set(name, value);
                
                if (this.options.verbose) {
                    console.log(`Defined macro: ${name} -> ${value}`);
                }
            } else {
                // Simple flag macro: NAME (no value)
                const nameMatch = content.match(/^([A-Z_][A-Z0-9_]*)$/i);
                if (nameMatch) {
                    const name = nameMatch[1];
                    this.macros.set(name, '1');
                    
                    if (this.options.verbose) {
                        console.log(`Defined flag macro: ${name} -> 1`);
                    }
                }
            }
        }
    }
    
    /**
     * Process a single #undef directive
     */
    processUndefDirective(undefLine) {
        // Remove #undef and trim
        const macroName = undefLine.substring(6).trim();
        
        if (this.macros.has(macroName)) {
            this.macros.delete(macroName);
            
            if (this.options.verbose) {
                console.log(`Undefined macro: ${macroName}`);
            }
        } else if (this.options.verbose) {
            console.log(`Macro not defined, ignoring #undef: ${macroName}`);
        }
        
        // Also remove from function macros if it exists
        if (this.functionMacros.has(macroName)) {
            this.functionMacros.delete(macroName);
        }
    }
    
    /**
     * Process conditional compilation directives (basic implementation)
     */
    processConditionals(code) {
        // For now, just handle basic #ifdef/#ifndef by checking our defined macros
        // This is a simplified implementation - full conditional processing would be more complex
        
        const lines = code.split('\n');
        const processedLines = [];
        let skipLines = false;
        let conditionalDepth = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            if (trimmed.startsWith('#ifdef')) {
                const macro = trimmed.substring(6).trim();
                conditionalDepth++;
                
                if (this.macros.has(macro)) {
                    skipLines = false;
                    if (this.options.verbose) {
                        console.log(`#ifdef ${macro}: TRUE (including section)`);
                    }
                } else {
                    skipLines = true;
                    if (this.options.verbose) {
                        console.log(`#ifdef ${macro}: FALSE (skipping section)`);
                    }
                }
                
                // Remove conditional directive entirely
            } else if (trimmed.startsWith('#ifndef')) {
                const macro = trimmed.substring(7).trim();
                conditionalDepth++;
                
                if (!this.macros.has(macro)) {
                    skipLines = false;
                    if (this.options.verbose) {
                        console.log(`#ifndef ${macro}: TRUE (including section)`);
                    }
                } else {
                    skipLines = true;
                    if (this.options.verbose) {
                        console.log(`#ifndef ${macro}: FALSE (skipping section)`);
                    }
                }
                
                // Remove conditional directive entirely
            } else if (trimmed.startsWith('#endif')) {
                conditionalDepth--;
                if (conditionalDepth === 0) {
                    skipLines = false;
                }
                // Remove conditional directive entirely
            } else if (trimmed.startsWith('#else')) {
                skipLines = !skipLines;
                // Remove conditional directive entirely
            } else if (trimmed.startsWith('#if ')) {
                // Handle #if expressions (e.g., #if BLINK_DELAY > 500)
                const expression = trimmed.substring(3).trim();
                conditionalDepth++;
                
                try {
                    // Enhanced expression evaluation with defined() support
                    let evalExpression = expression;
                    
                    // First, handle defined() function calls
                    evalExpression = evalExpression.replace(/defined\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/g, (match, macroName) => {
                        const isDefined = this.macros.has(macroName) ? '1' : '0';
                        if (this.options.verbose) {
                            console.log(`   defined(${macroName}) → ${isDefined}`);
                        }
                        return isDefined;
                    });
                    
                    // Then replace macros with their values
                    for (const [macro, value] of this.macros) {
                        const regex = new RegExp(`\\b${macro}\\b`, 'g');
                        evalExpression = evalExpression.replace(regex, value);
                    }
                    
                    // Handle undefined macros by replacing them with 0
                    evalExpression = evalExpression.replace(/\b[A-Za-z_][A-Za-z0-9_]*\b/g, (match) => {
                        // Skip numbers, operators, and already processed values
                        if (/^[0-9]/.test(match) || ['&&', '||', '==', '!=', '>', '<', '>=', '<='].includes(match)) {
                            return match;
                        }
                        // Replace undefined macros with 0
                        return '0';
                    });
                    
                    if (this.options.verbose) {
                        console.log(`   Expression: ${expression} → ${evalExpression}`);
                    }
                    
                    // Evaluate the processed expression
                    const result = eval(evalExpression);
                    
                    if (result) {
                        skipLines = false;
                        if (this.options.verbose) {
                            console.log(`#if ${expression}: TRUE (including section)`);
                        }
                    } else {
                        skipLines = true;
                        if (this.options.verbose) {
                            console.log(`#if ${expression}: FALSE (skipping section)`);
                        }
                    }
                } catch (error) {
                    // If evaluation fails, assume true
                    skipLines = false;
                    if (this.options.verbose) {
                        console.log(`#if ${expression}: EVAL_ERROR (including section)`);
                    }
                }
                
                // Remove conditional directive entirely
            } else {
                // Regular line
                if (!skipLines) {
                    processedLines.push(line);
                }
                // Skip excluded lines entirely (don't even comment them out)
            }
        }
        
        return processedLines.join('\n');
    }
    
    /**
     * Perform macro substitution in the code
     */
    performMacroSubstitution(code) {
        let substitutedCode = code;
        
        // First, substitute simple macros
        for (const [macroName, macroValue] of this.macros) {
            // Use word boundaries to avoid partial matches
            const regex = new RegExp(`\\b${macroName}\\b`, 'g');
            substitutedCode = substitutedCode.replace(regex, macroValue);
        }
        
        // Then, substitute function-like macros
        for (const [macroName, macroInfo] of this.functionMacros) {
            const { params, body } = macroInfo;
            
            // Create regex to match function calls: MACRO_NAME(args)
            const regex = new RegExp(`\\b${macroName}\\s*\\(([^)]*)\\)`, 'g');
            
            substitutedCode = substitutedCode.replace(regex, (match, argsStr) => {
                const args = argsStr ? argsStr.split(',').map(arg => arg.trim()) : [];
                
                // Substitute parameters in the macro body
                let expandedBody = body;
                for (let i = 0; i < params.length && i < args.length; i++) {
                    const paramRegex = new RegExp(`\\b${params[i]}\\b`, 'g');
                    expandedBody = expandedBody.replace(paramRegex, args[i]);
                }
                
                if (this.options.verbose) {
                    console.log(`Expanded macro: ${match} -> ${expandedBody}`);
                }
                
                return expandedBody;
            });
        }
        
        return substitutedCode;
    }
    
    /**
     * Get preprocessing statistics
     */
    getStats() {
        return {
            version: PREPROCESSOR_VERSION,
            macros: this.macros.size,
            functionMacros: this.functionMacros.size,
            activeLibraries: this.activeLibraries.size,
            libraryConstants: this.libraryConstants.size
        };
    }
}

// Universal export for Node.js and browser compatibility
if (typeof window !== 'undefined') {
    // Browser environment
    window.ArduinoPreprocessor = ArduinoPreprocessor;
    window.LIBRARY_INCLUDES = LIBRARY_INCLUDES;
    window.PREPROCESSOR_VERSION = PREPROCESSOR_VERSION;
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        ArduinoPreprocessor,
        LIBRARY_INCLUDES,
        PREPROCESSOR_VERSION
    };
}