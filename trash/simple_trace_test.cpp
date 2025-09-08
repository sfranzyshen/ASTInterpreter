/**
 * Simple test to demonstrate execution tracing difference
 */

#include "ExecutionTracer.hpp"
#include <iostream>

using namespace arduino_interpreter;

int main() {
    std::cout << "=== Simple Execution Trace Test ===" << std::endl;
    
    // Enable tracing
    TRACE_ENABLE();
    TRACE_CONTEXT("SimpleTest");
    TRACE_CLEAR();
    
    // Simulate execution flow that should happen but doesn't in C++
    TRACE_ENTRY("main", "Starting execution");
    
    TRACE_ENTRY("executeProgram", "");
    TRACE("executeProgram", "Phase 1: Collecting function definitions");
    TRACE("executeProgram", "Phase 2: Executing setup()");
    
    TRACE_ENTRY("executeSetup", "");
    TRACE("executeSetup", "Found setup() function");
    
    TRACE_ENTRY("visit(CompoundStmtNode)", "Processing setup body");
    
    TRACE_ENTRY("visit(VarDeclNode)", "Starting variable declaration");
    TRACE("VarDecl-Variable", "Declared x=5");
    TRACE_EXIT("visit(VarDeclNode)", "Variable declaration complete");
    
    TRACE_EXIT("visit(CompoundStmtNode)", "Setup body complete");
    TRACE_EXIT("executeSetup", "setup() completed");
    
    TRACE("executeProgram", "Phase 3: Executing loop()");
    TRACE_EXIT("executeProgram", "Program execution completed");
    
    TRACE_EXIT("main", "Execution finished");
    
    // Save trace
    TRACE_SAVE("expected_cpp_trace.txt");
    TRACE_SUMMARY();
    
    std::cout << "\nExpected C++ trace saved to: expected_cpp_trace.txt" << std::endl;
    std::cout << "This shows what SHOULD happen if C++ execution worked correctly." << std::endl;
    
    return 0;
}