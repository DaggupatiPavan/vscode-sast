# AI SAST Code Generator VS Code Extension

## Quick Start Guide

### 1. Get Groq API Key
1. Go to [https://console.groq.com/](https://console.groq.com/)
2. Sign up/login
3. Navigate to API Keys
4. Create a new API key
5. Copy the key

### 2. Install Extension in VS Code

#### Method A: Install from Source
```bash
# Navigate to extension directory
cd vscode-extension

# Install dependencies
npm install

# Compile the extension
npm run compile

# Package the extension
npm install -g vsce
vsce package
```

Then in VS Code:
1. Go to Extensions → Install from VSIX
2. Select the generated `.vsix` file

#### Method B: Development Mode
```bash
# In vscode-extension directory
code .
```

Then in VS Code:
1. Press `F5` to open a new Extension Development Host window
2. Test the extension in the new window

### 3. Configure the Extension
1. Open VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "AI SAST: Configure Groq API"
4. Enter your Groq API key

### 4. Test the Extension

#### Example Test: Python Encryption
1. Create a new Python file
2. Type: `# create an encryption and decryption logic using python with AES-256`
3. Select the text
4. Press `Ctrl+Shift+G`
5. Watch the AI generate secure code
6. See automatic SAST scanning and fixing

#### Example Test: JavaScript API
1. Create a new JavaScript file
2. Type: `// create a secure user login API endpoint with JWT`
3. Select and generate code
4. Observe automatic vulnerability detection and fixes

### 5. Key Features
- **Ctrl+Shift+G**: Generate code from selection
- **Ctrl+Shift+F**: Scan and fix vulnerabilities
- **Automatic scanning** after code generation
- **Multi-language support** (Python, JS, TS, Java, C/C++)
- **Real-time vulnerability detection**

### 6. Configuration Options
```json
{
  "aiSast.groqApiKey": "your-api-key-here",
  "aiSast.autoScan": true,
  "aiSast.autoFix": true,
  "aiSast.scanDelay": 2000
}
```

## Security Features
- SQL Injection detection and fixing
- Hardcoded password detection
- XSS vulnerability prevention
- Weak cryptography detection
- Command injection protection
- Unsafe eval() detection

## Troubleshooting
- **Extension not working**: Check API key configuration
- **No code generated**: Verify Groq API quota and internet connection
- **Scanning not working**: Ensure auto-scan is enabled in settings