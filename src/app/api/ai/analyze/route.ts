import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

interface AnalysisRequest {
  code: string
  fileName: string
  language: string
  vulnerabilities: Array<{
    key: string
    rule: string
    severity: string
    line: number
    message: string
    type: string
  }>
}

interface EnhancedVulnerability {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  type: string
  file: string
  line: number
  description: string
  status: 'detected' | 'analyzing' | 'fixed' | 'failed'
  confidence?: number
  suggestedFix?: string
  aiAnalysis?: string
  code?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json()
    const { code, fileName, language, vulnerabilities } = body

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Enhance vulnerabilities with AI analysis
    const enhancedVulnerabilities: EnhancedVulnerability[] = []

    for (const vuln of vulnerabilities) {
      const enhanced = await enhanceVulnerabilityWithAI(zai, vuln, code, fileName, language)
      enhancedVulnerabilities.push(enhanced)
    }

    // Perform additional AI-based security analysis
    const aiDetectedVulns = await performAISecurityAnalysis(zai, code, fileName, language)
    enhancedVulnerabilities.push(...aiDetectedVulns)

    return NextResponse.json({
      success: true,
      vulnerabilities: enhancedVulnerabilities
    })

  } catch (error: any) {
    console.error('AI analysis failed:', error)
    return NextResponse.json(
      { 
        error: 'AI analysis failed',
        message: error.message
      },
      { status: 500 }
    )
  }
}

async function enhanceVulnerabilityWithAI(
  zai: any, 
  vulnerability: any, 
  code: string, 
  fileName: string, 
  language: string
): Promise<EnhancedVulnerability> {
  try {
    const lineContent = code.split('\n')[vulnerability.line - 1] || ''
    const context = getCodeContext(code, vulnerability.line)

    const prompt = `
Analyze this security vulnerability and provide detailed analysis:

Vulnerability Details:
- Type: ${vulnerability.type}
- Severity: ${vulnerability.severity}
- Line: ${vulnerability.line}
- Message: ${vulnerability.message}

Code Context:
\`\`\`${language}
${context}
\`\`\`

Specific Line:
\`\`\`${language}
${lineContent}
\`\`\`

Please provide:
1. A detailed explanation of the security risk
2. The likelihood of exploitation
3. Potential impact if exploited
4. A specific code fix recommendation
5. Confidence level in your analysis (0-100%)

Respond in JSON format:
{
  "explanation": "Detailed explanation of the security risk",
  "likelihood": "High/Medium/Low",
  "impact": "Critical/High/Medium/Low",
  "suggestedFix": "Specific code fix recommendation",
  "confidence": 85
}
`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a cybersecurity expert specializing in static code analysis and vulnerability remediation. Provide detailed, actionable security analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })

    const aiResponse = JSON.parse(completion.choices[0]?.message?.content || '{}')

    return {
      id: vulnerability.key,
      severity: mapSeverity(vulnerability.severity),
      type: vulnerability.type,
      file: fileName,
      line: vulnerability.line,
      description: vulnerability.message,
      status: 'detected',
      confidence: aiResponse.confidence || 75,
      suggestedFix: aiResponse.suggestedFix,
      aiAnalysis: aiResponse.explanation
    }

  } catch (error) {
    console.error('AI enhancement failed:', error)
    return {
      id: vulnerability.key,
      severity: mapSeverity(vulnerability.severity),
      type: vulnerability.type,
      file: fileName,
      line: vulnerability.line,
      description: vulnerability.message,
      status: 'detected',
      confidence: 70
    }
  }
}

async function performAISecurityAnalysis(
  zai: any, 
  code: string, 
  fileName: string, 
  language: string
): Promise<EnhancedVulnerability[]> {
  try {
    const prompt = `
Perform a comprehensive security analysis of this ${language} code file. Look for security vulnerabilities that might be missed by traditional static analysis tools.

File: ${fileName}

Code:
\`\`\`${language}
${code}
\`\`\`

Focus on detecting:
1. Injection vulnerabilities (SQL, NoSQL, Command, LDAP)
2. Cross-Site Scripting (XSS)
3. Authentication and authorization issues
4. Sensitive data exposure
5. Cryptographic weaknesses
6. Insecure deserialization
7. Security misconfigurations
8. Broken access control
9. Server-Side Request Forgery (SSRF)
10. Business logic flaws

For each vulnerability found, provide:
- Line number
- Vulnerability type
- Severity level
- Description
- Confidence level (0-100)
- Suggested fix

Respond in JSON format with an array of vulnerabilities:
[
  {
    "line": 10,
    "type": "SQL Injection",
    "severity": "critical",
    "description": "SQL query built with user input",
    "confidence": 90,
    "suggestedFix": "Use parameterized queries"
  }
]

If no vulnerabilities are found, return an empty array.
`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert security analyst. Analyze code for security vulnerabilities and provide detailed findings with confidence scores.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    })

    const aiVulnerabilities = JSON.parse(completion.choices[0]?.message?.content || '[]')

    return aiVulnerabilities.map((vuln: any, index: number) => ({
      id: `ai-detected-${Date.now()}-${index}`,
      severity: vuln.severity,
      type: vuln.type,
      file: fileName,
      line: vuln.line,
      description: vuln.description,
      status: 'detected',
      confidence: vuln.confidence,
      suggestedFix: vuln.suggestedFix,
      aiAnalysis: `AI-detected ${vuln.type} vulnerability`
    }))

  } catch (error) {
    console.error('AI security analysis failed:', error)
    return []
  }
}

function getCodeContext(code: string, lineNumber: number, contextLines: number = 3): string {
  const lines = code.split('\n')
  const start = Math.max(0, lineNumber - contextLines - 1)
  const end = Math.min(lines.length, lineNumber + contextLines)
  
  return lines.slice(start, end).join('\n')
}

function mapSeverity(sonarSeverity: string): 'critical' | 'high' | 'medium' | 'low' {
  const mapping: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
    'BLOCKER': 'critical',
    'CRITICAL': 'critical',
    'MAJOR': 'high',
    'MINOR': 'medium',
    'INFO': 'low'
  }

  return mapping[sonarSeverity] || 'medium'
}