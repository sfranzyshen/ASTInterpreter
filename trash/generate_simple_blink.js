const blink = `
void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}
`;

const { parse, exportCompactAST } = require("./ArduinoParser.js");
const ast = parse(blink);

// Export to CompactAST
const compactAST = exportCompactAST(ast);
console.log("Generated", compactAST.length, "bytes of compact AST data");

// Write to file  
const fs = require("fs");
fs.writeFileSync("simple_blink_test.ast", Buffer.from(compactAST));
console.log("Saved to simple_blink_test.ast");
