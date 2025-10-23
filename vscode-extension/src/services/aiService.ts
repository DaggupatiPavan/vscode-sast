import * as vscode from 'vscode';
import { SonarIssue } from './sonarQubeService';

export interface Vulnerability {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    file: string;
    line: number;
    description: string;
    status: 'detected' | 'analyzing' | 'fixed' | 'failed';
    confidence?: number;
    aiFix?: string;
    suggestedFix?: string;
    code?: string;
}

export interface AIFix {
    code: string;
    description: string;
    confidence: number;
    explanation: string;
}

export class AIService {
    private modelProvider: string;
    private apiKey: string;
    private confidenceThreshold: number;

    constructor() {
        const config = vscode.workspace.getConfiguration('sast');
        this.modelProvider = 'groq'; // Default to Groq
        this.apiKey = '';
        this.confidenceThreshold = config.get('aiConfidenceThreshold', 85);
    }

    async analyzeVulnerabilities(document: vscode.TextDocument, sonarIssues: SonarIssue[]): Promise<Vulnerability[]> {
        const vulnerabilities: Vulnerability[] = [];

        for (const issue of sonarIssues) {
            const vulnerability = await this.enhanceWithAI(document, issue);
            vulnerabilities.push(vulnerability);
        }

        // Also perform additional AI-based analysis for issues SonarQube might miss
        const aiDetectedIssues = await this.performAIAnalysis(document);
        vulnerabilities.push(...aiDetectedIssues);

        return vulnerabilities;
    }

    private async enhanceWithAI(document: vscode.TextDocument, sonarIssue: SonarIssue): Promise<Vulnerability> {
        const lineContent = document.lineAt(sonarIssue.line - 1).text;
        const context = this.getCodeContext(document, sonarIssue.line);

        try {
            const aiAnalysis = await this.analyzeWithAI({
                code: lineContent,
                context: context,
                issue: sonarIssue,
                language: document.languageId
            });

            return {
                id: sonarIssue.key,
                severity: this.mapSeverity(sonarIssue.severity),
                type: sonarIssue.type,
                file: document.fileName,
                line: sonarIssue.line,
                description: sonarIssue.message,
                status: 'detected',
                confidence: aiAnalysis.confidence,
                suggestedFix: aiAnalysis.suggestedFix,
                aiFix: aiAnalysis.explanation
            };
        } catch (error) {
            console.error('AI analysis failed:', error);
            return {
                id: sonarIssue.key,
                severity: this.mapSeverity(sonarIssue.severity),
                type: sonarIssue.type,
                file: document.fileName,
                line: sonarIssue.line,
                description: sonarIssue.message,
                status: 'detected',
                confidence: 70 // Default confidence when AI fails
            };
        }
    }

    private async performAIAnalysis(document: vscode.TextDocument): Promise<Vulnerability[]> {
        const vulnerabilities: Vulnerability[] = [];
        const content = document.getText();
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            // AI-based pattern recognition for security issues
            const aiIssues = await this.analyzeLineWithAI(line, lineNumber, document);
            vulnerabilities.push(...aiIssues);
        }

        return vulnerabilities;
    }

    private async analyzeLineWithAI(line: string, lineNumber: number, document: vscode.TextDocument): Promise<Vulnerability[]> {
        const vulnerabilities: Vulnerability[] = [];

        // Pattern-based AI analysis
        const patterns = [
            {
                pattern: /fetch\s*\(\s*['"`]([^'"`]+)['"`]/,
                type: 'Insecure HTTP Request',
                severity: 'medium' as const,
                description: 'Potentially insecure HTTP request detected'
            },
            {
                pattern: /document\.write\s*\(/,
                type: 'DOM-based XSS',
                severity: 'high' as const,
                description: 'document.write can lead to DOM-based XSS vulnerabilities'
            },
            {
                pattern: /crypto\.createHash\s*\(\s*['"`]md5['"`]/,
                type: 'Weak Cryptographic Hash',
                severity: 'medium' as const,
                description: 'MD5 is a weak cryptographic hash function'
            },
            {
                pattern: /Math\.random\s*\(\s*\)/,
                type: 'Weak Random Number Generation',
                severity: 'low' as const,
                description: 'Math.random is not cryptographically secure'
            }
        ];

        for (const pattern of patterns) {
            if (pattern.pattern.test(line)) {
                const aiAnalysis = await this.generateFixSuggestion(line, pattern.type, document.languageId);
                
                vulnerabilities.push({
                    id: `ai-${lineNumber}-${Math.random().toString(36).substr(2, 9)}`,
                    severity: pattern.severity,
                    type: pattern.type,
                    file: document.fileName,
                    line: lineNumber,
                    description: pattern.description,
                    status: 'detected',
                    confidence: aiAnalysis.confidence,
                    suggestedFix: aiAnalysis.suggestedFix,
                    aiFix: aiAnalysis.explanation
                });
            }
        }

        return vulnerabilities;
    }

    private async analyzeWithAI(params: {
        code: string;
        context: string;
        issue: SonarIssue;
        language: string;
    }): Promise<{ confidence: number; suggestedFix: string; explanation: string }> {
        try {
            // In a real implementation, this would call an AI service like Groq, OpenAI, or local LLM
            // For now, we'll simulate AI analysis with rule-based logic
            
            const confidence = this.calculateConfidence(params.code, params.issue);
            const suggestedFix = this.generateSuggestedFix(params.code, params.issue, params.language);
            const explanation = this.generateExplanation(params.issue, params.language);

            return {
                confidence,
                suggestedFix,
                explanation
            };
        } catch (error) {
            console.error('AI analysis error:', error);
            return {
                confidence: 50,
                suggestedFix: 'Review and fix the identified security issue',
                explanation: 'AI analysis failed. Manual review required.'
            };
        }
    }

    private calculateConfidence(code: string, issue: SonarIssue): number {
        let confidence = 70; // Base confidence

        // Increase confidence based on issue severity
        if (issue.severity === 'BLOCKER' || issue.severity === 'CRITICAL') {
            confidence += 15;
        } else if (issue.severity === 'MAJOR') {
            confidence += 10;
        }

        // Increase confidence for well-known patterns
        if (issue.rule.includes('S4784') || issue.rule.includes('S5443')) {
            confidence += 10;
        }

        // Adjust based on code complexity
        if (code.length > 100) {
            confidence -= 5;
        }

        return Math.min(confidence, 95);
    }

    private generateSuggestedFix(code: string, issue: SonarIssue, language: string): string {
        const fixes: Record<string, string> = {
            'javascript:S4784': 'Replace eval() with safer alternatives like JSON.parse() or specific function calls',
            'javascript:S5443': 'Use textContent instead of innerHTML, or sanitize the content before insertion',
            'javascript:S2068': 'Move credentials to environment variables or secure configuration files',
            'javascript:S2077': 'Use parameterized queries or prepared statements instead of string concatenation'
        };

        return fixes[issue.rule] || 'Review and implement security best practices for this issue';
    }

    private generateExplanation(issue: SonarIssue, language: string): string {
        const explanations: Record<string, string> = {
            'javascript:S4784': 'Code injection vulnerabilities allow attackers to execute arbitrary code',
            'javascript:S5443': 'XSS attacks can steal user data and session information',
            'javascript:S2068': 'Hardcoded credentials can be easily extracted from source code',
            'javascript:S2077': 'SQL injection can lead to data breaches and database compromise'
        };

        return explanations[issue.rule] || 'This security issue should be addressed to protect your application';
    }

    async generateFix(vulnerability: Vulnerability, document: vscode.TextDocument): Promise<AIFix | null> {
        try {
            const lineContent = document.lineAt(vulnerability.line - 1).text;
            const context = this.getCodeContext(document, vulnerability.line);

            const fix = await this.generateAIFix({
                vulnerability,
                code: lineContent,
                context,
                language: document.languageId
            });

            return fix;
        } catch (error) {
            console.error('AI fix generation failed:', error);
            return null;
        }
    }

    private async generateAIFix(params: {
        vulnerability: Vulnerability;
        code: string;
        context: string;
        language: string;
    }): Promise<AIFix> {
        // Simulate AI fix generation
        const fixStrategies = this.getFixStrategies(params.vulnerability.type, params.language);
        const strategy = fixStrategies[0]; // Use the first strategy

        return {
            code: this.applyFixStrategy(params.code, strategy),
            description: strategy.description,
            confidence: strategy.confidence,
            explanation: strategy.explanation
        };
    }

    private getFixStrategies(vulnerabilityType: string, language: string): Array<{
        description: string;
        confidence: number;
        explanation: string;
        apply: (code: string) => string;
    }> {
        const strategies: Record<string, any[]> = {
            'Code Injection': [
                {
                    description: 'Replace eval with JSON.parse',
                    confidence: 90,
                    explanation: 'Using JSON.parse is safer than eval for parsing JSON data',
                    apply: (code: string) => code.replace(/eval\s*\(\s*([^)]+)\s*\)/g, 'JSON.parse($1)')
                }
            ],
            'Cross-Site Scripting (XSS)': [
                {
                    description: 'Replace innerHTML with textContent',
                    confidence: 95,
                    explanation: 'textContent prevents HTML injection by treating content as plain text',
                    apply: (code: string) => code.replace(/\.innerHTML\s*=/g, '.textContent =')
                }
            ],
            'Hardcoded Credentials': [
                {
                    description: 'Replace with environment variable',
                    confidence: 85,
                    explanation: 'Environment variables keep credentials out of source code',
                    apply: (code: string) => code.replace(/(['"`])[^'"`]*password[^'"`]*\1/gi, 'process.env.PASSWORD')
                }
            ],
            'SQL Injection': [
                {
                    description: 'Use parameterized query',
                    confidence: 88,
                    explanation: 'Parameterized queries prevent SQL injection by separating code from data',
                    apply: (code: string) => {
                        // Simple regex-based fix for demonstration
                        return code.replace(
                            /SELECT\s+\*\s+FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*['"`]([^'"`]+)['"`]/gi,
                            'SELECT * FROM $1 WHERE $2 = ?'
                        );
                    }
                }
            ]
        };

        return strategies[vulnerabilityType] || [{
            description: 'Apply security best practices',
            confidence: 70,
            explanation: 'Review and implement appropriate security measures',
            apply: (code: string) => `// TODO: Apply security fix for: ${code}`
        }];
    }

    private applyFixStrategy(code: string, strategy: any): string {
        return strategy.apply(code);
    }

    private async generateFixSuggestion(code: string, issueType: string, language: string): Promise<{
        confidence: number;
        suggestedFix: string;
        explanation: string;
    }> {
        const suggestions: Record<string, { confidence: number; suggestedFix: string; explanation: string }> = {
            'Insecure HTTP Request': {
                confidence: 80,
                suggestedFix: 'Use HTTPS instead of HTTP for secure communication',
                explanation: 'HTTPS encrypts data in transit, preventing man-in-the-middle attacks'
            },
            'DOM-based XSS': {
                confidence: 90,
                suggestedFix: 'Use safe DOM manipulation methods like textContent or createElement',
                explanation: 'Safe DOM methods prevent script injection through HTML content'
            },
            'Weak Cryptographic Hash': {
                confidence: 85,
                suggestedFix: 'Use strong hash functions like SHA-256 or bcrypt',
                explanation: 'Modern hash functions provide better security against collision attacks'
            },
            'Weak Random Number Generation': {
                confidence: 75,
                suggestedFix: 'Use crypto.randomBytes() for cryptographically secure random numbers',
                explanation: 'Cryptographically secure random numbers are essential for security-sensitive operations'
            }
        };

        return suggestions[issueType] || {
            confidence: 60,
            suggestedFix: 'Review and implement appropriate security measures',
            explanation: 'This issue requires security review and appropriate mitigation'
        };
    }

    private getCodeContext(document: vscode.TextDocument, lineNumber: number): string {
        const start = Math.max(0, lineNumber - 3);
        const end = Math.min(document.lineCount, lineNumber + 3);
        const lines = [];

        for (let i = start; i < end; i++) {
            lines.push(document.lineAt(i).text);
        }

        return lines.join('\n');
    }

    private mapSeverity(sonarSeverity: string): 'critical' | 'high' | 'medium' | 'low' {
        const mapping: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
            'BLOCKER': 'critical',
            'CRITICAL': 'critical',
            'MAJOR': 'high',
            'MINOR': 'medium',
            'INFO': 'low'
        };

        return mapping[sonarSeverity] || 'medium';
    }
}