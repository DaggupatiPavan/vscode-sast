export interface SASTConfig {
  sonarQube: {
    url: string
    token: string
    projectKey: string
    timeout: number
  }
  ai: {
    provider: 'zai' | 'openai' | 'anthropic' | 'local'
    model: string
    confidenceThreshold: number
    autoFix: boolean
    maxTokens: number
    temperature: number
  }
  scanning: {
    autoScan: boolean
    scanOnSave: boolean
    scanOnOpen: boolean
    frequency: 'real-time' | '5min' | '15min' | 'manual'
    excludePatterns: string[]
    includePatterns: string[]
  }
  ide: {
    showDecorations: boolean
    showStatusBar: boolean
    enableNotifications: boolean
    openDashboardOnIssue: boolean
  }
  security: {
    blockCriticalCommits: boolean
    requireCodeReview: boolean
    enforcePolicies: boolean
    maxCriticalIssues: number
    maxHighIssues: number
  }
}

export const defaultConfig: SASTConfig = {
  sonarQube: {
    url: 'http://localhost:9000',
    token: '',
    projectKey: 'sast-integration',
    timeout: 30000
  },
  ai: {
    provider: 'zai',
    model: 'default',
    confidenceThreshold: 85,
    autoFix: false,
    maxTokens: 2000,
    temperature: 0.2
  },
  scanning: {
    autoScan: true,
    scanOnSave: true,
    scanOnOpen: true,
    frequency: 'real-time',
    excludePatterns: ['node_modules/**', 'dist/**', 'build/**'],
    includePatterns: ['**/*.{js,ts,jsx,tsx,py,java,c,cpp}']
  },
  ide: {
    showDecorations: true,
    showStatusBar: true,
    enableNotifications: true,
    openDashboardOnIssue: false
  },
  security: {
    blockCriticalCommits: true,
    requireCodeReview: true,
    enforcePolicies: true,
    maxCriticalIssues: 0,
    maxHighIssues: 5
  }
}

class ConfigManager {
  private config: SASTConfig
  private listeners: Array<(config: SASTConfig) => void> = []

  constructor() {
    this.config = { ...defaultConfig }
    this.loadConfig()
  }

  private loadConfig(): void {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('sast-config')
        if (saved) {
          this.config = { ...defaultConfig, ...JSON.parse(saved) }
        }
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    }
  }

  private saveConfig(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sast-config', JSON.stringify(this.config))
      }
    } catch (error) {
      console.error('Failed to save config:', error)
    }
  }

  getConfig(): SASTConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<SASTConfig>): void {
    this.config = this.mergeConfig(this.config, updates)
    this.saveConfig()
    this.notifyListeners()
  }

  private mergeConfig(base: SASTConfig, updates: Partial<SASTConfig>): SASTConfig {
    const merged = { ...base }
    
    for (const [key, value] of Object.entries(updates)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        merged[key as keyof SASTConfig] = { 
          ...merged[key as keyof SASTConfig] as any, 
          ...value 
        }
      } else {
        merged[key as keyof SASTConfig] = value as any
      }
    }
    
    return merged
  }

  subscribe(listener: (config: SASTConfig) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.config))
  }

  resetConfig(): void {
    this.config = { ...defaultConfig }
    this.saveConfig()
    this.notifyListeners()
  }

  validateConfig(config: Partial<SASTConfig>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate SonarQube config
    if (config.sonarQube) {
      if (config.sonarQube.url && !this.isValidUrl(config.sonarQube.url)) {
        errors.push('SonarQube URL is not valid')
      }
      if (config.sonarQube.timeout && (config.sonarQube.timeout < 1000 || config.sonarQube.timeout > 300000)) {
        errors.push('SonarQube timeout must be between 1000ms and 300000ms')
      }
    }

    // Validate AI config
    if (config.ai) {
      if (config.ai.confidenceThreshold && (config.ai.confidenceThreshold < 0 || config.ai.confidenceThreshold > 100)) {
        errors.push('AI confidence threshold must be between 0 and 100')
      }
      if (config.ai.maxTokens && (config.ai.maxTokens < 100 || config.ai.maxTokens > 8000)) {
        errors.push('AI max tokens must be between 100 and 8000')
      }
      if (config.ai.temperature && (config.ai.temperature < 0 || config.ai.temperature > 2)) {
        errors.push('AI temperature must be between 0 and 2')
      }
    }

    // Validate security config
    if (config.security) {
      if (config.security.maxCriticalIssues !== undefined && config.security.maxCriticalIssues < 0) {
        errors.push('Max critical issues cannot be negative')
      }
      if (config.security.maxHighIssues !== undefined && config.security.maxHighIssues < 0) {
        errors.push('Max high issues cannot be negative')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  exportConfig(): string {
    return JSON.stringify(this.config, null, 2)
  }

  importConfig(configJson: string): { success: boolean; error?: string } {
    try {
      const imported = JSON.parse(configJson)
      const validation = this.validateConfig(imported)
      
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        }
      }

      this.updateConfig(imported)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: 'Invalid JSON format'
      }
    }
  }
}

export const configManager = new ConfigManager()
export default configManager