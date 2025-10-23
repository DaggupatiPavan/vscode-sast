import * as vscode from 'vscode';
import axios from 'axios';

interface GroqResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

interface Vulnerability {
    type: string;
    severity: 'high' | 'medium' | 'low';
    line: number;
    description: string;
    fixed_code?: string;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('AI SAST Code Generator is now active!');

    // Generate code with AI
    const generateCodeCommand = vscode.commands.registerCommand('ai-sast.generateCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText.trim()) {
            vscode.window.showErrorMessage('Please select a comment or description of the code you want to generate');
            return;
        }

        // Show progress indicator
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generating code with AI...',
            cancellable: false
        }, async (progress) => {
            try {
                progress.report({ increment: 0, message: 'Initializing...' });

                // Get Groq API key
                const config = vscode.workspace.getConfiguration('aiSast');
                const apiKey = config.get<string>('groqApiKey');

                if (!apiKey) {
                    vscode.window.showErrorMessage('Please set your Groq API key in settings (aiSast.groqApiKey)');
                    return;
                }

                progress.report({ increment: 20, message: 'Calling Groq API...' });

                // Call Groq API
                const response = await axios.post<GroqResponse>('https://api.groq.com/openai/v1/chat/completions', {
                    model: 'llama3-70b-8192',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a professional code generator. Generate clean, efficient, and production-ready code based on the user's requirements. 
                            
                            Rules:
                            1. Generate only the code implementation, no explanations
                            2. Use proper error handling
                            3. Follow best practices for the requested language
                            4. Include necessary imports/dependencies
                            5. Make the code secure and robust`
                        },
                        {
                            role: 'user',
                            content: selectedText
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 2000
                }, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                progress.report({ increment: 60, message: 'Processing response...' });

                const generatedCode = response.data.choices[0]?.message?.content;
                if (!generatedCode) {
                    vscode.window.showErrorMessage('No code generated from AI');
                    return;
                }

                progress.report({ increment: 80, message: 'Inserting code...' });

                // Insert generated code
                await editor.edit(editBuilder => {
                    editBuilder.replace(selection, generatedCode);
                });

                vscode.window.showInformationMessage('✅ Code generated successfully!');

                // Auto-scan if enabled
                if (config.get<boolean>('autoScan')) {
                    const delay = config.get<number>('scanDelay') || 2000;
                    
                    setTimeout(async () => {
                        await scanAndFixVulnerabilities(editor, false);
                    }, delay);
                }

            } catch (error: any) {
                console.error('Error generating code:', error);
                vscode.window.showErrorMessage(`Failed to generate code: ${error.response?.data?.error?.message || error.message}`);
            }
        });
    });

    // Scan and fix vulnerabilities
    const scanAndFixCommand = vscode.commands.registerCommand('ai-sast.scanAndFix', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        await scanAndFixVulnerabilities(editor, true);
    });

    // Configure API key
    const configureCommand = vscode.commands.registerCommand('ai-sast.configure', async () => {
        const config = vscode.workspace.getConfiguration('aiSast');
        const currentKey = config.get<string>('groqApiKey') || '';
        
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your Groq API key',
            password: true,
            value: currentKey
        });

        if (apiKey !== undefined) {
            await config.update('groqApiKey', apiKey, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage('✅ Groq API key saved successfully!');
        }
    });

    context.subscriptions.push(generateCodeCommand, scanAndFixCommand, configureCommand);
}

async function scanAndFixVulnerabilities(editor: vscode.TextEditor, showProgress: boolean = true) {
    const document = editor.document;
    const text = document.getText();
    const lines = text.split('\n');

    if (showProgress) {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Scanning for vulnerabilities...',
            cancellable: false
        }, async (progress) => {
            await performScan(editor, lines, progress);
        });
    } else {
        await performScan(editor, lines, null);
    }
}

async function performScan(editor: vscode.TextEditor, lines: string[], progress: any) {
    const vulnerabilities: Vulnerability[] = [];
    const language = editor.document.languageId;

    // Define vulnerability patterns
    const vulnerabilityPatterns = getVulnerabilityPatterns(language);

    progress?.report({ increment: 20, message: 'Analyzing code...' });

    // Scan for vulnerabilities
    lines.forEach((line, index) => {
        vulnerabilityPatterns.forEach(pattern => {
            if (pattern.regex.test(line)) {
                vulnerabilities.push({
                    type: pattern.type,
                    severity: pattern.severity,
                    line: index + 1,
                    description: pattern.description,
                    fixed_code: generateFix(line, pattern, language)
                });
            }
        });
    });

    progress?.report({ increment: 60, message: `Found ${vulnerabilities.length} vulnerabilities...` });

    if (vulnerabilities.length === 0) {
        vscode.window.showInformationMessage('✅ No security vulnerabilities found!');
        return;
    }

    // Show vulnerabilities and ask for auto-fix
    const config = vscode.workspace.getConfiguration('aiSast');
    const autoFix = config.get<boolean>('autoFix');

    if (autoFix) {
        await applyFixes(editor, vulnerabilities, lines);
    } else {
        const choice = await vscode.window.showWarningMessage(
            `Found ${vulnerabilities.length} security vulnerabilities. Fix them automatically?`,
            'Fix All',
            'Show Details',
            'Ignore'
        );

        if (choice === 'Fix All') {
            await applyFixes(editor, vulnerabilities, lines);
        } else if (choice === 'Show Details') {
            showVulnerabilityDetails(vulnerabilities);
        }
    }

    progress?.report({ increment: 100, message: 'Complete!' });
}

function getVulnerabilityPatterns(language: string) {
    const patterns = [
        {
            type: 'SQL Injection',
            severity: 'high' as const,
            regex: /execute\s*\(\s*['"`][^'"`]*['"`]\s*\+/gi,
            description: 'Potential SQL injection vulnerability',
            fix: 'Use parameterized queries or prepared statements'
        },
        {
            type: 'Hardcoded Password',
            severity: 'high' as const,
            regex: /(password|pwd|pass)\s*=\s*['"`][^'"`]+['"`]/gi,
            description: 'Hardcoded password detected',
            fix: 'Use environment variables or secure configuration'
        },
        {
            type: 'Eval Usage',
            severity: 'high' as const,
            regex: /eval\s*\(/gi,
            description: 'Use of eval() function is dangerous',
            fix: 'Use safer alternatives like JSON.parse() or specific parsers'
        },
        {
            type: 'XSS Vulnerability',
            severity: 'medium' as const,
            regex: /innerHTML\s*=|document\.write\s*\(/gi,
            description: 'Potential XSS vulnerability',
            fix: 'Use textContent or sanitize HTML properly'
        },
        {
            type: 'Weak Crypto',
            severity: 'medium' as const,
            regex: /(md5|sha1)\s*\(/gi,
            description: 'Weak cryptographic algorithm detected',
            fix: 'Use stronger algorithms like SHA-256 or bcrypt'
        }
    ];

    // Add language-specific patterns
    if (language === 'python') {
        patterns.push(
            {
                type: 'Pickle Unsafe',
                severity: 'high' as const,
                regex: /pickle\.loads?\s*\(/gi,
                description: 'Unsafe pickle usage can lead to code execution',
                fix: 'Use safe serialization formats like JSON'
            },
            {
                type: 'Shell Command Injection',
                severity: 'high' as const,
                regex: /os\.system\s*\(|subprocess\.call\s*\(/gi,
                description: 'Potential shell command injection',
                fix: 'Use parameterized commands or proper escaping'
            }
        );
    }

    return patterns;
}

function generateFix(line: string, pattern: any, language: string): string {
    // Generate automatic fixes based on pattern type
    switch (pattern.type) {
        case 'SQL Injection':
            if (language === 'python') {
                return line.replace(/execute\s*\(\s*['"`][^'"`]*['"`]\s*\+/gi, 'execute("SELECT * FROM table WHERE id = ?", (user_input,))');
            } else {
                return line.replace(/execute\s*\(\s*['"`][^'"`]*['"`]\s*\+/gi, 'execute("SELECT * FROM table WHERE id = ?", [userInput])');
            }
        
        case 'Hardcoded Password':
            return line.replace(/(password|pwd|pass)\s*=\s*['"`][^'"`]+['"`]/gi, '$1 = process.env.PASSWORD || ""');
        
        case 'Eval Usage':
            return line.replace(/eval\s*\(/gi, 'JSON.parse(');
        
        case 'XSS Vulnerability':
            return line.replace(/innerHTML\s*=/gi, 'textContent =');
        
        case 'Weak Crypto':
            if (pattern.regex.test('md5')) {
                return line.replace(/md5\s*\(/gi, 'crypto.createHash('sha256').update(');
            } else {
                return line.replace(/sha1\s*\(/gi, 'crypto.createHash('sha256').update(');
            }
        
        default:
            return `// TODO: Fix ${pattern.type} vulnerability\n${line}`;
    }
}

async function applyFixes(editor: vscode.TextEditor, vulnerabilities: Vulnerability[], lines: string[]) {
    const config = vscode.workspace.getConfiguration('aiSast');
    const autoFix = config.get<boolean>('autoFix');

    if (!autoFix) {
        const choice = await vscode.window.showWarningMessage(
            `Apply ${vulnerabilities.length} automatic fixes?`,
            'Apply All',
            'Review First',
            'Cancel'
        );

        if (choice !== 'Apply All') {
            if (choice === 'Review First') {
                showVulnerabilityDetails(vulnerabilities);
            }
            return;
        }
    }

    // Apply fixes from bottom to top to maintain line numbers
    const sortedVulns = vulnerabilities.sort((a, b) => b.line - a.line);
    
    await editor.edit(editBuilder => {
        sortedVulns.forEach(vuln => {
            const lineIndex = vuln.line - 1;
            if (vuln.fixed_code && lineIndex < lines.length) {
                const originalLine = lines[lineIndex];
                const fixedLine = vuln.fixed_code;
                editBuilder.replace(
                    new vscode.Range(lineIndex, 0, lineIndex, originalLine.length),
                    fixedLine
                );
            }
        });
    });

    vscode.window.showInformationMessage(
        `✅ Applied ${vulnerabilities.length} security fixes automatically!`
    );
}

function showVulnerabilityDetails(vulnerabilities: Vulnerability[]) {
    const panel = vscode.window.createWebviewPanel(
        'vulnerabilityDetails',
        'Security Vulnerabilities',
        vscode.ViewColumn.One,
        {}
    );

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Vulnerabilities</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .vulnerability { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
            .high { border-left: 5px solid #d32f2f; }
            .medium { border-left: 5px solid #f57c00; }
            .low { border-left: 5px solid #388e3c; }
            .type { font-weight: bold; font-size: 18px; }
            .severity { color: #666; font-size: 14px; }
            .line { color: #333; font-family: monospace; }
            .description { margin: 10px 0; }
            .fix { background: #f5f5f5; padding: 10px; border-radius: 3px; font-family: monospace; }
        </style>
    </head>
    <body>
        <h1>🔒 Security Vulnerabilities Found</h1>
        <p>Total: ${vulnerabilities.length} issues</p>
        
        ${vulnerabilities.map(vuln => `
            <div class="vulnerability ${vuln.severity}">
                <div class="type">${vuln.type}</div>
                <div class="severity">Severity: ${vuln.severity.toUpperCase()} | Line: ${vuln.line}</div>
                <div class="description">${vuln.description}</div>
                ${vuln.fixed_code ? `<div class="fix"><strong>Suggested Fix:</strong><br>${vuln.fixed_code}</div>` : ''}
            </div>
        `).join('')}
    </body>
    </html>`;

    panel.webview.html = html;
}

export function deactivate() {
    console.log('AI SAST Code Generator deactivated');
}