import type { AIProvider } from '@/types'
import { MockAIProvider } from './mockProvider'

// AI Provider factory based on environment variables
export function createAIProvider(): AIProvider {
  const aiRemote = import.meta.env.VITE_AI_REMOTE === 'on'
  const aiProvider = import.meta.env.VITE_AI_PROVIDER || 'mock'
  
  if (!aiRemote || aiProvider === 'mock') {
    return new MockAIProvider()
  }
  
  // Future: Add real AI providers
  switch (aiProvider) {
    case 'openai':
      throw new Error('OpenAI provider not implemented yet')
    case 'anthropic':
      throw new Error('Anthropic provider not implemented yet')
    default:
      return new MockAIProvider()
  }
}

// Global AI provider instance
export const aiProvider = createAIProvider()