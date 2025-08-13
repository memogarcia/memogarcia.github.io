import type { AIProvider, DrillerProject, MapNode, MapEdge, ModeType } from '@/types'
import { generateId, getCurrentTimestamp } from '@/utils'

interface MockQuestion {
  question: string
  nodeTitle: string
  nodeBody?: string
  edgeLabel?: string
}

interface MockModeData {
  questions: MockQuestion[]
  synthesis: string
}

const mockData: Record<ModeType, MockModeData> = {
  '5whys': {
    questions: [
      {
        question: "What specifically happened or went wrong?",
        nodeTitle: "Initial Problem",
        nodeBody: "The specific issue or symptom that was observed",
        edgeLabel: "describes"
      },
      {
        question: "Why did this problem occur?",
        nodeTitle: "First Why",
        nodeBody: "The immediate cause of the problem",
        edgeLabel: "because"
      },
      {
        question: "Why did that cause happen?",
        nodeTitle: "Second Why", 
        nodeBody: "The underlying cause behind the immediate cause",
        edgeLabel: "because"
      },
      {
        question: "What's the deeper reason for that?",
        nodeTitle: "Third Why",
        nodeBody: "Going deeper into the root cause",
        edgeLabel: "because"
      },
      {
        question: "Why does that fundamental issue exist?",
        nodeTitle: "Fourth Why",
        nodeBody: "Getting closer to the true root cause",
        edgeLabel: "because"
      }
    ],
    synthesis: `# Root Cause Analysis Summary

## Problem
Based on our 5 Whys analysis, we've identified the core issue.

## Method Used
5 Whys technique - systematically asking "why" to drill down to root causes.

## Key Evidence
- Initial problem symptoms
- Chain of causation through 5 levels
- Root cause identification

## Root Cause
The fundamental issue appears to be at the system/process level.

## Next Steps
1. Validate the root cause with additional evidence
2. Develop corrective actions
3. Implement preventive measures`
  },

  'issue-tree': {
    questions: [
      {
        question: "What are the main categories this issue could fall into?",
        nodeTitle: "Problem Categories",
        nodeBody: "High-level categorization of potential causes",
        edgeLabel: "categorizes"
      },
      {
        question: "What specific causes exist within each category?",
        nodeTitle: "Specific Causes",
        nodeBody: "Detailed causes within each category",
        edgeLabel: "contains"
      },
      {
        question: "Which causes are most likely and why?",
        nodeTitle: "Priority Assessment",
        nodeBody: "Ranking and evaluation of likely causes",
        edgeLabel: "evaluates"
      }
    ],
    synthesis: `# Issue Tree Analysis Summary

## Problem
Systematic breakdown of the issue into mutually exclusive, collectively exhaustive (MECE) categories.

## Method Used
Issue Tree - hierarchical decomposition of problems into root causes.

## Key Evidence
- MECE categorization of potential causes
- Specific sub-causes within each category
- Priority ranking based on likelihood and impact

## Conclusions
The analysis reveals multiple contributing factors organized by category.

## Next Steps
1. Focus investigation on highest-priority causes
2. Gather additional evidence for top candidates
3. Develop targeted solutions`
  },

  'ishikawa': {
    questions: [
      {
        question: "What code-related factors might contribute to this issue?",
        nodeTitle: "Code Factors",
        nodeBody: "Bugs, logic errors, performance issues",
        edgeLabel: "code cause"
      },
      {
        question: "What configuration issues could be involved?",
        nodeTitle: "Configuration Factors",
        nodeBody: "Settings, environment variables, deployment configs",
        edgeLabel: "config cause"
      },
      {
        question: "What data-related problems might exist?",
        nodeTitle: "Data Factors",
        nodeBody: "Data quality, schema issues, data flow problems",
        edgeLabel: "data cause"
      },
      {
        question: "What infrastructure issues could contribute?",
        nodeTitle: "Infrastructure Factors", 
        nodeBody: "Hardware, network, cloud services, capacity",
        edgeLabel: "infra cause"
      },
      {
        question: "What external dependencies might be problematic?",
        nodeTitle: "External Factors",
        nodeBody: "Third-party APIs, external services, integrations",
        edgeLabel: "external cause"
      }
    ],
    synthesis: `# Ishikawa (Fishbone) Analysis Summary

## Problem
Systematic analysis across key categories: Code, Configuration, Data, Infrastructure, and External factors.

## Method Used
Ishikawa Diagram - categorical analysis of potential root causes.

## Key Evidence
- Code-related contributing factors
- Configuration and deployment issues
- Data quality and flow problems
- Infrastructure limitations
- External dependency issues

## Root Cause Analysis
Multiple categories show contributing factors that need investigation.

## Next Steps
1. Prioritize categories based on evidence strength
2. Deep dive into most promising categories
3. Implement monitoring for identified factors`
  },

  'first-principles': {
    questions: [
      {
        question: "What fundamental assumptions are we making about this problem?",
        nodeTitle: "Core Assumptions",
        nodeBody: "Basic beliefs and assumptions underlying the problem",
        edgeLabel: "assumes"
      },
      {
        question: "What are the most basic, undeniable facts about this situation?",
        nodeTitle: "Fundamental Facts",
        nodeBody: "Objective, verifiable facts that cannot be disputed",
        edgeLabel: "fact"
      },
      {
        question: "If we built a solution from scratch, ignoring existing constraints, what would it look like?",
        nodeTitle: "Clean Slate Solution",
        nodeBody: "Ideal solution without legacy constraints",
        edgeLabel: "leads to"
      }
    ],
    synthesis: `# First Principles Analysis Summary

## Problem
Deconstructed the problem to fundamental assumptions and facts.

## Method Used
First Principles Thinking - breaking down to basic truths and rebuilding understanding.

## Key Evidence
- Core assumptions identified and challenged
- Fundamental facts established
- Clean slate solution designed

## Insights
By removing assumptions, we can see new approaches to the problem.

## Next Steps
1. Validate fundamental facts
2. Challenge remaining assumptions
3. Design solution based on first principles`
  },

  'concept-map': {
    questions: [
      {
        question: "What are the key concepts or components involved in this problem?",
        nodeTitle: "Key Concepts",
        nodeBody: "Main ideas, components, or entities",
        edgeLabel: "relates to"
      },
      {
        question: "How do these concepts connect and influence each other?",
        nodeTitle: "Relationships",
        nodeBody: "Connections and influences between concepts",
        edgeLabel: "influences"
      },
      {
        question: "What are the most critical relationships that affect the outcome?",
        nodeTitle: "Critical Connections",
        nodeBody: "Key relationships that drive the problem or solution",
        edgeLabel: "drives"
      }
    ],
    synthesis: `# Concept Map Analysis Summary

## Problem
Mapped relationships between key concepts and their interactions.

## Method Used
Concept Mapping - visual representation of relationships between ideas.

## Key Evidence
- Key concepts identified
- Relationship patterns mapped
- Critical connections highlighted

## Understanding
The problem emerges from complex interactions between multiple concepts.

## Next Steps
1. Strengthen understanding of critical relationships
2. Test relationship hypotheses
3. Design interventions at key connection points`
  },

  'systems': {
    questions: [
      {
        question: "What reinforcing loops might be amplifying this problem?",
        nodeTitle: "Reinforcing Loops",
        nodeBody: "Feedback loops that make the problem worse over time",
        edgeLabel: "reinforces (R)"
      },
      {
        question: "What balancing loops exist that might be trying to correct the problem?",
        nodeTitle: "Balancing Loops",
        nodeBody: "Natural corrective mechanisms in the system",
        edgeLabel: "balances (B)"
      },
      {
        question: "What delays exist in the system that obscure cause and effect?",
        nodeTitle: "System Delays",
        nodeBody: "Time lags between actions and consequences",
        edgeLabel: "delays"
      }
    ],
    synthesis: `# Systems Thinking Analysis Summary

## Problem
Analyzed systemic patterns, feedback loops, and delays.

## Method Used
Systems Thinking - understanding patterns and structures that drive behavior.

## Key Evidence
- Reinforcing loops identified
- Balancing mechanisms mapped
- System delays documented

## Systems Insights
The problem is maintained by underlying system structures and feedback loops.

## Next Steps
1. Intervene in reinforcing loops
2. Strengthen balancing mechanisms
3. Address system delays and communication gaps`
  }
}

export class MockAIProvider implements AIProvider {
  private questionIndex = new Map<string, number>()

  async askQuestion(context: {
    project: DrillerProject
    mode: ModeType
    lastNodes: MapNode[]
  }): Promise<string> {
    const { project, mode } = context
    const projectKey = `${project.id}-${mode}`
    const currentIndex = this.questionIndex.get(projectKey) || 0
    
    const modeData = mockData[mode]
    if (currentIndex >= modeData.questions.length) {
      return "Based on our analysis, I think we have enough information to synthesize our findings. Would you like me to generate a summary?"
    }

    const question = modeData.questions[currentIndex]!.question
    this.questionIndex.set(projectKey, currentIndex + 1)
    
    return question
  }

  async createNodes(answer: string, context: {
    project: DrillerProject
    mode: ModeType
    questionNode?: MapNode
  }): Promise<{ nodes: MapNode[]; edges: MapEdge[] }> {
    const { project, mode, questionNode } = context
    const projectKey = `${project.id}-${mode}`
    const currentIndex = (this.questionIndex.get(projectKey) || 1) - 1
    
    const modeData = mockData[mode]
    const questionData = modeData.questions[currentIndex]
    
    if (!questionData) {
      return { nodes: [], edges: [] }
    }

    const now = getCurrentTimestamp()
    const nodeId = generateId()
    
    // Create answer node
    const answerNode: MapNode = {
      id: nodeId,
      type: 'answer',
      title: questionData.nodeTitle,
      body: answer,
      attachments: [],
      meta: {
        mode,
        createdAt: now,
        updatedAt: now,
      },
      position: {
        x: Math.random() * 400 - 200,
        y: Math.random() * 400 - 200,
      },
    }

    const nodes = [answerNode]
    const edges: MapEdge[] = []

    // Connect to previous node or root
    if (questionNode) {
      edges.push({
        id: generateId(),
        from: questionNode.id,
        to: nodeId,
        label: questionData.edgeLabel || 'leads to',
      })
    } else if (project.nodes.length > 0) {
      // Connect to root if no question node
      edges.push({
        id: generateId(),
        from: project.rootNodeId,
        to: nodeId,
        label: questionData.edgeLabel || 'explores',
      })
    }

    return { nodes, edges }
  }

  async generateSynthesis(project: DrillerProject): Promise<string> {
    // Determine the primary mode used in the project
    const modes = project.nodes
      .map(node => node.meta.mode)
      .filter((mode): mode is ModeType => mode !== undefined)
    
    const primaryMode = modes[0] || '5whys'
    const modeData = mockData[primaryMode]
    
    return modeData.synthesis
  }
}