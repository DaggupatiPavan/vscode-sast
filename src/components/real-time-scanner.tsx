'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  Scan, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Zap,
  Eye,
  Settings
} from 'lucide-react'

interface ScanResult {
  id: string
  fileName: string
  status: 'scanning' | 'completed' | 'error'
  vulnerabilitiesFound: number
  scanTime: number
  timestamp: Date
}

interface RealTimeScannerProps {
  onVulnerabilityFound?: (vulnerability: any) => void
  onScanComplete?: (result: ScanResult) => void
}

export function RealTimeScanner({ onVulnerabilityFound, onScanComplete }: RealTimeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState('')
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [totalFiles, setTotalFiles] = useState(0)
  const [autoScan, setAutoScan] = useState(true)

  // Simulate real-time file monitoring
  useEffect(() => {
    if (!autoScan) return

    const interval = setInterval(() => {
      // Simulate file change detection
      const files = [
        'src/components/dashboard.tsx',
        'src/api/auth.ts',
        'src/utils/database.ts',
        'src/middleware/security.ts'
      ]
      
      const randomFile = files[Math.floor(Math.random() * files.length)]
      handleFileChange(randomFile)
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [autoScan])

  const handleFileChange = useCallback(async (fileName: string) => {
    if (isScanning) return

    const scanResult: ScanResult = {
      id: `scan-${Date.now()}`,
      fileName,
      status: 'scanning',
      vulnerabilitiesFound: 0,
      scanTime: 0,
      timestamp: new Date()
    }

    setScanResults(prev => [scanResult, ...prev.slice(0, 9)]) // Keep last 10 results
    setCurrentFile(fileName)
    setIsScanning(true)
    setScanProgress(0)

    try {
      // Simulate scanning process
      const startTime = Date.now()
      
      for (let i = 0; i <= 100; i += 10) {
        setScanProgress(i)
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      const scanTime = Date.now() - startTime
      const vulnerabilitiesFound = Math.floor(Math.random() * 5) // Simulate finding 0-4 vulnerabilities

      const completedResult: ScanResult = {
        ...scanResult,
        status: 'completed',
        vulnerabilitiesFound,
        scanTime
      }

      setScanResults(prev => 
        prev.map(r => r.id === scanResult.id ? completedResult : r)
      )

      if (vulnerabilitiesFound > 0 && onVulnerabilityFound) {
        // Simulate vulnerability found
        onVulnerabilityFound({
          id: `vuln-${Date.now()}`,
          fileName,
          severity: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)],
          type: 'Security Issue',
          line: Math.floor(Math.random() * 100) + 1,
          description: 'Security vulnerability detected by real-time scanner'
        })
      }

      if (onScanComplete) {
        onScanComplete(completedResult)
      }

    } catch (error) {
      const errorResult: ScanResult = {
        ...scanResult,
        status: 'error',
        vulnerabilitiesFound: 0,
        scanTime: 0
      }

      setScanResults(prev => 
        prev.map(r => r.id === scanResult.id ? errorResult : r)
      )
    } finally {
      setIsScanning(false)
      setCurrentFile('')
      setScanProgress(0)
    }
  }, [isScanning, onVulnerabilityFound, onScanComplete])

  const startManualScan = async () => {
    const files = [
      'src/app/page.tsx',
      'src/components/ui/button.tsx',
      'src/lib/utils.ts',
      'src/hooks/use-toast.ts'
    ]

    setTotalFiles(files.length)
    
    for (const fileName of files) {
      await handleFileChange(fileName)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'scanning': return <Scan className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityColor = (count: number) => {
    if (count === 0) return 'bg-green-500'
    if (count <= 2) return 'bg-yellow-500'
    if (count <= 4) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-4">
      {/* Scanner Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-Time Security Scanner
          </CardTitle>
          <CardDescription>
            Continuously monitors files for security vulnerabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                onClick={startManualScan}
                disabled={isScanning}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {isScanning ? 'Scanning...' : 'Start Manual Scan'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoScan(!autoScan)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Auto-Scan: {autoScan ? 'ON' : 'OFF'}
              </Button>
            </div>
            
            {isScanning && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Scan className="h-4 w-4 animate-spin" />
                {currentFile}
              </div>
            )}
          </div>

          {isScanning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Scanning progress</span>
                <span>{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Recent Scan Results
            </span>
            <Badge variant="outline">
              {scanResults.filter(r => r.vulnerabilitiesFound > 0).length} issues found
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {scanResults.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No scans performed yet. Start a scan to see results.
                </div>
              ) : (
                scanResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <div className="font-medium text-sm">{result.fileName}</div>
                        <div className="text-xs text-muted-foreground">
                          {result.timestamp.toLocaleTimeString()} • {result.scanTime}ms
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {result.vulnerabilitiesFound > 0 && (
                        <Badge 
                          className={`${getSeverityColor(result.vulnerabilitiesFound)} text-white`}
                        >
                          {result.vulnerabilitiesFound} issues
                        </Badge>
                      )}
                      {result.status === 'completed' && result.vulnerabilitiesFound === 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Secure
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Scanner Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scanner Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Status</span>
                <span className={isScanning ? 'text-blue-600' : 'text-green-600'}>
                  {isScanning ? 'Active' : 'Idle'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Auto-Scan</span>
                <span className={autoScan ? 'text-green-600' : 'text-gray-600'}>
                  {autoScan ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Scans</span>
                <span>{scanResults.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Issues Found</span>
                <span className="text-orange-600">
                  {scanResults.reduce((sum, r) => sum + r.vulnerabilitiesFound, 0)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}