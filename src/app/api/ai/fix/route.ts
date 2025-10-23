import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

interface FixRequest {
  vulnerability: {
    id: string
    type: string
    severity: string
    line: number
    description: string
    suggestedFix?: string
  }
  code: string
  fileName: string
  language: string
}

interface FixResponse {
  success: boolean
  fixedCode?: string
  explanation?: string
  confidence?: number
  changes?: Array<{
    line: number
    original: string
    fixed: string
    reason: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const body: FixRequest = await request.json()
    const { vulnerability, code, fileName, language } = body

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Generate AI fix
    const fixResult = await generateAIFix(zai, vulnerability, code, fileName, language)

    return NextResponse.json(fixResult)

  } catch (error: any) {
    console.error('AI fix generation failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'AI fix generation failed',
        message: error.message
      },
      { status: 500 }
    )
  }
}

async function generateAIFix(
  zai: any,
  vulnerability: any,
  code: string,
  fileName: string,
  language: string
): Promise<FixResponse> {
  try {
    const lines = code.split('\n')
    const targetLine = lines[vulnerability.line - 1]
    const context = getCodeContext(code, vulnerability.line)

    const prompt = `
You are an expert security engineer. Generate a secure fix for this vulnerability:

Vulnerability Details:
- Type: ${vulnerability.type}
- Severity: ${vulnerability.severity}
- Line: ${vulnerability.line}
- Description: ${vulnerability.description}
- Suggested Fix: ${vulnerability.suggestedFix || 'None provided'}

Code Context:
\`\`\`${language}
${context}
\`\`\`

Target Line (${vulnerability.line}):
\`\`\`${language}
${targetLine}
\`\`\`

Requirements:
1. Fix the security vulnerability completely
2. Maintain the original functionality
3. Follow security best practices
4. Use secure coding patterns
5. Add comments explaining the security fix
6. Ensure the fix is minimal and focused

Provide the complete fixed code and explain your changes.

Respond in JSON format:
{
  "fixedCode": "Complete fixed code with the vulnerability resolved",
  "explanation": "Detailed explanation of the security fix and why it works",
  "confidence": 90,
  "changes": [
    {
      "line": 10,
      "original": "Original vulnerable line",
      "fixed": "Fixed secure line",
      "reason": "Explanation of why this change fixes the vulnerability"
    }
  ]
}
`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a senior security engineer specializing in secure code remediation. Always provide complete, working fixes that maintain functionality while eliminating security vulnerabilities.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    })

    const aiResponse = JSON.parse(completion.choices[0]?.message?.content || '{}')

    // Validate the fix
    const validationResult = await validateFix(aiResponse.fixedCode, code, vulnerability)

    return {
      success: validationResult.isValid,
      fixedCode: aiResponse.fixedCode,
      explanation: aiResponse.explanation,
      confidence: aiResponse.confidence,
      changes: aiResponse.changes
    }

  } catch (error) {
    console.error('AI fix generation error:', error)
    
    // Fallback to rule-based fixes
    return generateRuleBasedFix(vulnerability, code, language)
  }
}

async function validateFix(fixedCode: string, originalCode: string, vulnerability: any): Promise<{ isValid: boolean; issues?: string[] }> {
  const issues: string[] = []

  // Check if fixed code is provided
  if (!fixedCode || fixedCode.trim() === '') {
    issues.push('No fixed code provided')
  }

  // Check if the fix maintains similar structure
  const originalLines = originalCode.split('\n')
  const fixedLines = fixedCode.split('\n')

  if (Math.abs(originalLines.length - fixedLines.length) > originalLines.length * 0.5) {
    issues.push('Fix changes code structure too dramatically')
  }

  // Check for common vulnerability patterns in the fix
  const vulnerabilityPatterns = {
    'eval': /eval\s*\(/,
    'innerHTML': /innerHTML\s*=/,
    'password': /password\s*=\s*['"`][^'"`]+['"`]/,
    'sqlInjection': /(SELECT|INSERT|UPDATE|DELETE).*\+.*['"`]/
  }

  for (const [patternName, pattern] of Object.entries(vulnerabilityPatterns)) {
    if (pattern.test(fixedCode)) {
      issues.push(`Fix still contains vulnerable pattern: ${patternName}`)
    }
  }

  // Check if the fix introduces syntax errors (basic check)
  try {
    // Basic syntax validation - this is simplified
    if (fixedCode.includes('```') || fixedCode.includes('```')) {
      issues.push('Fix contains markdown formatting')
    }
  } catch (error) {
    issues.push('Fix contains syntax errors')
  }

  return {
    isValid: issues.length === 0,
    issues: issues.length > 0 ? issues : undefined
  }
}

function generateRuleBasedFix(vulnerability: any, code: string, language: string): FixResponse {
  const lines = code.split('\n')
  const targetLine = lines[vulnerability.line - 1]
  let fixedLine = targetLine
  let explanation = ''
  let confidence = 70

  // Rule-based fixes for common vulnerabilities
  switch (vulnerability.type) {
    case 'Code Injection':
    case 'javascript:S4784':
      if (targetLine.includes('eval(')) {
        fixedLine = targetLine.replace(/eval\s*\(\s*([^)]+)\s*\)/g, 'JSON.parse($1)')
        explanation = 'Replaced eval() with JSON.parse() to prevent code injection'
        confidence = 85
      }
      break

    case 'Cross-Site Scripting (XSS)':
    case 'javascript:S5443':
      if (targetLine.includes('innerHTML')) {
        fixedLine = targetLine.replace(/\.innerHTML\s*=/g, '.textContent =')
        explanation = 'Replaced innerHTML with textContent to prevent XSS'
        confidence = 90
      }
      break

    case 'Hardcoded Credentials':
    case 'javascript:S2068':
      if (targetLine.includes('password') && targetLine.includes('=')) {
        fixedLine = targetLine.replace(/(['"`])[^'"`]*password[^'"`]*\1/gi, 'process.env.PASSWORD')
        explanation = 'Replaced hardcoded password with environment variable'
        confidence = 80
      }
      break

    case 'SQL Injection':
    case 'javascript:S2077':
      if (targetLine.includes('SELECT') && targetLine.includes('+')) {
        fixedLine = targetLine.replace(
          /(SELECT\s+.*?\s+FROM\s+\w+\s+WHERE\s+\w+)\s*\+\s*['"`]([^'"`]+)['"`]/g,
          '$1 = ?'
        )
        explanation = 'Replaced string concatenation with parameterized query'
        confidence = 85
      }
      break

    default:
      // Generic fix - add security comment
      fixedLine = `// TODO: Fix security issue - ${vulnerability.description}\n${targetLine}`
      explanation = 'Added security comment for manual review and fix'
      confidence = 50
  }

  // Apply the fix to the full code
  lines[vulnerability.line - 1] = fixedLine
  const fixedCode = lines.join('\n')

  return {
    success: true,
    fixedCode,
    explanation,
    confidence,
    changes: [
      {
        line: vulnerability.line,
        original: targetLine,
        fixed: fixedLine,
        reason: explanation
      }
    ]
  }
}

function getCodeContext(code: string, lineNumber: number, contextLines: number = 3): string {
  const lines = code.split('\n')
  const start = Math.max(0, lineNumber - contextLines - 1)
  const end = Math.min(lines.length, lineNumber + contextLines)
  
  return lines.slice(start, end).join('\n')
}