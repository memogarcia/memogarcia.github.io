import type { ModeType, MapNode, MapEdge, DrillerProject } from '@/types'
import { generateId, getCurrentTimestamp } from '@/utils'

export interface ModeStrategy {
  name: string
  description: string
  suggestedNodeTypes: string[]
  defaultLayout: 'hierarchical' | 'radial' | 'force'
  generateInitialStructure(_rootNode: MapNode): { nodes: MapNode[]; edges: MapEdge[] }
  validateStructure(_project: DrillerProject): { isValid: boolean; errors: string[] }
}

export class FiveWhysMode implements ModeStrategy {
  name = '5 Whys'
  description = 'Linear chain of cause-and-effect questioning to reach root causes'
  suggestedNodeTypes = ['question', 'answer', 'cause']
  defaultLayout = 'hierarchical' as const

  generateInitialStructure(_rootNode: MapNode): { nodes: MapNode[]; edges: MapEdge[] } {
    return { nodes: [], edges: [] }
  }

  validateStructure(project: DrillerProject): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const whyNodes = project.nodes.filter(n => n.meta.mode === '5whys')
    
    // Check for reasonable depth (not too shallow, not too deep)
    if (whyNodes.length > 8) {
      errors.push('5 Whys chain is getting very deep - consider if you\'ve reached root cause')
    }
    
    return { isValid: errors.length === 0, errors }
  }
}

export class IssueTreeMode implements ModeStrategy {
  name = 'Issue Tree'
  description = 'MECE (Mutually Exclusive, Collectively Exhaustive) breakdown of problems'
  suggestedNodeTypes = ['category', 'cause', 'hypothesis']
  defaultLayout = 'hierarchical' as const

  generateInitialStructure(_rootNode: MapNode): { nodes: MapNode[]; edges: MapEdge[] } {
    return { nodes: [], edges: [] }
  }

  validateStructure(project: DrillerProject): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const treeNodes = project.nodes.filter(n => n.meta.mode === 'issue-tree')
    
    // Check for MECE principles
    const categories = treeNodes.filter(n => n.type === 'category')
    if (categories.length > 0 && categories.length < 2) {
      errors.push('Issue tree should have multiple categories for effective MECE analysis')
    }
    
    return { isValid: errors.length === 0, errors }
  }
}

export class IshikawaMode implements ModeStrategy {
  name = 'Ishikawa (Fishbone)'
  description = 'Categorical analysis using predefined categories (Code, Config, Data, Infrastructure, External)'
  suggestedNodeTypes = ['category', 'cause', 'evidence']
  defaultLayout = 'radial' as const

  generateInitialStructure(rootNode: MapNode): { nodes: MapNode[]; edges: MapEdge[] } {
    const now = getCurrentTimestamp()
    const categories = ['Code', 'Configuration', 'Data', 'Infrastructure', 'External']
    
    const nodes: MapNode[] = categories.map((category, index) => ({
      id: generateId(),
      type: 'category' as const,
      title: category,
      body: this.getCategoryDescription(category),
      attachments: [],
      meta: {
        mode: 'ishikawa' as const,
        createdAt: now,
        updatedAt: now,
        tags: ['ishikawa-category']
      },
      position: {
        x: Math.cos((index * 2 * Math.PI) / categories.length) * 300,
        y: Math.sin((index * 2 * Math.PI) / categories.length) * 300
      }
    }))

    const edges: MapEdge[] = nodes.map(node => ({
      id: generateId(),
      from: rootNode.id,
      to: node.id,
      label: 'category'
    }))

    return { nodes, edges }
  }

  private getCategoryDescription(category: string): string {
    const descriptions = {
      'Code': 'Bugs, logic errors, performance issues, code quality',
      'Configuration': 'Settings, environment variables, deployment configs',
      'Data': 'Data quality, schema issues, data flow problems',
      'Infrastructure': 'Hardware, network, cloud services, capacity',
      'External': 'Third-party APIs, external services, integrations'
    }
    return descriptions[category as keyof typeof descriptions] || ''
  }

  validateStructure(project: DrillerProject): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const ishikawaNodes = project.nodes.filter(n => n.meta.mode === 'ishikawa')
    const categories = ishikawaNodes.filter(n => n.type === 'category')
    
    if (categories.length === 0) {
      errors.push('Ishikawa diagram should have category nodes')
    }
    
    return { isValid: errors.length === 0, errors }
  }
}

export class FirstPrinciplesMode implements ModeStrategy {
  name = 'First Principles'
  description = 'Break down to fundamental assumptions and rebuild understanding'
  suggestedNodeTypes = ['hypothesis', 'evidence', 'conclusion']
  defaultLayout = 'force' as const

  generateInitialStructure(_rootNode: MapNode): { nodes: MapNode[]; edges: MapEdge[] } {
    return { nodes: [], edges: [] }
  }

  validateStructure(_project: DrillerProject): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    // First principles validation logic would go here
    return { isValid: errors.length === 0, errors }
  }
}

export class ConceptMapMode implements ModeStrategy {
  name = 'Concept Map'
  description = 'Visual representation of relationships between key concepts'
  suggestedNodeTypes = ['evidence', 'hypothesis', 'conclusion']
  defaultLayout = 'force' as const

  generateInitialStructure(_rootNode: MapNode): { nodes: MapNode[]; edges: MapEdge[] } {
    return { nodes: [], edges: [] }
  }

  validateStructure(_project: DrillerProject): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    // Concept map validation logic would go here
    return { isValid: errors.length === 0, errors }
  }
}

export class SystemsMode implements ModeStrategy {
  name = 'Systems Thinking'
  description = 'Analyze feedback loops, delays, and systemic patterns'
  suggestedNodeTypes = ['evidence', 'hypothesis', 'cause']
  defaultLayout = 'force' as const

  generateInitialStructure(_rootNode: MapNode): { nodes: MapNode[]; edges: MapEdge[] } {
    return { nodes: [], edges: [] }
  }

  validateStructure(_project: DrillerProject): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    // Systems thinking validation logic would go here
    return { isValid: errors.length === 0, errors }
  }
}

// Mode registry
const modes: Record<ModeType, ModeStrategy> = {
  '5whys': new FiveWhysMode(),
  'issue-tree': new IssueTreeMode(),
  'ishikawa': new IshikawaMode(),
  'first-principles': new FirstPrinciplesMode(),
  'concept-map': new ConceptMapMode(),
  'systems': new SystemsMode(),
}

export function getMode(type: ModeType): ModeStrategy {
  return modes[type]
}

export function getAllModes(): Record<ModeType, ModeStrategy> {
  return modes
}

export function suggestMode(inputType: string): ModeType {
  switch (inputType) {
    case 'error':
    case 'log':
      return '5whys' // Start with why-based analysis for errors
    case 'business':
      return 'issue-tree' // Use structured breakdown for business issues
    case 'code':
      return 'ishikawa' // Use categorical analysis for code issues
    default:
      return 'concept-map' // General-purpose for broad topics
  }
}