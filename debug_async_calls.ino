void setup() {
  Serial.begin(9600);
}

void loop() {
  int val1 = analogRead(A0);
  Serial.println(val1);

  int val2 = digitalRead(2);
  Serial.println(val2);

  long time1 = millis();
  Serial.println(time1);

  long time2 = micros();
  Serial.println(time2);

  delay(100); // Small delay to allow commands to process
}