/**
 * Interpreter Playground Test Data v1.0
 * Additional curated examples for the comprehensive playground
 * Complements comprehensive_tests.js with playground-specific examples
 */

const playgroundExamples = {
    // Beginner Examples
    "basic-blink": {
        name: "Basic LED Blink",
        category: "Beginner",
        description: "Simple LED blinking - Arduino Hello World",
        code: `void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}`
    },

    "multiple-leds": {
        name: "Multiple LEDs",
        category: "Beginner", 
        description: "Control multiple LEDs in sequence",
        code: `void setup() {
  pinMode(2, OUTPUT);
  pinMode(3, OUTPUT);
  pinMode(4, OUTPUT);
  pinMode(5, OUTPUT);
}

void loop() {
  // Light LEDs in sequence
  for (int pin = 2; pin <= 5; pin++) {
    digitalWrite(pin, HIGH);
    delay(200);
    digitalWrite(pin, LOW);
  }
  
  // Reverse sequence
  for (int pin = 5; pin >= 2; pin--) {
    digitalWrite(pin, HIGH);
    delay(200);
    digitalWrite(pin, LOW);
  }
}`
    },

    "button-debounce": {
        name: "Button with Debounce",
        category: "Intermediate",
        description: "Proper button handling with software debouncing",
        code: `int buttonPin = 2;
int ledPin = 13;
int buttonState = 0;
int lastButtonState = 0;
unsigned long lastDebounceTime = 0;
unsigned long debounceDelay = 50;
bool ledState = false;

void setup() {
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, ledState);
}

void loop() {
  int reading = digitalRead(buttonPin);
  
  if (reading != lastButtonState) {
    lastDebounceTime = millis();
  }
  
  if ((millis() - lastDebounceTime) > debounceDelay) {
    if (reading != buttonState) {
      buttonState = reading;
      
      if (buttonState == LOW) {
        ledState = !ledState;
        digitalWrite(ledPin, ledState);
      }
    }
  }
  
  lastButtonState = reading;
}`
    },

    "pwm-breathing": {
        name: "PWM Breathing Effect", 
        category: "Intermediate",
        description: "Smooth LED breathing using PWM and sine wave",
        code: `int ledPin = 9;
float phase = 0;
float increment = 0.1;

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {
  float brightness = (sin(phase) + 1.0) * 127.5;
  analogWrite(ledPin, (int)brightness);
  
  phase += increment;
  if (phase >= 6.28318) {
    phase = 0;
  }
  
  delay(20);
}`
    },

    "state-machine": {
        name: "LED State Machine",
        category: "Advanced",
        description: "State machine pattern for LED control",
        code: `enum LedState {
  OFF,
  SLOW_BLINK,
  FAST_BLINK,
  FADE_IN_OUT
};

LedState currentState = OFF;
unsigned long previousMillis = 0;
int brightness = 0;
int fadeDirection = 1;
bool ledOn = false;

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(2, INPUT_PULLUP);
}

void loop() {
  // Check for state change button
  if (digitalRead(2) == LOW) {
    currentState = (LedState)((currentState + 1) % 4);
    delay(200); // Simple debounce
  }
  
  unsigned long currentMillis = millis();
  
  switch (currentState) {
    case OFF:
      digitalWrite(LED_BUILTIN, LOW);
      break;
      
    case SLOW_BLINK:
      if (currentMillis - previousMillis >= 1000) {
        ledOn = !ledOn;
        digitalWrite(LED_BUILTIN, ledOn);
        previousMillis = currentMillis;
      }
      break;
      
    case FAST_BLINK:
      if (currentMillis - previousMillis >= 200) {
        ledOn = !ledOn;
        digitalWrite(LED_BUILTIN, ledOn);
        previousMillis = currentMillis;
      }
      break;
      
    case FADE_IN_OUT:
      if (currentMillis - previousMillis >= 10) {
        brightness += fadeDirection * 5;
        if (brightness <= 0 || brightness >= 255) {
          fadeDirection = -fadeDirection;
          brightness = constrain(brightness, 0, 255);
        }
        analogWrite(LED_BUILTIN, brightness);
        previousMillis = currentMillis;
      }
      break;
  }
}`
    },

    "sensor-threshold": {
        name: "Sensor Threshold Monitor",
        category: "Intermediate",
        description: "Monitor analog sensor with threshold detection",
        code: `int sensorPin = A0;
int ledPin = 13;
int buzzerPin = 8;
int threshold = 500;
int sensorValue = 0;
bool alarmActive = false;
unsigned long alarmStartTime = 0;

void setup() {
  pinMode(sensorPin, INPUT);
  pinMode(ledPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  sensorValue = analogRead(sensorPin);
  
  Serial.print("Sensor: ");
  Serial.print(sensorValue);
  Serial.print(" | Threshold: ");
  Serial.println(threshold);
  
  if (sensorValue > threshold && !alarmActive) {
    alarmActive = true;
    alarmStartTime = millis();
    Serial.println("ALARM: Threshold exceeded!");
  }
  
  if (alarmActive) {
    // Flash LED and beep for 5 seconds
    unsigned long elapsed = millis() - alarmStartTime;
    if (elapsed < 5000) {
      digitalWrite(ledPin, (elapsed % 500) < 250);
      if ((elapsed % 1000) < 100) {
        tone(buzzerPin, 1000, 50);
      }
    } else {
      alarmActive = false;
      digitalWrite(ledPin, LOW);
      noTone(buzzerPin);
    }
  }
  
  delay(100);
}`
    },

    "multitasking-demo": {
        name: "Multitasking Demo",
        category: "Advanced", 
        description: "Non-blocking multitasking without delay()",
        code: `struct Task {
  unsigned long interval;
  unsigned long previousMillis;
  void (*function)();
};

unsigned long led1PreviousMillis = 0;
unsigned long led2PreviousMillis = 0; 
unsigned long serialPreviousMillis = 0;
bool led1State = false;
bool led2State = false;
int counter = 0;

void blinkLED1() {
  led1State = !led1State;
  digitalWrite(2, led1State);
}

void blinkLED2() {
  led2State = !led2State;
  digitalWrite(3, led2State);
}

void printStatus() {
  Serial.print("Counter: ");
  Serial.print(counter++);
  Serial.print(" | LED1: ");
  Serial.print(led1State ? "ON" : "OFF");
  Serial.print(" | LED2: ");
  Serial.println(led2State ? "ON" : "OFF");
}

Task tasks[] = {
  {500, 0, blinkLED1},    // Blink LED1 every 500ms
  {300, 0, blinkLED2},    // Blink LED2 every 300ms
  {1000, 0, printStatus}  // Print status every 1000ms
};

const int numTasks = sizeof(tasks) / sizeof(Task);

void setup() {
  pinMode(2, OUTPUT);
  pinMode(3, OUTPUT);
  Serial.begin(9600);
  Serial.println("Multitasking Demo Started");
}

void loop() {
  unsigned long currentMillis = millis();
  
  for (int i = 0; i < numTasks; i++) {
    if (currentMillis - tasks[i].previousMillis >= tasks[i].interval) {
      tasks[i].previousMillis = currentMillis;
      tasks[i].function();
    }
  }
}`
    },

    "data-logger": {
        name: "Simple Data Logger",
        category: "Advanced",
        description: "Log sensor data with timestamps and statistics",
        code: `int sensorPin = A0;
float readings[10];
int readingIndex = 0;
int totalReadings = 0;
unsigned long lastReadTime = 0;
const unsigned long readInterval = 1000;

float calculateAverage() {
  float sum = 0;
  int count = min(totalReadings, 10);
  for (int i = 0; i < count; i++) {
    sum += readings[i];
  }
  return count > 0 ? sum / count : 0;
}

float findMin() {
  if (totalReadings == 0) return 0;
  float minVal = readings[0];
  int count = min(totalReadings, 10);
  for (int i = 1; i < count; i++) {
    if (readings[i] < minVal) {
      minVal = readings[i];
    }
  }
  return minVal;
}

float findMax() {
  if (totalReadings == 0) return 0;
  float maxVal = readings[0];
  int count = min(totalReadings, 10);
  for (int i = 1; i < count; i++) {
    if (readings[i] > maxVal) {
      maxVal = readings[i];
    }
  }
  return maxVal;
}

void setup() {
  Serial.begin(9600);
  Serial.println("Data Logger Started");
  Serial.println("Time(s),Raw,Voltage,Avg,Min,Max");
}

void loop() {
  unsigned long currentTime = millis();
  
  if (currentTime - lastReadTime >= readInterval) {
    // Read sensor
    int rawValue = analogRead(sensorPin);
    float voltage = rawValue * (5.0 / 1023.0);
    
    // Store reading
    readings[readingIndex] = voltage;
    readingIndex = (readingIndex + 1) % 10;
    totalReadings++;
    
    // Calculate statistics
    float avg = calculateAverage();
    float minVal = findMin();
    float maxVal = findMax();
    
    // Log data
    Serial.print(currentTime / 1000.0, 1);
    Serial.print(",");
    Serial.print(rawValue);
    Serial.print(",");
    Serial.print(voltage, 3);
    Serial.print(",");
    Serial.print(avg, 3);
    Serial.print(",");
    Serial.print(minVal, 3);
    Serial.print(",");
    Serial.println(maxVal, 3);
    
    lastReadTime = currentTime;
  }
}`
    },

    "communication-demo": {
        name: "Serial Communication",
        category: "Intermediate",
        description: "Interactive serial command processing",
        code: `String inputString = "";
bool stringComplete = false;
int ledPin = 13;
int brightness = 128;

void setup() {
  Serial.begin(9600);
  pinMode(ledPin, OUTPUT);
  Serial.println("Arduino Command Interface");
  Serial.println("Commands:");
  Serial.println("  LED ON  - Turn LED on");
  Serial.println("  LED OFF - Turn LED off");
  Serial.println("  BRIGHT <0-255> - Set brightness");
  Serial.println("  STATUS - Show current status");
  Serial.println("  HELP - Show this help");
}

void loop() {
  // Check for serial input
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    
    if (inChar == '\\n') {
      stringComplete = true;
    } else {
      inputString += inChar;
    }
  }
  
  // Process complete command
  if (stringComplete) {
    processCommand(inputString);
    inputString = "";
    stringComplete = false;
  }
  
  // Keep LED at current brightness level
  analogWrite(ledPin, brightness);
}

void processCommand(String command) {
  command.trim();
  command.toUpperCase();
  
  if (command == "LED ON") {
    brightness = 255;
    Serial.println("LED turned ON");
  } 
  else if (command == "LED OFF") {
    brightness = 0;
    Serial.println("LED turned OFF");
  }
  else if (command.startsWith("BRIGHT ")) {
    int newBrightness = command.substring(7).toInt();
    if (newBrightness >= 0 && newBrightness <= 255) {
      brightness = newBrightness;
      Serial.print("Brightness set to: ");
      Serial.println(brightness);
    } else {
      Serial.println("Error: Brightness must be 0-255");
    }
  }
  else if (command == "STATUS") {
    Serial.print("LED Brightness: ");
    Serial.print(brightness);
    Serial.print("/255 (");
    Serial.print((brightness * 100) / 255);
    Serial.println("%)");
  }
  else if (command == "HELP") {
    Serial.println("Available commands:");
    Serial.println("  LED ON, LED OFF, BRIGHT <0-255>, STATUS, HELP");
  }
  else {
    Serial.print("Unknown command: ");
    Serial.println(command);
    Serial.println("Type HELP for available commands");
  }
}`
    }
};

// Export for browser usage
if (typeof window !== 'undefined') {
    window.playgroundExamples = playgroundExamples;
}

// Export for Node.js usage  
if (typeof module !== 'undefined' && module.exports) {
    module.exports = playgroundExamples;
}