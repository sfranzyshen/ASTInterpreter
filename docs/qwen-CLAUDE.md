# Using Qwen CLI for Large Codebase Analysis

When analyzing codebases or multiple files that might exceed context limits, use the Qwen CLI with its context window. Use `qwen -p` to leverage Qwen's context capacity.

## File and Directory Inclusion Syntax

Use the `@` syntax to include files and directories in your Qwen prompts. The paths should be relative to WHERE you run the
  qwen command:

### Examples:

**Single file analysis:**
qwen -p "@src/main.py Explain this file's purpose and structure"

Multiple files:
qwen -p "@package.json @src/index.js Analyze the dependencies used in the code"

Entire directory:
qwen -p "@src/ Summarize the architecture of this codebase"

Multiple directories:
qwen -p "@src/ @tests/ Analyze test coverage for the source code"

Current directory and subdirectories:
qwen -p "@./ Give me an overview of this entire project"

# Or use --all_files flag:
qwen --all_files -p "Analyze the project structure and dependencies"

Implementation Verification Examples

Check if a feature is implemented:
qwen -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"

Verify authentication implementation:
qwen -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"

Check for specific patterns:
qwen -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"

Verify error handling:
qwen -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"

Check for rate limiting:
qwen -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"

Verify caching strategy:
qwen -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"

Check for specific security measures:
qwen -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"

Verify test coverage for features:
qwen -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"

When to Use Qwen CLI

Use qwen -p when:
- Need to understand project-wide patterns or architecture
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the codebase

Important Notes

- Paths in @ syntax are relative to your current working directory when invoking qwen
- The CLI will include file contents directly in the context
- No need for --yolo flag for read-only analysis
- When checking implementations, be specific about what you're looking for to get accurate results