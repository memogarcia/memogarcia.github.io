import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { useProjectStore } from '@/state/projectStore'
import { aiProvider } from '@/ai'

interface ChatMessage {
  id: string
  type: 'ai' | 'user'
  content: string
  timestamp: Date
}

export function AIChat() {
  const { 
    currentProject, 
    currentMode, 
    addNode, 
    addEdge,
    selectedNodeId,
    setError 
  } = useProjectStore()
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize with AI greeting when project and mode are set
  useEffect(() => {
    if (currentProject && currentMode && messages.length === 0) {
      const greeting = `I'm here to help you analyze "${currentProject.name}" using ${currentMode} methodology. Let's start by understanding the context better. What specific details can you share about this issue?`
      
      setMessages([{
        id: crypto.randomUUID(),
        type: 'ai',
        content: greeting,
        timestamp: new Date()
      }])
    }
  }, [currentProject, currentMode, messages.length])

  const addMessage = (type: 'ai' | 'user', content: string) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      type,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
    return message
  }

  const handleSendMessage = async () => {
    if (!input.trim() || !currentProject || !currentMode) return

    const userMessage = addMessage('user', input.trim())
    setInput('')
    setIsLoading(true)

    try {
      // Get AI response
      const lastNodes = currentProject.nodes.slice(-10) // Last 10 nodes for context
      const aiResponse = await aiProvider.askQuestion({
        project: currentProject,
        mode: currentMode,
        lastNodes
      })

      addMessage('ai', aiResponse)

      // Create nodes based on user's answer
      const questionNode = currentProject.nodes.find(n => n.id === selectedNodeId)
      const contextWithNode = questionNode ? 
        { project: currentProject, mode: currentMode, questionNode } :
        { project: currentProject, mode: currentMode }
      
      const { nodes: newNodes, edges: newEdges } = await aiProvider.createNodes(
        userMessage.content,
        contextWithNode
      )

      // Add nodes and edges to project
      newNodes.forEach(node => {
        addNode({
          type: node.type,
          title: node.title,
          body: node.body || '',
          attachments: node.attachments || [],
          position: node.position,
          meta: node.meta
        })
      })

      newEdges.forEach(edge => {
        addEdge({
          from: edge.from,
          to: edge.to,
          label: edge.label || '',
          meta: edge.meta || {}
        })
      })

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get AI response')
      addMessage('ai', 'I apologize, but I encountered an error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendToCanvas = async () => {
    if (!input.trim() || !currentProject || !currentMode) return

    try {
      // Create a note/evidence node from the input
      const nodeId = addNode({
        type: 'evidence',
        title: 'User Input',
        body: input.trim(),
        attachments: [],
        position: { 
          x: Math.random() * 400 - 200, 
          y: Math.random() * 400 - 200 
        },
        meta: { mode: currentMode }
      })

      // Connect to root or selected node
      const targetNodeId = selectedNodeId || currentProject.rootNodeId
      addEdge({
        from: targetNodeId,
        to: nodeId,
        label: 'evidence'
      })

      setInput('')
      addMessage('ai', 'I\'ve added your input to the canvas as an evidence node.')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add to canvas')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!currentProject || !currentMode) {
    return (
      <div className="h-16 border-t border-gray-200 bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">
          Select a project and analysis mode to start the AI guidance
        </p>
      </div>
    )
  }

  return (
    <div className={`border-t border-gray-200 bg-white transition-all duration-200 ${
      isExpanded ? 'h-96' : 'h-16'
    }`}>
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900">AI Guide</h3>
          <span className="text-sm text-gray-500">({currentMode} mode)</span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {/* Chat Interface */}
      {isExpanded && (
        <div className="h-80 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe what you know, paste logs, or ask questions..."
                className="flex-1"
                rows={2}
              />
              <div className="flex flex-col gap-1">
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  size="sm"
                >
                  Send
                </Button>
                <Button
                  onClick={handleSendToCanvas}
                  disabled={!input.trim()}
                  variant="outline"
                  size="sm"
                >
                  Add to Canvas
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}