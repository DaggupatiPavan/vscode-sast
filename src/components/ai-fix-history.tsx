'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Zap,
  Code,
  Shield,
  AlertTriangle,
  BarChart3
} from 'lucide-react'

interface FixRecord {
  id: string
  vulnerabilityType: string
  severity: string
  fileName: string
  line: number
  originalCode: string
  fixedCode: string
  confidence: number
  timestamp: Date
  status: 'applied' | 'pending' | 'failed'
  explanation: string
}

interface AIMetrics {
  totalFixes: number
  successRate: number
  averageConfidence: number
  averageTime: number
  fixesByType: Record<string, number>
  fixesBySeverity: Record<string, number>
  learningProgress: number
}

export function AIFixHistory() {
  const [fixHistory, setFixHistory] = useState<FixRecord[]>([])
  const [metrics, setMetrics] = useState<AIMetrics>({
    totalFixes: 0,
    successRate: 0,
    averageConfidence: 0,
    averageTime: 0,
    fixesByType: {},
    fixesBySeverity: {},
    learningProgress: 0
  })

  useEffect(() => {
    // Load mock data
    const mockFixes: FixRecord[] = [
      {
        id: '1',
        vulnerabilityType: 'SQL Injection',
        severity: 'critical',
        fileName: 'src/api/users.ts',
        line: 45,
        originalCode: "const query = 'SELECT * FROM users WHERE id = ' + userId",
        fixedCode: "const query = 'SELECT * FROM users WHERE id = ?'",
        confidence: 92,
        timestamp: new Date(Date.now() - 3600000),
        status: 'applied',
        explanation: 'Replaced string concatenation with parameterized query to prevent SQL injection'
      },
      {
        id: '2',
        vulnerabilityType: 'Cross-Site Scripting',
        severity: 'high',
        fileName: 'src/components/Comment.tsx',
        line: 23,
        originalCode: 'div.innerHTML = userComment',
        fixedCode: 'div.textContent = userComment',
        confidence: 88,
        timestamp: new Date(Date.now() - 7200000),
        status: 'applied',
        explanation: 'Replaced innerHTML with textContent to prevent XSS attacks'
      },
      {
        id: '3',
        vulnerabilityType: 'Hardcoded Credentials',
        severity: 'critical',
        fileName: 'src/config/database.ts',
        line: 12,
        originalCode: "const password = 'admin123'",
        fixedCode: "const password = process.env.DB_PASSWORD",
        confidence: 95,
        timestamp: new Date(Date.now() - 10800000),
        status: 'applied',
        explanation: 'Moved hardcoded password to environment variables'
      },
      {
        id: '4',
        vulnerabilityType: 'Code Injection',
        severity: 'critical',
        fileName: 'src/utils/evaluator.ts',
        line: 67,
        originalCode: 'const result = eval(userInput)',
        fixedCode: 'const result = JSON.parse(userInput)',
        confidence: 90,
        timestamp: new Date(Date.now() - 14400000),
        status: 'failed',
        explanation: 'Fix failed - JSON.parse cannot handle the input format'
      }
    ]

    setFixHistory(mockFixes)
    calculateMetrics(mockFixes)
  }, [])

  const calculateMetrics = (fixes: FixRecord[]) => {
    const successfulFixes = fixes.filter(f => f.status === 'applied')
    const totalFixes = fixes.length
    
    const fixesByType = fixes.reduce((acc, fix) => {
      acc[fix.vulnerabilityType] = (acc[fix.vulnerabilityType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const fixesBySeverity = fixes.reduce((acc, fix) => {
      acc[fix.severity] = (acc[fix.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    setMetrics({
      totalFixes,
      successRate: totalFixes > 0 ? (successfulFixes.length / totalFixes) * 100 : 0,
      averageConfidence: totalFixes > 0 
        ? fixes.reduce((sum, fix) => sum + fix.confidence, 0) / totalFixes 
        : 0,
      averageTime: 2.3, // Mock average time in seconds
      fixesByType,
      fixesBySeverity,
      learningProgress: 78 // Mock learning progress
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fixes</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalFixes}</div>
            <p className="text-xs text-muted-foreground">
              AI-generated fixes applied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Fixes successfully applied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageConfidence.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              AI model confidence level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Progress</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.learningProgress}%</div>
            <p className="text-xs text-muted-foreground">
              Model improvement progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Fix History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="learning">Model Learning</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent AI Fixes
              </CardTitle>
              <CardDescription>
                History of AI-generated vulnerability fixes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {fixHistory.map((fix) => (
                    <div key={fix.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(fix.status)}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={`${getSeverityColor(fix.severity)} text-white`}>
                                {fix.severity.toUpperCase()}
                              </Badge>
                              <span className="font-medium">{fix.vulnerabilityType}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {fix.fileName}:{fix.line} • {formatTimeAgo(fix.timestamp)}
                            </p>
                            <p className="text-sm">{fix.explanation}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Brain className="h-3 w-3" />
                              Confidence: {fix.confidence}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Code Comparison */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Code Changes:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <div className="text-xs text-red-600 font-medium">Original:</div>
                            <div className="bg-red-50 border border-red-200 rounded p-2 text-xs font-mono">
                              {fix.originalCode}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-green-600 font-medium">Fixed:</div>
                            <div className="bg-green-50 border border-green-200 rounded p-2 text-xs font-mono">
                              {fix.fixedCode}
                            </div>
                          </div>
                        </div>
                      </div>

                      {fix.status === 'failed' && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Fix application failed. Manual review required.
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

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fixes by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics.fixesByType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(count / metrics.totalFixes) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fixes by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics.fixesBySeverity).map(([severity, count]) => (
                    <div key={severity} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor(severity)}`} />
                        <span className="text-sm capitalize">{severity}</span>
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Average Fix Time</span>
                    <span className="font-medium">{metrics.averageTime}s</span>
                  </div>
                  <Progress value={75} className="w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Model Accuracy</span>
                    <span className="font-medium">{metrics.successRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.successRate} className="w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Confidence Level</span>
                    <span className="font-medium">{metrics.averageConfidence.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.averageConfidence} className="w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Model Learning Progress
              </CardTitle>
              <CardDescription>
                Machine learning model improvement over time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Training Progress</span>
                  <span>{metrics.learningProgress}%</span>
                </div>
                <Progress value={metrics.learningProgress} className="w-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Learning Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Training Samples</span>
                      <span className="font-medium">1,247</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Model Version</span>
                      <span className="font-medium">v2.3.1</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Training</span>
                      <span className="font-medium">2 hours ago</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Accuracy Improvement</span>
                      <span className="font-medium text-green-600">+12%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Model Capabilities</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">SQL Injection Detection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">XSS Prevention</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Authentication Issues</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Business Logic Flaws</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <Brain className="h-4 w-4" />
                <AlertDescription>
                  The AI model continuously learns from applied fixes and developer feedback to improve accuracy and expand vulnerability detection capabilities.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}