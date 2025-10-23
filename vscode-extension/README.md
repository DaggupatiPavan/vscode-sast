# AI SAST Code Generator - VS Code Extension

A powerful VS Code extension that generates code using Groq AI and automatically detects and fixes security vulnerabilities in real-time.

## 🚀 Features

- **AI Code Generation**: Generate code from natural language comments using Groq API
- **Automatic SAST Scanning**: Real-time vulnerability detection in AI-generated code
- **Auto-Fix Capabilities**: Automatically fix detected security issues
- **Multi-Language Support**: Python, JavaScript, TypeScript, Java, C/C++
- **Seamless Integration**: Works directly in your VS Code editor

## 📦 Installation

### Prerequisites
1. **VS Code** (version 1.85 or higher)
2. **Groq API Key** - Get one from [https://console.groq.com/](https://console.groq.com/)

### Step 1: Install the Extension

#### Option A: From VS Code Marketplace (Recommended)
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "AI SAST Code Generator"
4. Click Install

#### Option B: Manual Installation
1. Clone or download this extension
2. Open VS Code
3. Go to Extensions → Install from VSIX
4. Select the extension file

### Step 2: Configure Groq API Key

1. Open VS Code Settings (Ctrl+,)
2. Search for "AI SAST"
3. Enter your Groq API key in the "Groq Api Key" field
4. Or use the command palette (Ctrl+Shift+P) and run "AI SAST: Configure Groq API"

## 🛠️ Usage

### Method 1: Using Keyboard Shortcuts
1. **Generate Code**: `Ctrl+Shift+G` (Windows/Linux) or `Cmd+Shift+G` (Mac)
2. **Scan and Fix**: `Ctrl+Shift+F` (Windows/Linux) or `Cmd+Shift+F` (Mac)

### Method 2: Using Command Palette
1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type "AI SAST" to see available commands:
   - "Generate Code with AI (SAST Protected)"
   - "Scan and Fix Vulnerabilities"
   - "Configure Groq API"

### Method 3: Using Context Menu
1. Right-click in the editor
2. Select "AI SAST" from the context menu
3. Choose the desired action

## 📝 Example Workflow

### Example 1: Python Encryption/Decryption

1. **Create a new Python file** (`encryption.py`)
2. **Type a comment describing what you want**:
   ```python
   # create an encryption and decryption logic using python with AES-256
   ```
3. **Select the comment** and press `Ctrl+Shift+G`
4. **AI generates secure code** like:
   ```python
   from cryptography.fernet import Fernet
   from cryptography.hazmat.primitives import hashes
   from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
   import base64
   import os

   class SecureEncryption:
       def __init__(self, password: str):
           self.password = password.encode()
           self.salt = os.urandom(16)
           self.key = self._derive_key()
           self.fernet = Fernet(self.key)
       
       def _derive_key(self) -> bytes:
           kdf = PBKDF2HMAC(
               algorithm=hashes.SHA256(),
               length=32,
               salt=self.salt,
               iterations=100000,
           )
           key = base64.urlsafe_b64encode(kdf.derive(self.password))
           return key
       
       def encrypt(self, data: str) -> bytes:
           return self.fernet.encrypt(data.encode())
       
       def decrypt(self, encrypted_data: bytes) -> str:
           return self.fernet.decrypt(encrypted_data).decode()
   ```
5. **Automatic SAST scanning** runs and ensures the code is secure
6. **If vulnerabilities are found**, they're automatically fixed

### Example 2: JavaScript API Endpoint

1. **Type a comment**:
   ```javascript
   // create a secure API endpoint for user authentication with JWT
   ```
2. **Select and generate code** with `Ctrl+Shift+G`
3. **Get secure code** with automatic vulnerability fixes

## 🔧 Configuration Options

Open VS Code Settings and search for "AI SAST":

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `aiSast.groqApiKey` | string | "" | Your Groq API key |
| `aiSast.autoScan` | boolean | true | Automatically scan AI-generated code |
| `aiSast.autoFix` | boolean | true | Automatically fix detected vulnerabilities |
| `aiSast.scanDelay` | number | 2000 | Delay before scanning (ms) |

## 🛡️ Security Vulnerabilities Detected

The extension automatically detects and fixes:

### High Severity
- **SQL Injection**: Unsafe database queries
- **Hardcoded Passwords**: Passwords in source code
- **Eval Usage**: Dangerous eval() functions
- **Command Injection**: Unsafe shell commands

### Medium Severity
- **XSS Vulnerabilities**: Unsafe HTML manipulation
- **Weak Cryptography**: MD5, SHA1 usage
- **Unsafe Deserialization**: Pickle, unsafe JSON parsing

### Low Severity
- **Information Disclosure**: Debug code, sensitive logging
- **Insecure Defaults**: Default passwords, weak configurations

## 🔍 Supported Languages

- **Python**: Full support with Flask, Django, FastAPI patterns
- **JavaScript/TypeScript**: Node.js, Express, React patterns
- **Java**: Spring, JDBC patterns
- **C/C++**: Memory safety, buffer overflow detection
- **Go**: Web frameworks, database patterns

## 🚨 Automatic Workflow

1. **Code Generation**: AI generates code from your comment
2. **Immediate Scanning**: SAST scanner analyzes the code
3. **Vulnerability Detection**: Identifies security issues
4. **Auto-Fix**: Applies secure coding practices
5. **Notification**: Shows results and fixes applied

## 📊 SAST Detection Patterns

### SQL Injection
```javascript
// ❌ Vulnerable
db.execute("SELECT * FROM users WHERE id = " + userId);

// ✅ Fixed
db.execute("SELECT * FROM users WHERE id = ?", [userId]);
```

### Hardcoded Secrets
```python
# ❌ Vulnerable
password = "admin123"

# ✅ Fixed
password = os.environ.get("PASSWORD", "")
```

### XSS Prevention
```javascript
// ❌ Vulnerable
element.innerHTML = userInput;

// ✅ Fixed
element.textContent = userInput;
```

## 🔄 Development Workflow

### For Developers
1. Write natural language comments
2. Generate secure code instantly
3. Get automatic vulnerability protection
4. Focus on business logic, not security boilerplate

### For Security Teams
1. Consistent security patterns across codebase
2. Automatic vulnerability remediation
3. Real-time security feedback
4. Reduced security review workload

## 🐛 Troubleshooting

### Common Issues

**"No active editor found"**
- Make sure you have a file open in VS Code
- Select the text/comment before generating code

**"Please set your Groq API key"**
- Go to Settings → AI SAST → Groq Api Key
- Or run "AI SAST: Configure Groq API" command

**"Failed to generate code"**
- Check your internet connection
- Verify your Groq API key is valid
- Check Groq API quota limits

**Extension not working**
- Restart VS Code
- Check extension is enabled
- Update to latest version

### Debug Mode
Enable debug logging by adding to VS Code settings:
```json
{
  "aiSast.debug": true
}
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

- **Issues**: Report bugs on GitHub
- **Feature Requests**: Submit enhancement ideas
- **Security Issues**: Report privately via security@company.com

---

**🔒 Secure your code generation workflow with AI-powered SAST protection!**