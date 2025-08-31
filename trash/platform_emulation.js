#!/usr/bin/env node

/**
 * Platform Emulation System
 * 
 * Provides Arduino platform-specific definitions, constants, and capabilities
 * with a switchable architecture for different Arduino platforms.
 * 
 * Default Platform: ESP32 Nano (Arduino Nano ESP32)
 * 
 * Version: 1.0.0
 */

const PLATFORM_EMULATION_VERSION = '1.0.0';

/**
 * ESP32 Nano Platform Definition
 * Based on Arduino Nano ESP32 specifications
 */
const ESP32_NANO_PLATFORM = {
    name: 'ESP32_NANO',
    displayName: 'Arduino Nano ESP32',
    
    // Platform-specific defines
    defines: {
        'ESP32': '1',
        'ARDUINO_NANO_ESP32': '1', 
        'ARDUINO': '2030100',  // Arduino IDE version format
        'ARDUINO_ESP32_NANO': '1',
        'ESP32_S3': '1',       // ESP32-S3 chip
        'NORA_W106': '1',      // u-blox NORA-W106 module
        
        // Hardware capabilities
        'WIFI_SUPPORT': '1',
        'BLUETOOTH_SUPPORT': '1',
        'BLE_SUPPORT': '1',
        'USB_C_SUPPORT': '1',
        
        // Memory specifications
        'FLASH_SIZE': '16777216',  // 16MB Flash
        'RAM_SIZE': '524288',      // 512KB RAM
        'PSRAM_SIZE': '8388608',   // 8MB PSRAM
        
        // Voltage levels
        'OPERATING_VOLTAGE': '3300',  // 3.3V in millivolts
        'MAX_PIN_CURRENT': '40',      // 40mA per pin
        'VIN_MIN': '5000',           // 5V minimum VIN
        'VIN_MAX': '18000',          // 18V maximum VIN
    },
    
    // Pin definitions (Arduino Nano form factor)
    pins: {
        // Digital pins (D0-D13)
        'D0': 0, 'D1': 1, 'D2': 2, 'D3': 3, 'D4': 4, 'D5': 5,
        'D6': 6, 'D7': 7, 'D8': 8, 'D9': 9, 'D10': 10, 'D11': 11, 'D12': 12, 'D13': 13,
        
        // Analog pins (A0-A7)  
        'A0': 14, 'A1': 15, 'A2': 16, 'A3': 17, 'A4': 18, 'A5': 19, 'A6': 20, 'A7': 21,
        
        // Special pins
        'LED_BUILTIN': 13,     // Built-in LED
        'LED_RED': 46,         // RGB LED - Red
        'LED_GREEN': 45,       // RGB LED - Green  
        'LED_BLUE': 44,        // RGB LED - Blue
        
        // Communication pins
        'SDA': 18,             // I2C Data (A4)
        'SCL': 19,             // I2C Clock (A5)
        'MOSI': 11,            // SPI Master Out Slave In
        'MISO': 12,            // SPI Master In Slave Out  
        'SCK': 13,             // SPI Clock
        'SS': 10,              // SPI Slave Select
        
        // Serial pins
        'TX': 1,               // Serial Transmit
        'RX': 0,               // Serial Receive
        
        // Power pins (not GPIO)
        'VIN': -1,             // External power input
        'VBUS': -2,            // USB power output
        'V3V3': -3,            // 3.3V output
        'GND': -4,             // Ground
    },
    
    // Pin capabilities
    pinCapabilities: {
        pwm: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21], // All GPIO pins support PWM
        analog: [14, 15, 16, 17, 18, 19, 20, 21], // A0-A7
        digital: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21], // All pins
        i2c: [18, 19],         // SDA, SCL
        spi: [10, 11, 12, 13], // SS, MOSI, MISO, SCK
        serial: [0, 1],        // RX, TX
    },
    
    // Available libraries
    libraries: [
        'WiFi', 'WiFiClient', 'WiFiServer', 'WiFiUDP',
        'BluetoothSerial', 'BLE',
        'Wire',  // I2C
        'SPI',
        'Servo',
        'Stepper',
        'EEPROM',
        'SD',
        'Adafruit_NeoPixel',
        'FastLED',
        'ArduinoJson',
        'PubSubClient', // MQTT
        'HTTPClient',
        'WebServer',
        'Update',    // OTA updates
        'Preferences', // Non-volatile storage
    ],
    
    // Clock speeds
    clocks: {
        'CPU_FREQ': '240000000',    // 240 MHz CPU
        'APB_FREQ': '80000000',     // 80 MHz APB
        'XTAL_FREQ': '40000000',    // 40 MHz Crystal
    },
    
    // Memory layout
    memory: {
        'FLASH_START': '0x10000',
        'RAM_START': '0x3FC88000',
        'PSRAM_START': '0x3F800000',
    }
};

/**
 * Arduino Uno Platform Definition (for comparison/future use)
 */
const ARDUINO_UNO_PLATFORM = {
    name: 'ARDUINO_UNO',
    displayName: 'Arduino Uno',
    
    defines: {
        'ARDUINO_AVR_UNO': '1',
        'ARDUINO': '2030100',
        'ATMEGA328P': '1',
    },
    
    pins: {
        'D0': 0, 'D1': 1, 'D2': 2, 'D3': 3, 'D4': 4, 'D5': 5,
        'D6': 6, 'D7': 7, 'D8': 8, 'D9': 9, 'D10': 10, 'D11': 11, 'D12': 12, 'D13': 13,
        'A0': 14, 'A1': 15, 'A2': 16, 'A3': 17, 'A4': 18, 'A5': 19,
        'LED_BUILTIN': 13,
        'SDA': 18, 'SCL': 19,
        'MOSI': 11, 'MISO': 12, 'SCK': 13, 'SS': 10,
        'TX': 1, 'RX': 0,
    },
    
    pinCapabilities: {
        pwm: [3, 5, 6, 9, 10, 11],  // Only specific pins support PWM
        analog: [14, 15, 16, 17, 18, 19], // A0-A5
        digital: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        i2c: [18, 19],
        spi: [10, 11, 12, 13],
        serial: [0, 1],
    },
    
    libraries: [
        'SoftwareSerial', 'Wire', 'SPI', 'Servo', 'Stepper', 'EEPROM',
        'LiquidCrystal', 'SD'
    ],
    
    clocks: {
        'CPU_FREQ': '16000000',  // 16 MHz
    }
};

/**
 * Platform Emulation System Class
 */
class PlatformEmulation {
    constructor(platformName = 'ESP32_NANO') {
        this.version = PLATFORM_EMULATION_VERSION;
        this.currentPlatform = null;
        this.availablePlatforms = {
            'ESP32_NANO': ESP32_NANO_PLATFORM,
            'ARDUINO_UNO': ARDUINO_UNO_PLATFORM
        };
        
        this.setPlatform(platformName);
        
        console.log(`🎯 Platform Emulation v${this.version} initialized`);
        console.log(`📱 Current Platform: ${this.currentPlatform.displayName}`);
    }
    
    /**
     * Switch to different platform
     */
    setPlatform(platformName) {
        if (!this.availablePlatforms[platformName]) {
            throw new Error(`Platform '${platformName}' not supported. Available: ${Object.keys(this.availablePlatforms).join(', ')}`);
        }
        
        this.currentPlatform = this.availablePlatforms[platformName];
        console.log(`🔄 Switched to platform: ${this.currentPlatform.displayName}`);
        return this.currentPlatform;
    }
    
    /**
     * Get all platform defines for preprocessor
     */
    getDefines() {
        return { ...this.currentPlatform.defines };
    }
    
    /**
     * Get pin number for pin name
     */
    getPin(pinName) {
        return this.currentPlatform.pins[pinName] || null;
    }
    
    /**
     * Check if pin supports capability
     */
    pinSupports(pin, capability) {
        const caps = this.currentPlatform.pinCapabilities[capability];
        return caps && caps.includes(pin);
    }
    
    /**
     * Get available libraries for platform
     */
    getLibraries() {
        return [...this.currentPlatform.libraries];
    }
    
    /**
     * Check if library is available
     */
    hasLibrary(libraryName) {
        return this.currentPlatform.libraries.includes(libraryName);
    }
    
    /**
     * Get platform summary
     */
    getPlatformInfo() {
        return {
            name: this.currentPlatform.name,
            displayName: this.currentPlatform.displayName,
            defines: Object.keys(this.currentPlatform.defines).length,
            pins: Object.keys(this.currentPlatform.pins).length,
            libraries: this.currentPlatform.libraries.length,
            capabilities: Object.keys(this.currentPlatform.pinCapabilities)
        };
    }
}

// Universal export for Node.js and browser compatibility
if (typeof window !== 'undefined') {
    // Browser environment
    window.PlatformEmulation = PlatformEmulation;
    window.ESP32_NANO_PLATFORM = ESP32_NANO_PLATFORM;
    window.ARDUINO_UNO_PLATFORM = ARDUINO_UNO_PLATFORM;
    window.PLATFORM_EMULATION_VERSION = PLATFORM_EMULATION_VERSION;
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        PlatformEmulation,
        ESP32_NANO_PLATFORM,
        ARDUINO_UNO_PLATFORM, 
        PLATFORM_EMULATION_VERSION
    };
}

// Allow direct execution for testing
if (require.main === module) {
    console.log('\n🧪 Platform Emulation Test');
    console.log('===========================');
    
    const platform = new PlatformEmulation('ESP32_NANO');
    
    console.log('\n📊 Platform Info:');
    console.log(platform.getPlatformInfo());
    
    console.log('\n📍 Pin Examples:');
    console.log(`LED_BUILTIN: ${platform.getPin('LED_BUILTIN')}`);
    console.log(`A0: ${platform.getPin('A0')}`);
    console.log(`SDA: ${platform.getPin('SDA')}`);
    
    console.log('\n🔧 Pin Capabilities:');
    console.log(`Pin 3 PWM support: ${platform.pinSupports(3, 'pwm')}`);
    console.log(`Pin 14 (A0) analog support: ${platform.pinSupports(14, 'analog')}`);
    
    console.log('\n📚 Library Support:');
    console.log(`WiFi available: ${platform.hasLibrary('WiFi')}`);
    console.log(`Bluetooth available: ${platform.hasLibrary('BluetoothSerial')}`);
    
    console.log('\n🔄 Platform Switching Test:');
    platform.setPlatform('ARDUINO_UNO');
    console.log(`WiFi available on Uno: ${platform.hasLibrary('WiFi')}`);
    console.log(`Pin 3 PWM support on Uno: ${platform.pinSupports(3, 'pwm')}`);
}