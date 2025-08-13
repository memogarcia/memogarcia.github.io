import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function detectInputType(input: string): 'error' | 'code' | 'log' | 'business' | 'general' {
  const errorKeywords = ['error', 'exception', 'failed', 'crash', 'bug']
  const codeKeywords = ['function', 'class', 'import', 'const', 'let', 'var']
  const logKeywords = ['[INFO]', '[ERROR]', '[WARN]', 'timestamp', 'level']
  
  const lowerInput = input.toLowerCase()
  
  if (errorKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'error'
  }
  
  if (codeKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'code'
  }
  
  if (logKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'log'
  }
  
  // Simple heuristic for business issues
  if (lowerInput.includes('metric') || lowerInput.includes('revenue') || lowerInput.includes('user')) {
    return 'business'
  }
  
  return 'general'
}