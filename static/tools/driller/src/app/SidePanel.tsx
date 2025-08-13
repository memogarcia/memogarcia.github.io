import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useProjectStore } from '@/state/projectStore'
import type { NodeType } from '@/types'

export function SidePanel() {
  const { 
    currentProject, 
    selectedNodeId, 
    addNode, 
    updateNode, 
    deleteNode,
    selectNode 
  } = useProjectStore()
  
  const [showAddNode, setShowAddNode] = useState(false)
  const [newNodeTitle, setNewNodeTitle] = useState('')
  const [newNodeBody, setNewNodeBody] = useState('')
  const [newNodeType, setNewNodeType] = useState<NodeType>('evidence')
  const [searchQuery, setSearchQuery] = useState('')

  const selectedNode = currentProject?.nodes.find(n => n.id === selectedNodeId)
  const filteredNodes = currentProject?.nodes.filter(node =>
    node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (node.body?.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || []

  const handleAddNode = () => {
    if (!newNodeTitle.trim()) return

    const nodeId = addNode({
      type: newNodeType,
      title: newNodeTitle.trim(),
      body: newNodeBody.trim(),
      attachments: [],
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      meta: {}
    })

    selectNode(nodeId)
    setShowAddNode(false)
    setNewNodeTitle('')
    setNewNodeBody('')
    setNewNodeType('evidence')
  }

  const handleDeleteNode = () => {
    if (selectedNodeId && selectedNode?.type !== 'root') {
      deleteNode(selectedNodeId)
    }
  }

  const nodeTypes: NodeType[] = [
    'question', 'answer', 'evidence', 'hypothesis', 
    'cause', 'category', 'conclusion'
  ]

  if (!currentProject) {
    return (
      <div className="w-80 border-r border-gray-200 bg-gray-50 p-4">
        <div className="text-center text-gray-500">
          <p>No project loaded</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-3">Project Explorer</h2>
        
        {/* Search */}
        <Input
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-3"
        />
        
        {/* Add Node Button */}
        <Button
          onClick={() => setShowAddNode(!showAddNode)}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {showAddNode ? 'Cancel' : 'Add Node'}
        </Button>
      </div>

      {/* Add Node Form */}
      {showAddNode && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={newNodeType}
                onChange={(e) => setNewNodeType(e.target.value as NodeType)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {nodeTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <Input
                value={newNodeTitle}
                onChange={(e) => setNewNodeTitle(e.target.value)}
                placeholder="Node title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Details
              </label>
              <Textarea
                value={newNodeBody}
                onChange={(e) => setNewNodeBody(e.target.value)}
                placeholder="Additional details..."
                rows={3}
              />
            </div>
            
            <Button onClick={handleAddNode} size="sm" className="w-full">
              Create Node
            </Button>
          </div>
        </div>
      )}

      {/* Node List */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="font-medium text-gray-900 mb-3">
          Nodes ({filteredNodes.length})
        </h3>
        
        <div className="space-y-2">
          {filteredNodes.map(node => (
            <div
              key={node.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedNodeId === node.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => selectNode(node.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    {node.type}
                  </div>
                  <div className="font-medium text-gray-900 text-sm mb-1 truncate">
                    {node.title}
                  </div>
                  {node.body && (
                    <div className="text-xs text-gray-600 line-clamp-2">
                      {node.body}
                    </div>
                  )}
                </div>
              </div>
              
              {node.attachments && node.attachments.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  📎 {node.attachments.length}
                </div>
              )}
            </div>
          ))}
          
          {filteredNodes.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              {searchQuery ? 'No matching nodes' : 'No nodes yet'}
            </div>
          )}
        </div>
      </div>

      {/* Selected Node Inspector */}
      {selectedNode && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Node Details</h3>
            {selectedNode.type !== 'root' && (
              <Button
                onClick={handleDeleteNode}
                variant="destructive"
                size="sm"
              >
                Delete
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <Input
                value={selectedNode.title}
                onChange={(e) => updateNode(selectedNodeId!, { title: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body
              </label>
              <Textarea
                value={selectedNode.body || ''}
                onChange={(e) => updateNode(selectedNodeId!, { body: e.target.value })}
                rows={4}
              />
            </div>
            
            <div className="text-xs text-gray-500">
              Created: {new Date(selectedNode.meta.createdAt).toLocaleDateString()}
              <br />
              Updated: {new Date(selectedNode.meta.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}