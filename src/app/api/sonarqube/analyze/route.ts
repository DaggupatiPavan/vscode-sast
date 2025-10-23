import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

interface AnalysisRequest {
  code: string
  fileName: string
  language: string
  projectKey: string
}

interface SonarIssue {
  key: string
  rule: string
  severity: string
  component: string
  line: number
  message: string
  type: string
  debt: string
  status: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json()
    const { code, fileName, language, projectKey } = body

    // Get SonarQube configuration from environment or request
    const sonarQubeUrl = process.env.SONARQUBE_URL || 'http://localhost:9000'
    const sonarQubeToken = process.env.SONARQUBE_TOKEN || ''

    if (!sonarQubeUrl) {
      return NextResponse.json(
        { error: 'SonarQube URL not configured' },
        { status: 400 }
      )
    }

    // Create or ensure project exists
    await ensureProject(sonarQubeUrl, sonarQubeToken, projectKey)

    // Upload code for analysis
    await uploadCode(sonarQubeUrl, sonarQubeToken, projectKey, fileName, code)

    // Trigger analysis
    const analysisTask = await triggerAnalysis(sonarQubeUrl, sonarQubeToken, projectKey, fileName)

    // Wait for analysis to complete (with timeout)
    const issues = await waitForAnalysis(sonarQubeUrl, sonarQubeToken, analysisTask)

    // Enhance with additional security analysis
    const enhancedIssues = await enhanceWithSecurityAnalysis(code, issues, language)

    return NextResponse.json({
      success: true,
      issues: enhancedIssues,
      analysisTask
    })

  } catch (error: any) {
    console.error('SonarQube analysis failed:', error)
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        message: error.message,
        details: error.response?.data || error.stack
      },
      { status: 500 }
    )
  }
}

async function ensureProject(url: string, token: string, projectKey: string) {
  try {
    // Check if project exists
    const response = await axios.get(`${url}/api/projects/search`, {
      params: { projects: projectKey },
      headers: getAuthHeaders(token)
    })

    if (response.data.components.length === 0) {
      // Create project if it doesn't exist
      await axios.post(`${url}/api/projects/create`, null, {
        params: {
          project: projectKey,
          name: projectKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        },
        headers: getAuthHeaders(token)
      })
    }
  } catch (error) {
    throw new Error(`Failed to ensure project exists: ${error.message}`)
  }
}

async function uploadCode(url: string, token: string, projectKey: string, fileName: string, code: string) {
  try {
    const formData = new FormData()
    formData.append('file', new Blob([code]), fileName)

    await axios.post(`${url}/api/sources/raw`, formData, {
      params: {
        key: projectKey
      },
      headers: {
        ...getAuthHeaders(token),
        'Content-Type': 'multipart/form-data'
      }
    })
  } catch (error) {
    throw new Error(`Failed to upload code: ${error.message}`)
  }
}

async function triggerAnalysis(url: string, token: string, projectKey: string, fileName: string) {
  try {
    // In a real implementation, you would trigger a SonarQube scan
    // For now, we'll simulate the analysis
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      id: analysisId,
      status: 'SUCCESS',
      component: `${projectKey}:${fileName}`
    }
  } catch (error) {
    throw new Error(`Failed to trigger analysis: ${error.message}`)
  }
}

async function waitForAnalysis(url: string, token: string, analysisTask: any): Promise<SonarIssue[]> {
  try {
    // In a real implementation, you would poll the SonarQube API for analysis results
    // For now, we'll return mock issues based on the analysis task
    
    // Simulate additional delay for analysis
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return [] // Return empty for now, will be enhanced with mock data
  } catch (error) {
    throw new Error(`Failed to wait for analysis: ${error.message}`)
  }
}

async function enhanceWithSecurityAnalysis(code: string, sonarIssues: SonarIssue[], language: string): Promise<SonarIssue[]> {
  const enhancedIssues = [...sonarIssues]
  
  // Add custom security analysis
  const securityIssues = analyzeSecurityPatterns(code, language)
  enhancedIssues.push(...securityIssues)
  
  return enhancedIssues
}

function analyzeSecurityPatterns(code: string, language: string): SonarIssue[] {
  const issues: SonarIssue[] = []
  const lines = code.split('\n')

  lines.forEach((line, index) => {
    const lineNumber = index + 1

    // JavaScript/TypeScript security patterns
    if (['javascript', 'typescript'].includes(language)) {
      // Check for eval usage
      if (line.includes('eval(') || line.includes('Function(')) {
        issues.push({
          key: `security-eval-${lineNumber}`,
          rule: 'javascript:S4784',
          severity: 'CRITICAL',
          component: 'file',
          line: lineNumber,
          message: 'Using eval or Function constructor can lead to code injection vulnerabilities',
          type: 'VULNERABILITY',
          debt: '5min',
          status: 'OPEN'
        })
      }

      // Check for innerHTML usage
      if (line.includes('innerHTML') || line.includes('outerHTML')) {
        issues.push({
          key: `security-innerhtml-${lineNumber}`,
          rule: 'javascript:S5443',
          severity: 'BLOCKER',
          component: 'file',
          line: lineNumber,
          message: 'Using innerHTML can expose the application to Cross-Site Scripting (XSS) attacks',
          type: 'VULNERABILITY',
          debt: '10min',
          status: 'OPEN'
        })
      }

      // Check for hardcoded passwords
      if (line.includes('password') && line.includes('=')) {
        issues.push({
          key: `security-password-${lineNumber}`,
          rule: 'javascript:S2068',
          severity: 'CRITICAL',
          component: 'file',
          line: lineNumber,
          message: 'Hardcoded credentials detected in source code',
          type: 'VULNERABILITY',
          debt: '5min',
          status: 'OPEN'
        })
      }

      // Check for SQL injection patterns
      if (line.includes('SELECT') && line.includes('FROM') && line.includes('+')) {
        issues.push({
          key: `security-sql-${lineNumber}`,
          rule: 'javascript:S2077',
          severity: 'CRITICAL',
          component: 'file',
          line: lineNumber,
          message: 'SQL query built from user input can lead to SQL injection',
          type: 'VULNERABILITY',
          debt: '15min',
          status: 'OPEN'
        })
      }
    }

    // Python security patterns
    if (language === 'python') {
      // Check for eval usage
      if (line.includes('eval(')) {
        issues.push({
          key: `security-eval-${lineNumber}`,
          rule: 'python:S4823',
          severity: 'CRITICAL',
          component: 'file',
          line: lineNumber,
          message: 'Using eval can lead to code injection vulnerabilities',
          type: 'VULNERABILITY',
          debt: '5min',
          status: 'OPEN'
        })
      }

      // Check for shell command execution
      if (line.includes('os.system') || line.includes('subprocess.call')) {
        issues.push({
          key: `security-shell-${lineNumber}`,
          rule: 'python:S4817',
          severity: 'CRITICAL',
          component: 'file',
          line: lineNumber,
          message: 'Executing shell commands with user input can lead to command injection',
          type: 'VULNERABILITY',
          debt: '10min',
          status: 'OPEN'
        })
      }
    }

    // Java security patterns
    if (language === 'java') {
      // Check for SQL injection
      if (line.includes('Statement') && line.includes('executeQuery')) {
        issues.push({
          key: `security-sql-${lineNumber}`,
          rule: 'java:S2077',
          severity: 'CRITICAL',
          component: 'file',
          line: lineNumber,
          message: 'SQL query built from user input can lead to SQL injection',
          type: 'VULNERABILITY',
          debt: '15min',
          status: 'OPEN'
        })
      }

      // Check for deserialization
      if (line.includes('ObjectInputStream') || line.includes('readObject')) {
        issues.push({
          key: `security-deserialization-${lineNumber}`,
          rule: 'java:S4823',
          severity: 'CRITICAL',
          component: 'file',
          line: lineNumber,
          message: 'Deserializing untrusted data can lead to remote code execution',
          type: 'VULNERABILITY',
          debt: '20min',
          status: 'OPEN'
        })
      }
    }
  })

  return issues
}

function getAuthHeaders(token: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}