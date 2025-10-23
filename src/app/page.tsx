'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { RealTimeScanner } from '@/components/real-time-scanner'
import { AIFixHistory } from '@/components/ai-fix-history'
import { 
  Shield, 
  Code, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  Activity,
  Zap,
  Brain,
  GitBranch,
  Clock,
  TrendingUp,
  Eye,
  BarChart3,
  Terminal,
  Lock,
  FileCode,
  Cpu
} from 'lucide-react'

interface Vulnerability {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  type: string
  file: string
  line: number
  description: string
  status: 'detected' | 'analyzing' | 'fixed' | 'failed'
  aiFix?: string
  confidence?: number
}

interface ProjectMetrics {
  totalFiles: number
  vulnerabilitiesFound: number
  vulnerabilitiesFixed: number
  codeQualityScore: number
  securityScore: number
  lastScan: string
}

export default function SASTDashboard() {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([
    {
      id: '1',
      severity: 'critical',
      type: 'SQL Injection',
      file: 'src/api/users.ts',
      line: 45,
      description: 'Potential SQL injection vulnerability in database query',
      status: 'analyzing',
      confidence: 92
    },
    {
      id: '2',
      severity: 'high',
      type: 'XSS',
      file: 'src/components/Comment.tsx',
      line: 23,
      description: 'Cross-site scripting vulnerability in user input rendering',
      status: 'detected',
      confidence: 88
    },
    {
      id: '3',
      severity: 'medium',
      type: 'Hardcoded Credentials',
      file: 'src/config/database.ts',
      line: 12,
      description: 'Hardcoded database credentials detected',
      status: 'fixed',
      aiFix: 'Replaced hardcoded credentials with environment variables',
      confidence: 95
    }
  ])

  const [metrics, setMetrics] = useState<ProjectMetrics>({
    totalFiles: 156,
    vulnerabilitiesFound: 23,
    vulnerabilitiesFixed: 18,
    codeQualityScore: 78,
    securityScore: 82,
    lastScan: '2 minutes ago'
  })

  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fixed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'analyzing': return <Brain className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const startScan = async () => {
    setIsScanning(true)
    setScanProgress(0)
    
    // Simulate scan progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsScanning(false)
          return 100
        }
        return prev + 10
      })
    }, 500)
  }

  const applyAIFix = async (vulnerabilityId: string) => {
    setVulnerabilities(prev => 
      prev.map(v => 
        v.id === vulnerabilityId 
          ? { ...v, status: 'analyzing' as const }
          : v
      )
    )

    // Simulate AI fix process
    setTimeout(() => {
      setVulnerabilities(prev => 
        prev.map(v => 
          v.id === vulnerabilityId 
            ? { 
                ...v, 
                status: 'fixed' as const,
                aiFix: 'AI automatically applied security patch and updated code'
              }
            : v
        )
      )
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              SAST IDE Integration
            </h1>
            <p className="text-muted-foreground mt-2">
              AI-powered static application security testing with real-time vulnerability detection and auto-fix
            </p>
          </div>
          <Button 
            onClick={startScan} 
            disabled={isScanning}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            {isScanning ? 'Scanning...' : 'Start Scan'}
          </Button>
        </div>

        {/* Progress Bar */}
        {isScanning && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Scanning files...</span>
                  <span>{scanProgress}%</span>
                </div>
                <Progress value={scanProgress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.securityScore}%</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +5% from last scan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Code Quality</CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.codeQualityScore}%</div>
              <p className="text-xs text-muted-foreground">
                Based on SonarQube analysis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.vulnerabilitiesFound - metrics.vulnerabilitiesFixed}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.vulnerabilitiesFixed} of {metrics.vulnerabilitiesFound} fixed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Scan</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalFiles}</div>
              <p className="text-xs text-muted-foreground">
                Files scanned {metrics.lastScan}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
            <TabsTrigger value="scanner">Real-Time Scanner</TabsTrigger>
            <TabsTrigger value="ai-fixes">AI Auto-Fixes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Enhanced Overview Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Security Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Security Score</span>
                          <span className="font-medium">{metrics.securityScore}%</span>
                        </div>
                        <Progress value={metrics.securityScore} className="w-full" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Code Quality</span>
                          <span className="font-medium">{metrics.codeQualityScore}%</span>
                        </div>
                        <Progress value={metrics.codeQualityScore} className="w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Real-Time Monitoring
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RealTimeScanner 
                      onVulnerabilityFound={(vuln) => {
                        setVulnerabilities(prev => [vuln, ...prev.slice(0, 9)])
                      }}
                      onScanComplete={(result) => {
                        setMetrics(prev => ({
                          ...prev,
                          vulnerabilitiesFound: prev.vulnerabilitiesFound + result.vulnerabilitiesFound
                        }))
                      }}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Terminal className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={startScan} 
                      disabled={isScanning}
                      className="w-full flex items-center gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      {isScanning ? 'Scanning...' : 'Start Full Scan'}
                    </Button>
                    <Button variant="outline" className="w-full flex items-center gap-2">
                      <FileCode className="h-4 w-4" />
                      Scan Current File
                    </Button>
                    <Button variant="outline" className="w-full flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Security Check
                    </Button>
                    <Button variant="outline" className="w-full flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Configure Settings
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>3 vulnerabilities fixed</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span>2 new issues detected</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Brain className="h-4 w-4 text-blue-500" />
                        <span>AI model updated</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>Last scan: 5 min ago</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vulnerabilities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detected Vulnerabilities</CardTitle>
                <CardDescription>
                  Security issues found by SonarQube analysis with AI-powered fix suggestions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {vulnerabilities.map((vuln) => (
                      <div key={vuln.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(vuln.status)}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge className={`${getSeverityColor(vuln.severity)} text-white`}>
                                  {vuln.severity.toUpperCase()}
                                </Badge>
                                <span className="font-medium">{vuln.type}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {vuln.file}:{vuln.line}
                              </p>
                              <p className="text-sm">{vuln.description}</p>
                              {vuln.confidence && (
                                <p className="text-xs text-muted-foreground">
                                  AI Confidence: {vuln.confidence}%
                                </p>
                              )}
                            </div>
                          </div>
                          {vuln.status === 'detected' && (
                            <Button 
                              size="sm" 
                              onClick={() => applyAIFix(vuln.id)}
                              className="flex items-center gap-2"
                            >
                              <Brain className="h-3 w-3" />
                              AI Fix
                            </Button>
                          )}
                        </div>
                        {vuln.aiFix && (
                          <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>AI Applied Fix:</strong> {vuln.aiFix}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scanner" className="space-y-4">
            <RealTimeScanner />
          </TabsContent>

          <TabsContent value="ai-fixes" className="space-y-4">
            <AIFixHistory />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Security Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Vulnerability Trend</span>
                        <span className="text-green-600">↓ 15%</span>
                      </div>
                      <Progress value={85} className="w-full" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Fix Success Rate</span>
                        <span className="text-green-600">92%</span>
                      </div>
                      <Progress value={92} className="w-full" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>AI Model Accuracy</span>
                        <span className="text-blue-600">88%</span>
                      </div>
                      <Progress value={88} className="w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    System Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Scan Speed</span>
                      <span className="text-sm font-medium">2.3s/file</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">AI Response Time</span>
                      <span className="text-sm font-medium">1.2s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Memory Usage</span>
                      <span className="text-sm font-medium">256MB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">CPU Usage</span>
                      <span className="text-sm font-medium">12%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Integration Settings
                </CardTitle>
                <CardDescription>
                  Configure SonarQube connection and AI model preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">SonarQube Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Server URL</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border rounded-md"
                          placeholder="http://localhost:9000"
                          defaultValue="http://localhost:9000"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Project Key</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border rounded-md"
                          placeholder="my-project"
                          defaultValue="sast-integration"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Authentication Token</label>
                        <input 
                          type="password" 
                          className="w-full p-2 border rounded-md"
                          placeholder="Your SonarQube token"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">AI Model Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Model Provider</label>
                        <select className="w-full p-2 border rounded-md">
                          <option>ZAI Web Dev SDK</option>
                          <option>OpenAI GPT-4</option>
                          <option>Anthropic Claude</option>
                          <option>Local Llama</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Auto-Fix Threshold</label>
                        <input 
                          type="range" 
                          min="70" 
                          max="100" 
                          defaultValue="85"
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">Minimum confidence for auto-fix: 85%</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Scan Frequency</label>
                        <select className="w-full p-2 border rounded-md">
                          <option>Real-time</option>
                          <option>Every 5 minutes</option>
                          <option>Every 15 minutes</option>
                          <option>Manual only</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">IDE Integration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">VS Code Extension</span>
                        <Badge className="bg-green-500 text-white">Connected</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Real-time Scanning</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto-fix on Save</span>
                        <Badge variant="outline">Disabled</Badge>
                      </div>
                      <Button variant="outline" className="w-full mt-2">
                        Configure IDE Settings
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Security Policies</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Block Critical Issues</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Require Code Review</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto-fix High Confidence</span>
                        <Badge variant="outline">Disabled</Badge>
                      </div>
                      <Button variant="outline" className="w-full mt-2">
                        Edit Security Policies
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}